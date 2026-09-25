#!/usr/bin/env bash
#
# Start the full CarbonOS dev environment in tmux:
#
#   ┌─────────────────────────────┐
#   │        backend (top)        │   Spring Boot, local profile
#   ├──────────────┬──────────────┤
#   │              │   frontend   │   Vite dev server
#   │   database   ├──────────────┤
#   │              │     help     │   end-user help (MkDocs on :8001)
#   └──────────────┴──────────────┘
#
# The help pane serves the site Vite proxies at /help/, so the app's Help
# link works locally. It needs uv; without it the pane says so and the rest
# of the environment runs as before.
#
# Inside tmux this creates a dedicated "dev-console" window in the
# current session with that layout and switches to it, so the dev
# environment stays out of your working window and can be controlled
# from outside it. Outside tmux it creates (or re-attaches to) a
# dedicated "carbonos" session instead. All dev panes are tagged with
# the @carbonos_dev pane option so `make dev-down` can tear down
# exactly those panes and nothing else.
set -euo pipefail

cd "$(dirname "$0")/.."

SESSION=carbonos
WINDOW=dev-console

command -v tmux >/dev/null || {
  echo "tmux is not installed (sudo apt install tmux)" >&2
  exit 1
}

start_in_panes() {
  local backend db frontend help
  backend=$1 db=$2 frontend=$3 help=$4
  for p in "$backend" "$db" "$frontend" "$help"; do
    tmux set-option -p -t "$p" @carbonos_dev 1
  done
  # database: Postgres in the foreground so its logs live here
  tmux send-keys -t "$db" 'docker compose up' C-m
  # backend: wait for Postgres to accept connections, then run Spring Boot
  tmux send-keys -t "$backend" \
    'echo "waiting for Postgres on :5433..."; until (echo > /dev/tcp/localhost/5433) 2>/dev/null; do sleep 1; done; make backend' C-m
  # frontend: Vite dev server (proxies /api to the backend once it is up)
  tmux send-keys -t "$frontend" 'make frontend' C-m
  # help: the end-user help site, proxied by Vite at /help/
  tmux send-keys -t "$help" \
    'if command -v uv >/dev/null; then make help-serve; else echo "uv is not installed: the help at /help/ is off (see docs/how-to/set-up-the-dev-environment.md)"; fi' C-m
  tmux select-pane -t "$backend"
}

if [ -n "${TMUX:-}" ]; then
  if tmux list-panes -a -F '#{@carbonos_dev}' 2>/dev/null | grep -qx 1; then
    echo "CarbonOS dev panes are already running (make dev-down to tear down)"
    exit 0
  fi
  if tmux has-session -t "$SESSION" 2>/dev/null; then
    echo "A '$SESSION' dev session already exists; view it with: tmux switch-client -t $SESSION"
    exit 0
  fi

  # New window in the current session; new-window switches to it.
  backend=$(tmux new-window -n "$WINDOW" -c "$PWD" -P -F '#{pane_id}')
  db=$(tmux split-window -v -l 50% -t "$backend" -c "$PWD" -P -F '#{pane_id}')
  frontend=$(tmux split-window -h -t "$db" -c "$PWD" -P -F '#{pane_id}')
  help=$(tmux split-window -v -t "$frontend" -c "$PWD" -P -F '#{pane_id}')
  start_in_panes "$backend" "$db" "$frontend" "$help"
  exit 0
fi

if ! tmux has-session -t "$SESSION" 2>/dev/null; then
  tmux new-session -d -s "$SESSION" -n "$WINDOW" -c "$PWD"
  tmux split-window -v -l 50% -t "$SESSION:$WINDOW" -c "$PWD"
  tmux split-window -h -t "$SESSION:$WINDOW.1" -c "$PWD"
  tmux split-window -v -t "$SESSION:$WINDOW.2" -c "$PWD"
  start_in_panes "$SESSION:$WINDOW.0" "$SESSION:$WINDOW.1" "$SESSION:$WINDOW.2" "$SESSION:$WINDOW.3"
fi

if [ ! -t 0 ]; then
  echo "Session '$SESSION' is running; attach with: tmux attach -t $SESSION"
else
  tmux attach-session -t "$SESSION"
fi
