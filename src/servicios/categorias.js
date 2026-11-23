import api, { comoLista } from './api.js'
import { aCategoria, aCuerpoCategoria } from './adaptadores.js'

// El «value» de la categoría en el frontend es el id numérico del backend (como texto).
const ruta = (valor) => `/categorias/${encodeURIComponent(valor)}`

export const listarCategorias = () => api.get('/categorias').then((r) => comoLista(r.data).map(aCategoria))
export const crearCategoria = (categoria) =>
  api.post('/categorias', aCuerpoCategoria(categoria)).then((r) => aCategoria(r.data))
export const actualizarCategoria = (valor, cambios) =>
  api.put(ruta(valor), aCuerpoCategoria(cambios)).then((r) => aCategoria(r.data))
export const eliminarCategoria = (valor) => api.delete(ruta(valor)).then((r) => r.data)
