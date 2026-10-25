(function () {
  var themeToggle = document.getElementById("themeToggle");
  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

  function getStoredTheme() {
    return localStorage.getItem("ez-uiu-theme");
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ez-uiu-theme", theme);
  }

  function initTheme() {
    var urlParams = new URLSearchParams(window.location.search);
    var urlTheme = urlParams.get("theme");
    var storedTheme = urlTheme || getStoredTheme();
    setTheme(storedTheme || "light");
  }

  function updateToggleIcon(theme) {
    if (!themeToggle) return;
    var icon = themeToggle.querySelector("i");
    if (icon) icon.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon";
  }

  function setThemeAndIcon(theme) {
    setTheme(theme);
    updateToggleIcon(theme);
  }

  function toggleTheme() {
    var currentTheme = document.documentElement.getAttribute("data-theme");
    var newTheme = currentTheme === "dark" ? "light" : "dark";
    setThemeAndIcon(newTheme);
  }

  if (themeToggle) themeToggle.addEventListener("click", toggleTheme);
  initTheme();
  updateToggleIcon(document.documentElement.getAttribute("data-theme"));
})();
