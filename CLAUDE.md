# CarbonOS

Monorepo: Spring Boot modular monolith (`backend/`) + React SPA (`frontend/`),
deployed to Railway. Specs live in `specs/`.

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
2. **Implement against the spec.** If reality diverges from the spec, update
   the spec in the same PR.
3. **Verify before declaring done** (Definition of Done):
   - Backend: `./mvnw verify` passes (unit + context tests + ModularityTests).
   - Frontend: `npm run lint && npm run format:check && npm test && npm run build` pass.
   - New behavior has tests; bug fixes have a regression test.
   - Schema changes have a Flyway migration.
   - Spec status/index updated.

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
