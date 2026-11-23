import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import Campo from '../componentes/Campo.jsx'
import useFormulario from '../hooks/useFormulario.js'
import { iniciarSesion } from '../servicios/auth.js'
import { mensajeError } from '../servicios/api.js'
import { correoValido, maximo, requerido } from '../utilidades/validaciones.js'

const reglas = {
  correo: (v) => !requerido(v) ? 'Ingresa tu correo.' : !maximo(v, 100) ? 'Máximo 100 caracteres.' : !correoValido(v) ? 'Usa un correo @duoc.cl, @profesor.duoc.cl o @gmail.com.' : null,
  password: (v) => !requerido(v) ? 'Ingresa tu contraseña.' : null,
}

export default function Login({ onLogin }) {
  const f = useFormulario({ correo: '', password: '' }, reglas)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [enviando, setEnviando] = useState(false)
  const navegar = useNavigate()
  const ubicacion = useLocation()

  // La contraseña NO se compara en el navegador: se envía a la API y ella responde con el token y el usuario.
  async function enviar(e) {
    e.preventDefault()
    setError('')
    if (!f.validarTodo()) return setError('Revisa los campos marcados en rojo.')
    setEnviando(true)
    try {
      const { token, refreshToken, usuario } = await iniciarSesion({ correo: f.valores.correo.trim(), password: f.valores.password })
      onLogin(usuario, token, refreshToken)
      setExito('¡Sesión iniciada! Redirigiendo...')
      // El Vendedor entra directo a las órdenes (no tiene Dashboard).
      const inicio = usuario.tipoUsuario === 'Administrador' ? '/admin' : usuario.tipoUsuario === 'Vendedor' ? '/admin/ordenes' : '/'
      const destino = ubicacion.state?.from ?? inicio
      setTimeout(() => navegar(destino, { replace: true }), 700)
    } catch (err) {
      const rechazada = [400, 401, 403, 404].includes(err.response?.status)
      setError(rechazada ? 'Correo o contraseña incorrectos.' : mensajeError(err, 'No se pudo iniciar sesión.'))
      setEnviando(false)
    }
  }

  return (
    <div className="container pagina" style={{ paddingTop: 80, paddingBottom: 80 }}>
      <form className="form-card" onSubmit={enviar} noValidate>
        <h2>Inicia sesión</h2>
        <p className="form-subtitle">Accede a tu cuenta Level-Up para ver tus puntos y pedidos.</p>
        {ubicacion.state?.expirada && <div className="form-alert is-visible is-error" role="alert">Tu sesión expiró. Vuelve a iniciar sesión.</div>}
        {ubicacion.state?.from && <div className="form-alert is-visible">Inicia sesión para continuar.</div>}
        {error && <div className="form-alert is-visible is-error">{error}</div>}
        {exito && <div className="form-alert is-visible">{exito}</div>}

        <Campo id="correo" etiqueta="Correo electrónico" error={f.errores.correo}>
          <input id="correo" name="correo" type="email" autoComplete="email" value={f.valores.correo} onChange={f.cambiar} onBlur={f.salir} />
        </Campo>
        <Campo id="password" etiqueta="Contraseña" error={f.errores.password}>
          <input id="password" name="password" type="password" autoComplete="current-password" value={f.valores.password} onChange={f.cambiar} onBlur={f.salir} />
        </Campo>

        <button type="submit" className="btn btn-primary btn-block" disabled={enviando}>Iniciar sesión</button>
        <p className="form-footer-link">¿Aún no tienes cuenta? <Link to="/registro">Regístrate aquí</Link></p>
      </form>
    </div>
  )
}
