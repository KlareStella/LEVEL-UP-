import Table from 'react-bootstrap/Table'
import { formatCLP, rutaImagen } from '../utilidades/formato.js'

export default function ResumenOrden({ orden }) {
  const { cliente, direccion, lineas } = orden
  return (
    <div className="resumen-orden">
      <dl className="row mb-3">
        <dt className="col-sm-3">Cliente</dt>
        <dd className="col-sm-9">{cliente.nombre} {cliente.apellidos} · {cliente.correo}</dd>
        <dt className="col-sm-3">Entrega</dt>
        <dd className="col-sm-9">
          {direccion.calle}{direccion.departamento ? `, ${direccion.departamento}` : ''} — {direccion.comuna}, {direccion.region}
        </dd>
        {direccion.indicaciones && (<><dt className="col-sm-3">Indicaciones</dt><dd className="col-sm-9">{direccion.indicaciones}</dd></>)}
      </dl>

      <div className="table-responsive">
        <Table size="sm" className="align-middle">
          <thead><tr><th>Imagen</th><th>Nombre</th><th className="text-end">Precio</th><th className="text-end">Cant.</th><th className="text-end">Subtotal</th></tr></thead>
          <tbody>
            {lineas.map((l) => (
              <tr key={l.codigo}>
                <td><img src={rutaImagen(l.imagen)} alt={l.nombre} width="40" height="40" style={{ objectFit: 'cover' }} /></td>
                <td>{l.nombre}</td>
                <td className="text-end">{formatCLP(l.precio)}</td>
                <td className="text-end">{l.cantidad}</td>
                <td className="text-end">{formatCLP(l.precio * l.cantidad)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <div className="text-end">
        {orden.descuento > 0 && <p className="mb-1">Descuento: − {formatCLP(orden.descuento)}</p>}
        <p className="fs-5 fw-bold mb-0">Total {orden.estado === 'Pagada' ? 'pagado' : 'a pagar'}: {formatCLP(orden.total)}</p>
      </div>
    </div>
  )
}
