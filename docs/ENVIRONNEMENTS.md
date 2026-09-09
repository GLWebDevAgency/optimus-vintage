# Environnements et mise en production

## Branches et promotion

```
feature/* ──PR──▶ main ──PR──▶ staging ──PR──▶ production
                  │              │                │
                  CI             déploie          déploie (approbation manuelle)
                                 staging.chine.app   chine.app
```

| Branche | Rôle | Déclenche |
|---|---|---|
| `main` | Intégration continue. Toujours verte. | `CI` : lint, typecheck, tests, build, e2e |
| `staging` | Recette. Miroir de la production avec des clés de test (Stripe test, bucket R2 dédié, IA réelle). | `Deploy · staging` : vérification puis `railway up` sur l'environnement Railway `staging` |
| `production` | Ce que voient les clients. | `Deploy · production` : vérification, e2e, **approbation manuelle** (environnement GitHub `production`), `railway up`, étiquette `vAAAA.MM.JJ-sha` |

Promotion : ouvrir une PR `main → staging`, puis `staging → production` (fast-forward, pas de cherry-pick). Un correctif urgent part de `production` (`hotfix/*`), est fusionné dans `production` puis rétro-porté dans `main`.

## Railway

Deux environnements dans un même projet, chacun avec son Postgres et son service `web` construit depuis `apps/web/Dockerfile` (`railway.json` à la racine). Health check sur `/api/ready`.

```bash
npm i -g @railway/cli && railway login
cp deploy/railway/staging.env.example deploy/railway/staging.env       # renseigner les secrets
cp deploy/railway/production.env.example deploy/railway/production.env
./deploy/railway/bootstrap.sh
```

Le script crée le projet, les deux environnements, un Postgres par environnement, le service `web`, et pousse les variables. Trois réglages restent manuels dans le tableau de bord : la source GitHub (branche `staging` / `production`) si tu préfères le déclencheur Railway aux GitHub Actions, les domaines publics, et les jetons de projet.

### Variables inlinées au build et commit servi

Next.js inline les variables `NEXT_PUBLIC_*` et la configuration Sentry au moment du build : elles sont déclarées en `ARG` dans `apps/web/Dockerfile` (Railway ne transmet une variable au build Docker que si elle est déclarée). Le jeton Sentry des source maps est monté en secret de build (`SENTRY_AUTH_TOKEN`), jamais copié dans une couche. Le workflow pousse `APP_COMMIT` (SHA Git) avant `railway up` ; `/api/ready` et `/api/health` l'exposent et le déploiement n'est accepté que lorsque l'URL publique sert ce commit.

### Migrations

`CHINE_AUTO_MIGRATE=true` : le serveur applique les migrations Drizzle au démarrage, avant de répondre au health check. Un déploiement dont la migration échoue reste en échec et l'ancienne version continue de servir. Pour les migrations lourdes, les jouer à la main avant le déploiement : `DATABASE_URL=... pnpm db:migrate`.

### Secrets GitHub à créer

| Secret / variable | Où | Valeur |
|---|---|---|
| `RAILWAY_TOKEN_STAGING` | Secrets | Jeton de projet Railway, environnement staging |
| `RAILWAY_TOKEN_PRODUCTION` | Secrets | Jeton de projet Railway, environnement production |
| `STAGING_URL`, `PRODUCTION_URL` | Variables | URLs publiques (défaut `https://staging.chine.app`, `https://chine.app`) |
| `RAILWAY_SERVICE` | Variables | Nom du service (défaut `web`) |
| Environnement `production` | Settings → Environments | Cocher « Required reviewers » |

## Fournisseurs d'IA

L'expert IA est une chaîne de fournisseurs interchangeables, réglée par variables d'environnement :

