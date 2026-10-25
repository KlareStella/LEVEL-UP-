import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import Campo from '../componentes/Campo.jsx'
import useFormulario from '../hooks/useFormulario.js'
import { REGIONES_COMUNAS } from '../datos/data.js'
import { guardarUsuarios, leerUsuarios } from '../utilidades/almacen.js'
import { correoValido, maximo, minimo, requerido, runValido } from '../utilidades/validaciones.js'

const inicial = { run: '', nombre: '', apellidos: '', correo: '', password: '', confirmPassword: '', fechaNacimiento: '', region: '', comuna: '', direccion: '' }

const reglas = {
  run: (v) => !requerido(v) ? 'El RUN es obligatorio.' : !minimo(v, 7) || !maximo(v, 9) ? 'El RUN debe tener entre 7 y 9 caracteres.' : !runValido(v) ? 'El RUN no es válido (sin puntos ni guion). Ej: 10000013K' : null,
  nombre: (v) => !requerido(v) ? 'El nombre es obligatorio.' : !maximo(v, 50) ? 'Máximo 50 caracteres.' : null,
  apellidos: (v) => !requerido(v) ? 'Los apellidos son obligatorios.' : !maximo(v, 100) ? 'Máximo 100 caracteres.' : null,
  correo: (v) => !requerido(v) ? 'El correo es obligatorio.' : !maximo(v, 100) ? 'Máximo 100 caracteres.' : !correoValido(v) ? 'Usa un correo @duoc.cl, @profesor.duoc.cl o @gmail.com.' : null,
  password: (v) => !requerido(v) ? 'La contraseña es obligatoria.' : !minimo(v, 4) || !maximo(v, 10) ? 'Debe tener entre 4 y 10 caracteres.' : null,
  confirmPassword: (v, todos) => !requerido(v) ? 'Confirma tu contraseña.' : v !== todos.password ? 'Las contraseñas no coinciden.' : null,
  region: (v) => requerido(v) ? null : 'Selecciona una región.',
  comuna: (v) => requerido(v) ? null : 'Selecciona una comuna.',
  direccion: (v) => !requerido(v) ? 'La dirección es obligatoria.' : !maximo(v, 300) ? 'Máximo 300 caracteres.' : null,
}

export default function Registro({ onLogin }) {
  const f = useFormulario(inicial, reglas)
  const [aviso, setAviso] = useState(null)
  const navegar = useNavigate()
  const comunas = REGIONES_COMUNAS[f.valores.region] ?? []

  function cambiarRegion(e) {
    f.setValores((v) => ({ ...v, region: e.target.value, comuna: '' }))
  }

  function enviar(e) {
    e.preventDefault()
    if (!f.validarTodo()) return setAviso({ error: true, texto: 'Revisa los campos marcados en rojo antes de continuar.' })

    const usuarios = leerUsuarios()
    const correo = f.valores.correo.trim()
    const run = f.valores.run.trim().toUpperCase()
    if (usuarios.some((u) => u.correo.toLowerCase() === correo.toLowerCase())) return setAviso({ error: true, texto: 'Ya existe una cuenta registrada con ese correo.' })
    if (usuarios.some((u) => u.run === run)) return setAviso({ error: true, texto: 'Ya existe una cuenta registrada con ese RUN.' })

    const { confirmPassword, ...datos } = f.valores
    const nuevo = { ...datos, run, correo, nombre: datos.nombre.trim(), apellidos: datos.apellidos.trim(), direccion: datos.direccion.trim(), tipoUsuario: 'Cliente' }
    guardarUsuarios([...usuarios, nuevo])
    onLogin(nuevo)
    setAviso({ error: false, texto: '¡Cuenta creada con éxito! Redirigiendo...' })
    setTimeout(() => navegar('/', { replace: true }), 1000)
  }

  const input = (name, tipo = 'text', extra = {}) => (
    <input id={name} name={name} type={tipo} value={f.valores[name]} onChange={f.cambiar} onBlur={f.salir} {...extra} />
  )

  return (
    <div className="container pagina">
      <form className="form-card" onSubmit={enviar} noValidate>
        <h2>Crea tu cuenta</h2>
        <p className="form-subtitle">Regístrate con tu correo @duoc.cl y obtén 20% de descuento de por vida.</p>
        {aviso && <div className={`form-alert is-visible${aviso.error ? ' is-error' : ''}`}>{aviso.texto}</div>}

        <Campo id="run" etiqueta="RUN (sin puntos ni guion)" error={f.errores.run} pista="Entre 7 y 9 caracteres, dígito verificador incluido. Ej: 123456785">{input('run', 'text', { placeholder: '123456785' })}</Campo>
        <div className="field-row">
          <Campo id="nombre" etiqueta="Nombre completo" error={f.errores.nombre}>{input('nombre')}</Campo>
          <Campo id="apellidos" etiqueta="Apellidos" error={f.errores.apellidos}>{input('apellidos')}</Campo>
        </div>
        <Campo id="correo" etiqueta="Correo electrónico" error={f.errores.correo} pista="Solo correos @duoc.cl, @profesor.duoc.cl o @gmail.com">{input('correo', 'email', { autoComplete: 'email', placeholder: 'tunombre@duoc.cl' })}</Campo>
        <div className="field-row">
          <Campo id="password" etiqueta="Contraseña" error={f.errores.password} pista="Entre 4 y 10 caracteres">{input('password', 'password', { autoComplete: 'new-password' })}</Campo>
          <Campo id="confirmPassword" etiqueta="Confirmar contraseña" error={f.errores.confirmPassword}>{input('confirmPassword', 'password', { autoComplete: 'new-password' })}</Campo>
        </div>
        <Campo id="fechaNacimiento" etiqueta="Fecha de nacimiento (opcional)">{input('fechaNacimiento', 'date')}</Campo>
        <div className="field-row">
          <Campo id="region" etiqueta="Región" error={f.errores.region}>
            <select id="region" name="region" value={f.valores.region} onChange={cambiarRegion} onBlur={f.salir}>
              <option value="">-- Seleccione la región --</option>
              {Object.keys(REGIONES_COMUNAS).map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Campo>
          <Campo id="comuna" etiqueta="Comuna" error={f.errores.comuna}>
            <select id="comuna" name="comuna" value={f.valores.comuna} onChange={f.cambiar} onBlur={f.salir}>
              <option value="">-- Seleccione la comuna --</option>
              {comunas.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Campo>
        </div>
        <Campo id="direccion" etiqueta="Dirección" error={f.errores.direccion}>{input('direccion', 'text', { autoComplete: 'street-address' })}</Campo>

        <button type="submit" className="btn btn-primary btn-block">Registrarme</button>
        <p className="form-footer-link">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
      </form>
    </div>
  )
}
