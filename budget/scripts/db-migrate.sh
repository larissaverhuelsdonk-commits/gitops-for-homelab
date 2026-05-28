#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"
export DATABASE_URL="${DATABASE_URL:?Set DATABASE_URL}"
npx prisma migrate deploy
