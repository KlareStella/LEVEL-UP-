/* ==========================================================================
   admin.js — Panel administrador: control de acceso por rol y mantenedores
   de Productos y Usuarios (CRUD en memoria/localStorage).
   ========================================================================== */

const ADMIN_PRODUCTS_KEY = "lug_admin_products";
const VENDEDOR_ALLOWED_PAGES = ["index.html", "productos.html"];

document.addEventListener("DOMContentLoaded", () => {
  guardAdminAccess();
  initAdminSidebarState();
  renderDashboard();
  renderProductsTable();
  initProductForm();
  renderUsersTable();
  initUserForm();
});

/* ---------------------------------------------------------------------- */
/* Control de acceso                                                      */
/* ---------------------------------------------------------------------- */
function guardAdminAccess() {
  const session = getSession();
  const page = window.location.pathname.split("/").pop() || "index.html";

  if (!session || (session.tipoUsuario !== "Administrador" && session.tipoUsuario !== "Vendedor")) {
    window.location.href = "login.html";
    return;
  }

  if (session.tipoUsuario === "Vendedor") {
    const isAllowed = VENDEDOR_ALLOWED_PAGES.some((allowed) => page.startsWith(allowed.split(".")[0]));
    if (!isAllowed) {
      window.location.href = "index.html";
      return;
    }
    // Oculta accesos que el vendedor no debe ver (regla del enunciado).
    document.querySelectorAll("[data-admin-only]").forEach((el) => el.remove());
  }

  const nameEl = document.querySelector("[data-admin-user-name]");
  const roleEl = document.querySelector("[data-admin-user-role]");
  if (nameEl) nameEl.textContent = `${session.nombre} ${session.apellidos || ""}`.trim();
  if (roleEl) {
    roleEl.textContent = session.tipoUsuario;
    roleEl.className = `badge badge-role-${session.tipoUsuario}`;
  }

  const logoutBtn = document.querySelector("[data-admin-logout]");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      clearSession();
      window.location.href = "../login.html";
    });
  }
}

function initAdminSidebarState() {
  const page = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".admin-nav a").forEach((a) => {
    if (a.getAttribute("href") === page) a.setAttribute("aria-current", "page");
  });
}

/* ---------------------------------------------------------------------- */
/* Productos (persistidos en localStorage, semilla = PRODUCTS de data.js) */
/* ---------------------------------------------------------------------- */
function getAdminProducts() {
  const raw = localStorage.getItem(ADMIN_PRODUCTS_KEY);
  if (raw) return JSON.parse(raw);
  localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(PRODUCTS));
  return PRODUCTS.slice();
}
function saveAdminProducts(list) {
  localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(list));
}

function renderDashboard() {
  const grid = document.querySelector("[data-dashboard-stats]");
  if (!grid) return;
  const products = getAdminProducts();
  const users = getUsers();
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= p.stockCritico).length;
  const outStock = products.filter((p) => p.stock === 0).length;

  grid.innerHTML = `
    <div class="stat-card"><p class="stat-label">Productos activos</p><p class="stat-value">${products.length}</p></div>
    <div class="stat-card"><p class="stat-label">Usuarios registrados</p><p class="stat-value accent-blue">${users.length}</p></div>
    <div class="stat-card"><p class="stat-label">Stock bajo</p><p class="stat-value accent-danger">${lowStock}</p></div>
    <div class="stat-card"><p class="stat-label">Sin stock</p><p class="stat-value accent-green">${outStock}</p></div>
  `;

  const recentTable = document.querySelector("[data-dashboard-recent]");
  if (recentTable) {
    recentTable.innerHTML = products
      .slice(0, 5)
      .map(
        (p) => `
      <tr>
        <td class="cell-strong">${p.codigo}</td>
        <td>${p.nombre}</td>
        <td>${p.categoriaLabel}</td>
        <td>${formatCLP(p.precio)}</td>
        <td class="stock-flag ${p.stock <= p.stockCritico ? "low" : ""}">${p.stock}</td>
      </tr>`
      )
      .join("");
  }
}

