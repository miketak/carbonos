#!/usr/bin/env bash
#
# Wipe a Railway environment's database and rebuild it from the migrations.
# Usage:
#
#   scripts/wipe-railway-db.sh <environment> [--yes] [--yes-production]
#
#   --yes             skip the interactive prompt (non-production only)
#   --yes-production  required for the production environment, in addition to
#                     typing "production" at the prompt, which is never skipped
#
# The Railway Postgres services have no public proxy, so the script runs psql
# inside the Postgres container over `railway ssh`. It drops and recreates the
# public schema, then redeploys the backend: Flyway migrates from V1 and the
# startup seeder recreates the admin from CARBONOS_ADMIN_EMAIL and
# CARBONOS_ADMIN_PASSWORD. One-time setup: `railway login` and
# `railway ssh keys add -k ~/.ssh/id_ed25519.pub`.
set -euo pipefail

cd "$(dirname "$0")/.."

PROJECT=${RAILWAY_PROJECT_ID:-875cd2c4-3a3a-497a-aa26-309aafeafbf8}
DB_SERVICE=${DB_SERVICE:-Postgres}
BACKEND_SERVICE=${BACKEND_SERVICE:-backend}
HEALTH_TIMEOUT_SECONDS=300

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <environment> [--yes] [--yes-production]" >&2
  exit 1
fi

ENV=$1
shift
YES=false
YES_PRODUCTION=false
for arg in "$@"; do
  case "$arg" in
    --yes) YES=true ;;
    --yes-production) YES_PRODUCTION=true ;;
    *) echo "Unknown option: $arg" >&2; exit 1 ;;
  esac
done

# --- preflight --------------------------------------------------------------

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
  echo "Trusting ssh.railway.com (adding it to ~/.ssh/known_hosts)."
  mkdir -p ~/.ssh
  ssh-keyscan -T 10 ssh.railway.com >> ~/.ssh/known_hosts 2>/dev/null
fi

if [[ "$ENV" == "production" && "$YES_PRODUCTION" != true ]]; then
  echo "Refusing to wipe production without --yes-production." >&2
  exit 1
fi

# Runs a shell snippet inside the environment's Postgres container.
remote() {
  railway ssh -p "$PROJECT" -e "$ENV" -s "$DB_SERVICE" -- sh -c "$1" 2>/dev/null
}

# Runs one SQL statement inside the container and prints its result.
remote_sql() {
  remote "psql -U \"\$PGUSER\" -d \"\$PGDATABASE\" -v ON_ERROR_STOP=1 -Atc \"$1\""
}

# Counts, tolerant of a schema that is empty or half-migrated.
counts() {
  remote_sql "select coalesce((select count(*) from pg_tables where schemaname = current_schema()), 0)" | tail -1
}
summary() {
  local tables
  tables=$(counts)
  if [[ "${tables:-0}" -eq 0 ]]; then
    echo "tables=0 (empty schema)"
    return
  fi
  remote_sql "select 'migrations=' || (select count(*) from flyway_schema_history where success) || ' users=' || (select count(*) from users) || ' organizations=' || (select count(*) from ghg_organizations) || ' factors=' || (select count(*) from ghg_emission_factors)" | tail -1
}

# --- identity check -----------------------------------------------------------

actual=$(remote 'echo "$RAILWAY_ENVIRONMENT_NAME"' | tail -1 || true)
if [[ "$actual" != "$ENV" ]]; then
  echo "The Postgres container reports environment '${actual:-unknown}', not '$ENV'. Aborting." >&2
  exit 1
fi

echo "Environment '$ENV' of project $PROJECT currently holds: $(summary)"
echo "This drops and recreates the public schema, then redeploys '$BACKEND_SERVICE'."

if [[ "$ENV" == "production" || "$YES" != true ]]; then
  read -r -p "Type the environment name to continue: " typed </dev/tty
  if [[ "$typed" != "$ENV" ]]; then
    echo "Confirmation did not match. Nothing was changed." >&2
    exit 1
  fi
fi

# --- wipe ----------------------------------------------------------------------

remote_sql "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public" >/dev/null
echo "Schema dropped and recreated: $(summary)"

# --- rebuild -----------------------------------------------------------------

echo "Redeploying '$BACKEND_SERVICE' so Flyway migrates from V1 and the admin is seeded."
railway redeploy -p "$PROJECT" -e "$ENV" -s "$BACKEND_SERVICE" -y >/dev/null

domain=$(railway variables -s "$BACKEND_SERVICE" -e "$ENV" -k 2>/dev/null | grep '^RAILWAY_PUBLIC_DOMAIN=' | cut -d= -f2-)
if [[ -z "$domain" ]]; then
  echo "Could not read RAILWAY_PUBLIC_DOMAIN for '$BACKEND_SERVICE'; check the deploy in the Railway dashboard." >&2
  exit 1
fi

echo "Waiting for https://$domain/actuator/health (up to $((HEALTH_TIMEOUT_SECONDS / 60)) minutes)."
deadline=$((SECONDS + HEALTH_TIMEOUT_SECONDS))
until [[ "$(counts)" -gt 0 ]] && curl -sf -m 10 "https://$domain/actuator/health" 2>/dev/null | grep -q '"status":"UP"'; do
  if (( SECONDS >= deadline )); then
    echo "The backend did not report UP within the window. Railway keeps the previous container serving;" >&2
    echo "read the deploy logs for '$BACKEND_SERVICE' in environment '$ENV'." >&2
    exit 1
  fi
  sleep 10
done

echo "Environment '$ENV' rebuilt: $(summary)"
