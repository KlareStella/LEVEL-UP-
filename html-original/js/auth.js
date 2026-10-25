/* ==========================================================================
   auth.js — Registro e inicio de sesión de usuarios.
   Persiste usuarios en localStorage ("lug_users"), sembrado desde
   SEED_USERS (data.js) la primera vez que se carga el sitio.
   ========================================================================== */

function getUsers() {
  const raw = localStorage.getItem("lug_users");
  if (raw) return JSON.parse(raw);
  localStorage.setItem("lug_users", JSON.stringify(SEED_USERS));
  return SEED_USERS.slice();
}
function saveUsers(users) {
  localStorage.setItem("lug_users", JSON.stringify(users));
}

document.addEventListener("DOMContentLoaded", () => {
  initRegisterForm();
  initLoginForm();
  populateRegionSelects();
});

/* ---------------------------------------------------------------------- */
/* Región / comuna dependientes                                          */
/* ---------------------------------------------------------------------- */
function populateRegionSelects() {
  const regionSelect = document.querySelector("[data-region-select]");
  const comunaSelect = document.querySelector("[data-comuna-select]");
  if (!regionSelect || !comunaSelect) return;

  Object.keys(REGIONES_COMUNAS).forEach((region) => {
    const opt = document.createElement("option");
    opt.value = region;
    opt.textContent = region;
    regionSelect.appendChild(opt);
  });

  const fillComunas = () => {
    comunaSelect.innerHTML = '<option value="">-- Seleccione la comuna --</option>';
    const comunas = REGIONES_COMUNAS[regionSelect.value] || [];
    comunas.forEach((comuna) => {
      const opt = document.createElement("option");
      opt.value = comuna;
      opt.textContent = comuna;
      comunaSelect.appendChild(opt);
    });
  };

  regionSelect.addEventListener("change", fillComunas);
}

