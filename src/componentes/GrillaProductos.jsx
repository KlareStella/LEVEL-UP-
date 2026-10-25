import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import TarjetaProducto from './TarjetaProducto.jsx'

export default function GrillaProductos({ productos, onAgregar, xl = 4 }) {
  return (
    <Row xs={1} sm={2} lg={3} xl={xl} className="g-3">
      {productos.map((p) => (
        <Col key={p.codigo}>
          <TarjetaProducto producto={p} onAgregar={onAgregar} />
        </Col>
      ))}
    </Row>
  )
}
