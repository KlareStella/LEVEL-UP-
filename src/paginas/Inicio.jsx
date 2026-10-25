import { Link } from 'react-router'
import GrillaProductos from '../componentes/GrillaProductos.jsx'
import { rutaImagen } from '../utilidades/formato.js'

const VALORES = [
  { titulo: 'Despacho a todo Chile', texto: 'Enviamos tu pedido desde Arica a Punta Arenas, con seguimiento en línea.' },
  { titulo: 'Programa LevelUp', texto: 'Suma puntos por cada compra y por referir amigos, y canjéalos por descuentos.' },
  { titulo: 'Soporte técnico real', texto: 'Un equipo gamer respondiendo tus dudas antes y después de la compra.' },
]

export default function Inicio({ productos, onAgregar }) {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="hero-eyebrow">TIENDA ONLINE PARA GAMERS EN CHILE</p>
            <h1>Sube de nivel tu setup, sin salir de casa.</h1>
            <p className="hero-lead">
              Consolas, computadores, sillas y accesorios gamer con despacho a todo Chile.
              Regístrate con tu correo @duoc.cl y obtén 20% de descuento de por vida.
            </p>
            <div className="hero-actions">
              <Link to="/catalogo" className="btn btn-primary">Ver productos</Link>
              <Link to="/registro" className="btn btn-outline">Crear cuenta</Link>
            </div>
          </div>
          <div className="hero-figure">
            <img src={rutaImagen('pictures/accesorios-gaming.png')} alt="Setup gamer con luces RGB" />
            <div className="corner-frame" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="section-head">
          <div>
            <h2>Productos destacados</h2>
            <p>Lo más buscado por la comunidad esta semana.</p>
          </div>
          <Link to="/catalogo" className="btn btn-outline btn-sm">Ver todo el catálogo</Link>
        </div>
        <GrillaProductos productos={productos.slice(0, 8)} onAgregar={onAgregar} />
      </section>

      <section className="container">
        <div className="row row-cols-1 row-cols-md-3 g-3">
          {VALORES.map((v) => (
            <div className="col" key={v.titulo}>
              <div className="value-card h-100"><h3>{v.titulo}</h3><p>{v.texto}</p></div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
