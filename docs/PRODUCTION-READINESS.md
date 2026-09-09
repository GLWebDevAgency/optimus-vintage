# Grille de conformité production

Chaque ligne est vérifiée avant de déclarer une version livrable. Statut : ✅ vérifié · ⚠️ partiel · ❌ manquant.

| Domaine | Exigence | Statut | Preuve |
|---|---|---|---|
| Données | Multi-tenant : chaque table métier porte `workspace_id`, isolation prouvée par tests | ✅ tests d'isolation, upserts verrouillés par `workspace_id`, un espace par utilisateur (index unique) | `packages/infrastructure/test/tenant-isolation.test.ts` |
| Données | Migrations versionnées, additives, appliquées explicitement en production | ✅ 5 migrations (`0000_init` → `0004_appraisal_credits_tokens`), `pnpm db:migrate` réel ou `CHINE_AUTO_MIGRATE` explicite | `packages/infrastructure/drizzle/*.sql`, `scripts/migrate.ts` |
| Données | Argent en entiers (centimes), jamais de flottant ; prix des plans en centimes | ✅ `Money` + colonnes `bigint`, `PLAN_PRICES_EUR` en centimes | ADR 0004, ADR 0007 |
| Données | Agrégations sur l'ensemble des lignes, jamais sur une page | ✅ tableau de bord, rapport de période et performance des sources lisent toutes les lignes (`ALL_ROWS`) | `get-dashboard.ts`, `mapping.ts` |
| Sécurité | Secrets uniquement en variables d'environnement, validés au démarrage | ✅ `env.ts` (zod), échec explicite si secret < 32 caractères ou mailer absent en production | `apps/web/src/lib/env.ts` |
| Sécurité | Sessions sécurisées (cookies `secure`, `sameSite`), CSRF sur mutations | ✅ Better Auth + vérification `Origin`/`Sec-Fetch-Site` (test 403 cross-site) ; déconnexion en POST seulement | Better Auth + `with-auth` |
| Sécurité | Limitation de débit persistante (auth, IA, uploads) sur une IP de confiance | ✅ `DrizzleRateLimiter` (auth 10/15 min/IP, IA, uploads 60/min), IP issue de l'en-tête interne posé par `proxy.ts` (test) | `DrizzleRateLimiter`, `request.ts`, ADR 0008 |
| Sécurité | CSP stricte, `X-Frame-Options`, `noindex` sur /app et /api, corps bornés | ✅ `next.config.ts` + `proxy.ts`, 413 au-delà de 256 Ko (12 Mo pour l'IA) | `next.config.ts`, `route.ts` |
| Sécurité | Webhooks Stripe signés, tolérance 5 min, idempotents et ordonnés | ✅ `stripe-signature.ts`, dédoublonnage par identifiant d'événement, événements périmés ignorés, tests ; non exercé contre Stripe réel | `StripeBillingGateway`, `billing.test.ts` |
| Sécurité | Photos : EXIF/GPS supprimés, taille bornée, type vérifié par signature binaire | ✅ route `photos/upload` (sharp, 15 Mo, WebP), test de rejet | route `photos/upload` |
| Sécurité | Aucun secret dans le dépôt ni dans l'image | ✅ `.env*` ignorés partout (`.dockerignore` couvre les sous-dossiers), jeton Sentry monté en secret de build ; l'ancien mot de passe Postgres du dépôt historique est purgé et **doit être révoqué sur Railway** | `.dockerignore`, `Dockerfile` |
| RGPD | Export complet des données, suppression de compte effective (données, photos, sessions, abonnement) | ✅ `DataLifecycle` + routes `account/export` et `DELETE account` ; l'abonnement Stripe est résilié avant la suppression (503 sinon) | `DataLifecycle`, routes `account/*` |
| RGPD | Cache et files locales effacés à la déconnexion | ✅ `clearDeviceData()` (IndexedDB, caches SW, Dexie), e2e | `session.ts` |
| RGPD | Pages légales réelles (CGU, confidentialité, mentions légales) | ⚠️ Rédigées (essai, renouvellement, rétractation, médiation) ; champs éditeur entre crochets à compléter et relecture juridique avant publication | `/legal/*` |
| Fiabilité | Hors-ligne : lectures en cache, écritures en file idempotente | ✅ outbox Dexie + photos en attente, `clientId` unique par espace, rejeu serveur au plus une fois (`X-Outbox-Id`, test replay/409), e2e pipeline hors-ligne | `outbox.ts`, `idempotency.ts`, ADR 0006 |
| Fiabilité | Health / readiness, journaux structurés, commit servi identifiable | ✅ `/api/health`, `/api/ready` (`commit`), `log.ts` JSON, `X-Request-Id` v7, workflows qui attendent le bon commit | `/api/health`, `/api/ready`, `deploy-*.yml` |
| Fiabilité | Erreurs typées de bout en bout, pages d'erreur et hors-ligne, pannes IA explicites | ✅ `respond.ts`, `error.tsx` par segment, `global-error.tsx`, `/offline`, 502/503 + `Retry-After` sur l'IA | `respond.ts`, `appraisals/route.ts` |
| Fiabilité | Tables techniques bornées (débit, idempotence, événements Stripe, outbox) | ✅ tâches de fond toutes les minutes, `CHINE_JOBS` | `apps/web/src/lib/jobs.ts` |
| Fiabilité | Observabilité : Sentry serveur et client, sans données personnelles, release = commit | ✅ `instrumentation.ts`, `instrumentation-client.ts`, activé par DSN uniquement | `apps/web/src/instrumentation*.ts` |
| Qualité | Tests domaine, application, infrastructure (PGlite), routes, composants, e2e | ✅ 343 tests Vitest (33 + 43 + 113 + 26 + 22 + 22 + 84) et 11 e2e Playwright | `pnpm test`, `pnpm --filter @chine/web e2e` |
| Qualité | CI bloquante : lint, typecheck, tests, build, e2e ; déploiements staging et production | ✅ `ci.yml`, `e2e.yml`, `deploy-staging.yml`, `deploy-production.yml` (approbation manuelle) ; à activer sur le dépôt avec les secrets Railway | `.github/workflows/` |
| Qualité | Accessibilité AA (cibles 44 px, focus visible, reduced motion, contrastes) | ⚠️ Appliqué dans le design system et les écrans ; certains contrastes de jetons signalés par l'audit restent à corriger ; audit axe automatisé à ajouter aux e2e | `packages/ui`, `docs/AUDIT-2026-09.md` |
| Qualité | i18n FR/EN/DE sans chaîne en dur ; clés FR ≡ EN testées | ⚠️ FR ≡ EN testé ; DE partiel avec repli FR ; quelques chaînes en dur signalées par l'audit | `packages/i18n/test` |
| Produit | Aucune donnée factice, aucun `TODO` dans le code de production | ✅ `grep` vide ; l'expert IA de démonstration est exclu de la chaîne en production et le health affiche la chaîne active | `grep -r "TODO" apps packages` |
| Produit | Expert IA interchangeable (Claude, Gemini, OpenAI) avec repli et traçabilité du modèle servi | ✅ `AppraiserRouter`, tests fournisseurs/routeur, `GET /api/health` → `appraiser.chain` | ADR 0005 |
| Produit | PWA installable : manifest, icônes maskables, service worker, page hors-ligne | ✅ vérifié serveur coupé (`/offline` servi, `/` précaché) | `manifest.webmanifest`, `sw.ts` |
| Produit | Plans, quotas et paywall appliqués côté serveur ; plan possédé par Stripe | ✅ `checkQuota` (stock 50 / 500 / illimité, sources, IA), `402` + `upgradeTo`, paywall Chiner, `PlanCard` avec essai ; `plan` écrit uniquement par le webhook | ADR 0007, `features.test.ts` |
| Produit | Coût de l'IA borné et observé : crédits par action, aucun plan illimité, jetons et coût estimé enregistrés | ✅ `AI_CREDIT_COST`, `aiCreditsPerMonth` (10 / 100 / 300), colonnes `credits`, `input_tokens`, `output_tokens`, modèle par défaut Sonnet 5 ≈ 0,02 € par expertise | `docs/BUSINESS-PLAN.md`, `ai-pricing.test.ts` |
| Produit | Paiement Stripe complet (checkout avec essai, portail, webhooks, rétrogradation, impayé, résiliation à la suppression) | ⚠️ Implémenté via l'API REST Stripe et testé avec `fetch` simulé ; un passage en mode sandbox Stripe avec de vraies clés reste à faire | `StripeBillingGateway` |
| Produit | Fonctions attendues d'un produit payant : exports CSV et comptable, textes d'annonce, analytique, rapport mensuel imprimable, étiquettes QR, ventes en attente encaissables, actions groupées | ✅ livrées et testées ; ventes groupées, remboursements partiels et multi-utilisateurs restent hors périmètre (Atelier en liste d'attente) | `docs/AUDIT-2026-09.md` |
| Vitrine | Page d'accueil, tarifs, FAQ, SEO (JSON-LD, OG, sitemap), CTA persistants | ✅ `/`, `/tarifs`, captures d'écran réelles de l'app, calculateur de marge sur le domaine | `components/marketing/` |

## Non couvert par cet environnement

- Aucun test contre Stripe, Anthropic, Gemini, OpenAI, Resend, R2 ou Postgres Railway réels : les adaptateurs sont testés avec des réponses simulées et PGlite. La première mise en production doit passer par l'environnement `staging` avec de vraies clés (voir `ENVIRONNEMENTS.md`).
- L'app native Expo est un socle (phase 2), pas un produit livrable.
- Les pages légales doivent être validées juridiquement et les mentions légales complétées (raison sociale, SIREN, hébergeur, médiateur).
