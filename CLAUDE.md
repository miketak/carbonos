# CarbonOS

Monorepo: Spring Boot modular monolith (`backend/`) + React SPA (`frontend/`),
deployed to Railway. Specs live in `specs/`. QA procedures are scenarios in
`qa/` (ADR 0007), projected to the Markdown under `docs/qa/`.

## Architecture rules (enforced)

**Backend: modular monolith via Spring Modulith.**

- Each business capability is one top-level package under `com.carbonos`
  (= one Spring Modulith module), for example `com.carbonos.contact`.
- A module's public API lives in its root package (or a `@NamedInterface`);
  implementation details go in `internal/` sub-packages. Other modules must
  never import another module's internals; `ModularityTests` fails the build
  if they do. Never weaken or delete that test to make a build pass.
- Cross-module communication prefers **application events**
  (`ApplicationEventPublisher` + `@ApplicationModuleListener`) over direct
  bean calls. Direct calls are allowed only against another module's public API.
- `com.carbonos.shared` is for cross-cutting infrastructure (web config, error
  handling). Business logic never lives there.
- Controllers speak DTOs (records), never JPA entities. Errors are RFC 9457
  problem details (`GlobalExceptionHandler` + `spring.mvc.problemdetails`).
- Every schema change is a Flyway migration in
  `backend/src/main/resources/db/migration`. Never edit an applied migration;
  add a new one. Hibernate `ddl-auto` stays `validate`.
- A refusal the product makes is a `Rule` (`shared/web/Rule.java`) declared
  in the module's `*Rules` class and thrown as a `RuleViolation`, so the
  problem detail carries a `rule` id the QA scenarios cite (ADR 0008). A
  new refusal gets a rule; a reworded one updates the catalogue
  (`make qa-rules`) and regenerates the pack (`make qa-export`) in the same PR.
  The `qa` module (`/api/qa/**`) exists only with `carbonos.qa.endpoints=true`.

**Frontend: feature-sliced React.**

- `src/features/<name>/` mirrors backend modules; a feature owns its pages,
  components, and queries. `src/components/` is shared UI only; `src/lib/` is
  shared infrastructure (use the `api()` wrapper in `src/lib/api.ts` for all
  backend calls). `src/app/` wires routing and providers.
- Server state goes through TanStack Query; don't hand-roll fetch effects.
- TypeScript strict; no `any`.

## Workflow: spec → implement → verify

1. **Spec first.** Non-trivial features start as a spec in `specs/` (copy
   `specs/TEMPLATE.md`, add it to the index in `specs/README.md`). Do not
   implement from a `Draft` spec; get it to `Approved` first.
2. **Reset the dev environment before implementing.** Run `make db-reset` at
   the start of the work, then `make admin EMAIL=.. PASSWORD=..` for an account
   to sign in with. It drops the compose volumes, so the object store goes with
   the database and the app comes back on the migrations alone. Local data
   accumulates roles, memberships, platform settings and uploaded objects from
   earlier sessions, and a stale row reads exactly like a bug in the new code:
   time goes into chasing a ghost, or a real defect hides behind data that
   happens to mask it. Starting clean means what you see is what a fresh
   deployment gets.
3. **Implement against the spec.** If reality diverges from the spec, update
   the spec in the same PR.
4. **Verify before declaring done** (Definition of Done):
   - Backend: `./mvnw verify` passes (unit + context tests + ModularityTests).
   - Frontend: `npm run lint && npm run format:check && npm test && npm run build` pass.
   - New behavior has tests; bug fixes have a regression test.
   - Schema changes have a Flyway migration.
   - Spec status/index updated.
   - QA scenarios: `make qa-lint qa-compile-check qa-export-check` pass. Edit
     the YAML under `qa/packs/`, never the generated Markdown, specs or
     records; a product string or flow a procedure relies on changes the
     scenario or the vocabulary (`qa/src/vocabulary/`) in the same PR.

## Documentation

Engineering docs live in `docs/` as a Material for MkDocs site organized by
Diátaxis: `tutorials/`, `how-to/`, `reference/`, `explanation/`, plus
`docs/adr/` for decision records. `specs/` and `docs/qa/` are part of the
site through symlinks and stay where they are. `docs/contributing-to-docs.md`
is the house style (Google developer documentation style, Mermaid diagrams
with `accTitle` and `accDescr`, front matter `owner` and `last_reviewed`).

- `make docs-serve` serves the site with live reload; `make docs` builds it
  strictly; `make docs-check` is the Definition of Done for a docs change.
