# ADR 0001 — Monorepo Turborepo et architecture en couches

**Statut** : accepté · **Date** : 2026-09-08

## Contexte
L'ancienne app (Expo + Express) mélangeait accès aux données, calculs et écrans, avec quatre couches data superposées et une base mono-tenant. Une refonte est décidée (voir `docs/ANALYSE-APPROFONDIE-2026-09.md`).

## Décision
- Monorepo pnpm + Turborepo, TypeScript 7 strict partout.
- Couches : `domain` (pur) ← `application` (cas d'usage, ports) ← `infrastructure` (adaptateurs) ← `apps/web` (composition root, HTTP, UI).
- `contract` (Zod) est le seul contrat entre les apps et l'API ; `ui` et `i18n` sont partagés entre web et natif.
- Les cas d'usage sont des classes à responsabilité unique, injectées par constructeur, testées avec des adaptateurs en mémoire.

## Conséquences
- Ajouter une plateforme de vente = une grille de frais (donnée), pas du code.
- L'app Expo de phase 2 réutilise `domain`, `contract`, `ui/tokens`, `i18n` sans duplication.
