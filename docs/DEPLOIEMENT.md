# Déploiement

## Cible recommandée

| Brique | Service | Pourquoi |
|---|---|---|
| App web + API | **Vercel** (projet racine `apps/web`, framework Next.js) | Edge + ISR pour la landing, Node runtime pour l'API, previews par PR |
| Base de données | **Railway Postgres** (ou Neon) | Continuité avec l'existant ; `DATABASE_URL` avec `sslmode=require` |
| Photos | **Cloudflare R2** | S3 compatible, egress gratuit |
| Facturation | **Stripe** | Checkout + Customer Portal + webhooks |
| IA | **Gemini 2.5 Flash** | Coût faible, JSON structuré |

## Vercel

1. Importer le dépôt, **Root Directory** = `apps/web`, Framework = Next.js, Node 24.
2. Build command : `cd ../.. && pnpm turbo run build --filter=@chine/web`. Install command : `pnpm install --frozen-lockfile`.
3. Variables d'environnement : copier `.env.example` et renseigner `DATABASE_URL`, `BETTER_AUTH_SECRET` (32+ caractères aléatoires), `BETTER_AUTH_URL` (URL publique), `NEXT_PUBLIC_APP_URL`, puis les clés IA / R2 / Stripe quand disponibles.
4. Migrations : `pnpm db:migrate` s'exécute au démarrage si `RUN_MIGRATIONS=1`, ou manuellement depuis un poste avec `DATABASE_URL`.

## Railway (Postgres)

Créer un service Postgres, copier `DATABASE_URL` (proxy public) dans Vercel. Ne jamais versionner cette valeur : l'ancien dépôt a exposé un mot de passe de production dans un README pendant sept mois.

## Sans aucun service externe

`pnpm dev` fonctionne intégralement en local : PGlite (Postgres embarqué dans `.data/pglite`), photos dans `.data/uploads`, expert IA de démonstration. Idéal pour tester l'app sur téléphone via l'IP locale.

## Observabilité

Sentry est activé uniquement si `SENTRY_DSN` (serveur) et `NEXT_PUBLIC_SENTRY_DSN` (navigateur) sont définis. Les sourcemaps ne sont envoyées que si `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` et `SENTRY_PROJECT` sont présents (CI ou Vercel). Aucun corps de requête ni cookie n'est transmis (`beforeSend`). Les journaux serveur sont en JSON structuré avec `requestId` ; `/api/health` et `/api/ready` servent aux sondes.

## Mode développement

`pnpm dev` lance Next.js avec Turbopack (PGlite embarqué, migrations automatiques). Le service worker n'est actif qu'en build de production (`next build --webpack`, requis par Serwist). Utiliser `http://localhost:3000`, pas `127.0.0.1` (protection des origines de développement de Next 16).
