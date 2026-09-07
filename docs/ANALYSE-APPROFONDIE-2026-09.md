# Optimus Vintage — Analyse approfondie & plan de refonte

> **Date** : 7 septembre 2026
> **Branche analysée** : `main` (dernier commit `99cf630`, 9 février 2026)
> **Périmètre** : code source complet (app Expo, API Express, schémas, docs, maquettes Stitch), typecheck, tests, historique Git, PRs.
> **Objet** : (1) état réel de l'existant, (2) validation du concept face à ton workflow de reseller, (3) architecture cible Next.js PWA + monorepo, (4) roadmap.

---

## 0. Verdict en une page

| Axe | Constat | Note |
|---|---|---|
| **Concept produit** | Juste et différenciant (lots → pièces → ventes, floor price, scanner IA). Mais il modélise un seul type de sourcing (le lot fournisseur) et ignore la chine à l'unité, qui est ton cas le plus rentable (Lacoste 20 € → 75 €). | 7/10 |
| **Fonctionnel livré** | Le cycle complet Lot → Stock → Vente → Dashboard existe et fonctionne côté maquette. Scanner IA Gemini opérationnel via proxy. Auth JWT, quotas, RevenueCat câblés. | 7/10 |
| **Architecture** | Bonne intention (repositories, moteur de calcul isolé, Zod, TanStack Query) mais **quatre générations de couche data cohabitent**, dont deux mortes. Aucune séparation domaine / infra. | 4/10 |
| **Sécurité / données** | **Bloquant** : la base est mono-tenant. Aucune table métier n'a de `user_id`. Tout utilisateur connecté voit et modifie les lots, pièces et ventes de tous les autres. Les quotas comptent les lignes globales. | 2/10 |
| **Qualité** | `tsc` échoue (4 erreurs) alors que les docs affirment "0 erreur". 123 tests passent mais ne couvrent que le moteur de calcul, l'export CSV et un composant. Aucun test API, aucun test d'écran. | 4/10 |
| **Design** | Direction artistique "Vanta Aether / Ivory" forte et cohérente (or sur noir absolu, ivoire/champagne). Micro-interactions Reanimated soignées. Mais le noir de base a été cassé par le dernier commit (`#07a75d61`, un vert translucide). | 7/10 |
| **Web / PWA** | Expo Web fonctionne en mode dégradé (pas de SQLite, pas de RevenueCat, pas de service worker, pas de manifest). Ce n'est pas une PWA. | 2/10 |
| **Docs** | Abondantes (2 400 lignes) mais **désynchronisées du code** : Sentry "intégré ✅" n'existe nulle part, "0 erreur TS" est faux, "toutes les dettes résolues" est faux. | 3/10 |

**Conclusion** : le produit est une bonne preuve de concept UI avec un vrai moteur métier, mais il n'est **pas livrable** en l'état (fuite de données entre comptes, offline inexistant, photos non persistées). La refonte en Next.js PWA que tu envisages est la bonne décision, à condition de **repartir d'un domaine propre** et de ne réutiliser que ce qui a de la valeur : le moteur financier, les prompts IA, la direction artistique, les traductions.

---

## 1. Ce qui existe réellement

### 1.1 Stack et chiffres

| Élément | Valeur |
|---|---|
| App mobile | Expo SDK 54, React Native 0.81.5, React 19.1, Expo Router 6 (typed routes, React Compiler activé) |
| API | Express 5, Drizzle ORM 0.45, PostgreSQL, Zod 3, JWT, bcrypt, Helmet, express-rate-limit |
| IA | Gemini 2.0 Flash via `@google/generative-ai`, proxy serveur `/api/ai/analyze` |
| Paiement | RevenueCat (`react-native-purchases` 9.7) + RevenueCatUI, clé **de test** dans le code |
| État | Zustand 5 (auth, subscription, settings persisté via localStorage polyfill SQLite) + TanStack Query 5 |
| i18n | i18next, FR / EN / DE (572 clés par langue) |
| Code | 182 fichiers, ~37 500 lignes TS/TSX hors node_modules. Écrans de 700 à 2 000 lignes chacun |
| Tests | 7 suites, 123 tests, tous verts. Couverture réelle : moteur de calcul, export CSV, a11y, 1 composant |
| Typecheck | **Échoue** : 4 erreurs (`estimatedItemSize` retiré de FlashList 2, `t` non défini dans `stock.tsx:253`, type `never` dans `lots/edit/[id].tsx:426`) |
| Historique | 38 commits entre le 14 janvier et le 9 février 2026, un seul auteur, 6 PRs toutes fermées sans merge (les branches ont été fusionnées manuellement) |
| CI | Aucune GitHub Action. Trois workflows EAS déclarés (`build-preview`, `build-production`, `deploy-web`) jamais exécutés |
| Déploiement | API sur Railway (`optimus-api-production.up.railway.app`) ; injoignable depuis ce sandbox (politique réseau), donc non vérifié |

### 1.2 Modèle de données en production (PostgreSQL)

```
users ─┬─ subscriptions          (plan, status, RevenueCat ids, période, trial)
       └─ refresh_tokens

lots   ──< items ──< sales        (sales.item_id nullable : "vente rapide" rattachée au lot)
```

| Table | Champs clés | Remarques |
|---|---|---|
| `lots` | provider, buy_date, type (BULK / PIECEWISE), total_cost, additional_fees, initial_quantity, currency | **Pas de `user_id`.** `provider` est un texte libre mais l'UI n'offre que 3 choix : Eureka, Fleek, Personnel |
| `items` | lot_id, brand, type, color, size, condition, unit_cost, status (STOCK / ONLINE / SOLD / RETURNED / LOST), photos (JSON string) | **Pas de `user_id`.** `photos` stocke des URIs `file://` locales au téléphone : jamais uploadées, perdues à la réinstallation, invisibles sur un autre appareil |
| `sales` | item_id, lot_id, platform, price_gross, platform_fees, shipping_fees, misc_fees, price_net, sale_date, status | **Pas de `user_id`.** `platform` est figé à `"VINTED"` dans l'écran de vente (`app/sales/new.tsx:85`), aucun sélecteur |

