---
owner: miketak
last_reviewed: 2026-09-09
---

# Add a migration

Every schema change is a Flyway migration under
`backend/src/main/resources/db/migration`. Hibernate validates the schema
against the entities at startup and never creates or alters tables itself.
This guide adds one migration and proves it.

## Before you begin

- The change is described in a spec's **Data** section.
- Your local database is running: `make db-up`.

## Write the migration

1. Find the next version number:

    ```bash
    ls backend/src/main/resources/db/migration | sort -V | tail -1
    ```

    The output is the highest `V<N>__` file. Yours is `N + 1`.

2. Create `V<N+1>__short_description.sql`. The prefix is a capital `V`,
   the number, two underscores, then words joined by single underscores.
3. Write forward-only SQL. Add columns as nullable or with a default, then
   backfill, then tighten the constraint, so the migration works on staging
   and production data as well as on an empty database.
4. Match the Java types exactly. A Java `int` maps to `integer`, not
   `smallint`; a `BigDecimal` needs its precision and scale; an
   `Instant` is `timestamptz`.
5. Update the JPA entity to match.

## Prove it

1. Start the backend: `make backend`.

    Flyway logs `Migrating schema "public" to version "<N+1> - short
    description"` and Hibernate starts without a schema validation error.

2. Run the backend checks: `cd backend && ./mvnw verify`.

    The integration tests run every migration on an empty container
    database, so a migration that only works on top of existing rows shows
    up here.

3. When the migration rewrites existing data, replay it once on a copy of
   real rows before it deploys. CI runs migrations on an empty database
   only, so it cannot catch a data-dependent mistake.

    Copy the seeded local database inside the container, apply the
    migrations it has not seen in order, then the one you wrote:

    ```bash
    docker compose exec -T postgres createdb -U carbonos -T carbonos carbonos_replay
    docker compose exec -T postgres psql -U carbonos -d carbonos_replay -v ON_ERROR_STOP=1 \
        -f - < backend/src/main/resources/db/migration/V41__your_migration.sql
    ```

    Count the rows the migration touches before and after, and check every
    assertion the spec makes about what the rewrite must produce: the rows
    that survive, the foreign keys that were re-pointed, and the figures
    that must not move. Report the counts, not just that it ran. Then
    `docker compose exec -T postgres dropdb -U carbonos carbonos_replay`.

    `psql -f` runs each statement in its own transaction while Flyway wraps
    the whole file in one, so a temporary table declared `ON COMMIT DROP`
    disappears between statements on replay. Drop such a table explicitly
    at the end of the migration instead; it then behaves the same either
    way.

## Rules that never bend

- Never edit a migration that has been applied anywhere. Add a new one.
  Flyway checksums every applied file, and staging refuses to start when
  one changes.
- Keep `spring.jpa.hibernate.ddl-auto` at `validate`.
- One migration per pull request, unless the spec needs more.

## Start again locally

Run `make db-reset` to drop the local volumes and replay every migration
from V1. On Railway, `make db-wipe ENV=staging` does the same for the
staging database; see [Deploy and release](deploy-and-release.md).
