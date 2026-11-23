import { Link, useParams } from 'react-router'
import Estado from '../../componentes/Estado.jsx'
import useRecurso from '../../hooks/useRecurso.js'
import { listarOrdenes } from '../../servicios/ordenes.js'
import { obtenerUsuario } from '../../servicios/usuarios.js'
import { formatCLP } from '../../utilidades/formato.js'

// PÁGINA ADMIN: /admin/usuarios/:run/historial — órdenes asociadas a un usuario.
export default function HistorialCompras() {
  const { run } = useParams()
  const { datos, cargando, error, recargar } = useRecurso(() => Promise.all([obtenerUsuario(run), listarOrdenes()]), [run])
  const [usuario, todas] = datos ?? [null, []]
  const ordenes = todas.filter((o) => o.run === run)
  return (
    <>
      <div className="admin-topbar"><div><h1>Historial de compras</h1><p className="breadcrumb"><Link to="/admin/usuarios">Usuarios</Link> / {usuario ? `${usuario.nombre} ${usuario.apellidos}` : run}</p></div></div>
      <div className="panel">
        <Estado cargando={cargando} error={error} onReintentar={recargar}>
        <div className="table-responsive">
          <table className="data-table">
            <thead><tr><th>N°</th><th>Fecha</th><th>Total</th><th>Estado</th></tr></thead>
            <tbody>
              {ordenes.length === 0 && <tr><td colSpan="4"><div className="empty-state">Este usuario aún no tiene compras.</div></td></tr>}
              {ordenes.map((o) => (
                <tr key={o.id}><td><Link to={`/admin/ordenes/${o.id}`}>{o.id}</Link></td><td>{new Date(o.fecha).toLocaleDateString('es-CL')}</td><td>{formatCLP(o.total)}</td><td>{o.estado}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        </Estado>
      </div>
    </>
  )
}
