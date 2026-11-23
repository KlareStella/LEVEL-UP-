import api from './api.js'
import { nombreCompleto, separarNombre } from './adaptadores.js'

// El backend puede nombrar el rol de distintas formas (ADMIN, ROLE_ADMIN, Administrador...).
export function normalizarRol(rol) {
  const r = String(rol ?? '').toLowerCase().replace('role_', '')
  if (r.startsWith('admin')) return 'Administrador'
  if (r.startsWith('vend')) return 'Vendedor'
  return 'Cliente'
}

export function normalizarUsuario(u) {
  const { password, contrasena, rol, role, ...resto } = u
  const usuario = { ...resto, tipoUsuario: normalizarRol(u.tipoUsuario ?? rol ?? role) }
  // El backend identifica al usuario por `id` y guarda un solo campo `nombre`.
  if (usuario.run === undefined && u.id != null) usuario.run = String(u.id)
  if (usuario.apellidos === undefined && typeof usuario.nombre === 'string') {
    Object.assign(usuario, separarNombre(usuario.nombre))
  }
  return usuario
}

export function extraerSesion(datos) {
  const token = datos?.token ?? datos?.accessToken ?? datos?.jwt
  const usuario = datos?.usuario ?? datos?.user
  if (!token || !usuario) throw new Error('La respuesta del servidor no incluye el token o el usuario.')
  const refreshToken = datos?.refreshToken ?? null
  return { token, refreshToken, usuario: normalizarUsuario(usuario) }
}

export async function iniciarSesion({ correo, password }) {
  // El backend (loginDTO) espera el campo `contrasena`.
  const { data } = await api.post('/auth/login', { correo, contrasena: password })
  return extraerSesion(data)
}

// Registra un cliente. Si la API no devuelve token al registrar, inicia sesión a continuación.
export async function registrarUsuario(datos) {
  // POST /auth/register (registroUsuarioDTO): solo guarda nombre completo, correo y contraseña; el rol siempre es CLIENTE.
  const { data } = await api.post('/auth/register', {
    nombre: nombreCompleto(datos),
    correo: datos.correo,
    contrasena: datos.password,
  })
  try {
    return extraerSesion(data)
  } catch {
    return iniciarSesion({ correo: datos.correo, password: datos.password })
  }
}
