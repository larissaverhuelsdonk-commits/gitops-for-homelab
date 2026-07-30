#!/bin/sh

# Install PostgreSQL
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install postgresql bitnami/postgresql \
    --namespace coder \
    --set image.repository=bitnamilegacy/postgresql \
    --set auth.username=coder \
    --set auth.password=coder \
    --set auth.database=coder \
    --set primary.persistence.size=10Gi

