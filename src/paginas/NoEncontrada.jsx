import { Link, useLocation } from 'react-router'

export default function NoEncontrada() {
  const ubicacion = useLocation()
  return (
    <div className="container pagina">
      <div className="mensaje-vacio">
        <h1>404</h1>
        <p>No encontramos nada en <code>{ubicacion.pathname}</code></p>
        <Link to="/" className="btn btn-primary">Volver al inicio</Link>
      </div>
    </div>
  )
}
