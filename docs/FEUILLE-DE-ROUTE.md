# Feuille de route — les besoins auxquels on ne pense pas au lancement

Inventaire de ce qu'il faut pour faire tourner Chiné comme une activité, pas seulement comme une app. Chaque ligne porte une priorité (P0 avant le lancement, P1 dans les trois mois, P2 ensuite), un statut, et ce que cela demande. Les lignes « fait » ont été livrées avec ce document.

## 1. Avant d'ouvrir les inscriptions (P0)

| Besoin | Pourquoi | Statut |
|---|---|---|
| **Marque et domaine** : vérifier « Chiné » à l'INPI et à l'EUIPO (classes 9, 35, 42), s'assurer que `chine.app` est bien possédé | Renommer après la première campagne coûte tout le référencement et la confiance | à faire, toi |
| **Structure juridique et compte Stripe activé** (identité, IBAN), CGV liées à l'entité, assurance RC pro | Stripe n'encaisse pas sans entité ; les CGU citent un éditeur | à faire, toi |
| **Boîte de réception** pour `bonjour@chine.app` (Google Workspace ou équivalent) : Resend n'envoie que dans un sens | Les réponses des clients, les rétractations et les demandes RGPD arrivent par e-mail | à faire, toi |
| **SPF, DKIM, DMARC** sur le domaine d'envoi | Sinon les e-mails de vérification finissent en spam | à faire, toi (enregistrements fournis par Resend) |
| **Comptes protégés** : double authentification sur GitHub, Railway, Stripe, Cloudflare, Resend, Anthropic ; clés API séparées staging / production | Un seul compte compromis = la base et les paiements | à faire, toi |
| **Plafonds de dépense** : limite mensuelle dans la console Anthropic (et Google si activé), alertes d'usage Railway, Stripe Radar activé | Le coût IA est proportionnel à l'usage ; un abus ou une boucle client peut coûter cher en une nuit | à faire, toi ; côté app : **fait** (crédits mensuels + plafond journalier par compte : 5 / 40 / 100 / 300) |
| **Sauvegardes Postgres** activées sur Railway et une restauration testée sur staging | Une base perdue est une activité perdue | à faire, toi |
| **Supervision** : sonde externe sur `/api/ready` (Better Uptime, UptimeRobot) avec alerte téléphone ; Sentry déjà branché | Savoir avant les clients que le service est tombé | à faire, toi |
| **Journaux** : rétention et absence de données personnelles vérifiées sur Railway | RGPD : les journaux contiennent des identifiants d'utilisateur, pas d'e-mail ni de corps | **fait** côté app, rétention à régler sur Railway |
| **Mises à jour de dépendances automatiques** (Dependabot hebdomadaire, groupées) et analyse de secrets GitHub activée | Une faille connue non corrigée est la première cause d'incident | **fait** (`.github/dependabot.yml`), analyse de secrets à activer dans les réglages du dépôt |
| **Indicateurs de pilotage** : inscriptions, activation, conversion, abonnés, MRR, coût IA | Sans chiffres, le business plan n'est qu'une hypothèse | **fait** (`pnpm --filter @chine/web kpi`, lisible dans le terminal, à lancer sur la base de production) |
| **Réglages Stripe** : e-mails de fin d'essai et de paiement échoué, relances automatiques (Smart Retries), portail client avec changement de plan et annulation, Stripe Tax avec adresse d'origine | La conversion des essais et la récupération des impayés se jouent là | à faire, toi (dix minutes dans le tableau de bord) |
| **Bêta fermée** : vingt revendeurs réels pendant deux semaines sur staging, avec un formulaire de retour | Les vrais lots, les vraies photos et les vrais téléphones révèlent ce que les tests ne voient pas | à faire, ensemble |

## 2. Dans les trois mois après le lancement (P1)

