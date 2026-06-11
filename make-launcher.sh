#!/bin/bash
# (可选) 生成一个可双击的「桌宠开关.app」启动器并装到 /Applications。
# 双击 = 智能开关:桌宠没开就开、开着就关。
# 用 osacompile 生成原生通用二进制 → 不需要 Rosetta。仅 macOS。
set -e

HERE="$(cd "$(dirname "$0")" && pwd)"
APP_NAME="桌宠开关"
DST="/Applications/${APP_NAME}.app"

# 定位 petdex-cc
PETDEX_BIN="$(command -v petdex-cc || true)"
if [ -z "$PETDEX_BIN" ]; then
  echo "❌ 找不到 petdex-cc,请先: npm install -g petdex-cc"
  exit 1
fi
BIN_DIR="$(dirname "$PETDEX_BIN")"

# 1) 用 AppleScript 写切换逻辑,编译成原生 .app
TMP_AS="$(mktemp -t toggle).applescript"
cat > "$TMP_AS" <<OSA
do shell script "export PATH=${BIN_DIR}:/usr/local/bin:\$PATH; if petdex-cc status 2>/dev/null | grep -q 'Running: yes'; then petdex-cc stop; else petdex-cc start; fi"
OSA
rm -rf "$DST"
osacompile -o "$DST" "$TMP_AS"
rm -f "$TMP_AS"

# 2) 换上爪印图标(PNG → iconset → icns)
ICON_SRC="$HERE/assets/app-icon.png"
if [ -f "$ICON_SRC" ]; then
  ISET="$(mktemp -d)/icon.iconset"; mkdir -p "$ISET"
  for s in 16 32 128 256 512; do
    sips -z $s $s "$ICON_SRC" --out "$ISET/icon_${s}x${s}.png" >/dev/null 2>&1
    sips -z $((s*2)) $((s*2)) "$ICON_SRC" --out "$ISET/icon_${s}x${s}@2x.png" >/dev/null 2>&1
  done
  iconutil -c icns "$ISET" -o "$DST/Contents/Resources/applet.icns"
  rm -f "$DST/Contents/Resources/Assets.car"
  /usr/libexec/PlistBuddy -c "Delete :CFBundleIconName" "$DST/Contents/Info.plist" 2>/dev/null || true
fi

# 3) 临时签名 + 清隔离 + 刷新图标缓存
codesign --force --deep -s - "$DST" 2>/dev/null || true
xattr -dr com.apple.quarantine "$DST" 2>/dev/null || true
touch "$DST"
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "$DST" 2>/dev/null || true
killall Finder Dock 2>/dev/null || true

echo ""
echo "✅ 已生成: $DST"
echo "   · 在「应用程序」/ Launchpad / Spotlight 搜「桌宠」即可双击开关"
echo "   · 首次双击若提示「未验证开发者」→ 右键 App → 打开 → 确认(仅一次)"