Un lot doit exister avant toute pièce : impossible d'enregistrer une pièce chinée seule sans créer un "lot" artificiel de quantité 1.

### 1.3 Moteur financier (`utils/engine/calculations.ts`, 135 lignes)

C'est la partie la plus solide et la mieux testée.

- `computeLotSummary(lot, items, sales)` → investissement (coût + frais), CA net (hors ventes annulées/remboursées), profit, ROI %, delta restant pour break-even, quantité vendue / restante.
- `computeProtection(delta, remaining, targetMargin)` → prix plancher par pièce pour rembourser le lot, et prix plancher avec marge cible (montant fixe en devise).
- Limites : `breakEvenPoint` est un TODO (toujours 0) ; une vente = une pièce (pas de vente groupée) ; la marge cible est un montant fixe, pas un pourcentage ; le coût unitaire des pièces (`unit_cost`) n'est pas utilisé dans le calcul du lot, ce qui empêche le vrai P&L par pièce sur un lot PIECEWISE.

### 1.4 API (`api/src/server.ts`, 583 lignes)

- 20 routes REST : CRUD lots / items / sales, `GET /lots/summary` (agrégat SQL en une requête, bien fait), `GET /sales/revenue`, `GET /quotas`, auth (`register`, `login`, `refresh`, `me`, `logout`, `DELETE account`), subscriptions (`webhook`, `sync`, `status`), IA (`status`, `analyze`).
- Bonnes pratiques présentes : Zod sur body/params/query, `asyncHandler`, `ApiError`, Helmet, CORS par liste blanche, rate-limit global (prod) + spécifique auth (10/15 min) + IA (10/min), rotation des refresh tokens, `trust proxy`.
- **Un ancien serveur complet est encore présent** (`api/src/index.ts`, 301 lignes, sans auth ni validation). Il n'est pas démarré par `npm start` mais c'est un piège de maintenance.
- Rate-limit désactivé hors production ; secrets JWT avec valeur par défaut hors production.

### 1.5 Authentification et monétisation

- Inscription = 14 jours d'essai Premium, puis rétrogradation Starter détectée à la connexion ou au `/me` (pas de cron : un utilisateur qui reste connecté 15 min garde son token Premium jusqu'à expiration, et le plan encodé dans le JWT n'est jamais réévalué avant le refresh).
- Quatre plans (Starter / Premium / Pro / Business) définis deux fois à l'identique (`api/src/auth-schema.ts` et `utils/plan-access.ts`) : duplication à synchroniser à la main.
- RevenueCat : un seul entitlement "Optimus Vintage Pro" → le webhook mappe n'importe quel achat sur `pro`. Les plans Premium et Business **ne sont pas achetables**. L'app saute l'init RevenueCat en release si la clé commence par `test_`, ce qui est le cas.
- Le webhook RevenueCat n'est protégé que si `REVENUECAT_WEBHOOK_SECRET` est défini ; sinon il accepte tout le monde.
- `POST /subscriptions/sync` fait confiance au client : n'importe quel utilisateur authentifié peut s'auto-attribuer `plan: "business"` avec un simple `fetch`.
- Quota IA : `checkAIQuota` ne compte rien (commentaire "pass through"), et `/api/ai/analyze` n'exige même pas d'être connecté (`aiRouter` sans `requireAuth`) : la clé Gemini est protégée mais le coût est ouvert à tout internet, limité à 10 appels/min/IP.

### 1.6 Faille bloquante : mono-tenant

```ts
// api/src/quota-middleware.ts:1062
// Count lots (all lots belong to the user — currently single-tenant)
const [{ value: lotsCount }] = await db.select({ value: count() }).from(lots);
```

Toutes les requêtes métier (`/api/lots`, `/api/items`, `/api/sales`) filtrent par `id` mais jamais par utilisateur. Conséquences :

1. Deux comptes créés sur l'API de production partagent le même stock, les mêmes ventes, le même dashboard.
2. `DELETE /api/lots/:id` supprime en cascade les pièces et ventes de n'importe qui.
3. Le quota Starter "3 lots" est atteint dès que la base contient 3 lots, tous utilisateurs confondus.
4. L'export CSV exporte les données de tout le monde.

C'est le premier point à corriger avant toute mise en ligne, et la raison principale pour laquelle je recommande de repartir d'un schéma neuf plutôt que de migrer.

---

## 2. Inventaire fonctionnel écran par écran

21 écrans Expo Router, 16 636 lignes. Tous consomment l'API REST via `db/repositories/enterprise.ts` et TanStack Query. Ce tableau décrit ce que l'utilisateur peut réellement faire aujourd'hui.

### 2.1 Onglets

