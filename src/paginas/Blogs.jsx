import { Link } from 'react-router'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import { BLOG_POSTS } from '../datos/data.js'
import { rutaImagen } from '../utilidades/formato.js'

export default function Blogs() {
  return (
    <div className="container pagina">
      <div className="section-head">
        <div><h1>Noticias importantes</h1><p>Casos curiosos, novedades y guías del mundo gamer.</p></div>
      </div>
      <Row xs={1} md={2} className="g-4">
        {BLOG_POSTS.map((post) => (
          <Col key={post.id}>
            <article className="blog-card h-100">
              <img src={rutaImagen(post.imagen)} alt={post.titulo} />
              <div className="blog-card-body">
                <h3>{post.titulo}</h3>
                <p>{post.resumen}</p>
                <Link to={`/blogs/${post.id}`} className="btn btn-outline btn-sm">Ver caso</Link>
              </div>
            </article>
          </Col>
        ))}
      </Row>
    </div>
  )
}
