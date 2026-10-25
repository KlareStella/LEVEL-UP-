import { useState } from 'react'
import { Link } from 'react-router'
import { formatCLP, precioFinal, rutaImagen, tieneOferta } from '../utilidades/formato.js'

export default function TarjetaProducto({ producto, onAgregar }) {
  const [agregado, setAgregado] = useState(false)
  const esServicio = producto.categoria === 'servicio-tecnico'
  const pocoStock = producto.stock > 0 && producto.stock <= producto.stockCritico
  const sinStock = producto.stock === 0 && !esServicio

  function agregar() {
    onAgregar(producto.codigo, 1)
    setAgregado(true)
    setTimeout(() => setAgregado(false), 1000) 
  }

  return (
    <article className="product-card h-100">
      <Link to={`/producto/${producto.codigo}`}>
        <div className="product-thumb">
          <img src={rutaImagen(producto.imagen)} alt={producto.nombre} loading="lazy" />
        </div>
      </Link>
      <div className="product-body">
        <span className="product-cat">{producto.categoriaLabel}</span>
        <Link className="product-name" to={`/producto/${producto.codigo}`}>{producto.nombre}</Link>
        {pocoStock && <span className="product-stock-warning">¡Quedan solo {producto.stock} unidades!</span>}
        {sinStock && <span className="product-stock-warning">Sin stock</span>}
        <span className="product-price">
          {tieneOferta(producto) && <small className="text-decoration-line-through text-secondary me-2">{formatCLP(producto.precio)}</small>}
          {formatCLP(precioFinal(producto))}
          {tieneOferta(producto) && <span className="badge text-bg-danger ms-2">-{producto.descuento}%</span>}
        </span>
      </div>
      <div className="product-actions">
        <button className="btn btn-primary btn-block btn-sm" onClick={agregar} disabled={sinStock}>
          {agregado ? '¡Añadido!' : 'Añadir al carrito'}
        </button>
      </div>
    </article>
  )
}
