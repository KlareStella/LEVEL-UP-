import { useState } from 'react'
import Campo from '../../componentes/Campo.jsx'
import { usuariosDB } from '../../datos/baseDatos.js'
import { guardarSesion } from '../../utilidades/almacen.js'
import { maximo, requerido } from '../../utilidades/validaciones.js'

// PÁGINA ADMIN: /admin/perfil — el usuario con sesión edita su nombre, apellidos y dirección.
export default function Perfil({ sesion, onActualizar }) {
  const [nombre, setNombre] = useState(sesion.nombre)
  const [apellidos, setApellidos] = useState(sesion.apellidos ?? '')
  const [direccion, setDireccion] = useState(sesion.direccion ?? '')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  function guardar(e) {
    e.preventDefault()
    if (!requerido(nombre) || !requerido(apellidos)) return setError('Nombre y apellidos son obligatorios.')
    if (!maximo(nombre, 50) || !maximo(apellidos, 100) || !maximo(direccion, 300)) return setError('Revisa el largo máximo de los campos.')
    const cambios = { nombre: nombre.trim(), apellidos: apellidos.trim(), direccion: direccion.trim() }
    usuariosDB.actualizar(sesion.run, cambios)
    onActualizar({ ...sesion, ...cambios })
    setError(''); setMensaje('Perfil actualizado.')
  }

  return (
    <>
      <div className="admin-topbar"><div><h1>Mi perfil</h1><p className="breadcrumb">{sesion.correo} · {sesion.tipoUsuario}</p></div></div>
      <form className="panel" onSubmit={guardar} noValidate style={{ maxWidth: 560 }}>
        {error && <div className="form-alert is-visible is-error" role="alert">{error}</div>}
        {mensaje && <div className="form-alert is-visible" role="status">{mensaje}</div>}
        <Campo id="perfil-nombre" etiqueta="Nombre"><input id="perfil-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} /></Campo>
        <Campo id="perfil-apellidos" etiqueta="Apellidos"><input id="perfil-apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value)} /></Campo>
        <Campo id="perfil-direccion" etiqueta="Dirección"><input id="perfil-direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} /></Campo>
        <button type="submit" className="btn btn-primary">Guardar perfil</button>
      </form>
    </>
  )
}
