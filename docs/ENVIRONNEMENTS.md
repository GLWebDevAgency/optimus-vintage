# Environnements et mise en production

## Branches et promotion

```
feature/* ──PR──▶ main ──PR──▶ staging ──PR──▶ production
                  │              │                │
                  CI             déploie          déploie (approbation manuelle*)
                                 staging.chine.app   chine.app
```

\* Sous réserve du plan GitHub : voir « Approbation manuelle en production » plus bas.

| Branche | Rôle | Déclenche |
|---|---|---|
| `main` | Intégration continue. Toujours verte. | `CI` : lint, typecheck, tests, build, e2e |
| `staging` | Recette. Miroir de la production avec des clés de test (Stripe test, bucket R2 dédié, IA réelle). | `Deploy · staging` : vérification puis `railway up` sur l'environnement Railway `staging` |
| `production` | Ce que voient les clients. | `Deploy · production` : vérification, e2e, **approbation manuelle** (environnement GitHub `production`, indisponible avec le plan actuel — voir plus bas), `railway up`, étiquette `vAAAA.MM.JJ-sha` |

Promotion : ouvrir une PR `main → staging`, puis `staging → production` (fast-forward, pas de cherry-pick). Un correctif urgent part de `production` (`hotfix/*`), est fusionné dans `production` puis rétro-porté dans `main`.

## Railway

Deux environnements dans un même projet, chacun avec son Postgres et son service `web` construit depuis `apps/web/Dockerfile` (`railway.json` à la racine). Health check sur `/api/ready`.

```bash
npm i -g @railway/cli && railway login
cp deploy/railway/staging.env.example deploy/railway/staging.env       # renseigner les secrets
cp deploy/railway/production.env.example deploy/railway/production.env
./deploy/railway/bootstrap.sh
```

Le script crée le projet, les deux environnements, un Postgres par environnement, le service `web`, et pousse les variables. Il ne touche ni à Cloudflare R2 (bucket, règle CORS : voir `LANCEMENT.md`) ni aux réglages du tableau de bord. Trois réglages restent manuels : la source GitHub (branche `staging` / `production`) si tu préfères le déclencheur Railway aux GitHub Actions, les domaines publics, et les jetons de projet.

### `RAILWAY_DOCKERFILE_PATH` — variable de service obligatoire

`railway.json` déclare bien `builder: DOCKERFILE` et `dockerfilePath: apps/web/Dockerfile`, mais **Railway ignore ce fichier lors d'un `railway up` sur un service créé vide** — celui que produit `railway add --service web` dans `bootstrap.sh`. Il lance alors son constructeur automatique *railpack*, ne trouve rien à démarrer à la racine du monorepo et s'arrête sur `No start command detected`.

La variable de service ci-dessous est ce qui force réellement la construction par Dockerfile. Elle est **obligatoire**, sur chaque environnement, avant le premier déploiement :

```bash
railway variables --service web --environment staging    --set "RAILWAY_DOCKERFILE_PATH=apps/web/Dockerfile"
railway variables --service web --environment production --set "RAILWAY_DOCKERFILE_PATH=apps/web/Dockerfile"
```

Elle figure aussi dans `deploy/railway/staging.env.example` et `production.env.example` (ligne 25), donc `bootstrap.sh` la pousse si les fichiers `.env` en sont dérivés — la commande ci-dessus sert à la poser sur un environnement déjà créé.

### `.railwayignore` — ce qui part dans l'archive

`railway up` téléverse une archive du dépôt, puis construit à distance. Il **indexe l'arborescence avant d'appliquer `.dockerignore`** : un seul lien symbolique cassé, n'importe où dans l'arbre, fait échouer l'indexation avec un message peu parlant du type `IO error for operation on <chemin> : No such file or directory`. Le dépôt en contient (outillage d'agents archivé sous `legacy/optimus-vintage/.gemini/skills/`, `.opencode/skills/`, `.agent/skills/`), d'où le `.railwayignore` à la racine qui exclut `legacy/` et les dossiers d'outillage. Ne pas le supprimer.

Les deux fichiers agissent à des moments différents et ne sont pas interchangeables :

| Fichier | Lu par | Effet |
|---|---|---|
| `.railwayignore` | la CLI Railway, à l'indexation, **avant l'envoi** | décide ce qui part dans l'archive ; un chemin exclu ici n'existe pas du tout côté Railway |
| `.dockerignore` | le démon Docker, **au build** | décide ce qui entre dans le contexte de build, donc dans le `COPY . .` du Dockerfile |

Ce qui est exclu de l'archive est de fait absent du contexte de build : garder les deux listes alignées, `.railwayignore` étant le sur-ensemble.

### Variables inlinées au build et commit servi

Next.js inline les variables `NEXT_PUBLIC_*` et la configuration Sentry au moment du build : elles sont déclarées en `ARG` dans `apps/web/Dockerfile` (Railway ne transmet une variable au build Docker que si elle est déclarée). Le jeton Sentry des source maps (`SENTRY_AUTH_TOKEN`) est déclaré en `ARG`, comme les autres, et **non monté en secret de build** : `--mount=type=secret` n'est pas fourni par Railway, qui refuse le Dockerfile qui l'utilise (« other mount types are not supported »). Ce n'est donc pas un secret au sens Docker — il vit dans une couche du stage intermédiaire `build`, jamais publié (seul `runner` l'est, et il ne reprend ni cet `ARG` ni cet `ENV`) ; ne jamais le déclarer dans le stage final. Même contrainte pour `--mount=type=cache`, que Railway refuse aussi (« is missing the cacheKey prefix from its id »). `SENTRY_AUTH_TOKEN` n'est pas dans `deploy/railway/*.env.example` : sans cette variable de service, le build n'échoue pas mais les source maps ne sont pas téléversées et les traces de production restent minifiées. Le workflow pousse `APP_COMMIT` (SHA Git) avant `railway up` ; `/api/ready` et `/api/health` l'exposent et le déploiement n'est accepté que lorsque l'URL publique sert ce commit.

