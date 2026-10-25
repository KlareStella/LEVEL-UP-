import { Link } from 'react-router'

// Regla de negocio: un producto es crítico si su stock es menor o igual a su stock crítico.
export const esCritico = (p) => p.stockCritico > 0 && p.stock <= p.stockCritico

// PÁGINA ADMIN: /admin/productos/criticos — listado de productos con stock crítico.
export default function ProductosCriticos({ productos }) {
  const criticos = productos.filter(esCritico).sort((a, b) => a.stock - b.stock)
  return (
    <>
      <div className="admin-topbar"><div><h1>Productos críticos</h1><p className="breadcrumb"><Link to="/admin/productos">Productos</Link> / Stock crítico</p></div></div>
      <div className="panel">
        <div className="table-responsive">
          <table className="data-table">
            <thead><tr><th>Código</th><th>Nombre</th><th>Stock</th><th>Stock crítico</th></tr></thead>
            <tbody>
              {criticos.length === 0 && <tr><td colSpan="4"><div className="empty-state">No hay productos con stock crítico.</div></td></tr>}
              {criticos.map((p) => (
                <tr key={p.codigo}><td className="cell-strong">{p.codigo}</td><td>{p.nombre}</td><td className="stock-flag low">{p.stock}</td><td>{p.stockCritico}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
