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

backup_dir="$HOME/backups"
backup_file="$backup_dir/all-docs-${timestamp}.zip"

mkdir -p "$backup_dir"

(
    cd "$GITOPS_BASE_DIR/20-paperless-ngx"

    docker compose exec -T paperless \
        document_exporter -nt -z -zn all-docs ../export
)

mv \
    "$GITOPS_BASE_DIR/20-paperless-ngx/data/export/all-docs.zip" \
    "$backup_file"

echo "Backup written to:"
echo "  $backup_file"

