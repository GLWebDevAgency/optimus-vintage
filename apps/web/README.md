# @chine/web — Chiné, la PWA

Application web mobile-first (Next.js 16, App Router, React 19.2) des revendeurs de vêtements de seconde main. Identité visuelle « Selvedge » (`docs/design/selvedge-identity.html`) : Calico le jour, Indigo la nuit, fil de lisière rouge, laiton, craie.

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
| `pnpm --filter @chine/web test` | Tests Vitest (`test/`) : routes API sur un Postgres embarqué isolé, auth, env. |
| `pnpm --filter @chine/web e2e` | Playwright (iPhone 14, Chromium). Construit et démarre le serveur sur le port 3100 ; `E2E_DEV=1` pour utiliser `next dev`. |
| `pnpm --filter @chine/web icons` | Régénère les icônes PWA (`scripts/generate-icons.mjs`, sharp). |
| `pnpm --filter @chine/web lint` | Biome. |

## Variables d'environnement

Validées au premier appel par `src/lib/env.ts` (zod). En production, une variable manquante ou invalide fait échouer la requête avec un message qui nomme la variable (jamais sa valeur). Modèle complet : `.env.example` à la racine.

| Variable | Obligatoire | Rôle |
| --- | --- | --- |
| `NODE_ENV` | — | `development` par défaut. En `production`, les règles ci-dessous s'appliquent. |
| `BETTER_AUTH_SECRET` | prod | Secret de signature des sessions, **32 caractères minimum**. Hors production, un secret de repli est utilisé. |
| `BETTER_AUTH_URL` | prod (ou `NEXT_PUBLIC_APP_URL`) | Origine publique (`https://chine.app`) : cookies, origines de confiance, liens d'e-mail. |
| `NEXT_PUBLIC_APP_URL` | — | Origine publique côté client (métadonnées, sitemap, client auth). |
| `DATABASE_URL` | — | Postgres (`postgres://…`, `?sslmode=require` derrière Railway/Neon). Vide → PGlite dans `CHINE_DATA_DIR/pglite`. |
| `CHINE_DATA_DIR` | — | Dossier de données locales (PGlite, photos en mode local). Défaut `.data`. |
| `CHINE_AUTO_MIGRATE` | — | `true` pour appliquer les migrations au démarrage sur Postgres (PGlite migre toujours). Sinon `pnpm db:migrate`. |
| `LOG_LEVEL` | — | `debug` \| `info` (défaut) \| `warn` \| `error` \| `silent` (défaut en test). |
| `RESEND_API_KEY`, `MAIL_FROM` | — | E-mails transactionnels (voir Mail). |
| `STORAGE_DRIVER`, `R2_*` | — | Photos (voir Photos). |
| `APPRAISER_DRIVER`, `GEMINI_API_KEY`, `GEMINI_MODEL` | — | Expert IA : `auto` choisit Gemini si la clé est présente, sinon l'expert de démonstration. |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_<PLAN>_<MONTHLY\|YEARLY>` | — | Facturation (voir Stripe). En production, `STRIPE_WEBHOOK_SECRET` est exigé dès que la clé secrète est définie. |

Tests e2e : `PW_CHROMIUM_PATH` pour pointer un Chromium précis (défaut `/opt/pw-browsers/chromium`), `PORT` pour le port du serveur de test.

## Authentification (Better Auth)

- Adaptateur Drizzle sur les tables `user`, `session`, `account`, `verification` de `@chine/infrastructure` ; identifiants UUID v7.
- E-mail + mot de passe (8 caractères minimum). À la création d'un utilisateur, son espace de travail est créé immédiatement (`databaseHooks.user.create.after`) ; à défaut, la première requête API le crée.
- Vérification d'adresse à l'inscription et mot de passe oublié dès qu'un mailer est configuré (liens valables 1 h ; les autres sessions sont révoquées après réinitialisation). `requireEmailVerification` reste désactivé : un compte non vérifié peut utiliser l'app.
- Limitation de débit persistante (table `rate_limits`) : 10 tentatives / 15 min / IP sur connexion et inscription, 5 sur les flux d'e-mail, 60 / min sur le reste.
- Cookies `HttpOnly`, `SameSite=Lax`, `Secure` en production ; cache de session signé 5 min.

### Mail

- `RESEND_API_KEY` défini → Resend (API HTTP, sans SDK), expéditeur `MAIL_FROM` (défaut `Chiné <bonjour@chine.app>`, domaine à vérifier dans Resend).
- Sinon, hors production, les e-mails sont affichés dans la console du serveur (le lien est imprimé).
- Sinon, en production, la vérification d'e-mail et le mot de passe oublié sont désactivés explicitement et journalisés une fois au démarrage.

