# ADR 0005 — Expert IA : chaîne de fournisseurs interchangeables

**Statut** : accepté · **Date** : 2026-09-08

L'expertise d'une photo (identification, état, fourchette de prix, conseil d'achat, texte d'annonce) est un port applicatif (`Appraiser`). L'infrastructure fournit un **routeur** (`AppraiserRouter`) qui essaie une chaîne ordonnée de fournisseurs — Anthropic (`claude-fable-5-1`), Google Gemini, OpenAI (modèle imposé par variable) — réglée par `APPRAISER_DRIVER`. Tous reçoivent le même prompt versionné et le même schéma JSON strict (`packages/infrastructure/src/ai/schema.ts`) ; tous rendent le même `Appraisal`.

Règles : repli sur le fournisseur suivant en cas de délai, quota, refus, sortie invalide ou 5xx ; une erreur de configuration (clé invalide, 400) interrompt la chaîne plutôt que de la masquer ; le fournisseur, le modèle réellement servi et la latence sont enregistrés sur chaque expertise ; l'expert de démonstration n'entre jamais dans la chaîne en production. Changer de modèle est une variable d'environnement, jamais du code.
