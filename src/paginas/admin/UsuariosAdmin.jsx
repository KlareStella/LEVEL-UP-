import { useState } from 'react'
import { Link } from 'react-router'
import Estado from '../../componentes/Estado.jsx'
import useRecurso from '../../hooks/useRecurso.js'
import { eliminarUsuario, listarUsuarios } from '../../servicios/usuarios.js'
import { mensajeError } from '../../servicios/api.js'

// PÁGINA ADMIN: listado de usuarios (solo Administrador; la ruta está dentro de <SoloAdmin />).
export default function UsuariosAdmin() {
  const { datos, cargando, error, recargar } = useRecurso(listarUsuarios)
  const [errorEliminar, setErrorEliminar] = useState('')
  const usuarios = datos ?? []

  async function eliminar(run) {
    if (!confirm('¿Eliminar este usuario?')) return
    try {
      await eliminarUsuario(run)
      setErrorEliminar('')
      recargar()
    } catch (err) {
      setErrorEliminar(mensajeError(err, 'No se pudo eliminar el usuario.'))
    }
  }

  return (
    <>
      <div className="admin-topbar">
        <div><h1>Usuarios</h1><p className="breadcrumb">Administra clientes, vendedores y administradores</p></div>
        <Link to="/admin/usuarios/nuevo" className="btn btn-primary">+ Nuevo usuario</Link>
      </div>

      {errorEliminar && <div className="form-alert is-visible is-error" role="alert">{errorEliminar}</div>}
      <div className="panel">
        <Estado cargando={cargando} error={error} onReintentar={recargar}>
        <div className="table-responsive">
          <table className="data-table">
            <thead><tr><th>RUN</th><th>Nombre</th><th>Correo</th><th>Rol</th><th>Acciones</th></tr></thead>
            <tbody>
              {usuarios.length === 0 && (
                <tr><td colSpan="5"><div className="empty-state">Aún no hay usuarios registrados.</div></td></tr>
              )}
              {usuarios.map((u) => (
                <tr key={u.run}>
                  <td className="cell-strong">{u.run}</td>
                  <td>{u.nombre} {u.apellidos}</td>
                  <td>{u.correo}</td>
                  <td><span className={`badge badge-role-${u.tipoUsuario}`}>{u.tipoUsuario}</span></td>
                  <td className="row-actions">
                    <Link to={`/admin/usuarios/${u.run}/editar`}>Editar</Link>
                    <Link to={`/admin/usuarios/${u.run}/historial`}>Historial</Link>
                    <button type="button" className="danger" onClick={() => eliminar(u.run)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </Estado>
      </div>
    </>
  )
}