| Écran | Ce qu'on peut faire | Qualité UX | Manques notables |
|---|---|---|---|
| **Dashboard** (`index.tsx`, 2 011 l.) | KPIs (CA, profit, ROI, vendus), 5 périodes (7j → tout), comparaison période précédente, "Gravity Disk" animé, bannière essai, indicateur de quota | Animations Reanimated soignées, skeletons, reduce-motion respecté | Télécharge tous les lots et toutes les ventes puis calcule côté client. Aucun graphique réel |
| **Lots** (`lots.tsx`, 1 393 l.) | Recherche (nom, fournisseur, #id), 6 tris, barre KPI, cartes lot avec progression vendus/total, création | FlashList, stagger, haptique, a11y correcte | Badge "Données synchronisées" décoratif, mini-graphes à barres avec **données factices** `[40,70,100,60,30]`, ~130 lignes de composant legacy mort |
| **Stock** (`stock.tsx`, 1 740 l.) | Recherche, 5 tris, carrousels façon Netflix par lot (10 pièces max), masquage lot par lot, KPI stock | Images `expo-image` avec blurhash | Carte "SECURE / AES 4096" purement décorative. `ItemCard` (440 lignes, 3 variantes) jamais rendu et contient le crash `t` non défini |
| **Ventes** (`sales.tsx`, 712 l.) | Filtre période, 4 KPI avec tendance, liste, détail | Segmented control animé, a11y tab | Le bouton "+" ouvre la vente **sans pièce** donc tombe sur l'état vide |
| **Réglages** (`settings.tsx`, 1 233 l.) | Thème, langue, devise (7), marge cible, haptiques, export CSV (gated), Customer Center, reset onboarding | Écran le plus abouti en accessibilité | Badge PRO/FREE lu via `getState()` pendant le rendu : ne se met pas à jour après achat |

### 2.2 Flux métier

| Écran | Ce qu'on peut faire | Manques notables |
|---|---|---|
| **Nouveau lot** (`lots/new.tsx`, 1 150 l.) | Fournisseur (3 puces), date, type BULK / PIECEWISE, coût, port, quantité, génération auto des pièces | Le sélecteur de date ne propose que **-5 à +7 jours** (bug de `slice`). Le mode "saisie manuelle" des pièces **ne fait rien**. Pas de champ nom. Pièces générées avec `brand: "Unknown"`, `condition: "Good"` |
| **Détail lot** (`lots/[id].tsx`, 1 299 l.) | KPI, barre de récupération, floor price, segments top / pertes / tout, liste des pièces | `Math.abs` sur le profit : **une perte s'affiche comme un gain**. Bénéfice estimé codé en dur à "~10 €". Bouton "Ajuster la stratégie" vide. La marge cible des réglages est ignorée (toujours 0) |
| **Éditer lot** (`lots/edit/[id].tsx`, 905 l.) | Tous les champs + nom, suppression | Palette codée en dur, pas d'a11y, pas de haptique |
| **Détail pièce** (`items/[id].tsx`, 1 104 l.) | Galerie photo, statut, coût / prix / bénéfice, liens lot et vente, vendre / éditer / supprimer | `JSON.parse(photos)` sans try/catch. Ligne "créé le" libellée "Aujourd'hui". Statut RETURNED avec la mauvaise clé |
| **Éditer pièce** (`items/edit/[id].tsx`, 1 016 l.) | Photos (5 max), marque, type (6), couleur, taille (8), état (5), coût, statut (3) | Statut `RESERVED` proposé alors qu'il n'existe pas ; ONLINE / RETURNED / LOST inaccessibles. Passer à SOLD **ne crée pas de vente**. États incompatibles avec l'API (voir B3) |
| **Nouvelle vente** (`sales/new.tsx`, 697 l.) | Prix brut, frais plateforme, port ; net et bénéfice en direct ; passe la pièce en SOLD | Plateforme figée Vinted, pas de date, pas de statut, pas de frais divers, aucune validation (prix négatif, `NaN` accepté). Textes en anglais brut |
| **Détail vente** (`sales/[id].tsx`, 762 l.) | Ventilation brut / frais / port / net / bénéfice, annulation (remet en stock) | Statuts PENDING et REFUNDED affichables mais impossibles à produire |
| **Scanner** (`scanner/index.tsx`, 495 l.) | Caméra, flash, galerie, cadre animé | Cassé sur web (aucune garde). Permission galerie non demandée |
| **Analyse IA** (`scanner/analyze.tsx`, 1 033 l.) | Identification, fourchette de prix, plateformes recommandées, demande, tendance, rareté, conseils | Gated par la feature `iaPricing` (plan Pro) alors que Premium promet 30 scans/mois : **les abonnés Premium sont bloqués**. Aucun décompte de quota. Réponses toujours en français |
| **Ajout au stock** (`scanner/add-to-stock.tsx`, 857 l.) | Pré-remplissage depuis l'IA, choix du lot, photo, prix d'achat suggéré | Un lot est obligatoire. Taille IA hors des 8 puces impossible à corriger |

### 2.3 Entrée, marketing, divers

| Écran | Constat |
|---|---|
| **Onboarding** (453 l.) | Deux champs : devise en **texte libre 3 caractères** ("ABC" accepté) et marge sans unité. Affirme "Your data stays on your device" alors que tout part sur l'API |
| **Auth** (353 l.) | Login / inscription. "Continuer sans compte" est **annulé** par le garde de `_layout.tsx` qui renvoie vers `/auth`. Pas de mot de passe oublié, pas de validation d'e-mail |
| **Paywall** (258 l.) | Natif : présente RevenueCatUI puis rend une vue vide (écran noir si échec). Web : liste statique |
| **Landing** (1 065 l.) | Web uniquement, jamais servie comme page d'accueil (le garde redirige vers onboarding / auth). Liens de navigation, footer, CGU et confidentialité **sans `onPress`**. Statistiques ("10K+ revendeurs", "4.8 App Store") et témoignages **inventés** pour une app non publiée |
| `modal.tsx`, `+not-found.tsx`, `+html.tsx` | Boilerplate Expo non modifié, en anglais, `lang="en"`, aucun manifest PWA, aucune meta |

### 2.4 Couche data : quatre générations superposées

| Fichiers | Backend | Statut |
|---|---|---|
| `db/api-client.ts` + `db/repositories/enterprise.ts` | REST + JWT | **Actif** : les 14 écrans passent par là |
| `db/repositories/api.ts` + `db/api-config.ts` | REST legacy sans retry | Mort (0 import) |
| `db/repositories/{items,lots,sales}.ts` + `db/index.ts` + `db/schema/index.ts` | SQLite Drizzle | Mort. C'est la "couche offline" annoncée dans les docs, jamais branchée |
| `db/repositories/*.pg.ts` + `db/postgres.ts` + `db/config.ts` | Pool `pg` direct | Mort, mais `pg` reste dans les dépendances de l'app mobile avec `rejectUnauthorized: false` |

Aucune migration Drizzle n'a jamais été générée (`api/drizzle/` n'existe pas) : le schéma de production a été poussé par `db:push`, sans historique ni rollback possible.

