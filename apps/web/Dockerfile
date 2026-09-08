# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────────────
# Chiné — image de production de l'app web (Next.js 16, sortie « standalone »).
# Construite depuis la racine du monorepo :  docker build -f apps/web/Dockerfile .
# ─────────────────────────────────────────────────────────────────────────────

ARG NODE_VERSION=24
FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH CI=1 NEXT_TELEMETRY_DISABLED=1 TURBO_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

# ── Dépendances : uniquement les manifestes pour profiter du cache Docker ──────
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/web/package.json apps/web/
COPY apps/mobile/package.json apps/mobile/
COPY packages/domain/package.json packages/domain/
COPY packages/application/package.json packages/application/
COPY packages/infrastructure/package.json packages/infrastructure/
COPY packages/contract/package.json packages/contract/
COPY packages/i18n/package.json packages/i18n/
COPY packages/ui/package.json packages/ui/
# L'app native (Expo) n'est pas installée dans l'image : filtre sur l'app web et ses dépendances.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter "@chine/web..."

# ── Build : packages compilés puis Next.js (webpack + service worker) ─────────
FROM deps AS build
COPY . .
ENV NODE_ENV=production
RUN pnpm turbo run build --filter=@chine/web

# ── Image finale : serveur autonome, utilisateur non root ────────────────────
FROM node:${NODE_VERSION}-bookworm-slim AS runner
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1 \
    CHINE_MIGRATIONS_DIR=/app/packages/infrastructure/drizzle
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public
COPY --from=build --chown=node:node /app/packages/infrastructure/drizzle ./packages/infrastructure/drizzle
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://127.0.0.1:${PORT}/api/ready || exit 1
CMD ["node", "apps/web/server.js"]
