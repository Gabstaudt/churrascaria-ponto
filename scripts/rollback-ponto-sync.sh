#!/usr/bin/env bash
set -euo pipefail

release_name="${1:-}"
target="/opt/churrascaria-ponto/releases/$release_name"
if [[ -z "$release_name" || ! -f "$target/package.json" ]]; then echo "Uso: sudo bash scripts/rollback-ponto-sync.sh NOME_DA_RELEASE"; exit 1; fi
if [[ "$(id -u)" -ne 0 ]]; then echo "Execute como root."; exit 1; fi
ln -sfn "$target" /opt/churrascaria-ponto/current
systemctl restart ponto-sync
echo "Rollback concluído para $release_name."