### 2.5 Design system et composants

`constants/Theme.ts` (709 lignes) est la seule source vivante (33 importeurs). `constants/DesignTokens.ts` (568 lignes) est mort à 100 % et décrit une identité **différente** (primaire émeraude au lieu d'or), avec des commentaires de valeurs faux. Sur les composants exportés, environ 60 % ne sont importés nulle part : `SvgIcons.tsx` (909 lignes, doublon d'`AppIcon`), `Components.tsx` (10 exports morts sur 13), `AnimatedComponents.tsx` (8/12), `PremiumUI.tsx` (7/14), `Skeleton.tsx` (6/9), `animations-reanimated.ts` (20/22 helpers), `AnimationShowcase.tsx`, `Card.tsx`, `ExternalLink.tsx`, `utils/api-utils.ts` (doublon du client API), `utils/cache.ts` (jamais importé, et son hook `useCachedQuery` lève une exception par construction).

Estimation du code mort : **environ 7 200 lignes sur 37 500**, soit un cinquième du dépôt.

### 2.6 Bugs confirmés (extrait, classés par gravité)

| # | Gravité | Où | Quoi |
|---|---|---|---|
| S1 | **Critique** | `api/README.md:15-20` | **Identifiants PostgreSQL de production versionnés en clair** (hôte proxy Railway, port, utilisateur, mot de passe, base) depuis le premier commit `5c06542`. Le proxy TCP Railway est joignable depuis internet : n'importe qui ayant lu le dépôt a un accès administrateur à la base. À révoquer aujourd'hui, puis purger l'historique Git |
| S2 | **Critique** | `api/src/*.ts` | Mono-tenant : aucune table métier n'a de `user_id` (voir 1.6) |
| S3 | Élevée | `api/src/subscription-routes.ts:806-857` | `POST /subscriptions/sync` accepte le `plan` envoyé par le client sans vérification : auto-upgrade gratuit vers Business |
| S4 | Élevée | `api/src/ai-routes.ts:1024-1040` | `/api/ai/analyze` n'exige pas d'authentification et le quota IA n'est pas compté : coût Gemini ouvert à internet, seulement limité à 10 appels/min/IP |
| S5 | Élevée | `utils/ai/config.ts:14-26` | Clés IA lues depuis `EXPO_PUBLIC_*`, donc inlinées en clair dans le bundle si définies. Le fallback client vers Gemini (`utils/ai/index.ts:113`) suppose une clé exposée |
| S6 | Élevée | `constants/RevenueCat.ts:23` | Clé RevenueCat de test en dur en fallback ; `eas.json` n'injecte aucune variable, donc un build production part avec la clé sandbox (le commit `23c1426` contourne le symptôme) |
| S7 | Moyenne | `api/src/subscription-routes.ts:641-648` | Webhook RevenueCat non protégé si `REVENUECAT_WEBHOOK_SECRET` est absent |
| B1 | **Crash** | `app/(tabs)/stock.tsx:253` | `t` n'est pas défini dans `ItemCard` : `ReferenceError` en vue grille dès qu'une pièce a une photo. Confirmé par `tsc` |
| B2 | **Visuel** | `constants/Theme.ts:31` | `vanta.black = "#07a75d61"` : le fond du mode sombre est un vert translucide, `textOnAccent` est illisible. Introduit avant le dernier commit et "ajusté" sans être vu |
| B3 | Fonctionnel | `app/items/edit/[id].tsx:92,295` et `app/scanner/add-to-stock.tsx:44` | Les états côté UI sont `new / likeNew / veryGood / good / fair` alors que l'API n'accepte que `New / Like New / Good / Fair / Poor` : toute sauvegarde avec un état choisi renvoie 400 ; l'état initial `"Good"` ne correspond à aucune puce |
| B4 | Fonctionnel | `app/sales/new.tsx:85` | Plateforme figée à `"VINTED"` : aucune vente Depop / Leboncoin / eBay possible malgré l'enum API |
| B5 | Fonctionnel | `items.photos` | Photos stockées comme URIs `file://` locales dans Postgres : jamais uploadées, perdues à la réinstallation |
| B6 | Config | `app.json:39-44` | `expo-camera` et `expo-image-picker` absents des plugins : pas de `NSCameraUsageDescription` générée, rejet App Store assuré |
| B7 | Fonctionnel | `utils/data/export.ts:65-133` | L'export "tout" intercale des séparateurs `=== LOTS ===` : le fichier n'est pas un CSV valide. En-têtes anglais en dur. `file.create()` échoue au second export du jour |
| B8 | Logique | `api/src/auth-routes.ts` | Fin d'essai détectée seulement au login ou `/me` ; le plan encodé dans le JWT (15 min) n'est pas réévalué. Pas de cron |
| B9 | Perf | `app/(tabs)/index.tsx:1445-1452` | Le dashboard télécharge **tous** les lots et **toutes** les ventes puis calcule côté client ; `count()` des repositories rapatrie la table entière pour un `.length` |
| B10 | Perf | `db/api-client.ts:26-39` | Throttle de 200 ms sans file d'attente : les appels concurrents partent ensemble. `requestQueue` déclaré, jamais utilisé |
| B11 | Type | `app/(tabs)/lots.tsx:1164`, `sales.tsx:543`, `lots/edit/[id].tsx:426` | Les 3 autres erreurs `tsc` (prop FlashList v1, branche `never`) |
| B12 | Logique | `utils/engine/calculations.ts:129` | Message métier en français avec `€` codé en dur alors que le lot porte une devise et que 5 devises sont déclarées |
| B13 | Logique | `utils/cache.ts` | TTL par entrée ignoré, éviction FIFO annoncée LRU ; module de toute façon mort |
| B14 | Fuite | `utils/analytics.ts:105,265` | Listener `AppState` jamais retiré ; réécriture de 500 événements dans AsyncStorage à chaque `track()` ; flag `ENABLE_ANALYTICS` jamais lu ; **aucun envoi vers un service** (Sentry / PostHog absents des dépendances malgré les docs) |
| B15 | i18n | `app/landing.tsx` (0 appel à `t()`), `paywall.tsx`, `ErrorBoundary`, `feature-gate`, `quota-indicator`, `utils/ai/index.ts` | Dizaines de chaînes françaises en dur ; 3 clés d'accessibilité absentes de EN et DE |

