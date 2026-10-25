/* ==========================================================================
   main.js — Comportamiento común a todas las páginas de la tienda.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initNavToggle();
  initFooterYear();
  initCartCount();
  initSessionAwareNav();
  initNewsletterForm();
});

function initNavToggle() {
  const toggle = document.querySelector(".nav-toggle");
  if (!toggle) return;
  toggle.addEventListener("click", () => {
    document.body.classList.toggle("nav-open");
  });
}

function initFooterYear() {
  const el = document.querySelector("[data-year]");
  if (el) el.textContent = new Date().getFullYear();
}

function initCartCount() {
  const els = document.querySelectorAll("[data-cart-count]");
  if (!els.length) return;
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + item.cantidad, 0);
  els.forEach((el) => (el.textContent = total));
}

/** Muestra el nombre de usuario o los links de sesión según corresponda. */
function initSessionAwareNav() {
  const session = getSession();
  const guestLinks = document.querySelectorAll("[data-guest-only]");
  const userPill = document.querySelector("[data-user-pill]");
  const logoutBtn = document.querySelector("[data-logout]");

  if (session) {
    guestLinks.forEach((el) => (el.style.display = "none"));
    if (userPill) {
      userPill.style.display = "flex";
      userPill.querySelector("[data-user-name]").textContent = session.nombre;
    }
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        clearSession();
        window.location.href = "index.html";
      });
    }
  } else if (userPill) {
    userPill.style.display = "none";
  }
}

function initNewsletterForm() {
  const form = document.querySelector("[data-newsletter-form]");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = form.querySelector("input[type='email']");
    const msg = form.querySelector("[data-newsletter-msg]");
    if (input.value.trim()) {
      msg.textContent = "¡Gracias por suscribirte!";
      form.reset();
    }
  });
}

/* ---------- Sesión (localStorage) ---------- */
function getSession() {
  try {
    return JSON.parse(localStorage.getItem("lug_session"));
  } catch {
    return null;
  }
}
function setSession(user) {
  const { password, ...safeUser } = user;
  localStorage.setItem("lug_session", JSON.stringify(safeUser));
}
function clearSession() {
  localStorage.removeItem("lug_session");
}

/* ---------- Carrito (localStorage) ---------- */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem("lug_cart")) || [];
  } catch {
    return [];
  }
}
function saveCart(cart) {
  localStorage.setItem("lug_cart", JSON.stringify(cart));
}
