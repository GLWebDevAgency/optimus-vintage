# Chiné

> L'app des revendeurs de vêtements de seconde main : chiner, stocker, vendre, savoir ce qu'on gagne.

Monorepo Turborepo · TypeScript 7 · Next.js 16 PWA mobile-first + site vitrine · Expo (phase 2) · Postgres (PGlite en dev) · Domaine DDD · Stripe · Expert IA multi-fournisseurs.

## Structure

```
apps/
  web/              Next.js 16 — site vitrine, PWA installable, API /api/v1, écrans Aujourd'hui, Chiner, Stock, Ventes, Sources, Rapports, Étiquettes, Réglages
  mobile/           Expo SDK 57 — socle natif (phase 2) consommant les mêmes packages
packages/
  domain/           Cœur métier pur : Money, PurchaseSource, Item, Sale, grilles de frais 2026, floor price, rapports, plans et quotas
  application/      Cas d'usage (commandes / requêtes), ports, DTOs, adaptateurs en mémoire pour les tests
  infrastructure/   Drizzle (Postgres / PGlite), stockage photos (R2 / local), expert IA (Claude / Gemini / OpenAI / faux), Stripe, idempotence, limiteur, outbox, cycle de vie RGPD
  contract/         Schémas Zod de l'API + client HTTP typé (web et mobile)
  ui/               Design system « Selvedge » : tokens CSS + TS, composants React, motion
  i18n/             Messages FR / EN / DE et formatage
docs/
  ANALYSE-APPROFONDIE-2026-09.md   Audit de l'ancienne app et décision de refonte
  AUDIT-2026-09.md                 Audit complet de la refonte (379 constats, état tenu à jour)
  PRODUCTION-READINESS.md          Grille de conformité production
  DEPLOIEMENT.md, ENVIRONNEMENTS.md Railway, Docker, branches, secrets, runbooks
  design/                          Brand book Selvedge (page HTML vivante)
  adr/                             Décisions d'architecture (0001 → 0008)
deploy/railway/                    Bootstrap du projet Railway et variables par environnement
legacy/optimus-vintage/            Ancienne app Expo + API Express (archivée, non maintenue)
```

## Démarrer

```bash
corepack enable && pnpm install
cp .env.example .env            # tout fonctionne sans clé : PGlite, IA de démo, photos locales
pnpm dev                        # http://localhost:3000
pnpm --filter @chine/web seed   # compte de démonstration avec 3 mois d'activité
```

Sur iPhone : Safari → Partager → « Sur l'écran d'accueil ». Sur Android : Chrome propose l'installation.

## Commandes

| Commande | Effet |
|---|---|
| `pnpm dev` | App web en développement |
| `pnpm build` | Build de tous les packages puis de l'app |
| `pnpm test` | Tests unitaires et d'intégration (Vitest) |
| `pnpm typecheck` | TypeScript 7 sur tout le monorepo |
| `pnpm lint` | Biome (formatage et règles, bloquant en CI) |
| `pnpm --filter @chine/web e2e` | Playwright, viewport iPhone |
| `pnpm db:generate` / `pnpm db:migrate` | Migrations Drizzle |

## Offre

| Plan | Prix | Ce qu'il débloque |
|---|---|---|
| Gratuit | 0 € | 50 pièces en stock (une vente libère une place), 3 lots ou palettes par mois, 10 expertises IA par mois, export CSV |
| Chineur | 6,99 €/mois ou 59 €/an | 500 pièces, sources illimitées, 200 expertises, textes d'annonce, analytique avancée, rapport mensuel |
| Pro | 14,99 €/mois ou 129 €/an | Stock illimité, 1 000 expertises, export comptable, étiquettes QR |
| Atelier | liste d'attente | Multi-utilisateurs, API, marque blanche (non vendu tant que non livré) |

Essai de 14 jours sans carte sur les plans payants ; quotas appliqués côté serveur (`402 QUOTA_EXCEEDED`) ; détail dans l'ADR 0007 et `apps/web/src/components/marketing/pricing.ts`.

## État de vérification

| Vérification | Résultat |
|---|---|
| Tests unitaires et d'intégration | 343 (domaine 33, application 43, infrastructure 113 sur PGlite, contrat 26, i18n 22, ui 22, web 84) |
| E2E Playwright (iPhone 14) | 11 parcours, dont inscription → chine → vente → source amortie, le pipeline hors-ligne et les captures d'écran de référence |
| Typecheck TypeScript 7, Biome, build Next.js | verts sur tout le monorepo (`pnpm turbo run lint typecheck test build`) |
| Grille de conformité production | `docs/PRODUCTION-READINESS.md` |
| Audit complet et suivi des corrections | `docs/AUDIT-2026-09.md` |

## Principes

- **Le domaine ne dépend de rien.** Money en centimes entiers, invariants dans les agrégats, événements de domaine, `Result` pour les erreurs attendues.
- **Multi-tenant natif.** Chaque table métier porte `workspace_id` ; un espace de travail = un compte reseller, prêt pour le multi-utilisateur.
- **Hors-ligne d'abord.** Le mode Chiner fonctionne sans réseau : lectures en cache, écritures en file d'attente rejouée au retour du réseau, chaque mutation rejouée au plus une fois côté serveur (`X-Outbox-Id`).
- **Un seul contrat d'API** pour le web et le natif.
- **Les plans sont appliqués par le serveur**, le plan est possédé par les webhooks Stripe, l'interface ne fait qu'afficher ce que l'API décide.
- **Aucune dépendance à un fournisseur d'IA** : même schéma JSON strict pour Claude, Gemini et OpenAI, repli automatique, modèle servi tracé.
