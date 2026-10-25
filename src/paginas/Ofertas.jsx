import GrillaProductos from '../componentes/GrillaProductos.jsx'
import { tieneOferta } from '../utilidades/formato.js'

export default function Ofertas({ productos, onAgregar }) {
  const ofertas = productos.filter(tieneOferta)
  return (
    <div className="container pagina">
      <div className="section-head"><div><h1>Ofertas</h1><p>{ofertas.length} producto{ofertas.length === 1 ? '' : 's'} con descuento</p></div></div>
      {ofertas.length ? <GrillaProductos productos={ofertas} onAgregar={onAgregar} /> : <p className="mensaje-vacio">Por ahora no hay productos en oferta.</p>}
    </div>
  )
}
