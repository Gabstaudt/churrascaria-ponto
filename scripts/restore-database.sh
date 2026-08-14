#!/usr/bin/env bash
set -euo pipefail

backup_file="${1:-}"
if [[ -z "$backup_file" || ! -f "$backup_file" ]]; then printf '%s\n' "Informe um arquivo de backup existente." >&2; exit 1; fi
if [[ -z "${TARGET_DATABASE_URL:-}" ]]; then printf '%s\n' "TARGET_DATABASE_URL não definida." >&2; exit 1; fi
if [[ "${CONFIRM_RESTORE:-}" != "RESTORE" ]]; then printf '%s\n' "Restauração cancelada. Defina CONFIRM_RESTORE=RESTORE conscientemente." >&2; exit 1; fi
if [[ -f "$backup_file.sha256" ]]; then if command -v sha256sum >/dev/null 2>&1; then sha256sum --check "$backup_file.sha256"; else shasum -a 256 --check "$backup_file.sha256"; fi; fi
pg_restore --dbname="$TARGET_DATABASE_URL" --clean --if-exists --no-owner --no-acl "$backup_file"
printf 'Restauração concluída a partir de: %s\n' "$backup_file"
