# ADR 0007 — Plans, quotas et facturation

**Statut** : accepté · **Date** : 2026-09-09

**Modèle.** La formule gratuite est limitée par le nombre de **pièces en stock** (IN_STOCK, LISTED, RESERVED, RETURNED) : une vente libère une place ; rien n'est jamais supprimé. Les formules payantes relèvent la limite et débloquent le suivi complet. La grille (`packages/domain/src/billing/plans.ts`) est une donnée : limites, fonctionnalités, prix en centimes, disponibilité (`sale` / `waitlist`). Une formule dont les fonctionnalités ne sont pas livrées (Atelier : équipes, API, marque) n'est pas vendue.

**Quotas.** Vérifiés dans les cas d'usage (`ensureQuota`, `ensureFeature`) et exposés par `GET /me` avec la décision (restant, plan conseillé). Les achats à l'unité ne consomment pas le quota mensuel de sources. Le client pré-vérifie la limite de pièces avant une capture pour ne jamais échouer à la synchronisation.

**Facturation.** Stripe via son API REST, sans SDK. Checkout avec essai de 14 jours sans carte (un seul par espace), Stripe Tax optionnel, `Idempotency-Key` sur chaque appel. La colonne `workspaces.plan` **appartient aux webhooks** : l'agrégat `Workspace` la lit, ne l'écrit jamais après la création. Les webhooks sont idempotents (`stripe_events`), ordonnés (`billing_synced_at`) et ignorent la fin d'un abonnement remplacé. Un espace déjà abonné est envoyé au portail plutôt qu'à un second Checkout. La suppression d'un compte résilie l'abonnement et efface le client Stripe avant d'effacer les données.
