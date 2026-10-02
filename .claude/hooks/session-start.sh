#!/bin/bash
# SessionStart hook for Claude Code cloud sessions: installs the toolchain the
# Definition of Done needs (JDK 25, a running Docker daemon for Testcontainers,
# npm and Maven dependencies). Local sessions are left alone.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# JDK 25: the base image ships Java 21, and Adoptium downloads are blocked by
# the proxy, so use Ubuntu's OpenJDK package.
JDK25=/usr/lib/jvm/java-25-openjdk-amd64
if [ ! -x "$JDK25/bin/javac" ]; then
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq openjdk-25-jdk-headless >/dev/null
fi
export JAVA_HOME="$JDK25"
export PATH="$JAVA_HOME/bin:$PATH"
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export JAVA_HOME=\"$JDK25\"" >> "$CLAUDE_ENV_FILE"
  echo "export PATH=\"$JDK25/bin:\$PATH\"" >> "$CLAUDE_ENV_FILE"
fi

# Docker daemon for Testcontainers and compose.yaml.
if ! docker info >/dev/null 2>&1; then
  (dockerd >/var/log/dockerd.log 2>&1 &)
  for _ in $(seq 1 30); do
    docker info >/dev/null 2>&1 && break
    sleep 1
  done
  docker info >/dev/null 2>&1 || { echo "dockerd did not start; see /var/log/dockerd.log" >&2; exit 1; }
fi

# Testcontainers images; best effort, the tests pull them on demand anyway.
# Keep in sync with backend/src/test/java/com/carbonos/TestcontainersConfiguration.java.
for image in postgres:17-alpine bitnamilegacy/minio:2025.4.22-debian-12-r2 axllent/mailpit:v1.24; do
  docker image inspect "$image" >/dev/null 2>&1 || docker pull -q "$image" >/dev/null || true
done

# Frontend dependencies. npm ci never rewrites package-lock.json (the image's
# npm 10 would drop fields a newer npm wrote); skip it while node_modules is
# already newer than the lockfile.
if [ ! frontend/node_modules/.package-lock.json -nt frontend/package-lock.json ]; then
  (cd frontend && npm ci --no-audit --no-fund --loglevel=error)
fi

# Backend dependencies and plugins, warmed into ~/.m2 by compiling main and test code.
(cd backend && ./mvnw -B -q -DskipTests test-compile)
