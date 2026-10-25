import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import GrillaProductos from '../componentes/GrillaProductos.jsx'
import { formatCLP, precioFinal, rutaImagen, tieneOferta } from '../utilidades/formato.js'

export default function DetalleProducto({ productos, onAgregar }) {
  const { id } = useParams() 
  const navegar = useNavigate()
  const [cantidad, setCantidad] = useState(1)
  const [agregado, setAgregado] = useState(false)

  const producto = productos.find((p) => p.codigo === id.toUpperCase())

  if (!producto) {
    return (
      <div className="container pagina">
        <div className="mensaje-vacio">
          <h2>No existe el producto «{id}»</h2>
          <p>Puede que el enlace esté mal escrito o que el producto ya no esté disponible.</p>
          <Link to="/catalogo" className="btn btn-primary">Ver catálogo</Link>
        </div>
      </div>
    )
  }

  const esServicio = producto.categoria === 'servicio-tecnico'
  const sinStock = producto.stock === 0 && !esServicio
  const pocoStock = !esServicio && producto.stock <= producto.stockCritico
  const maximo = producto.stock > 0 ? producto.stock : 99
  const relacionados = productos.filter((p) => p.categoria === producto.categoria && p.codigo !== producto.codigo).slice(0, 4)

  function agregar() {
    onAgregar(producto.codigo, cantidad)
    setAgregado(true)
    setTimeout(() => setAgregado(false), 1200)
  }
  function comprarAhora() {
    onAgregar(producto.codigo, cantidad)
    navegar('/carrito')
  }

  return (
    <div className="container pagina">
      <p className="breadcrumb">
        <Link to="/">Home</Link>&nbsp;/&nbsp;<Link to={`/catalogo?categoria=${producto.categoria}`}>{producto.categoriaLabel}</Link>&nbsp;/&nbsp;{producto.nombre}
      </p>
      <button type="button" className="btn btn-outline btn-sm mb-3" onClick={() => navegar(-1)}>← Volver</button>

      <div className="product-detail">
        <div className="product-detail-media"><img src={rutaImagen(producto.imagen)} alt={producto.nombre} /></div>
        <div className="product-detail-info">
          <span className="product-cat">{producto.categoriaLabel}</span>
          <h1>{producto.nombre}</h1>
          <p className="product-detail-price">
            {tieneOferta(producto) && <small className="text-decoration-line-through text-secondary me-2">{formatCLP(producto.precio)}</small>}
            {formatCLP(precioFinal(producto))}
            {tieneOferta(producto) && <span className="badge text-bg-danger ms-2">-{producto.descuento}%</span>}
          </p>
          <p>{producto.descripcion}</p>
          <p className={`stock-badge${sinStock || pocoStock ? ' low' : ''}`}>
            {sinStock ? 'SIN STOCK' : pocoStock ? `STOCK BAJO — quedan ${producto.stock} unidades` : `STOCK DISPONIBLE: ${esServicio ? 'agenda tu hora' : producto.stock}`}
          </p>
          <div className="qty-row">
            <div className="qty-stepper">
              <button type="button" onClick={() => setCantidad((c) => Math.max(1, c - 1))}>−</button>
              <input type="number" value={cantidad} min="1" readOnly />
              <button type="button" onClick={() => setCantidad((c) => Math.min(maximo, c + 1))}>+</button>
            </div>
            <button type="button" className="btn btn-primary" onClick={agregar} disabled={sinStock}>
              {sinStock ? 'Sin stock' : agregado ? '¡Añadido!' : 'Añadir al carrito'}
            </button>
            <button type="button" className="btn btn-accent" onClick={comprarAhora} disabled={sinStock}>Comprar ahora</button>
          </div>
        </div>
      </div>

      {relacionados.length > 0 && (
        <>
          <h2 style={{ marginTop: 56 }}>También te puede interesar</h2>
          <GrillaProductos productos={relacionados} onAgregar={onAgregar} />
        </>
      )}
    </div>
  )
}
