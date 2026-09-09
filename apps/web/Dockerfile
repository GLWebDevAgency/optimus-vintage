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
# Variables inlinées au build par Next.js (préfixe NEXT_PUBLIC_) et références Sentry.
# Railway ne transmet une variable de service au build Docker que si elle est déclarée en ARG.
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_SENTRY_ENVIRONMENT
ARG SENTRY_DSN
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG APP_COMMIT
ENV NODE_ENV=production \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN \
    NEXT_PUBLIC_SENTRY_ENVIRONMENT=$NEXT_PUBLIC_SENTRY_ENVIRONMENT \
    SENTRY_DSN=$SENTRY_DSN SENTRY_ORG=$SENTRY_ORG SENTRY_PROJECT=$SENTRY_PROJECT \
    APP_COMMIT=$APP_COMMIT
# Le jeton Sentry (source maps) est monté en secret : jamais copié dans une couche.
RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN \
    export SENTRY_AUTH_TOKEN="$(cat /run/secrets/SENTRY_AUTH_TOKEN 2>/dev/null || true)" \
    && pnpm turbo run build --filter=@chine/web

# ── Image finale : serveur autonome, utilisateur non root ────────────────────
FROM node:${NODE_VERSION}-bookworm-slim AS runner
ARG APP_COMMIT
# L'adresse d'écoute est choisie au démarrage par scripts/start.mjs : `::` (double pile, requis par
# le réseau privé et les sondes Railway v2) si l'hôte a IPv6, sinon `0.0.0.0` ; `BIND_HOST` force.
ENV NODE_ENV=production PORT=3000 NEXT_TELEMETRY_DISABLED=1 \
    CHINE_MIGRATIONS_DIR=/app/packages/infrastructure/drizzle APP_COMMIT=$APP_COMMIT
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public
COPY --from=build --chown=node:node /app/packages/infrastructure/drizzle ./packages/infrastructure/drizzle
COPY --from=build --chown=node:node /app/apps/web/scripts/start.mjs ./apps/web/scripts/start.mjs
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://127.0.0.1:${PORT}/api/ready || exit 1
CMD ["node", "apps/web/scripts/start.mjs"]
