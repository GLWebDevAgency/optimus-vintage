# Chiné

> L'app des revendeurs de vêtements de seconde main : chiner, stocker, vendre, savoir ce qu'on gagne.

Monorepo Turborepo · TypeScript 7 · Next.js 16 PWA mobile-first · Expo (phase 2) · Postgres (PGlite en dev) · Domaine DDD.

## Structure

```
apps/
  web/              Next.js 16 — PWA installable, API /api/v1, écrans Aujourd'hui, Chiner, Stock, Ventes, Sources, Réglages
  mobile/           Expo SDK 57 — socle natif (phase 2) consommant les mêmes packages
packages/
  domain/           Cœur métier pur : Money, PurchaseSource, Item, Sale, frais par plateforme, floor price, rapports, plans
  application/      Cas d'usage (commandes / requêtes), ports, DTOs, adaptateurs en mémoire pour les tests
  infrastructure/   Drizzle (Postgres / PGlite), stockage photos (R2 / local), expert IA (Gemini / faux), Stripe, outbox
  contract/         Schémas Zod de l'API + client HTTP typé (web et mobile)
  ui/               Design system « Selvedge » : tokens CSS + TS, composants React, motion
  i18n/             Messages FR / EN / DE et formatage
docs/
  ANALYSE-APPROFONDIE-2026-09.md   Audit de l'ancienne app et décision de refonte
  design/                          Brand book Selvedge (page HTML vivante)
  adr/                             Décisions d'architecture
legacy/optimus-vintage/            Ancienne app Expo + API Express (archivée, non maintenue)
```

## Démarrer

```bash
corepack enable && pnpm install
cp .env.example .env            # tout fonctionne sans clé : PGlite, IA de démo, photos locales
pnpm dev                        # http://localhost:3000
```

Sur iPhone : Safari → Partager → « Sur l'écran d'accueil ». Sur Android : Chrome propose l'installation.

## Commandes

| Commande | Effet |
|---|---|
| `pnpm dev` | App web en développement |
| `pnpm build` | Build de tous les packages puis de l'app |
| `pnpm test` | Tests unitaires et d'intégration (Vitest) |
| `pnpm typecheck` | TypeScript 7 sur tout le monorepo |
| `pnpm lint` | Biome |
| `pnpm --filter @chine/web e2e` | Playwright, viewport iPhone |
| `pnpm db:generate` / `pnpm db:migrate` | Migrations Drizzle |

## Principes

- **Le domaine ne dépend de rien.** Money en centimes entiers, invariants dans les agrégats, événements de domaine, `Result` pour les erreurs attendues.
- **Multi-tenant natif.** Chaque table métier porte `workspace_id` ; un espace de travail = un compte reseller, prêt pour le multi-utilisateur.
- **Hors-ligne d'abord.** Le mode Chiner fonctionne sans réseau : lectures en cache, écritures en file d'attente rejouée au retour du réseau.
- **Un seul contrat d'API** pour le web et le natif.
