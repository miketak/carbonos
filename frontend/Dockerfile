# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Backend base URL baked in at build time (Railway exposes service variables to Docker builds)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM nginx:alpine

# nginx's entrypoint renders *.template with envsubst, so ${PORT} is honored at startup
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

ENV PORT=8080
EXPOSE 8080
