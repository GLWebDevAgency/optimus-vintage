# ADR 0006 — Hors ligne d'abord, rejeu idempotent

**Statut** : accepté · **Date** : 2026-09-09

Le mode Chiner doit fonctionner dans une cave sans réseau. Côté client, les lectures passent par un cache de requêtes persisté (TanStack Query + IndexedDB) et un service worker ; les écritures partent dans une **file locale** (Dexie) : commandes (`outbox`) et photos en attente (`pendingPhotos`). Chaque entrée porte un UUID généré localement.

Côté serveur, ce même UUID est la **clé d'idempotence** : la création d'une pièce est dédoublonnée par `client_id` ; toute autre mutation envoie `X-Outbox-Id`, mémorisé dans `idempotency_keys` avec la réponse d'origine. Un rejeu après réponse perdue renvoie la même réponse sans réécrire ; un doublon simultané reçoit 409 ; un échec serveur libère la clé. Les clés sont purgées après 24 h par les tâches de fond.

Conséquences : une action refusée par le serveur (quota, pièce vendue entre-temps) est visible dans le bandeau hors ligne et s'abandonne à l'unité, sans bloquer la file ; la déconnexion efface caches et files locales (appareil partagé).
