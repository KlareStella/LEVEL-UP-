import { Link, useParams } from 'react-router'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import GrillaProductos from '../componentes/GrillaProductos.jsx'
import { categoriasDB } from '../datos/baseDatos.js'

export default function Categorias({ productos, onAgregar }) {
  const { valor } = useParams()
  const categorias = categoriasDB.listar()
  const actual = categorias.find((c) => c.value === valor)
  const lista = actual ? productos.filter((p) => p.categoria === actual.value) : []

  return (
    <div className="container pagina">
      <div className="section-head"><div><h1>Categorías</h1><p>Elige una categoría para ver sus productos.</p></div></div>
      <Row xs={2} md={3} lg={5} className="g-3 mb-4">
        {categorias.map((c) => (
          <Col key={c.value}>
            <Link to={`/categorias/${c.value}`} className={`d-block text-center p-3 border rounded h-100${c.value === valor ? ' border-primary' : ''}`}>
              {c.label}<br /><small className="text-secondary">{productos.filter((p) => p.categoria === c.value).length} productos</small>
            </Link>
          </Col>
        ))}
      </Row>
      {valor && !actual && <p className="mensaje-vacio">La categoría «{valor}» no existe.</p>}
      {actual && (
        <>
          <h2>{actual.label}</h2>
          {lista.length ? <GrillaProductos productos={lista} onAgregar={onAgregar} /> : <p className="mensaje-vacio">Esta categoría aún no tiene productos.</p>}
        </>
      )}
    </div>
  )
}
