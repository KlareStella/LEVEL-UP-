import api, { comoLista } from './api.js'
import { aCuerpoProducto, aProducto } from './adaptadores.js'

// El «código» del frontend es el id numérico del backend (como texto).
const ruta = (codigo) => `/productos/${encodeURIComponent(codigo)}`

export const listarProductos = () => api.get('/productos').then((r) => comoLista(r.data).map((p) => aProducto(p)))
export const obtenerProducto = (codigo) => api.get(ruta(codigo)).then((r) => aProducto(r.data))
export const crearProducto = (producto) => api.post('/productos', aCuerpoProducto(producto)).then((r) => aProducto(r.data))
export const actualizarProducto = (codigo, cambios) =>
  api.put(ruta(codigo), aCuerpoProducto(cambios)).then((r) => aProducto(r.data))
export const eliminarProducto = (codigo) => api.delete(ruta(codigo)).then((r) => r.data)
