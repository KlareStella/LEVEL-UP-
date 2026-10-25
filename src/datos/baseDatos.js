import { CATEGORIES, PRODUCTS, SEED_USERS } from './data.js'
import { crearColeccion } from './crud.js'

export const productosDB = crearColeccion('lug_admin_products', PRODUCTS, 'codigo')
export const usuariosDB = crearColeccion('lug_users', SEED_USERS, 'run')
export const categoriasDB = crearColeccion('lug_categories', CATEGORIES, 'value')
export const ordenesDB = crearColeccion('lug_orders', [], 'id')
export function nuevoIdOrden(fecha = new Date(), existentes = ordenesDB.listar()) {
  const dia = fecha.toISOString().slice(0, 10).replaceAll('-', '')
  const delDia = existentes.filter((o) => o.id.startsWith(`ORD-${dia}-`)).length
  return `ORD-${dia}-${String(delDia + 1).padStart(4, '0')}`
}
export const slug = (texto) =>
  texto.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
