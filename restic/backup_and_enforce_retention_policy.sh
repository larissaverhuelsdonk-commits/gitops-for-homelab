#!/bin/sh

docker compose -f backup.docker-compose.yml up && docker compose -f retention.docker-compose.yml up
