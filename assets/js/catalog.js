import { CATEGORY_META, TAG_STYLES, WHATSAPP, productGroups } from "./data/products.js";
import { animateCards, animateModalClose, animateModalOpen } from "./animations.js";
import { addToCart } from "./cart.js";
import { escapeHtml, normalizeText, openWhatsApp, showToast } from "./ui.js";

let currentGroup = null;
let selectedVariantIndex = 0;
let activeFilters = { cat: "", type: "", origin: "" };

function getProductImage(group) {
  if (!group.image) return "";
  return new URL(`../img/products/${group.image}`, import.meta.url).href;
}

function getTagStyle(type) {
  return TAG_STYLES[type] || TAG_STYLES.Acessório;
}

function getCategoryMeta(category) {
  return CATEGORY_META[category] || { icon: "▣", description: "" };
}

function getVariantCount() {
  return productGroups.reduce((sum, group) => sum + group.variants.length, 0);
}

function buildStyleAttribute(style) {
  return `background:${style.bg};color:${style.color}`;
}

export function initHomeCategories() {
  const grid = document.querySelector("[data-home-categories]");
  if (!grid) return;

  grid.innerHTML = productGroups
    .map((group) => {
      const style = getTagStyle(group.tipo);
      const meta = getCategoryMeta(group.cat);
      const href = `./pages/produtos.html?categoria=${encodeURIComponent(group.cat)}`;
      const image = getProductImage(group);

      return `
        <a class="category-card" href="${href}">
          <span class="category-media">
            <img src="${image}" alt="${escapeHtml(group.cat)}" loading="lazy">
            <span class="category-icon" style="${buildStyleAttribute(style)}">${escapeHtml(meta.icon)}</span>
          </span>
          <h3>${escapeHtml(group.cat)}</h3>
          <p class="mt-2 text-sm leading-6">${escapeHtml(meta.description)}</p>
          <span class="category-count">${group.variants.length} variação${group.variants.length !== 1 ? "ões" : ""}</span>
        </a>
      `;
    })
    .join("");

  animateCards("[data-home-categories] .category-card");
}

function readFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get("categoria");

  if (category && productGroups.some((group) => group.cat === category)) {
    activeFilters.cat = category;
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function getFilterOptions() {
  return {
    cats: unique(productGroups.map((group) => group.cat)),
    types: unique(productGroups.map((group) => group.tipo)),
    origins: unique(productGroups.flatMap((group) => group.variants.map((variant) => variant.origem))),
  };
}

function buildFilterButton({ label, value, key, active, count }) {
  const countMarkup = Number.isFinite(count) ? `<span class="filter-count">${count}</span>` : "";
  return `
    <button class="filter-btn ${active ? "active" : ""}" type="button" data-filter-key="${key}" data-filter-value="${escapeHtml(value)}">
      <span>${escapeHtml(label)}</span>
      ${countMarkup}
    </button>
  `;
}

function buildSidebarFilters() {
  const { cats, types, origins } = getFilterOptions();
  const catFilters = document.getElementById("catFilters");
  const typeFilters = document.getElementById("typeFilters");
  const originFilters = document.getElementById("originFilters");

  if (!catFilters || !typeFilters || !originFilters) return;

  catFilters.innerHTML =
    buildFilterButton({
      label: "Todas",
      value: "",
      key: "cat",
      active: !activeFilters.cat,
      count: productGroups.length,
    }) +
    cats
      .map((cat) =>
        buildFilterButton({
          label: cat,
          value: cat,
          key: "cat",
          active: activeFilters.cat === cat,
          count: productGroups.filter((group) => group.cat === cat).length,
        }),
      )
      .join("");

  typeFilters.innerHTML =
    buildFilterButton({ label: "Todos", value: "", key: "type", active: !activeFilters.type }) +
    types
      .map((type) =>
        buildFilterButton({
          label: type,
          value: type,
          key: "type",
          active: activeFilters.type === type,
        }),
      )
      .join("");

  originFilters.innerHTML =
    buildFilterButton({ label: "Todas", value: "", key: "origin", active: !activeFilters.origin }) +
    origins
      .map((origin) =>
        buildFilterButton({
          label: origin,
          value: origin,
          key: "origin",
          active: activeFilters.origin === origin,
        }),
      )
      .join("");
}

function setFilter(key, value) {
  activeFilters[key] = value;
  buildSidebarFilters();
  applyFilters();
}

function matchesSearch(group, search) {
  if (!search) return true;

  const searchable = [
    group.nome,
    group.cat,
    group.tipo,
    group.cor,
    group.desc,
    ...group.variants.flatMap((variant) => [variant.label, variant.medida, variant.esp, variant.origem, variant.cor, variant.subtype]),
  ].join(" ");

  return normalizeText(searchable).includes(search);
}

function getFilteredProducts() {
  const search = normalizeText(document.getElementById("searchInput")?.value);

  return productGroups.filter((group) => {
    const matchCat = !activeFilters.cat || group.cat === activeFilters.cat;
    const matchType = !activeFilters.type || group.tipo === activeFilters.type;
    const matchOrigin = !activeFilters.origin || group.variants.some((variant) => variant.origem === activeFilters.origin);

    return matchesSearch(group, search) && matchCat && matchType && matchOrigin;
  });
}

function renderActiveFilters() {
  const container = document.getElementById("activeFilters");
  if (!container) return;

  const tags = [
    { key: "cat", label: activeFilters.cat },
    { key: "type", label: activeFilters.type },
    { key: "origin", label: activeFilters.origin },
  ].filter((tag) => tag.label);

  container.innerHTML = tags
    .map(
      (tag) => `
        <span class="filter-tag">
          ${escapeHtml(tag.label)}
          <button type="button" data-clear-filter="${tag.key}" aria-label="Remover filtro ${escapeHtml(tag.label)}">×</button>
        </span>
      `,
    )
    .join("");
}

function renderProductCard(group) {
  const style = getTagStyle(group.tipo);
  const firstVariant = group.variants[0];
  const lastVariant = group.variants[group.variants.length - 1];
  const hasVariants = group.variants.length > 1;
  const image = getProductImage(group);

  return `
    <article class="product-card" data-open-product="${escapeHtml(group.id)}">
      <div class="product-top">
        <img class="product-image" src="${image}" alt="${escapeHtml(group.nome)}" loading="lazy">
        <span class="product-chip" style="${buildStyleAttribute(style)}">${escapeHtml(group.tipo)}</span>
        ${hasVariants ? `<span class="variant-count">${group.variants.length} variações</span>` : ""}
      </div>
      <div class="product-body">
        <h3>${escapeHtml(group.nome)}</h3>
        <div class="mt-3 flex flex-wrap gap-2">
          ${firstVariant.medida !== "—" ? `<span class="spec-chip">A partir de ${escapeHtml(firstVariant.medida)}</span>` : ""}
          ${firstVariant.esp !== "—" ? `<span class="spec-chip">${escapeHtml(firstVariant.esp)} até ${escapeHtml(lastVariant.esp)}</span>` : ""}
        </div>
        <p class="mt-3 text-sm leading-6">${escapeHtml(group.desc)}</p>
        <div class="product-actions">
          <button class="button-detail" type="button" data-open-product="${escapeHtml(group.id)}">Ver variações</button>
          <button class="button-icon" type="button" data-quick-quote="${escapeHtml(group.id)}" aria-label="Pedir ${escapeHtml(group.nome)} no WhatsApp">WA</button>
        </div>
      </div>
    </article>
  `;
}

function applyFilters() {
  const filtered = getFilteredProducts();
  const grid = document.getElementById("prodGrid");
  const count = document.getElementById("prodCount");

  if (!grid || !count) return;

  count.textContent = `${filtered.length} produto${filtered.length !== 1 ? "s" : ""} encontrado${filtered.length !== 1 ? "s" : ""} · ${getVariantCount()} variações no catálogo`;
  renderActiveFilters();

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="no-products">
        <strong class="font-display text-lg text-neutral-900">Nenhum produto encontrado</strong>
        <p class="mt-2">Tente remover filtros ou buscar por outro termo.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(renderProductCard).join("");
  animateCards("#prodGrid .product-card");
}

function injectProductModal() {
  if (document.querySelector("[data-product-modal]")) return;

  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <div class="modal-overlay" data-product-modal hidden>
          <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
            <div class="modal-visual">
            <img data-modal-image alt="">
            <button class="modal-close" type="button" data-close-modal aria-label="Fechar detalhes">×</button>
            <span data-modal-icon aria-hidden="true"></span>
          </div>
          <div class="modal-body">
            <div class="flex flex-wrap gap-2" data-modal-tags></div>
            <h2 class="mt-4 font-display text-2xl font-bold" id="modalTitle" data-modal-title></h2>
            <p class="mt-1 text-sm text-neutral-500" data-modal-subtitle></p>

            <div class="mt-6" data-variant-section hidden>
              <span class="mb-3 block text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Selecione a variação</span>
              <div class="variant-grid" data-variant-grid></div>
            </div>

            <div class="modal-spec-grid mt-6" data-modal-specs></div>

            <div class="mt-6 flex flex-wrap items-center gap-4">
              <span class="text-sm font-bold text-neutral-700">Quantidade</span>
              <div class="qty-control">
                <button type="button" data-modal-qty-change="-1">−</button>
                <input type="number" min="1" value="1" data-modal-qty>
                <button type="button" data-modal-qty-change="1">+</button>
              </div>
            </div>

            <label class="mt-5 block text-xs font-bold uppercase tracking-[0.12em] text-neutral-500" for="modalObs">Observação (opcional)</label>
            <textarea class="obs-input mt-2" id="modalObs" data-modal-obs placeholder="Alguma informação adicional?"></textarea>

            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <button class="button-dark" type="button" data-modal-add>Adicionar ao orçamento</button>
              <button class="button button-whatsapp" type="button" data-modal-whatsapp>Pedir no WhatsApp</button>
            </div>
          </div>
        </div>
      </div>
    `,
  );
}

function renderVariantButtons() {
  const section = document.querySelector("[data-variant-section]");
  const grid = document.querySelector("[data-variant-grid]");
  if (!section || !grid || !currentGroup) return;

  if (currentGroup.variants.length <= 1) {
    section.hidden = true;
    grid.innerHTML = "";
    return;
  }

  section.hidden = false;
  grid.innerHTML = currentGroup.variants
    .map(
      (variant, index) => `
        <button class="variant-btn ${index === selectedVariantIndex ? "selected" : ""}" type="button" data-select-variant="${index}">
          <strong>${escapeHtml(variant.label)}</strong>
          ${variant.medida !== "—" ? `<span>${escapeHtml(variant.medida)}</span>` : ""}
        </button>
      `,
    )
    .join("");
}

function renderModalSpecs() {
  const specsContainer = document.querySelector("[data-modal-specs]");
  if (!specsContainer || !currentGroup) return;

  const variant = currentGroup.variants[selectedVariantIndex];
  const color = variant.cor || currentGroup.cor;
  const specs = [
    { label: "Medida", value: variant.medida },
    { label: "Espessura", value: variant.esp },
    { label: "Cor / acabamento", value: color !== "—" ? color : null },
    { label: "Origem", value: variant.origem || "Nacional / Virgem" },
    { label: "Tipo", value: variant.subtype || currentGroup.tipo },
    { label: "Observação", value: variant.obs },
  ].filter((spec) => spec.value && spec.value !== "—");

  specsContainer.innerHTML = specs
    .map(
      (spec) => `
        <div class="modal-spec">
          <span>${escapeHtml(spec.label)}</span>
          <strong>${escapeHtml(spec.value)}</strong>
        </div>
      `,
    )
    .join("");
}

function getSelectedProductInfo() {
  const variant = currentGroup.variants[selectedVariantIndex];
  return {
    nome: variant.subtype ? `${currentGroup.nome} - ${variant.subtype}` : `${currentGroup.nome} - ${variant.label}`,
    cat: currentGroup.cat,
    medida: variant.medida,
    esp: variant.esp,
    cor: variant.cor || currentGroup.cor,
    origem: variant.origem || "",
    obs: variant.obs || "",
  };
}

function openProductModal(groupId) {
  const group = productGroups.find((item) => item.id === groupId);
  if (!group) return;

  injectProductModal();

  currentGroup = group;
  selectedVariantIndex = 0;

  const style = getTagStyle(group.tipo);
  const meta = getCategoryMeta(group.cat);
  const image = getProductImage(group);
  const overlay = document.querySelector("[data-product-modal]");
  const panel = document.querySelector("[data-product-modal] .modal-panel");

  document.querySelector("[data-modal-icon]").textContent = meta.icon;
  document.querySelector("[data-modal-image]").src = image;
  document.querySelector("[data-modal-image]").alt = group.nome;
  document.querySelector("[data-modal-title]").textContent = group.nome;
  document.querySelector("[data-modal-subtitle]").textContent = group.cat;
  document.querySelector("[data-modal-qty]").value = 1;
  document.querySelector("[data-modal-obs]").value = "";
  document.querySelector("[data-modal-tags]").innerHTML = `<span class="modal-chip" style="${buildStyleAttribute(style)}">${escapeHtml(group.tipo)}</span>`;

  renderVariantButtons();
  renderModalSpecs();

  overlay.hidden = false;
  requestAnimationFrame(() => {
    overlay.classList.add("open");
    animateModalOpen(panel);
  });
  document.body.style.overflow = "hidden";
}

export function closeProductModal() {
  const overlay = document.querySelector("[data-product-modal]");
  const panel = document.querySelector("[data-product-modal] .modal-panel");
  if (!overlay || overlay.hidden) return;

  const complete = () => {
    overlay.classList.remove("open");
    overlay.hidden = true;
    document.body.style.overflow = "";
    currentGroup = null;
  };

  animateModalClose(panel, complete);
}

function addSelectedToCart() {
  if (!currentGroup) return;

  const qty = Number.parseInt(document.querySelector("[data-modal-qty]").value, 10) || 1;
  const userObs = document.querySelector("[data-modal-obs]").value.trim();
  addToCart({ ...getSelectedProductInfo(), qty, userObs });
  closeProductModal();
}

function sendSelectedToWhatsApp() {
  if (!currentGroup) return;

  const qty = Number.parseInt(document.querySelector("[data-modal-qty]").value, 10) || 1;
  const userObs = document.querySelector("[data-modal-obs]").value.trim();
  const info = getSelectedProductInfo();
  const message = `Olá! Gostaria de solicitar um orçamento:\n\nNome: ${info.nome}\nCategoria: ${info.cat}\nMedida: ${info.medida}\nEspessura: ${info.esp}\nAcabamento/Cor: ${info.cor}\nOrigem: ${info.origem || "Nacional"}\nQuantidade: ${qty}${userObs ? `\nObservação: ${userObs}` : ""}\n\nAguardo o retorno com valores e disponibilidade.`;

  openWhatsApp(WHATSAPP, message);
}

function sendQuickQuote(groupId) {
  const group = productGroups.find((item) => item.id === groupId);
  if (!group) return;

  const message = `Olá! Tenho interesse na categoria "${group.cat}" - ${group.nome}.\nPoderia me informar preços e disponibilidade?\n\nAguardo o retorno.`;
  openWhatsApp(WHATSAPP, message);
}

function bindCatalogEvents() {
  document.getElementById("searchInput")?.addEventListener("input", applyFilters);

  document.querySelectorAll("#catFilters, #typeFilters, #originFilters").forEach((container) => {
    container.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter-key]");
      if (!button) return;
      setFilter(button.dataset.filterKey, button.dataset.filterValue);
    });
  });

  document.getElementById("activeFilters")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-clear-filter]");
    if (button) setFilter(button.dataset.clearFilter, "");
  });

  document.getElementById("prodGrid")?.addEventListener("click", (event) => {
    const quickButton = event.target.closest("[data-quick-quote]");
    const openButton = event.target.closest("[data-open-product]");

    if (quickButton) {
      event.stopPropagation();
      sendQuickQuote(quickButton.dataset.quickQuote);
      return;
    }

    if (openButton) openProductModal(openButton.dataset.openProduct);
  });

  document.addEventListener("click", (event) => {
    if (event.target.matches("[data-product-modal]")) closeProductModal();
    if (event.target.closest("[data-close-modal]")) closeProductModal();

    const variantButton = event.target.closest("[data-select-variant]");
    if (variantButton) {
      selectedVariantIndex = Number(variantButton.dataset.selectVariant);
      renderVariantButtons();
      renderModalSpecs();
    }

    const qtyButton = event.target.closest("[data-modal-qty-change]");
    if (qtyButton) {
      const input = document.querySelector("[data-modal-qty]");
      input.value = Math.max(1, Number.parseInt(input.value || "1", 10) + Number(qtyButton.dataset.modalQtyChange));
    }

    if (event.target.closest("[data-modal-add]")) addSelectedToCart();
    if (event.target.closest("[data-modal-whatsapp]")) sendSelectedToWhatsApp();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeProductModal();
  });
}

export function initCatalogPage() {
  if (!document.getElementById("prodGrid")) return;

  readFiltersFromUrl();
  injectProductModal();
  buildSidebarFilters();
  bindCatalogEvents();
  applyFilters();

  if (activeFilters.cat) {
    showToast(`Filtro aplicado: ${activeFilters.cat}`);
  }
}
