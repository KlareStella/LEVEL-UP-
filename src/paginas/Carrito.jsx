import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { formatCLP, precioFinal, rutaImagen } from '../utilidades/formato.js'

export function calcularTotales(carrito, productos, sesion, cuponAplicado) {
  const lineas = carrito
    .map((item) => ({ ...item, producto: productos.find((p) => p.codigo === item.codigo) }))
    .filter((l) => l.producto)
  const subtotal = lineas.reduce((suma, l) => suma + precioFinal(l.producto) * l.cantidad, 0)
  const tasa = sesion?.correo?.endsWith('@duoc.cl') || cuponAplicado ? 0.2 : 0
  return { lineas, subtotal, descuento: Math.round(subtotal * tasa), total: Math.round(subtotal * (1 - tasa)) }
}

export default function Carrito({ carrito, productos, sesion, onCambiar, onQuitar }) {
  const navegar = useNavigate()
  const [cupon, setCupon] = useState('')
  const [cuponAplicado, setCuponAplicado] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const { lineas, subtotal, descuento, total } = calcularTotales(carrito, productos, sesion, cuponAplicado)

  function aplicarCupon(e) {
    e.preventDefault()
    if (cupon.trim().toUpperCase() === 'LEVELUP20') { setCuponAplicado(true); setMensaje('Cupón aplicado: 20% de descuento.') }
    else setMensaje('Cupón no válido.')
  }

  return (
    <div className="container pagina">
      <div className="section-head"><div><h1>Mi carrito de compras</h1></div></div>

      {lineas.length === 0 ? (
        <div className="cart-empty">
          <h3>Tu carrito está vacío</h3>
          <p>Todavía no has añadido productos. ¡Explora el catálogo y arma tu setup!</p>
          <Link to="/catalogo" className="btn btn-primary">Ver productos</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div>
            {lineas.map(({ producto, cantidad }) => (
              <div className="cart-item" key={producto.codigo}>
                <img src={rutaImagen(producto.imagen)} alt={producto.nombre} />
                <div>
                  <Link to={`/producto/${producto.codigo}`} className="cart-item-name">{producto.nombre}</Link>
                  <p className="cart-item-price">{formatCLP(precioFinal(producto))} c/u</p>
                </div>
                <div className="qty-stepper">
                  <button type="button" onClick={() => onCambiar(producto.codigo, -1)}>−</button>
                  <input type="number" value={cantidad} min="1" readOnly />
                  <button type="button" onClick={() => onCambiar(producto.codigo, 1)}>+</button>
                </div>
                <div>
                  <p className="cell-strong">{formatCLP(precioFinal(producto) * cantidad)}</p>
                  <button type="button" className="cart-item-remove" onClick={() => onQuitar(producto.codigo)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>

          <aside className="cart-summary">
            <div className="cart-summary-row"><span>Subtotal</span><span>{formatCLP(subtotal)}</span></div>
            {descuento > 0 && <div className="cart-summary-row"><span>Descuento (20%)</span><span>− {formatCLP(descuento)}</span></div>}
            <div className="cart-summary-total"><span>Total</span><span>{formatCLP(total)}</span></div>

            <form onSubmit={aplicarCupon} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input type="text" placeholder="Código de descuento" value={cupon} onChange={(e) => setCupon(e.target.value)}
                style={{ flex: 1, minWidth: 0, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '9px 10px' }} />
              <button type="submit" className="btn btn-outline btn-sm">Aplicar</button>
            </form>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 20 }}>{mensaje}</p>

            <button type="button" className="btn btn-accent btn-block" onClick={() => navegar('/checkout')}>Pagar</button>
          </aside>
        </div>
      )}
    </div>
  )
}
