# Mirador Multi User — task runner (replaces the former cli.sh)
# Run `just` or `just --list` to see available recipes.

set shell := ["bash", "-cu"]

compose := `command -v docker-compose >/dev/null 2>&1 && echo docker-compose || echo "docker compose"`

frontend_service := "frontend"
backend_service := "backend"
db_service := "db"
# Database name from .env, only used to name dump files
database := `grep -E '^DB_DATABASE=' .env 2>/dev/null | cut -d= -f2- | sed -e 's/^ *//' -e 's/ *$//' -e 's/\r$//' || true`
dump_path := "dumps"
# Credentials are read inside the db container from the MARIADB_* variables docker compose
# set from .env (single-quoted so the host shell never parses the password).
mariadb := "sh -c 'exec mariadb -u\"$MARIADB_USER\" -p\"$MARIADB_PASSWORD\" \"$MARIADB_DATABASE\"'"
mariadb_dump := "sh -c 'exec mariadb-dump --databases \"$MARIADB_DATABASE\" -u\"$MARIADB_USER\" -p\"$MARIADB_PASSWORD\"'"

[private]
default:
    @just --list --unsorted

# ─── Deployment and maintenance ──────────────────────────────────────────────

# Start Docker services
[group('deploy')]
up *args:
    {{ compose }} up {{ args }}

# Stop all Docker services
[group('deploy')]
down:
    {{ compose }} down

# Restart specified Docker services
[group('deploy')]
restart *services:
    {{ compose }} restart {{ services }}

# Remove Docker image(s)
[group('deploy')]
rmi +images:
    docker rmi {{ images }}

# Prepend new commits (main branch only) to CHANGELOG.md
[group('deploy')]
changelog:
    #!/usr/bin/env bash
    set -euo pipefail
    if [[ $(git rev-parse --abbrev-ref HEAD) != "main" ]]; then
      echo "Not on main, skipping changelog update."
      exit 0
    fi
    commits=$(git log --date=short --pretty=format:"%ad|%s|%h")
    declare -A existing
    for hash in $(grep -oE '\([a-f0-9]{7,}\)' CHANGELOG.md | tr -d '()'); do
      existing["$hash"]=1
    done
    new_section=""
    while IFS='|' read -r date subject hash; do
      if [[ -z "${existing[$hash]:-}" ]]; then
        if [[ -z "$new_section" ]]; then
          new_section="## Changelog update ($(date +%Y-%m-%d))\n"
        fi
        new_section+="- $subject ($hash)\n"
      fi
    done <<< "$commits"
    if [[ -n "$new_section" ]]; then
      { echo -e "$new_section"; echo ""; cat CHANGELOG.md; } > CHANGELOG.tmp
      mv CHANGELOG.tmp CHANGELOG.md
      echo "Changelog updated."
    else
      echo "No new commits to add."
    fi

# Check for updates, pull, rebuild/restart services and run migrations (logs to deploy-history.md)
[group('deploy')]
update_prod:
    #!/usr/bin/env bash
    set -uo pipefail
    log() { printf "%s\n" "$1" | tee -a deploy-history.md; }
    ask() { local a; read -r -p "$1 (y/n) " a; [[ "$a" =~ ^[Yy] ]]; }

    log "********************************"
    log "Check for update at $(date '+%F_%H:%M:%S')"
    log "Current branch: $(git branch --show-current)"
    log "Last commit before update:"
    log "$(git log -1)"
    echo "Checking for updates..."

    git fetch origin main
    if [[ "$(git rev-parse @)" == "$(git rev-parse origin/main)" ]]; then
      log "No updates found. Exiting"
      exit 0
    fi

    log "Updates found"
    if ! ask "Confirm update?"; then
      log "Update cancelled by user"
      exit 0
    fi

    echo "Updating..."
    git pull
    log "Update complete. Last commit after update:"
    log "$(git log -1)"

    if ask "Stop, rebuild and restart services?"; then
      log "Rebuilding and restarting services..."
      if {{ compose }} down && {{ compose }} up --build -d; then
        log "Services restarted successfully."
      else
        log "Error restarting services!"
      fi
    else
      log "Skipping rebuild and restart of services."
    fi
    log "Update process completed."

    # Migrations run when the backend starts; this only reports leftovers.
    if {{ compose }} exec -T {{ backend_service }} npm run --silent typeorm:check-migrations >/dev/null 2>&1; then
      log "Database schema matches the code."
    else
      log "WARNING: the database schema differs from the code. See 'just migration check'."
    fi

