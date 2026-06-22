#!/bin/bash

echo "Sleeping for 1min until volumes are known..."
#sleep 60

echo "...done. Setting up external docker networks for inter-service communication..."
(cd /volume1/my_apps/00-bootstrap-networking && docker compose up -d)

echo "...done. Starting central PostgreSQL database instance..."
(cd /volume1/my_apps/10-central-postgres && docker compose up -d)

echo "...done. Waiting for 5s so everything settles..."
sleep 5

echo "...done. Starting paperless (this will take ~90s, but we don't wait this time)..."
(cd /volume1/my_apps/20-paperless-ngx && docker compose up -d)

echo "...done. Starting Homepage..."
(cd /volume1/my_apps/30-homepage && docker compose up -d)

echo "...done."
