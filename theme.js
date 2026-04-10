/* ═══════════════════════════════════════════════
   BEM On The Rock — theme.js
   Shared dark/light mode logic for all pages
═══════════════════════════════════════════════ */

(function() {
  // Apply saved or system theme immediately to avoid flash
  const saved   = localStorage.getItem("bem_theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark  = saved ? saved === "dark" : prefersDark;
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
})();

document.addEventListener("DOMContentLoaded", () => {
  // Inject toggle into every page if not already present
  if (!document.getElementById("themeToggleWrap")) {
    const wrap = document.createElement("div");
    wrap.className = "theme-toggle-wrap";
    wrap.id = "themeToggleWrap";
    wrap.innerHTML = `
      <span class="theme-icon">☀️</span>
      <label class="theme-switch">
        <input type="checkbox" id="themeToggle"/>
        <span class="theme-slider"></span>
      </label>
      <span class="theme-icon">🌙</span>`;
    document.body.prepend(wrap);
  }

  const toggle  = document.getElementById("themeToggle");
  const isDark  = document.documentElement.getAttribute("data-theme") === "dark";
  toggle.checked = isDark;

  toggle.addEventListener("change", () => {
    const dark = toggle.checked;
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("bem_theme", dark ? "dark" : "light");
  });
});