#!/usr/bin/env bash
#
# Create (or reset the password of) a CarbonOS admin user in the local
# docker-compose Postgres. Usage:
#
#   scripts/create-admin.sh <email> <password> [display-name]
#
# Upserts by email: an existing user becomes an ACTIVE ADMIN with the new
# password, so this doubles as a local password reset. Requires Docker only
# (bcrypt is computed with a throwaway httpd container, psql runs inside the
# compose Postgres).
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <email> <password> [display-name]" >&2
  exit 1
fi

EMAIL=$(echo "$1" | tr '[:upper:]' '[:lower:]' | xargs)
PASSWORD=$2
NAME=${3:-Admin}

if ! docker compose ps --status running postgres --quiet | grep -q .; then
  echo "Local Postgres is not running. Start it first: make db-up" >&2
  exit 1
fi

if ! docker compose exec -T postgres psql -U carbonos -d carbonos -tAc \
  "SELECT 1 FROM information_schema.tables WHERE table_name = 'users'" | grep -q 1; then
  echo "The 'users' table does not exist yet. Start the backend once so Flyway migrates: make backend" >&2
  exit 1
fi

# bcrypt via htpasswd; normalize the $2y$ prefix to $2a$ (same format, removes any doubt for Spring)
HASH=$(docker run --rm httpd:2.4-alpine htpasswd -nbBC 12 x "$PASSWORD" | cut -d: -f2 | sed -e 's/^\$2y\$/\$2a\$/' | tr -d '[:space:]')

docker compose exec -T postgres psql -U carbonos -d carbonos -v ON_ERROR_STOP=1 \
  -v email="$EMAIL" -v name="$NAME" -v hash="$HASH" <<'SQL'
INSERT INTO users (id, email, display_name, role, status, password_hash)
VALUES (gen_random_uuid(), :'email', :'name', 'ADMIN', 'ACTIVE', :'hash')
ON CONFLICT (email) DO UPDATE
  SET password_hash = EXCLUDED.password_hash,
      role          = 'ADMIN',
      status        = 'ACTIVE',
      updated_at    = now();
SQL

echo "Admin user '$EMAIL' is ready (created or password reset)."
