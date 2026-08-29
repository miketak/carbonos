SHELL := /bin/bash
.PHONY: db-up db-down backend frontend admin verify

db-up:            ## start local Postgres
	docker compose up -d

db-down:          ## stop local Postgres
	docker compose down

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
