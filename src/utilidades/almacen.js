import { PRODUCTS, SEED_USERS } from '../datos/data.js'

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
export const leerSesion = () => leer('lug_session', null)
export const guardarSesion = (u) => {
  const { password, ...segura } = u 
  localStorage.setItem('lug_session', JSON.stringify(segura))
  return segura
}
export const borrarSesion = () => localStorage.removeItem('lug_session')

export function leerUsuarios() {
  const usuarios = leer('lug_users', null)
  if (usuarios) return usuarios
  localStorage.setItem('lug_users', JSON.stringify(SEED_USERS)) 
  return SEED_USERS.slice()
}
export const guardarUsuarios = (u) => localStorage.setItem('lug_users', JSON.stringify(u))
export const leerProductos = () => leer('lug_admin_products', PRODUCTS)
export const guardarProductos = (p) => localStorage.setItem('lug_admin_products', JSON.stringify(p))
