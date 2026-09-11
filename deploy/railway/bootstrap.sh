#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Chiné — création des environnements Railway (staging et production).
#
# Prérequis : Railway CLI (`npm i -g @railway/cli`) connectée (`railway login`),
# ou un jeton dans RAILWAY_TOKEN. À lancer depuis la racine du monorepo.
#
#   ./deploy/railway/bootstrap.sh            # crée projet, environnements, Postgres, variables
#   ./deploy/railway/bootstrap.sh staging    # (re)pousse uniquement les variables de staging
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

PROJECT_NAME="${RAILWAY_PROJECT_NAME:-chine}"
SERVICE_NAME="${RAILWAY_SERVICE_NAME:-web}"
ONLY_ENV="${1:-}"

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$(cd "$here/../.." && pwd)"
cd "$root"

command -v railway >/dev/null || { echo "Railway CLI absente : npm i -g @railway/cli" >&2; exit 1; }

push_variables() {
  local env_name="$1" file="$here/$1.env"
  if [[ ! -f "$file" ]]; then
    echo "→ $file absent : copie $env_name.env.example en $env_name.env et renseigne les secrets." >&2
    exit 1
  fi
  echo "→ variables de l'environnement $env_name depuis $(basename "$file")"
  local args=()
  local key value
  while IFS= read -r line; do
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    [[ "$line" != *=* ]] && continue
    key="${line%%=*}"
    value="${line#*=}"
    # Une valeur entre guillemets s'arrête au guillemet fermant : les guillemets ne doivent
    # jamais être poussés dans la valeur (un MAIL_FROM entre guillemets casserait l'en-tête From).
    if [[ "$value" =~ ^\"(.*)\"[[:space:]]*(#.*)?$ ]]; then
      value="${BASH_REMATCH[1]}"
    elif [[ "$value" =~ ^\'(.*)\'[[:space:]]*(#.*)?$ ]]; then
      value="${BASH_REMATCH[1]}"
    else
      # Commentaire de fin de ligne : seulement précédé d'un espace, pour ne pas couper
      # une valeur qui contient légitimement un « # » (mot de passe, jeton).
      value="${value%%  #*}"
      value="${value%% #*}"
    fi
    # Trim des espaces de tête et de queue.
    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]}"}"
    key="${key#"${key%%[![:space:]]*}"}"
    key="${key%"${key##*[![:space:]]}"}"
    args+=("--set" "$key=$value")
  done < "$file"
  railway variables --environment "$env_name" --service "$SERVICE_NAME" "${args[@]}"
}

if [[ -n "$ONLY_ENV" ]]; then
  push_variables "$ONLY_ENV"
  exit 0
fi

echo "→ projet $PROJECT_NAME"
railway init --name "$PROJECT_NAME" >/dev/null 2>&1 || railway link >/dev/null

for env_name in staging production; do
  echo "→ environnement $env_name"
  railway environment new "$env_name" >/dev/null 2>&1 || true
  railway environment "$env_name" >/dev/null
  echo "   · Postgres"
  railway add --database postgres >/dev/null 2>&1 || true
  echo "   · service $SERVICE_NAME (Dockerfile apps/web/Dockerfile via railway.json)"
  railway add --service "$SERVICE_NAME" >/dev/null 2>&1 || true
  push_variables "$env_name"
done

cat <<MSG

Terminé. Reste à faire dans le tableau de bord Railway (non scriptable) :
  1. Service « $SERVICE_NAME » → Settings → Source : dépôt GitHub, branche « staging » pour
     l'environnement staging et « production » pour l'environnement production.
     (Ou laisser les GitHub Actions déployer via RAILWAY_TOKEN : voir docs/ENVIRONNEMENTS.md.)
  2. Networking → domaine public : staging.chine.app / chine.app, puis reporter l'URL dans
     NEXT_PUBLIC_APP_URL et BETTER_AUTH_URL si elle diffère.
  3. Créer un jeton de projet par environnement (Settings → Tokens) et l'enregistrer dans
     les secrets GitHub RAILWAY_TOKEN_STAGING et RAILWAY_TOKEN_PRODUCTION.
MSG
