#!/bin/bash

set -euo pipefail

timestamp=$(date +"%Y-%m-%d")

(cd /volume1/my_apps/20-paperless-ngx && docker compose exec -ti paperless document_exporter -nt -z -zn all-docs ../export)
mv /volume1/my_apps/20-paperless-ngx/data/export/all-docs.zip ~/backups/all-docs-${timestamp}.zip
