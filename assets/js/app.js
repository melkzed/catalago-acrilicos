import { runInitialAnimations } from "./animations.js";
import { initCart } from "./cart.js";
import { initCatalogPage, initHomeCategories } from "./catalog.js";

document.addEventListener("DOMContentLoaded", () => {
  initCart();
  initHomeCategories();
  initCatalogPage();
  runInitialAnimations();
});
