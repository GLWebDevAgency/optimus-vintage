# @chine/web — Chiné, la PWA

Application web mobile-first (Next.js 16, App Router, React 19.2) des revendeurs de vêtements de seconde main. Identité visuelle « Selvedge » (`docs/design/selvedge-identity.html`) : Calico le jour, Indigo la nuit, fil de lisière rouge, laiton, craie.

## Lancer

```bash
# depuis la racine du monorepo
pnpm install
cp .env.example .env            # BETTER_AUTH_SECRET obligatoire (32 caractères minimum)
pnpm --filter @chine/web dev    # http://localhost:3000 (Turbopack, service worker désactivé)
```

| Commande | Effet |
| --- | --- |
| `pnpm --filter @chine/web dev` | Développement (Turbopack). Le service worker est désactivé en dev. |
| `pnpm --filter @chine/web build` | Build de production (`next build --webpack`, requis par le plugin Serwist) : génère `public/sw.js`. |
| `pnpm --filter @chine/web start` | Sert le build. |
| `pnpm --filter @chine/web typecheck` | `tsc --noEmit` (TypeScript 7). |
| `pnpm --filter @chine/web test` | Tests unitaires Vitest (`test/`). |
| `pnpm --filter @chine/web e2e` | Playwright (iPhone 14, Chromium). Construit et démarre le serveur sur le port 3100 ; `E2E_DEV=1` pour utiliser `next dev`. |
| `pnpm --filter @chine/web icons` | Régénère les icônes PWA (`scripts/generate-icons.mjs`, sharp). |
| `pnpm --filter @chine/web lint` | Biome. |

## Variables d'environnement

Voir `.env.example` à la racine. Utilisées par l'app web :

- `BETTER_AUTH_SECRET` (obligatoire en production), `BETTER_AUTH_URL` (ex. `https://chine.app`).
- `NEXT_PUBLIC_APP_URL` : origine publique (métadonnées, sitemap, client auth).
- `R2_PUBLIC_BASE_URL` : si défini, son hôte est autorisé pour `next/image`.
- `DATABASE_URL`, `CHINE_DATA_DIR` : consommés par `@chine/infrastructure` une fois branché (voir « À câbler »).

Tests e2e : `PW_CHROMIUM_PATH` pour pointer un Chromium précis (défaut `/opt/pw-browsers/chromium`), `PORT` pour le port du serveur de test.

## Structure

```
src/
  app/                    routes (App Router)
    page.tsx              landing marketing
    legal/…               CGU, confidentialité
    auth/…                connexion, inscription, déconnexion (route handler)
    (app)/app/…           coquille mobile : Aujourd'hui, Chiner, Stock, Ventes, Sources, Réglages
    api/v1/health         API : enveloppe { data } / { error }
    api/auth/[...all]     Better Auth
    offline/              page de repli hors ligne (précachée par le service worker)
    dev/ui/               emplacement du showcase @chine/ui
  components/
    brand/                TagMark (logo), Wordmark, glyphe « O » vectorisé
    shell/                TopBar, TabBar (CTA Chiner), PageSkeleton, Screen
    marketing/            sections de la landing, tarifs, FAQ
    offline/              SyncBadge, OutboxReplayer
    providers/            thème, TanStack Query persisté, toasts
    ui/                   Stitch (fil cousu), Tally (compteur), Reveal (entrée au scroll), icônes
  lib/
    auth.ts, auth-client.ts     Better Auth serveur (init paresseuse) / client React
    api/respond.ts, with-auth.ts enveloppes JSON, mapping codes → HTTP, garde de session
    offline/outbox.ts, network.ts file de mutations Dexie rejouée à la reconnexion, useOnline()
    query/client.ts             QueryClient + persister IndexedDB (idb-keyval)
    format.ts, theme.ts
  proxy.ts                garde d'auth (Next 16 : « proxy », ex-middleware)
  sw.ts                   service worker Serwist (précache + stratégies + repli /offline)
  styles/tokens.css       jetons Selvedge (à remplacer par @chine/ui/tokens.css)
```

## Hors ligne

- **Lecture** : TanStack Query persiste son cache dans IndexedDB (7 jours) ; l'API `/api/v1/*` en GET est servie réseau d'abord (10 s), puis cache.
- **Écriture** : `enqueue({ method, path, body })` (`src/lib/offline/outbox.ts`) stocke la mutation dans Dexie ; `replay()` la rejoue séquentiellement vers `/api/v1/*` à la reconnexion et au retour au premier plan. Un 4xx marque l'entrée en échec et arrête le rejeu ; une erreur réseau ou un 5xx réessaie plus tard. Chaque requête porte `X-Outbox-Id` pour l'idempotence côté serveur.
- **UI** : `<SyncBadge />` dans la barre supérieure (« Hors ligne », « Sync plus tard · 2 », « 1 en échec »).

## Installer l'app (PWA)

**iPhone / iPad (Safari)** : ouvre le site, touche le bouton Partager, puis « Sur l'écran d'accueil ». L'app s'ouvre en plein écran, avec ses propres icônes, et fonctionne hors ligne une fois visitée.

**Android (Chrome)** : une bannière « Installer Chiné » apparaît ; sinon, menu ⋮ → « Installer l'application » (ou « Ajouter à l'écran d'accueil »). Des raccourcis « Chiner », « Stock », « Ventes » sont disponibles en appui long sur l'icône.

**Ordinateur (Chrome, Edge)** : icône d'installation dans la barre d'adresse.

Le service worker n'est actif que sur un build de production (`build` puis `start`), servi en HTTPS ou sur `localhost`.

## À câbler (TODO(lead))

Recherche `TODO(lead)` dans `src/` :

- `src/lib/auth.ts` : `drizzleAdapter(getDatabase().db, { provider: "pg", schema: authSchema })` — en attendant, adaptateur mémoire.
- `src/app/globals.css` : `@import "@chine/ui/tokens.css"` à la place de `src/styles/tokens.css`.
- `src/app/dev/ui/page.tsx` : monter le showcase `@chine/ui/preview`.
- `src/components/marketing/pricing.ts` : sourcer les formules depuis `@chine/domain`.
- Pages `(app)/app/*` : remplacer chaque `<PageSkeleton variant="…" />` par les composants alimentés.
- `src/lib/api-client.ts` : remplacer par le client de `@chine/contract`.
