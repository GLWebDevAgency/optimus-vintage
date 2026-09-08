# ADR 0002 — PWA Next.js avant l'app native

**Statut** : accepté · **Date** : 2026-09-08

## Décision
La v2 est une PWA Next.js 16 installable (iOS et Android), hors-ligne via service worker (Serwist) et file d'attente de mutations (Dexie). Expo est conservé comme socle de phase 2, branché sur le même contrat d'API.

## Motifs
Pas de store, mises à jour instantanées, une seule base de code, desktop gratuit pour le back-office, Stripe au lieu des commissions des stores.

## Limites acceptées
Achats in-app Apple impossibles (Stripe), push iOS seulement pour la PWA installée, scan de code-barres via WebAssembly.
