import { useState } from 'react'
import { Link, NavLink } from 'react-router'
import Container from 'react-bootstrap/Container'
import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'


export default function BarraNavegacion({ totalCarrito, sesion, onSalir }) {
  const [abierta, setAbierta] = useState(false)
  const cerrar = () => setAbierta(false)
  const esPersonal = sesion && (sesion.tipoUsuario === 'Administrador' || sesion.tipoUsuario === 'Vendedor')

  return (
    <Navbar expand="lg" sticky="top" expanded={abierta} onToggle={setAbierta} data-bs-theme="dark">
      <Container>
        <Navbar.Brand as={Link} to="/" className="brand" onClick={cerrar}>
          <span className="brand-mark" aria-hidden="true"></span>Level-Up Gamer
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="menu-principal" aria-label="Abrir menú" />
        <Navbar.Collapse id="menu-principal">
          <Nav className="me-auto">
            {}
            <Nav.Link as={NavLink} to="/" end onClick={cerrar}>Home</Nav.Link>
            <Nav.Link as={NavLink} to="/catalogo" onClick={cerrar}>Productos</Nav.Link>
            <Nav.Link as={NavLink} to="/categorias" onClick={cerrar}>Categorías</Nav.Link>
            <Nav.Link as={NavLink} to="/ofertas" onClick={cerrar}>Ofertas</Nav.Link>
            <Nav.Link as={NavLink} to="/nosotros" onClick={cerrar}>Nosotros</Nav.Link>
            <Nav.Link as={NavLink} to="/blogs" onClick={cerrar}>Blogs</Nav.Link>
            <Nav.Link as={NavLink} to="/contacto" onClick={cerrar}>Contacto</Nav.Link>
          </Nav>
          <div className="nav-actions">
            {sesion ? (
              <span className="user-pill">
                Hola, <strong>{sesion.nombre}</strong> ·
                {esPersonal && <Link to="/admin" onClick={cerrar}>Panel</Link>}
                <button type="button" onClick={() => { cerrar(); onSalir() }}>Salir</button>
              </span>
            ) : (
              <Link to="/login" className="btn btn-outline btn-sm" onClick={cerrar}>Iniciar sesión</Link>
            )}
            <Link to="/carrito" className="cart-link" aria-label="Ver carrito" onClick={cerrar}>
              🛒 <span className="cart-count">{totalCarrito}</span>
            </Link>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}
