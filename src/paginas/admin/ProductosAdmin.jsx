import { Link } from 'react-router'
import { formatCLP } from '../../utilidades/formato.js'

// PÁGINA ADMIN: listado de productos. El Vendedor solo lo ve (solo lectura).
export default function ProductosAdmin({ productos, setProductos, sesion }) {
  const puedeEditar = sesion.tipoUsuario === 'Administrador'

  function eliminar(codigo) {
    if (!confirm('¿Eliminar este producto del catálogo?')) return
    setProductos((lista) => lista.filter((p) => p.codigo !== codigo))
  }

  return (
    <>
      <div className="admin-topbar">
        <div><h1>Productos</h1><p className="breadcrumb">Gestiona el catálogo de la tienda</p></div>
        {puedeEditar && <Link to="/admin/productos/nuevo" className="btn btn-primary">+ Nuevo producto</Link>}
      </div>

      <div className="panel">
        <div className="table-responsive">
          <table className="data-table">
            <thead><tr><th>Código</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Acciones</th></tr></thead>
            <tbody>
              {productos.length === 0 && (
                <tr><td colSpan="6"><div className="empty-state">Aún no hay productos cargados.</div></td></tr>
              )}
              {productos.map((p) => (
                <tr key={p.codigo}>
                  <td className="cell-strong">{p.codigo}</td>
                  <td>{p.nombre}</td>
                  <td>{p.categoriaLabel}</td>
                  <td>{formatCLP(p.precio)}</td>
                  <td className={`stock-flag${p.stock <= p.stockCritico ? ' low' : ''}`}>{p.stock}</td>
                  <td className="row-actions">
                    {puedeEditar ? (
                      <>
                        <Link to={`/admin/productos/${p.codigo}/editar`}>Editar</Link>
                        <button type="button" className="danger" onClick={() => eliminar(p.codigo)}>Eliminar</button>
                      </>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Solo lectura</span>
                    )}
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