### Migrations

`CHINE_AUTO_MIGRATE=true` : les migrations Drizzle sont appliquées par la racine de composition (`packages/infrastructure/src/composition.ts:60`), et **pas au démarrage du processus**. Rien n'est ouvert à l'import (`apps/web/src/lib/container.ts` : « la première requête déclenche la construction ») : la composition — donc la migration — est déclenchée par la **première requête reçue**, en pratique la première sonde `/api/ready`.

Conséquence : toute la migration doit tenir dans le `healthcheckTimeout` de `railway.json` (**180 s**). Au-delà, Railway marque le déploiement en échec, mais n'interrompt rien de ce qui tourne : le conteneur poursuit sa migration jusqu'à son arrêt. L'état de la base au moment du verdict est donc indéterminé — au mieux le lot est annulé (Drizzle enveloppe les migrations en attente dans une transaction unique, `drizzle-orm/pg-core` → `dialect.migrate`), au pire il est validé juste après le verdict et laisse un schéma en avance sur le code que l'ancienne version continue de servir. Dans les deux cas, le déploiement est rouge sans que la cause apparaisse dans le health check.

Un déploiement dont la migration échoue franchement reste en échec (`/api/ready` répond 503) et l'ancienne version continue de servir.

Règle : **jouer les migrations lourdes à la main, avant le déploiement** (index sur grosse table, réécriture de colonne, backfill), sur la base cible, puis déployer le code :

```bash
DATABASE_URL=… pnpm db:migrate
```

### Secrets GitHub à créer

| Secret / variable | Où | Valeur |
|---|---|---|
| `RAILWAY_TOKEN_STAGING` | Secrets | Jeton de projet Railway, environnement staging |
| `RAILWAY_TOKEN_PRODUCTION` | Secrets | Jeton de projet Railway, environnement production |
| `STAGING_URL`, `PRODUCTION_URL` | Variables | URLs publiques (défaut `https://staging.chine.app`, `https://chine.app`) |
| `RAILWAY_SERVICE` | Variables | Nom du service (défaut `web`) |
| Environnement `production` | Settings → Environments | « Required reviewers » **si le plan le permet** — voir ci-dessous |

### Approbation manuelle en production — limite de plan

Les protections d'environnement GitHub (« Required reviewers », délai d'attente, branches autorisées) ne sont **pas disponibles sur un dépôt privé avec le plan de facturation actuel** : l'API répond `Please ensure the billing plan supports the required reviewers protection rule`. Le job `deploy` de `.github/workflows/deploy-production.yml` déclare bien `environment: production`, mais sans relecteur enregistré cet environnement **ne met rien en pause** : un `push` sur la branche `production` déploie directement.

Trois replis concrets :

1. **Passer le dépôt en public** — les environnements protégés sont gratuits sur les dépôts publics. À écarter ici tant que le code reste privé.
2. **Souscrire un plan payant** (GitHub Team ou Enterprise) — seule option qui rend l'approbation réellement bloquante sur un dépôt privé.
3. **N'autoriser la production que manuellement** — retirer le déclencheur `push: branches: [production]` de `deploy-production.yml` et ne garder que `workflow_dispatch` (déjà présent). Le déploiement ne part alors que sur une action humaine explicite depuis l'onglet Actions : pas d'approbation à deux personnes, mais plus de mise en production par simple fusion.

## Fournisseurs d'IA

L'expert IA est une chaîne de fournisseurs interchangeables, réglée par variables d'environnement :

```
APPRAISER_DRIVER=anthropic,gemini,openai   # ordre d'essai ; `auto` = fournisseurs dont la clé est présente
APPRAISER_TIMEOUT_MS=45000                 # délai maximal par tentative
ANTHROPIC_API_KEY=… ANTHROPIC_MODEL=claude-sonnet-5  ANTHROPIC_EFFORT=low   # ou claude-opus-5, claude-fable-5-1 (bien plus chers)
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
| `RAILWAY_DOCKERFILE_PATH` | — | `apps/web/Dockerfile` (obligatoire) | `apps/web/Dockerfile` (obligatoire) |

## Tâches de fond

Le processus web planifie lui-même, toutes les minutes (première passe 30 s après le démarrage) : relais de l'outbox d'événements, purge des compteurs de limitation de débit, des clés d'idempotence (24 h) et des événements Stripe traités (30 jours). Une seule instance Railway suffit ; `CHINE_JOBS=false` désactive le planificateur (par exemple sur une instance secondaire).

## Rollback

Railway conserve les images : « Redeploy » sur le déploiement précédent depuis le tableau de bord, ou `railway redeploy --service web --environment production`. Les migrations sont additives (jamais de suppression de colonne dans la même version que le code qui l'utilise), donc l'image précédente reste compatible avec le schéma courant.

## Sauvegardes

Activer les sauvegardes quotidiennes du Postgres Railway (onglet Backups) et tester une restauration sur staging une fois par trimestre. Les photos R2 sont versionnées par le bucket.
