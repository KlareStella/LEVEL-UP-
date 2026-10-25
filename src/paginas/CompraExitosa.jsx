import { Link, useParams } from 'react-router'
import { useState } from 'react'
import ResumenOrden from '../componentes/ResumenOrden.jsx'
import { ordenesDB } from '../datos/baseDatos.js'

export default function CompraExitosa() {
  const { id } = useParams()
  const orden = ordenesDB.obtener(id)
  const [aviso, setAviso] = useState('')

  if (!orden) return <div className="container pagina"><p className="mensaje-vacio">No existe la orden «{id}».</p><Link to="/catalogo" className="btn btn-primary">Ir al catálogo</Link></div>

  return (
    <div className="container pagina">
      <div className="panel">
        <p className="text-end text-secondary small mb-0">Código orden: {orden.id}</p>
        <h1 className="h3 text-success">✔ Se ha realizado la compra. N° {orden.id}</h1>
        <ResumenOrden orden={orden} />
        <div className="d-flex flex-wrap gap-2 justify-content-center mt-3">
          <button type="button" className="btn btn-danger btn-sm" onClick={() => window.print()}>Imprimir boleta en PDF</button>
          <button type="button" className="btn btn-success btn-sm" onClick={() => setAviso(`Boleta enviada a ${orden.cliente.correo} (simulado).`)}>Enviar boleta por email</button>
          <Link to="/catalogo" className="btn btn-outline btn-sm">Seguir comprando</Link>
        </div>
        {aviso && <p role="status" className="text-center mt-2 mb-0">{aviso}</p>}
      </div>
    </div>
  )
}
