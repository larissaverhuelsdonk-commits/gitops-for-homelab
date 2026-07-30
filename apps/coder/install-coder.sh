#!/bin/sh

helm install coder coder-v2/coder \
    --namespace coder \
    --values values.yaml \
    --version 2.33.6

