---
owner: miketak
last_reviewed: 2026-10-02
---

# Run a QA procedure

The generated specs drive the local stack twice: through the API and
through the browser. On green, the run is recorded under `qa/runs/` and
committed with the procedure (ADR 0007).

## Before you begin

- The local stack: `make db-up`, the backend with the `local` profile and
  the seeded administrator (`CARBONOS_ADMIN_EMAIL=qa+admina@carbonos.test
  CARBONOS_ADMIN_PASSWORD=AdminA-pass-2026 make backend`), and the Vite dev
  server (`make frontend`). The local profile enables the QA hooks under
  `/api/qa` (ADR 0008).
- `cd qa && npm ci`. Playwright uses its own Chromium when installed
  (`npx playwright install chromium`), else the one under
  `PLAYWRIGHT_BROWSERS_PATH` or `/opt/pw-browsers/chromium`.
- `make qa-doctor` prints one line per dependency: the backend, the seeded
  administrator and the hooks, Mailpit, the frontend, and whether the
  committed rule catalogue matches the running backend.

## Run one procedure

1. The chain starts with a reset: procedure 1 (no `after`) resets the stack
   itself through `/api/qa/reset` and empties Mailpit. A later procedure
   refuses to run until the one it follows has run green on this stack
   (`qa/.state/<persona>.<driver>.json`), or set `QA_NO_RESET=1` to keep
   the current data.
2. `make qa-run-api QA_PROC=1`. One Playwright test per case, one
   `test.step` per step; the list reporter names the failing step and why.
3. `make qa-record QA_PROC=1 DRIVER=api`. It refuses on any FAIL or SKIP,
   on a YAML that changed since the script was generated, and on a digest
   that disagrees with the other driver's record for the same YAML.
4. `make qa-run-ui QA_PROC=1`, then `make qa-record QA_PROC=1 DRIVER=ui`.
   The UI driver runs one browser context per actor and, by default
   (`QA_CROSS_CHECK=1`), asks the API about every stored-state outcome too,
   so a failure reads "UI stale" (the API agrees with the scenario, the
   screen does not) or "backend".
5. Run one driver's chain at a time. Both drivers work on the same local
   stack, and procedure 1 resets it: a UI chain started while the API chain
   is between procedures wipes the data the API chain's next procedure
   expects, and the first sign-in fails with 401. Finish (or record) one
   chain before starting the other.

Each step ends PASS, FAIL, NA (the driver cannot observe the outcome) or
MANUAL (an `observe` sentence a human judges); the record counts them.
Evidence stays under `qa/out/` (gitignored): Playwright's report, traces
and screenshots on failure, and `qa/out/results/` with the per-step notes.

## Where the drivers find the stack

`QA_API_URL` (default `http://localhost:8080`), `QA_APP_URL`
(`http://localhost:5173`), `QA_MAILPIT_URL` (`http://localhost:8025`),
`QA_ADMIN_EMAIL` and `QA_ADMIN_PASSWORD` (default: the pack's seeded actor).

## Troubleshooting

- `the seeded administrator cannot sign in`: the backend was started
  without `CARBONOS_ADMIN_EMAIL` and `CARBONOS_ADMIN_PASSWORD`, or with
  other values than the pack's seeded actor; pass them or set
  `QA_ADMIN_EMAIL` and `QA_ADMIN_PASSWORD`.
- `/api/qa/reset answered 404`: the backend is not on the `local` profile,
  so `carbonos.qa.endpoints` is off.
- `refused by an unnamed rule`: the product refused with a message-only
  exception; name it in the module's `*Rules` class and `make qa-rules`.
- `CATALOGUE DIFFERS`: `make qa-rules`, then `make qa-export` to see what
  wording changed in the pack.
