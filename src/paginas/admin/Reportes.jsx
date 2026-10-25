import { ordenesDB } from '../../datos/baseDatos.js'
import { formatCLP } from '../../utilidades/formato.js'

// Lógica pura (fácil de probar): resumen de ventas a partir de las órdenes pagadas.
export function resumenVentas(ordenes) {
  const pagadas = ordenes.filter((o) => o.estado === 'Pagada')
  const total = pagadas.reduce((s, o) => s + o.total, 0)
  const porCategoria = {}
  for (const o of pagadas) {
    for (const l of o.lineas) porCategoria[l.categoria] = (porCategoria[l.categoria] ?? 0) + l.precio * l.cantidad
  }
  return {
    ordenes: pagadas.length,
    rechazadas: ordenes.length - pagadas.length,
    total,
    ticketPromedio: pagadas.length ? Math.round(total / pagadas.length) : 0,
    porCategoria,
  }
}

// PÁGINA ADMIN: /admin/reportes
export default function Reportes() {
  const r = resumenVentas(ordenesDB.listar())
  return (
    <>
      <div className="admin-topbar"><div><h1>Reportes</h1><p className="breadcrumb">Ventas de la tienda</p></div></div>
      <div className="stat-grid">
        <div className="stat-card"><p className="stat-label">Órdenes pagadas</p><p className="stat-value">{r.ordenes}</p></div>
        <div className="stat-card"><p className="stat-label">Ventas totales</p><p className="stat-value accent-green">{formatCLP(r.total)}</p></div>
        <div className="stat-card"><p className="stat-label">Ticket promedio</p><p className="stat-value accent-blue">{formatCLP(r.ticketPromedio)}</p></div>
        <div className="stat-card"><p className="stat-label">Pagos rechazados</p><p className="stat-value accent-danger">{r.rechazadas}</p></div>
      </div>
      <div className="panel">
        <div className="panel-head"><h2>Ventas por categoría</h2></div>
        <div className="table-responsive">
          <table className="data-table">
            <thead><tr><th>Categoría</th><th>Ventas</th></tr></thead>
            <tbody>
              {Object.keys(r.porCategoria).length === 0 && <tr><td colSpan="2"><div className="empty-state">Aún no hay ventas registradas.</div></td></tr>}
              {Object.entries(r.porCategoria).map(([c, v]) => <tr key={c}><td>{c}</td><td>{formatCLP(v)}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
