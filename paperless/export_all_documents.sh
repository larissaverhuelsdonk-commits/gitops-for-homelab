#!/bin/bash

set -euo pipefail

timestamp=$(date +"%Y-%m-%d")

docker compose exec -ti webserver document_exporter -z -zn all-docs ../export
mv ./data/export/all-docs.zip ~/backups/all-docs-${timestamp}.zip
