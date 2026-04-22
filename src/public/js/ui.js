document.addEventListener("DOMContentLoaded", () => {
  const authState = window.__APPCENAR_AUTH__;
  if (authState && authState.token && authState.user) {
    localStorage.setItem("token", authState.token);
    localStorage.setItem("user", JSON.stringify(authState.user));
  } else {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  const path = window.location.pathname;
  const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    const exactMatch = href === "/" ? path === "/" : path === href;
    const sectionMatch = href !== "/" && href !== "/admin" && path.startsWith(href);
    const adminMatch = href === "/admin" && (path === "/admin" || path.startsWith("/admin/"));

    if (exactMatch || sectionMatch || adminMatch) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
  });
});
