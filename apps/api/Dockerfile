# ============================================
# MoviePlatform API — Production Dockerfile
# Multi-stage build for NestJS + Prisma + FFmpeg
# ============================================

# ---- Stage 1: Install dependencies ----
FROM node:20-alpine AS deps

RUN apk add --no-cache openssl python3 make g++

WORKDIR /app

# Copy package files for all required workspaces
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared/package*.json ./packages/shared/
COPY packages/typescript-config/package*.json ./packages/typescript-config/

RUN npm ci

# ---- Stage 2: Build ----
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build shared package (API depends on it)
RUN npm run build --workspace=packages/shared

# Generate Prisma client
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Create a build-specific tsconfig that compiles only src/ with rootDir=src
# so the output is dist/main.js (not dist/src/main.js)
RUN printf '{"extends":"./tsconfig.json","compilerOptions":{"rootDir":"./src"},"include":["src/**/*"],"exclude":["node_modules","dist","test","prisma"]}' > apps/api/tsconfig.build.json

# Build NestJS API
RUN cd apps/api && npx nest build --path tsconfig.build.json

# ---- Stage 3: Production runner ----
FROM node:20-alpine AS runner

# FFmpeg for video transcoding
RUN apk add --no-cache openssl ffmpeg

WORKDIR /app

ENV NODE_ENV=production

# Copy root package.json (needed for workspace resolution)
COPY --from=builder /app/package.json ./package.json

# Copy compiled API
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

# Copy Prisma schema + migrations (needed for prisma migrate deploy)
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

# Copy shared package dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json

# Copy node_modules (includes Prisma client, native modules)
COPY --from=builder /app/node_modules ./node_modules

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Create temp directory for video uploads
RUN mkdir -p /tmp/video-uploads && chown nestjs:nodejs /tmp/video-uploads

USER nestjs

WORKDIR /app/apps/api

EXPOSE 4000

CMD ["node", "dist/main"]
