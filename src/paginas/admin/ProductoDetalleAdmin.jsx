import { Link, useParams } from 'react-router'
import { formatCLP, precioFinal, rutaImagen, tieneOferta } from '../../utilidades/formato.js'

// PÁGINA ADMIN: /admin/productos/:codigo — detalle de solo lectura (Administrador y Vendedor).
export default function ProductoDetalleAdmin({ productos }) {
  const { codigo } = useParams()
  const p = productos.find((x) => x.codigo === codigo)

  if (!p) {
    return (
      <div className="panel">
        <div className="empty-state">
          <p>No existe el producto «{codigo}».</p>
          <Link to="/admin/productos" className="btn btn-primary">Volver a productos</Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="admin-topbar"><div><h1>{p.nombre}</h1><p className="breadcrumb"><Link to="/admin/productos">Productos</Link> / {p.codigo}</p></div></div>
      <div className="panel">
        <div className="d-flex flex-wrap gap-4">
          {p.imagen && <img src={rutaImagen(p.imagen)} alt={p.nombre} style={{ width: 220, maxWidth: '100%', objectFit: 'cover', borderRadius: 8 }} />}
          <dl className="row mb-0" style={{ flex: 1, minWidth: 260 }}>
            <dt className="col-sm-4">Código</dt><dd className="col-sm-8">{p.codigo}</dd>
            <dt className="col-sm-4">Categoría</dt><dd className="col-sm-8">{p.categoriaLabel ?? p.categoria}</dd>
            <dt className="col-sm-4">Precio</dt><dd className="col-sm-8">{formatCLP(p.precio)}</dd>
            {tieneOferta(p) && (<><dt className="col-sm-4">Oferta</dt><dd className="col-sm-8">{p.descuento}% → {formatCLP(precioFinal(p))}</dd></>)}
            <dt className="col-sm-4">Stock</dt><dd className="col-sm-8">{p.stock}</dd>
            <dt className="col-sm-4">Stock crítico</dt><dd className="col-sm-8">{p.stockCritico ?? 0}</dd>
            <dt className="col-sm-4">Descripción</dt><dd className="col-sm-8">{p.descripcion || '—'}</dd>
          </dl>
        </div>
      </div>
    </>
  )
}
