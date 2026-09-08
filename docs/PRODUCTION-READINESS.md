# Grille de conformité production

Chaque ligne est vérifiée avant de déclarer une version livrable. Statut : ✅ vérifié · ⚠️ partiel · ❌ manquant.

| Domaine | Exigence | Statut | Preuve |
|---|---|---|---|
| Données | Multi-tenant : chaque table métier porte `workspace_id`, isolation prouvée par tests | | `packages/infrastructure/test/tenant-isolation.test.ts` |
| Données | Migrations versionnées, appliquées explicitement en production | | `packages/infrastructure/drizzle/*.sql`, `pnpm db:migrate` |
| Données | Argent en entiers (centimes), jamais de flottant | | ADR 0004, `Money` |
| Sécurité | Secrets uniquement en variables d'environnement, validés au démarrage | | `apps/web/src/lib/env.ts` |
| Sécurité | Sessions sécurisées (cookies `secure`, `sameSite`), CSRF sur mutations | | Better Auth + `with-auth` |
| Sécurité | Limitation de débit persistante (auth, IA, uploads) | | `DrizzleRateLimiter` |
| Sécurité | CSP stricte, `X-Frame-Options`, `noindex` sur /app et /api | | `next.config.ts`, `proxy.ts` |
| Sécurité | Webhooks Stripe signés, tolérance 5 min | | `stripe-signature.ts` |
| Sécurité | Photos : EXIF/GPS supprimés, taille bornée, type vérifié par signature binaire | | route `photos/upload` |
| RGPD | Export complet des données, suppression de compte effective (données, photos, sessions) | | `DataLifecycle`, routes `account/*` |
| RGPD | Pages légales réelles (CGU, confidentialité) | | `/legal/*` |
| Fiabilité | Hors-ligne : lectures en cache, écritures en file idempotente (`clientId`) | | `outbox.ts`, `pending-photos.ts` |
| Fiabilité | Health / readiness, journaux structurés avec identifiant de requête | | `/api/health`, `/api/ready`, `log.ts` |
| Fiabilité | Erreurs typées de bout en bout, pages d'erreur et hors-ligne | | `respond.ts`, `error.tsx`, `/offline` |
| Qualité | Tests domaine, application, infrastructure (PGlite), routes, composants, e2e | | `pnpm test`, `pnpm --filter @chine/web e2e` |
| Qualité | CI bloquante : lint, typecheck, tests, build, e2e | | `.github/workflows/ci.yml` |
| Qualité | Accessibilité AA (cibles 44 px, focus visible, reduced motion, contrastes) | | `packages/ui`, e2e axe |
| Qualité | i18n FR/EN/DE sans chaîne en dur ; clés FR ≡ EN testées | | `packages/i18n/test` |
| Produit | Aucune donnée factice, aucun `TODO` dans le code de production | | `grep -r "TODO" apps packages` |
| Produit | PWA installable : manifest, icônes maskables, service worker, page hors-ligne | | `manifest.webmanifest`, `sw.ts` |
| Produit | Paiement Stripe complet (checkout, portail, webhooks, rétrogradation) | | `StripeBillingGateway` |
