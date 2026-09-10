# CarbonOS backend

Spring Boot 4 modular monolith on Spring Modulith, Java 25, PostgreSQL 17.

- Modules, their public APIs and the events between them:
  `docs/reference/backend-modules.md` in the engineering docs
  (`make docs-serve` from the repository root).
- Run locally: `make backend` from the repository root (sources SDKMAN and
  activates the `local` profile against the compose services).
- Definition of Done: `./mvnw verify`, which includes `ModularityTests`.
- Schema changes are Flyway migrations under
  `src/main/resources/db/migration`; see `docs/how-to/add-a-migration.md`.
