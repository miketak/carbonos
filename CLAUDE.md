# CarbonOS

Monorepo: Spring Boot modular monolith (`backend/`) + React SPA (`frontend/`),
deployed to Railway. Specs live in `specs/`.

## Architecture rules (enforced)

**Backend — modular monolith via Spring Modulith.**

- Each business capability is one top-level package under `com.carbonos`
  (= one Spring Modulith module), e.g. `com.carbonos.contact`.
- A module's public API lives in its root package (or a `@NamedInterface`);
  implementation details go in `internal/` sub-packages. Other modules must
  never import another module's internals — `ModularityTests` fails the build
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

**Frontend — feature-sliced React.**

- `src/features/<name>/` mirrors backend modules; a feature owns its pages,
  components, and queries. `src/components/` is shared UI only; `src/lib/` is
  shared infrastructure (use the `api()` wrapper in `src/lib/api.ts` for all
  backend calls). `src/app/` wires routing and providers.
- Server state goes through TanStack Query; don't hand-roll fetch effects.
- TypeScript strict; no `any`.

## Workflow: spec → implement → verify

1. **Spec first.** Non-trivial features start as a spec in `specs/` (copy
   `specs/TEMPLATE.md`, add it to the index in `specs/README.md`). Do not
   implement from a `Draft` spec — get it to `Approved` first.
2. **Implement against the spec.** If reality diverges from the spec, update
   the spec in the same PR.
3. **Verify before declaring done** (Definition of Done):
   - Backend: `./mvnw verify` passes (unit + context tests + ModularityTests).
   - Frontend: `npm run lint && npm run format:check && npm test && npm run build` pass.
   - New behavior has tests; bug fixes have a regression test.
   - Schema changes have a Flyway migration.
   - Spec status/index updated.

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
```

Java 25 (Temurin) is installed via SDKMAN; non-login shells may need
`source "$HOME/.sdkman/bin/sdkman-init.sh"` before `./mvnw` works.

Makefile shortcuts (repo root): `make dev-up` / `make dev-down` (whole dev
environment in a tmux session — backend on top, Postgres logs bottom-left,
Vite bottom-right), `make db-up`, `make backend`, `make frontend`,
`make verify` (full DoD), and `make admin EMAIL=.. PASSWORD=.. [NAME=..]` to
create or password-reset a local admin user. The backend also seeds an initial
admin at startup when `CARBONOS_ADMIN_EMAIL` and `CARBONOS_ADMIN_PASSWORD` are
set (idempotent; the canonical mechanism for Railway).

## Git & releases

- Trunk-based: short-lived branches → PR → `main`. Direct pushes to `main`
  are for the repo owner only; everything else goes through a PR so the
  staging workflow's checks run.
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
- Merge to `main` ⇒ auto-deploy to Railway **staging**.
- Tag `vX.Y.Z` ⇒ deploy to Railway **production** (gated by the GitHub
  `production` environment).
- CI must be green before merging; never merge with failing checks.

## Versions

Spring Boot 4.1.x / Spring Modulith 2.1.x / Java 25 / React 19 / Vite 8 /
Node 22 / PostgreSQL 17. Boot 4 renamed starters (`spring-boot-starter-webmvc`,
per-starter test artifacts) — don't "fix" them back to Boot 3 names.
