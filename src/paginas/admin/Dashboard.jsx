import { Link } from 'react-router'
import { leerUsuarios } from '../../utilidades/almacen.js'
import { ordenesDB } from '../../datos/baseDatos.js'
import { formatCLP } from '../../utilidades/formato.js'

// PÁGINA ADMIN: resumen general.
export default function Dashboard({ productos }) {
  const usuarios = leerUsuarios()
  const ordenes = ordenesDB.listar().filter((o) => o.estado === 'Pagada')
  const stockBajo = productos.filter((p) => p.stock > 0 && p.stock <= p.stockCritico).length
  const sinStock = productos.filter((p) => p.stock === 0).length
  const recientes = productos.slice(-5).reverse() // los últimos 5 cargados

  return (
    <>
      <div className="admin-topbar">
        <div><h1>Dashboard</h1><p className="breadcrumb">Resumen general de la tienda</p></div>
      </div>

      <div className="stat-grid">
        <div className="stat-card"><p className="stat-label">Productos activos</p><p className="stat-value">{productos.length}</p></div>
        <div className="stat-card"><p className="stat-label">Usuarios registrados</p><p className="stat-value accent-blue">{usuarios.length}</p></div>
        <div className="stat-card"><p className="stat-label">Stock bajo</p><p className="stat-value accent-danger">{stockBajo}</p></div>
        <div className="stat-card"><p className="stat-label">Órdenes pagadas</p><p className="stat-value">{ordenes.length}</p></div>
        <div className="stat-card"><p className="stat-label">Sin stock</p><p className="stat-value accent-green">{sinStock}</p></div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Últimos productos cargados</h2>
          <Link to="/admin/productos" className="btn btn-outline btn-sm">Ver todos</Link>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead><tr><th>Código</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Stock</th></tr></thead>
            <tbody>
              {recientes.map((p) => (
                <tr key={p.codigo}>
                  <td className="cell-strong">{p.codigo}</td>
                  <td>{p.nombre}</td>
                  <td>{p.categoriaLabel}</td>
                  <td>{formatCLP(p.precio)}</td>
                  <td className={`stock-flag${p.stock <= p.stockCritico ? ' low' : ''}`}>{p.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
