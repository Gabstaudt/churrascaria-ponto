#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then printf '%s\n' "DATABASE_URL não definida." >&2; exit 1; fi
backup_dir="${1:-backups}"
mkdir -p "$backup_dir"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
target="$backup_dir/churrascaria-ponto-$timestamp.dump"
pg_dump --dbname="$DATABASE_URL" --format=custom --no-owner --no-acl --file="$target"
if command -v sha256sum >/dev/null 2>&1; then sha256sum "$target" > "$target.sha256"; else shasum -a 256 "$target" > "$target.sha256"; fi
printf 'Backup criado: %s\nChecksum: %s\n' "$target" "$target.sha256"
