#!/bin/sh
set -e
# Apply pending migrations (no-op if DB is already up to date). Safe on every start.
npx prisma migrate deploy
exec "$@"
