import api, { comoLista, esNoEncontrado } from './api.js'
import { normalizarUsuario } from './auth.js'
import { nombreCompleto } from './adaptadores.js'

// El «run» del frontend es el id numérico del backend (como texto).
const ruta = (run) => `/usuarios/${encodeURIComponent(run)}`

export const listarUsuarios = () => api.get('/usuarios').then((r) => comoLista(r.data).map(normalizarUsuario))
export const obtenerUsuario = (run) =>
  api.get(ruta(run)).then((r) => normalizarUsuario(r.data)).catch((e) => {
    if (esNoEncontrado(e)) return null
    throw e
  })
// El backend crea usuarios con POST /usuarios/registro (siempre rol CLIENTE) y solo guarda nombre y correo.
export const crearUsuario = (usuario) =>
  api.post('/usuarios/registro', {
    nombre: nombreCompleto(usuario),
    correo: usuario.correo,
    contrasena: usuario.password,
  }).then((r) => r.data)
export const actualizarUsuario = (run, cambios) =>
  api.put(ruta(run), { nombre: nombreCompleto(cambios), correo: cambios.correo }).then((r) => r.data)
export const eliminarUsuario = (run) => api.delete(ruta(run)).then((r) => r.data)
