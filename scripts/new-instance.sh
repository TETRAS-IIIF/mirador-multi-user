#!/usr/bin/env bash
# Creates the .env of a new production instance from .env.prod.sample:
# asks a few questions, derives the host and router names, generates the
# secrets. Never prints a secret.
# Usage: scripts/new-instance.sh [output-file]   (default: .env)
set -euo pipefail

cd "$(dirname "$0")/.."
out="${1:-.env}"
sample=".env.prod.sample"

if [[ -e "$out" ]]; then
  echo "$out already exists: not overwriting it. Remove or rename it first." >&2
  exit 1
fi

# ask <prompt> [default]: one line from the user, the default when empty.
ask() {
  local answer
  read -r -p "$1${2:+ [$2]}: " answer
  echo "${answer:-${2:-}}"
}
# ask_required <prompt> [default]
ask_required() {
  local answer=""
  while [[ -z "$answer" ]]; do answer=$(ask "$@"); done
  echo "$answer"
}
# ask_secret <prompt>: not echoed.
ask_secret() {
  local answer
  read -r -s -p "$1: " answer
  echo >&2
  echo "$answer"
}
# A random hexadecimal secret (no character that needs quoting).
secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex "$1"
  else
    head -c "$1" /dev/urandom | od -An -tx1 | tr -d ' \n'
  fi
}
# Quotes a value for the env file when it holds characters Compose would
# interpret ($, #, quotes, spaces at the ends...).
quote() {
  local v="$1"
  if [[ "$v" =~ ^[A-Za-z0-9_.@:/+,=-]*$ ]]; then
    printf '%s' "$v"
  elif [[ "$v" != *"'"* ]]; then
    printf "'%s'" "$v"
  else
    v="${v//\\/\\\\}"; v="${v//\"/\\\"}"; v="${v//\$/\\\$}"
    printf '"%s"' "$v"
  fi
}

echo "New MMU instance: a few questions (Enter keeps the value in brackets)."
echo
domain=$(ask_required "Base domain, e.g. example.org")
name=$(ask_required "Instance name in host and router names (lowercase)" "mmu")
host=$(ask_required "Frontend host" "$name.$domain")
backend_host=$(ask_required "Backend host" "$name-backend.$domain")
caddy_host=$(ask_required "Files (Caddy) host" "$name-caddy.$domain")
instance_name=$(ask_required "Instance name shown in the app" "Mirador Multi User")
short_name=$(ask_required "Short name" "MMU")
admin_mail=$(ask_required "Administrator e-mail" "admin@$domain")
from_mail=$(ask_required "Sender e-mail" "$admin_mail")
traefik=$(ask "Behind the Traefik of this server? (y/n)" "y")
echo
echo "E-mail (SMTP). Leave the server empty to set it up later."
smtp_domain=$(ask "SMTP server")
smtp_user="" smtp_password="" smtp_port="" smtp_ssl=""
if [[ -n "$smtp_domain" ]]; then
  smtp_port=$(ask_required "SMTP port" "587")
  smtp_ssl=$(ask_required "SMTP over SSL (true for port 465)" "false")
  smtp_user=$(ask_required "SMTP user" "$from_mail")
  smtp_password=$(ask_secret "SMTP password")
fi
assistant_url=$(ask "AI assistant URL (empty: no assistant)")

if [[ "$traefik" =~ ^[Yy] ]]; then
  compose_file="docker-compose.yml:prod.yml:traefik.yml"
else
  compose_file="docker-compose.yml:prod.yml:port.yml"
fi

declare -A values=(
  [COMPOSE_FILE]="$compose_file"
  [RESTART]="always"
  [HTTP_PROTOCOL]="https"
  [CADDY_HTTP_PROTOCOL]="https"
  [NAME]="$name"
  [HOST]="$host"
  [BACKEND_NAME]="$name-backend"
  [BACKEND_HOST]="$backend_host"
  [CADDY_NAME]="$name-caddy"
  [CADDY_HOST]="$caddy_host"
  [INSTANCE_NAME]="$instance_name"
  [INSTANCE_SHORT_NAME]="$short_name"
  [ADMIN_MAIL]="$admin_mail"
  [FROM_MAIL]="$from_mail"
  [NAME_MAIL]="$instance_name"
  [SMTP_DOMAIN]="$smtp_domain"
  [SMTP_PORT]="$smtp_port"
  [SMTP_SSL]="$smtp_ssl"
  [SMTP_IGNORE_TLS]="${smtp_domain:+false}"
  [SMTP_USER]="$smtp_user"
  [SMTP_PASSWORD]="$smtp_password"
  [ASSISTANT_URL]="$assistant_url"
  [JWT_SECRET]="$(secret 32)"
  [JWT_EMAIL_VERIFICATION_TOKEN_SECRET]="$(secret 32)"
  [SESSION_SECRET]="$(secret 32)"
  [DB_PASS]="$(secret 24)"
)

# Copies the sample, replacing the value of each key above; keys the sample
# lacks are appended. Comments and every other line are kept as they are.
tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT
cp "$sample" "$tmp"
for key in "${!values[@]}"; do
  line="$key=$(quote "${values[$key]}")"
  if grep -q "^$key=" "$tmp"; then
    KEY="$key" LINE="$line" awk '
      index($0, ENVIRON["KEY"] "=") == 1 && !done { print ENVIRON["LINE"]; done = 1; next }
      { print }' "$tmp" >"$tmp.new"
    mv "$tmp.new" "$tmp"
  else
    printf '%s\n' "$line" >>"$tmp"
  fi
done
install -m 600 "$tmp" "$out"

echo
echo "Wrote $out (readable by you only). Secrets were generated: keep a copy somewhere safe."
echo
scripts/check-env.sh "$out" || true
cat <<EOF

Next steps:
  1. DNS: point $host, $backend_host and $caddy_host to this server.
  2. Start: just up --build -d   (the database schema is created on the first start)
  3. Check: docker compose ps   (every service should become healthy)
EOF
