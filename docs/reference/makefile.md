---
owner: miketak
last_reviewed: 2026-10-02
---

# Makefile

Every day-to-day command has a target in the `Makefile` at the repository
root. `make help` prints this list from the file itself; a bare `make`
does the same.

| Target | Does | Needs |
| --- | --- | --- |
| `help` | Lists every target with its description. | |
| `dev-up` | Starts Postgres, the backend and the frontend (which compiles and serves the help at `/help`) in tmux: a `dev-console` window inside an existing session, or a `carbonos` session outside one. | Docker, tmux, Java 25, Node 22 |
| `dev-down` | Closes the panes `dev-up` opened and stops the containers. | tmux |
| `db-up` | Starts the compose services: Postgres on 5433, MinIO on 9000 and 9001, Mailpit on 1025 and 8025. | Docker |
| `db-down` | Stops the compose services and keeps their data. | Docker |
| `db-reset` | Drops the compose volumes and starts the services again; the next backend start replays every migration. | Docker |
| `db-wipe ENV=<env> [ARGS=...]` | Wipes a Railway environment's database over `railway ssh` and redeploys the backend. `ARGS=--yes` skips the staging prompt; production needs `ARGS=--yes-production` and a typed confirmation. | Railway CLI, a registered SSH key |
| `env-copy FROM=<env> TO=<env>` | Copies one Railway environment's database and bucket into another over `railway ssh`, for example staging into qa. Production is never a target. | Railway CLI, a registered SSH key, Docker |
| `purge-resumes ENV=<env> [ARGS=...]` | Deletes the retired resume objects (`users/<uuid>/resume`) from an environment's bucket, after the release is deployed there (spec 01.6). Lists what it would delete and stops; `ARGS=--yes` deletes, and production needs `ARGS=--yes-production` and a typed confirmation. `ENV=local` targets the compose MinIO. Keep the listing with the release record. | Docker; the Railway CLI for any environment but `local` |
| `backend` | Runs Spring Boot with the `local` profile. Sources SDKMAN first. | Java 25, the compose services |
| `frontend` | Runs the Vite dev server on 5173, proxying `/api` to 8080. | Node 22 |
| `admin EMAIL=<email> PASSWORD=<password> [NAME=<name>]` | Creates a local administrator, or resets the password of an existing one. | The backend running |
| `verify` | The full Definition of Done: `./mvnw verify`, then the frontend's lint, format check, tests and build, then `qa-lint`, `qa-compile-check` and `qa-export-check`. | Docker, Java 25, Node 22 |
| `docs` | Builds the docs site into `site/` with `--strict`; any warning fails. | uv |
| `docs-serve` | Serves the docs on http://127.0.0.1:8000 with live reload. | uv |
| `docs-check` | `docs`, then `qa-export-check` (the QA procedures match their YAML), then `vale`. The Definition of Done for a docs change. | uv, Node 22, Vale (optional) |
| `help-serve` | Runs the Vite dev server, which compiles the help from `help/docs` on change and serves it at http://localhost:5173/help (ADR 0006). The same as `frontend`, named for help authors. | Node 22 |
| `help-check` | The help compiler's checks (`cd frontend && npm run help:check`: every page in `help/tree.yaml`, links and anchors, word budgets, em-dashes, diagrams), then `vale`. The Definition of Done for a help change (ADR 0006). | Node 22, Vale (optional) |
| `vale [BASE=<ref>]` | Runs Vale on the Markdown changed against `BASE` (default `origin/main`), including untracked files. Skips when Vale is not installed. | Vale |
| `qa-docs` | Exports the QA procedures as DOCX under `build/qa-docs/`, with the persona's `fixtures/` folder beside them, ready to upload to the QA team's Drive folder. | uv, pandoc |

Targets that need an argument refuse to run without it and print their
usage. The Python environment for the docs targets is created under
`.venv/` on first use by `uv run --locked`, which also fails when
`uv.lock` is out of step with `pyproject.toml`.
| `qa-lint` | Checks the QA scenarios (`qa/packs/`): schema, ids, rules in the catalogue, specs under `covers`, every screen string of `surface.ts` in `frontend/src`, no em-dash (ADR 0007). | Node 22, `cd qa && npm ci` |
| `qa-export` / `qa-export-check` | Writes the procedure Markdown under `docs/qa/<persona>/` from the YAML, or fails when the committed files differ. | Node 22 |
| `qa-compile` / `qa-compile-check` | Writes the API and UI Playwright specs under `qa/generated/<persona>/` and `qa/schema/scenario.schema.json`, or fails when they differ. | Node 22 |
| `qa-rules` | Pulls the rule catalogue from the running local backend into `qa/src/vocabulary/rules/catalogue.json` (ADR 0008). | The backend on the `local` profile |
| `qa-doctor` | One line per thing a run needs: the backend and its seeded administrator, the `/api/qa` hooks and the catalogue hash, Mailpit, the frontend. | The local stack |
| `qa-reset` | Brings the local stack back to the migrations and the seeded administrator through `/api/qa/reset`, and empties Mailpit. | The local stack |
| `qa-run-api [QA_PROC=<n>]` / `qa-run-ui [QA_PROC=<n>]` | Runs the generated API or UI specs of one procedure (or the whole pack, in order) against the local stack. `QA_PERSONA` selects the pack (default `governance`). | The local stack, Playwright's Chromium |
| `qa-record QA_PROC=<n> DRIVER=api\|ui` | Writes the run record under `qa/runs/<persona>/` from the last run; refuses a FAIL, a SKIP, a stale YAML or a digest the other driver disagrees with. | A finished run |
