# Déploiement

Chiné se déploie comme **une image Docker** (Next.js en sortie « standalone ») sur Railway, avec un Postgres par environnement, Cloudflare R2 pour les photos, Stripe pour la facturation, Resend pour les e-mails, Sentry pour les erreurs. Le guide complet des environnements, des branches, des secrets et des runbooks est dans [`ENVIRONNEMENTS.md`](./ENVIRONNEMENTS.md).

| Brique | Service | Pourquoi |
|---|---|---|
| App web + API | **Railway** (service `web`, `apps/web/Dockerfile`) | Une image, un health check `/api/ready`, staging et production dans un même projet |
| Base de données | **Railway Postgres** | `DATABASE_URL` avec `sslmode=require` ; migrations Drizzle au démarrage (`CHINE_AUTO_MIGRATE=true`) |
| Photos | **Cloudflare R2** | S3 compatible, egress gratuit, upload direct depuis le navigateur |
| Facturation | **Stripe** | Checkout (essai sans carte), Customer Portal, webhooks signés et idempotents, Stripe Tax optionnel |
| E-mails | **Resend** | Vérification d'adresse, mot de passe oublié — obligatoire en production |
| IA | **Chaîne de fournisseurs** : Claude (`claude-fable-5-1`), Gemini, OpenAI | Même schéma JSON strict partout, repli automatique ; voir ADR 0005 |
| Erreurs | **Sentry** (activé par DSN) | Serveur et client, sans donnée personnelle |

## En bref

1. `./deploy/railway/bootstrap.sh` crée le projet, les environnements `staging` et `production`, un Postgres chacun et le service `web`, puis pousse les variables des fichiers `deploy/railway/*.env`.
2. Les branches `staging` et `production` déclenchent les workflows `Deploy · staging` et `Deploy · production` (vérification, e2e, approbation manuelle en production, `railway up`, contrôle du commit servi, étiquette de version).
3. Variables inlinées au build (`NEXT_PUBLIC_*`, Sentry) : déclarées en `ARG` dans le Dockerfile, Railway les transmet au build. `APP_COMMIT` est poussé par le workflow avant chaque déploiement pour que `/api/ready` identifie la version servie.
4. L'image démarre par `apps/web/scripts/start.mjs`, qui écoute en double pile (`::`, requis par le réseau privé et les sondes Railway) quand l'hôte a IPv6 et retombe sur `0.0.0.0` sinon ; `BIND_HOST` force une adresse.

## Développement local

`pnpm dev` fonctionne intégralement sans clé : PGlite (Postgres embarqué dans `.data/pglite`), photos dans `.data/uploads`, expert IA de démonstration, e-mails affichés dans la console. `pnpm --filter @chine/web seed` crée un compte de démonstration avec trois mois d'activité (refusé en production). Idéal pour tester l'app sur téléphone via l'IP locale.
