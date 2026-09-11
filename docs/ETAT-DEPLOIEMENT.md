# État du déploiement — 11 septembre 2026 (mis à jour en fin de journée)

Relevé factuel de ce qui est en place, de ce qui bloque et de ce qui reste à faire. Mis à jour à chaque session de déploiement.

## 1. En place et vérifié

### Stripe (mode test uniquement)

| Élément | Valeur |
|---|---|
| Compte | `acct_1S8qJz4Bzn4LbVLC` — France, EUR |
| Produits | « Chiné Chineur » et « Chiné Pro » |
| Prix | 4 prix en centimes, `tax_behavior=inclusive` (prix TTC, immuable après création) |
| Clés de recherche | `premium_monthly` 699, `premium_yearly` 5900, `pro_monthly` 1499, `pro_yearly` 12900 |
| Webhook | `https://web-staging-01ce.up.railway.app/api/v1/billing/webhook`, 5 événements |
| Portail client | Configuration par défaut : changement de formule, annulation en fin de période, mise à jour e-mail / adresse / numéro de TVA |

Aucun prix n'est créé pour la formule Atelier : elle est en liste d'attente et le contrat la refuse désormais au paiement.

### Railway

| Élément | Valeur |
|---|---|
| Projet | `chine` (`c7590bf6-3336-4e2d-a448-58f4f183bcbc`), distinct de l'ancien projet `Optimus-vintage` |
| Staging | Postgres `Postgres`, service `web`, volume `/data`, domaine `https://web-staging-01ce.up.railway.app` |
| Production | Postgres **`Postgres-j16W`**, service `web` (instance créée, non déployée) |

**Piège à connaître :** en production le service Postgres s'appelle `Postgres-j16W` et non `Postgres` (le nom était déjà pris par staging, les services étant nommés au niveau du projet). La référence de production doit donc être `${{Postgres-j16W.DATABASE_URL}}`. Une référence qui ne se résout pas ne fait plus démarrer l'app depuis que `DATABASE_URL` est obligatoire en production, au lieu de basculer silencieusement sur une base embarquée éphémère.

### Cloudflare R2

Buckets `chine-photos-staging` et `chine-photos` créés (région ENAM). Ni identifiants S3, ni règle CORS, ni domaine public : voir la section 3.

### GitHub

Secrets `RAILWAY_TOKEN_STAGING` et `RAILWAY_TOKEN_PRODUCTION` (jetons de projet, un par environnement) et variable `PRODUCTION_URL` enregistrés. Environnement `production` créé, mais **sans relecteur obligatoire** : voir la section 2.

### Déploiement staging

Déployé et vérifié par 24 contrôles automatisés (`scripts` de vérification en session) :

- Sondes `/api/ready` et `/api/health`, commit servi conforme au commit déployé.
- Base **Postgres** confirmée, et non la base embarquée.
- Neuf pages publiques en 200, redirection de `/app` sans session, 401 sur l'API sans session.
- Inscription, session, création d'une pièce en capture rapide, rejeu idempotent (même `clientId` → 200 sans doublon).
- Session de paiement Stripe créée ; formule en liste d'attente refusée.
- Mutation cross-site refusée (403), en-tête `noindex` sur `/app`, CSP présente.

Chaîne de facturation testée de bout en bout : abonnement créé → webhook reçu → compte passé de Gratuit à Chineur, quotas suivis (500 pièces, 100 crédits par mois, 40 par jour), état d'essai exposé ; puis annulation → retour à Gratuit avec les quotas d'origine.

**Réglages actuels de staging**, à faire évoluer dès que les clés arrivent :

| Variable | Valeur actuelle | Pourquoi | À faire |
|---|---|---|---|
| `APPRAISER_DRIVER` | `fake` | Aucune clé d'IA disponible ; un fournisseur nommé sans clé empêche le conteneur de démarrer | `anthropic,gemini` une fois les clés posées |
| `STORAGE_DRIVER` | `local` + volume `/data` | Pas d'identifiants R2 | `r2` une fois les cinq variables R2 posées |
| `CHINE_ALLOW_NO_MAILER` | `true` | Pas de clé Resend | Retirer une fois `RESEND_API_KEY` posée |
| `STRIPE_SECRET_KEY` | clé de test du CLI | Expire le **24 novembre 2026** | Remplacer par une clé du tableau de bord |

Changer `STORAGE_DRIVER` fait perdre l'accès aux photos déjà enregistrées : seule la clé de l'objet est stockée, l'URL est recalculée à chaque lecture. Sans conséquence en recette, à décider avant la production.

## 2. Blocages levés dans la journée

1. **Intégration continue rétablie.** Le dépôt est passé en public, ce qui rend GitHub Actions
   gratuit et illimité. Le pipeline complet est vert : vérification (lint, typecheck, tests,
   build) puis déploiement Railway et contrôle du commit servi. La variable `STAGING_URL` a été
   définie, car la vérification interrogeait `staging.chine.app`, domaine qui n'existe pas encore.
2. **Approbation manuelle en production activée.** Elle était refusée par le plan de facturation
   sur un dépôt privé. L'environnement `production` porte désormais un relecteur obligatoire et
   une politique de branche.
