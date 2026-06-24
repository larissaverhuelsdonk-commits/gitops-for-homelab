#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

CONFIG_FILE="$REPO_ROOT/config/gitops_base_path.txt"

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

echo "Using GitOps base directory:"
echo "  $GITOPS_BASE_DIR"
echo

echo "Sleeping for 1min until volumes are known..."
# sleep 60

echo "...done. Setting up external docker networks for inter-service communication..."
(cd "$GITOPS_BASE_DIR/00-bootstrap-networking" && docker compose up -d)

echo "...done. Starting central PostgreSQL database instance..."
(cd "$GITOPS_BASE_DIR/10-central-postgres" && docker compose up -d)

echo "...done. Waiting for 5s so everything settles..."
sleep 5

echo "...done. Starting paperless (this will take ~90s, but we don't wait this time)..."
(cd "$GITOPS_BASE_DIR/20-paperless-ngx" && docker compose up -d)

echo "...done. Starting Homepage..."
(cd "$GITOPS_BASE_DIR/30-homepage" && docker compose up -d)

echo "...done."

