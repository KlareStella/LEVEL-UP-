import { Link, useNavigate, useParams } from 'react-router'
import Campo from '../../componentes/Campo.jsx'
import useFormulario from '../../hooks/useFormulario.js'
import { REGIONES_COMUNAS } from '../../datos/data.js'
import { guardarUsuarios, leerUsuarios } from '../../utilidades/almacen.js'
import { correoValido, maximo, minimo, requerido, runValido } from '../../utilidades/validaciones.js'

// PÁGINA ADMIN: /admin/usuarios/nuevo  y  /admin/usuarios/:run/editar
export default function UsuarioForm() {
  const { run } = useParams()
  const usuarios = leerUsuarios()
  const existente = run ? usuarios.find((u) => u.run === run) : null

  if (run && !existente) {
    return (
      <div className="panel">
        <div className="empty-state">
          <p>No existe el usuario «{run}».</p>
          <Link to="/admin/usuarios" className="btn btn-primary">Volver a usuarios</Link>
        </div>
      </div>
    )
  }
  return <FormularioUsuario key={run ?? 'nuevo'} existente={existente} usuarios={usuarios} />
}

function FormularioUsuario({ existente, usuarios }) {
  const navegar = useNavigate()
  const esEdicion = Boolean(existente)

  const inicial = existente
    ? { run: existente.run, tipoUsuario: existente.tipoUsuario, nombre: existente.nombre, apellidos: existente.apellidos, correo: existente.correo,
        fechaNacimiento: existente.fechaNacimiento || '', region: existente.region || '', comuna: existente.comuna || '', direccion: existente.direccion || '' }
    : { run: '', tipoUsuario: '', nombre: '', apellidos: '', correo: '', fechaNacimiento: '', region: '', comuna: '', direccion: '' }

  const reglas = {
    run: (v) => esEdicion ? null
      : !requerido(v) ? 'El RUN es obligatorio.'
      : !minimo(v, 7) || !maximo(v, 9) ? 'Debe tener entre 7 y 9 caracteres.'
      : !runValido(v) ? 'RUN inválido (sin puntos ni guion).'
      : usuarios.some((u) => u.run === v.trim().toUpperCase()) ? 'Ya existe un usuario con ese RUN.' : null,
    tipoUsuario: (v) => requerido(v) ? null : 'Selecciona un tipo de usuario.',
    nombre: (v) => !requerido(v) ? 'El nombre es obligatorio.' : !maximo(v, 50) ? 'Máximo 50 caracteres.' : null,
    apellidos: (v) => !requerido(v) ? 'Los apellidos son obligatorios.' : !maximo(v, 100) ? 'Máximo 100 caracteres.' : null,
    correo: (v) => !requerido(v) ? 'El correo es obligatorio.'
      : !maximo(v, 100) ? 'Máximo 100 caracteres.'
      : !correoValido(v) ? 'Usa un correo @duoc.cl, @profesor.duoc.cl o @gmail.com.'
      : usuarios.some((u) => u.correo.toLowerCase() === v.trim().toLowerCase() && u.run !== existente?.run) ? 'Ya existe un usuario con ese correo.' : null,
    direccion: (v) => !requerido(v) ? 'La dirección es obligatoria.' : !maximo(v, 300) ? 'Máximo 300 caracteres.' : null,
  }
  const f = useFormulario(inicial, reglas)
  const v = f.valores
  const comunas = REGIONES_COMUNAS[v.region] ?? []

  function guardar(e) {
    e.preventDefault()
    if (!f.validarTodo()) return
    const datos = {
      run: esEdicion ? existente.run : v.run.trim().toUpperCase(),
      nombre: v.nombre.trim(),
      apellidos: v.apellidos.trim(),
      correo: v.correo.trim(),
      password: existente ? existente.password : 'levelup2026', // contraseña inicial de los usuarios nuevos
      fechaNacimiento: v.fechaNacimiento,
      tipoUsuario: v.tipoUsuario,
      region: v.region,
      comuna: v.comuna,
      direccion: v.direccion.trim(),
    }
    guardarUsuarios(esEdicion
      ? usuarios.map((u) => (u.run === existente.run ? { ...u, ...datos } : u))
      : [...usuarios, datos])
    navegar('/admin/usuarios')
  }

  const campo = (name, tipo = 'text', extra = {}) => (
    <input id={name} name={name} type={tipo} value={v[name]} onChange={f.cambiar} onBlur={f.salir} {...extra} />
  )

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>{esEdicion ? 'Editar usuario' : 'Nuevo usuario'}</h1>
          <p className="breadcrumb"><Link to="/admin/usuarios">Usuarios</Link> / Formulario</p>
        </div>
      </div>

      <form className="panel" onSubmit={guardar} noValidate style={{ maxWidth: 640 }}>
        <div className="field-row">
          <Campo id="run" etiqueta="RUN (sin puntos ni guion)" error={f.errores.run} pista="Entre 7 y 9 caracteres.">
            {campo('run', 'text', { placeholder: '123456785', autoComplete: 'off', disabled: esEdicion })}
          </Campo>
          <Campo id="tipoUsuario" etiqueta="Tipo de usuario" error={f.errores.tipoUsuario}>
            <select id="tipoUsuario" name="tipoUsuario" value={v.tipoUsuario} onChange={f.cambiar} onBlur={f.salir}>
              <option value="">-- Seleccione --</option>
              <option value="Administrador">Administrador</option>
              <option value="Vendedor">Vendedor</option>
              <option value="Cliente">Cliente</option>
            </select>
          </Campo>
        </div>

        <div className="field-row">
          <Campo id="nombre" etiqueta="Nombre" error={f.errores.nombre}>{campo('nombre', 'text', { autoComplete: 'given-name' })}</Campo>
          <Campo id="apellidos" etiqueta="Apellidos" error={f.errores.apellidos}>{campo('apellidos', 'text', { autoComplete: 'family-name' })}</Campo>
        </div>

        <Campo id="correo" etiqueta="Correo electrónico" error={f.errores.correo} pista="Solo @duoc.cl, @profesor.duoc.cl o @gmail.com">
          {campo('correo', 'email', { autoComplete: 'email' })}
        </Campo>

        <Campo id="fechaNacimiento" etiqueta="Fecha de nacimiento (opcional)">{campo('fechaNacimiento', 'date')}</Campo>

        <div className="field-row">
          <Campo id="region" etiqueta="Región">
            {/* Al cambiar la región se vacía la comuna, porque depende de ella */}
            <select id="region" name="region" value={v.region} onChange={(e) => f.setValores((x) => ({ ...x, region: e.target.value, comuna: '' }))}>
              <option value="">-- Seleccione la región --</option>
              {Object.keys(REGIONES_COMUNAS).map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Campo>
          <Campo id="comuna" etiqueta="Comuna">
            <select id="comuna" name="comuna" value={v.comuna} onChange={f.cambiar}>
              <option value="">-- Seleccione la comuna --</option>
              {comunas.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Campo>
        </div>

        <Campo id="direccion" etiqueta="Dirección" error={f.errores.direccion}>{campo('direccion', 'text', { autoComplete: 'street-address' })}</Campo>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button type="submit" className="btn btn-primary">Guardar usuario</button>
          <Link to="/admin/usuarios" className="btn btn-outline">Cancelar</Link>
        </div>
      </form>
    </>
  )
}