### 2.7 Tests

7 suites, 123 tests, tous verts en 11 s. Mais :

- Trois fichiers différents testent le même module de 134 lignes (`calculations.ts`), avec des factories incompatibles et des attentes contradictoires sur les ventes `PENDING`.
- `export.test.ts` **recopie** les fonctions testées au lieu de les importer : il valide une copie.
- `jest.config.js` impose 50 % de couverture sur tout le dépôt (écrans inclus) : `jest --coverage` échoue par construction, d'où l'absence de script `test` dans `package.json`.
- `jest.setup.js` remplace `global.Date` par une instance partagée : piège pour tout test futur sur les dates.
- Zéro test sur l'API, le client HTTP, les stores, les écrans.

### 2.8 Autres écarts relevés sur les écrans

- **Table des symboles monétaires dupliquée 11 fois** avec des valeurs divergentes (CHF "Fr" ou "CHF", CAD "C$" ou "CA$", AUD connu seulement des réglages). Le type `CurrencyCode` d'`i18n.ts` ignore CAD et AUD ; `sales.tsx` contourne avec `as any`.
- **Trois systèmes de couleurs** en plus du thème : objet `VANTA` copié dans `lots/edit`, `items/edit`, `onboarding` ; objet `Colors` dans `landing` ; constantes `Palette.metal.gold` directes dans le scanner. Ces écrans ne suivent pas le thème clair / sombre.
- `#FFF` codé en dur à 20 endroits alors que `theme.textOnAccent` existe.
- Deux types `LotSummary` homonymes et incompatibles (`enterprise.ts` et `calculations.ts`).
- `useColorScheme.web.ts` retourne toujours `light` : le mode sombre système n'existe pas sur web.
- Suppression d'un lot ou d'une pièce sans vérification des ventes liées ; photos supprimées jamais effacées du disque.
- Reduce-motion respecté dans 6 écrans, ignoré dans 12.
- 5 clés i18n manquantes dans les 3 langues (dont `lots.sold`, affichée brute).

---

## 3. Validation du concept face à ton métier réel

### 3.1 Ton workflow, tel que tu l'as décrit

| Canal de sourcing | Forme d'achat | Ce que l'app doit savoir faire |
|---|---|---|
| **Fleek** (app B2B) | Lots / ballots en ligne, livrés | Lot avec quantité annoncée, frais de port, réception partielle, taux de casse |
| **Eureka** (grossiste, région de Rouen) | Picking à la pièce **ou** palette entière | Lot "palette" (poids ou nombre de pièces estimé) et lot "picking" (pièces choisies, coût unitaire connu) |
| **Vide-greniers, brocantes, foires à tout** (repérés via Brocabrac) | Pièce à l'unité, cash, sans facture | **Achat unitaire sans lot**, géolocalisé, date de l'événement, paiement espèces |
| **Lots neufs / déstockage** | Lots neufs avec étiquettes | Prix public de référence (RRP), état "neuf avec étiquette" |

Ton exemple Lacoste résume le besoin : un ensemble acheté **20 €** en brocante, revendu **75 €**, prix neuf **250 €**. L'app doit pouvoir enregistrer cette pièce seule (sans lot), stocker le prix neuf pour argumenter la vente ("-70 % du prix boutique"), calculer marge brute (55 €), marge nette après frais Vinted / port, et ROI (275 %).

### 3.2 Ce que l'existant couvre, et ce qu'il rate

