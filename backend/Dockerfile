# Base stage
FROM node:20-alpine AS base

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production Runner stage
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Create uploads and temp directories with correct permissions
# temp/ is for temporary uploads (auto-cleaned by cron job)
# uploads/ is for permanent storage (mounted as volume)
RUN mkdir -p /app/uploads /app/temp && chown -R node:node /app/uploads /app/temp

EXPOSE 8080

USER node

CMD ["node", "dist/main"]
