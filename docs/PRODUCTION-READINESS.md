# Grille de conformité production

Chaque ligne est vérifiée avant de déclarer une version livrable. Statut : ✅ vérifié · ⚠️ partiel · ❌ manquant.

| Domaine | Exigence | Statut | Preuve |
|---|---|---|---|
| Données | Multi-tenant : chaque table métier porte `workspace_id`, isolation prouvée par tests | ✅ 8 tests d'isolation, upserts verrouillés par `workspace_id` | `packages/infrastructure/test/tenant-isolation.test.ts` |
| Données | Migrations versionnées, appliquées explicitement en production | ✅ 3 migrations (`0000_init`, `0001_rate_limits`, `0002_item_client_id_workspace_prefs`), `CHINE_AUTO_MIGRATE` explicite | `packages/infrastructure/drizzle/*.sql`, `pnpm db:migrate` |
| Données | Argent en entiers (centimes), jamais de flottant | ✅ `Money` + colonnes `bigint` | ADR 0004, `Money` |
| Sécurité | Secrets uniquement en variables d'environnement, validés au démarrage | ✅ `env.ts` (zod), échec explicite si secret < 32 caractères en production | `apps/web/src/lib/env.ts` |
| Sécurité | Sessions sécurisées (cookies `secure`, `sameSite`), CSRF sur mutations | ✅ Better Auth + vérification `Origin`/`Sec-Fetch-Site` (test 403 cross-site) | Better Auth + `with-auth` |
| Sécurité | Limitation de débit persistante (auth, IA, uploads) | ✅ `DrizzleRateLimiter` (auth 10/15 min/IP, IA, uploads 60/min), test 429 | `DrizzleRateLimiter` |
| Sécurité | CSP stricte, `X-Frame-Options`, `noindex` sur /app et /api | ✅ `next.config.ts` + `proxy.ts` | `next.config.ts`, `proxy.ts` |
| Sécurité | Webhooks Stripe signés, tolérance 5 min | ✅ `stripe-signature.ts`, tests ; non exercé contre Stripe réel (pas de compte dans l'environnement) | `stripe-signature.ts` |
| Sécurité | Photos : EXIF/GPS supprimés, taille bornée, type vérifié par signature binaire | ✅ route `photos/upload` (sharp, 15 Mo, WebP), test de rejet | route `photos/upload` |
| RGPD | Export complet des données, suppression de compte effective (données, photos, sessions) | ✅ `DataLifecycle` + routes `account/export` et `DELETE account` (tests) | `DataLifecycle`, routes `account/*` |
| RGPD | Pages légales réelles (CGU, confidentialité) | ⚠️ Pages rédigées, à faire relire par un juriste avant publication | `/legal/*` |
| Fiabilité | Hors-ligne : lectures en cache, écritures en file idempotente (`clientId`) | ✅ outbox Dexie + photos en attente, `clientId` unique par espace (test 201 puis 200), e2e pipeline hors-ligne | `outbox.ts`, `pending-photos.ts` |
| Fiabilité | Health / readiness, journaux structurés avec identifiant de requête | ✅ `/api/health`, `/api/ready`, `log.ts` JSON, `X-Request-Id` v7 | `/api/health`, `/api/ready`, `log.ts` |
| Fiabilité | Erreurs typées de bout en bout, pages d'erreur et hors-ligne | ✅ `respond.ts`, `error.tsx` par segment, `global-error.tsx`, `/offline` | `respond.ts`, `error.tsx`, `/offline` |
| Qualité | Tests domaine, application, infrastructure (PGlite), routes, composants, e2e | ✅ 284 tests Vitest (28 + 43 + 67 + 26 + 22 + 22 + 76) et 11 e2e Playwright | `pnpm test`, `pnpm --filter @chine/web e2e` |
| Qualité | CI bloquante : lint, typecheck, tests, build, e2e | ✅ `.github/workflows/ci.yml` (à activer sur le dépôt ; non exécuté depuis cet environnement) | `.github/workflows/ci.yml` |
| Qualité | Accessibilité AA (cibles 44 px, focus visible, reduced motion, contrastes) | ⚠️ Appliqué dans le design system et les écrans ; audit axe automatisé à ajouter aux e2e | `packages/ui`, e2e axe |
| Qualité | i18n FR/EN/DE sans chaîne en dur ; clés FR ≡ EN testées | ✅ FR ≡ EN testé ; DE partiel avec repli FR (à compléter avant lancement germanophone) | `packages/i18n/test` |
| Produit | Aucune donnée factice, aucun `TODO` dans le code de production | ✅ `grep` vide ; l'expert IA de démonstration n'est utilisé qu'en l'absence de clé et le health l'affiche | `grep -r "TODO" apps packages` |
| Produit | PWA installable : manifest, icônes maskables, service worker, page hors-ligne | ✅ vérifié serveur coupé (`/offline` servi, `/` précaché) | `manifest.webmanifest`, `sw.ts` |
| Produit | Paiement Stripe complet (checkout, portail, webhooks, rétrogradation) | ⚠️ Implémenté via l'API REST Stripe et testé avec `fetch` simulé ; un test en mode sandbox Stripe reste à faire avec de vraies clés | `StripeBillingGateway` |
| Fiabilité | Observabilité : Sentry serveur et client, sans données personnelles | ✅ `instrumentation.ts`, `instrumentation-client.ts`, activé par DSN uniquement | `apps/web/src/instrumentation*.ts` |

## Non couvert par cet environnement

- Aucun test contre Stripe, Gemini, Resend, R2 ou Postgres Railway réels : les adaptateurs sont testés avec des réponses simulées et PGlite. La première mise en production doit passer par un environnement de staging avec de vraies clés.
- L'app native Expo est un socle (phase 2), pas un produit livrable.
- Les pages légales doivent être validées juridiquement.
