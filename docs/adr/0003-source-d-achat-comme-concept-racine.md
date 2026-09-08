# ADR 0003 — « Source d'achat » remplace « Lot » comme concept racine

**Statut** : accepté · **Date** : 2026-09-08

## Décision
Toute pièce naît d'une `PurchaseSource` de type `LOT`, `PALLET`, `PICKING` ou `UNIT`. L'achat unitaire en brocante (mode Chiner) crée une source `UNIT` à la volée ; l'utilisateur ne voit jamais de « lot factice ».

## Motifs
Le workflow réel mêle ballots Fleek, palettes et picking Eureka, vide-greniers et brocantes. Le prix plancher, l'amortissement et la performance se calculent par source quel que soit son type.
