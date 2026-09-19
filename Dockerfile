# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm via Corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency configuration
COPY package.json pnpm-lock.yaml ./

# Install dependencies strictly according to lockfile
RUN pnpm install --frozen-lockfile

# Copy application source code
COPY . .

# Build production bundle (tsc -b && vite build)
RUN pnpm run build

# Production serve stage using Nginx
FROM nginx:alpine AS runner

# Copy customized Nginx configuration with SPA support & gzip
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Healthcheck to verify Nginx is responding
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
