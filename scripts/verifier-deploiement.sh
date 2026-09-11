#!/usr/bin/env bash
# Vérification de bout en bout d'un déploiement Chiné, contre une instance réelle.
#
#   ./scripts/verifier-deploiement.sh https://mon-deploiement.exemple [sha-attendu]
#
# Complète les e2e Playwright, qui tournent sur un faux serveur : ce script exerce la vraie
# instance (base, stockage, Stripe, en-têtes). Il crée un compte de test à chaque exécution.
# N'affiche jamais de secret.
set -uo pipefail
BASE="${1:?usage: verif-staging.sh <url-de-base> [sha-attendu]}"
SHA_ATTENDU="${2:-}"
JAR="$(mktemp)"; trap 'rm -f "$JAR"' EXIT
ok=0; ko=0
verifie() { # $1=libellé $2=condition_vraie_ou_fausse $3=détail
  if [[ "$2" == "true" ]]; then printf '  ✓ %s\n' "$1"; ok=$((ok+1))
  else printf '  ✗ %s — %s\n' "$1" "$3"; ko=$((ko+1)); fi
}
code() { curl -sS -o /dev/null -w '%{http_code}' --max-time 25 "$@" 2>/dev/null || echo 000; }

printf '\n== Sondes\n'
READY="$(curl -sS --max-time 25 "$BASE/api/ready" 2>/dev/null || echo '{}')"
verifie "/api/ready répond ready=true" "$(jq -r '.data.ready == true' <<<"$READY" 2>/dev/null || echo false)" "$READY"
COMMIT_SERVI="$(jq -r '.data.commit // "?"' <<<"$READY" 2>/dev/null)"
if [[ -n "$SHA_ATTENDU" ]]; then
  verifie "commit servi = $SHA_ATTENDU" "$([[ "$COMMIT_SERVI" == "$SHA_ATTENDU" ]] && echo true || echo false)" "servi: $COMMIT_SERVI"
else printf '  · commit servi: %s\n' "$COMMIT_SERVI"; fi

HEALTH="$(curl -sS --max-time 25 "$BASE/api/health" 2>/dev/null || echo '{}')"
verifie "/api/health status=ok" "$(jq -r '.data.status == "ok"' <<<"$HEALTH" 2>/dev/null || echo false)" "$(jq -c '.data.checks // .' <<<"$HEALTH" 2>/dev/null)"
DB="$(jq -r '.data.checks.database.driver // "?"' <<<"$HEALTH")"
verifie "base = postgres (et non pglite éphémère)" "$([[ "$DB" == "pg" || "$DB" == "postgres" ]] && echo true || echo false)" "driver: $DB"
printf '  · stockage: %s | IA: %s (démo=%s) | facturation: %s | mail: %s\n' \
  "$(jq -r '.data.checks.storage.driver' <<<"$HEALTH")" \
  "$(jq -r '.data.checks.appraiser.driver' <<<"$HEALTH")" \
  "$(jq -r '.data.checks.appraiser.fake' <<<"$HEALTH")" \
  "$(jq -r '.data.checks.billing.configured' <<<"$HEALTH")" \
  "$(jq -r '.data.checks.mail.configured' <<<"$HEALTH")"

printf '\n== Pages publiques\n'
for chemin in / /tarifs /legal/mentions-legales /legal/cgu /auth/connexion /auth/inscription /offline /manifest.webmanifest /sw.js; do
  c="$(code "$BASE$chemin")"; verifie "GET $chemin → 200" "$([[ "$c" == "200" ]] && echo true || echo false)" "code $c"
done
c="$(code "$BASE/app")"; verifie "GET /app sans session → redirection" "$([[ "$c" == "307" || "$c" == "302" ]] && echo true || echo false)" "code $c"
c="$(code "$BASE/api/v1/me")"; verifie "GET /api/v1/me sans session → 401" "$([[ "$c" == "401" ]] && echo true || echo false)" "code $c"

printf '\n== Parcours authentifié\n'
EMAIL="verif-$(date +%s)@chine.test"
SIGNUP="$(curl -sS --max-time 30 -c "$JAR" -H 'Content-Type: application/json' -H "Origin: $BASE" \
  -X POST "$BASE/api/auth/sign-up/email" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"Verif-staging-2026!\",\"name\":\"Vérif\"}" 2>/dev/null || echo '{}')"
