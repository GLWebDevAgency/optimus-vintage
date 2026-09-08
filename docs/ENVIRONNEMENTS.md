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
APPRAISER_DRIVER=anthropic,gemini,openai   # ordre d'essai ; repli automatique sur le suivant
ANTHROPIC_MODEL=claude-fable-5-1           # ou claude-opus-5, claude-sonnet-5
GEMINI_MODEL=gemini-2.5-flash              # ou toute version plus récente (gemini-3.x-flash)
OPENAI_MODEL=                              # identifiant exact du modèle OpenAI voulu
```

Chaque fournisseur reçoit le même schéma JSON strict et rend le même `Appraisal`. Un fournisseur qui échoue (délai, quota, refus, sortie invalide) passe la main au suivant ; le fournisseur et le modèle réellement utilisés sont enregistrés sur chaque expertise. `GET /api/health` affiche la chaîne active. L'expert de démonstration (`fake`) est refusé en production sauf mention explicite.

## Matrice des variables

| Variable | Dev | Staging | Production |
|---|---|---|---|
| `DATABASE_URL` | vide (PGlite) | Postgres Railway | Postgres Railway |
| `STORAGE_DRIVER` | local | r2 (bucket staging) | r2 |
| `APPRAISER_DRIVER` | auto (fake sans clé) | anthropic,gemini | anthropic,gemini |
| `STRIPE_*` | vide | clés `sk_test_` | clés `sk_live_` |
| `RESEND_API_KEY` | vide (console) | test | production |
| `SENTRY_*` | vide | DSN staging, trace 30 % | DSN production, trace 10 % |
| `CHINE_AUTO_MIGRATE` | implicite | true | true |

## Rollback

Railway conserve les images : « Redeploy » sur le déploiement précédent depuis le tableau de bord, ou `railway redeploy --service web --environment production`. Les migrations sont additives (jamais de suppression de colonne dans la même version que le code qui l'utilise), donc l'image précédente reste compatible avec le schéma courant.

## Sauvegardes

Activer les sauvegardes quotidiennes du Postgres Railway (onglet Backups) et tester une restauration sur staging une fois par trimestre. Les photos R2 sont versionnées par le bucket.
