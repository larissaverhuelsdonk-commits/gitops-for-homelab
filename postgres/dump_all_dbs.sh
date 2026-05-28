#!/usr/bin/env bash

set -euo pipefail

mkdir -p backup

timestamp=$(date +"%Y-%m-%d")

docker compose exec -T db pg_dump -U "paperless"  > "~/backups/all-dbs-${timestamp}.sql"
