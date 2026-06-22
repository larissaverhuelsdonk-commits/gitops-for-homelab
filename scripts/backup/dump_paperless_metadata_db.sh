#!/usr/bin/env bash

set -euo pipefail

timestamp=$(date +"%Y-%m-%d")
backup_file="$HOME/backups/paperless-metadata-db-${timestamp}.sql"

(cd /volume1/my_apps/10-central-postgres && docker compose exec -T db pg_dump -U "paperless" -d "paperless" > "${backup_file}")
