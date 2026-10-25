/* ==========================================================================
   products.js — Listado, filtros y ficha de producto.
   ========================================================================== */

function formatCLP(value) {
  return value.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
}

function productCardHTML(p) {
  const lowStock = p.stock > 0 && p.stock <= p.stockCritico;
  const outOfStock = p.stock === 0 && p.categoria !== "servicio-tecnico";
  return `
    <article class="product-card">
      <a href="producto-detalle.html?codigo=${p.codigo}">
        <div class="product-thumb"><img src="${p.imagen}" alt="${p.nombre}" loading="lazy"></div>
      </a>
      <div class="product-body">
        <span class="product-cat">${p.categoriaLabel}</span>
        <a class="product-name" href="producto-detalle.html?codigo=${p.codigo}">${p.nombre}</a>
        ${lowStock ? `<span class="product-stock-warning">¡Quedan solo ${p.stock} unidades!</span>` : ""}
        ${outOfStock ? `<span class="product-stock-warning">Sin stock</span>` : ""}
        <span class="product-price">${formatCLP(p.precio)}</span>
      </div>
      <div class="product-actions">
        <button class="btn btn-primary btn-block btn-sm" data-add-to-cart="${p.codigo}" ${outOfStock ? "disabled" : ""}>
          Añadir al carrito
        </button>
      </div>
    </article>`;
}

document.addEventListener("DOMContentLoaded", () => {
  renderHomeProducts();
  renderCatalog();
  renderProductDetail();
  bindAddToCartButtons(document);
});

function renderHomeProducts() {
  const grid = document.querySelector("[data-home-products]");
  if (!grid) return;
  const destacados = PRODUCTS.slice(0, 8);
  grid.innerHTML = destacados.map(productCardHTML).join("");
}

function renderCatalog() {
  const grid = document.querySelector("[data-catalog-grid]");
  if (!grid) return;

  const params = new URLSearchParams(window.location.search);
  const catFilterInitial = params.get("categoria");

  const checkboxContainer = document.querySelector("[data-category-filters]");
  const searchInput = document.querySelector("[data-catalog-search]");
  const sortSelect = document.querySelector("[data-catalog-sort]");
  const resultsCount = document.querySelector("[data-results-count]");

  CATEGORIES.forEach((cat) => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" value="${cat.value}" ${cat.value === catFilterInitial ? "checked" : ""}> ${cat.label}`;
    checkboxContainer.appendChild(label);
  });

  function getFilters() {
    const checked = Array.from(checkboxContainer.querySelectorAll("input:checked")).map((i) => i.value);
    return {
      categorias: checked,
      texto: (searchInput.value || "").toLowerCase().trim(),
      orden: sortSelect.value,
    };
  }

  function apply() {
    const { categorias, texto, orden } = getFilters();
    let list = PRODUCTS.filter((p) => {
      const matchCat = categorias.length === 0 || categorias.includes(p.categoria);
      const matchText = !texto || p.nombre.toLowerCase().includes(texto);
      return matchCat && matchText;
    });

    if (orden === "precio-asc") list = list.slice().sort((a, b) => a.precio - b.precio);
    if (orden === "precio-desc") list = list.slice().sort((a, b) => b.precio - a.precio);
    if (orden === "nombre") list = list.slice().sort((a, b) => a.nombre.localeCompare(b.nombre));

    grid.innerHTML = list.length
      ? list.map(productCardHTML).join("")
      : `<p class="text-center" style="grid-column:1/-1;">No se encontraron productos con esos filtros.</p>`;
    resultsCount.textContent = `${list.length} producto${list.length === 1 ? "" : "s"}`;
    bindAddToCartButtons(grid);
  }

  checkboxContainer.addEventListener("change", apply);
  searchInput.addEventListener("input", apply);
  sortSelect.addEventListener("change", apply);
  apply();
}

function renderProductDetail() {
  const container = document.querySelector("[data-product-detail]");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const codigo = params.get("codigo");
  const product = PRODUCTS.find((p) => p.codigo === codigo) || PRODUCTS[0];

  document.title = `${product.nombre} · Level-Up Gamer`;
  container.querySelector("[data-pd-breadcrumb]").textContent = product.categoriaLabel;
  container.querySelector("[data-pd-image]").src = product.imagen;
  container.querySelector("[data-pd-image]").alt = product.nombre;
  container.querySelector("[data-pd-cat]").textContent = product.categoriaLabel;
  container.querySelector("[data-pd-name]").textContent = product.nombre;
  container.querySelector("[data-pd-price]").textContent = formatCLP(product.precio);
  container.querySelector("[data-pd-desc]").textContent = product.descripcion;

  const stockBadge = container.querySelector("[data-pd-stock]");
  const outOfStock = product.stock === 0 && product.categoria !== "servicio-tecnico";
  if (outOfStock) {
    stockBadge.textContent = "SIN STOCK";
    stockBadge.classList.add("low");
  } else if (product.stock <= product.stockCritico && product.categoria !== "servicio-tecnico") {
    stockBadge.textContent = `STOCK BAJO — quedan ${product.stock} unidades`;
    stockBadge.classList.add("low");
  } else {
    stockBadge.textContent = `STOCK DISPONIBLE: ${product.categoria === "servicio-tecnico" ? "agenda tu hora" : product.stock}`;
  }

  const qtyInput = container.querySelector("[data-qty-input]");
  const addBtn = container.querySelector("[data-pd-add]");
  container.querySelector("[data-qty-minus]").addEventListener("click", () => {
    qtyInput.value = Math.max(1, parseInt(qtyInput.value || "1", 10) - 1);
  });
  container.querySelector("[data-qty-plus]").addEventListener("click", () => {
    const max = product.stock > 0 ? product.stock : 99;
    qtyInput.value = Math.min(max, parseInt(qtyInput.value || "1", 10) + 1);
  });

  if (outOfStock) {
    addBtn.disabled = true;
    addBtn.textContent = "Sin stock";
  } else {
    addBtn.addEventListener("click", () => {
      addToCart(product.codigo, Math.max(1, parseInt(qtyInput.value || "1", 10)));
      addBtn.textContent = "¡Añadido!";
      setTimeout(() => (addBtn.textContent = "Añadir al carrito"), 1200);
    });
  }

  const relatedGrid = container.querySelector("[data-pd-related]");
  if (relatedGrid) {
    const related = PRODUCTS.filter((p) => p.categoria === product.categoria && p.codigo !== product.codigo).slice(0, 4);
    relatedGrid.innerHTML = related.map(productCardHTML).join("");
    bindAddToCartButtons(relatedGrid);
  }
}

function bindAddToCartButtons(scope) {
  scope.querySelectorAll("[data-add-to-cart]").forEach((btn) => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = "true";
    btn.addEventListener("click", () => {
      addToCart(btn.getAttribute("data-add-to-cart"), 1);
      const original = btn.textContent;
      btn.textContent = "¡Añadido!";
      setTimeout(() => (btn.textContent = original), 1000);
    });
  });
}

function addToCart(codigo, cantidad) {
  const cart = getCart();
  const existing = cart.find((item) => item.codigo === codigo);
  if (existing) {
    existing.cantidad += cantidad;
  } else {
    cart.push({ codigo, cantidad });
  }
  saveCart(cart);
  initCartCount();
}
