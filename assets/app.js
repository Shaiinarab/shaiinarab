/* ============================================================
   SHAHIN://HUB — the machine with a pulse
   Live GitHub directory + the human layer on top: a terminal
   that mistypes and fixes itself, handwriting, magnetism,
   toasts, a paper theme, and one easter egg.

   Self-contained: no external requests. Everything respects
   prefers-reduced-motion and works without JS (content first).
   ============================================================ */
"use strict";

(() => {
  const USER = "Shaiinarab";
  const SELF_REPO = "shaiinarab"; // this site's own repo — not listed in the directory
  const CACHE_KEY = "hub:repos:v1";
  const THEME_KEY = "hub:theme:v1";
  const EMAIL = "Shahinarab619@outlook.com";

  /* ---------- static data ---------- */

  const LANG_COLORS = {
    Rust: "#dea584", Zig: "#ec915c", Go: "#00ADD8", Python: "#3572A5",
    TypeScript: "#3178c6", JavaScript: "#f1e05a", HTML: "#e34c26",
    CSS: "#563d7c", Shell: "#89e051", C: "#555555", "C++": "#f34b7d",
    Java: "#b07219", Kotlin: "#A97BFF", Swift: "#F05138", Ruby: "#701516",
    PHP: "#4F5D95", Lua: "#000080", Dart: "#00B4AB", Nix: "#7ad3d4",
  };

  // Offline / rate-limited snapshot — regenerated from the live GitHub API by
  // `python3 scripts/refresh-snapshot.py` (uses GITHUB_PAT; CI keeps it fresh).
  const FALLBACK_REPOS = [
    { name: "simorgh", description: null, language: "TypeScript", html_url: "https://github.com/Shaiinarab/simorgh", stargazers_count: 0, forks_count: 0, archived: false },
    { name: "mch", description: null, language: null, html_url: "https://github.com/Shaiinarab/mch", stargazers_count: 0, forks_count: 0, archived: false },
    { name: "pabetoop-club", description: null, language: "Go", html_url: "https://github.com/Shaiinarab/pabetoop-club", stargazers_count: 0, forks_count: 0, archived: false },
    { name: "pabetoop-league", description: null, language: "Go", html_url: "https://github.com/Shaiinarab/pabetoop-league", stargazers_count: 0, forks_count: 0, archived: false },
    { name: "portfolio-context", description: null, language: "JavaScript", html_url: "https://github.com/Shaiinarab/portfolio-context", stargazers_count: 0, forks_count: 0, archived: false },
    { name: "repopulse", description: null, language: "TypeScript", html_url: "https://github.com/Shaiinarab/repopulse", stargazers_count: 0, forks_count: 0, archived: false },
    { name: "Simorgh-edge-gateway", description: null, language: "TypeScript", html_url: "https://github.com/Shaiinarab/Simorgh-edge-gateway", stargazers_count: 0, forks_count: 0, archived: true },
    { name: "Data_Structure_And_Intro_To_Algorithms.CLRS", description: null, language: "Python", html_url: "https://github.com/Shaiinarab/Data_Structure_And_Intro_To_Algorithms.CLRS", stargazers_count: 0, forks_count: 0, archived: false },
    { name: "Data-struct-and-Intro-to-algo-final-project", description: null, language: "Python", html_url: "https://github.com/Shaiinarab/Data-struct-and-Intro-to-algo-final-project", stargazers_count: 0, forks_count: 0, archived: false },
    { name: "mashreghi_asil", description: null, language: "TypeScript", html_url: "https://github.com/Shaiinarab/mashreghi_asil", stargazers_count: 0, forks_count: 0, archived: false },
    { name: "Log-Sentinel", description: null, language: "Python", html_url: "https://github.com/Shaiinarab/Log-Sentinel", stargazers_count: 0, forks_count: 0, archived: false },
    { name: "shiraz-bazaar-telegram-bot", description: null, language: null, html_url: "https://github.com/Shaiinarab/shiraz-bazaar-telegram-bot", stargazers_count: 0, forks_count: 0, archived: false },
    { name: "Mashreghi-asil", description: null, language: null, html_url: "https://github.com/Shaiinarab/Mashreghi-asil", stargazers_count: 0, forks_count: 0, archived: true },
    { name: "Falcons", description: null, language: null, html_url: "https://github.com/Shaiinarab/Falcons", stargazers_count: 0, forks_count: 0, archived: false },
    { name: "to-improve", description: null, language: null, html_url: "https://github.com/Shaiinarab/to-improve", stargazers_count: 0, forks_count: 0, archived: true },
  ];

  // No achievement-style labels: each project should explain its own status.
  const SEALS = {};

  const TYPED_PHRASES = [
    "learning computer science, one concept at a time.",
    "algorithms, linear algebra, and the fundamentals.",
    "interested in AI; honest about being a beginner.",
    "music first, then whatever I'm studying.",
    "learn, make notes, try again.",
  ];

  /* ---------- tiny helpers ---------- */

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = () => window.matchMedia("(pointer: coarse)").matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[c]);

  const langColor = (lang) => LANG_COLORS[lang] || "#8b949e";

  function relTime(iso) {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const units = [
      [31536000000, "year"], [2592000000, "month"], [604800000, "week"],
      [86400000, "day"], [3600000, "hour"], [60000, "minute"],
    ];
    for (const [ms, unit] of units) {
      if (Math.abs(diff) >= ms) {
        const v = Math.round(diff / ms);
        return `updated ${v} ${unit}${v !== 1 ? "s" : ""} ago`;
      }
    }
    return "updated just now";
  }

  const starIcon =
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/></svg>';
  const forkIcon =
    '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="4" cy="3" r="1.7" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="3" r="1.7" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="13" r="1.7" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M4 4.9v.6c0 2 1.7 3 4 3s4-1 4-3v-.6" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';

  /* ---------- toasts ---------- */

  const toastBox = $("#toasts");
  function toast(msg) {
    if (!toastBox) return;
    const t = el("div", "toast", msg);
    toastBox.appendChild(t);
    requestAnimationFrame(() => t.classList.add("in"));
    setTimeout(() => {
      t.classList.remove("in");
      setTimeout(() => t.remove(), 320);
    }, 2600);
  }

  /* ---------- theme: night (machine) / paper (human) ---------- */

  const root = document.documentElement;
  const themeBtn = $("#theme-toggle");

  function applyTheme(t, persist = true) {
    root.dataset.theme = t;
    if (persist) {
      try { localStorage.setItem(THEME_KEY, t); } catch { /* private mode */ }
    }
    if (themeBtn) {
      const paper = t === "paper";
      themeBtn.setAttribute("aria-pressed", String(paper));
      themeBtn.setAttribute("aria-label", paper ? "Switch to night mode" : "Switch to paper mode");
      const label = $(".tt-label", themeBtn);
      if (label) label.textContent = paper ? "paper" : "night";
      const glyph = $(".tt-glyph", themeBtn);
      if (glyph) glyph.textContent = paper ? "◐" : "◑";
    }
    paintDiagramTheme(t);
  }

  function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch { /* private mode */ }
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    applyTheme(saved || (prefersLight ? "paper" : "dark"), false);
    themeBtn?.addEventListener("click", () => {
      const next = root.dataset.theme === "paper" ? "dark" : "paper";
      applyTheme(next);
      toast(next === "paper" ? "paper mode. tell me if it's ugly." : "back to the night shift.");
    });
  }

  // the flow diagram ships with dark-theme fills; flip its palette in paper mode
  function paintDiagramTheme(t) {
    const img = $(".colophon .flow");
    if (!img) return;
    img.style.filter = t === "paper" ? "invert(.92) hue-rotate(180deg) saturate(.85)" : "";
  }

  /* ---------- state ---------- */

  const state = {
    user: null,
    repos: [],
    langs: ["All"],
    activeLang: "All",
    fromApi: false,
    cacheTime: null,
  };

  /* ---------- snapshot cache (offline fallback stays truthful) ---------- */

  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && Array.isArray(parsed.repos) && parsed.repos.length ? parsed : null;
    } catch { return null; }
  }

  function writeCache(user, repos) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), user, repos }));
    } catch { /* private mode / quota — cache is optional */ }
  }

  /* ---------- DOM ---------- */

  const grid = $("#repo-grid");
  const chipsBox = $("#lang-chips");
  const searchInput = $("#repo-search");
  const resultLine = $("#result-line");
  const apiNote = $("#api-note");
  const retryBtn = $("#retry-btn");

  /* ---------- rendering ---------- */

  function showSkeletons() {
    grid.setAttribute("aria-busy", "true");
    grid.innerHTML = Array.from({ length: 8 }, () => '<div class="skel"></div>').join("");
    resultLine.textContent = "asking github nicely…";
  }

  function repoCard(r) {
    const badges = [
      r.archived ? '<span class="badge-archived">RETIRED</span>' : "",
      r.homepage ? '<span class="badge-home">HAS LIVE DEMO</span>' : "",
    ].join(" ");
    const seal = SEALS[r.name]
      ? `<span class="seal" style="--rot:${SEALS[r.name].rot}" aria-hidden="true">${esc(SEALS[r.name].text)}</span>`
      : "";
    return `
      <article class="repo-card${r.archived ? " is-archived" : ""}">
        <a href="${esc(r.html_url)}" target="_blank" rel="noopener noreferrer"
           aria-label="${esc(r.name)} on GitHub">
          <span class="repo-arrow" aria-hidden="true">↗</span>
          <h3 class="repo-name">${esc(r.name)} ${badges}</h3>
          <p class="repo-desc"><span class="dim">Public repository. Status and completeness vary; check its own README and history.</span></p>
          <div class="repo-meta">
            ${r.language ? `<span><span class="lang-dot" style="--lc:${langColor(r.language)}"></span>${esc(r.language)}</span>` : ""}
            <span class="mi">${starIcon}${r.stargazers_count}</span>
            <span class="mi">${forkIcon}${r.forks_count}</span>
            ${r.pushed_at ? `<span>${relTime(r.pushed_at)}</span>` : ""}
          </div>
        </a>
        ${seal}
      </article>`;
  }

  function visibleRepos() {
    const q = searchInput.value.trim().toLowerCase();
    return state.repos.filter((r) => {
      if (state.activeLang !== "All" && r.language !== state.activeLang) return false;
      if (!q) return true;
      return `${r.name} ${r.description || ""}`.toLowerCase().includes(q);
    });
  }

  function renderGrid() {
    const items = visibleRepos();
    grid.setAttribute("aria-busy", "false");
    grid.innerHTML = items.length
      ? items.map(repoCard).join("")
      : `<p class="empty-state mono">⌁ nothing matches “${esc(searchInput.value)}” — try a shorter signal, or just scroll.</p>`;
    resultLine.textContent = state.fromApi
      ? `${items.length} of ${state.repos.length} repositories shown`
      : state.cacheTime
        ? `${items.length} repositories · cached snapshot from ${new Date(state.cacheTime).toLocaleString()} — live sync unavailable`
        : `${items.length} repositories · built-in snapshot — live sync unavailable`;
    registerReveals(grid);
    writeUrlState();
  }

  function renderChips() {
    const counts = new Map();
    for (const r of state.repos) if (r.language) counts.set(r.language, (counts.get(r.language) || 0) + 1);
    state.langs = ["All", ...[...counts.entries()].sort((a, b) => b[1] - a[1]).map(([l]) => l)];
    chipsBox.innerHTML = state.langs
      .map((l) => `<button type="button" class="chip" data-lang="${esc(l)}" aria-pressed="${l === state.activeLang}">${esc(l)}${l === "All" ? "" : ` · ${counts.get(l)}`}</button>`)
      .join("");
  }

  /* ---------- stats + terminal slots ---------- */

  function fillStats(user, repos) {
    const set = (name, v) => { const elx = document.querySelector(`[data-stat="${name}"]`); if (elx) elx.textContent = v; };
    const slot = (name, v) => { const elx = document.querySelector(`[data-slot="${name}"]`); if (elx) elx.textContent = v; };
    const langs = new Set(repos.map((r) => r.language).filter(Boolean)).size;

    set("repos", user ? String(user.public_repos) : "—");
    set("listed", String(repos.length));
    set("langs", String(langs));
    set("followers", user ? String(user.followers) : "—");

    slot("repo-count", String(repos.length));
    const sync = document.querySelector('[data-slot="sync-status"]');
    if (sync) {
      sync.classList.remove("dim");
      sync.textContent = state.fromApi
        ? `✓ synced in ${state.syncMs ?? "—"}ms · nothing to hide, nothing to sell`
        : state.cacheTime
          ? `⚠ cached snapshot · last live sync ${new Date(state.cacheTime).toLocaleString()}`
          : "⚠ offline snapshot · will retry next visit";
    }
  }

  /* ---------- data loading ---------- */

  async function getJson(res) {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  // Don't let a hanging connection pin the grid on skeletons forever.
  const reqSignal = () => (AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined);

  // Follow the Link header so accounts with >100 public repos stay complete.
  function nextPageUrl(linkHeader) {
    if (!linkHeader) return null;
    const m = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
    return m ? m[1] : null;
  }

  // Shared request headers. In a browser this is just the versioning Accept
  // header — never embed a PAT client-side, it would leak to every visitor.
  // On CI (Node ≥ 18) the same code path runs with GITHUB_PAT in the
  // environment, which scripts/refresh-snapshot.py uses to keep the offline
  // snapshot current at authenticated rate limits instead of 60/hr.
  const GH_VERSION = "2022-11-28";
  function ghHeaders(extra = {}) {
    // `typeof process` is only true outside the browser (Node/CI) — visitors
    // never see an Authorization header, so a PAT can't leak client-side.
    const pat = typeof process !== "undefined" && process.env?.GITHUB_PAT;
    return {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": GH_VERSION,
      ...(pat ? { Authorization: `Bearer ${pat}` } : {}),
      ...extra,
    };
  }

  async function fetchAllRepos() {
    let url = `https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`;
    const all = [];
    for (let page = 0; page < 10 && url; page++) { // cap guards against pathological loops
      const res = await fetch(url, { headers: ghHeaders(), signal: reqSignal() });
      all.push(...(await getJson(res)));
      url = nextPageUrl(res.headers.get("Link"));
    }
    return all;
  }

  async function load() {
    const t0 = performance.now();
    showSkeletons();
    apiNote.hidden = true;
    try {
      const userP = fetch(`https://api.github.com/users/${USER}`, { headers: ghHeaders(), signal: reqSignal() })
        .then(getJson)
        .catch(() => null); // profile stats are nice-to-have; never sink the grid for them
      const repos = await fetchAllRepos();
      const user = await userP;
      state.user = user;
      state.repos = repos.filter((r) => !r.fork && r.name !== SELF_REPO);
      // A language chip that no longer exists would silently empty the grid.
      if (state.activeLang !== "All" && !state.repos.some((r) => r.language === state.activeLang)) {
        state.activeLang = "All";
      }
      state.fromApi = true;
      state.syncMs = Math.round(performance.now() - t0);
      state.cacheTime = Date.now();
      writeCache(state.user, state.repos);
    } catch {
      const cache = readCache();
      state.user = cache?.user ?? null;
      state.repos = cache?.repos ?? FALLBACK_REPOS;
      state.fromApi = false;
      state.cacheTime = cache?.t ?? null;
      apiNote.hidden = false;
    }
    renderChips();
    renderGrid();
    fillStats(state.user, state.repos);
  }

  async function retry() {
    if (!retryBtn) return;
    retryBtn.disabled = true;
    retryBtn.textContent = "syncing…";
    await load();
    retryBtn.disabled = false;
    retryBtn.textContent = "Retry sync ⟳";
    toast(state.fromApi ? "synced. all good." : "still no luck — showing the snapshot.");
  }
  retryBtn?.addEventListener("click", retry);

  /* ---------- shareable filter state (?q=&lang=) ---------- */

  function readUrlState() {
    const p = new URLSearchParams(location.search);
    const q = p.get("q");
    const lang = p.get("lang");
    if (q) searchInput.value = q;
    if (lang) state.activeLang = lang;
  }

  function writeUrlState() {
    const p = new URLSearchParams(location.search);
    const q = searchInput.value.trim();
    if (q) p.set("q", q); else p.delete("q");
    if (state.activeLang && state.activeLang !== "All") p.set("lang", state.activeLang); else p.delete("lang");
    const qs = p.toString();
    history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
  }

  /* ---------- filters ---------- */

  chipsBox.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    state.activeLang = btn.dataset.lang;
    for (const c of chipsBox.querySelectorAll(".chip")) c.setAttribute("aria-pressed", String(c === btn));
    renderGrid();
  });

  let searchTimer;
  function scheduleRender() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(renderGrid, 120);
  }
  searchInput.addEventListener("input", scheduleRender);

  // HTMX 4 integration (vendored): when htmx is present, its debounced
  // `keyup changed delay:150ms -> hub:query` trigger becomes the single render
  // path — the native listener yields so filtering never runs twice. Without
  // htmx (or before it boots) behavior is identical via the native timer.
  window.hub = {
    onHtmxQuery() {
      if (window.htmx) { clearTimeout(searchTimer); renderGrid(); }
    },
  };
  document.addEventListener("htmx:load", () => {
    // grid re-reveals cleanly after any htmx-managed swap
    const g = $("#repo-grid");
    if (g) registerReveals(g);
  });

  // Press "/" anywhere to jump to search.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target;
    if (t instanceof HTMLElement && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    e.preventDefault();
    searchInput.focus();
  });

  /* ---------- hero typing line ---------- */

  function initTyping() {
    const typedEl = $("#typed");
    if (!typedEl) return;
    if (reduced()) {
      typedEl.textContent = TYPED_PHRASES[0];
      return;
    }
    let pi = 0, ci = 0, deleting = false;
    (function tick() {
      const phrase = TYPED_PHRASES[pi];
      ci += deleting ? -1 : 1;
      typedEl.textContent = phrase.slice(0, ci);
      let delay = deleting ? 26 : 52;
      if (!deleting && ci === phrase.length) { delay = 2600; deleting = true; }
      else if (deleting && ci === 0) { deleting = false; pi = (pi + 1) % TYPED_PHRASES.length; delay = 420; }
      setTimeout(tick, delay);
    })();
  }

  /* ---------- the living terminal: it mistypes, then fixes itself ---------- */

  const TERM_SCRIPT = [
    { kind: "cmd", text: "whoami" },
    { kind: "out", text: "> Shahin Arab — Computer Engineering student · Shiraz, Iran" },
    { kind: "cmd", text: "cat ~/mood.txt" },
    { kind: "out", text: "> learning steadily. usually listening to music." },
    { kind: "cmd", text: "ls ~/repos | wc -l" },
    { kind: "out", html: '> <span data-slot="repo-count">…</span> public repositories listed' },
    { kind: "cmd", text: "sync --with api.github.com", typo: "sybc --wit api.github.com" },
    { kind: "out", html: '> <span data-slot="sync-status" class="dim">connecting…</span>' },
    { kind: "aside", text: "# yes, I typo. I also fix." },
    { kind: "cmd", text: "why" },
    { kind: "out", text: "> small, verifiable steps beat impressive-sounding claims." },
  ];

  const commonPrefixLen = (a, b) => {
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    return i;
  };

  async function typeInto(node, text) {
    for (const ch of text) {
      node.textContent += ch;
      await sleep(24 + Math.random() * 46);
    }
  }

  async function backspace(node, n) {
    for (let i = 0; i < n; i++) {
      node.textContent = node.textContent.slice(0, -1);
      await sleep(28);
    }
  }

  async function runTerminal() {
    const pre = $("#term-body");
    if (!pre) return;
    pre.textContent = "";
    const rm = reduced();

    for (const step of TERM_SCRIPT) {
      if (step.kind === "cmd") {
        const line = el("span", "cmd", "shahin@hub:~$ ");
        const typed = el("span", "");
        line.appendChild(typed);
        pre.appendChild(line);
        if (rm) {
          typed.textContent = step.text;
        } else if (step.typo) {
          await typeInto(typed, step.typo);
          await sleep(360);
          const keep = commonPrefixLen(step.typo, step.text);
          await backspace(typed, step.typo.length - keep);
          await typeInto(typed, step.text.slice(keep));
          await sleep(240);
        } else {
          await typeInto(typed, step.text);
          await sleep(220);
        }
      } else {
        const line = el("span", step.kind === "aside" ? "aside" : "out");
        if (step.html) line.innerHTML = step.html;
        else line.textContent = step.text;
        pre.appendChild(line);
        if (!rm) await sleep(step.kind === "aside" ? 260 : 380);
      }
      pre.append("\n");
    }
    const cursor = el("span", "cmd blink", "▊");
    cursor.setAttribute("aria-hidden", "true");
    pre.appendChild(cursor);
    if (!rm) await sleep(9000);
    runTerminal(); // it's a screensaver; it loops
  }

  /* ---------- decode/scramble on reveal ---------- */

  const GLYPHS = "#/\\<>=+-*_.:01";

  function decode(node) {
    const text = node.dataset.text ?? node.textContent;
    node.dataset.text = text;
    if (reduced()) { node.textContent = text; return; }
    const dur = 520;
    const t0 = performance.now();
    (function frame(now) {
      const p = Math.min(1, (now - t0) / dur);
      const keep = Math.floor(p * text.length);
      let out = text.slice(0, keep);
      for (let i = keep; i < text.length; i++) {
        out += text[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      node.textContent = out;
      if (p < 1) requestAnimationFrame(frame);
      else node.textContent = text;
    })(t0);
  }

  /* ---------- reveal on scroll (staggered per group) ---------- */

  function registerReveals(rootEl = document) {
    const els = $$("[data-reveal]:not(.in)", rootEl);
    if (!els.length) return;
    if (!("IntersectionObserver" in window) || reduced()) {
      els.forEach((n) => { n.classList.add("in"); if (n.hasAttribute("data-decode")) decode(n); });
      return;
    }
    for (const n of els) {
      const group = [...(n.parentElement?.children || [n])].filter((c) => c.hasAttribute?.("data-reveal"));
      const idx = Math.max(0, group.indexOf(n));
      n.style.setProperty("--d", `${Math.min(idx, 7) * 80}ms`);
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        if (en.target.hasAttribute("data-decode")) decode(en.target);
        io.unobserve(en.target);
      });
    }, { threshold: 0.05, rootMargin: "0px 0px 8% 0px" });
    els.forEach((n) => io.observe(n));
  }

  /* ---------- nav: highlight the section being read ---------- */

  function initNavHighlight() {
    const links = $$(".nav-links a");
    const byId = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
    const sections = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean);
    if (!sections.length || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        for (const a of links) a.removeAttribute("aria-current");
        byId.get(en.target.id)?.setAttribute("aria-current", "true");
      }
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => io.observe(s));
  }

  /* ---------- signal bar (scroll progress) ---------- */

  function initSignal() {
    const bar = $(".signal");
    if (!bar) return;
    let ticking = false;
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.setProperty("--scroll", String(max > 0 ? Math.min(1, scrollY / max) : 0));
      ticking = false;
    };
    addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------- time-aware greeting ---------- */

  function initGreeting() {
    const node = $("[data-greeting]");
    if (!node) return;
    const h = new Date().getHours();
    const part = h < 5 ? "late night" : h < 11 ? "morning" : h < 17 ? "afternoon" : h < 22 ? "evening" : "late night";
    const local = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    node.innerHTML = `good ${esc(part)}. it's <span class="hl">${esc(local)}</span> where you are — `;
  }

  /* ---------- pointer joy: parallax, spotlight, magnetic, tilt ---------- */

  function initPointer() {
    if (reduced() || coarse()) return;

    const fx = $(".fx");
    const spot = $(".fx-spot");
    let raf = 0;
    addEventListener("pointermove", (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const nx = e.clientX / innerWidth - 0.5;
        const ny = e.clientY / innerHeight - 0.5;
        if (fx) fx.style.transform = `translate(${(-nx * 10).toFixed(2)}px, ${(-ny * 8).toFixed(2)}px)`;
        if (spot) {
          spot.style.setProperty("--mx", `${e.clientX}px`);
          spot.style.setProperty("--my", `${e.clientY}px`);
          spot.classList.add("on");
        }
      });
    }, { passive: true });

    // magnetic buttons
    for (const b of $$(".magnetic")) {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / r.width;
        const y = (e.clientY - r.top - r.height / 2) / r.height;
        b.style.transform = `translate(${(x * 8).toFixed(1)}px, ${(y * 6).toFixed(1)}px)`;
      });
      b.addEventListener("pointerleave", () => { b.style.transform = ""; });
    }

    // gentle tilt on the big surfaces
    for (const t of $$(".tilt")) {
      t.addEventListener("pointermove", (e) => {
        if (!t.classList.contains("in") && t.hasAttribute("data-reveal")) return;
        const r = t.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        t.style.transform = `perspective(900px) rotateX(${(-y * 3.2).toFixed(2)}deg) rotateY(${(x * 3.2).toFixed(2)}deg)`;
      });
      t.addEventListener("pointerleave", () => { t.style.transform = ""; });
    }
  }

  /* ---------- copy email ---------- */

  function initCopy() {
    for (const btn of $$("[data-copy]")) {
      btn.addEventListener("click", async (e) => {
        // keep the mailto fallback working if the clipboard API is missing
        if (!navigator.clipboard) return;
        e.preventDefault();
        try {
          await navigator.clipboard.writeText(btn.dataset.copy);
          toast("copied. no takebacks.");
        } catch {
          toast("copy failed — the address is in the link.");
        }
      });
    }
  }

  /* ---------- easter egg: type "shahin" ---------- */

  function initEgg() {
    let buf = "";
    addEventListener("keydown", (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t instanceof HTMLElement && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      buf = (buf + e.key.toLowerCase()).slice(-12);
      if (buf.endsWith("shahin")) {
        applyTheme(root.dataset.theme === "paper" ? "dark" : "paper");
        toast("hi mom. (found the easter egg)");
      }
    });

    let clicks = 0, timer = 0;
    $(".brand")?.addEventListener("click", (e) => {
      e.preventDefault();
      clicks += 1;
      clearTimeout(timer);
      timer = setTimeout(() => { clicks = 0; }, 900);
      if (clicks >= 3) {
        clicks = 0;
        applyTheme(root.dataset.theme === "paper" ? "dark" : "paper");
        toast("fine. paper mode. happy?");
      }
    });
  }

  /* ---------- online / offline life ---------- */

  function initConnection() {
    addEventListener("offline", () => toast("connection gone. the snapshot has you covered."));
    addEventListener("online", () => {
      toast("connection back. syncing.");
      load();
    });
  }

  /* ---------- boot ---------- */

  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  initTheme();
  initGreeting();
  initSignal();
  initTyping();
  registerReveals();
  initNavHighlight();
  initPointer();
  initCopy();
  initEgg();
  initConnection();

  // "press /" is a keyboard affordance — hide it on touch devices
  if (coarse()) searchInput.placeholder = "Search repositories…";

  readUrlState();
  load().then(() => {
    runTerminal();
    // notify any htmx/Alpine listeners that directory data settled (footer signal pill)
    if (window.htmx) window.htmx.trigger(document.body, "htmx:load");
    else window.dispatchEvent(new CustomEvent("htmx:load"));
  });
})();
