#!/bin/bash
# Restore the original (stock) petdex-cc files that apply.sh replaced.
set -e

PKG="$(npm root -g 2>/dev/null)/petdex-cc"
HOOKS="$HOME/.petdex-cc/hooks"

restore() {
  if [ -f "$1.modbak" ]; then
    cp "$1.modbak" "$1"
    echo "  ↩︎ 还原 $(basename "$1")"
  fi
}

echo "↩︎ 还原官方文件 ..."
for rel in renderer/index.html renderer/renderer.js main/index.js main/tray.js assets/tray-icon.png; do
  restore "$PKG/dist/src/$rel"
done
for h in bridge.sh statusline-bridge.sh; do
  restore "$HOOKS/$h"
done

petdex-cc stop  >/dev/null 2>&1 || true
sleep 1
petdex-cc start >/dev/null 2>&1 || true
echo "✅ 已还原到官方原版(若存在 .modbak 备份)。"