```
APPRAISER_DRIVER=anthropic,gemini,openai   # ordre d'essai ; `auto` = fournisseurs dont la clé est présente
APPRAISER_TIMEOUT_MS=45000                 # délai maximal par tentative
ANTHROPIC_API_KEY=… ANTHROPIC_MODEL=claude-fable-5-1  ANTHROPIC_EFFORT=low   # ou claude-opus-5, claude-sonnet-5
GEMINI_API_KEY=…    GEMINI_MODEL=gemini-2.5-flash      # ou toute version plus récente (gemini-3.x-flash)
OPENAI_API_KEY=…    OPENAI_MODEL=…                      # identifiant exact du modèle vision OpenAI (obligatoire si openai est listé)
```

Règles :

- Chaque fournisseur reçoit le même prompt versionné et le même schéma JSON strict (`packages/infrastructure/src/ai/schema.ts`), et rend le même `Appraisal`. Le fournisseur, le modèle réellement servi et la latence sont enregistrés sur chaque expertise.
- Le routeur passe au fournisseur suivant sur délai dépassé, quota (429), refus, sortie invalide ou erreur 5xx. Une erreur de configuration (clé invalide, requête 400) interrompt la chaîne : la rejouer ailleurs masquerait le problème.
- Un fournisseur listé sans clé (ou `openai` sans `OPENAI_MODEL`) fait échouer le démarrage avec `NOT_CONFIGURED`.
- `fake` n'entre jamais dans la chaîne `auto` en production ; sans clé, la chaîne est vide et l'expertise renvoie `NOT_CONFIGURED`.
- Changer de modèle (nouvelle version Gemini, nouveau modèle OpenAI) ne demande qu'une variable et un redéploiement, aucun code.
- `GET /api/health` expose `appraiser.chain` (`[{ provider, model }]`) et `appraiser.fake`.

## Matrice des variables

| Variable | Dev | Staging | Production |
|---|---|---|---|
| `DATABASE_URL` | vide (PGlite) | Postgres Railway | Postgres Railway |
| `STORAGE_DRIVER` | local | r2 (bucket staging) | r2 |
| `APPRAISER_DRIVER` | auto (fake sans clé) | anthropic,gemini | anthropic,gemini |
| `STRIPE_*` | vide | clés `sk_test_` | clés `sk_live_` |
| `SENTRY_*` | vide | DSN staging, trace 30 % | DSN production, trace 10 % |
| `CHINE_AUTO_MIGRATE` | implicite | true | true |
| `RESEND_API_KEY` | vide (console) | test | production (obligatoire, sinon `CHINE_ALLOW_NO_MAILER=true`) |
| `STRIPE_AUTOMATIC_TAX` | false | false | true si Stripe Tax est activé sur le compte |
| `STRIPE_TRIAL_DAYS` | 14 | 14 | 14 (0 pour désactiver l'essai) |
| `CHINE_JOBS` | true | true | true (relais outbox, purges ; `false` pour désactiver) |
| `APP_COMMIT` | vide | poussé par le workflow | poussé par le workflow |
| `BIND_HOST` | — | auto (`::` si IPv6, sinon `0.0.0.0`) | auto |

## Tâches de fond

Le processus web planifie lui-même, toutes les minutes (première passe 30 s après le démarrage) : relais de l'outbox d'événements, purge des compteurs de limitation de débit, des clés d'idempotence (24 h) et des événements Stripe traités (30 jours). Une seule instance Railway suffit ; `CHINE_JOBS=false` désactive le planificateur (par exemple sur une instance secondaire).

## Rollback

Railway conserve les images : « Redeploy » sur le déploiement précédent depuis le tableau de bord, ou `railway redeploy --service web --environment production`. Les migrations sont additives (jamais de suppression de colonne dans la même version que le code qui l'utilise), donc l'image précédente reste compatible avec le schéma courant.

## Sauvegardes

Activer les sauvegardes quotidiennes du Postgres Railway (onglet Backups) et tester une restauration sur staging une fois par trimestre. Les photos R2 sont versionnées par le bucket.