3. **Secret historique neutralisé.** L'ancien projet Railway « Optimus-vintage » a été supprimé
   (service et base) : le mot de passe qui figurait dans le dépôt n'ouvre plus rien, ce qui a été
   vérifié par une tentative de connexion. L'historique a ensuite été réécrit avec `git filter-repo`
   pour remplacer cette valeur dans les 92 commits, puis republié de force sur toutes les branches.
   Une sauvegarde complète du dépôt avant réécriture a été conservée hors du projet.
4. **Téléversement de photos réparé.** Il échouait en `EACCES` : Railway monte les volumes en root
   alors que l'image tourne sous un utilisateur non privilégié. Corrigé par `RAILWAY_RUN_UID=0`,
   à retirer dès le passage au stockage R2.

Reste à traiter : le compte Stripe n'est toujours pas activé (`charges_enabled: false`). Sans
activation, aucun encaissement réel n'est possible. La recette continue en mode bac à sable.

## 3. À faire, dans l'ordre

### Pour terminer la recette

1. **Clé d'IA** : créer une clé sur la console Anthropic, la poser en variable Railway, puis basculer `APPRAISER_DRIVER` sur `anthropic` (ou `anthropic,gemini` avec une clé Gemini de secours).
2. **Resend** : vérifier un domaine d'envoi, créer une clé, la poser, puis retirer `CHINE_ALLOW_NO_MAILER`.
3. **R2 : tout est prêt sauf les identifiants.** Le bucket de recette est créé, exposé
   publiquement sur `https://pub-f969ac1e95ea46b283609b041606e0e4.r2.dev`, et sa règle CORS est
   posée (PUT depuis l'origine de la recette, en-tête `Content-Type`, une heure de cache).
   L'identifiant de compte Cloudflare est `691d06dac6c6375862a1feed0517bd12`.

   Il ne manque que la paire de clés S3, que ni wrangler ni l'API accessible ne peuvent créer :
   Cloudflare → R2 → « Manage API tokens » → créer un jeton « Object Read & Write » sur les deux
   buckets. Reporter ensuite `R2_ACCESS_KEY_ID` et `R2_SECRET_ACCESS_KEY`, passer
   `STORAGE_DRIVER` à `r2`, poser `R2_PUBLIC_BASE_URL`, et retirer `RAILWAY_RUN_UID`.

   Attention : la règle CORS attendue par l'API R2 n'a pas la forme documentée jusqu'ici. Le bon
   format est un objet `{"rules": [{"allowed": {"origins": [...], "methods": [...],
   "headers": [...]}, "maxAgeSeconds": 3600}]}`, et non le format S3 `AllowedOrigins`.

### Pour ouvrir la production

4. Régulariser la facturation GitHub (point 1 de la section 2) pour que le pipeline fonctionne.
5. Activer le compte Stripe, puis créer les produits et prix en mode production avec `tax_behavior=inclusive`, et un webhook vers le domaine de production.
6. Acheter et brancher `chine.app` : domaine personnalisé sur le service Railway de production, puis reporter l'origine dans `NEXT_PUBLIC_APP_URL` et `BETTER_AUTH_URL`.
7. Compléter les variables de production depuis `deploy/railway/production.env.example`, sans oublier `${{Postgres-j16W.DATABASE_URL}}`, un `BETTER_AUTH_SECRET` généré (`openssl rand -base64 48`) et `RAILWAY_DOCKERFILE_PATH`.
8. Ajouter un volume `/data` au service web de production et lui générer un domaine.
9. Activer les sauvegardes quotidiennes du Postgres de production et tester une restauration.

### Hygiène de sécurité

10. **Révoquer le mot de passe Postgres de l'ancien projet `Optimus-vintage`** : il figurait en clair dans l'historique du dépôt. Le projet existe toujours sur Railway avec ses services `optimus-api` et `Postgres`.
11. Remplacer la clé Stripe de test du CLI (expire le 24 novembre 2026) par une clé du tableau de bord.
12. Activer la double authentification sur GitHub, Railway, Stripe, Cloudflare, Resend et Anthropic ; poser un plafond de dépense sur la console Anthropic.

## 4. Dette connue, à traiter avant d'ouvrir aux vrais clients

- **Photos en mode R2** : ni suppression des métadonnées EXIF et GPS, ni limite de taille réelle. Ces deux protections n'existent que sur le chemin local. Un bucket public exposerait les coordonnées de prise de vue. À corriger avant toute mise en ligne des photos en R2.
- **`STORAGE_DRIVER=auto`** retombe silencieusement sur le disque local si une seule variable R2 manque. La validation ne couvre aujourd'hui que le cas `r2` explicite.
- **Vérification du commit déployé** : `APP_COMMIT` est une variable de service, prioritaire sur la valeur figée dans l'image. Un déploiement déclenché hors du pipeline peut donc annoncer un commit qui n'est pas celui servi.
- **Étiquette de version** non idempotente dans le workflow de production : un rejeu sur le même commit fait échouer le job après un déploiement pourtant réussi.
- **La recette ne passe pas les tests de bout en bout** avant déploiement, contrairement à la production.