verifie "inscription" "$(jq -r 'has("token") or has("user")' <<<"$SIGNUP" 2>/dev/null || echo false)" "$(head -c 200 <<<"$SIGNUP")"

ME="$(curl -sS --max-time 25 -b "$JAR" "$BASE/api/v1/me" 2>/dev/null || echo '{}')"
verifie "GET /api/v1/me avec session" "$(jq -r '.data.workspace.id != null' <<<"$ME" 2>/dev/null || echo false)" "$(head -c 200 <<<"$ME")"
printf '  · plan: %s | quota pièces: %s/%s | crédits IA: %s/%s (jour: %s/%s)\n' \
  "$(jq -r '.data.workspace.plan' <<<"$ME")" \
  "$(jq -r '.data.quotas.items.used' <<<"$ME")" "$(jq -r '.data.quotas.items.limit' <<<"$ME")" \
  "$(jq -r '.data.quotas.aiCreditsPerMonth.used' <<<"$ME")" "$(jq -r '.data.quotas.aiCreditsPerMonth.limit' <<<"$ME")" \
  "$(jq -r '.data.quotas.aiCreditsPerDay.used // "n/a"' <<<"$ME")" "$(jq -r '.data.quotas.aiCreditsPerDay.limit // "n/a"' <<<"$ME")"

CREA="$(curl -sS --max-time 30 -b "$JAR" -H 'Content-Type: application/json' -H "Origin: $BASE" \
  -X POST "$BASE/api/v1/items" \
  -d '{"mode":"quickCapture","clientId":"11111111-1111-4111-8111-111111111111","title":"Ensemble Lacoste vérif","pricePaid":{"minor":2000,"currency":"EUR"},"supplierKind":"FLEA_MARKET","photoKeys":[]}' 2>/dev/null || echo '{}')"
ITEM_ID="$(jq -r '.data.item.id // .data.id // ""' <<<"$CREA" 2>/dev/null)"
verifie "création d'une pièce (capture rapide)" "$([[ -n "$ITEM_ID" ]] && echo true || echo false)" "$(head -c 250 <<<"$CREA")"

if [[ -n "$ITEM_ID" ]]; then
  REJEU="$(curl -sS --max-time 30 -o /dev/null -w '%{http_code}' -b "$JAR" -H 'Content-Type: application/json' -H "Origin: $BASE" \
    -X POST "$BASE/api/v1/items" \
    -d '{"mode":"quickCapture","clientId":"11111111-1111-4111-8111-111111111111","title":"Ensemble Lacoste vérif","pricePaid":{"minor":2000,"currency":"EUR"},"supplierKind":"FLEA_MARKET","photoKeys":[]}' 2>/dev/null)"
  verifie "rejeu idempotent (même clientId → 200, pas de doublon)" "$([[ "$REJEU" == "200" ]] && echo true || echo false)" "code $REJEU"
fi

printf '\n== Photos\n'
UP="$(curl -sS --max-time 30 -b "$JAR" -H 'Content-Type: application/json' -H "Origin: $BASE" \
  -X POST "$BASE/api/v1/uploads" -d '{"mimeType":"image/jpeg"}' 2>/dev/null || echo '{}')"
