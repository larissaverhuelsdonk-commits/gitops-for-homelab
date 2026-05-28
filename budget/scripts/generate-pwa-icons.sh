#!/usr/bin/env sh
# Regenerate manifest icon sizes from frontend/public/img/icon.png (macOS sips).
# PWA installability requires icons whose declared sizes match actual pixels.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/frontend/public/img/icon.png"
OUT192="$ROOT/frontend/public/img/icon-192.png"
OUT512="$ROOT/frontend/public/img/icon-512.png"
if ! command -v sips >/dev/null 2>&1; then
  echo "This script needs macOS sips, or resize manually to 192 and 512 px." >&2
  exit 1
fi
sips -z 192 192 "$SRC" --out "$OUT192"
sips -z 512 512 "$SRC" --out "$OUT512"
echo "Wrote $OUT192 and $OUT512"
