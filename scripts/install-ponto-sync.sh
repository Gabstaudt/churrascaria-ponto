#!/usr/bin/env bash
set -euo pipefail

release_path="${1:-}"
if [[ -z "$release_path" || ! -f "$release_path/package.json" ]]; then
  echo "Uso: sudo bash scripts/install-ponto-sync.sh /caminho/absoluto/da/release"
  exit 1
fi
if [[ "$(id -u)" -ne 0 ]]; then echo "Execute como root."; exit 1; fi

install -d -m 0755 /opt/churrascaria-ponto/releases /etc/churrascaria-ponto
install -d -o ponto-sync -g ponto-sync -m 0700 /var/lib/churrascaria-ponto
release_name="$(date -u +%Y%m%d%H%M%S)"
cp -R "$release_path" "/opt/churrascaria-ponto/releases/$release_name"
ln -sfn "/opt/churrascaria-ponto/releases/$release_name" /opt/churrascaria-ponto/current
install -m 0644 "$release_path/deploy/ponto-sync/ponto-sync.service" /etc/systemd/system/ponto-sync.service
systemctl daemon-reload
echo "Release $release_name instalada. Configure /etc/churrascaria-ponto/ponto-sync.env e execute: systemctl enable --now ponto-sync"
