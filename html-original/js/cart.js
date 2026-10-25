/* ==========================================================================
   cart.js — Página "Mi carrito de compras".
   Reglas de negocio: cantidad mínima 1, tope al stock disponible, cupón de
   descuento de por vida 20% para correos @duoc.cl (regla del enunciado).
   ========================================================================== */

document.addEventListener("DOMContentLoaded", renderCartPage);

function renderCartPage() {
  const layout = document.querySelector("[data-cart-layout]");
  if (!layout) return;

  const itemsContainer = document.querySelector("[data-cart-items]");
  const emptyState = document.querySelector("[data-cart-empty]");
  const subtotalEl = document.querySelector("[data-cart-subtotal]");
  const discountRow = document.querySelector("[data-cart-discount-row]");
  const discountEl = document.querySelector("[data-cart-discount]");
  const totalEl = document.querySelector("[data-cart-total]");
  const couponForm = document.querySelector("[data-coupon-form]");
  const couponMsg = document.querySelector("[data-coupon-msg]");

  let appliedDiscount = getSession()?.correo?.endsWith("@duoc.cl") ? 0.2 : 0;

  function draw() {
    const cart = getCart();
    if (!cart.length) {
      layout.style.display = "none";
      emptyState.style.display = "block";
      return;
    }
    layout.style.display = "grid";
    emptyState.style.display = "none";

    let subtotal = 0;
    itemsContainer.innerHTML = cart
      .map((item) => {
        const product = PRODUCTS.find((p) => p.codigo === item.codigo);
        if (!product) return "";
        const lineTotal = product.precio * item.cantidad;
        subtotal += lineTotal;
        return `
          <div class="cart-item" data-cart-line="${item.codigo}">
            <img src="${product.imagen}" alt="${product.nombre}">
            <div>
              <p class="cart-item-name">${product.nombre}</p>
              <p class="cart-item-price">${formatCLP(product.precio)} c/u</p>
            </div>
            <div class="qty-stepper">
              <button type="button" data-cart-minus>−</button>
              <input type="number" value="${item.cantidad}" min="1" data-cart-qty readonly>
              <button type="button" data-cart-plus>+</button>
            </div>
            <div>
              <p class="cell-strong">${formatCLP(lineTotal)}</p>
              <button class="cart-item-remove" data-cart-remove>Eliminar</button>
            </div>
          </div>`;
      })
      .join("");

    subtotalEl.textContent = formatCLP(subtotal);
    if (appliedDiscount > 0) {
      discountRow.style.display = "flex";
      discountEl.textContent = "− " + formatCLP(subtotal * appliedDiscount);
    } else {
      discountRow.style.display = "none";
    }
    totalEl.textContent = formatCLP(subtotal * (1 - appliedDiscount));

    bindLineEvents();
  }

  function bindLineEvents() {
    itemsContainer.querySelectorAll("[data-cart-line]").forEach((line) => {
      const codigo = line.getAttribute("data-cart-line");
      line.querySelector("[data-cart-minus]").addEventListener("click", () => changeQty(codigo, -1));
      line.querySelector("[data-cart-plus]").addEventListener("click", () => changeQty(codigo, 1));
      line.querySelector("[data-cart-remove]").addEventListener("click", () => removeLine(codigo));
    });
  }

  function changeQty(codigo, delta) {
    const cart = getCart();
    const item = cart.find((i) => i.codigo === codigo);
    if (!item) return;
    const product = PRODUCTS.find((p) => p.codigo === codigo);
    const max = product && product.stock > 0 ? product.stock : 99;
    item.cantidad = Math.min(max, Math.max(1, item.cantidad + delta));
    saveCart(cart);
    draw();
    initCartCount();
  }

  function removeLine(codigo) {
    const cart = getCart().filter((i) => i.codigo !== codigo);
    saveCart(cart);
    draw();
    initCartCount();
  }

  if (couponForm) {
    couponForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = couponForm.querySelector("input");
      const code = input.value.trim().toUpperCase();
      if (code === "LEVELUP20") {
        appliedDiscount = Math.max(appliedDiscount, 0.2);
        couponMsg.textContent = "Cupón aplicado: 20% de descuento.";
        draw();
      } else {
        couponMsg.textContent = "Cupón no válido.";
      }
    });
  }

  draw();
}
