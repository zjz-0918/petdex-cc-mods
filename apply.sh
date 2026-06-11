#!/bin/bash
# Apply petdex-cc-mods on top of an installed petdex-cc.
# Safe to re-run (e.g. after `petdex-cc update` resets the package).
set -e

HERE="$(cd "$(dirname "$0")" && pwd)"
PKG="$(npm root -g 2>/dev/null)/petdex-cc"
HOOKS="$HOME/.petdex-cc/hooks"

if [ ! -d "$PKG" ]; then
  echo "❌ 找不到 petdex-cc 安装目录: $PKG"
  echo "   请先安装官方包:  npm install -g petdex-cc"
  echo "   并至少装一只宠物: petdex-cc install <slug>"
  exit 1
fi

echo "📦 petdex-cc 安装位置: $PKG"

backup() { [ -f "$1" ] && [ ! -f "$1.modbak" ] && cp "$1" "$1.modbak" && echo "  备份 → $(basename "$1").modbak"; }

echo "🔧 应用补丁文件 ..."
for rel in renderer/index.html renderer/renderer.js main/index.js main/tray.js assets/tray-icon.png cli/install.js; do
  dst="$PKG/dist/src/$rel"
  mkdir -p "$(dirname "$dst")"
  backup "$dst"
  cp "$HERE/patches/$rel" "$dst"
  echo "  ✓ dist/src/$rel"
done

echo "🪝 应用 hook 脚本 ..."
mkdir -p "$HOOKS"
for h in bridge.sh statusline-bridge.sh; do
  backup "$HOOKS/$h"
  cp "$HERE/hooks/$h" "$HOOKS/$h"
  chmod +x "$HOOKS/$h"
  echo "  ✓ ~/.petdex-cc/hooks/$h"
done

echo "🔁 重启桌宠 ..."
petdex-cc stop  >/dev/null 2>&1 || true
sleep 1
petdex-cc start >/dev/null 2>&1 || true

# autostart 在 macOS 上有 bug(开机弹 node REPL),默认关掉
petdex-cc autostart --disable >/dev/null 2>&1 || true

echo ""
echo "✅ 完成! 魔改已应用。"
echo "   · 桌宠缩放 0.618、脚下双血条(蓝=等级 / 红=剩余上下文)、六边形托盘图标、实时token"
echo "   · 已顺手关闭开机自启(避免开机弹 node 窗口)"
echo "   · 提示: 上下文血条分母默认 1.0M, 若用 200K 模型请改 patches/renderer/renderer.js 里的 CONTEXT_MAX 后重跑本脚本"
