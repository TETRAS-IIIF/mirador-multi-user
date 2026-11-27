#!/usr/bin/env bash
# Checks that a deployed MMU instance works, from outside: run it on the
# server or on any machine that can reach the instance. Needs only curl.
#
# Usage: scripts/smoke.sh [env-file]          (default: .env)
#   URLs come from HTTP_PROTOCOL, HOST, BACKEND_HOST, CADDY_HTTP_PROTOCOL,
#   CADDY_HOST and ASSISTANT_URL in the env file. Override them with
#   SMOKE_FRONTEND, SMOKE_BACKEND, SMOKE_CADDY, SMOKE_ASSISTANT.
#   Set SMOKE_MAIL and SMOKE_PASSWORD (environment only) to also log in.
# Exit code: the number of failed checks (0: all good).
set -uo pipefail

file="${1:-.env}"
failed=0
passed=0
pass() { echo "  ✓ $1"; passed=$((passed + 1)); }
fail() { echo "  ✗ $1"; failed=$((failed + 1)); }

# Value of a non-secret key, read the way Compose does (comment and quotes stripped).
value() {
  [[ -f "$file" ]] || return 0
  awk -F= -v k="$1" '$1 == k {
    v = substr($0, length(k) + 2)
    if (v !~ /^["\047]/) sub(/[ \t]+#.*$/, "", v)
    gsub(/^["\047]|["\047]$/, "", v)
    out = v
  } END { print out }' "$file"
}

# url <override> <protocol key> <host key>: the override, else protocol://host,
# else nothing when the host is unknown.
url() {
  local override="$1" protocol host
  if [[ -n "$override" ]]; then
    printf '%s' "${override%/}"
    return
  fi
  host=$(value "$3")
  [[ -z "$host" ]] && return
  protocol=$(value "$2")
  printf '%s://%s' "${protocol:-https}" "$host"
}
frontend=$(url "${SMOKE_FRONTEND:-}" HTTP_PROTOCOL HOST)
backend=$(url "${SMOKE_BACKEND:-}" HTTP_PROTOCOL BACKEND_HOST)
caddy=$(url "${SMOKE_CADDY:-}" CADDY_HTTP_PROTOCOL CADDY_HOST)
assistant="${SMOKE_ASSISTANT:-$(value ASSISTANT_URL)}"
assistant="${assistant%/}"

if [[ -z "$frontend" || -z "$backend" || -z "$caddy" ]]; then
  echo "Unknown URL: no $file, or HOST / BACKEND_HOST / CADDY_HOST empty in it." >&2
  echo "Run it next to the instance's .env, or set SMOKE_FRONTEND, SMOKE_BACKEND and SMOKE_CADDY." >&2
  exit 1
fi

body=$(mktemp)
headers=$(mktemp)
trap 'rm -f "$body" "$headers"' EXIT

# request <url> [curl args...]: sets $code (HTTP status, or "curl:<exit>").
request() {
  local url="$1"
  shift
  : >"$body"
  : >"$headers"
  code=$(curl -sS --max-time 20 -o "$body" -D "$headers" -w '%{http_code}' "$@" "$url" 2>/dev/null)
  local status=$?
  if ((status != 0)); then
    case $status in
      6) code="curl:6 (host not found: DNS?)" ;;
      7) code="curl:7 (connection refused)" ;;
      28) code="curl:28 (timeout)" ;;
      35 | 51 | 58 | 60) code="curl:$status (TLS certificate problem)" ;;
      *) code="curl:$status" ;;
    esac
  fi
}
has_header() { grep -qi "^$1:" "$headers"; }

echo "Frontend  $frontend"
echo "Backend   $backend"
echo "Files     $caddy"
[[ -n "$assistant" ]] && echo "Assistant $assistant"
echo

echo "Frontend"
request "$frontend/"
if [[ "$code" == 200 ]] && grep -q 'id="root"' "$body"; then
  pass "the app loads"
  bundle=$(grep -o 'src="/assets/[^"]*\.js"' "$body" | head -1 | cut -d'"' -f2)
  if [[ -n "$bundle" ]]; then
    request "$frontend$bundle"
    if [[ "$code" == 200 ]]; then
      pass "its JavaScript loads"
      # VITE_* URLs are baked in at build time: a wrong .env at build shows here.
      grep -qF "$backend" "$body" && pass "it was built for this backend ($backend)" ||
        fail "it was not built for $backend: rebuild the frontend (just up --build -d) after fixing BACKEND_HOST"
      grep -qF "$caddy" "$body" && pass "it was built for these file URLs ($caddy)" ||
        fail "it was not built for $caddy: rebuild after fixing CADDY_HOST"
      if [[ -n "$assistant" ]]; then
        grep -qF "$assistant" "$body" && pass "it was built with the assistant" ||
          fail "it was built without $assistant: rebuild after setting ASSISTANT_URL"
      fi
    else
      fail "its JavaScript ($bundle): $code"
    fi
  else
    fail "no JavaScript bundle found in the page"
  fi
else
  fail "GET / : $code"
fi
request "$frontend/auth/login"
[[ "$code" == 200 ]] && pass "deep links work (/auth/login)" || fail "GET /auth/login: $code"

echo "Backend"
request "$backend/"
[[ "$code" == 200 ]] && pass "it answers" || fail "GET / : $code"
# A wrong login is refused only after the users table was queried: 401 means
# the backend reaches its database.
request "$backend/auth/login" -X POST -H 'Content-Type: application/json' \
  --data '{"mail":"smoke-check@invalid.invalid","password":"not-a-password"}'
[[ "$code" == 401 ]] && pass "it reaches its database (a wrong login gets 401)" ||
  fail "a wrong login got $code instead of 401: check the database and the backend logs"
request "$backend/auth/login" -X OPTIONS -H "Origin: $frontend" -H 'Access-Control-Request-Method: POST'
has_header access-control-allow-origin && pass "it accepts calls from the frontend (CORS)" ||
  fail "no CORS header for $frontend"

echo "Files (Caddy)"
request "$caddy/favicon.ico"
if [[ "$code" == 200 ]]; then
  pass "it serves files"
  has_header access-control-allow-origin && pass "with CORS headers" || fail "no CORS header: check CORS_ALLOWED_HOSTS"
else
  fail "GET /favicon.ico: $code"
fi

if [[ -n "$assistant" ]]; then
  echo "Assistant"
  request "$assistant/health"
  [[ "$code" == 200 ]] && pass "it answers" || fail "GET /health: $code"
fi

if [[ -n "${SMOKE_MAIL:-}" && -n "${SMOKE_PASSWORD:-}" ]]; then
  echo "Login (SMOKE_MAIL)"
  esc() { local v="${1//\\/\\\\}"; printf '%s' "${v//\"/\\\"}"; }
  # The password goes through stdin, not the command line.
  request "$backend/auth/login" -X POST -H 'Content-Type: application/json' --data @- \
    < <(printf '{"mail":"%s","password":"%s"}' "$(esc "$SMOKE_MAIL")" "$(esc "$SMOKE_PASSWORD")")
  token=$(sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p' "$body")
  if [[ "$code" =~ ^20[01]$ && -n "$token" ]]; then
    pass "log in"
    request "$backend/auth/profile" -H "Authorization: Bearer $token"
    [[ "$code" == 200 ]] && pass "read the profile" || fail "GET /auth/profile: $code"
  else
    fail "log in: $code"
  fi
fi

echo
if ((failed > 0)); then
  echo "$failed check(s) failed, $passed passed."
else
  echo "All $passed checks passed."
fi
exit "$failed"
