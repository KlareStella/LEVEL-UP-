import { Link, useParams } from 'react-router'
import ResumenOrden from '../componentes/ResumenOrden.jsx'
import { ordenesDB } from '../datos/baseDatos.js'

export default function CompraError() {
  const { id } = useParams()
  const orden = ordenesDB.obtener(id)

  if (!orden) return <div className="container pagina"><p className="mensaje-vacio">No existe la orden «{id}».</p><Link to="/carrito" className="btn btn-primary">Volver al carrito</Link></div>

  return (
    <div className="container pagina">
      <div className="panel">
        <h1 className="h3 text-danger">✖ No se pudo realizar el pago. N° {orden.id}</h1>
        {orden.motivo && <p className="text-secondary">{orden.motivo}</p>}
        <div className="text-center my-3"><Link to="/checkout" className="btn btn-success">VOLVER A REALIZAR EL PAGO</Link></div>
        <ResumenOrden orden={orden} />
      </div>
    </div>
  )
}
