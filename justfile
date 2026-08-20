set dotenv-load := true

db_user := env_var_or_default("DB_USER", "")
database := env_var_or_default("DB_DATABASE", "")
db_pass := env_var_or_default("DB_PASS", "")
dump_path := "dumps"

compose := if `command -v docker-compose 2>/dev/null || true` != "" { "docker-compose" } else { "docker compose" }

# List available commands
default:
    @just --list

alias help := default

_require-docker:
    #!/usr/bin/env bash
    if ! command -v docker >/dev/null 2>&1; then
      echo "❌ Docker is not installed. Please install Docker on the system."
      exit 1
    fi

# Start Docker services
up *services: _require-docker
    {{compose}} up {{services}}

# Stop all Docker services
down: _require-docker
    {{compose}} down

# Restart specified Docker services
restart *services: _require-docker
    {{compose}} restart {{services}}

# Remove Docker image(s)
rmi *images: _require-docker
    docker rmi {{images}}

# Update CHANGELOG.md with commits not yet listed (main branch only)
changelog:
    #!/usr/bin/env bash
    set -euo pipefail
    if [[ "$(git rev-parse --abbrev-ref HEAD)" != "main" ]]; then
      echo "Not on main, skipping changelog update."
      exit 0
    fi

    commits=$(git log --date=short --pretty=format:"%ad|%s|%h")
    existing_hashes=$(grep -oE '\([a-f0-9]{7,}\)' CHANGELOG.md | tr -d '()')
    declare -A existing
    for hash in $existing_hashes; do
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

# Check for updates on main, pull, and optionally rebuild/restart and migrate (interactive)
update_prod: _require-docker
    #!/usr/bin/env bash
    set -euo pipefail
    now=$(date '+%F_%H:%M:%S')

    log() {
      printf "%s\n" "$1"
      printf "%s\n" "$1" >> deploy-history.md
    }

    log "********************************"
    log "Check for update at $now"
    log "Current branch: $(git branch --show-current)"
    log "Last commit before update:"
    log "$(git log -1)"

    echo "Current branch: $(git branch --show-current)"
    echo "Last commit before update:"
    git log -1
    echo "Checking for updates..."

    git fetch origin main
    local_rev=$(git rev-parse @)
    remote_rev=$(git rev-parse origin/main)

    if [ "$local_rev" = "$remote_rev" ]; then
      log "No updates found. Exiting"
      exit 0
    fi

    log "Updates found"
    echo "Confirm update? (y/n)"
    read answer
    if [ "${answer#[Yy]}" != "$answer" ]; then
      echo "Updating..."
      git pull
      log "Update complete. Last commit after update:"
      log "$(git log -1)"
      echo "Update complete. Last commit after update:"
      git log -1

      echo "Stop, rebuilding and restarting services? (y/n)"
      if [ "${answer#[Yy]}" != "$answer" ]; then
        log "Rebuilding and restarting services..."
        if {{compose}} down && {{compose}} up --build -d; then
          log "Services restarted successfully."
        else
          log "Error restarting services!"
        fi
      else
        log "Skipping rebuild and restart of services."
      fi
      log "Update process completed."

      echo "Try to generate and run migrations if needed? (y/n)"
      if [ "${answer#[Yy]}" != "$answer" ]; then
        echo "Generating migrations..."
        {{compose}} exec backend npm run typeorm:generate-migration --name="auto-migration-$(date +%Y%m%d-%H%M%S)"
        log "Migrations generated."
        echo "Running migrations..."
        {{compose}} exec backend npm run typeorm migration:run -- -d ./src/config/dataSource.ts
        log "Migrations run."
      fi
    else
      log "Update cancelled by user"
      exit 0
    fi

# Open bash in frontend container
frontend_bash: _require-docker
    {{compose}} exec frontend /bin/sh

# Show logs for frontend
frontend_logs: _require-docker
    {{compose}} logs frontend

# Open bash in backend container
backend_bash: _require-docker
    {{compose}} exec backend /bin/sh

# Show logs for backend
backend_logs: _require-docker
    {{compose}} logs backend

# Open bash in database container
db_bash: _require-docker
    {{compose}} exec db bash

# Show logs for database
db_logs: _require-docker
    {{compose}} logs db

# Manage TypeORM migrations: `just migration create [name]` or `just migration run`
migration action name="": _require-docker
    #!/usr/bin/env bash
    set -euo pipefail
    case "{{action}}" in
        create)
            name="{{name}}"
            if [ -z "$name" ]; then
              name="migrate-$(date +%Y%m%d-%H%M%S)"
            fi
            {{compose}} exec backend npm run typeorm:generate-migration --name="$name"
            ;;
        run)
            {{compose}} exec backend npm run typeorm migration:run -- -d ./src/config/dataSource.ts
            ;;
        *)
            echo "Unknown migration command: {{action}}"
            exit 1
            ;;
    esac

# Open a MySQL shell
mysql: _require-docker
    {{compose}} exec db mariadb -u {{db_user}} {{database}} -p{{db_pass}}

# Dump the database (compressed) into dumps/
mysql_dump: _require-docker
    #!/usr/bin/env bash
    set -euo pipefail
    mkdir -p {{dump_path}}
    {{compose}} exec db mariadb-dump --databases {{database}} -u {{db_user}} -p{{db_pass}} \
      | gzip > ./{{dump_path}}/{{database}}_$(date +%Y%m%d_%H%M%S).sql.gz

# Restore the database from a dump file (erases current data)
mysql_restore file: _require-docker
    #!/usr/bin/env bash
    set -euo pipefail
    read -p "Do you want to restore your database from file '{{file}}' ? This command will erase your current data. (y/n). " yn
    case $yn in
        [Yy]* )
            zcat {{file}} | grep -v '/\*M' | docker exec -i "$({{compose}} ps -q db)" mariadb -u {{db_user}} {{database}} -p{{db_pass}}
            ;;
        [Nn]* )
            exit 0
            ;;
        * )
            echo "Please answer yes or no."
            ;;
    esac
