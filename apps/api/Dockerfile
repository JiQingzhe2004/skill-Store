# ─── Stage 1: builder ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN npm install -g pnpm@10.5.2

WORKDIR /app

# Copy workspace manifests
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install all deps (including devDeps for nest build)
RUN pnpm install --frozen-lockfile

# Copy source
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Generate Prisma client (bypass prisma-runner.mjs which requires root .env)
RUN cd apps/api && DATABASE_URL=mysql://placeholder:placeholder@localhost:3306/placeholder npx prisma generate --schema prisma/schema.prisma

# Build
RUN pnpm --filter @skill-store/api build

# Prune to production deps only
RUN pnpm --filter @skill-store/api --prod deploy /app/deploy/api

# ─── Stage 2: runner ────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy pruned node_modules + built output
COPY --from=builder /app/deploy/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma

# Re-generate Prisma client inside runner (correct binary target)
RUN DATABASE_URL=mysql://placeholder:placeholder@localhost:3306/placeholder npx prisma generate --schema=./prisma/schema.prisma

ENV NODE_ENV=production
EXPOSE 3001

# migrate + start
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/main.js"]
