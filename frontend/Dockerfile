# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# API base URL baked in at build time. Leave EMPTY (the default) so the SPA
# calls a relative /api and nginx proxies it same-origin — session and CSRF
# cookies are SameSite=Lax and do not survive a cross-origin API.
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm run build

# ---- Help site stage ----
# The end-user help (help/ at the repo root) is built by MkDocs outside this
# image, because the Railway service builds from frontend/ alone: CI and
# `make help-bundle` put the strict build in frontend/help-site/. The glob
# matches nothing when the folder is absent, so a plain `docker build` of the
# SPA still works; it just serves no /help/.
FROM alpine:3 AS help
WORKDIR /help
COPY package.json help-site* ./
RUN rm -f package.json

# ---- Runtime stage ----
FROM nginx:alpine

# nginx's entrypoint renders *.template with envsubst, so ${PORT} is honored at startup
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
# The help site at /help/ on the same origin as the app (ADR 0005)
COPY --from=help /help /usr/share/nginx/html/help

ENV PORT=8080
# Where nginx proxies /api to — Railway private networking; the hostname
# resolves to the same-environment backend in both staging and production.
ENV BACKEND_INTERNAL_URL=http://backend.railway.internal:8080
EXPOSE 8080
