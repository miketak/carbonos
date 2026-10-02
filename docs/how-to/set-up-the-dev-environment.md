---
owner: miketak
last_reviewed: 2026-10-02
---

# Set up the dev environment

This guide gets the backend, the frontend and their supporting services
running on your machine. It assumes a Linux or macOS shell; on Windows, use
WSL 2.

## Before you begin

Install these once:

| Tool | Version | How |
| --- | --- | --- |
| Docker with Compose | current | Docker Desktop, or the Docker Engine on Linux |
| Node | 22 | nvm: `nvm install 22` |
| Java | 25 (Temurin) | SDKMAN: `sdk install java 25-tem` |
| uv | current | https://docs.astral.sh/uv/ |
| tmux | any | `sudo apt install tmux` or `brew install tmux` |

The backend build sources SDKMAN itself, so a non-login shell still finds
Java. If you run Maven by hand, run
`source "$HOME/.sdkman/bin/sdkman-init.sh"` first.

## In a Claude Code cloud session

Cloud sessions run in a fresh Ubuntu container that ships Java 21 and a
stopped Docker daemon, with no SDKMAN. The SessionStart hook in
`.claude/hooks/session-start.sh` prepares it before the session starts:

- installs Ubuntu's `openjdk-25-jdk-headless` (the proxy blocks Temurin
  downloads) and sets `JAVA_HOME` for the session;
- starts `dockerd` and pulls the Testcontainers images;
- runs `npm ci` in `frontend/` and `qa/` when their lockfiles changed, and
  `./mvnw test-compile` in `backend/`, to warm the dependency caches.

The hook does nothing outside a cloud session. When you change an image in
`TestcontainersConfiguration.java`, change it in the hook too.

## Local services

```mermaid
flowchart LR
    accTitle: Local development services and ports
    accDescr: The Vite dev server on 5173 proxies /api to Spring Boot on 8080, which uses Postgres on 5433, MinIO on 9000 and Mailpit on 1025.
    browser[Browser] --> vite["Vite dev server\n:5173"]
    vite -- "/api" --> boot["Spring Boot\n:8080"]
    boot --> pg[("Postgres\n:5433")]
    boot --> minio["MinIO (S3)\n:9000, console :9001"]
    boot --> mail["Mailpit (SMTP)\n:1025, web UI :8025"]
```

Postgres listens on 5433, not 5432, because many machines already run a
Postgres on the default port. MinIO is the local stand-in for the S3-style
bucket that holds evidence files; the image comes from Bitnami's legacy
repository on Docker Hub, because MinIO withdrew its own public images in
September 2026. Mailpit catches every outbound email so nothing leaves your
machine.

## Start everything with one command

1. From the repository root, run `make dev-up`.

    tmux opens a window with the backend on top, Postgres logs bottom left,
    and the Vite dev server bottom right (it also compiles and serves the
    end-user help at `/help`). Inside an existing tmux session the
    window is named `dev-console`; outside tmux, a session named
    `carbonos` is created.

2. Wait for the backend pane to print `Started CarbonosApplication`.
3. Open http://localhost:8080/actuator/health.

    The response is `{"status":"UP"}`.

4. Create an administrator:

    ```bash
    make admin EMAIL=you@example.com PASSWORD=change-me-now
    ```

5. Open http://localhost:5173 and sign in. The account menu's **Help**
   item opens the help at http://localhost:5173/help/.

To stop everything, run `make dev-down`. It closes the panes it opened
and stops the containers.

## Start the pieces by hand

Use separate terminals when you want to restart one piece without the
others.

1. Start the services: `make db-up`.
2. Start the backend: `make backend`. It runs Spring Boot with the
   `local` profile, which points at the compose services.
3. Start the frontend: `make frontend`. The Vite dev server proxies
   `/api` to port 8080, so the browser never needs the backend's address.

## Reset the local database

Run `make db-reset`. It drops the compose volumes and starts the services
again; the next backend start replays every Flyway migration on an empty
database. Create the administrator again afterwards.

## Keep an eye on memory

The backend's integration tests start Postgres, MinIO and Mailpit in
Testcontainers. On a machine with less than 8 GB of RAM, run one Maven
build at a time, and expect the frontend test suite to slow down while
Maven runs.
