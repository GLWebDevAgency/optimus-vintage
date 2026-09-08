# @chine/mobile — app native (phase 2)

Socle Expo SDK 57 + Expo Router. Il consomme les packages partagés du monorepo :

- `@chine/domain` : le cœur métier (Money, sources, pièces, ventes, frais, floor price) tourne tel quel en natif.
- `@chine/contract` : client HTTP typé vers `/api/v1` de l'app web.
- `@chine/ui/tokens` : palettes Calico / Indigo, échelle typographique et motion partagés.
- `@chine/i18n` : messages FR / EN / DE.

## Lancer

```bash
pnpm --filter @chine/mobile start
```

## Ce qui reste pour la phase 2

- Navigation par onglets identique au web (Aujourd'hui, Stock, Chiner, Ventes, Sources).
- Écrans branchés sur l'API via `@chine/contract` + TanStack Query.
- Caméra native (expo-camera), stockage hors-ligne (expo-sqlite), notifications push, achats in-app si la distribution store est retenue.
