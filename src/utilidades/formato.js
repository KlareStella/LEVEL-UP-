export function formatCLP(valor) {
  return valor.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
}


export function rutaImagen(src) {
  if (!src || /^(https?:|data:|\/\/)/.test(src)) return src
  return import.meta.env.BASE_URL + src.replace(/^\//, '')
}

export const tieneOferta = (p) => Number(p?.descuento) > 0
export const precioFinal = (p) =>
  tieneOferta(p) ? Math.round(p.precio * (1 - p.descuento / 100)) : p.precio

export const slug = (texto) =>
  texto.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