/* ---------------------------------------------------------------------- */
/* Registro                                                               */
/* ---------------------------------------------------------------------- */
function initRegisterForm() {
  const form = document.querySelector("[data-register-form]");
  if (!form) return;

  const fields = {
    run: form.querySelector("[data-field='run']"),
    nombre: form.querySelector("[data-field='nombre']"),
    apellidos: form.querySelector("[data-field='apellidos']"),
    correo: form.querySelector("[data-field='correo']"),
    password: form.querySelector("[data-field='password']"),
    confirmPassword: form.querySelector("[data-field='confirmPassword']"),
    fechaNacimiento: form.querySelector("[data-field='fechaNacimiento']"),
    region: form.querySelector("[data-field='region']"),
    comuna: form.querySelector("[data-field='comuna']"),
    direccion: form.querySelector("[data-field='direccion']"),
  };
  const alertEl = form.querySelector("[data-form-alert]");

  const validators = {
    run: bindValidator(fields.run, fields.run.querySelector("input"), (v) => {
      if (!required(v)) return { valid: false, message: "El RUN es obligatorio." };
      if (!minLength(v, 7) || !maxLength(v, 9)) return { valid: false, message: "El RUN debe tener entre 7 y 9 caracteres." };
      if (!isValidRun(v)) return { valid: false, message: "El RUN ingresado no es válido (sin puntos ni guion). Ej: 19011022K" };
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
    password: bindValidator(fields.password, fields.password.querySelector("input"), (v) => {
      if (!required(v)) return { valid: false, message: "La contraseña es obligatoria." };
      if (!minLength(v, 4) || !maxLength(v, 10)) return { valid: false, message: "Debe tener entre 4 y 10 caracteres." };
      return { valid: true };
    }),
    confirmPassword: bindValidator(fields.confirmPassword, fields.confirmPassword.querySelector("input"), (v) => {
      const pass = fields.password.querySelector("input").value;
      if (!required(v)) return { valid: false, message: "Confirma tu contraseña." };
      if (v !== pass) return { valid: false, message: "Las contraseñas no coinciden." };
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
    alertEl.classList.remove("is-visible", "is-error");

    const results = Object.values(validators).map((fn) => fn());
    const regionOk = setFieldState(fields.region, required(fields.region.querySelector("select").value), "Selecciona una región.");
    const comunaOk = setFieldState(fields.comuna, required(fields.comuna.querySelector("select").value), "Selecciona una comuna.");

    if (!results.every(Boolean) || !regionOk || !comunaOk) {
      showFormAlert(alertEl, "Revisa los campos marcados en rojo antes de continuar.", true);
      return;
    }

    const users = getUsers();
    const correo = fields.correo.querySelector("input").value.trim();
    const run = fields.run.querySelector("input").value.trim().toUpperCase();

    if (users.some((u) => u.correo.toLowerCase() === correo.toLowerCase())) {
      showFormAlert(alertEl, "Ya existe una cuenta registrada con ese correo.", true);
      return;
    }
    if (users.some((u) => u.run === run)) {
      showFormAlert(alertEl, "Ya existe una cuenta registrada con ese RUN.", true);
      return;
    }

    const newUser = {
      run,
      nombre: fields.nombre.querySelector("input").value.trim(),
      apellidos: fields.apellidos.querySelector("input").value.trim(),
      correo,
      password: fields.password.querySelector("input").value,
      fechaNacimiento: fields.fechaNacimiento.querySelector("input").value,
      tipoUsuario: "Cliente",
      region: fields.region.querySelector("select").value,
      comuna: fields.comuna.querySelector("select").value,
      direccion: fields.direccion.querySelector("input").value.trim(),
    };

    users.push(newUser);
    saveUsers(users);
    setSession(newUser);

    showFormAlert(alertEl, "¡Cuenta creada con éxito! Redirigiendo...", false);
    setTimeout(() => (window.location.href = "index.html"), 1200);
  });
}

/* ---------------------------------------------------------------------- */
/* Login                                                                  */
/* ---------------------------------------------------------------------- */
function initLoginForm() {
  const form = document.querySelector("[data-login-form]");
  if (!form) return;

  const correoField = form.querySelector("[data-field='correo']");
  const passField = form.querySelector("[data-field='password']");
  const alertEl = form.querySelector("[data-form-alert]");

  const validateCorreo = bindValidator(correoField, correoField.querySelector("input"), (v) => {
    if (!required(v)) return { valid: false, message: "Ingresa tu correo." };
    if (!maxLength(v, 100)) return { valid: false, message: "Máximo 100 caracteres." };
    if (!isValidEmail(v)) return { valid: false, message: "Usa un correo @duoc.cl, @profesor.duoc.cl o @gmail.com." };
    return { valid: true };
  });
  const validatePass = bindValidator(passField, passField.querySelector("input"), (v) => {
    if (!required(v)) return { valid: false, message: "Ingresa tu contraseña." };
    if (!minLength(v, 4) || !maxLength(v, 10)) return { valid: false, message: "Debe tener entre 4 y 10 caracteres." };
    return { valid: true };
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    alertEl.classList.remove("is-visible", "is-error");

    const okCorreo = validateCorreo();
    const okPass = validatePass();
    if (!okCorreo || !okPass) {
      showFormAlert(alertEl, "Revisa los campos marcados en rojo.", true);
      return;
    }

    const correo = correoField.querySelector("input").value.trim();
    const password = passField.querySelector("input").value;
    const users = getUsers();
    const user = users.find((u) => u.correo.toLowerCase() === correo.toLowerCase() && u.password === password);

    if (!user) {
      showFormAlert(alertEl, "Correo o contraseña incorrectos.", true);
      return;
    }

    setSession(user);
    showFormAlert(alertEl, "¡Sesión iniciada! Redirigiendo...", false);
    const destino = user.tipoUsuario === "Administrador" || user.tipoUsuario === "Vendedor" ? "admin/index.html" : "index.html";
    setTimeout(() => (window.location.href = destino), 900);
  });
}
