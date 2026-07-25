# API @ubersclap/api — image de deploiement (Railway, Render, Fly...).
#
# Monorepo pnpm : on installe uniquement l'API et sa dependance @ubersclap/shared
# (le filtre `...` embarque les deps), on compile shared puis l'API, on applique
# les migrations au demarrage, puis on lance le serveur compile.

FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# Sources completes du monorepo (node_modules exclus via .dockerignore).
COPY . .

# Installe API + shared seulement, lockfile fige.
RUN pnpm install --frozen-lockfile --filter @ubersclap/api...

# Compile la lib partagee puis l'API.
RUN pnpm --filter @ubersclap/shared build \
 && pnpm --filter @ubersclap/api build

ENV NODE_ENV=production
# Railway/Render fournissent PORT ; main.ts lit process.env.PORT.
EXPOSE 3000

# Migrations puis serveur. La base doit etre joignable via DATABASE_URL.
CMD ["sh", "-c", "pnpm --filter @ubersclap/api db:migrate && node apps/api/dist/main.js"]
