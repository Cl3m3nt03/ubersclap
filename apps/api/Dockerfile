# syntax=docker/dockerfile:1
#
# Build multi-etapes pour l'API NestJS dans le monorepo Turbo/pnpm.
# `turbo prune` isole le sous-graphe de dependances de @cadance/api (donc
# @cadance/shared aussi) sans embarquer apps/mobile ni apps/web dans l'image.

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
RUN npm install -g turbo@2
WORKDIR /app

FROM base AS pruner
COPY . .
RUN turbo prune @cadance/api --docker

FROM base AS installer
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir=/pnpm/store

FROM base AS builder
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
RUN --mount=type=cache,id=turbo-cadance-api,target=/app/.turbo \
    turbo run build --filter=@cadance/api
RUN pnpm --filter @cadance/api deploy --prod /prod

FROM node:20-alpine AS runner
RUN addgroup --system --gid 1001 nestjs && adduser --system --uid 1001 nestjs
WORKDIR /app
COPY --from=builder --chown=nestjs:nodejs /prod/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/drizzle ./drizzle
USER nestjs
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
CMD ["node", "dist/main"]