URL_ENVOI="$(jq -r '.data.uploadUrl // ""' <<<"$UP" 2>/dev/null)"
URL_PUBLIQUE="$(jq -r '.data.publicUrl // ""' <<<"$UP" 2>/dev/null)"
verifie "URL d'envoi obtenue" "$([[ -n "$URL_ENVOI" ]] && echo true || echo false)" "$(head -c 200 <<<"$UP")"
if [[ -n "$URL_ENVOI" ]]; then
  # Un JPEG valide est indispensable : le serveur vérifie la signature binaire et normalise
  # l'image, un fichier bidon serait refusé en 415 pour une raison sans rapport.
  IMG="$(mktemp -t chine-verif).jpg"
  if command -v sips >/dev/null 2>&1; then
    printf 'P3\n2 2\n255\n40 60 120 40 60 120 40 60 120 40 60 120\n' > "${IMG%.jpg}.ppm"
    sips -s format jpeg "${IMG%.jpg}.ppm" --out "$IMG" >/dev/null 2>&1 || true
  fi
  if [[ -s "$IMG" ]]; then
    CODE_ENVOI="$(curl -sS --max-time 60 -o /dev/null -w '%{http_code}' -b "$JAR" -X PUT "$URL_ENVOI" \
      -H 'Content-Type: image/jpeg' --data-binary "@$IMG" 2>/dev/null)"
    verifie "envoi de la photo" "$([[ "$CODE_ENVOI" == "200" || "$CODE_ENVOI" == "201" ]] && echo true || echo false)" "code $CODE_ENVOI (500/EACCES = volume non inscriptible)"
    CODE_LECTURE="$(curl -sS --max-time 30 -o /dev/null -w '%{http_code}' "$URL_PUBLIQUE" 2>/dev/null)"
    verifie "lecture publique de la photo" "$([[ "$CODE_LECTURE" == "200" ]] && echo true || echo false)" "code $CODE_LECTURE"
  else
    printf '  · photo ignorée : impossible de fabriquer un JPEG de test sur cette machine\n'
  fi
  rm -f "$IMG" "${IMG%.jpg}.ppm"
fi

printf '\n== Facturation Stripe\n'
CHECKOUT="$(curl -sS --max-time 30 -b "$JAR" -H 'Content-Type: application/json' -H "Origin: $BASE" \
  -X POST "$BASE/api/v1/billing/checkout" -d "{\"plan\":\"PREMIUM\",\"interval\":\"monthly\",\"returnUrl\":\"$BASE/app/reglages\"}" 2>/dev/null || echo '{}')"
URL_CHECKOUT="$(jq -r '.data.url // ""' <<<"$CHECKOUT" 2>/dev/null)"
verifie "session de paiement créée" "$([[ "$URL_CHECKOUT" == https://* ]] && echo true || echo false)" "$(head -c 250 <<<"$CHECKOUT")"
[[ "$URL_CHECKOUT" == https://* ]] && printf '  · %s\n' "$(cut -c1-60 <<<"$URL_CHECKOUT")…"

BUSINESS="$(curl -sS --max-time 30 -o /dev/null -w '%{http_code}' -b "$JAR" -H 'Content-Type: application/json' -H "Origin: $BASE" \
  -X POST "$BASE/api/v1/billing/checkout" -d "{\"plan\":\"BUSINESS\",\"interval\":\"monthly\",\"returnUrl\":\"$BASE/app/reglages\"}" 2>/dev/null)"
verifie "plan en liste d'attente refusé" "$([[ "$BUSINESS" == "400" || "$BUSINESS" == "402" || "$BUSINESS" == "409" ]] && echo true || echo false)" "code $BUSINESS"

printf '\n== Sécurité\n'
CROSS="$(curl -sS --max-time 25 -o /dev/null -w '%{http_code}' -b "$JAR" -H 'Content-Type: application/json' -H 'Origin: https://exemple-malveillant.test' \
  -X POST "$BASE/api/v1/items" -d '{"mode":"quickCapture","title":"x","pricePaid":{"minor":1,"currency":"EUR"},"supplierKind":"FLEA_MARKET","photoKeys":[]}' 2>/dev/null)"
verifie "mutation cross-site refusée (403)" "$([[ "$CROSS" == "403" ]] && echo true || echo false)" "code $CROSS"
NOINDEX="$(curl -sS --max-time 25 -D - -o /dev/null "$BASE/app" 2>/dev/null | grep -ci 'x-robots-tag' || true)"
verifie "en-tête noindex sur /app" "$([[ "$NOINDEX" -ge 1 ]] && echo true || echo false)" "absent"
CSP="$(curl -sS --max-time 25 -D - -o /dev/null "$BASE/" 2>/dev/null | grep -ci 'content-security-policy' || true)"
verifie "CSP présente" "$([[ "$CSP" -ge 1 ]] && echo true || echo false)" "absente"

printf '\n== Bilan : %d réussites, %d échecs\n' "$ok" "$ko"
[[ "$ko" -eq 0 ]]
