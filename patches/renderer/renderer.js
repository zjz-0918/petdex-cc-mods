"use strict";
(() => {
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });

  // src/renderer/pet-sprite.ts
  var petStates = [
    { id: "idle", label: "Idle", row: 0, frames: 6, durationMs: 1100 },
    { id: "running-right", label: "Running Right", row: 1, frames: 8, durationMs: 1060 },
    { id: "running-left", label: "Running Left", row: 2, frames: 8, durationMs: 1060 },
    { id: "waving", label: "Waving", row: 3, frames: 4, durationMs: 700 },
    { id: "jumping", label: "Jumping", row: 4, frames: 5, durationMs: 840 },
    { id: "failed", label: "Failed", row: 5, frames: 8, durationMs: 1220 },
    { id: "waiting", label: "Waiting", row: 6, frames: 6, durationMs: 1010 },
    { id: "running", label: "Running", row: 7, frames: 6, durationMs: 820 },
    { id: "review", label: "Review", row: 8, frames: 6, durationMs: 1030 }
  ];
  function setSpriteImage(url) {
    const el = getPetElement();
    if (el) {
      el.style.setProperty("--sprite-url", `url("${url}")`);
    }
  }
  function setPetAction(stateId) {
    const el = getPetElement();
    if (!el) return;
    const state = petStates.find((s) => s.id === stateId);
    if (!state) return;
    el.style.setProperty("--sprite-row", String(state.row));
    el.style.setProperty("--sprite-frames", String(state.frames));
    el.style.setProperty("--sprite-duration", `${state.durationMs}ms`);
    const currentAnimation = el.style.animation;
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = currentAnimation || "";
  }
  function getPetElement() {
    return document.getElementById("pet-sprite");
  }

  // src/renderer/bubble.ts
  var BUBBLE_ELEMENT_ID = "bubble";
  var HIDDEN_CLASS = "bubble-hidden";
  var DEFAULT_DURATION_MS = 3e3;
  var AI_DURATION_MS = 8e3;
  var bubbleTimer = null;
  function getBubble() {
    return document.getElementById(BUBBLE_ELEMENT_ID);
  }
  function truncateText(text, maxLen = 60) {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen - 3) + "...";
  }
  function showBubble(text, durationMs = DEFAULT_DURATION_MS) {
    const el = getBubble();
    if (!el) return;
    if (bubbleTimer !== null) {
      clearTimeout(bubbleTimer);
      bubbleTimer = null;
    }
    el.textContent = truncateText(text);
    el.classList.remove(HIDDEN_CLASS);
    bubbleTimer = setTimeout(() => {
      el.classList.add(HIDDEN_CLASS);
      bubbleTimer = null;
    }, durationMs);
  }
  function showAiBubble(text) {
    showBubble(text, AI_DURATION_MS);
  }

  // src/renderer/click-through.ts
  function initClickThrough(win, petEl2) {
    win.setIgnoreMouseEvents(true, { forward: true });
    petEl2.addEventListener("mouseenter", () => {
      win.setIgnoreMouseEvents(false);
    });
    petEl2.addEventListener("mouseleave", () => {
      win.setIgnoreMouseEvents(true, { forward: true });
    });
  }

  // src/renderer/drag.ts
  var dragging = false;
  var startX = 0;
  var startY = 0;
  var clickCount = 0;
  var clickTimer = null;
  var CLICK_WINDOW_MS = 1500;
  var CLICK_MESSAGES = [
    { threshold: 2, text: "\u4F60\u6233\u6211\u5E72\u561B\uFF1F" },
    { threshold: 4, text: "\u597D\u75DB\uFF01\u522B\u6233\u4E86\uFF01" },
    { threshold: 6, text: "\u518D\u70B9\u6211\u5C31\u4E0D\u7406\u4F60\u4E86\uFF01", state: "failed" },
    { threshold: 9, text: "\u545C\u545C...\u4F60\u6B3A\u8D1F\u4EBA", state: "failed" },
    { threshold: 12, text: "\u6211\u8981\u62A5\u8B66\u4E86\uFF01\u518D\u70B9\u4E00\u4E0B\u8BD5\u8BD5\uFF01", state: "jumping" },
    { threshold: 15, text: "\u2728 \u52C7\u6562\u7684\u5192\u9669\u8005\uFF0C\u4F60\u89E3\u9501\u4E86\u9690\u85CF\u6210\u5C31\uFF01", state: "jumping" }
  ];
  function handleClick() {
    clickCount++;
    if (clickTimer) clearTimeout(clickTimer);
    clickTimer = setTimeout(() => {
      clickCount = 0;
    }, CLICK_WINDOW_MS);
    let matched = CLICK_MESSAGES[0];
    for (const msg of CLICK_MESSAGES) {
      if (clickCount >= msg.threshold) matched = msg;
    }
    if (clickCount >= CLICK_MESSAGES[0].threshold) {
      showBubble(matched.text, 4e3);
      if (matched.state) setPetAction(matched.state);
    }
  }
  function initDrag(petEl2, win) {
    petEl2.addEventListener("mousedown", (e) => {
      dragging = true;
      startX = e.screenX;
      startY = e.screenY;
      e.preventDefault();
      handleClick();
    });
    document.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const [wx, wy] = win.getPosition();
      win.setPosition(wx + e.screenX - startX, wy + e.screenY - startY);
      startX = e.screenX;
      startY = e.screenY;
    });
    document.addEventListener("mouseup", () => {
      dragging = false;
    });
  }

  // src/renderer/renderer.ts
  var import_electron = __require("electron");
  var import_remote = __require("@electron/remote");
  var WINDOW_W = 300;
  var WINDOW_H = 320;
  var MARGIN = 20;
  var petEl = document.getElementById("pet-sprite");
  var bubbleEl = document.getElementById("bubble");
  var containerEl = document.getElementById("pet-container");
  function getPetWindow() {
    return (0, import_remote.getCurrentWindow)();
  }
  function positionBottomRight() {
    try {
      const display = import_remote.screen.getPrimaryDisplay();
      const { x, y, width, height } = display.workArea;
      const win = getPetWindow();
      win.setPosition(
        x + width - WINDOW_W - MARGIN,
        y + height - WINDOW_H - MARGIN
      );
    } catch {
      const win = getPetWindow();
      win.setPosition(
        window.screen.width - WINDOW_W - MARGIN,
        window.screen.height - WINDOW_H - MARGIN
      );
    }
  }
  function init() {
    if (!petEl) return;
    positionBottomRight();
    initClickThrough(getPetWindow(), petEl);
    initDrag(petEl, getPetWindow());
    setPetAction("idle");
    petEl.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      import_electron.ipcRenderer.send("show-context-menu");
    });
    import_electron.ipcRenderer.on("pet-action", (_event, action) => {
      if (action.stateId) setPetAction(action.stateId);
      if (action.bubbleText) showBubble(action.bubbleText);
    });
    import_electron.ipcRenderer.on("ai-speech", (_event, data) => {
      if (data.text) showAiBubble(data.text);
    });
    import_electron.ipcRenderer.on("level-up", (_event, data) => {
      showBubble(`Level up! ${data.levelName}!`);
      updateLevelEffects(data.level);
    });
    import_electron.ipcRenderer.on("pet-switched", (_event, slug) => {
      loadPetSprite(slug);
    });
    import_electron.ipcRenderer.on("state", (_event, state) => {
      loadPetSprite(state.petSlug);
      updateLevelEffects(state.level);
    });
    import_electron.ipcRenderer.on("token-update", (_event, data) => {
      updateTokenBadge(data.total_tokens);
      persistTokenTotal(data.total_tokens);
      updateLevelBar();
    });
    restoreTokenTotal();
    updateLevelBar();
    import_electron.ipcRenderer.send("get-state");
  }
  function loadPetSprite(slug) {
    if (!slug) return;
    const homeDir = (process.env.USERPROFILE || process.env.HOME || "").replace(/\\/g, "/");
    const exts = ["webp", "png"];
    for (const ext of exts) {
      const path = `file:///${homeDir}/.petdex-cc/pets/${slug}/spritesheet.${ext}`;
      setSpriteImage(path);
      break;
    }
  }
  var LEVEL_NAMES = {
    1: "Byte",
    2: "Process",
    3: "Thread",
    4: "Module",
    5: "Kernel",
    6: "Neural",
    7: "Quantum",
    8: "Singularity"
  };
  var LEVEL_COLORS = {
    1: "#94a3b8",
    2: "#4ade80",
    3: "#60a5fa",
    4: "#a78bfa",
    5: "#f59e0b",
    6: "#ec4899",
    7: "#06b6d4",
    8: "#fbbf24"
  };
  function tokenCachePath() {
    const homeDir = (process.env.USERPROFILE || process.env.HOME || "").replace(/\\/g, "/");
    return `${homeDir}/.petdex-cc/data/token-cache.json`;
  }
  function persistTokenTotal(totalTokens) {
    try {
      if (typeof totalTokens !== "number" || !isFinite(totalTokens)) return;
      const fs = __require("node:fs");
      fs.writeFileSync(tokenCachePath(), JSON.stringify({ total_tokens: totalTokens }), "utf8");
    } catch {}
  }
  function restoreTokenTotal() {
    try {
      const fs = __require("node:fs");
      const raw = fs.readFileSync(tokenCachePath(), "utf8");
      const saved = JSON.parse(raw);
      if (saved && typeof saved.total_tokens === "number") {
        updateTokenBadge(saved.total_tokens);
      }
    } catch {}
  }
  var CONTEXT_MAX = 1e6; // token 血条分母(1.0M)。若切换到 200K 上限模型,改成 2e5
  var LEVEL_THRESHOLDS = { 1: 0, 2: 50, 3: 200, 4: 500, 5: 1000, 6: 2000, 7: 5000, 8: 10000 };
  function setBar(fillId, pctId, ratio, label) {
    const r = Math.max(0, Math.min(1, ratio));
    const fill = document.getElementById(fillId);
    if (fill) fill.style.width = (r * 100).toFixed(1) + "%";
    const pctEl = document.getElementById(pctId);
    if (pctEl) pctEl.textContent = label;
  }
  function fmtK(t) {
    if (t < 1e3) return `${t}`;
    if (t < 1e6) return `${(t / 1e3).toFixed(0)}K`;
    return `${(t / 1e6).toFixed(2)}M`;
  }
  function updateTokenBadge(totalTokens) {
    const remaining = Math.max(0, 1 - totalTokens / CONTEXT_MAX); // 扣血模式:血条=剩余上下文空间
    const remainingPct = Math.round(remaining * 100);
    const used = Math.max(0, totalTokens);
    setBar("token-fill", "token-pct", remaining, remainingPct + "%"); // 条外(右侧):剩余占比
    const num = document.getElementById("token-num");
    if (num) num.textContent = fmtK(used); // 条内:已用 token 量
    const fill = document.getElementById("token-fill");
    if (fill) fill.classList.toggle("hp-low", remaining <= 0.15);
  }
  function readPetState() {
    try {
      const fs = __require("node:fs");
      const homeDir = (process.env.USERPROFILE || process.env.HOME || "").replace(/\\/g, "/");
      return JSON.parse(fs.readFileSync(`${homeDir}/.petdex-cc/data/state.json`, "utf8"));
    } catch { return null; }
  }
  function updateLevelBar() {
    const st = readPetState();
    if (!st) return;
    const level = st.level || 1;
    const events = st.totalEvents || 0;
    const cur = LEVEL_THRESHOLDS[level] != null ? LEVEL_THRESHOLDS[level] : 0;
    const next = LEVEL_THRESHOLDS[level + 1];
    const ratio = next == null ? 1 : (events - cur) / (next - cur);
    setBar("level-fill", "level-pct", ratio, next == null ? "MAX" : Math.round(Math.max(0, Math.min(1, ratio)) * 100) + "%");
    const lbl = document.getElementById("level-label");
    if (lbl) lbl.textContent = `Lv${level}`;
    const num = document.getElementById("level-num");
    if (num) num.textContent = next == null ? `${events}` : `${events - cur}/${next - cur}`; // 本级进度
  }
  function updateLevelEffects(level) {
    document.documentElement.style.setProperty("--lv-color", LEVEL_COLORS[level] ?? "#94a3b8");
    const badge = document.getElementById("level-badge");
    if (badge) {
      badge.textContent = `Lv${level} ${LEVEL_NAMES[level] ?? ""}`;
      badge.style.display = "block";
    }
    const glow = document.getElementById("level-glow");
    if (glow) glow.classList.toggle("active", level >= 2);
    const aura = document.getElementById("level-aura");
    if (aura) aura.classList.toggle("active", level >= 3);
    document.querySelectorAll(".level-particle").forEach((p) => {
      p.classList.toggle("active", level >= 5);
    });
    const halo = document.getElementById("level-halo");
    if (halo) halo.classList.toggle("active", level >= 8);
    updateLevelBar();
  }
  init();
})();
