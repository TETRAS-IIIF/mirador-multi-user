#!/usr/bin/env bash
# Checks an MMU environment file without printing any value: only key names.
# Usage: scripts/check-env.sh [file]   (default: .env)
# Exit code: 1 when something required is missing or still a placeholder.
set -uo pipefail

file="${1:-.env}"
if [[ ! -f "$file" ]]; then
  echo "No $file: create it with 'just new-instance'." >&2
  exit 1
fi

problems=0
warnings=0
problem() { echo "  ✗ $1"; problems=$((problems + 1)); }
warning() { echo "  ! $1"; warnings=$((warnings + 1)); }
# Length of a key's value as Compose reads it: an inline " # comment" and
# surrounding quotes are not part of it. Only the length leaves this function.
value_length() {
  awk -F= -v k="$1" '$1 == k {
    v = substr($0, length(k) + 2)
    if (v !~ /^["\047]/) sub(/[ \t]+#.*$/, "", v)
    gsub(/^["\047]|["\047]$/, "", v)
    n = length(v)
  } END { print n + 0 }' "$file"
}
# True when the key has a non-empty value.
has() { (($(value_length "$1") > 0)); }
# True when the key's value is exactly $2 (only for non-secret switches).
is() { grep -qx "$1=$2" "$file"; }

echo "Checking $file"

for key in COMPOSE_FILE HTTP_PROTOCOL HOST BACKEND_HOST CADDY_HOST CADDY_HTTP_PROTOCOL \
  NAME BACKEND_NAME CADDY_NAME INSTANCE_NAME INSTANCE_SHORT_NAME BACKEND_PORT \
  DB_HOST DB_USER DB_PASS DB_DATABASE JWT_SECRET JWT_EMAIL_VERIFICATION_TOKEN_SECRET \
  HTTP_FOLDER LOG_FOLDER ADMIN_MAIL FROM_MAIL; do
  has "$key" || problem "$key is missing or empty"
done

# Values left from the sample.
awk -F= '/^[A-Z_]+=.*(your-domain|changeme|change_me|CHANGE_ME)/ { print $1 }' "$file" |
  while read -r key; do echo "  ✗ $key still holds the sample's placeholder"; done
placeholders=$(awk -F= '/^[A-Z_]+=.*(your-domain|changeme|change_me|CHANGE_ME)/' "$file" | wc -l)
problems=$((problems + placeholders))

# Secrets that are too short to be safe (length only).
for key in JWT_SECRET JWT_EMAIL_VERIFICATION_TOKEN_SECRET DB_PASS; do
  n=$(value_length "$key")
  ((n > 0 && n < 16)) && problem "$key is shorter than 16 characters"
done

if is OPENID_CONNECTION true; then
  for key in OIDC_ISSUER OIDC_CLIENT_ID OIDC_CLIENT_SECRET OIDC_REDIRECT_URI SESSION_SECRET; do
    has "$key" || problem "$key is needed because OPENID_CONNECTION=true"
  done
fi
if ! is CLASSIC_AUTHENTICATION true && ! is OPENID_CONNECTION true; then
  problem "Neither CLASSIC_AUTHENTICATION nor OPENID_CONNECTION is true: nobody can log in"
fi

has SMTP_DOMAIN || warning "SMTP_DOMAIN is empty: no e-mail will be sent (sign-up confirmation, password reset)"
has ASSISTANT_URL || warning "ASSISTANT_URL is empty: the AI assistant is hidden"

if ((problems > 0)); then
  echo "$problems problem(s) to fix in $file."
  exit 1
fi
if ((warnings > 0)); then echo "OK ($warnings warning(s))."; else echo "OK."; fi
