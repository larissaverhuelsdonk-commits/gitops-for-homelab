#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

CONFIG_DIR="$REPO_ROOT/config"
CONFIG_FILE="$CONFIG_DIR/gitops_base_path.txt"

# If already configured, tell the user and exit.
if [[ -f "$CONFIG_FILE" ]]; then
    echo
    echo "GitOps base path is already configured."
    echo
    echo "See:"
    echo "  $CONFIG_FILE"
    echo
    echo "Current value:"
    cat "$CONFIG_FILE"
    echo
    exit 0
fi

# Suggest the parent directory of the script directory.
SUGGESTED_DIR="$REPO_ROOT"

echo
echo "Suggested GitOps base directory:"
echo "  $SUGGESTED_DIR"
echo
echo "This is the parent directory of the script location."
echo

while true; do
    read -rp "Use this directory? [Y/n] " answer

    case "${answer:-y}" in
        [Yy]|[Yy][Ee][Ss])
            GITOPS_BASE_DIR="$SUGGESTED_DIR"
            break
            ;;
        [Nn]|[Nn][Oo])
            read -erp "Enter GitOps base directory: " GITOPS_BASE_DIR
            break
            ;;
        *)
            echo "Please answer y or n."
            ;;
    esac
done

if [[ ! -d "$GITOPS_BASE_DIR" ]]; then
    echo
    echo "ERROR: Directory does not exist:"
    echo "  $GITOPS_BASE_DIR"
    exit 1
fi

mkdir -p "$CONFIG_DIR"

# Store canonical path.
GITOPS_BASE_DIR="$(realpath "$GITOPS_BASE_DIR")"

echo "$GITOPS_BASE_DIR" > "$CONFIG_FILE"

echo
echo "Configuration saved."
echo
echo "File:"
echo "  $CONFIG_FILE"
echo
echo "Value:"
echo "  $GITOPS_BASE_DIR"
echo

