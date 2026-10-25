import { useState } from 'react'
import { Link } from 'react-router'


export default function PiePagina() {
  const [correo, setCorreo] = useState('')
  const [mensaje, setMensaje] = useState('')

  function suscribir(e) {
    e.preventDefault()
    if (correo.trim()) {
      setMensaje('¡Gracias por suscribirte!')
      setCorreo('')
    }
  }

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link to="/" className="brand"><span className="brand-mark" aria-hidden="true"></span>Level-Up Gamer</Link>
            <p style={{ marginTop: 14 }}>Tienda online dedicada a satisfacer las necesidades de los entusiastas de los videojuegos en Chile.</p>
          </div>
          <div>
            <h4>Tienda</h4>
            <ul>
              <li><Link to="/catalogo">Productos</Link></li>
              <li><Link to="/carrito">Mi carrito</Link></li>
              <li><Link to="/registro">Crear cuenta</Link></li>
            </ul>
          </div>
          <div>
            <h4>Empresa</h4>
            <ul>
              <li><Link to="/nosotros">Nosotros</Link></li>
              <li><Link to="/blogs">Blogs</Link></li>
              <li><Link to="/contacto">Contacto</Link></li>
            </ul>
          </div>
          <div>
            <h4>Únete a la comunidad</h4>
            <p>Novedades, lanzamientos y ofertas exclusivas.</p>
            <form className="footer-newsletter" onSubmit={suscribir}>
              <input type="email" placeholder="tu@correo.com" required aria-label="Correo electrónico" value={correo} onChange={(e) => setCorreo(e.target.value)} />
              <button type="submit" className="btn btn-accent btn-sm">Unirme</button>
            </form>
            <p style={{ fontSize: '0.8rem', marginTop: 8 }}>{mensaje}</p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Level-Up Gamer. Todos los derechos reservados.</span>
          <span>Proyecto académico DSY1104 · DuocUC</span>
        </div>
      </div>
    </footer>
  )
}
