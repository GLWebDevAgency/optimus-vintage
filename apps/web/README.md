# @chine/web — Chiné, la PWA

Application web mobile-first (Next.js 16, App Router, React 19.2) des revendeurs de vêtements de seconde main, et son site vitrine. Identité visuelle « Selvedge » (`docs/design/selvedge-identity.html`) : Calico le jour, Indigo la nuit, fil de lisière rouge, laiton, craie.

## Lancer

```bash
# depuis la racine du monorepo
pnpm install
cp .env.example .env            # tout fonctionne sans clé : PGlite, IA de démo, photos locales
pnpm --filter @chine/web dev    # http://localhost:3000 (Turbopack, service worker désactivé)
pnpm --filter @chine/web seed   # compte demo@chine.app / Chine-demo-2026! avec 3 mois d'activité
```

| Commande | Effet |
| --- | --- |
| `pnpm --filter @chine/web dev` | Développement (Turbopack). Le service worker est désactivé en dev. |
| `pnpm --filter @chine/web build` | Build de production (`next build --webpack`, requis par le plugin Serwist) : génère `public/sw.js`. |
| `pnpm --filter @chine/web start` | Sert le build. |
| `pnpm --filter @chine/web seed` | Jeu de données de démonstration (refusé si `NODE_ENV=production`, idempotent). |
| `pnpm --filter @chine/web typecheck` | `tsc --noEmit` (TypeScript 7). |
| `pnpm --filter @chine/web test` | Tests Vitest (`test/`) : routes API sur un Postgres embarqué isolé, idempotence, exports, auth, env. |
| `pnpm --filter @chine/web e2e` | Playwright (iPhone 14, Chromium). Construit et démarre le serveur sur le port 3100 ; `E2E_DEV=1` pour utiliser `next dev`. |
| `pnpm --filter @chine/web icons` | Régénère les icônes PWA (`scripts/generate-icons.mjs`, sharp). |
| `pnpm --filter @chine/web kpi -- 30` | Indicateurs de pilotage sur N jours, lus dans la base (`DATABASE_URL`) : inscriptions, activation, plans, MRR, crédits et coût IA, ventes. Lecture seule, sans donnée personnelle. |
| `pnpm --filter @chine/web lint` | Biome. |

## Variables d'environnement

Validées au premier appel par `src/lib/env.ts` (zod). En production, une variable manquante ou invalide fait échouer la requête avec un message qui nomme la variable (jamais sa valeur). Modèle complet : `.env.example` à la racine ; tableau par environnement dans `docs/ENVIRONNEMENTS.md`.

