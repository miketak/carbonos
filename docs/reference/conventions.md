---
owner: miketak
last_reviewed: 2026-09-09
---

# Conventions

The rules every change follows. `CLAUDE.md` at the repository root is the
enforced version of this page; when they differ, `CLAUDE.md` wins.

## Branches and commits

- Trunk-based. Short-lived branches, a pull request to `main`, a squash
  merge. Direct pushes to `main` are for the repository owner only.
- Branch names carry the commit type: `feat/`, `fix/`, `chore/`,
  `docs/`, `refactor/`, `test/`.
- Conventional commits: `type: subject` with the subject in sentence case
  and the imperative mood, then a body that says what changed and why.
- CI must be green before a merge. Never merge with a failing check, and
  never weaken a check to make one pass.
- Merge to `main` deploys staging; a `vX.Y.Z` tag deploys production.

## Versions

| Component | Version |
| --- | --- |
| Spring Boot | 4.1.x (starters carry the Boot 4 names, for example `spring-boot-starter-webmvc`) |
| Spring Modulith | 2.1.x |
| Java | 25 (Temurin, through SDKMAN) |
| PostgreSQL | 17 |
| React | 19 |
| Vite | 8 |
| Node | 22 |
| Python (docs only) | 3.12, managed by uv |

## Code

- Backend: one Spring Modulith module per business capability, public API
  in the root package, internals under `internal/`. Controllers speak
  DTOs. Errors are RFC 9457 problem details. Every schema change is a
  Flyway migration and `ddl-auto` stays `validate`.
- Frontend: feature-sliced, TanStack Query for server state, the `api()`
  wrapper for every call, TypeScript strict with no `any`. oxlint and
  Prettier are the arbiters of style; do not argue with them.
- Tests: new behavior has tests; a bug fix has a regression test.
  Integration tests use Testcontainers; frontend tests use vitest and
  Testing Library.

## Specs

- Non-trivial features start as a spec in `specs/`, copied from
  `specs/TEMPLATE.md` and added to the index. Nothing is implemented from
  a `Draft`.
- When the implementation diverges, the spec changes in the same pull
  request.

## Writing

- The [Google developer documentation style guide](https://developers.google.com/style),
  as distilled in [Contributing to docs](../contributing-to-docs.md).
- No em-dashes anywhere: prose, code comments, commit messages, UI copy.
  The only exception is text quoted verbatim.
- American spelling, to match the code.
