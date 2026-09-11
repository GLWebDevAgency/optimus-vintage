# État du déploiement — 11 septembre 2026

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

## 2. Bloquants qui ne dépendent pas du code

1. **GitHub Actions est désactivé pour raison de facturation.** Tout déploiement poussé sur `staging` ou `production` échoue immédiatement : « The job was not started because recent account payments have failed or your spending limit needs to be increased. » Le pipeline est correct, mais il ne s'exécutera pas tant que la facturation GitHub n'est pas régularisée. En attendant, le déploiement se fait à la main : `railway up --ci --environment staging --service web`.
2. **Le compte Stripe n'est pas activé.** `charges_enabled: false`, `payouts_enabled: false`, dossier non soumis. Aucun encaissement réel n'est possible et les prix en mode production ne peuvent pas être créés. Il faut compléter l'activation (identité, adresse, IBAN) dans le tableau de bord.
3. **Les relecteurs obligatoires d'environnement ne sont pas disponibles.** L'API GitHub répond : « Please ensure the billing plan supports the required reviewers protection rule. » Sur un dépôt privé, cette protection demande un plan payant. Trois options : rendre le dépôt public, souscrire un plan, ou n'autoriser la production que par déclenchement manuel.

## 3. À faire, dans l'ordre

### Pour terminer la recette

1. **Clé d'IA** : créer une clé sur la console Anthropic, la poser en variable Railway, puis basculer `APPRAISER_DRIVER` sur `anthropic` (ou `anthropic,gemini` avec une clé Gemini de secours).
2. **Resend** : vérifier un domaine d'envoi, créer une clé, la poser, puis retirer `CHINE_ALLOW_NO_MAILER`.
3. **R2** : dans le tableau de bord Cloudflare, créer un jeton d'API R2 (lecture et écriture sur les deux buckets), relever l'identifiant de compte, exposer les buckets publiquement (domaine personnalisé ou `r2.dev`), puis poser la règle CORS suivante et basculer `STORAGE_DRIVER` sur `r2` :

```json
[{ "AllowedOrigins": ["https://web-staging-01ce.up.railway.app"],
   "AllowedMethods": ["PUT"],
   "AllowedHeaders": ["Content-Type"],
   "MaxAgeSeconds": 3600 }]
```

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
