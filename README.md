# CarbonOS

Monorepo for CarbonOS:

| Path        | What                                                        |
| ----------- | ----------------------------------------------------------- |
| `backend/`  | Spring Boot 4 modular monolith (Java 25, Maven, PostgreSQL) |
| `frontend/` | React 19 SPA (TypeScript, Vite)                             |
| `specs/`    | Feature specifications (spec-first workflow)                |
| `docs/`     | Engineering docs site (`make docs-serve`) and QA procedures |
| `Makefile`  | Every day-to-day command; `make help` lists them            |
| `CLAUDE.md` | Architecture rules, workflow, and Definition of Done        |

## Getting started

Prerequisites: Docker, Node 22+, JDK 25 through SDKMAN, and uv for the docs
site. `make help` lists every command.

```bash
docker compose up -d                                        # local Postgres
(cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=local)
(cd frontend && npm install && npm run dev)                 # http://localhost:5173
```

Health check: http://localhost:8080/actuator/health

## Documentation

The engineering docs explain how the system is built, run, verified, and
changed. They build from the Markdown in this repository:

```bash
make docs-serve        # http://127.0.0.1:8000, reloads on save
make docs-check        # strict build plus prose lint, before a pull request
```

Start at `docs/index.md`, or with `docs/tutorials/first-week.md` if you are
new. The specs under `specs/` and the QA procedures under `docs/qa/` are
part of the site. `docs/contributing-to-docs.md` is the house style.

## Tests & quality gates

```bash
(cd backend && ./mvnw verify)     # unit + integration (Testcontainers) + ModularityTests
(cd frontend && npm run lint && npm run format:check && npm test && npm run build)
```

## Deployment (Railway)

Trunk-based flow with tagged releases:

- **Any PR**: `.github/workflows/ci.yml` runs all quality gates. Merging to
  `main` runs them again and deploys nothing.
- **Tag `vX.Y.Z-rc.N`**: `.github/workflows/qa.yml` re-runs the gates, deploys
  the Railway **qa** environment for the testers, then waits for the QA
  sign-off approval, which tags `vX.Y.Z`.
- **Tag `vX.Y.Z`**: `.github/workflows/release.yml` re-runs the gates, deploys
  the Railway **staging** environment as a rehearsal, then deploys
  **production** after the approval on the GitHub `production` environment.

The one-time Railway setup, the environment addresses and variables, and
the database wipe and copy procedures are in the engineering docs:
`docs/how-to/deploy-and-release.md` and `docs/reference/environments.md`.

## Releasing

```bash
git tag v0.7.0-rc.1 && git push origin v0.7.0-rc.1   # to qa
# testers approve; approve the qa-signoff job: it tags v0.7.0 and deploys staging
# approve the production job on the Release run
```