function renderProductsTable() {
  const tbody = document.querySelector("[data-products-table]");
  if (!tbody) return;

  function draw() {
    const products = getAdminProducts();
    const canEdit = getSession()?.tipoUsuario === "Administrador";
    tbody.innerHTML = products.length
      ? products
          .map(
            (p) => `
        <tr>
          <td class="cell-strong">${p.codigo}</td>
          <td>${p.nombre}</td>
          <td>${p.categoriaLabel}</td>
          <td>${formatCLP(p.precio)}</td>
          <td class="stock-flag ${p.stock <= p.stockCritico ? "low" : ""}">${p.stock}</td>
          <td class="row-actions">
            ${
              canEdit
                ? `<a href="producto-form.html?codigo=${p.codigo}">Editar</a>
                   <button type="button" data-delete-product="${p.codigo}" class="danger">Eliminar</button>`
                : `<span style="color:var(--text-muted);">Solo lectura</span>`
            }
          </td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="6"><div class="empty-state">Aún no hay productos cargados.</div></td></tr>`;

    tbody.querySelectorAll("[data-delete-product]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!confirm("¿Eliminar este producto del catálogo?")) return;
        const products = getAdminProducts().filter((p) => p.codigo !== btn.getAttribute("data-delete-product"));
        saveAdminProducts(products);
        draw();
      });
    });
  }
  draw();
}

function initProductForm() {
  const form = document.querySelector("[data-product-form]");
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const codigo = params.get("codigo");
  const isEdit = Boolean(codigo);
  const products = getAdminProducts();
  const existing = isEdit ? products.find((p) => p.codigo === codigo) : null;

  document.querySelector("[data-form-title]").textContent = isEdit ? "Editar producto" : "Nuevo producto";

  const categoriaSelect = form.querySelector("select[name='categoria']");
  CATEGORIES.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat.value;
    opt.textContent = cat.label;
    categoriaSelect.appendChild(opt);
  });

  const fields = {
    codigo: form.querySelector("[data-field='codigo']"),
    nombre: form.querySelector("[data-field='nombre']"),
    descripcion: form.querySelector("[data-field='descripcion']"),
    precio: form.querySelector("[data-field='precio']"),
    stock: form.querySelector("[data-field='stock']"),
    stockCritico: form.querySelector("[data-field='stockCritico']"),
    categoria: form.querySelector("[data-field='categoria']"),
    imagen: form.querySelector("[data-field='imagen']"),
  };

  if (existing) {
    form.querySelector("input[name='codigo']").value = existing.codigo;
    form.querySelector("input[name='codigo']").disabled = true;
    form.querySelector("input[name='nombre']").value = existing.nombre;
    form.querySelector("textarea[name='descripcion']").value = existing.descripcion;
    form.querySelector("input[name='precio']").value = existing.precio;
    form.querySelector("input[name='stock']").value = existing.stock;
    form.querySelector("input[name='stockCritico']").value = existing.stockCritico;
    categoriaSelect.value = existing.categoria;
    form.querySelector("input[name='imagen']").value = existing.imagen;
  }

  const validators = {
    codigo: bindValidator(fields.codigo, fields.codigo.querySelector("input"), (v) => {
      if (isEdit) return { valid: true };
      if (!required(v)) return { valid: false, message: "El código es obligatorio." };
      if (!minLength(v, 3)) return { valid: false, message: "Mínimo 3 caracteres." };
      if (products.some((p) => p.codigo.toLowerCase() === v.toLowerCase())) {
        return { valid: false, message: "Ya existe un producto con ese código." };
      }
      return { valid: true };
    }),
    nombre: bindValidator(fields.nombre, fields.nombre.querySelector("input"), (v) => {
      if (!required(v)) return { valid: false, message: "El nombre es obligatorio." };
      if (!maxLength(v, 100)) return { valid: false, message: "Máximo 100 caracteres." };
      return { valid: true };
    }),
    descripcion: bindValidator(fields.descripcion, fields.descripcion.querySelector("textarea"), (v) => {
      if (!maxLength(v, 500)) return { valid: false, message: "Máximo 500 caracteres." };
      return { valid: true };
    }),
    precio: bindValidator(fields.precio, fields.precio.querySelector("input"), (v) => {
      if (!required(v)) return { valid: false, message: "El precio es obligatorio." };
      if (!isPositiveOrZeroDecimal(v)) return { valid: false, message: "Ingresa un número válido (0 o más)." };
      return { valid: true };
    }),
    stock: bindValidator(fields.stock, fields.stock.querySelector("input"), (v) => {
      if (!required(v)) return { valid: false, message: "El stock es obligatorio." };
      if (!isPositiveOrZeroInteger(v)) return { valid: false, message: "Solo números enteros, 0 o más." };
      return { valid: true };
    }),
    stockCritico: bindValidator(fields.stockCritico, fields.stockCritico.querySelector("input"), (v) => {
      if (!required(v)) return { valid: true }; // opcional
      if (!isPositiveOrZeroInteger(v)) return { valid: false, message: "Solo números enteros, 0 o más." };
      return { valid: true };
    }),
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const categoriaOk = setFieldState(fields.categoria, required(categoriaSelect.value), "Selecciona una categoría.");
    const results = Object.values(validators).map((fn) => fn());
    if (!results.every(Boolean) || !categoriaOk) return;

    const catInfo = CATEGORIES.find((c) => c.value === categoriaSelect.value);
    const productData = {
      codigo: isEdit ? existing.codigo : form.querySelector("input[name='codigo']").value.trim().toUpperCase(),
      nombre: form.querySelector("input[name='nombre']").value.trim(),
      descripcion: form.querySelector("textarea[name='descripcion']").value.trim(),
      precio: parseFloat(form.querySelector("input[name='precio']").value),
      stock: parseInt(form.querySelector("input[name='stock']").value, 10),
      stockCritico: parseInt(form.querySelector("input[name='stockCritico']").value || "0", 10),
      categoria: catInfo.value,
      categoriaLabel: catInfo.label,
      imagen:
        form.querySelector("input[name='imagen']").value.trim() ||
        "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80",
    };

    let list = getAdminProducts();
    if (isEdit) {
      list = list.map((p) => (p.codigo === existing.codigo ? { ...p, ...productData } : p));
    } else {
      list.push(productData);
    }
    saveAdminProducts(list);
    window.location.href = "productos.html";
  });
}

