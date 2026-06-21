#!/bin/sh

(cd /volume1/my_apps/restic/ && docker compose -f backup.docker-compose.yml up)
(cd /volume1/my_apps/restic/ && docker compose -f retention.docker-compose.yml up)
