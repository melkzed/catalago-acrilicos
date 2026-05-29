export function initNavigation() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-mobile-menu]");
  if (!toggle || !menu) return;

  const setOpen = (open) => {
    toggle.classList.toggle("open", open);
    menu.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    menu.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("menu-open", open);
  };

  toggle.addEventListener("click", () => {
    setOpen(!menu.classList.contains("open"));
  });

  menu.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });

  window.addEventListener("resize", () => {
    if (window.matchMedia("(min-width: 861px)").matches) setOpen(false);
  });
}