# ─── Shell access and logs ───────────────────────────────────────────────────

# Open a shell in the frontend container
[group('shell')]
frontend_bash:
    {{ compose }} exec {{ frontend_service }} /bin/sh

# Show logs for frontend
[group('shell')]
frontend_logs *args:
    {{ compose }} logs {{ args }} {{ frontend_service }}

# Open a shell in the backend container
[group('shell')]
backend_bash:
    {{ compose }} exec {{ backend_service }} /bin/sh

# Show logs for backend
[group('shell')]
backend_logs *args:
    {{ compose }} logs {{ args }} {{ backend_service }}

# ─── Database management ─────────────────────────────────────────────────────

# Open bash in the database container
[group('db')]
db_bash:
    {{ compose }} exec {{ db_service }} bash

# Show logs for database
[group('db')]
db_logs *args:
    {{ compose }} logs {{ args }} {{ db_service }}

# Migrations live in backend/src/migrations and run when the backend starts.
#   create <name>  new migration from the entity changes (commit it with them)
#   run            apply pending migrations now (the backend also does it at startup)
#   check          show what differs between the database and the code (exit 1 if anything)
#   sync           existing instance only, once: apply that difference, after confirmation
[group('db')]
migration action name="":
    #!/usr/bin/env bash
    set -euo pipefail
    case "{{ action }}" in
      create)
        name="{{ name }}"
        [[ -z "$name" ]] && { echo "Usage: just migration create <name>" >&2; exit 1; }
        {{ compose }} exec {{ backend_service }} npm run typeorm:generate-migration --name="$name"
        echo "Review the file in backend/src/migrations and commit it with the entity change."
        ;;
      run)
        {{ compose }} exec {{ backend_service }} npm run typeorm:run-migrations
        ;;
      check)
        {{ compose }} exec -T {{ backend_service }} npm run --silent typeorm:check-migrations
        ;;
      sync)
        out=$({{ compose }} exec -T {{ backend_service }} npm run --silent typeorm:check-migrations 2>&1) && {
          echo "The database already matches the code."; exit 0; }
        # Only the "up" part: what would run (the "down" part always drops).
        up=$(echo "$out" | sed -n '/async up(/,/async down(/p' | grep 'queryRunner.query')
        echo "SQL needed to match the code:"
        echo "$up"
        echo
        if echo "$up" | grep -qiE 'DROP (TABLE|COLUMN|INDEX|FOREIGN KEY)'; then
          echo "WARNING: the SQL above drops something: tables or columns lose their data."
          echo "Make a dump first (just mysql_dump) and check that this is intended."
        fi
        read -r -p "Apply these changes to the database? (y/n) " yn
        [[ "$yn" =~ ^[Yy] ]] || exit 1
        {{ compose }} exec {{ backend_service }} npm run typeorm -- -d ./src/config/dataSource.ts schema:sync
        {{ compose }} exec -T {{ backend_service }} npm run --silent typeorm:check-migrations
        ;;
      *)
        echo "Unknown migration command: {{ action }} (expected: create <name> | run | check | sync)" >&2
        exit 1
        ;;
    esac

# Open a MariaDB shell
[group('db')]
mysql:
    @{{ compose }} exec {{ db_service }} {{ mariadb }}

# Dump the database (gzip) into dumps/
[group('db')]
mysql_dump:
    #!/usr/bin/env bash
    set -euo pipefail
    mkdir -p {{ dump_path }}
    out="{{ dump_path }}/{{ database }}_$(date +%Y%m%d_%H%M%S).sql.gz"
    if ! {{ compose }} exec -T {{ db_service }} {{ mariadb_dump }} | gzip > "$out"; then
      rm -f "$out"
      echo "Database dump failed" >&2
      exit 1
    fi
    echo "Dump written to $out"

# Restore the database from a gzipped dump (erases current data)
[group('db')]
mysql_restore file:
    #!/usr/bin/env bash
    set -euo pipefail
    read -r -p "Do you want to restore your database from file '{{ file }}' ? This command will erase your current data. (y/n) " yn
    [[ "$yn" =~ ^[Yy] ]] || exit 0
    zcat "{{ file }}" | grep -v '/\*M' | {{ compose }} exec -T {{ db_service }} {{ mariadb }}