| Besoin | Couvert ? | Détail |
|---|---|---|
| Lot fournisseur (Fleek, Eureka palette) | ✅ partiel | Lot BULK avec coût, frais, quantité. Pas de réception (quantité reçue vs annoncée), pas de poids, pas de taux de casse |
| Picking Eureka (coût unitaire connu) | ⚠️ | Lot PIECEWISE existe en enum mais le moteur ignore `unit_cost` par pièce |
| Chine à l'unité (brocante, vide-grenier) | ❌ | Impossible sans créer un lot factice. Pas de lieu, pas d'événement, pas de "Personnel" comme sourcing sérieux |
| Prix neuf de référence / décote | ❌ | Aucun champ RRP |
| Multi-plateforme de vente | ❌ | Enum API prête (Vinted, Depop, eBay, Leboncoin, Other) mais l'UI force Vinted |
| Frais de plateforme automatiques | ❌ | Saisie manuelle. Vinted : 0 frais vendeur en France (protection acheteur payée par l'acheteur) ; Vestiaire Collective : commission ; eBay : ~13 %. Rien de modélisé |
| Photos synchronisées | ❌ | URIs locales |
| Multi-appareil (téléphone en brocante, ordinateur pour la compta) | ❌ | Mono-tenant + photos locales + pas de web installable |
| Offline en brocante (réseau absent) | ❌ | SQLite déclaré mais jamais branché (`db/index.ts` non importé par les écrans) |
| Export comptable (micro-entreprise, seuil de 77 700 € / TVA) | ⚠️ | CSV brut. Pas de journal des achats/ventes, pas de TVA sur marge (régime des biens d'occasion), pas de rapport mensuel |
| Étiquetage / rangement physique (bac, SKU) | ❌ | Aucun champ emplacement, aucun SKU, aucun QR |
| Mise en ligne (titre, description, mesures) | ❌ | Le scanner IA propose un prix mais ne génère ni annonce ni mesures |
| Retours / litiges / relistes | ⚠️ | Statuts RETURNED / REFUNDED existent, sans flux |

### 3.3 Verdict sur le concept

Le positionnement (**"l'ERP de poche du reseller vêtements, du débutant au pro"**) est bon et il n'y a pas d'acteur français crédible sur ce créneau. Le modèle mental "Lot → Pièce → Vente" est juste pour le sourcing en gros, mais il doit devenir **"Source d'achat → Pièce → Annonce(s) → Vente"**, où la source peut être un lot, une palette, un picking ou un achat unitaire. C'est le seul changement de modèle qui compte ; tout le reste (scanner IA, floor price, dashboard) se branche dessus.

Les trois personas des docs (Marie occasionnelle, Thomas semi-pro, Léa pro) sont pertinents. Ton propre profil est Thomas : multi-canal de sourcing, Vinted principal, compta micro-entreprise, besoin d'un outil qui marche debout dans une allée de brocante avec une main.

---

## 4. Architecture cible : Optimus Vintage v2

### 4.1 Décision : Next.js PWA d'abord, Expo ensuite, un seul domaine partagé

Tu as évoqué à la fois Next.js et Expo. Les deux ne s'opposent pas si le code métier est isolé dans des packages partagés. Ma recommandation :

1. **Phase 1 : Next.js 16 en PWA installable** (iOS et Android via "Ajouter à l'écran d'accueil"). Une seule base de code, pas de store, mises à jour instantanées, caméra et géolocalisation accessibles via les APIs web, offline via service worker. Couvre 100 % de tes besoins terrain.
2. **Phase 2 (optionnelle)** : app Expo qui consomme les mêmes packages `domain`, `application` et `api-contract`. Justifiée seulement si tu as besoin de notifications push iOS riches, de widgets, ou d'une présence App Store pour l'acquisition.

Ce qui ne peut pas se faire en PWA aujourd'hui et qu'il faut accepter : achats in-app Apple (on passe par Stripe, ce qui est de toute façon plus rentable : 1,5 % + 0,25 € contre 15 à 30 %), scan de code-barres ultra rapide natif (l'API `BarcodeDetector` web n'est pas sur Safari, on utilise `zxing-wasm`), push iOS possible uniquement pour une PWA installée sur iOS 16.4+.

### 4.2 Monorepo

```
optimus-vintage/
├── apps/
│   ├── web/                    Next.js 16 (App Router, RSC, Server Actions, PWA via Serwist)
│   └── mobile/                 (phase 2) Expo SDK 55+, consomme les mêmes packages
├── packages/
│   ├── domain/                 Cœur métier pur TypeScript. Zéro dépendance. Entités, Value Objects,
│   │                           Agrégats, Domain Events, Domain Services, Spécifications
│   ├── application/            Use cases (commandes / requêtes), ports (interfaces de repositories,
│   │                           services externes), DTOs, politiques d'accès
│   ├── infrastructure/         Adaptateurs : Drizzle/Postgres, stockage S3/R2, Gemini/Claude,
│   │                           Stripe, e-mail, PWA sync
│   ├── api-contract/           Schémas Zod + types partagés (client ↔ serveur), erreurs typées
│   ├── ui/                     Design system "Vanta" en React + Tailwind v4 + Motion, tokens CSS
│   ├── i18n/                   Messages FR/EN/DE (repris des 572 clés existantes)
│   └── config/                 tsconfig, eslint, tailwind presets partagés
├── tooling/                    scripts, générateurs, seeds
└── docs/                       ADRs, glossaire ubiquitous language, ce rapport
```

Outils : pnpm workspaces + Turborepo, TypeScript en mode `strict` + `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess`, Node 24 LTS, Biome (lint + format), Vitest (unit + intégration), Playwright (e2e + tests PWA offline), Changesets.

Sur "TypeScript 7+" : le compilateur natif (Go) de TypeScript 7 est disponible en preview (`@typescript/native-preview`, commande `tsgo`) et divise les temps de typecheck par 8 à 10. Je propose de le brancher en CI dès le départ pour le typecheck, en gardant `tsc` 5.9 / 6.x comme référence tant que 7.0 n'est pas déclaré stable. Toutes les options de config seront choisies dans le sous-ensemble compatible 7.

### 4.3 Domaine (DDD) : bounded contexts et langage ubiquitaire

| Bounded context | Responsabilité | Agrégats principaux |
|---|---|---|
| **Sourcing** | D'où viennent les pièces et combien elles ont coûté | `PurchaseSource` (Lot, Palette, Picking, UnitPurchase), `Supplier`, `SourcingEvent` (brocante, vide-grenier avec lieu et date) |
| **Inventory** | Ce que je possède, dans quel état, où c'est rangé | `Item` (SKU, marque, catégorie, taille, état, mesures, photos, RRP, coût d'acquisition alloué, emplacement), `ItemStatus` machine à états |
| **Listing** | Ce que j'ai mis en vente, où, à quel prix | `Listing` (plateforme, prix affiché, titre/description générés, date, vues), `Platform` avec sa grille de frais |
| **Sales** | Ce que j'ai vendu, net encaissé, retours | `Sale` (prix brut, frais plateforme calculés par la politique de la plateforme, port, emballage, net), `Return`, `Refund` |
| **Finance** | Marges, ROI, floor price, P&L, fiscalité | `LotPerformance`, `ItemProfitability`, `FloorPricePolicy`, `PeriodReport`, `VatOnMarginCalculator` |
| **Appraisal (IA)** | Identification, estimation, génération d'annonce | `AppraisalRequest`, `AppraisalResult`, `PriceEstimate` (low/mid/high + confiance), `ListingCopy` |
| **Identity & Billing** | Comptes, workspaces, plans, quotas | `Account`, `Workspace` (multi-tenant natif, prépare le multi-utilisateur Business), `Subscription`, `Quota` |

Invariants qu'on encode dans le domaine (et qu'on teste en premier, TDD) :

