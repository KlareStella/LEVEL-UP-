/* ==========================================================================
   validate.js — Utilidades de validación de formularios en tiempo real.
   Todas las reglas siguen las especificaciones del Anexo 1 (DSY1104 EP1).
   ========================================================================== */

const EMAIL_DOMINIOS_PERMITIDOS = ["duoc.cl", "profesor.duoc.cl", "gmail.com"];

/** Marca/desmarca un campo como inválido y muestra su mensaje de error. */
function setFieldState(fieldEl, isValid, message) {
  const errorEl = fieldEl.querySelector(".error-message");
  if (isValid) {
    fieldEl.classList.remove("is-invalid");
    if (errorEl) errorEl.textContent = "";
  } else {
    fieldEl.classList.add("is-invalid");
    if (errorEl) errorEl.textContent = message || "Este campo no es válido.";
  }
  return isValid;
}

function required(value) {
  return value !== null && value !== undefined && String(value).trim().length > 0;
}

function maxLength(value, max) {
  return String(value || "").trim().length <= max;
}

function minLength(value, min) {
  return String(value || "").trim().length >= min;
}

function isValidEmail(value) {
  const v = String(value || "").trim();
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!pattern.test(v)) return false;
  const dominio = v.split("@")[1]?.toLowerCase();
  return EMAIL_DOMINIOS_PERMITIDOS.includes(dominio);
}

/** Valida un RUN chileno sin puntos ni guion, ej: 19011022K. */
function isValidRun(value) {
  const v = String(value || "").trim().toUpperCase();
  if (!/^[0-9]{6,8}[0-9K]$/.test(v)) return false;
  const cuerpo = v.slice(0, -1);
  const dv = v.slice(-1);
  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  const resto = 11 - (suma % 11);
  let dvEsperado;
  if (resto === 11) dvEsperado = "0";
  else if (resto === 10) dvEsperado = "K";
  else dvEsperado = String(resto);
  return dv === dvEsperado;
}

function isPositiveOrZeroInteger(value) {
  return /^[0-9]+$/.test(String(value).trim());
}

function isPositiveOrZeroDecimal(value) {
  return /^[0-9]+(\.[0-9]+)?$/.test(String(value).trim());
}

/**
 * Ata un validador a un campo: valida en 'blur' e 'input' (tras el primer
 * error, para dar feedback en tiempo real) y devuelve la función de
 * validación para poder llamarla también al enviar el formulario.
 */
function bindValidator(fieldEl, inputEl, validatorFn) {
  let touched = false;
  const run = () => {
    const result = validatorFn(inputEl.value);
    setFieldState(fieldEl, result.valid, result.message);
    return result.valid;
  };
  inputEl.addEventListener("blur", () => {
    touched = true;
    run();
  });
  inputEl.addEventListener("input", () => {
    if (touched) run();
  });
  return run;
}

function showFormAlert(alertEl, message, isError) {
  alertEl.textContent = message;
  alertEl.classList.add("is-visible");
  alertEl.classList.toggle("is-error", !!isError);
}
