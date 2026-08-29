#!/usr/bin/env bash
#
# Start the full CarbonOS dev environment in one tmux session:
#
#   ┌─────────────────────────────┐
#   │        backend (top)        │   Spring Boot, local profile
#   ├──────────────┬──────────────┤
#   │   database   │   frontend   │   Postgres logs | Vite dev server
#   └──────────────┴──────────────┘
#
# Re-running attaches to the existing session. Tear down with `make dev-down`.
set -euo pipefail

cd "$(dirname "$0")/.."

SESSION=carbonos

command -v tmux >/dev/null || {
  echo "tmux is not installed (sudo apt install tmux)" >&2
  exit 1
}

if ! tmux has-session -t "$SESSION" 2>/dev/null; then
  tmux new-session -d -s "$SESSION" -n dev -c "$PWD"
  tmux split-window -v -l 40% -t "$SESSION:dev" -c "$PWD"
  tmux split-window -h -t "$SESSION:dev.1" -c "$PWD"

  # bottom-left: Postgres in the foreground so its logs live here
  tmux send-keys -t "$SESSION:dev.1" 'docker compose up' C-m
  # top: wait for Postgres to accept connections, then run the backend
  tmux send-keys -t "$SESSION:dev.0" \
    'echo "waiting for Postgres on :5433..."; until (echo > /dev/tcp/localhost/5433) 2>/dev/null; do sleep 1; done; make backend' C-m
  # bottom-right: Vite dev server (proxies /api to the backend once it is up)
  tmux send-keys -t "$SESSION:dev.2" 'make frontend' C-m

  tmux select-pane -t "$SESSION:dev.0"
fi

if [ ! -t 0 ]; then
  echo "Session '$SESSION' is running; attach with: tmux attach -t $SESSION"
elif [ -n "${TMUX:-}" ]; then
  tmux switch-client -t "$SESSION"
else
  tmux attach-session -t "$SESSION"
fi
