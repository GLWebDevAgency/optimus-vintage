# Lancement — reprendre le travail sur ton terminal et mettre Chiné en ligne

Ce guide part d'un poste vierge (macOS ou Linux) et va jusqu'au déploiement. Les étapes marquées **[toi]** demandent une action humaine (connexion à un compte, paiement, DNS) ; tout le reste peut être confié à Claude Code une fois les CLI connectées.

## 1. Outils

```bash
# Node 24 (cf. .nvmrc) + pnpm 12 (via corepack)
node -v                      # doit afficher v24.x ; sinon https://nodejs.org ou `nvm install 24`
corepack --version           # doit être ≥ 0.34.7 ; sinon `npm install -g corepack@latest` (les anciens corepack ne lancent pas pnpm ≥ 11)
corepack enable

# Claude Code
npm install -g @anthropic-ai/claude-code

# CLI des services
npm install -g @railway/cli          # hébergement (app + Postgres)
brew install stripe/stripe-cli/stripe # facturation (Linux : https://docs.stripe.com/stripe-cli#install)
brew install gh                       # GitHub (secrets, environnements, PR) ; Linux : https://cli.github.com
npm install -g wrangler               # Cloudflare R2 (photos)
```

## 2. Le dépôt

```bash
git clone https://github.com/GLWebDevAgency/optimus-vintage.git
cd optimus-vintage
git checkout claude/optimus-vintage-analysis-xqegi8
pnpm install
cp .env.example .env
pnpm dev            # http://localhost:3000 — tout fonctionne sans clé (PGlite, IA de démo)
```

## 3. Connexions **[toi]**

Chaque commande ouvre le navigateur ; aucune clé n'a besoin d'être collée dans une conversation.

```bash
gh auth login                    # compte GitHub propriétaire du dépôt
railway login                    # compte Railway (carte enregistrée pour le plan Hobby ou Pro)
stripe login                     # compte Stripe activé (KYC terminé pour encaisser)
wrangler login                   # compte Cloudflare (R2 activé, gratuit jusqu'à 10 Go)
```

À avoir sous la main, à mettre dans `.env` (jamais commité) ou à donner aux CLI quand elles le demandent :

| Clé | Où l'obtenir | Sert à |
|---|---|---|
| `RESEND_API_KEY` | resend.com → API Keys, après vérification du domaine d'envoi | e-mails de vérification et mot de passe oublié (obligatoire en production) |
| `ANTHROPIC_API_KEY` | console.anthropic.com | expert IA (premier fournisseur de la chaîne) |
| `GEMINI_API_KEY`, `OPENAI_API_KEY` | facultatif | fournisseurs de repli |
| `SENTRY_DSN` | sentry.io, projet Next.js | erreurs serveur et client (facultatif) |

## 4. Reprendre la session Claude Code

Depuis le dossier du dépôt :

```bash
claude --teleport session_01NMLBs3FuPFsHRjHmXc3hcv
```

Si ta version ne connaît pas `--teleport`, la session web (claude.ai/code) propose un bouton « Ouvrir dans le terminal » qui donne la commande exacte ; sinon `claude` puis `/resume`. Une fois dans la session, colle la mission de la section 6.

## 5. Ce que Claude fera, dans l'ordre

1. **Stripe** : produits « Chiné Chineur » et « Chiné Pro », prix mensuels et annuels en centimes (699 / 5 900 et 1 499 / 12 900), essai de 14 jours géré par le checkout, webhook `…/api/v1/billing/webhook` avec les cinq événements, portail client. Exemple de ce qui sera exécuté :

   ```bash
   stripe products create --name "Chiné Chineur" --description "500 pièces, IA, analytique, rapport mensuel"
   stripe prices create --product prod_xxx --currency eur --unit-amount 699 -d "recurring[interval]=month" --lookup-key premium_monthly
   stripe prices create --product prod_xxx --currency eur --unit-amount 5900 -d "recurring[interval]=year" --lookup-key premium_yearly
   stripe webhook_endpoints create --url https://staging.chine.app/api/v1/billing/webhook \
     --enabled-events checkout.session.completed customer.subscription.created customer.subscription.updated customer.subscription.deleted invoice.payment_failed
   ```

2. **Railway** : `./deploy/railway/bootstrap.sh` (projet, environnements `staging` et `production`, un Postgres chacun, service `web`), variables poussées depuis `deploy/railway/*.env`, jetons de projet dans GitHub :

   ```bash
   gh secret set RAILWAY_TOKEN_STAGING
   gh secret set RAILWAY_TOKEN_PRODUCTION
   gh variable set PRODUCTION_URL --body https://chine.app
   ```

3. **Cloudflare R2** : bucket `chine-photos`, règle CORS, domaine public, clés d'accès dans Railway.
4. **Déploiement staging** (branche `staging`), test réel : inscription, capture, expertise IA, vente, checkout Stripe en mode test, export CSV, hors ligne.
5. **Production** : environnement GitHub `production` avec relecteur obligatoire (toi), passage des prix Stripe en mode live, domaine, HSTS, sauvegardes Postgres, puis merge sur `production`.
6. **Hygiène** : révocation de l'ancien mot de passe Postgres du dépôt historique (à faire dans le tableau de bord Railway de l'ancien projet), rotation des secrets.

## 6. Mission à coller dans la session

```
Reprends le projet Chiné là où on s'est arrêté (branche claude/optimus-vintage-analysis-xqegi8, commit 49c2ce5 ou plus récent).
Les CLI gh, railway, stripe et wrangler sont connectées sur ce terminal. Objectif : mettre l'app en ligne et démarrer l'activité.
1. Crée les produits, prix (mensuel et annuel, en centimes, selon packages/domain/src/billing/plans.ts), le webhook et le portail client sur Stripe, d'abord en mode test, et renseigne les variables STRIPE_* de staging.
2. Bootstrappe Railway avec deploy/railway/bootstrap.sh, crée le bucket R2 et sa règle CORS, pousse toutes les variables (docs/ENVIRONNEMENTS.md), enregistre les secrets GitHub, puis déploie staging et vérifie /api/ready, /api/health et un parcours complet avec de vraies clés.
3. Prépare la production : environnement GitHub avec relecteur obligatoire, prix Stripe en mode live, domaine chine.app, sauvegardes Postgres, puis déploie.
4. Dis-moi précisément à chaque étape ce que tu ne peux pas faire toi-même (DNS, KYC Stripe, domaine Resend) et quoi cliquer.
Ne colle jamais une clé dans le dépôt ni dans la conversation ; utilise .env et les CLI.
```

## 7. Ce qui reste humain, quoi qu'il arrive

- **DNS** : pointer `chine.app` et `staging.chine.app` vers Railway (CNAME fourni par Railway) et le sous-domaine d'envoi vers Resend (enregistrements SPF/DKIM).
- **Stripe** : activation du compte (identité, IBAN) avant le premier encaissement réel.
- **Juridique** : mentions légales (raison sociale, SIREN, hébergeur, médiateur) et relecture des CGU.
- **Ancien secret** : révoquer le mot de passe Postgres qui figurait dans `legacy/optimus-vintage/api/README.md`.
