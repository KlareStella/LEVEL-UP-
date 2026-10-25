import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import Campo from '../componentes/Campo.jsx'
import useFormulario from '../hooks/useFormulario.js'
import { leerUsuarios } from '../utilidades/almacen.js'
import { correoValido, maximo, minimo, requerido } from '../utilidades/validaciones.js'

const reglas = {
  correo: (v) => !requerido(v) ? 'Ingresa tu correo.' : !maximo(v, 100) ? 'Máximo 100 caracteres.' : !correoValido(v) ? 'Usa un correo @duoc.cl, @profesor.duoc.cl o @gmail.com.' : null,
  password: (v) => !requerido(v) ? 'Ingresa tu contraseña.' : !minimo(v, 4) || !maximo(v, 10) ? 'Debe tener entre 4 y 10 caracteres.' : null,
}

export default function Login({ onLogin }) {
  const f = useFormulario({ correo: '', password: '' }, reglas)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const navegar = useNavigate()
  const ubicacion = useLocation()

  function enviar(e) {
    e.preventDefault()
    setError('')
    if (!f.validarTodo()) return setError('Revisa los campos marcados en rojo.')
    const usuario = leerUsuarios().find((u) =>
      u.correo.toLowerCase() === f.valores.correo.trim().toLowerCase() && u.password === f.valores.password)
    if (!usuario) return setError('Correo o contraseña incorrectos.')

    onLogin(usuario)
    setExito('¡Sesión iniciada! Redirigiendo...')
    const esPersonal = usuario.tipoUsuario === 'Administrador' || usuario.tipoUsuario === 'Vendedor'
    const destino = ubicacion.state?.from ?? (esPersonal ? '/admin' : '/')
    setTimeout(() => navegar(destino, { replace: true }), 700)
  }

  return (
    <div className="container pagina" style={{ paddingTop: 80, paddingBottom: 80 }}>
      <form className="form-card" onSubmit={enviar} noValidate>
        <h2>Inicia sesión</h2>
        <p className="form-subtitle">Accede a tu cuenta Level-Up para ver tus puntos y pedidos.</p>
        {ubicacion.state?.from && <div className="form-alert is-visible">Inicia sesión para continuar.</div>}
        {error && <div className="form-alert is-visible is-error">{error}</div>}
        {exito && <div className="form-alert is-visible">{exito}</div>}

        <Campo id="correo" etiqueta="Correo electrónico" error={f.errores.correo}>
          <input id="correo" name="correo" type="email" autoComplete="email" value={f.valores.correo} onChange={f.cambiar} onBlur={f.salir} />
        </Campo>
        <Campo id="password" etiqueta="Contraseña" error={f.errores.password}>
          <input id="password" name="password" type="password" autoComplete="current-password" value={f.valores.password} onChange={f.cambiar} onBlur={f.salir} />
        </Campo>

        <button type="submit" className="btn btn-primary btn-block">Iniciar sesión</button>
        <p className="form-footer-link">¿Aún no tienes cuenta? <Link to="/registro">Regístrate aquí</Link></p>
        <p className="form-footer-link" style={{ marginTop: 6 }}>Acceso admin demo: admin@duoc.cl / admin123</p>
      </form>
    </div>
  )
}