- A new page, spec, or QA procedure must be added to `nav` in `mkdocs.yml`,
  or the strict build fails.
- When a change alters how engineers build, run, verify, or ship the system,
  update the affected how-to or reference page in the same PR.
- Tooling and cross-cutting structure decisions get an ADR
  (`docs/adr/TEMPLATE.md`).
- End-user help is Markdown under `help/docs/`, compiled by
  `frontend/scripts/compile-help.mjs` into routes of the React app at
  `/help` (ADR 0006, spec 09). `help/tree.yaml` is the navigation: nine job
  groups, each article with its `slug`, `kind` and word budget, plus the
  `legacy` map of old URLs. Same house style; the help never links into
  `specs/` or `docs/`, and each page cites its specs and QA cases in an
  HTML comment under the front matter. The Vite dev server compiles it on
  change (`make help-serve`); `make help-check` is the Definition of Done
  (`npm run help:check`: every page in the tree, links and anchors, word
  budgets, em-dashes, screenshots, diagrams; then Vale). A new help page
  must be in `help/tree.yaml`, and its figures and quoted product strings
  come from the product, not from memory. When a product string or flow
  the help describes changes, update the help page in the same PR.

## Commands

```bash
docker compose up -d              # local Postgres (run from repo root)

cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
./mvnw verify                     # build + all tests (needs Docker for Testcontainers)

cd frontend
npm run dev                       # dev server on :5173, proxies /api -> :8080
npm test                          # vitest
npm run lint && npm run format    # oxlint + prettier
npm run build                     # type-check + production build

make docs-serve                   # engineering docs on :8000 (needs uv)
make docs-check                   # strict docs build + Vale

make qa-lint qa-export qa-compile # QA scenarios: check, then regenerate docs/qa and qa/generated
make qa-doctor                    # is the local stack ready for a driver run?
make qa-run-api QA_PROC=1         # drive procedure 1 through the API (qa-run-ui: through the browser)
make qa-record QA_PROC=1 DRIVER=api
```

Java 25 (Temurin) is installed via SDKMAN; non-login shells may need
`source "$HOME/.sdkman/bin/sdkman-init.sh"` before `./mvnw` works.

Makefile shortcuts (repo root): `make dev-up` / `make dev-down` (whole dev
environment in a tmux "dev-console" window, or a "carbonos" session when
outside tmux: backend on top, Postgres logs bottom-left, Vite bottom-right),
`make db-up`, `make db-reset` (drop the local volumes and start again),
`make backend`, `make frontend`, `make verify` (full DoD),
`make admin EMAIL=.. PASSWORD=.. [NAME=..]` to create or password-reset a
local admin user, and `make db-wipe ENV=staging` to wipe a Railway
environment's database and rebuild it from the migrations (production needs
`ARGS=--yes-production` and a typed confirmation). The backend also seeds an initial
admin at startup when `CARBONOS_ADMIN_EMAIL` and `CARBONOS_ADMIN_PASSWORD` are
set (idempotent; the canonical mechanism for Railway).

## Writing style

- **No em-dashes (`—`) in anything we write:** prose, specs, QA procedures,
  commit messages, PR descriptions, code comments, and UI copy. Use a colon,
  a semicolon, a comma, parentheses, or a full stop instead. En-dashes in
  numeric ranges (`2-3 hours`, `F1-F10`) are fine.
- The exception is text quoted verbatim from somewhere else, for example a product
  string a QA script tells a tester to look for. Don't silently alter a quote
  to satisfy the rule; quote the clause before the dash, or describe the rest.

## Git & releases

- Trunk-based: short-lived branches → PR → `main`. Direct pushes to `main`
  are for the repo owner only; everything else goes through a PR so the CI
  checks run. The ruleset requires the two check jobs and a PR to merge.
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
- Merge to `main` ⇒ CI only. Nothing deploys from `main`.
- Tag `vX.Y.Z-rc.N` ⇒ deploy to Railway **qa** (the testers' environment).
  Approving the `qa-signoff` job tags `vX.Y.Z` and starts the Release run.
- Tag `vX.Y.Z` ⇒ deploy to Railway **staging** (the rehearsal), then
  **production** after the approval on the GitHub `production` environment.
- CI must be green before merging; never merge with failing checks.

## Versions

Spring Boot 4.1.x / Spring Modulith 2.1.x / Java 25 / React 19 / Vite 8 /
Node 22 / PostgreSQL 17. Boot 4 renamed starters (`spring-boot-starter-webmvc`,
per-starter test artifacts), so don't "fix" them back to Boot 3 names.
