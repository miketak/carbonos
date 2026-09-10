---
owner: miketak
last_reviewed: 2026-09-09
---

# Run the checks

Every pull request must pass the Definition of Done from `CLAUDE.md`
before it merges. This guide runs the same checks locally, in the same
order as CI, and tells you what to do when one fails.

## Run everything

- Run `make verify` from the repository root.

    The backend half runs first, then the frontend half. The whole run takes
    several minutes; the backend's integration tests dominate.

## The backend half

```bash
cd backend && ./mvnw verify
```

This compiles, runs the unit tests, runs the integration tests against
containers, and runs `ModularityTests`, which fails the build when a
module imports another module's internals. Docker must be running.

| When it fails with | Do this |
| --- | --- |
| `ModularityTests` reports an illegal dependency | Move the call to the other module's public API, or publish an application event. Never weaken the test. |
| Hibernate reports a schema mismatch at startup | Your entity and your Flyway migration disagree. Fix the migration, or add a new one; `ddl-auto` stays `validate`. |
| A Testcontainers test cannot start | Check that Docker is running and has memory to spare. |
| One integration test fails | Run it alone: `./mvnw test -Dtest='GhgApiIntegrationTests#theTestName' -Dsurefire.failIfNoSpecifiedTests=false`. |

## The frontend half

```bash
cd frontend && npm run lint && npm run format:check && npm test && npm run build
```

| Step | Tool | When it fails |
| --- | --- | --- |
| `lint` | oxlint | Fix the reported rule; there is no auto-fix. |
| `format:check` | Prettier | Run `npm run format` and commit the result. |
| `test` | vitest | Run one file: `npx vitest run src/features/ghg/ActivityPage.test.tsx`. |
| `build` | TypeScript and Vite | The TypeScript error names the file and line; `strict` is on and `any` is not allowed. |

## The docs half

When a pull request touches `docs/` or `specs/`, run `make docs-check`.
It builds the site strictly, so a broken link or a page missing from the
nav fails, and then runs Vale on the Markdown you changed. See
[Contributing to docs](../contributing-to-docs.md).

## What CI runs

The same three halves run in GitHub Actions on every pull request to
`main`; see [CI](../reference/ci.md). A pull request cannot merge with a
failing check.
