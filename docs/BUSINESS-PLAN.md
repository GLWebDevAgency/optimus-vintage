# Business plan — prix, quotas, coût de l'IA et projections

Document de travail (septembre 2026). Il répond à trois questions : sur quoi reposent les prix et les quotas, combien coûte réellement l'IA que l'on vend, et ce que cela donne en revenus sur trois ans en Europe. Les hypothèses sont explicites pour être contestées ; le script qui produit les projections est reproductible (section 8).

## 1. Ce qui a changé au vu des chiffres

Trois corrections ont été faites dans le code en même temps que ce document :

- **Le modèle par défaut de l'expert IA passe de Claude Fable 5.1 à Claude Sonnet 5.** Fable 5.1 est facturé 10 $ / 50 $ par million de jetons, Sonnet 5 est à 2 $ / 10 $ (prix publics vérifiés le 9 septembre 2026). Une expertise coûtait environ 0,10 € ; elle coûte environ 0,02 €. Sur cette tâche (identifier une marque, une époque, un état, proposer une fourchette et un texte d'annonce), l'écart de qualité ne justifie pas un coût multiplié par cinq. Le modèle reste réglable par variable d'environnement.
- **Les quotas IA deviennent des crédits.** Chaque action IA a un coût en crédits : expertise photo 1 (texte d'annonce inclus), texte d'annonce seul 1, futur studio photo 3. Les plans donnent 10, 100, 300 et 1 000 crédits par mois. Plus aucun plan n'est « illimité » en IA : chaque appel a un coût réel. Les anciens plafonds (200 et 1 000 expertises) auraient pu coûter plus que l'abonnement.
- **Chaque expertise enregistre les jetons facturés** (entrée, sortie) et le serveur journalise un coût estimé. C'est ce qui permettra de piloter la marge par plan plutôt que de la supposer.

## 2. Sur quoi reposent les prix

Trois repères, croisés :

1. **Le gain pour l'utilisateur.** Une expertise qui évite un mauvais achat à 20 € ou fait vendre une pièce 10 € de plus rembourse un mois de Chineur. Le prix doit rester en dessous de la valeur d'une seule bonne décision par mois.
2. **Les outils comparables** (ordres de grandeur relevés sur leurs pages publiques, à revérifier avant chaque campagne) : Vendoo environ 9 à 20 $ par mois, Reseller Genie environ 10 $, Crosslist environ 30 €, List Perfectly 29 à 69 $, Photoroom Pro environ 10 à 13 € par mois pour la seule photo. Ces outils visent surtout les États-Unis et le multi-listing ; aucun ne fait le suivi lot et brocante ni l'expertise d'achat sur place. Chiné se place volontairement sous eux : 6,99 € et 14,99 € TTC.
3. **Le coût marginal**, détaillé ci-dessous : l'abonnement doit couvrir l'IA même quand l'utilisateur consomme tout son quota.

Les prix sont affichés TTC pour des particuliers et micro-entrepreneurs dans toute l'Union européenne (guichet unique TVA, section 7). La TVA française (20 %) est prise comme référence dans les calculs.

## 3. Coût réel d'une action IA

Hypothèses de charge d'une expertise : photo 1 600 × 1 200 px (environ 2 560 jetons d'image), prompt système et utilisateur environ 1 100 jetons, sortie JSON, texte d'annonce et réflexion basse environ 1 500 jetons. Taux 1 $ = 0,92 €.

| Modèle | Prix (entrée / sortie, $ par million) | Coût d'une expertise |
|---|---|---|
| Claude Fable 5.1 | 10 / 50 | 10,3 c€ |
| Claude Opus 5 | 5 / 25 | 5,2 c€ |
| **Claude Sonnet 5 (défaut)** | 2 / 10 | **2,1 c€** |
| Claude Haiku 4.5 | 1 / 5 | 1,0 c€ (retrait annoncé fin 2026) |
| Gemini 2.5 Flash (repli) | 0,30 / 2,50 (à vérifier) | 0,5 c€ |

