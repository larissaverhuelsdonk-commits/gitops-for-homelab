#!/bin/bash

set -euo pipefail

timestamp=$(date +"%Y-%m-%d")

(cd /volume1/my_apps/paperless && docker compose exec -ti webserver document_exporter -nt -z -zn all-docs ../export)
mv /volume1/my_apps/paperless/data/export/all-docs.zip ~/backups/all-docs-${timestamp}.zip
