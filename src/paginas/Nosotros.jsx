import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import { rutaImagen } from '../utilidades/formato.js'

const EQUIPO = [
  { nombre: 'Camila Herrera', cargo: 'Fundadora & Directora', foto: 'pictures/attractive-student-answering-during-lecture-260nw-1054211462.png', alt: 'Fundadora de Level-Up Gamer' },
  { nombre: 'Matías Cárdenas', cargo: 'Desarrollo Web', foto: 'pictures/im-looking-for-more-stock-photos-of-this-guy-with-different-v0-cjiwwbj1eu9f1.png', alt: 'Desarrollador de Level-Up Gamer' },
  { nombre: 'Josefina Muñoz', cargo: 'Comunidad & Soporte', foto: 'pictures/happy-beautiful-warm-hearted-young-dark-skinned-female-wearing-big-round-spectacles_273609-13868.png', alt: 'Encargada de Comunidad de Level-Up Gamer' },
]

export default function Nosotros() {
  return (
    <>
      <section className="container" style={{ paddingTop: 56 }}>
        <div className="two-col">
          <div>
            <p className="hero-eyebrow">NUESTRA HISTORIA</p>
            <h1>Nacimos para que ningún gamer chileno se quede sin su setup.</h1>
            <p>
              Level-Up Gamer es una tienda online dedicada a satisfacer las necesidades de los entusiastas
              de los videojuegos en Chile. Lanzada hace dos años como respuesta a la creciente demanda
              durante la pandemia, ofrecemos una amplia gama de productos para gamers, desde consolas y
              accesorios hasta computadores y sillas especializadas. Aunque no contamos con una ubicación
              física, realizamos despachos a todo el país.
            </p>
            <p>
              Nuestra misión es proporcionar productos de alta calidad para gamers en todo Chile,
              ofreciendo una experiencia de compra única y personalizada, con foco en la satisfacción
              del cliente y el crecimiento de la comunidad gamer.
            </p>
          </div>
          <div className="hero-figure">
            <img src={rutaImagen('pictures/images.jpg')} alt="Equipo trabajando en la tienda Level-Up Gamer" />
          </div>
        </div>
      </section>

      <section className="container">
        <div className="section-head"><div><h2>Nuestra visión</h2><p>A dónde queremos llegar como comunidad.</p></div></div>
        <p style={{ maxWidth: '70ch' }}>
          Ser la tienda online líder en productos para gamers en Chile, reconocida por su innovación,
          servicio al cliente excepcional, y un programa de fidelización basado en gamificación que
          recompensa a nuestros clientes más fieles.
        </p>
      </section>

      <section className="container">
        <div className="section-head"><div><h2>El equipo</h2><p>Personas gamers construyendo para gamers.</p></div></div>
        <Row xs={1} sm={3} className="g-4">
          {EQUIPO.map((p) => (
            <Col key={p.nombre}>
              <div className="team-card">
                <img src={rutaImagen(p.foto)} alt={p.alt} />
                <h4>{p.nombre}</h4>
                <span>{p.cargo}</span>
              </div>
            </Col>
          ))}
        </Row>
      </section>
    </>
  )
}
