#!/usr/bin/env bash

set -euo pipefail

timestamp=$(date +"%Y-%m-%d")
backup_file="$HOME/backups/vaultwarden-data-volume-${timestamp}.tar.gz"

(cd /volume1/my_apps/vaultwarden && docker compose down)
tar czf ${backup_file} /volume1/my_apps/vaultwarden/vw-data/
(cd /volume1/my_apps/vaultwarden && docker compose up -d)

