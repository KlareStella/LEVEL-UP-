import { useState } from 'react'
import { Link } from 'react-router'
import { eliminarProducto } from '../../servicios/productos.js'
import { mensajeError } from '../../servicios/api.js'
import { formatCLP } from '../../utilidades/formato.js'

// PÁGINA ADMIN: listado de productos.
// El Administrador crea, edita y elimina; el Vendedor solo ve la lista y el detalle.
export default function ProductosAdmin({ productos, sesion, onCambio }) {
  const puedeEditar = sesion.tipoUsuario === 'Administrador'
  const [error, setError] = useState('')

  async function eliminar(codigo) {
    if (!confirm('¿Eliminar este producto del catálogo?')) return
    try {
      await eliminarProducto(codigo)
      setError('')
      await onCambio?.()
    } catch (err) {
      setError(mensajeError(err, 'No se pudo eliminar el producto.'))
    }
  }

  return (
    <>
      <div className="admin-topbar">
        <div><h1>Productos</h1><p className="breadcrumb">{puedeEditar ? 'Gestiona el catálogo de la tienda' : 'Catálogo de la tienda (solo consulta)'}</p></div>
        {puedeEditar && <Link to="/admin/productos/nuevo" className="btn btn-primary">+ Nuevo producto</Link>}
      </div>
      {error && <div className="form-alert is-visible is-error" role="alert">{error}</div>}

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
                    <Link to={`/admin/productos/${p.codigo}`}>Ver detalle</Link>
                    {puedeEditar && (
                      <>
                        <Link to={`/admin/productos/${p.codigo}/editar`}>Editar</Link>
                        <button type="button" className="danger" onClick={() => eliminar(p.codigo)}>Eliminar</button>
                      </>
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
