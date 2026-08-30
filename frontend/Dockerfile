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

# ---- Runtime stage ----
FROM nginx:alpine

# nginx's entrypoint renders *.template with envsubst, so ${PORT} is honored at startup
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

ENV PORT=8080
# Where nginx proxies /api to — Railway private networking; the hostname
# resolves to the same-environment backend in both staging and production.
ENV BACKEND_INTERNAL_URL=http://backend.railway.internal:8080
EXPOSE 8080
