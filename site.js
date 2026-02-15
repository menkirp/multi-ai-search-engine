// Multi AI Search Dashboard — MVP wiring
// Notes:
// - Many AI sites block iframe embedding using X-Frame-Options / CSP.
// - We still attempt embedding; if it fails or stays blank, users can click Open in New Tab.

const ENGINES = {
  chatgpt: {
    name: "ChatGPT",
    // Deep-linking with an auto-filled prompt is not reliably supported publicly.
    // We'll pass ?q= anyway; worst case it opens the homepage.
    openBase: "https://chatgpt.com/",
    queryParam: "q",
  },
  gemini: {
    name: "Gemini",
    openBase: "https://gemini.google.com/app",
    queryParam: "q",
  },
  claude: {
    name: "Claude",
    openBase: "https://claude.ai/",
    queryParam: "q",
  },
  metaai: {
    name: "Meta AI",
    openBase: "https://www.meta.ai/",
    queryParam: "q",
  }
};

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

function buildUrl(engineKey, query){
  const cfg = ENGINES[engineKey];
  const url = new URL(cfg.openBase);

  // Attach query as best-effort (some sites ignore it).
  if (query && query.trim().length){
    url.searchParams.set(cfg.queryParam || "q", query.trim());
  }
  return url.toString();
}

function setPanelLoading(panelEl, isLoading){
  const loading = panelEl.querySelector("[data-loading]");
  if (!loading) return;
  loading.style.display = isLoading ? "flex" : "none";
}

function attemptEmbed(panelEl, url){
  const iframe = panelEl.querySelector("iframe");
  const fallback = panelEl.querySelector("[data-fallback]");
  if (!iframe || !fallback) return;

  // Always show fallback message (embedding is often blocked).
  // The iframe will still load behind it; users can close fallback in future iterations.
  fallback.style.display = "flex";

  setPanelLoading(panelEl, true);

  // Reset iframe first to force a refresh
  iframe.src = "about:blank";

  // Small delay helps some browsers apply reset cleanly
  setTimeout(() => {
    iframe.src = url;
  }, 50);

  // Hide loading indicator once the iframe fires 'load' (even if blocked it may still fire)
  const onLoad = () => {
    setPanelLoading(panelEl, false);
    iframe.removeEventListener("load", onLoad);
  };
  iframe.addEventListener("load", onLoad);

  // Safety timeout: stop spinner even if load doesn't fire
  setTimeout(() => setPanelLoading(panelEl, false), 4500);
}

function runSearch(query){
  const panels = $$(".panel");
  panels.forEach(panelEl => {
    const key = panelEl.getAttribute("data-engine");
    const url = buildUrl(key, query);

    // Store latest URL for the Open buttons
    panelEl.dataset.openUrl = url;

    attemptEmbed(panelEl, url);
  });
}

function attachOpenButtons(){
  $$(".panel [data-open]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const panel = e.target.closest(".panel");
      const url = panel?.dataset?.openUrl;
      if (!url) return;
      window.open(url, "_blank", "noopener,noreferrer");
    });
  });
}

function initThemeToggle(){
  const btn = $("#toggleTheme");
  if (!btn) return;

  const label = btn.querySelector(".ghost-btn-text");
  const stored = localStorage.getItem("theme");
  if (stored === "light"){
    document.documentElement.setAttribute("data-theme", "light");
    if (label) label.textContent = "Light";
  }

  btn.addEventListener("click", () => {
    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    if (isLight){
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "dark");
      if (label) label.textContent = "Dark";
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
      if (label) label.textContent = "Light";
    }
  });
}

function init(){
  initThemeToggle();
  attachOpenButtons();

  const form = $("#searchForm");
  const input = $("#queryInput");

  // Warm start: set default open urls to base pages
  $$(".panel").forEach(panelEl => {
    const key = panelEl.getAttribute("data-engine");
    panelEl.dataset.openUrl = buildUrl(key, "");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = (input?.value || "").trim();
    if (!q.length){
      input?.focus();
      return;
    }
    runSearch(q);
  });

  // Optional: Ctrl/Cmd + Enter triggers search
  input.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter"){
      form.requestSubmit();
    }
  });
}

document.addEventListener("DOMContentLoaded", init);
