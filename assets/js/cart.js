import { CATEGORY_META, WHATSAPP, productGroups } from "./data/products.js";
import { escapeHtml, openWhatsApp, showToast } from "./ui.js";

const STORAGE_KEY = "recife-acrilicos-cart";
let cart = [];

function loadCart() {
  try {
    cart = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    cart = [];
  }
}

function saveCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

function ensureCartMarkup() {
  if (document.querySelector("[data-cart-drawer]")) return;

  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <div class="cart-overlay" data-cart-overlay></div>
      <aside class="cart-drawer" data-cart-drawer aria-hidden="true" aria-label="Orçamento">
        <div class="cart-header">
          <h2 class="font-display text-xl font-bold">Orçamento</h2>
          <button class="cart-close" type="button" data-cart-close aria-label="Fechar orçamento">×</button>
        </div>
        <div class="cart-items" data-cart-items></div>
        <div class="cart-footer">
          <textarea class="cart-obs-global" data-cart-global-note placeholder="Observação geral (opcional)..."></textarea>
          <button class="button button-whatsapp w-full" type="button" data-cart-send>Enviar orçamento pelo WhatsApp</button>
          <button class="cart-clear" type="button" data-cart-clear>Limpar orçamento</button>
        </div>
      </aside>
    `,
  );
}

function getProductIcon(category) {
  const group = productGroups.find((item) => item.cat === category);
  return CATEGORY_META[group?.cat]?.icon || "▣";
}

function getItemSpecs(item) {
  return [item.medida !== "—" ? item.medida : "", item.esp !== "—" ? item.esp : "", item.cor !== "—" ? item.cor : ""]
    .filter(Boolean)
    .join(" · ");
}

export function addToCart(item) {
  cart.push({ ...item, cartId: crypto.randomUUID?.() || String(Date.now() + Math.random()) });
  saveCart();
  updateCartCount();
  renderCartItems();
  showToast("Produto adicionado ao orçamento.");
}

export function updateCartCount() {
  const total = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  document.querySelectorAll("[data-cart-count]").forEach((counter) => {
    counter.textContent = total;
    counter.classList.toggle("show", total > 0);
  });
}

function openCart() {
  document.querySelector("[data-cart-drawer]")?.classList.add("open");
  document.querySelector("[data-cart-drawer]")?.setAttribute("aria-hidden", "false");
  document.querySelector("[data-cart-overlay]")?.classList.add("open");
}

function closeCart() {
  document.querySelector("[data-cart-drawer]")?.classList.remove("open");
  document.querySelector("[data-cart-drawer]")?.setAttribute("aria-hidden", "true");
  document.querySelector("[data-cart-overlay]")?.classList.remove("open");
}

function toggleCart() {
  if (document.querySelector("[data-cart-drawer]")?.classList.contains("open")) {
    closeCart();
    return;
  }

  openCart();
}

function updateQty(cartId, delta) {
  const item = cart.find((cartItem) => cartItem.cartId === cartId);
  if (!item) return;

  item.qty = Math.max(1, Number(item.qty || 1) + delta);
  saveCart();
  updateCartCount();
  renderCartItems();
}

function setQty(cartId, value) {
  const item = cart.find((cartItem) => cartItem.cartId === cartId);
  if (!item) return;

  item.qty = Math.max(1, Number.parseInt(value, 10) || 1);
  saveCart();
  updateCartCount();
  renderCartItems();
}

function removeFromCart(cartId) {
  cart = cart.filter((item) => item.cartId !== cartId);
  saveCart();
  updateCartCount();
  renderCartItems();
}

function clearCart() {
  if (!cart.length) return;
  if (!confirm("Limpar todos os itens do orçamento?")) return;

  cart = [];
  saveCart();
  updateCartCount();
  renderCartItems();
}

function sendCartWa() {
  if (!cart.length) {
    showToast("Adicione produtos ao orçamento antes de enviar.");
    return;
  }

  const globalNote = document.querySelector("[data-cart-global-note]")?.value.trim();
  let message = "Olá! Gostaria de solicitar um orçamento dos seguintes produtos:\n\n";

  cart.forEach((item, index) => {
    message += `Produto ${index + 1}:\n`;
    message += `Nome: ${item.nome}\n`;
    message += `Categoria: ${item.cat}\n`;
    message += `Medida: ${item.medida}\n`;
    message += `Espessura: ${item.esp}\n`;
    message += `Acabamento/Cor: ${item.cor}\n`;
    if (item.origem) message += `Origem: ${item.origem}\n`;
    message += `Quantidade: ${item.qty}\n`;
    if (item.userObs) message += `Observação: ${item.userObs}\n`;
    message += "\n";
  });

  if (globalNote) message += `Observação geral: ${globalNote}\n\n`;
  message += "Aguardo o retorno com valores e disponibilidade.";

  openWhatsApp(WHATSAPP, message);
}

export function renderCartItems() {
  const container = document.querySelector("[data-cart-items]");
  if (!container) return;

  if (!cart.length) {
    container.innerHTML = `
      <div class="cart-empty">
        <strong class="font-display text-lg text-neutral-900">Orçamento vazio</strong>
        <p class="mt-2">Adicione produtos do catálogo para montar sua solicitação.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = cart
    .map((item) => {
      const specs = getItemSpecs(item);
      return `
        <article class="cart-item">
          <div class="cart-item-icon">${escapeHtml(getProductIcon(item.cat))}</div>
          <div>
            <h3 class="cart-item-name">${escapeHtml(item.nome)}</h3>
            ${specs ? `<p class="cart-item-specs">${escapeHtml(specs)}</p>` : ""}
            ${item.userObs ? `<p class="cart-item-obs">"${escapeHtml(item.userObs)}"</p>` : ""}
            <div class="cart-item-actions">
              <div class="cart-qty">
                <button type="button" data-cart-qty="${escapeHtml(item.cartId)}" data-delta="-1">−</button>
                <input type="number" min="1" value="${Number(item.qty) || 1}" data-cart-set-qty="${escapeHtml(item.cartId)}">
                <button type="button" data-cart-qty="${escapeHtml(item.cartId)}" data-delta="1">+</button>
              </div>
              <button class="cart-remove" type="button" data-cart-remove="${escapeHtml(item.cartId)}">Remover</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function bindCartEvents() {
  document.querySelectorAll("[data-cart-toggle]").forEach((button) => {
    button.addEventListener("click", toggleCart);
  });

  document.querySelector("[data-cart-overlay]")?.addEventListener("click", closeCart);
  document.querySelector("[data-cart-close]")?.addEventListener("click", closeCart);
  document.querySelector("[data-cart-send]")?.addEventListener("click", sendCartWa);
  document.querySelector("[data-cart-clear]")?.addEventListener("click", clearCart);

  document.querySelector("[data-cart-items]")?.addEventListener("click", (event) => {
    const qtyButton = event.target.closest("[data-cart-qty]");
    const removeButton = event.target.closest("[data-cart-remove]");

    if (qtyButton) {
      updateQty(qtyButton.dataset.cartQty, Number(qtyButton.dataset.delta));
      return;
    }

    if (removeButton) {
      removeFromCart(removeButton.dataset.cartRemove);
    }
  });

  document.querySelector("[data-cart-items]")?.addEventListener("change", (event) => {
    const input = event.target.closest("[data-cart-set-qty]");
    if (input) setQty(input.dataset.cartSetQty, input.value);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeCart();
  });
}

export function initCart() {
  ensureCartMarkup();
  loadCart();
  bindCartEvents();
  updateCartCount();
  renderCartItems();
}
