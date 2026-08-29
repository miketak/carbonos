#!/usr/bin/env bash
#
# Tear down the CarbonOS dev environment started by `make dev-up`:
# kill the dev panes tagged @carbonos_dev (in-tmux mode), kill the
# dedicated "carbonos" session if one exists, and stop Postgres.
set -uo pipefail

cd "$(dirname "$0")/.."

SESSION=carbonos

if command -v tmux >/dev/null && tmux list-sessions >/dev/null 2>&1; then
  while read -r pane_id tagged; do
    [ "$tagged" = "1" ] && tmux kill-pane -t "$pane_id"
  done < <(tmux list-panes -a -F '#{pane_id} #{@carbonos_dev}' 2>/dev/null)
  tmux kill-session -t "$SESSION" 2>/dev/null
fi

docker compose down
