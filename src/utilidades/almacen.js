// Almacenamiento local: SOLO el carrito, los tokens (acceso y renovación) y los datos de la sesión.
// Productos, categorías, usuarios y órdenes viven en la API.
const leer = (clave, defecto) => {
  try {
    const guardado = localStorage.getItem(clave)
    return guardado ? JSON.parse(guardado) : defecto
  } catch {
    return defecto
  }
}

export const leerCarrito = () => leer('lug_cart', [])
export const guardarCarrito = (c) => localStorage.setItem('lug_cart', JSON.stringify(c))

export const leerToken = () => {
  try { return localStorage.getItem('lug_token') } catch { return null }
}
export const leerRefresh = () => {
  try { return localStorage.getItem('lug_refresh') } catch { return null }
}
// Guarda el token de acceso y, si llega, el de renovación (el backend emite ambos al iniciar sesión y al renovar).
export const guardarTokens = (token, refresh) => {
  if (token) localStorage.setItem('lug_token', token)
  if (refresh) localStorage.setItem('lug_refresh', refresh)
}
// Devuelve la sesión SIN la contraseña. Si llegan tokens, también los guarda.
export const guardarSesion = (usuario, token, refresh) => {
  const { password, ...segura } = usuario
  localStorage.setItem('lug_session', JSON.stringify(segura))
  guardarTokens(token, refresh)
  return segura
}
// La sesión solo es válida si existen el token y los datos del usuario.
export const leerSesion = () => (leerToken() ? leer('lug_session', null) : null)
export const borrarSesion = () => {
  localStorage.removeItem('lug_session')
  localStorage.removeItem('lug_token')
  localStorage.removeItem('lug_refresh')
}
