# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm reliably
RUN npm install -g pnpm

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

EXPOSE 80 3000 8080

CMD ["nginx", "-g", "daemon off;"]
