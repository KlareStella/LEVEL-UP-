import { Link, useNavigate, useParams } from 'react-router'
import { BLOG_POSTS } from '../datos/data.js'
import { rutaImagen } from '../utilidades/formato.js'

export default function DetalleBlog() {
  const { id } = useParams()
  const navegar = useNavigate()
  const post = BLOG_POSTS.find((p) => p.id === Number(id))

  if (!post) {
    return (
      <div className="container pagina">
        <div className="mensaje-vacio">
          <h2>No existe el blog {id}</h2>
          <Link to="/blogs" className="btn btn-primary">Volver a blogs</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container pagina">
      <p className="breadcrumb"><Link to="/">Home</Link>&nbsp;/&nbsp;<Link to="/blogs">Blogs</Link>&nbsp;/&nbsp;Detalle</p>
      <article className="blog-article">
        <p className="blog-article-meta">Level-Up Gamer · Noticias</p>
        <h1>{post.titulo}</h1>
        <img src={rutaImagen(post.imagen)} alt={post.titulo} />
        <p>{post.contenido}</p>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => navegar('/blogs')}>← Volver a blogs</button>
      </article>
    </div>
  )
}