| Variable | Obligatoire | Rôle |
| --- | --- | --- |
| `NODE_ENV` | — | `development` par défaut. En `production`, les règles ci-dessous s'appliquent. |
| `BETTER_AUTH_SECRET` | prod | Secret de signature des sessions, **32 caractères minimum**. Hors production, un secret de repli est utilisé. |
| `BETTER_AUTH_URL` | prod (ou `NEXT_PUBLIC_APP_URL`) | Origine publique (`https://chine.app`) : cookies, origines de confiance, liens d'e-mail. |
| `NEXT_PUBLIC_APP_URL` | — | Origine publique côté client (métadonnées, sitemap, client auth). Inlinée au build (`ARG` du Dockerfile). |
| `DATABASE_URL` | — | Postgres (`postgres://…`, `?sslmode=require` derrière Railway/Neon). Vide → PGlite dans `CHINE_DATA_DIR/pglite`. |
| `CHINE_DATA_DIR` | — | Dossier de données locales (PGlite, photos en mode local). Défaut `.data`. |
| `CHINE_AUTO_MIGRATE` | — | `true` pour appliquer les migrations au démarrage sur Postgres (PGlite migre toujours). Sinon `pnpm db:migrate`. |
| `CHINE_JOBS` | — | `false` désactive les tâches de fond (relais d'outbox, purges) sur une instance secondaire. |
| `LOG_LEVEL` | — | `debug` \| `info` (défaut) \| `warn` \| `error` \| `silent` (défaut en test). |
| `RESEND_API_KEY`, `MAIL_FROM` | prod | E-mails transactionnels (voir Mail). En production, l'absence de clé est une erreur sauf `CHINE_ALLOW_NO_MAILER=true` (e2e, essai). |
| `STORAGE_DRIVER`, `R2_*` | — | Photos (voir Photos). |
| `APPRAISER_DRIVER`, `APPRAISER_TIMEOUT_MS` | — | Expert IA : `auto` (chaîne Claude → Gemini → OpenAI selon les clés présentes), un fournisseur, ou une liste ordonnée `anthropic,gemini`. `fake` n'entre dans la chaîne que s'il est nommé. |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `ANTHROPIC_EFFORT` | — | Claude (défaut `claude-sonnet-5`, effort `low` ; voir `docs/BUSINESS-PLAN.md` pour le coût par expertise). |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | — | Gemini (défaut `gemini-2.5-flash`). |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | — | OpenAI ; le modèle est obligatoire dès que le fournisseur est activé. |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_<PLAN>_<MONTHLY\|YEARLY>` | — | Facturation (voir Stripe). En production, `STRIPE_WEBHOOK_SECRET` est exigé dès que la clé secrète est définie. |
| `STRIPE_TRIAL_DAYS`, `STRIPE_AUTOMATIC_TAX` | — | Essai sans carte (défaut 14 jours, `0` pour désactiver) ; Stripe Tax (`true` une fois l'origine fiscale configurée dans Stripe). |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | — | Observabilité, activée par la seule présence du DSN. |
| `APP_COMMIT` | — | SHA servi, exposé par `/api/ready` et `/api/health` et utilisé comme release Sentry (poussé par les workflows de déploiement ; repli `RAILWAY_GIT_COMMIT_SHA`). |
| `BIND_HOST` | — | Adresse d'écoute de l'image Docker. Par défaut `scripts/start.mjs` choisit `::` (double pile, requis par Railway) si l'hôte a IPv6, sinon `0.0.0.0`. |

Tests e2e : `PW_CHROMIUM_PATH` pour pointer un Chromium précis (défaut `/opt/pw-browsers/chromium`), `PORT` pour le port du serveur de test.

## Authentification (Better Auth)

- Adaptateur Drizzle sur les tables `user`, `session`, `account`, `verification` de `@chine/infrastructure` ; identifiants UUID v7.
- E-mail + mot de passe (8 caractères minimum). À la création d'un utilisateur, son espace de travail est créé immédiatement (`databaseHooks.user.create.after`) ; à défaut, la première requête API le crée. Un utilisateur ne possède qu'un espace (index unique sur `owner_user_id`).
- Vérification d'adresse à l'inscription, mot de passe oublié (`/auth/mot-de-passe-oublie`) et réinitialisation (`/auth/reinitialiser`) dès qu'un mailer est configuré (liens valables 1 h ; les autres sessions sont révoquées après réinitialisation). `requireEmailVerification` reste désactivé : un compte non vérifié peut utiliser l'app.
- Limitation de débit persistante (table `rate_limits`) : 10 tentatives / 15 min / IP sur connexion et inscription, 5 sur les flux d'e-mail, 60 / min sur le reste.
- **IP de confiance** : `proxy.ts` calcule l'adresse cliente (`cf-connecting-ip`, sinon le dernier saut de `X-Forwarded-For`, sinon `x-real-ip`) et la transmet dans l'en-tête interne `x-chine-client-ip`, effacé s'il arrive de l'extérieur. Better Auth et les limiteurs de l'API lisent cet en-tête et rien d'autre (ADR 0008).
- Cookies `HttpOnly`, `SameSite=Lax`, `Secure` en production ; cache de session signé 5 min.
- Déconnexion : `POST /auth/deconnexion` (GET → 405) ; le client efface d'abord le cache persistant, les caches du service worker et les files Dexie (`clearDeviceData`) pour qu'un autre compte sur le même appareil ne voie rien du précédent.

### Mail

- `RESEND_API_KEY` défini → Resend (API HTTP, sans SDK), expéditeur `MAIL_FROM` (défaut `Chiné <bonjour@chine.app>`, domaine à vérifier dans Resend).
- Sinon, hors production, les e-mails sont affichés dans la console du serveur (le lien est imprimé).
- En production, l'absence de clé fait échouer la validation de l'environnement, sauf `CHINE_ALLOW_NO_MAILER=true` (la vérification d'e-mail et le mot de passe oublié sont alors désactivés explicitement et journalisés au démarrage).

## API `/api/v1`

Le contrat (`@chine/contract`) est la source unique : chaque handler valide la query et le corps avec les schémas Zod du contrat (`400 VALIDATION_FAILED` avec l'arbre d'erreurs), appelle un cas d'usage de `@chine/application`, puis convertit le `Result` en `{ data }` (200/201) ou `{ error: { code, message, details? } }`. Hors production, chaque réponse est aussi validée contre le schéma de réponse : une dérive contrat ↔ serveur fait échouer le test.

- Enveloppe `withAuth` : session (401), contrôle d'origine sur les mutations (`Sec-Fetch-Site` / `Origin`, 403), espace de travail résolu et mémorisé 60 s, limite de débit par espace (429 + `Retry-After`), `X-Request-Id` (UUID v7) sur chaque réponse, journal JSON (`level, msg, requestId, userId, route, status, durationMs` — jamais de corps ni de secret).
- **Idempotence** : toute mutation peut porter `X-Outbox-Id: <uuid>` (la file hors ligne le fait systématiquement). La première exécution mémorise la réponse (table `idempotency_keys`, 24 h) ; un rejeu la renvoie à l'identique avec `X-Idempotent-Replay: true` ; un doublon simultané reçoit `409 CONFLICT` ; un échec serveur libère la clé (ADR 0006).
- Corps bornés : 256 Ko par défaut, 12 Mo pour `POST /appraisals` (`413 PAYLOAD_TOO_LARGE`).
- Codes → statuts : `src/lib/api/respond.ts` (`QUOTA_EXCEEDED`/`FEATURE_LOCKED` → 402, `INVALID_TRANSITION`/`PHOTO_LIMIT`/`CONFLICT` → 409, `BILLING_UNAVAILABLE` → 503…). Un fournisseur d'IA en panne répond `503` + `Retry-After: 30` (délai, quota) ou `502 APPRAISAL_FAILED` ; rien n'est décompté.
- Client typé côté navigateur : `import { api } from "@/lib/api-client"` (`createApiClient` du contrat, `baseUrl: ""`) ; `apiFetch` reste disponible pour les appels hors table (upload local).

| Route | Rôle |
| --- | --- |
| `GET /me`, `PATCH /workspace/settings` | Espace, utilisateur, quotas (`used`, `limit`, `remaining`, `allowed`, `upgradeTo`), facturation (statut, période, essai) ; réglages (devise — figée dès qu'il existe des pièces —, marge cible, grilles de frais, seuil de dormance, objectif mensuel). |
| `GET /dashboard?period=` ou `?from=&to=` | Synthèse `7d`, `30d`, `month`, `3m`, `year`, `all`, ou un intervalle de dates ; `analytics` (sell-through, délai de vente, meilleures plateformes / sources / marques) sur les plans qui incluent `ADVANCED_ANALYTICS`, `null` sinon. |
| `GET/POST /sources`, `GET/PATCH/DELETE /sources/:id`, `POST /sources/:id/receive`, `POST /sources/:id/pieces` | Sources d'achat avec performance ; réception ; génération de pièces (préfixe de titre honoré). Le quota mensuel ne compte que les lots, palettes et pickings. |
| `GET/POST /items`, `GET/PATCH/DELETE /items/:id`, `POST /items/:id/status` | Stock. `POST /items` en capture rapide est **idempotent par `clientId`** (201 puis 200 avec la même pièce). `LIST` sur une pièce déjà en ligne clôt l'annonce précédente (reprise de prix, changement de plateforme). Une pièce qui a une vente, même annulée, ne se supprime pas (`409 HAS_SALES`). |
| `POST /items/:id/photos`, `DELETE /items/:id/photos/:photoId`, `PUT /items/:id/photos/order` | Photos d'une pièce. |
| `GET/POST /sales`, `GET/PATCH /sales/:id`, `POST /sales/:id/complete`, `POST /sales/:id/cancel`, `POST /sales/:id/refund` | Ventes et leur économie ; une pièce n'a jamais deux ventes en attente (`409`). |
| `POST /appraisals`, `GET /appraisals/:id` | Expertise IA : un crédit IA par appel (quota mensuel selon le plan, plus un garde-fou journalier 5 / 40 / 100 / 300), jetons facturés et coût estimé journalisés ; texte d'annonce si le plan inclut `AI_LISTING_COPY`. |
| `GET /export/items.csv`, `/export/sales.csv`, `/export/sources.csv`, `/export/comptabilite.csv` | Exports CSV (UTF-8 avec BOM, `;`, formules neutralisées). L'export comptable mensuel exige `ACCOUNTING_EXPORT` (Pro). |
| `POST /uploads`, `PUT /photos/upload/…`, `GET /photos/…` | Photos (voir ci-dessous). |
| `POST /billing/checkout`, `POST /billing/portal`, `POST /billing/webhook` | Stripe. |
| `GET /account/export`, `DELETE /account` | RGPD : export JSON téléchargeable ; suppression définitive (`{ "confirm": "SUPPRIMER" }`), abonnement Stripe résilié d'abord. |

Dans le corps d'un `PATCH`, `null` efface un champ facultatif (marque, notes, prix neuf…) ; une clé absente ne change rien.

## Photos

- **Local** (défaut, `STORAGE_DRIVER=local` ou aucune variable R2) : `POST /uploads` renvoie une URL `PUT /api/v1/photos/upload/<clé>` servie par l'app. Le fichier (15 Mo max) est reconnu par sa signature binaire (JPEG, PNG, WebP), puis normalisé par sharp : orientation appliquée, métadonnées EXIF/GPS retirées, 2048 px max, WebP qualité 82 ; la clé porte l'extension `.webp`. Lecture publique `GET /api/v1/photos/<clé>` avec `Cache-Control: public, max-age=31536000, immutable` (clés opaques UUID v7, par espace). 60 uploads / min / espace.
- **R2** (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`) : `POST /uploads` renvoie une URL pré-signée valable 10 min ; le navigateur envoie le fichier **directement à R2** (`PUT`, `Content-Type` imposé). Le bucket doit être exposé publiquement sur `R2_PUBLIC_BASE_URL` (domaine personnalisé ou `r2.dev`), et porter une règle CORS :

