#!/usr/bin/env bash
#
# Copy one Railway environment's database and object storage into another,
# so a new environment (qa) starts where an existing one (staging) is.
# Usage:
#
#   scripts/copy-railway-env.sh <from-env> <to-env>
#
# The database is copied over each environment's public TCP proxy: create a
# TCP proxy on both Postgres services first (Railway dashboard, service >
# Settings > Networking > TCP Proxy, or the Railway MCP `create-tcp-proxy`),
# which sets DATABASE_PUBLIC_URL on the service; remove the proxies afterwards.
# pg_dump and pg_restore run in a postgres:17 container so the client matches
# the server. The bucket is copied through the AWS CLI container in two passes
# (download, then upload), because the two buckets have different endpoints
# and keys. The target's schema is dropped and restored from the source, so run
# it before the target's first deploy or accept losing what the target holds.
# One-time setup: `railway login`; Docker running.
set -euo pipefail

cd "$(dirname "$0")/.."

PROJECT=${RAILWAY_PROJECT_ID:-875cd2c4-3a3a-497a-aa26-309aafeafbf8}
DB_SERVICE=${DB_SERVICE:-Postgres}
BACKEND_SERVICE=${BACKEND_SERVICE:-backend}
PG_IMAGE=${PG_IMAGE:-postgres:17-alpine}
AWS_IMAGE=${AWS_IMAGE:-amazon/aws-cli:2.22.35}

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <from-env> <to-env>" >&2
  exit 1
fi
FROM=$1
TO=$2
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

# One variable of one service in one environment, or empty.
variable() {
  railway variables -p "$PROJECT" -e "$1" -s "$2" -k 2>/dev/null | grep "^$3=" | cut -d= -f2- || true
}

from_db=$(variable "$FROM" "$DB_SERVICE" DATABASE_PUBLIC_URL)
to_db=$(variable "$TO" "$DB_SERVICE" DATABASE_PUBLIC_URL)
if [[ -z "$from_db" || -z "$to_db" ]]; then
  echo "DATABASE_PUBLIC_URL is missing on '$DB_SERVICE' in '$FROM' or '$TO'. Create a TCP proxy on both Postgres services first." >&2
  exit 1
fi

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

# --- database ----------------------------------------------------------------

echo "Dumping '$FROM' database."
docker run --rm -v "$work:/work" "$PG_IMAGE" pg_dump --format=custom --no-owner --no-privileges \
  --file=/work/db.dump "$from_db"
echo "Restoring into '$TO' database (its public schema is dropped first)."
docker run --rm -v "$work:/work" "$PG_IMAGE" psql -v ON_ERROR_STOP=1 -q "$to_db" \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public"
docker run --rm -v "$work:/work" "$PG_IMAGE" pg_restore --no-owner --no-privileges --exit-on-error \
  --dbname="$to_db" /work/db.dump
docker run --rm "$PG_IMAGE" psql -Atq "$to_db" -c \
  "select 'migrations=' || (select count(*) from flyway_schema_history where success) || ' users=' || (select count(*) from users) || ' organizations=' || (select count(*) from ghg_organizations) || ' activities=' || (select count(*) from ghg_activities) || ' evidence=' || (select count(*) from ghg_evidence)"

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
  if [[ "$direction" == down ]]; then
    docker run --rm -v "$work/bucket:/bucket" -e AWS_ACCESS_KEY_ID="$key" -e AWS_SECRET_ACCESS_KEY="$secret" \
      -e AWS_DEFAULT_REGION="${region:-auto}" "$AWS_IMAGE" s3 sync "s3://$bucket" /bucket --endpoint-url "$endpoint" --no-progress
  else
    docker run --rm -v "$work/bucket:/bucket" -e AWS_ACCESS_KEY_ID="$key" -e AWS_SECRET_ACCESS_KEY="$secret" \
      -e AWS_DEFAULT_REGION="${region:-auto}" "$AWS_IMAGE" s3 sync /bucket "s3://$bucket" --endpoint-url "$endpoint" --no-progress
  fi
}

if bucket_sync "$FROM" down; then
  echo "Downloaded $(find "$work/bucket" -type f | wc -l) objects from '$FROM'."
  bucket_sync "$TO" up && echo "Uploaded them into '$TO'."
fi

echo "Copied '$FROM' into '$TO'. Remove the TCP proxies when you no longer need them."