Actions à venir, mêmes hypothèses :

| Action | Coût estimé | Crédits |
|---|---|---|
| Texte d'annonce seul (sans image, Sonnet 5) | 0,6 c€ | 1 |
| Studio photo : fond et lumière professionnels (génération d'image, ordre de grandeur 0,04 $ par image, à vérifier) | 3,6 c€ | 3 |

Le studio photo ne retouche pas la pièce : il remplace le fond et corrige l'éclairage. Une image générée coûte environ deux expertises ; d'où 3 crédits, ce qui garde la marge du plan identique quelle que soit la répartition des usages.

Leviers si le coût dérivait : cache du prompt système (lecture à 10 % du prix d'entrée), réduction de la photo à 1 200 px (environ 40 % de jetons d'image en moins), modèle moins cher pour le plan Gratuit, plafond journalier par compte contre les abus.

## 4. Économie unitaire par abonné et par mois

Frais Stripe pour l'Union européenne : environ 1,5 % + 0,25 € par transaction, plus Billing 0,7 % et Tax 0,5 %, soit 2,7 % + 0,25 €. Usage « typique » : un quart des crédits consommés ; « pire cas » : tous les crédits.

| Plan | Prix TTC | HT | Net après Stripe | IA typique | IA pire cas | Marge typique | Marge pire cas |
|---|---|---|---|---|---|---|---|
| Chineur | 6,99 € | 5,83 € | 5,39 € | 0,52 € | 2,06 € | 4,87 € (90 %) | 3,33 € (62 %) |
| Pro | 14,99 € | 12,49 € | 11,84 € | 1,55 € | 6,18 € | 10,29 € (87 %) | 5,65 € (48 %) |
| Chineur annuel | 59 € / an | 4,10 € / mois | 3,94 € / mois | 0,52 € | 2,06 € | 3,42 € | 1,88 € |
| Pro annuel | 129 € / an | 8,96 € / mois | 8,65 € / mois | 1,55 € | 6,18 € | 7,10 € | 2,47 € |
| Gratuit | 0 € | 0 € | 0 € | 0,08 € | 0,21 € | coût d'acquisition | coût d'acquisition |

Avec l'ancien réglage (Fable 5.1, 1 000 expertises sur Pro), le pire cas coûtait 103 € pour 11,84 € encaissés. Avec Sonnet 5 et 300 crédits, la marge reste positive même quand tout le quota est consommé.

## 5. Pourquoi ces quotas

- **Gratuit, 10 crédits** : de quoi vivre le moment « payé 20 €, expertisé 75 € » plusieurs fois, pour 0,20 € au pire. C'est le budget d'acquisition le moins cher que l'on puisse acheter.
- **Chineur, 100 crédits** : un revendeur qui chine chaque semaine expertise 20 à 40 pièces par mois. Cent couvre cet usage avec de la marge, et laisse de la place au studio photo.
- **Pro, 300 crédits** : environ dix pièces par jour ouvré, ou cent photos studio. Au-delà, l'usage est celui d'une boutique : recharges de crédits à venir (paiement unique Stripe, par exemple 100 crédits pour 4,99 €) plutôt qu'une hausse du prix de base.
- **Atelier, 1 000 crédits** : plafond réservé, le plan n'est pas vendu tant que le multi-utilisateurs n'est pas livré.

Le suivi des jetons permettra d'ajuster ces chiffres sur l'usage réel après trois mois, plutôt qu'à l'intuition.

## 6. Projections à 36 mois

Modèle : inscriptions organiques qui croissent chaque mois (bouche-à-oreille, référencement, communautés de revendeurs), plus un budget marketing fixe par année converti en inscriptions au coût d'acquisition indiqué ; conversion gratuit → payant dans le mois ; désabonnement mensuel ; 75 % Chineur, 25 % Pro ; 30 % d'annuels ; IA à un quart des quotas pour les payants et 40 % des crédits pour les gratuits actifs ; infrastructure 60 € par mois plus une part variable. Le temps des fondateurs n'est pas compté. Montants en euros.

### Scénario prudent (France seule, bouche-à-oreille lent)

Organique 150 inscriptions au premier mois (+8 % par mois jusqu'au mois 18, moitié ensuite), marketing 300 puis 600 puis 800 € par mois, coût d'acquisition 10 €, conversion 4 %, désabonnement 6 % par mois.

| Mois | Inscriptions/mois | Comptes créés | Gratuits actifs | Abonnés | MRR TTC | Revenu net HT | Coût IA | Infra | Marketing | Résultat | Cumul |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 180 | 180 | 108 | 7 | 59 | 46 | 14 | 62 | 300 | -330 | -330 |
| 6 | 250 | 1 280 | 548 | 45 | 366 | 287 | 80 | 75 | 300 | -167 | -1 503 |
| 12 | 380 | 3 207 | 1 033 | 98 | 804 | 631 | 161 | 97 | 300 | 73 | -1 697 |
| 18 | 615 | 6 338 | 1 731 | 177 | 1 451 | 1 138 | 279 | 132 | 600 | 126 | -1 875 |
| 24 | 789 | 10 673 | 2 483 | 272 | 2 235 | 1 753 | 415 | 180 | 600 | 557 | 382 |
| 36 | 1 248 | 23 029 | 4 122 | 499 | 4 094 | 3 210 | 725 | 315 | 800 | 1 370 | 11 034 |

Rentable au mois 11 ; ARR TTC au mois 36 environ 49 000 € ; IA à 23 % du revenu net ; creux de trésorerie environ 2 100 €.

### Scénario central (France, puis Allemagne, Espagne, Italie en année 2)

Organique 250 (+12 % par mois jusqu'au mois 18), marketing 500 puis 1 500 puis 2 500 € par mois, coût d'acquisition 8 €, conversion 6 %, désabonnement 4,5 %.

| Mois | Inscriptions/mois | Comptes créés | Gratuits actifs | Abonnés | MRR TTC | Revenu net HT | Coût IA | Infra | Marketing | Résultat | Cumul |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 312 | 312 | 188 | 19 | 154 | 121 | 30 | 64 | 500 | -473 | -473 |
| 6 | 503 | 2 404 | 1 043 | 131 | 1 072 | 840 | 187 | 91 | 500 | 63 | -1 309 |
| 12 | 932 | 6 783 | 2 300 | 337 | 2 767 | 2 170 | 450 | 145 | 500 | 1 075 | 2 349 |
| 18 | 1 904 | 15 812 | 4 790 | 747 | 6 126 | 4 804 | 972 | 255 | 1 500 | 2 077 | 9 288 |
| 24 | 2 760 | 30 347 | 7 994 | 1 352 | 11 091 | 8 698 | 1 704 | 431 | 1 500 | 5 064 | 31 895 |
| 36 | 5 489 | 80 103 | 16 779 | 3 194 | 26 205 | 20 551 | 3 851 | 1 021 | 2 500 | 13 179 | 135 254 |

Rentable au mois 6 ; ARR TTC au mois 36 environ 314 000 € ; IA à 19 % du revenu net ; creux de trésorerie environ 1 400 €.

### Scénario ambitieux (quatre pays dès l'année 1, communauté active)

Organique 400 (+18 % par mois jusqu'au mois 18), marketing 1 000 puis 3 000 puis 5 000 € par mois, coût d'acquisition 7 €, conversion 8 %, désabonnement 3,5 %.

| Mois | Inscriptions/mois | Comptes créés | Gratuits actifs | Abonnés | MRR TTC | Revenu net HT | Coût IA | Infra | Marketing | Résultat | Cumul |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 543 | 543 | 326 | 43 | 356 | 279 | 60 | 68 | 1 000 | -849 | -849 |
| 6 | 1 058 | 4 634 | 2 045 | 344 | 2 826 | 2 217 | 435 | 124 | 1 000 | 658 | -932 |
| 12 | 2 613 | 15 687 | 5 687 | 1 101 | 9 036 | 7 086 | 1 320 | 272 | 1 000 | 4 495 | 14 836 |
| 18 | 7 097 | 45 782 | 15 521 | 3 130 | 25 683 | 20 142 | 3 698 | 674 | 3 000 | 12 769 | 61 412 |
| 24 | 12 536 | 107 557 | 32 496 | 7 096 | 58 222 | 45 661 | 8 162 | 1 490 | 3 000 | 33 008 | 204 681 |
| 36 | 34 770 | 381 937 | 95 181 | 23 444 | 192 370 | 150 865 | 25 964 | 5 052 | 5 000 | 114 850 | 1 044 743 |

Rentable au mois 5 ; ARR TTC au mois 36 environ 2,3 M€ ; IA à 17 % du revenu net.

Lecture honnête : le scénario ambitieux suppose une croissance organique de 18 % par mois pendant dix-huit mois, ce qui n'arrive qu'avec un canal qui marche vraiment (créateurs de contenu revente, communautés Vinted, référencement sur « prix Lacoste vintage »). Le central est l'objectif ; le prudent est ce que l'on doit pouvoir supporter sans lever d'argent, et il le permet : le creux de trésorerie reste sous 2 500 € dans les trois cas parce que les coûts fixes sont faibles et que l'IA est désormais proportionnelle au revenu.

## 7. Europe : ce qui compte concrètement

- **TVA** : ventes à des particuliers dans toute l'Union, donc TVA du pays du client via le guichet unique (OSS) dès 10 000 € de ventes intracommunautaires ; Stripe Tax calcule et Chiné affiche un prix TTC unique par devise. Marge HT de 17 % (Luxembourg) à 27 % (Hongrie) de moins que le TTC.
- **Paiement** : cartes, SEPA, iDEAL (Pays-Bas), Bancontact (Belgique), Cartes Bancaires (France) via Stripe, sans changement de code.
- **Langues** : français et anglais complets, allemand partiel à terminer avant la campagne allemande ; espagnol et italien à ajouter (le système de messages le permet).
- **Plateformes par pays** dans les grilles de frais : Vinted partout, Vestiaire, Depop, eBay ; à ajouter Wallapop (Espagne), Subito (Italie), Kleinanzeigen (Allemagne), Marktplaats (Pays-Bas).
- **Taille de marché** : la mode de seconde main en Europe dépasse la trentaine de milliards d'euros par an et Vinted revendique plus de cent millions de membres ; la cible de Chiné est le revendeur qui vend au moins vingt pièces par mois, estimée à quelques centaines de milliers de personnes en France et plus d'un million en Europe (ordre de grandeur à confirmer par une étude, pas un chiffre sourcé). Le scénario central au mois 36 représente moins de 0,5 % de cette cible.

## 8. Reproduire et piloter

Le script `scratch/model2.py` (hors dépôt, reproduit ci-dessous en substance) calcule les tableaux : coût par appel = jetons × prix, revenu net = TTC / 1,2 moins frais Stripe, IA = quart des quotas, infra = 60 € + variable, marketing = budget fixe. Indicateurs à suivre dès le premier mois, tous disponibles dans la base : crédits consommés par plan (table `appraisals`, colonnes `credits`, `input_tokens`, `output_tokens`), coût estimé journalisé par appel, conversion gratuit → payant, désabonnement, part d'annuels. Les hypothèses de ce document se corrigent avec ces quatre chiffres.

## 9. Ce qu'il reste à construire pour l'offre

- Recharges de crédits (paiement unique Stripe) et plafond journalier par compte.
- Studio photo (génération d'image) et régénération de texte d'annonce par plateforme, déjà prévus dans la grille de crédits.
- Choix du modèle par plan (moins cher pour le Gratuit) si le coût IA dépasse 25 % du revenu net.
- Grilles de frais et langues des quatre pays cibles.
