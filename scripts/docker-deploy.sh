#!/bin/bash
set -euo pipefail
trap 'echo "Error: Command failed on line $LINENO"; exit 1' ERR

# -------------------
# Functions
# -------------------

# Development
dev() {
    echo "Starting development environment..."
    docker-compose up -d
    echo "Waiting for services to be healthy..."
    sleep 10
    docker-compose logs -f
}

# Production
prod() {
    echo "Starting production environment..."
    docker-compose -f docker-compose.prod.yml up -d
    echo "Services started!"
}

# Stop all
stop() {
    echo "Stopping services..."
    docker-compose down
    docker-compose -f docker-compose.prod.yml down
}

# Rebuild
rebuild() {
    echo "Rebuilding containers..."
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
}

# Logs
logs() {
    if [ -z "${1:-}" ]; then
        echo "Error: Service name required. Usage: $0 logs <service>"
        return 1
    fi
    docker-compose logs -f "$1"
}

# Database backup
backup() {
    local container_name="${POSTGRES_CONTAINER:-projectmanagement_postgres_prod}"
    local backup_dir="backups"

    echo "Creating database backup..."
    mkdir -p "$backup_dir"

    local backup_file="$backup_dir/backup_$(date +%Y%m%d_%H%M%S).sql"

    if docker exec "$container_name" pg_dump -U "${POSTGRES_USER:-postgres}" "${POSTGRES_DB:-projectmanagement}" > "$backup_file"; then
        echo "Backup completed: $backup_file"
    else
        echo "Error: Backup failed"
        return 1
    fi
}

# -------------------
# Main
# -------------------
case "${1:-}" in
    dev)
        dev
        ;;
    prod)
        prod
        ;;
    stop)
        stop
        ;;
    rebuild)
        rebuild
        ;;
    logs)
        logs "${2:-}"
        ;;
    backup)
        backup
        ;;
    *)
        echo "Usage: $0 {dev|prod|stop|rebuild|logs <service>|backup}"
        exit 1
        ;;
esac