- Un `Item` a toujours un coût d'acquisition alloué (`AllocatedCost`), qu'il vienne d'un lot (répartition égale, au poids, ou manuelle) ou d'un achat unitaire (coût direct).
- Une `Sale` ne peut référencer qu'un `Item` en statut `LISTED` ou `IN_STOCK`, et le passe en `SOLD` via un Domain Event `ItemSold`.
- `Money` est un Value Object en centimes entiers avec devise ; jamais de `parseFloat` sur des decimals stringifiés comme aujourd'hui.
- `PlatformFeePolicy` est une stratégie par plateforme (Vinted FR : 0 % vendeur ; Vestiaire : commission par palier ; eBay : ~13 % ; Leboncoin : 0 % hors paiement sécurisé). Ajouter une plateforme = ajouter une classe, pas modifier le calcul (Open/Closed).
- Le floor price d'un lot = (investissement restant à couvrir + marge cible) / pièces restantes vendables, recalculé à chaque `ItemSold`, `ItemLost`, `SaleRefunded`.

### 4.4 Style de code : OOP + SOLID, mais pragmatique

- **Entités et Value Objects en classes** avec constructeurs privés et fabriques (`Money.of(2000, "EUR")`, `Item.fromUnitPurchase(...)`), égalité structurelle, immutabilité des VO.
- **Use cases en classes à responsabilité unique** (`RecordSaleUseCase.execute(command)`), dépendances injectées par le constructeur via des ports (interfaces) : `ItemRepository`, `Clock`, `FeePolicyResolver`, `EventBus`. Injection légère sans framework (composition root par contexte), donc testable sans mock magique.
- **Repositories** : une interface dans `application`, une implémentation Drizzle dans `infrastructure`, une implémentation in-memory dans les tests.
- **Result type** (`Ok | Err`) pour les erreurs métier attendues, exceptions uniquement pour les bugs.
- React côté `apps/web` reste fonctionnel (composants, hooks) : on ne force pas l'OOP dans l'UI, on le réserve au domaine et à l'application.

### 4.5 TDD : ordre de construction

1. `packages/domain` : tests d'abord pour `Money`, `AllocatedCost`, `ItemStatus` transitions, `PlatformFeePolicy`, `FloorPricePolicy`, `LotPerformance` (on reprend les 123 tests existants comme jeu de non-régression du moteur).
2. `packages/application` : tests des use cases avec repositories in-memory (`CreateUnitPurchase`, `ReceiveLot`, `AllocateLotCosts`, `ListItem`, `RecordSale`, `RefundSale`, `RequestAppraisal`).
3. `packages/infrastructure` : tests d'intégration Drizzle sur Postgres (Testcontainers), contrats des adaptateurs IA avec réponses enregistrées.
4. `apps/web` : tests de composants (Vitest + Testing Library), e2e Playwright sur les 5 parcours critiques (inscription, achat unitaire en brocante hors-ligne puis sync, réception de lot, vente, export mensuel).

### 4.6 Données et infrastructure

