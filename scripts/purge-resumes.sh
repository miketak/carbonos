#!/usr/bin/env bash
#
# Delete the retired resume objects from an environment's bucket (spec 01.6).
# Usage:
#
#   scripts/purge-resumes.sh <environment> [--yes] [--yes-production]
#
#   --yes             actually delete; without it the script only lists
#   --yes-production  required for the production environment, in addition to
#                     the typed confirmation
#
# The keys are deterministic: users/<uuid>/resume, written by the profile
# service that this release removes. The prefix is pinned to "users/" and the
# include pattern to "*/resume", so the command cannot reach users/<uuid>/avatar
# or anything under ghg/ (evidence, activity imports, factor pack documents).
# That matters: this is the bucket holding the evidence behind published
# inventories, and a bulk delete over it is a control a verifier asks about.
# So: dry run by default, an explicit --yes to act, and the printed listing is
# worth keeping with the release record.
#
# Run it AFTER the release is deployed in the environment, so no live session
# asks for a key that has gone. `local` targets the compose MinIO instead of
# Railway. One-time setup for a Railway environment: `railway login`, Docker
# running.
set -euo pipefail

cd "$(dirname "$0")/.."

PROJECT=${RAILWAY_PROJECT_ID:-875cd2c4-3a3a-497a-aa26-309aafeafbf8}
BACKEND_SERVICE=${BACKEND_SERVICE:-backend}
AWS_IMAGE=${AWS_IMAGE:-amazon/aws-cli:2.22.35}

PREFIX="users/"
INCLUDE="*/resume"

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
    *) echo "Unknown argument: $arg" >&2; exit 1 ;;
  esac
done

if [[ "$ENV" == "production" && "$YES_PRODUCTION" != true ]]; then
  echo "Refusing to purge production without --yes-production." >&2
  exit 1
fi

variable() {
  railway variables -p "$PROJECT" -e "$1" -s "$BACKEND_SERVICE" -k 2>/dev/null | grep "^$2=" | cut -d= -f2- || true
}

if [[ "$ENV" == "local" ]]; then
  # the compose MinIO, as application-local.yaml configures it
  # "-" not ":-": an unset variable takes the compose default, but one set to
  # empty stays empty and trips the guard below rather than silently widening
  endpoint=${STORAGE_ENDPOINT-http://localhost:9000}
  key=${STORAGE_ACCESS_KEY-carbonos}
  secret=${STORAGE_SECRET_KEY-carbonos-secret}
  bucket=${STORAGE_BUCKET-carbonos-media}
  region=${STORAGE_REGION-us-east-1}
else
  if ! railway whoami >/dev/null 2>&1; then
    echo "Not logged in to Railway. Run: railway login" >&2
    exit 1
  fi
  endpoint=$(variable "$ENV" STORAGE_ENDPOINT)
  key=$(variable "$ENV" STORAGE_ACCESS_KEY)
  secret=$(variable "$ENV" STORAGE_SECRET_KEY)
  bucket=$(variable "$ENV" STORAGE_BUCKET)
  region=$(variable "$ENV" STORAGE_REGION)
fi

# a truncated variable would turn the delete below into a recursive wipe of the
# evidence store, so refuse to run at all rather than guess
if [[ -z "$endpoint" || -z "$key" || -z "$secret" || -z "$bucket" ]]; then
  echo "STORAGE_* variables are missing for '$ENV'; refusing to run." >&2
  exit 1
fi
if [[ "$PREFIX" != "users/" ]]; then
  echo "The prefix is pinned to 'users/'; refusing to run." >&2
  exit 1
fi

aws_cli() {
  docker run --rm --user "$(id -u):$(id -g)" -e HOME=/tmp \
    -e AWS_ACCESS_KEY_ID="$key" -e AWS_SECRET_ACCESS_KEY="$secret" \
    -e AWS_DEFAULT_REGION="${region:-auto}" \
    --network host \
    "$AWS_IMAGE" "$@" --endpoint-url "$endpoint"
}

echo "Environment '$ENV', bucket '$bucket': listing s3://$bucket/$PREFIX matching '$INCLUDE'."
listing=$(aws_cli s3 rm "s3://$bucket/$PREFIX" --recursive --exclude "*" --include "$INCLUDE" --dryrun)
if [[ -z "$listing" ]]; then
  echo "Nothing to purge."
  exit 0
fi
echo "$listing"
count=$(printf '%s\n' "$listing" | grep -c '^(dryrun)' || true)
echo "$count object(s) match. Keep this listing with the release record."

if [[ "$YES" != true ]]; then
  echo
  echo "Dry run only. Re-run with --yes to delete."
  exit 0
fi

if [[ "$ENV" == "production" ]]; then
  read -r -p "Type the environment name to continue: " typed </dev/tty
  if [[ "$typed" != "$ENV" ]]; then
    echo "Aborted." >&2
    exit 1
  fi
fi

aws_cli s3 rm "s3://$bucket/$PREFIX" --recursive --exclude "*" --include "$INCLUDE"
echo "Purged $count resume object(s) from '$ENV'."