## API `/api/v1`

Le contrat (`@chine/contract`) est la source unique : chaque handler valide la query et le corps avec les schémas Zod du contrat (`400 VALIDATION_FAILED` avec l'arbre d'erreurs), appelle un cas d'usage de `@chine/application`, puis convertit le `Result` en `{ data }` (200/201) ou `{ error: { code, message, details? } }`. Hors production, chaque réponse est aussi validée contre le schéma de réponse : une dérive contrat ↔ serveur fait échouer le test.

- Enveloppe `withAuth` : session (401), contrôle d'origine sur les mutations (`Sec-Fetch-Site` / `Origin`, 403), espace de travail résolu et mémorisé 60 s, limite de débit par espace (429 + `Retry-After`), `X-Request-Id` (UUID v7) sur chaque réponse, journal JSON (`level, msg, requestId, userId, route, status, durationMs` — jamais de corps ni de secret).
- Codes → statuts : `src/lib/api/respond.ts` (`QUOTA_EXCEEDED`/`FEATURE_LOCKED` → 402, `INVALID_TRANSITION`/`PHOTO_LIMIT` → 409, `BILLING_UNAVAILABLE` → 503…).
- Client typé côté navigateur : `import { api } from "@/lib/api-client"` (`createApiClient` du contrat, `baseUrl: ""`) ; `apiFetch` reste disponible pour les appels hors table (upload local).

| Route | Rôle |
| --- | --- |
| `GET /me`, `PATCH /workspace/settings` | Espace, utilisateur, quotas, facturation ; réglages (devise, marge cible, grilles de frais, seuil de dormance, objectif mensuel). |
| `GET /dashboard?period=` | Synthèse `7d`, `30d`, `month`, `3m`, `year`, `all`. |
| `GET/POST /sources`, `GET/PATCH/DELETE /sources/:id`, `POST /sources/:id/receive`, `POST /sources/:id/pieces` | Sources d'achat avec performance ; réception ; génération de pièces. |
| `GET/POST /items`, `GET/PATCH/DELETE /items/:id`, `POST /items/:id/status` | Stock. `POST /items` en capture rapide est **idempotent par `clientId`** (rejeu hors ligne : 201 puis 200 avec la même pièce). |
| `POST /items/:id/photos`, `DELETE /items/:id/photos/:photoId`, `PUT /items/:id/photos/order` | Photos d'une pièce. |
| `GET/POST /sales`, `GET/PATCH /sales/:id`, `POST /sales/:id/cancel`, `POST /sales/:id/refund` | Ventes et leur économie. |
| `POST /appraisals`, `GET /appraisals/:id` | Expertise IA (fonctionnalité et quota selon le plan). |
| `POST /uploads`, `PUT /photos/upload/…`, `GET /photos/…` | Photos (voir ci-dessous). |
| `POST /billing/checkout`, `POST /billing/portal`, `POST /billing/webhook` | Stripe. |
| `GET /account/export`, `DELETE /account` | RGPD : export JSON téléchargeable ; suppression définitive (`{ "confirm": "SUPPRIMER" }`). |

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

La CSP autorise automatiquement `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com` (upload) et l'origine de `R2_PUBLIC_BASE_URL` dans `connect-src` ; `img-src` accepte tout `https:`.

## Stripe