| Brique | Choix | Pourquoi |
|---|---|---|
| Base | PostgreSQL 17 (Railway ou Neon) + Drizzle | Continuité avec l'existant, migrations versionnées cette fois |
| Multi-tenant | `workspace_id` sur **chaque** table métier + Row Level Security Postgres en défense en profondeur | Corrige la faille actuelle au niveau base, pas seulement au niveau code |
| Photos | Cloudflare R2 (S3 compatible, egress gratuit) + upload direct signé + variantes via Cloudflare Images | Résout le problème des URIs locales, coût quasi nul |
| Auth | Better Auth (email + Google + Apple, sessions, 2FA) | Remplace le JWT maison, gère le refresh et la sécurité pour nous |
| Paiement | Stripe Billing (Checkout + Customer Portal + webhooks signés) | Fonctionne sur le web, marge bien meilleure que les stores |
| IA | Adaptateur multi-fournisseur (Gemini 2.5 Flash pour le coût, Claude pour la génération d'annonce), prompts versionnés, sortie validée par Zod, quota compté par workspace | Reprend le prompt existant, ajoute ce qui manque (génération d'annonce, mesures, prix neuf) |
| Offline | Service worker Serwist + base locale IndexedDB (Dexie) avec file de mutations et résolution "last write wins" par champ, horodatage serveur | Le cas brocante sans réseau devient le cas nominal |
| Hébergement | Vercel pour `apps/web` (Edge + ISR pour la landing, Node runtime pour l'API interne), Railway pour Postgres et les workers (cron plans/essais, génération PDF) | Tu as les accès sur les deux |
| Observabilité | Sentry (réellement, cette fois), PostHog (produit, feature flags), logs structurés Pino | Les docs le promettent depuis février |

### 4.7 Front : design et direction artistique

On garde l'identité **Vanta** (Aether or-sur-noir / Ivory champagne-sur-ivoire), qui est distinctive et déjà validée par les maquettes Stitch. On la porte en **tokens CSS** (`@theme` Tailwind v4) avec les deux thèmes, `color-scheme`, et on corrige le noir de base cassé.

Principes UI pour une PWA "world-class" :

- **Mobile-first à une main** : actions primaires dans la zone du pouce, bottom sheet plutôt que modales, FAB contextuel "Scanner / Ajouter une pièce".
- **Micro-interactions** avec Motion (ex-Framer) : spring physics pour les transitions de liste, nombres qui comptent (`animate` sur les KPI), skeletons qui matchent la forme finale, haptique via `navigator.vibrate` sur Android.
- **Vitesse perçue** : RSC + streaming pour les listes, optimistic updates sur toutes les mutations (une vente enregistrée apparaît instantanément, se synchronise ensuite).
- **Accessibilité** : contraste AA vérifié par test automatisé sur les tokens, `prefers-reduced-motion` respecté, focus visible, navigation clavier pour la version desktop.
- **Desktop** : la même app devient un vrai back-office (tableaux denses, raccourcis clavier, import CSV), ce que l'app Expo ne pouvait pas offrir.

---

## 5. Périmètre fonctionnel v2 (par persona)

### 5.1 Socle (tous les plans)

| Module | Fonctionnalités |
|---|---|
| **Sourcing** | Achat unitaire en 3 taps (photo, prix, lieu auto), lots Fleek / Eureka avec réception (annoncé vs reçu), palettes au poids, picking, fournisseurs favoris, événements brocante avec date et adresse, import Brocabrac par lien (parsing de la page) |
| **Inventaire** | Fiche pièce complète (marque, catégorie, taille, mesures, matière, état, RRP, photos, SKU auto, emplacement bac), scan IA depuis la caméra web, statuts (en stock, en ligne, réservé, vendu, retourné, perdu, don), recherche plein texte, filtres, vue grille photo |
| **Ventes** | Vente en 2 taps depuis la pièce, plateforme avec frais calculés automatiquement, port et emballage, vente groupée (plusieurs pièces à un acheteur), retours et remboursements, historique |
| **Finance** | Dashboard (CA, marge nette, ROI, stock valorisé au coût, stock dormant), floor price par lot et par pièce, performance par source, par plateforme, par marque, par catégorie, comparaison de périodes |
| **Compte** | Multi-appareil natif, offline, thèmes Aether / Ivory, FR / EN / DE, export CSV |

### 5.2 Premium (~6 €/mois)

Scan IA illimité, génération d'annonces (titre, description, hashtags) et suggestion de prix par plateforme, graphiques avancés, rapport mensuel PDF, alertes stock dormant, historique illimité, sans limite de pièces.

### 5.3 Pro (~15 €/mois)

Export comptable (journal achats/ventes, TVA sur marge, seuils micro-entreprise), étiquettes QR imprimables et rangement par bac, import CSV, multi-boutique (physique + en ligne), API + webhooks, analyses de tendance par marque.

### 5.4 Business (~35 €/mois, plus tard)

Multi-utilisateurs avec rôles, plusieurs workspaces, branding des rapports, intégrations marketplaces quand des APIs ouvertes existeront (Vinted n'en propose pas ; eBay et Etsy oui).

---

## 6. Roadmap proposée

| Phase | Durée indicative | Livrable |
|---|---|---|
| **0. Fondations** | 1 semaine | Monorepo, CI (typecheck tsgo, Biome, Vitest, Playwright), design tokens Vanta, Postgres + Drizzle + RLS, Better Auth, déploiement Vercel + Railway, Sentry, PostHog |
| **1. Domaine** | 2 semaines | `packages/domain` et `application` complets en TDD : Money, Item, PurchaseSource (4 types), Sale, FeePolicies, FloorPrice, Performance. Reprise des 123 tests existants |
| **2. Parcours cœur** | 3 semaines | Achat unitaire, lots avec réception, inventaire avec photos R2, vente multi-plateforme, dashboard. PWA installable, offline avec sync |
| **3. IA et pricing** | 2 semaines | Scanner (caméra web + upload), estimation, génération d'annonce, quota par workspace, comparateur prix neuf / prix cible |
| **4. Finance et compta** | 2 semaines | Rapports, export comptable, TVA sur marge, PDF mensuel, étiquettes QR |
| **5. Monétisation et lancement** | 1 semaine | Stripe Billing, plans, essai 14 jours, landing SEO (App Router, ISR), onboarding guidé |
| **6. Migration** | 0,5 semaine | Script d'import des données actuelles (lots, items, sales) vers le nouveau schéma, rattachées à ton workspace |

Total : environ 11 à 12 semaines pour une v2 livrable, à un rythme soutenu. Chaque phase se termine par une démo déployée sur une URL de preview Vercel.

---

## 7. Décisions à trancher avant de coder

1. **Next.js PWA seule en phase 1, Expo en phase 2 seulement si nécessaire** : c'est ma recommandation. Confirme.
2. **Stripe au lieu de RevenueCat** : obligatoire pour une PWA. Le compte RevenueCat actuel devient inutile.
3. **Nouveau schéma de base** avec script de migration de tes données, plutôt qu'une évolution du schéma actuel mono-tenant. Je recommande le nouveau schéma.
4. **Nom des concepts** : "Source d'achat" (lot / palette / picking / achat unitaire) remplace "Lot" comme concept racine. À valider avec toi car ça change le vocabulaire de toute l'app.
5. **Accès Vercel et Railway** : dans cette session je dispose des outils GitHub et Cloudflare (R2, D1, KV, Workers), mais pas des connecteurs Vercel ni Railway. Il faudra soit les activer sur la session, soit me fournir des tokens en variables d'environnement, soit que je te livre les fichiers de config (`vercel.json`, `railway.json`) à appliquer.
6. **Grilles de frais par plateforme** : je pars sur Vinted FR 0 % vendeur, Vestiaire Collective commission par palier, eBay ~13 %, Leboncoin 0 %, Depop 0 % (depuis 2024). À confirmer avec tes chiffres réels, ils changent souvent.

---

## 8. Ce qu'on réutilise de l'existant

| Réutilisé tel quel ou adapté | Abandonné |
|---|---|
| Moteur de calcul + ses 123 tests (base des tests domaine) | Les 4 couches data (`api.ts`, `enterprise.ts`, `*.pg.ts`, sqlite) |
| Prompt d'analyse IA (structure JSON identification / pricing / market / recommendation) | Le JWT maison et le store auth |
| 572 clés i18n FR / EN / DE | RevenueCat et la logique d'entitlement |
| Direction artistique Vanta (palette, matières, springs) et maquettes Stitch | Les écrans Expo de 1 000 à 2 000 lignes |
| Définition des plans et quotas (à réviser sur les prix) | L'API Express (remplacée par Route Handlers / Server Actions) |
| Personas et stratégie marketing des docs | Les docs d'audit désynchronisées (remplacées par des ADRs) |
