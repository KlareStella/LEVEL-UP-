/* ==========================================================================
   blogs.js — Listado y detalle de blogs, y validación del formulario de
   contacto.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  renderBlogList();
  renderBlogDetail();
  initContactForm();
});

function renderBlogList() {
  const grid = document.querySelector("[data-blog-grid]");
  if (!grid) return;
  grid.innerHTML = BLOG_POSTS.map(
    (post) => `
    <article class="blog-card">
      <img src="${post.imagen}" alt="${post.titulo}">
      <div class="blog-card-body">
        <h3>${post.titulo}</h3>
        <p>${post.resumen}</p>
        <a href="blog-detalle.html?id=${post.id}" class="btn btn-outline btn-sm">Ver caso</a>
      </div>
    </article>`
  ).join("");
}

function renderBlogDetail() {
  const container = document.querySelector("[data-blog-article]");
  if (!container) return;
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get("id"), 10);
  const post = BLOG_POSTS.find((p) => p.id === id) || BLOG_POSTS[0];

  document.title = `${post.titulo} · Level-Up Gamer`;
  container.querySelector("[data-blog-title]").textContent = post.titulo;
  container.querySelector("[data-blog-image]").src = post.imagen;
  container.querySelector("[data-blog-image]").alt = post.titulo;
  container.querySelector("[data-blog-content]").textContent = post.contenido;
}

function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const fields = {
    nombre: form.querySelector("[data-field='nombre']"),
    correo: form.querySelector("[data-field='correo']"),
    comentario: form.querySelector("[data-field='comentario']"),
  };
  const alertEl = form.querySelector("[data-form-alert]");

  const validators = {
    nombre: bindValidator(fields.nombre, fields.nombre.querySelector("input"), (v) => {
      if (!required(v)) return { valid: false, message: "El nombre es obligatorio." };
      if (!maxLength(v, 100)) return { valid: false, message: "Máximo 100 caracteres." };
      return { valid: true };
    }),
    correo: bindValidator(fields.correo, fields.correo.querySelector("input"), (v) => {
      if (!required(v)) return { valid: true }; // opcional según el enunciado
      if (!maxLength(v, 100)) return { valid: false, message: "Máximo 100 caracteres." };
      if (!isValidEmail(v)) return { valid: false, message: "Usa un correo @duoc.cl, @profesor.duoc.cl o @gmail.com." };
      return { valid: true };
    }),
    comentario: bindValidator(fields.comentario, fields.comentario.querySelector("textarea"), (v) => {
      if (!required(v)) return { valid: false, message: "Cuéntanos en qué te podemos ayudar." };
      if (!maxLength(v, 500)) return { valid: false, message: "Máximo 500 caracteres." };
      return { valid: true };
    }),
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const ok = Object.values(validators).every((fn) => fn());
    if (!ok) {
      showFormAlert(alertEl, "Revisa los campos marcados en rojo.", true);
      return;
    }
    showFormAlert(alertEl, "¡Gracias! Tu mensaje fue enviado, te responderemos a la brevedad.", false);
    form.reset();
    Object.values(fields).forEach((f) => f.classList.remove("is-invalid"));
  });
}
