// Use the native Zensical search and drawer state, with keyboard-accessible
// header controls. No reading progress or personal data is stored.
(() => {
  const drawer = document.getElementById("__drawer");
  const toggle = document.querySelector("[data-learning-drawer]");
  const navigation = document.querySelector(".md-nav--primary");
  const search = document.querySelector("[data-learning-search]");
  if (!drawer || !toggle || !navigation) return;
  navigation.id = "lesson-navigation";
  navigation
    .querySelector("a.md-nav__link--active")
    ?.setAttribute("aria-current", "page");
  const reflect = () => {
    toggle.setAttribute("aria-expanded", String(drawer.checked));
    toggle.setAttribute(
      "aria-label",
      drawer.checked ? "Close lesson navigation" : "Open lesson navigation",
    );
  };
  drawer.addEventListener("change", reflect);
  toggle.addEventListener("click", () => {
    drawer.checked = !drawer.checked;
    drawer.dispatchEvent(new Event("change", { bubbles: true }));
    if (drawer.checked) navigation.querySelector(".md-nav__list a")?.focus();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && drawer.checked) {
      drawer.checked = false;
      drawer.dispatchEvent(new Event("change", { bubbles: true }));
      toggle.focus();
    }
  });
  search?.addEventListener("click", () =>
    document.querySelector(".md-search__button")?.click(),
  );
  matchMedia("(min-width: 76.25em)").addEventListener("change", (event) => {
    if (event.matches) {
      drawer.checked = false;
      drawer.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
  reflect();
})();
