#!/bin/bash

kubectl label namespace local-path-storage \
  pod-security.kubernetes.io/enforce=privileged \
  pod-security.kubernetes.io/audit=privileged \
  pod-security.kubernetes.io/warn=privileged \
  --overwrite

kubectl rollout restart deployment/local-path-provisioner \
  -n local-path-storage