| Besoin | Pourquoi | Ce que ça demande |
|---|---|---|
| **E-mails de cycle de vie** : bienvenue, guide des trois premiers jours, essai qui se termine, crédits à 80 %, récapitulatif hebdomadaire des ventes et de la marge | C'est le premier levier de conversion et de rétention d'un SaaS grand public | Modèles Resend, une tâche de fond quotidienne (le planificateur existe) |
| **Recharges de crédits IA** (paiement unique Stripe, par exemple 100 crédits pour 4,99 €) | Les gros utilisateurs paient l'usage au lieu de partir ou de contourner | Produit Stripe « one-off », colonne de crédits bonus, webhook |
| **Retour sur la précision des expertises** : pouce haut / bas, et écart entre estimation et prix de vente réel | Améliore les prompts, mesure la qualité, et donne un argument marketing chiffré | Deux champs, une métrique dans l'analytique (les données existent déjà) |
| **Jeu d'évaluation IA** : cinquante photos étiquetées (marque, époque, état, prix vendu) rejouées à chaque changement de prompt ou de modèle | Sans ça, changer de modèle pour économiser peut dégrader la qualité sans qu'on le voie | Un dossier de photos, un script, un score |
| **Import de données** (CSV générique, puis tableur type Google Sheets) | Un revendeur qui a déjà un fichier ne repart pas de zéro | Cas d'usage d'import avec aperçu et déduplication |
| **Récapitulatif annuel pour l'administration** : chiffre d'affaires et marge par année, prêt pour la déclaration et pour répondre à un contrôle | Depuis DAC7, Vinted et les autres transmettent au fisc les vendeurs à partir de 30 ventes ou 2 000 € par an ; le revendeur doit pouvoir justifier | Extension de l'export comptable (`?year=`) |
| **Parrainage** : un mois offert au parrain et au filleul | Le canal le moins cher pour une communauté qui se parle déjà | Code de parrainage, coupon Stripe |
| **Analytique produit sans cookie** (Plausible ou Umami, hébergé en Europe) : entonnoir inscription → première pièce → première vente → paiement | Mesurer où les gens décrochent ; pas de bandeau cookies nécessaire | Un script, quatre événements |
| **Allemand complet, espagnol et italien** ; grilles de frais Wallapop, Subito, Kleinanzeigen, Marktplaats | Les campagnes hors France dépendent de la langue et des plateformes locales | Fichiers de messages, entrées de grille de frais |
| **Vue bureau** : tableau de stock et de ventes triable sur grand écran | Les Pro gèrent leur stock depuis un ordinateur | Mise en page en colonnes, tableau de données |
| **Centre d'aide** : dix articles (premier lot, palette, prix plancher, expertise, export, hors ligne) et un lien « Nous écrire » dans l'app | Réduit le support et rassure avant de payer | Pages statiques dans la vitrine |
| **Nouveautés et feuille de route publiques** | Montre que le produit vit ; alimente la newsletter | Une page, un flux |

## 3. Ensuite (P2)

| Besoin | Pourquoi |
|---|---|
| **Studio photo** (fond et lumière professionnels, 3 crédits) : attention aux règles des plateformes sur l'authenticité des photos ; proposer le fond neutre et conserver l'original | Gain de temps visible, argument de vente fort |
| **Régénération du texte d'annonce par plateforme** (1 crédit) et adaptation aux langues du pays de vente | Le revendeur colle sans réécrire |
| **Plusieurs photos par expertise** (étiquette, composition, défaut) | Précision nettement meilleure sur les marques et les tailles |
| **Import des ventes eBay et Etsy par API** (Vinted n'a pas d'API publique) | Moins de saisie pour les multi-plateformes |
| **Ventes groupées, remboursements partiels, registre de dépenses, sorties de chine** | Économie complète, déjà priorisés dans l'audit |
| **Multi-utilisateurs** (plan Atelier) : invitations, rôles | Débloque le plan et les friperies |
| **Application native** (Expo, socle existant) ou publication de la PWA sur le Play Store via TWA | Les gens cherchent dans les magasins d'applications ; l'iPhone exige l'app native pour les notifications riches |
| **Notifications push** (PWA) : pièce dormante, objectif du mois atteint | Rétention |
| **Choix du modèle IA par plan** et cache du prompt système | Si le coût IA dépasse 25 % du revenu net |
| **Devises hors euro** (PLN, SEK, CZK, DKK, HUF, RON) et prix Stripe localisés | Pologne, Suède, Tchéquie sont de gros marchés Vinted |
| **Double authentification pour les utilisateurs** | Rassure les Pro qui y stockent leur comptabilité |
| **Audit de sécurité externe** avant de dépasser quelques milliers d'abonnés | Attendu par les clients professionnels et par les assureurs |

## 4. Ce qui est déjà en place et qu'on oublie de dire

Chiffrement en transit, cookies sécurisés, CSRF, limitation de débit sur IP de confiance, idempotence des mutations hors ligne, export et suppression RGPD effective (abonnement Stripe résilié), photos sans métadonnées EXIF, estimations IA annoncées comme indicatives dans les CGU, fournisseurs d'IA nommés comme sous-traitants dans la politique de confidentialité, aucun cookie tiers, pages d'erreur et hors ligne, journal structuré sans donnée personnelle, migrations additives, déploiement avec approbation manuelle en production.
