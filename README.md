# petdex-cc-mods 🐾

一套叠加在 [**petdex-cc**](https://www.npmjs.com/package/petdex-cc)（Claude Code 桌面宠物）之上的**魔改补丁包**。

官方 petdex-cc 让一只像素小宠物站在你的桌面，跟随 Claude Code 的活动做出反应。本仓库**不重新分发官方代码**，只提供我的定制补丁 + 安装脚本，一键叠加到你已安装的 petdex-cc 上。

> 基于 petdex-cc（MIT License）。原始桌宠程序版权归其作者所有，特此致谢。

---

## ✨ 这套魔改加了什么

| 功能 | 说明 |
|------|------|
| 🔍 **桌宠缩放** | 桌宠等比缩放到 `0.618`（黄金比例），窗口/对话框位置自动协调，不裁切、不错位 |
| 💬 **对话框贴脸** | 修正缩放后对话气泡“飘太远”的问题，气泡始终贴在头顶（按 `translateY = 207 − 208×scale` 自动定位） |
| 📊 **脚下双血条** | 桌宠脚下两条血条，正常字号、清晰可读：<br>· 🔵 **蓝条 = 升级进度**（离下一级还差多少）<br>· 🔴 **红条 = 剩余上下文空间**（扣血式：满血=上下文空，用得越多越短，低于 15% 闪红警示） |
| ⚡ **实时 token（核心修复）** | 官方靠 `statusLine` 钩子推送 token，但**该钩子在非终端环境根本不触发**，且其 bridge 脚本有 **JSON 格式 bug**（键名漏引号→服务端丢弃）。本包**修了 JSON bug**，并**改用一直会触发的事件钩子**，从会话 transcript 实时读取真实上下文 token |
| 💾 **token 持久化** | token 数写入缓存文件，重启桌宠后立即恢复显示，不再空白 |
| ⬢ **六边形托盘图标** | 官方托盘图标是一张几乎全白的小图，菜单栏里很糊。换成干净的纯黑**模板图标**（macOS 自动适配明暗），并带合适边距、与其它菜单栏图标等高 |
| 🚫 **关闭问题自启** | 官方 `install` 会开启开机自启，但其 `auto-launch` 在 macOS 上有 bug：开机会弹出一个 **Node.js REPL 窗口**。本包默认帮你关闭自启 |

---

## 📦 安装

### 1. 先装官方 petdex-cc 并至少装一只宠物

```bash
npm install -g petdex-cc
petdex-cc install boba        # 任意一只宠物的 slug
```

### 2. 克隆本仓库并应用魔改

```bash
git clone https://github.com/<your-name>/petdex-cc-mods.git
cd petdex-cc-mods
chmod +x apply.sh restore.sh
./apply.sh
```

`apply.sh` 会：把补丁文件覆盖进 petdex-cc、安装两个 hook 脚本、重启桌宠、并关闭开机自启。**所有被覆盖的官方文件都会先备份成 `*.modbak`。**

---

## 🐱 日常使用（宠物管理仍然用官方命令）

下载 / 切换宠物**完全不受影响**，照常用 petdex-cc：

```bash
petdex-cc list                 # 看有哪些宠物可下载
petdex-cc install <slug>       # 下载新宠物（⚠️ 见下方注意）
petdex-cc switch <slug>        # 在已装的宠物间切换（推荐：保留等级进度）
petdex-cc status               # 查看当前宠物 / 等级 / 事件数
petdex-cc start | stop         # 开 / 关桌宠
```

> ⚠️ **`install` 的两个副作用**（官方行为，非本包引入）：
> 1. 会**重置全局等级经验**为 0（蓝条清零）
> 2. 会**重新打开开机自启**（又会弹 node REPL）
>
> 所以：**已装过的宠物请用 `switch` 切换**；只有装全新宠物才用 `install`，且装完建议重跑一次 `./apply.sh`（会顺手再关掉自启）。

---

## 🔄 升级 / 还原

- **官方升级后魔改会被覆盖**：`petdex-cc update` 会还原官方文件。升级后重跑 `./apply.sh` 即可恢复所有魔改。
- **还原到官方原版**：`./restore.sh`（从 `*.modbak` 备份恢复）。

---

## ⚙️ 常用自定义

| 想改什么 | 改哪里 | 然后 |
|---|---|---|
| 桌宠大小 | `patches/renderer/index.html` 里 `#pet-sprite-wrapper` 的 `scale(0.618)` | 重跑 `apply.sh` |
| 对话框位置 | 同上的 `#bubble` 的 `translateY(...)`（公式 `207 − 208×scale`） | 重跑 `apply.sh` |
| 上下文血条分母 | `patches/renderer/renderer.js` 里 `CONTEXT_MAX`（默认 `1e6`=1.0M；200K 模型改 `2e5`） | 重跑 `apply.sh` |
| 低血量警示阈值 | `renderer.js` 里 `remaining <= 0.15` | 重跑 `apply.sh` |
| 托盘图标 | 换掉 `patches/assets/tray-icon.png`（建议纯黑+透明的模板图） | 重跑 `apply.sh` |

---

## 🧱 仓库结构

```
petdex-cc-mods/
├── README.md
├── LICENSE                       # MIT，注明基于 petdex-cc
├── apply.sh                      # 一键应用魔改（含备份）
├── restore.sh                    # 一键还原官方
├── hooks/
│   ├── bridge.sh                 # 事件钩子 + 从 transcript 实时读 token
│   └── statusline-bridge.sh      # 修了 JSON bug 的 statusLine 桥
└── patches/
    ├── renderer/index.html       # 缩放 / 对话框 / 脚下血条结构与样式
    ├── renderer/renderer.js      # token 逻辑 / 血条驱动 / 持久化
    ├── main/index.js             # 窗口尺寸
    ├── main/tray.js              # 托盘模板图标
    └── assets/tray-icon.png      # 六边形图标
```

---

## ❓ 已知限制

- **多对话窗口**：桌宠只有一只、一个血条，红条显示的是「**最近活跃的那个对话窗口**」的上下文。纯切换焦点（不输入）不会更新——因为 Claude Code 没有“聚焦/切换”钩子，只有一次性的 `SessionStart(resume)` 钩子（所以第一次点开历史对话会自动跳一次，之后需有动作才更新）。
- **5 小时 / 周限制**：账号级数据，不写盘、不传钩子，桌宠**拿不到**，请在 Claude Code 自带面板查看。
- **平台**：以上修复主要针对 macOS 验证。

---

*Not affiliated with the original petdex-cc author. Use at your own risk.*
