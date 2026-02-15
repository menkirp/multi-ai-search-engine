// Multi AI Search Dashboard — Mode A (No Embeds)
// Reliable workaround: don't iframe. Instead, generate best-effort deep links + copy prompt.

const ENGINES = {
  chatgpt: {
    name: "ChatGPT",
    // Note: pre-filling prompts via URL is not guaranteed; this is best-effort.
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

  if (query && query.trim().length){
    url.searchParams.set(cfg.queryParam || "q", query.trim());
  }
  return url.toString();
}

function showToast(msg){
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => t.classList.remove("show"), 1400);
}

function setStatus(panelEl, mode, text){
  const dot = panelEl.querySelector(".status-dot");
  const label = panelEl.querySelector(".status-text");
  if (!dot || !label) return;

  dot.classList.remove("ready","waiting","copied");
  dot.classList.add(mode);
  label.textContent = text;
}

function updatePanels(query){
  const panels = $$(".panel");

  panels.forEach(panelEl => {
    const key = panelEl.getAttribute("data-engine");
    const url = buildUrl(key, query);

    panelEl.dataset.openUrl = url;
    panelEl.dataset.prompt = query;

    const promptEl = panelEl.querySelector("[data-prompt]");
    const linkEl = panelEl.querySelector("[data-link]");
    if (promptEl) promptEl.textContent = query;
    if (linkEl){
      linkEl.href = url;
      linkEl.textContent = "Preview link";
    }

    setStatus(panelEl, "waiting", "Link ready");
  });

  // After a short moment, return to Ready state
  setTimeout(() => {
    panels.forEach(p => setStatus(p, "ready", "Ready"));
  }, 700);
}

async function copyText(text){
  // Modern clipboard API
  try{
    await navigator.clipboard.writeText(text);
    return true;
  }catch(e){
    // Fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }
}

function attachPanelButtons(){
  $$(".panel").forEach(panelEl => {
    const openBtns = $$("[data-open]", panelEl);
    const copyBtns = $$("[data-copy]", panelEl);

    openBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const url = panelEl.dataset.openUrl || buildUrl(panelEl.dataset.engine, "");
        window.open(url, "_blank", "noopener,noreferrer");
      });
    });

    copyBtns.forEach(btn => {
      btn.addEventListener("click", async () => {
        const prompt = panelEl.dataset.prompt || "";
        if (!prompt.trim()){
          showToast("Type a query first, then Search.");
          return;
        }
        const ok = await copyText(prompt);
        setStatus(panelEl, "copied", ok ? "Copied prompt" : "Copy failed");
        showToast(ok ? "Prompt copied ✅" : "Could not copy (browser blocked).");
        setTimeout(() => setStatus(panelEl, "ready", "Ready"), 900);
      });
    });
  });
}

function openAll(){
  const panels = $$(".panel");
  let opened = 0;
  panels.forEach(panelEl => {
    const url = panelEl.dataset.openUrl;
    if (url){
      const w = window.open(url, "_blank", "noopener,noreferrer");
      if (w) opened += 1;
    }
  });
  if (opened === 0){
    showToast("Pop-up blocked. Allow pop-ups, then try Open all.");
  } else {
    showToast(`Opened ${opened} tab${opened === 1 ? "" : "s"} ↗`);
  }
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
  attachPanelButtons();

  // Warm start: default URLs (no query)
  $$(".panel").forEach(panelEl => {
    const key = panelEl.getAttribute("data-engine");
    panelEl.dataset.openUrl = buildUrl(key, "");
    panelEl.dataset.prompt = "";
  });

  const form = $("#searchForm");
  const input = $("#queryInput");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = (input?.value || "").trim();
    if (!q.length){
      input?.focus();
      showToast("Type a query first.");
      return;
    }
    updatePanels(q);
  });

  $("#openAll")?.addEventListener("click", openAll);
}

document.addEventListener("DOMContentLoaded", init);