/* ---------------------------------------------------------------------- */
/* Usuarios                                                                */
/* ---------------------------------------------------------------------- */
function renderUsersTable() {
  const tbody = document.querySelector("[data-users-table]");
  if (!tbody) return;

  function draw() {
    const users = getUsers();
    tbody.innerHTML = users.length
      ? users
          .map(
            (u) => `
        <tr>
          <td class="cell-strong">${u.run}</td>
          <td>${u.nombre} ${u.apellidos}</td>
          <td>${u.correo}</td>
          <td><span class="badge badge-role-${u.tipoUsuario}">${u.tipoUsuario}</span></td>
          <td class="row-actions">
            <a href="usuario-form.html?run=${u.run}">Editar</a>
            <button type="button" data-delete-user="${u.run}" class="danger">Eliminar</button>
          </td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="5"><div class="empty-state">Aún no hay usuarios registrados.</div></td></tr>`;

    tbody.querySelectorAll("[data-delete-user]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!confirm("¿Eliminar este usuario?")) return;
        const users = getUsers().filter((u) => u.run !== btn.getAttribute("data-delete-user"));
        saveUsers(users);
        draw();
      });
    });
  }
  draw();
}

function initUserForm() {
  const form = document.querySelector("[data-user-form]");
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const run = params.get("run");
  const isEdit = Boolean(run);
  const users = getUsers();
  const existing = isEdit ? users.find((u) => u.run === run) : null;

  document.querySelector("[data-form-title]").textContent = isEdit ? "Editar usuario" : "Nuevo usuario";

  populateRegionSelects();

  if (existing) {
    form.querySelector("input[name='run']").value = existing.run;
    form.querySelector("input[name='run']").disabled = true;
    form.querySelector("input[name='nombre']").value = existing.nombre;
    form.querySelector("input[name='apellidos']").value = existing.apellidos;
    form.querySelector("input[name='correo']").value = existing.correo;
    form.querySelector("input[name='fechaNacimiento']").value = existing.fechaNacimiento || "";
    form.querySelector("select[name='tipoUsuario']").value = existing.tipoUsuario;
    form.querySelector("input[name='direccion']").value = existing.direccion || "";
    const regionSelect = form.querySelector("select[name='region']");
    regionSelect.value = existing.region || "";
    regionSelect.dispatchEvent(new Event("change"));
    setTimeout(() => {
      form.querySelector("select[name='comuna']").value = existing.comuna || "";
    }, 0);
  }

  const fields = {
    run: form.querySelector("[data-field='run']"),
    nombre: form.querySelector("[data-field='nombre']"),
    apellidos: form.querySelector("[data-field='apellidos']"),
    correo: form.querySelector("[data-field='correo']"),
    direccion: form.querySelector("[data-field='direccion']"),
    tipoUsuario: form.querySelector("[data-field='tipoUsuario']"),
  };

  const validators = {
    run: bindValidator(fields.run, fields.run.querySelector("input"), (v) => {
      if (isEdit) return { valid: true };
      if (!required(v)) return { valid: false, message: "El RUN es obligatorio." };
      if (!minLength(v, 7) || !maxLength(v, 9)) return { valid: false, message: "Debe tener entre 7 y 9 caracteres." };
      if (!isValidRun(v)) return { valid: false, message: "RUN inválido (sin puntos ni guion)." };
      if (users.some((u) => u.run === v.toUpperCase())) return { valid: false, message: "Ya existe un usuario con ese RUN." };
      return { valid: true };
    }),
    nombre: bindValidator(fields.nombre, fields.nombre.querySelector("input"), (v) => {
      if (!required(v)) return { valid: false, message: "El nombre es obligatorio." };
      if (!maxLength(v, 50)) return { valid: false, message: "Máximo 50 caracteres." };
      return { valid: true };
    }),
    apellidos: bindValidator(fields.apellidos, fields.apellidos.querySelector("input"), (v) => {
      if (!required(v)) return { valid: false, message: "Los apellidos son obligatorios." };
      if (!maxLength(v, 100)) return { valid: false, message: "Máximo 100 caracteres." };
      return { valid: true };
    }),
    correo: bindValidator(fields.correo, fields.correo.querySelector("input"), (v) => {
      if (!required(v)) return { valid: false, message: "El correo es obligatorio." };
      if (!maxLength(v, 100)) return { valid: false, message: "Máximo 100 caracteres." };
      if (!isValidEmail(v)) return { valid: false, message: "Usa un correo @duoc.cl, @profesor.duoc.cl o @gmail.com." };
      return { valid: true };
    }),
    direccion: bindValidator(fields.direccion, fields.direccion.querySelector("input"), (v) => {
      if (!required(v)) return { valid: false, message: "La dirección es obligatoria." };
      if (!maxLength(v, 300)) return { valid: false, message: "Máximo 300 caracteres." };
      return { valid: true };
    }),
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const tipoOk = setFieldState(fields.tipoUsuario, required(form.querySelector("select[name='tipoUsuario']").value), "Selecciona un tipo de usuario.");
    const results = Object.values(validators).map((fn) => fn());
    if (!results.every(Boolean) || !tipoOk) return;

    const userData = {
      run: isEdit ? existing.run : form.querySelector("input[name='run']").value.trim().toUpperCase(),
      nombre: form.querySelector("input[name='nombre']").value.trim(),
      apellidos: form.querySelector("input[name='apellidos']").value.trim(),
      correo: form.querySelector("input[name='correo']").value.trim(),
      password: existing ? existing.password : "levelup2026",
      fechaNacimiento: form.querySelector("input[name='fechaNacimiento']").value,
      tipoUsuario: form.querySelector("select[name='tipoUsuario']").value,
      region: form.querySelector("select[name='region']").value,
      comuna: form.querySelector("select[name='comuna']").value,
      direccion: form.querySelector("input[name='direccion']").value.trim(),
    };

    let list = getUsers();
    if (isEdit) {
      list = list.map((u) => (u.run === existing.run ? { ...u, ...userData } : u));
    } else {
      list.push(userData);
    }
    saveUsers(list);
    window.location.href = "usuarios.html";
  });
}
