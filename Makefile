SHELL := /bin/bash
.DEFAULT_GOAL := help
.PHONY: help db-up db-down db-reset db-wipe backend frontend admin verify dev-up dev-down docs docs-serve docs-check vale qa-docs

# git ref the docs checks diff against
BASE ?= origin/main

help:             ## list the targets in this Makefile
	@grep -hE '^[a-zA-Z0-9_-]+:.*## ' $(MAKEFILE_LIST) | awk -F ':[^#]*## ' '{printf "  %-12s %s\n", $$1, $$2}'

dev-up:           ## start db + backend + frontend in tmux (a "dev-console" window if inside tmux, else a "carbonos" session)
	./scripts/dev-up.sh

dev-down:         ## tear down the dev panes/session and stop Postgres
	./scripts/dev-down.sh

db-up:            ## start local Postgres
	docker compose up -d

db-down:          ## stop local Postgres
	docker compose down

db-reset:         ## wipe the local compose database (drops the volumes) and start it again
	docker compose down -v && docker compose up -d

db-wipe:          ## wipe a Railway environment's database: make db-wipe ENV=staging [ARGS=--yes]
	@test -n "$(ENV)" || { echo "Usage: make db-wipe ENV=staging [ARGS=--yes|--yes-production]"; exit 1; }
	./scripts/wipe-railway-db.sh "$(ENV)" $(ARGS)

backend:          ## run Spring Boot with the local profile (sources SDKMAN for Java 25)
	cd backend && source "$$HOME/.sdkman/bin/sdkman-init.sh" && ./mvnw spring-boot:run -Dspring-boot.run.profiles=local

frontend:         ## run the Vite dev server on :5173
	cd frontend && npm run dev

admin:            ## create/reset a local admin: make admin EMAIL=a@b.c PASSWORD=secret [NAME="Admin"]
	@test -n "$(EMAIL)" -a -n "$(PASSWORD)" || { echo "Usage: make admin EMAIL=.. PASSWORD=.. [NAME=..]"; exit 1; }
	./scripts/create-admin.sh "$(EMAIL)" "$(PASSWORD)" "$(NAME)"

verify:           ## full Definition of Done (backend + frontend)
	cd backend && source "$$HOME/.sdkman/bin/sdkman-init.sh" && ./mvnw verify
	cd frontend && npm run lint && npm run format:check && npm test && npm run build

docs:             ## build the engineering docs into site/ (strict: any warning fails)
	uv run --locked mkdocs build --strict

docs-serve:       ## serve the docs with live reload on http://127.0.0.1:8000
	uv run --locked mkdocs serve

docs-check:       ## docs Definition of Done: strict build, then Vale on markdown changed against $(BASE)
	$(MAKE) docs
	$(MAKE) vale

vale:             ## Vale (advisory) on markdown changed against $(BASE); skips when vale is absent
	@if ! command -v vale >/dev/null; then echo "vale is not installed; skipping (see docs/contributing-to-docs.md)"; exit 0; fi; \
	  vale sync >/dev/null; \
	  files=$$( { git diff --name-only --diff-filter=ACMR "$$(git merge-base $(BASE) HEAD)" -- '*.md'; git ls-files --others --exclude-standard -- '*.md'; } | sort -u); \
	  if [ -n "$$files" ]; then vale --no-exit $$files; else echo "no markdown changed against $(BASE)"; fi

qa-docs:          ## export docs/qa as DOCX under build/qa-docs, ready to upload to Google Drive (needs pandoc)
	uv run --locked python scripts/publish_qa_docs.py --out build/qa-docs
