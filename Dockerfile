# Build stage
FROM node:22.23.4-alpine3.24 AS builder

WORKDIR /app

# Use the pnpm version pinned in package.json ("packageManager")
RUN corepack enable

# Copy dependency configuration
COPY package.json pnpm-lock.yaml ./

# Install dependencies strictly according to lockfile
RUN pnpm install --frozen-lockfile

# Copy application source code
COPY . .

# Build production bundle (tsc -b && vite build)
RUN pnpm run build

# Production serve stage: nginx running as a non-root user (uid 101)
FROM nginxinc/nginx-unprivileged:1.30.6-alpine3.24 AS runner

# Copy customized Nginx configuration with SPA support & gzip
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Container port Coolify routes production traffic to
EXPOSE 3000

# 127.0.0.1 rather than localhost, which may resolve to IPv6 on alpine
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:3000/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
