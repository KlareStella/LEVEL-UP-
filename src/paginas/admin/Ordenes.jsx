import { Link, useParams } from 'react-router'
import ResumenOrden from '../../componentes/ResumenOrden.jsx'
import Estado from '../../componentes/Estado.jsx'
import useRecurso from '../../hooks/useRecurso.js'
import { listarOrdenes, obtenerOrden } from '../../servicios/ordenes.js'
import { formatCLP } from '../../utilidades/formato.js'

// PÁGINA ADMIN: /admin/ordenes (listado) y /admin/ordenes/:id (mostrar boleta).
export default function Ordenes() {
  const { id } = useParams()
  // Sin :id carga el listado; con :id carga la boleta de esa orden.
  const { datos, cargando, error, recargar } = useRecurso(() => (id ? obtenerOrden(id) : listarOrdenes()), [id])

  if (id) {
    const orden = datos
    return (
      <>
        <div className="admin-topbar"><div><h1>Boleta {id}</h1><p className="breadcrumb"><Link to="/admin/ordenes">Órdenes</Link> / Boleta</p></div></div>
        <div className="panel">
          <Estado cargando={cargando} error={error} onReintentar={recargar}>
            {orden ? <ResumenOrden orden={orden} /> : <div className="empty-state">No existe la orden «{id}».</div>}
          </Estado>
        </div>
      </>
    )
  }

  const ordenes = [...(datos ?? [])].reverse()
  return (
    <>
      <div className="admin-topbar"><div><h1>Órdenes / Boletas</h1><p className="breadcrumb">Compras realizadas en la tienda</p></div></div>
      <div className="panel">
        <Estado cargando={cargando} error={error} onReintentar={recargar}>
        <div className="table-responsive">
          <table className="data-table">
            <thead><tr><th>N°</th><th>Fecha</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {ordenes.length === 0 && <tr><td colSpan="6"><div className="empty-state">Aún no hay órdenes.</div></td></tr>}
              {ordenes.map((o) => (
                <tr key={o.id}>
                  <td className="cell-strong">{o.id}</td>
                  <td>{new Date(o.fecha).toLocaleDateString('es-CL')}</td>
                  <td>{o.cliente.nombre} {o.cliente.apellidos}</td>
                  <td>{formatCLP(o.total)}</td>
                  <td><span className={`badge ${o.estado === 'Pagada' ? 'text-bg-success' : 'text-bg-danger'}`}>{o.estado}</span></td>
                  <td className="row-actions"><Link to={`/admin/ordenes/${o.id}`}>Ver boleta</Link></td>
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
