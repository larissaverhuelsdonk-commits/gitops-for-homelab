#!/bin/sh
set -e

run_step() {
  echo ""
  echo "========================================"
  echo "START: $1"
  echo "========================================"

  if "$2"; then
    echo "SUCCESS: $1"
  else
    echo "FAILURE: $1"
    exit 1
  fi
}

run_step "Paperless metadata DB dump" ./dump_paperless_metadata_db.sh
run_step "Paperless document export" ./export_all_paperless_documents.sh
#run_step "Clear ~/backups/*" ./clear_temporary_backups.sh
