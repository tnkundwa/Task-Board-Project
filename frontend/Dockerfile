FROM node:20-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm@9
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS dev
WORKDIR /app
EXPOSE 3000
CMD ["pnpm", "dev"]

FROM deps AS build
WORKDIR /app
COPY . .
RUN pnpm build

FROM nginx:1.27-alpine AS runtime
# Reuse the nginx image's built-in unprivileged "nginx" user rather than adding a new one.
RUN chown -R nginx:nginx /var/cache/nginx /etc/nginx \
 && touch /var/run/nginx.pid && chown nginx:nginx /var/run/nginx.pid
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/out /usr/share/nginx/html

# DNS_RESOLVER defaults to Docker's embedded DNS server (used on any user-defined network,
# e.g. docker-compose); override it for Kubernetes to point at CoreDNS's ClusterIP.
ENV GATEWAY_UPSTREAM=http://api-gateway:8080 \
    DNS_RESOLVER=127.0.0.11

USER nginx
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=3s --start-period=15s --retries=5 \
  CMD wget -qO- http://localhost:3000/ >/dev/null || exit 1