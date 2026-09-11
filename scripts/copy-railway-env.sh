#!/usr/bin/env bash
#
# Copy one Railway environment's database and object storage into another,
# so a new environment (qa) starts where an existing one (staging) is.
# Usage:
#
#   scripts/copy-railway-env.sh <from-env> <to-env> [--yes]
#
#   --yes   skip the interactive prompt
#
# The Railway Postgres services have no public proxy, so the copy streams
# pg_dump out of the source container and psql into the target container
# over `railway ssh`; nothing restarts on either side. The target's public
# schema is dropped and restored from the source, so run it before the
# target's first deploy, or after `make db-wipe` on the target, so Flyway
# finds the schema at the version it expects. The bucket is copied through
# the AWS CLI container in two passes (download, then upload), because the
# two buckets have different keys. Production is never a target.
# One-time setup: `railway login`, `railway ssh keys add -k ~/.ssh/id_ed25519.pub`,
# Docker running.
set -euo pipefail

cd "$(dirname "$0")/.."

PROJECT=${RAILWAY_PROJECT_ID:-875cd2c4-3a3a-497a-aa26-309aafeafbf8}
DB_SERVICE=${DB_SERVICE:-Postgres}
BACKEND_SERVICE=${BACKEND_SERVICE:-backend}
AWS_IMAGE=${AWS_IMAGE:-amazon/aws-cli:2.22.35}

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <from-env> <to-env> [--yes]" >&2
  exit 1
fi
FROM=$1
TO=$2
YES=false
[[ "${3:-}" == "--yes" ]] && YES=true
if [[ "$FROM" == "$TO" ]]; then
  echo "Source and target are the same environment." >&2
  exit 1
fi
if [[ "$TO" == "production" ]]; then
  echo "Refusing to overwrite production." >&2
  exit 1
fi

if ! railway whoami >/dev/null 2>&1; then
  echo "Not logged in to Railway. Run: railway login" >&2
  exit 1
fi
if ! railway ssh keys list 2>/dev/null | grep -qi "SHA256:"; then
  echo "No SSH key is registered with Railway. Register one first:" >&2
  echo "  railway ssh keys add -k ~/.ssh/id_ed25519.pub -n $(hostname)" >&2
  exit 1
fi
if ! grep -qs "ssh.railway.com" ~/.ssh/known_hosts; then
  mkdir -p ~/.ssh
  ssh-keyscan -T 10 ssh.railway.com >> ~/.ssh/known_hosts 2>/dev/null
fi

# Runs a shell snippet inside an environment's Postgres container; stdin is passed through.
remote() {
  railway ssh -p "$PROJECT" -e "$1" -s "$DB_SERVICE" -- sh -c "$2" 2>/dev/null
}
# One SQL statement inside the container, result on the last line.
remote_sql() {
  remote "$1" "psql -U \"\$PGUSER\" -d \"\$PGDATABASE\" -v ON_ERROR_STOP=1 -Atc \"$2\"" </dev/null | tail -1
}
summary() {
  remote_sql "$1" "select 'migrations=' || (select count(*) from flyway_schema_history where success) || ' users=' || (select count(*) from users) || ' organizations=' || (select count(*) from ghg_organizations) || ' activities=' || (select count(*) from ghg_activities) || ' evidence=' || (select count(*) from ghg_evidence)" 2>/dev/null || echo "empty"
}
# One variable of one service in one environment, or empty.
variable() {
  railway variables -p "$PROJECT" -e "$1" -s "$2" -k 2>/dev/null | grep "^$3=" | cut -d= -f2- || true
}

for env in "$FROM" "$TO"; do
  actual=$(remote "$env" 'echo "$RAILWAY_ENVIRONMENT_NAME"' </dev/null | tail -1 || true)
  if [[ "$actual" != "$env" ]]; then
    echo "The Postgres container reports environment '${actual:-unknown}', not '$env'. Aborting." >&2
    exit 1
  fi
done

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

# --- database ----------------------------------------------------------------

echo "Source '$FROM' holds: $(summary "$FROM")"
echo "Target '$TO' holds:   $(summary "$TO") (its public schema is replaced)"
if [[ "$YES" != true ]]; then
  read -r -p "Type the target environment name to continue: " typed </dev/tty
  if [[ "$typed" != "$TO" ]]; then
    echo "Confirmation did not match. Nothing was changed." >&2
    exit 1
  fi
fi

echo "Dumping '$FROM'."
# a marker separates the CLI's own output from the dump
remote "$FROM" 'echo __DUMP__; pg_dump -U "$PGUSER" -d "$PGDATABASE" --no-owner --no-privileges' </dev/null \
  | sed -n '/^__DUMP__$/,$p' | tail -n +2 > "$work/db.sql"
if ! grep -q "^CREATE TABLE" "$work/db.sql"; then
  echo "The dump holds no tables; check the source environment." >&2
  exit 1
fi
echo "Dumped $(wc -c < "$work/db.sql") bytes. Restoring into '$TO'."
remote "$TO" 'psql -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 -q -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public"' </dev/null >/dev/null
remote "$TO" 'psql -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 -q' < "$work/db.sql" >/dev/null
echo "Target '$TO' now holds: $(summary "$TO")"

# --- object storage ---------------------------------------------------------------

bucket_sync() {
  local env=$1 direction=$2
  local endpoint key secret bucket region
  endpoint=$(variable "$env" "$BACKEND_SERVICE" STORAGE_ENDPOINT)
  key=$(variable "$env" "$BACKEND_SERVICE" STORAGE_ACCESS_KEY)
  secret=$(variable "$env" "$BACKEND_SERVICE" STORAGE_SECRET_KEY)
  bucket=$(variable "$env" "$BACKEND_SERVICE" STORAGE_BUCKET)
  region=$(variable "$env" "$BACKEND_SERVICE" STORAGE_REGION)
  if [[ -z "$endpoint" || -z "$key" || -z "$secret" || -z "$bucket" ]]; then
    echo "STORAGE_* variables are missing on '$BACKEND_SERVICE' in '$env'; skipping the bucket copy." >&2
    return 1
  fi
  mkdir -p "$work/bucket"
  local args=(--rm -v "$work/bucket:/bucket" -e AWS_ACCESS_KEY_ID="$key" -e AWS_SECRET_ACCESS_KEY="$secret" -e AWS_DEFAULT_REGION="${region:-auto}")
  if [[ "$direction" == down ]]; then
    docker run "${args[@]}" "$AWS_IMAGE" s3 sync "s3://$bucket" /bucket --endpoint-url "$endpoint" --no-progress
  else
    docker run "${args[@]}" "$AWS_IMAGE" s3 sync /bucket "s3://$bucket" --endpoint-url "$endpoint" --no-progress
  fi
}

if bucket_sync "$FROM" down; then
  echo "Downloaded $(find "$work/bucket" -type f | wc -l) objects from '$FROM'."
  bucket_sync "$TO" up && echo "Uploaded them into '$TO'."
fi

echo "Copied '$FROM' into '$TO'."
