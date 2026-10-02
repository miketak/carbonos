SHELL := /bin/bash
.DEFAULT_GOAL := help
.PHONY: help db-up db-down db-reset db-wipe env-copy purge-resumes backend frontend admin verify dev-up dev-down docs docs-serve docs-check help-serve help-check vale qa-docs qa-lint qa-export qa-export-check qa-compile qa-compile-check qa-schema qa-rules qa-doctor qa-reset qa-run-api qa-run-ui qa-record

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

env-copy:         ## copy a Railway environment's database and bucket into another: make env-copy FROM=staging TO=qa [ARGS=--yes]
	@test -n "$(FROM)" -a -n "$(TO)" || { echo "Usage: make env-copy FROM=staging TO=qa [ARGS=--yes]"; exit 1; }
	./scripts/copy-railway-env.sh "$(FROM)" "$(TO)" $(ARGS)

purge-resumes:    ## delete the retired resume objects from an environment's bucket: make purge-resumes ENV=local [ARGS=--yes]
	@test -n "$(ENV)" || { echo "Usage: make purge-resumes ENV=local|qa|staging|production [ARGS=--yes|--yes-production]"; exit 1; }
	./scripts/purge-resumes.sh "$(ENV)" $(ARGS)

backend:          ## run Spring Boot with the local profile (sources SDKMAN for Java 25)
	cd backend && source "$$HOME/.sdkman/bin/sdkman-init.sh" && ./mvnw spring-boot:run -Dspring-boot.run.profiles=local

frontend:         ## run the Vite dev server on :5173
	cd frontend && npm run dev

admin:            ## create/reset a local admin: make admin EMAIL=a@b.c PASSWORD=secret [NAME="Admin"]
	@test -n "$(EMAIL)" -a -n "$(PASSWORD)" || { echo "Usage: make admin EMAIL=.. PASSWORD=.. [NAME=..]"; exit 1; }
	./scripts/create-admin.sh "$(EMAIL)" "$(PASSWORD)" "$(NAME)"

verify:           ## full Definition of Done (backend + frontend + QA scenarios)
	cd backend && source "$$HOME/.sdkman/bin/sdkman-init.sh" && ./mvnw verify
	cd frontend && npm run lint && npm run format:check && npm test && npm run build
	$(MAKE) qa-lint qa-compile-check qa-export-check

docs:             ## build the engineering docs into site/ (strict: any warning fails)
	uv run --locked mkdocs build --strict

docs-serve:       ## serve the docs with live reload on http://127.0.0.1:8000
	uv run --locked mkdocs serve

docs-check:       ## docs Definition of Done: strict build, the QA procedures current, then Vale on markdown changed against $(BASE)
	$(MAKE) docs
	$(MAKE) qa-export-check
	$(MAKE) vale

help-serve:       ## serve the help centre with live reload: the Vite dev server, at http://localhost:5173/help
	cd frontend && npm run dev

help-check:       ## help Definition of Done: the help compiler's checks (tree, links, budgets, diagrams), then Vale
	cd frontend && npm run help:check
	$(MAKE) vale

vale:             ## Vale (advisory) on markdown changed against $(BASE); skips when vale is absent
	@if ! command -v vale >/dev/null; then echo "vale is not installed; skipping (see docs/contributing-to-docs.md)"; exit 0; fi; \
	  vale sync >/dev/null; \
	  files=$$( { git diff --name-only --diff-filter=ACMR "$$(git merge-base $(BASE) HEAD)" -- '*.md'; git ls-files --others --exclude-standard -- '*.md'; } | sort -u); \
	  if [ -n "$$files" ]; then vale --no-exit $$files; else echo "no markdown changed against $(BASE)"; fi

qa-docs:          ## export a persona's QA procedures as DOCX under build/qa-docs: make qa-docs [PERSONA=mining] (needs pandoc)
	uv run --locked python scripts/publish_qa_docs.py --out build/qa-docs --persona $(or $(PERSONA),mining)

# The QA scenario DSL (qa/): procedures as domain steps, projected to Markdown, an API driver and a UI driver.
QA_PERSONA ?= governance
QA_PROC ?=

qa-lint:          ## QA scenarios: schema, ids, rules, specs, surface strings, em-dashes
	cd qa && npm run -s qa -- lint --persona $(QA_PERSONA)

qa-export:        ## QA scenarios: write the procedure Markdown under docs/qa/<persona>/
	cd qa && npm run -s qa -- export --persona $(QA_PERSONA)

qa-export-check:  ## QA scenarios: fail when the committed Markdown differs from the YAML
	cd qa && npm run -s qa -- export --check --persona $(QA_PERSONA)

qa-compile:       ## QA scenarios: write the API and UI specs under qa/generated/<persona>/
	cd qa && npm run -s qa -- compile --persona $(QA_PERSONA) && npm run -s qa -- schema

qa-compile-check: ## QA scenarios: fail when the committed specs or schema differ from the YAML
	cd qa && npm run -s qa -- compile --check --persona $(QA_PERSONA) && npm run -s qa -- schema --check

qa-schema:        ## QA scenarios: write qa/schema/scenario.schema.json for editors
	cd qa && npm run -s qa -- schema

qa-rules:         ## QA scenarios: pull the rule catalogue from the running local backend
	cd qa && npm run -s qa -- rules

qa-doctor:        ## QA scenarios: is the local stack ready for a run?
	cd qa && npm run -s qa -- doctor --persona $(QA_PERSONA)

qa-reset:         ## QA scenarios: reset the local stack through /api/qa/reset and empty Mailpit
	cd qa && npm run -s qa -- reset --persona $(QA_PERSONA)

qa-run-api:       ## QA scenarios: run the API driver: make qa-run-api [QA_PERSONA=governance] [QA_PROC=1]
	cd qa && npx playwright test --project api $(if $(QA_PROC),generated/$(QA_PERSONA)/api/$(shell printf '%03d' $(QA_PROC))-,generated/$(QA_PERSONA)/api/)

qa-run-ui:        ## QA scenarios: run the UI driver: make qa-run-ui [QA_PERSONA=governance] [QA_PROC=1]
	cd qa && npx playwright test --project ui $(if $(QA_PROC),generated/$(QA_PERSONA)/ui/$(shell printf '%03d' $(QA_PROC))-,generated/$(QA_PERSONA)/ui/)

qa-record:        ## QA scenarios: the run record from the last run: make qa-record QA_PROC=1 DRIVER=api
	@test -n "$(QA_PROC)" -a -n "$(DRIVER)" || { echo "Usage: make qa-record QA_PROC=1 DRIVER=api|ui"; exit 1; }
	cd qa && npm run -s qa -- record $(QA_PROC) $(DRIVER) --persona $(QA_PERSONA)
