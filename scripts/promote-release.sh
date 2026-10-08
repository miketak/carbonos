#!/usr/bin/env bash
# Promote a release candidate through the two approval gates.
#
#   scripts/promote-release.sh v0.10.2-rc.1
#
# Waits for the QA run of the candidate to reach "QA sign-off (tags the
# release)", approves it, then waits for the Release run of the version it
# tags to reach "Deploy to Railway (production)", approves that, and waits
# for the run to finish. The checks themselves are left to the workflows:
# a failed job stops the script with the run URL. Needs gh signed in as a
# required reviewer of the qa-signoff and production environments.
set -euo pipefail

rc="${1:-}"
case "$rc" in
  v[0-9]*.[0-9]*.[0-9]*-rc.[0-9]*) ;;
  *) echo "Usage: $0 vX.Y.Z-rc.N" >&2; exit 1 ;;
esac
release="${rc%-rc.*}"
repo="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"

say() { printf '%s %s\n' "$(date -u +%H:%M:%S)" "$*"; }

# find_run <workflow file> <tag>: the newest run of that workflow on the tag
find_run() {
  gh run list --repo "$repo" --workflow "$1" --branch "$2" --limit 1 \
    --json databaseId --jq '.[0].databaseId // empty'
}

# wait_for_run <workflow file> <tag>: poll until the run exists
wait_for_run() {
  local id=""
  for _ in $(seq 1 60); do
    id="$(find_run "$1" "$2")"
    [ -n "$id" ] && { echo "$id"; return; }
    sleep 10
  done
  echo "No $1 run appeared for $2 in ten minutes." >&2
  exit 1
}

# wait_until_waiting <run id>: poll until the run waits on a review, or ends
wait_until_waiting() {
  local status conclusion
  while :; do
    read -r status conclusion < <(gh run view "$1" --repo "$repo" --json status,conclusion \
      --jq '"\(.status) \(.conclusion)"')
    case "$status" in
      waiting) return 0 ;;
      completed)
        [ "$conclusion" = success ] && return 0
        echo "Run $1 ended with $conclusion: https://github.com/$repo/actions/runs/$1" >&2
        exit 1 ;;
    esac
    sleep 20
  done
}

# approve <run id> <environment name> <comment>
approve() {
  local env_id
  env_id="$(gh api "repos/$repo/environments" --jq ".environments[] | select(.name==\"$2\") | .id")"
  gh api -X POST "repos/$repo/actions/runs/$1/pending_deployments" \
    --input - <<JSON >/dev/null
{"environment_ids":[$env_id],"state":"approved","comment":"$3"}
JSON
}

say "Looking for the QA run of $rc."
qa_run="$(wait_for_run qa.yml "$rc")"
say "QA run: https://github.com/$repo/actions/runs/$qa_run"
wait_until_waiting "$qa_run"
approve "$qa_run" qa-signoff "QA sign-off of $rc"
say "Approved the QA sign-off; the workflow tags $release and starts Release."
gh run watch "$qa_run" --repo "$repo" --exit-status >/dev/null

say "Looking for the Release run of $release."
release_run="$(wait_for_run release.yml "$release")"
say "Release run: https://github.com/$repo/actions/runs/$release_run"
wait_until_waiting "$release_run"
approve "$release_run" production "Release $release to production"
say "Approved the production deploy."
gh run watch "$release_run" --repo "$repo" --exit-status >/dev/null
say "$release is in production: https://github.com/$repo/actions/runs/$release_run"
