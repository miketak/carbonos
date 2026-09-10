---
owner: miketak
last_reviewed: 2026-09-09
---

# Makefile

Every day-to-day command has a target in the `Makefile` at the repository
root. `make help` prints this list from the file itself; a bare `make`
does the same.

| Target | Does | Needs |
| --- | --- | --- |
| `help` | Lists every target with its description. | |
| `dev-up` | Starts Postgres, the backend and the frontend in tmux: a `dev-console` window inside an existing session, or a `carbonos` session outside one. | Docker, tmux, Java 25, Node 22 |
| `dev-down` | Closes the panes `dev-up` opened and stops the containers. | tmux |
| `db-up` | Starts the compose services: Postgres on 5433, MinIO on 9000 and 9001, Mailpit on 1025 and 8025. | Docker |
| `db-down` | Stops the compose services and keeps their data. | Docker |
| `db-reset` | Drops the compose volumes and starts the services again; the next backend start replays every migration. | Docker |
| `db-wipe ENV=<env> [ARGS=...]` | Wipes a Railway environment's database over `railway ssh` and redeploys the backend. `ARGS=--yes` skips the staging prompt; production needs `ARGS=--yes-production` and a typed confirmation. | Railway CLI, a registered SSH key |
| `backend` | Runs Spring Boot with the `local` profile. Sources SDKMAN first. | Java 25, the compose services |
| `frontend` | Runs the Vite dev server on 5173, proxying `/api` to 8080. | Node 22 |
| `admin EMAIL=<email> PASSWORD=<password> [NAME=<name>]` | Creates a local administrator, or resets the password of an existing one. | The backend running |
| `verify` | The full Definition of Done: `./mvnw verify`, then the frontend's lint, format check, tests and build. | Docker, Java 25, Node 22 |
| `docs` | Builds the docs site into `site/` with `--strict`; any warning fails. | uv |
| `docs-serve` | Serves the docs on http://127.0.0.1:8000 with live reload. | uv |
| `docs-check` | `docs`, then `vale`. The Definition of Done for a docs change. | uv, Vale (optional) |
| `vale [BASE=<ref>]` | Runs Vale on the Markdown changed against `BASE` (default `origin/main`), including untracked files. Skips when Vale is not installed. | Vale |
| `qa-docs` | Exports the QA procedures as DOCX under `build/qa-docs/`, ready to upload to the QA team's Drive folder. | uv, pandoc |

Targets that need an argument refuse to run without it and print their
usage. The Python environment for the docs targets is created under
`.venv/` on first use by `uv run --locked`, which also fails when
`uv.lock` is out of step with `pyproject.toml`.
