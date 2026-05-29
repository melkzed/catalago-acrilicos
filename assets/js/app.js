import { runInitialAnimations } from "./animations.js";
import { initCart } from "./cart.js";
import { initCatalogPage, initHomeCategories } from "./catalog.js";
import { initNavigation } from "./navigation.js";

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initCart();
  initHomeCategories();
  initCatalogPage();
  runInitialAnimations();
});
