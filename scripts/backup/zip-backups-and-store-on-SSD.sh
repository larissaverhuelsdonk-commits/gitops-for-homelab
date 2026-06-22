#!/usr/bin/env bash

set -euo pipefail

SOURCE_DIR="$HOME/backups"
DEST_DIR="/onsite-backups"
DATE="$(date +%F)"
ARCHIVE_NAME="full_backup-${DATE}.zip"

TEMP_PATH="/tmp/${ARCHIVE_NAME}"
FINAL_PATH="${DEST_DIR}/${ARCHIVE_NAME}"

mkdir -p "$DEST_DIR"

# Check if final file already exists
if [[ -f "$FINAL_PATH" ]]; then
    echo "Backup already exists: $FINAL_PATH"
    read -r -p "Overwrite it? [y/N]: " answer

    case "${answer:-N}" in
        y|Y)
            echo "Overwriting..."
            ;;
        *)
            echo "Aborting."
            exit 1
            ;;
    esac
fi

# Create archive
zip -r "$TEMP_PATH" "$SOURCE_DIR"

# Move into place (atomic replace after confirmation)
mv -f "$TEMP_PATH" "$FINAL_PATH"
