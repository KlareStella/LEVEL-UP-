import axios from 'axios'
import { borrarSesion, guardarTokens, leerRefresh, leerToken } from '../utilidades/almacen.js'

// Instancia única de axios: todas las llamadas a la API pasan por aquí.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// La app registra aquí qué hacer cuando el token expira (cerrar sesión y volver al login).
let alExpirar = null
export const registrarAlExpirar = (fn) => { alExpirar = fn }

const esRutaAuth = (url) => String(url ?? '').includes('/auth/')

// Interceptor de petición: agrega Authorization: Bearer <token> si hay sesión.
// Las rutas /auth/* van SIN token: el backend rechaza un Bearer vencido incluso en rutas públicas.
export function agregarToken(config) {
  const token = leerToken()
  if (token && !esRutaAuth(config.url)) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

// Renueva el token de acceso con POST /auth/refresh. Si varias peticiones fallan a la vez, comparten una sola renovación.
let renovando = null
function renovarToken() {
  const refreshToken = leerRefresh()
  if (!refreshToken) return Promise.reject(new Error('No hay token de renovación.'))
  renovando ??= api.post('/auth/refresh', { refreshToken })
    .then(({ data }) => {
      const token = data?.accessToken ?? data?.token
      if (!token) throw new Error('La renovación no devolvió un token.')
      guardarTokens(token, data?.refreshToken)
      return token
    })
    .finally(() => { renovando = null })
  return renovando
}

// Interceptor de respuesta: un 401 con sesión activa significa token vencido. Primero se intenta renovarlo con el
// refresh token y repetir la petición una vez; si no se puede, se cierra la sesión.
// (El 401 del propio login/refresh es "credenciales incorrectas / refresh inválido" y no debe cerrar nada.)
export async function manejarErrorRespuesta(error) {
  const config = error.config
  if (error.response?.status === 401 && !esRutaAuth(config?.url) && leerToken()) {
    let renovado = false
    if (config && !config._reintento && leerRefresh()) {
      try { await renovarToken(); renovado = true } catch { /* sin renovación posible: se cierra la sesión */ }
    }
    if (renovado) {
      config._reintento = true
      return api.request(config) // agregarToken pone el token nuevo
    }
    borrarSesion()
    alExpirar?.()
  }
  return Promise.reject(error)
}

api.interceptors.request.use(agregarToken)
api.interceptors.response.use((respuesta) => respuesta, manejarErrorRespuesta)

// La API puede responder con un arreglo o con { content: [...] } / { data: [...] }.
export const comoLista = (datos) =>
  Array.isArray(datos) ? datos : datos?.content ?? datos?.data ?? []

// Mensaje legible para mostrar al usuario a partir de un error de axios.
export function mensajeError(error, defecto = 'Ocurrió un error inesperado.') {
  if (error?.response) {
    const d = error.response.data
    return (typeof d === 'string' && d) || d?.message || d?.mensaje || d?.error || defecto
  }
  if (error?.request) return 'No se pudo conectar con el servidor.'
  return error?.message || defecto
}

// En GET por id el backend responde 404 (productos) o 400 «no encontrado» (boletas, usuarios,
// categorías) cuando el recurso no existe; para las vistas ambos significan «no existe».
export const esNoEncontrado = (error) => [400, 404].includes(error?.response?.status)

export default api
