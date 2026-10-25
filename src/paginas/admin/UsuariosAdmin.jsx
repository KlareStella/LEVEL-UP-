import { useState } from 'react'
import { Link } from 'react-router'
import { guardarUsuarios, leerUsuarios } from '../../utilidades/almacen.js'

// PÁGINA ADMIN: listado de usuarios (solo Administrador; la ruta está dentro de <SoloAdmin />).
export default function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState(leerUsuarios)

  function eliminar(run) {
    if (!confirm('¿Eliminar este usuario?')) return
    const restantes = usuarios.filter((u) => u.run !== run)
    guardarUsuarios(restantes)
    setUsuarios(restantes)
  }

  return (
    <>
      <div className="admin-topbar">
        <div><h1>Usuarios</h1><p className="breadcrumb">Administra clientes, vendedores y administradores</p></div>
        <Link to="/admin/usuarios/nuevo" className="btn btn-primary">+ Nuevo usuario</Link>
      </div>

      <div className="panel">
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
      </div>
    </>
  )
}
