# CarbonOS

Monorepo for CarbonOS:

| Path        | What                                                        |
| ----------- | ----------------------------------------------------------- |
| `backend/`  | Spring Boot 4 modular monolith (Java 25, Maven, PostgreSQL) |
| `frontend/` | React 19 SPA (TypeScript, Vite)                             |
| `specs/`    | Feature specifications (spec-first workflow)                |
| `CLAUDE.md` | Architecture rules, workflow, and Definition of Done        |

## Getting started

Prerequisites: Docker, Node 22+, JDK 25 (or run Maven through Docker — see `CLAUDE.md`).

```bash
docker compose up -d                                        # local Postgres
(cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=local)
(cd frontend && npm install && npm run dev)                 # http://localhost:5173
```

Health check: http://localhost:8080/actuator/health

## Tests & quality gates

```bash
(cd backend && ./mvnw verify)     # unit + integration (Testcontainers) + ModularityTests
(cd frontend && npm run lint && npm run format:check && npm test && npm run build)
```

## Deployment (Railway)

Trunk-based flow:

- **PR → `main`**: `.github/workflows/staging.yml` runs all quality gates.
- **Merge to `main`**: same workflow deploys backend + frontend to the Railway
  **staging** environment.
- **Tag `vX.Y.Z`**: `.github/workflows/production.yml` re-runs the gates and
  deploys to the Railway **production** environment (optionally gated by a
  required-reviewer rule on the GitHub `production` environment).

### One-time Railway setup

1. Create a Railway project with two environments: `staging` and `production`.
2. In **each** environment, create three services:
   - `backend` — root directory `/backend`, builds from its `Dockerfile`
   - `frontend` — root directory `/frontend`, builds from its `Dockerfile`
   - PostgreSQL database (Railway plugin/service)

   The root directory setting matters: `railway up` uploads the repo root, and
   each service picks out its subdirectory from that upload.
3. Configure `backend` service variables (per environment), using Railway
   references to the Postgres service:
   - `DATABASE_URL` = `jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}`
   - `DATABASE_USERNAME` = `${{Postgres.PGUSER}}`
   - `DATABASE_PASSWORD` = `${{Postgres.PGPASSWORD}}`
   - Set the healthcheck path to `/actuator/health`.
4. Configure `frontend` service variables (per environment):
   - `VITE_API_URL` = the backend's public URL (e.g. `https://backend-staging.up.railway.app`)
5. Create a **project token** for each environment
   (Project Settings → Tokens, token is environment-scoped) and add them as
   GitHub repository secrets:
   - `RAILWAY_STAGING_TOKEN`
   - `RAILWAY_PRODUCTION_TOKEN`
6. (Recommended) In GitHub → Settings → Environments → `production`, add
   yourself as a required reviewer so production deploys need manual approval.
7. Disable Railway's own GitHub auto-deploy for these services — GitHub
   Actions owns deployment (`railway up`), so double-deploys would result.

### Wiping an environment's database

The Railway Postgres services have no public proxy, so the wipe runs `psql`
inside the Postgres container over `railway ssh`. One-time setup: sign in with
`railway login` and register a key with
`railway ssh keys add -k ~/.ssh/id_ed25519.pub`. Then:

```bash
make db-wipe ENV=staging            # prompts you to type "staging"
make db-wipe ENV=staging ARGS=--yes # no prompt
```

The script checks that the container really belongs to the environment you
named, prints what the database holds, drops and recreates the `public`
schema, redeploys `backend` so Flyway migrates from V1 and the startup seeder
recreates the admin, and waits until the health endpoint reports UP. Every
account, organization and run is gone; the seeded admin is the only user left.
Production requires `ARGS=--yes-production` and typing `production` at the
prompt, which cannot be skipped. Locally, `make db-reset` drops the compose
volumes instead.

## Releasing

```bash
git tag v0.1.0 && git push origin v0.1.0
```
