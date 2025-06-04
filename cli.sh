#!/bin/bash

get_conf_val () {
    grep -E "^$1=" .env | cut -d '=' -f2- | sed -e 's/^ *//' -e 's/ *$//'
}


FRONTEND_SERVICE="frontend"
BACKEND_SERVICE="backend"
DB_SERVICE="db"
DB_USER=$(get_conf_val DB_USER)
DATABASE=$(get_conf_val DB_DATABASE )
DUMP_PATH="dumps/"

is_docker() {
    if [ ! -z "$(which docker 2>/dev/null)" ]; then
        echo "1"
    else
        echo "0"
    fi
}

usage(){
    echo -e "Usage: $0 <command> [args]\n"
    echo "Commands:"
    echo "  backend_bash       → Open bash in backend container"
    echo "  frontend_bash      → Open bash in frontend container"
    echo "  backend_logs       → Show logs for backend"
    echo "  frontend_logs      → Show logs for frontend"
    echo "  db_bash            → Open bash in database container"
    echo "  db_logs            → Show logs for database"
    echo "  create_migration   → Generate a new TypeORM migration"
    echo "  run_migration      → Run pending migrations"
    echo "  mysql              → Open MySQL shell"
    echo "  mysql_dump         → Dump the database (compressed)"
    echo "  mysql_restore <file> → Restore the database from a dump"
    echo "  up [services...]   → Start Docker services"
    echo "  down               → Stop all Docker services"
    echo "  restart [services] → Restart specified Docker services"
    echo "  rmi <image>        → Remove Docker image"
    echo "  changelog          → Update changelog"
}


if [ "$(is_docker)" -eq 1 ]; then
    if [ -z "$(which docker-compose)" ]; then
        compose="docker compose"
    else
        compose="docker-compose"
    fi
    cmd_backend="$compose exec $BACKEND_SERVICE"
    cmd_frontend="$compose exec $FRONTEND_SERVICE"
    cmdmy="$compose exec $DB_SERVICE"
    cmdmyInput="docker exec -i $($compose ps -q $DB_SERVICE)"
    cmdrestart="$compose restart"
    cmdup="$compose up"
    cmddown="$compose down"
    cmdrmi="docker rmi"
    cmdlogs="$compose logs"
else
    echo "❌ Docker is not installed. Please install Docker on the system."
    exit 1
fi
pass=$(get_conf_val DB_PASS)
mysql="mariadb -u $DB_USER $DATABASE -p$pass"
DIR="$(dirname $0)"

action=$1
shift
# Keep actions sorted
case $action in
    "backend_bash")
        $cmd_backend /bin/sh
        ;;
    "backend_logs")
        $cmdlogs backend
        ;;
    "changelog")
      if [[ $(git rev-parse --abbrev-ref HEAD) == "main" ]]; then
        # Get all commits in "date|subject|hash" format
        commits=$(git log --date=short --pretty=format:"%ad|%s|%h")

        # Extract all existing hashes from CHANGELOG.md (any 7+ hex digits inside parentheses)
        existing_hashes=$(grep -oE '\([a-f0-9]{7,}\)' CHANGELOG.md | tr -d '()')
        declare -A existing
        for hash in $existing_hashes; do
          existing["$hash"]=1
        done

        # Prepare new changelog section
        new_section=""
        while IFS='|' read -r date subject hash; do
          if [[ -z "${existing[$hash]}" ]]; then
            # First time we encounter a new commit, add the heading
            if [[ -z "$new_section" ]]; then
              new_section="## Changelog update ($(date +%Y-%m-%d))\n"
            fi
            new_section+="- $subject ($hash)\n"
          fi
        done <<< "$commits"

        # Only prepend if we found any new commits
        if [[ -n "$new_section" ]]; then
          {
            echo -e "$new_section"
            echo ""
            cat CHANGELOG.md
          } > CHANGELOG.tmp
          mv CHANGELOG.tmp CHANGELOG.md
          echo "Changelog updated."
        else
          echo "No new commits to add."
        fi
      else
        echo "Not on main, skipping changelog update."
      fi

      ;;
    "create_migration")
        $cmd_backend npm run typeorm:generate-migration --name="$1"
        ;;
    "frontend_bash")
        $cmd_frontend /bin/sh
        ;;
    "db_bash")
        $cmdmy bash
        ;;
    "db_logs")
        $cmdlogs DB_SERVICE
        ;;
    "down")
        $cmddown
        ;;
    "frontend_logs")
        $cmdlogs frontend
        ;;
    "help")
        usage
        ;;
    "mysql")
        set -x
        $cmdmy $mysql
        set +x
        ;;
	      "mysql_dump")
	      mkdir -p "$DUMP_PATH"
        $cmdmy mariadb-dump --databases $DATABASE -u $DB_USER -p$pass | gzip > ./$DUMP_PATH/${DATABASE}_$(date +%Y%m%d_%H%M%S).sql.gz
		    ;;
	      "mysql_restore")
		          if [ -z "$1" ]; then
			            echo "Usage $0 mysql_restore <file>"
			            exit 1
		          fi
		              read -p "Do you want to restore your database from file '$1' ? This command will erase your current data. (y/n). " yn
        case $yn in
            [Yy]* )
                zcat $1 | grep -v '/\*M' | $cmdmyInput $mysql
                ;;
            [Nn]* )
                exit
                ;;
            * )
                echo "Please answer yes or no.";;
        esac
		          ;;
		"restart")
            $cmdrestart $@
            ;;
    "rmi")
            $cmdrmi $@
            ;;
    "run_migration")
            $cmd_backend npm run typeorm migration:run -- -d ./src/config/dataSource.ts
            ;;
    "up")
            $cmdup $@
            ;;
esac
