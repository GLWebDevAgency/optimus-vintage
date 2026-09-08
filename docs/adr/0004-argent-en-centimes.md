# ADR 0004 — L'argent est un entier en unités mineures

**Statut** : accepté · **Date** : 2026-09-08

`Money` porte `minor` (centimes) et `currency`. Aucune arithmétique flottante ; répartition exacte (algorithme de Fowler) pour allouer l'investissement d'un lot. En base : `bigint` + devise. En JSON : `{ minor, currency }`.
