#!/bin/bash

echo "Sleeping for 1min until volumes are known..."
sleep 60

echo "...done. Starting central PostgreSQL database instance..."
(cd /volume1/my_apps/postgres && docker compose up -d)

echo "...done. Waiting for 5s so everything settles..."
sleep 5

echo "...done. Starting paperless (this will take ~90s, but we don't wait this time)..."
(cd /volume1/my_apps/paperless && docker compose up -d)

echo "...done. Starting Homepage..."
(cd /volume1/my_apps/homepage && docker compose up -d)

echo "...done."