```json
[
  {
    "AllowedOrigins": ["https://chine.app"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

La CSP autorise `https://*.r2.cloudflarestorage.com` (upload) et l'origine de `R2_PUBLIC_BASE_URL` dans `connect-src` ; `img-src` accepte tout `https:`.

## Plans et Stripe

Plans (`@chine/domain`, `billing/plans.ts`) : **Gratuit** (50 pièces en stock, 3 lots ou palettes par mois, 10 crédits IA), **Chineur** 6,99 €/mois ou 59 €/an (500 pièces, sources illimitées, 100 crédits IA, textes d'annonce, analytique, rapport mensuel), **Pro** 14,99 €/mois ou 129 €/an (stock illimité, 300 crédits IA, export comptable, étiquettes QR), **Atelier** en liste d'attente. Une pièce vendue libère sa place ; au-delà de la limite, la capture est refusée (`402 QUOTA_EXCEEDED` avec `upgradeTo`) et l'écran Chiner affiche le paywall. Tarifs affichés par `components/marketing/pricing.ts`, contrat par ADR 0007.

1. Créer les produits et prix, puis renseigner `STRIPE_SECRET_KEY` et `STRIPE_PRICE_PREMIUM_MONTHLY`, `STRIPE_PRICE_PREMIUM_YEARLY`, `STRIPE_PRICE_PRO_*` (un prix manquant rend le plan non vendable : `503 BILLING_UNAVAILABLE`). Les plans en liste d'attente sont refusés au checkout.
2. Déclarer un endpoint webhook `https://chine.app/api/v1/billing/webhook` avec `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, et copier son secret dans `STRIPE_WEBHOOK_SECRET`. La signature est vérifiée sur le corps brut (400 sinon) ; chaque événement n'est traité qu'une fois (`stripe_events`), un événement plus ancien que l'état connu est ignoré, et le webhook est le **seul** propriétaire de `workspaces.plan`, `subscription_status`, `current_period_end`, `cancel_at_period_end`, `trial_ends_at`.
3. Le checkout offre un essai sans carte (`STRIPE_TRIAL_DAYS`, une seule fois par espace : `trial_used_at`), en `locale: auto`, avec Stripe Tax si `STRIPE_AUTOMATIC_TAX=true`. Un espace déjà abonné est renvoyé vers le portail au lieu d'un second abonnement. Les appels sortants portent une `Idempotency-Key` et un délai.
4. Sans `STRIPE_SECRET_KEY`, `POST /billing/checkout` et `/billing/portal` répondent `503 BILLING_UNAVAILABLE` avec un message clair, et le webhook n'existe pas (404). Aucune redirection factice.

## Santé

| Route | Réponse |
| --- | --- |
| `GET /api/health` | `{ data: { status: "ok" \| "degraded", version, commit, uptimeSeconds, checks: { database: { ok, driver, latencyMs }, storage: { driver }, appraiser: { driver, chain: [{ provider, model }], fake }, billing: { configured }, mail: { configured } } } }` — `SELECT 1` borné à 2 s ; 503 si dégradé. En production les identifiants de modèle sont masqués (`"•"`). Aucun secret. |
| `GET /api/ready` | `{ data: { ready: true, version, commit } }` dès que le conteneur est construit et que la base répond, 503 sinon (sonde de disponibilité ; les workflows de déploiement attendent le `commit` poussé). |
| `GET /api/v1/health` | `{ data: { status: "ok" } }` sans dépendance (sonde légère, utilisée par les e2e). |

## Tâches de fond

`src/lib/jobs.ts`, démarré par `instrumentation.ts` sur le runtime Node (première passe 30 s après le démarrage, puis toutes les minutes) : relais de l'outbox d'événements, purge des compteurs de débit expirés, des clés d'idempotence de plus de 24 h et des événements Stripe traités depuis plus de 30 jours. `CHINE_JOBS=false` le désactive.

## Sécurité

- CSP dans `next.config.ts` (`blob:`/`data:` pour les aperçus caméra, R2 dans `connect-src`), `X-Frame-Options: DENY`, HSTS, `Permissions-Policy`.
- `X-Robots-Tag: noindex, nofollow` sur `/app` et `/api` (proxy et en-têtes statiques).
- Les clés de photo référencées par une pièce doivent appartenir à l'espace courant (400 sinon) ; toutes les lectures SQL sont scopées par `workspace_id`.
- Les identifiants de route (`:id`) inconnus ou d'un autre espace répondent 404, jamais 403 (pas d'énumération).
- Corps bornés (413), IP cliente issue du seul en-tête interne, secrets jamais journalisés.

## Migrations

`packages/infrastructure/drizzle/` : `0002_item_client_id_workspace_prefs.sql` ajoute `items.client_id` (index unique `(workspace_id, client_id)`) et `workspaces.dormant_threshold_days` ; `0003_billing_state_idempotency.sql` ajoute l'état d'abonnement sur `workspaces`, l'unicité de `owner_user_id`, et les tables `stripe_events` et `idempotency_keys` ; `0004_appraisal_credits_tokens.sql` ajoute `credits`, `input_tokens` et `output_tokens` sur `appraisals`. Postgres : `pnpm db:migrate` (ou `CHINE_AUTO_MIGRATE=true`) ; PGlite migre au démarrage. Les migrations sont additives.

## Structure

```
src/
  app/                    routes (App Router)
    page.tsx              site vitrine (components/marketing/Landing)
    tarifs/               page tarifs
    legal/…               CGU, confidentialité, mentions légales
    auth/…                connexion, inscription, mot de passe oublié, réinitialisation, déconnexion (POST)
    (app)/app/…           coquille mobile : Aujourd'hui, Chiner, Stock, Ventes, Sources, Rapports, Étiquettes, Réglages
    api/v1/…              API du contrat (un dossier par chemin), export CSV
    api/health, api/ready sondes
    api/auth/[...all]     Better Auth
    offline/              page de repli hors ligne (précachée par le service worker)
  components/
    marketing/            vitrine : Hero, ProofReceipt, HowItWorks, Features, Calculator, Personas, Pricing, Compare, Trust, Faq, JsonLd…
    screens/              écrans de l'app (today, chiner, stock, sales, sources, reports, labels, settings, common)
  lib/
    env.ts                validation de l'environnement (zod), secret de repli hors production
    log.ts                journal JSON structuré, sans dépendance
    container.ts          racine de composition (createAppDependencies), singleton par processus
    jobs.ts               tâches de fond (relais, purges)
    auth.ts               Better Auth : adaptateur Drizzle, mail, limiteur, IP de confiance, hook d'espace
    session.ts            déconnexion et effacement des données de l'appareil
    csv.ts                sérialisation CSV sûre (BOM, formules neutralisées)
    api/                  with-auth (session, CSRF, limite, idempotence, journal), respond, route (validation, taille), request (IP), mappers, loaders, photos, db/queries
    api-client.ts         client typé du contrat + apiFetch
    offline/…             file de mutations Dexie rejouée à la reconnexion
  proxy.ts                garde d'auth, IP de confiance, noindex (Next 16 : « proxy », ex-middleware)
  sw.ts                   service worker Serwist
scripts/seed.ts           jeu de données de démonstration
test/                     Vitest : routes (PGlite isolé, session simulée), idempotence, fonctionnalités, auth, env, enveloppes
```

## Hors ligne

- **Lecture** : TanStack Query persiste son cache dans IndexedDB (7 jours) ; l'API `/api/v1/*` en GET est servie réseau d'abord (10 s), puis cache.
- **Écriture** : `enqueue({ method, path, body })` (`src/lib/offline/outbox.ts`) stocke la mutation dans Dexie ; `replay()` la rejoue séquentiellement vers `/api/v1/*` à la reconnexion et au retour au premier plan, avec `X-Outbox-Id` pour que le serveur ne l'exécute qu'une fois. Un 4xx marque l'entrée en échec et arrête le rejeu ; une erreur réseau ou un 5xx réessaie plus tard. Les captures rapides portent un `clientId` : rejouer une création ne crée jamais de doublon.
- **UI** : `<SyncBadge />` dans la barre supérieure (« Hors ligne », « Sync plus tard · 2 », « 1 en échec ») ; la bannière hors ligne ouvre la liste des actions en échec pour les abandonner.

## Installer l'app (PWA)

**iPhone / iPad (Safari)** : ouvre le site, touche le bouton Partager, puis « Sur l'écran d'accueil ». L'app s'ouvre en plein écran, avec ses propres icônes, et fonctionne hors ligne une fois visitée.

**Android (Chrome)** : une bannière « Installer Chiné » apparaît ; sinon, menu ⋮ → « Installer l'application » (ou « Ajouter à l'écran d'accueil »). Des raccourcis « Chiner », « Stock », « Ventes » sont disponibles en appui long sur l'icône.

**Ordinateur (Chrome, Edge)** : icône d'installation dans la barre d'adresse.

Le service worker n'est actif que sur un build de production (`build` puis `start`), servi en HTTPS ou sur `localhost`.