1. Créer les produits et prix, puis renseigner `STRIPE_SECRET_KEY` et `STRIPE_PRICE_PREMIUM_MONTHLY`, `STRIPE_PRICE_PREMIUM_YEARLY`, `STRIPE_PRICE_PRO_*`, `STRIPE_PRICE_BUSINESS_*` (un prix manquant rend le plan non vendable : `503 BILLING_UNAVAILABLE`).
2. Déclarer un endpoint webhook `https://chine.app/api/v1/billing/webhook` avec les événements `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, et copier son secret dans `STRIPE_WEBHOOK_SECRET`. La signature est vérifiée sur le corps brut (400 sinon) ; le plan de l'espace est synchronisé dans `workspaces.plan`.
3. Sans `STRIPE_SECRET_KEY`, `POST /billing/checkout` et `/billing/portal` répondent `503 BILLING_UNAVAILABLE` avec un message clair, et le webhook n'existe pas (404). Aucune redirection factice.

## Santé

| Route | Réponse |
| --- | --- |
| `GET /api/health` | `{ data: { status: "ok" \| "degraded", version, uptimeSeconds, checks: { database: { ok, driver, latencyMs }, storage: { driver }, appraiser: { driver }, billing: { configured }, mail: { configured } } } }` — `SELECT 1` borné à 2 s ; 503 si dégradé. Aucun secret. |
| `GET /api/ready` | `{ data: { ready: true } }` dès que le conteneur est construit et que la base répond, 503 sinon (sonde de disponibilité). |
| `GET /api/v1/health` | `{ data: { status: "ok" } }` sans dépendance (sonde légère, utilisée par les e2e). |

## Sécurité

- CSP dans `next.config.ts` (`blob:`/`data:` pour les aperçus caméra, R2 dans `connect-src`), `X-Frame-Options: DENY`, HSTS, `Permissions-Policy`.
- `X-Robots-Tag: noindex, nofollow` sur `/app` et `/api` (proxy et en-têtes statiques).
- Les clés de photo référencées par une pièce doivent appartenir à l'espace courant (400 sinon) ; toutes les lectures SQL sont scopées par `workspace_id`.
- Les identifiants de route (`:id`) inconnus ou d'un autre espace répondent 404, jamais 403 (pas d'énumération).

## Migrations

`packages/infrastructure/drizzle/` : `0002_item_client_id_workspace_prefs.sql` ajoute `items.client_id` (index unique `(workspace_id, client_id)`, idempotence des captures hors ligne) et `workspaces.dormant_threshold_days`. Postgres : `pnpm db:migrate` (ou `CHINE_AUTO_MIGRATE=true`) ; PGlite migre au démarrage.

## Structure

```
src/
  app/                    routes (App Router)
    page.tsx              landing marketing
    legal/…               CGU, confidentialité
    auth/…                connexion, inscription, déconnexion (route handler)
    (app)/app/…           coquille mobile : Aujourd'hui, Chiner, Stock, Ventes, Sources, Réglages
    api/v1/…              API du contrat (un dossier par chemin)
    api/health, api/ready sondes
    api/auth/[...all]     Better Auth
    offline/              page de repli hors ligne (précachée par le service worker)
  lib/
    env.ts                validation de l'environnement (zod), secret de repli hors production
    log.ts                journal JSON structuré, sans dépendance
    container.ts          racine de composition (createAppDependencies), singleton par processus
    auth.ts               Better Auth : adaptateur Drizzle, mail, limiteur, hook d'espace
    mail.ts               port Mailer : Resend (HTTP) ou console
    api/                  with-auth (session, CSRF, limite, journal), respond, route (validation), mappers (application → contrat), loaders, photos, db/queries
    api-client.ts         client typé du contrat + apiFetch
    offline/…             file de mutations Dexie rejouée à la reconnexion
  proxy.ts                garde d'auth + noindex (Next 16 : « proxy », ex-middleware)
  sw.ts                   service worker Serwist
scripts/seed.ts           jeu de données de démonstration
test/                     Vitest : routes (PGlite isolé, session simulée), auth, env, enveloppes
```

## Hors ligne

- **Lecture** : TanStack Query persiste son cache dans IndexedDB (7 jours) ; l'API `/api/v1/*` en GET est servie réseau d'abord (10 s), puis cache.
- **Écriture** : `enqueue({ method, path, body })` (`src/lib/offline/outbox.ts`) stocke la mutation dans Dexie ; `replay()` la rejoue séquentiellement vers `/api/v1/*` à la reconnexion et au retour au premier plan. Un 4xx marque l'entrée en échec et arrête le rejeu ; une erreur réseau ou un 5xx réessaie plus tard. Les captures rapides portent un `clientId` : rejouer une création ne crée jamais de doublon.
- **UI** : `<SyncBadge />` dans la barre supérieure (« Hors ligne », « Sync plus tard · 2 », « 1 en échec »).

## Installer l'app (PWA)

**iPhone / iPad (Safari)** : ouvre le site, touche le bouton Partager, puis « Sur l'écran d'accueil ». L'app s'ouvre en plein écran, avec ses propres icônes, et fonctionne hors ligne une fois visitée.

**Android (Chrome)** : une bannière « Installer Chiné » apparaît ; sinon, menu ⋮ → « Installer l'application » (ou « Ajouter à l'écran d'accueil »). Des raccourcis « Chiner », « Stock », « Ventes » sont disponibles en appui long sur l'icône.

**Ordinateur (Chrome, Edge)** : icône d'installation dans la barre d'adresse.

Le service worker n'est actif que sur un build de production (`build` puis `start`), servi en HTTPS ou sur `localhost`.
