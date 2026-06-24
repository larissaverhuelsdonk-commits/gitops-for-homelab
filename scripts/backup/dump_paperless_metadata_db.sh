#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

CONFIG_FILE="$REPO_ROOT/../config/gitops_base_path.txt"

if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "ERROR: GitOps base path is not configured."
    echo
    echo "Expected configuration file:"
    echo "  $CONFIG_FILE"
    echo
    echo "Run the setup script first."
    exit 1
fi

GITOPS_BASE_DIR="$(<"$CONFIG_FILE")"

if [[ ! -d "$GITOPS_BASE_DIR" ]]; then
    echo "ERROR: Configured GitOps base directory does not exist:"
    echo "  $GITOPS_BASE_DIR"
    exit 1
fi

timestamp=$(date +"%Y-%m-%d")
backup_file="$HOME/backups/paperless-metadata-db-${timestamp}.sql"

mkdir -p "$(dirname "$backup_file")"

(
    cd "$GITOPS_BASE_DIR/10-central-postgres"
    docker compose exec -T db \
        pg_dump -U "paperless" -d "paperless" > "$backup_file"
)

echo "Backup written to:"
echo "  $backup_file"

