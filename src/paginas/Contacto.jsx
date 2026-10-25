import { useState } from 'react'
import Campo from '../componentes/Campo.jsx'
import useFormulario from '../hooks/useFormulario.js'
import { correoValido, maximo, requerido } from '../utilidades/validaciones.js'

const reglas = {
  nombre: (v) => !requerido(v) ? 'El nombre es obligatorio.' : !maximo(v, 100) ? 'Máximo 100 caracteres.' : null,
  correo: (v) => !requerido(v) ? null: !maximo(v, 100) ? 'Máximo 100 caracteres.' : !correoValido(v) ? 'Usa un correo @duoc.cl, @profesor.duoc.cl o @gmail.com.' : null,
  comentario: (v) => !requerido(v) ? 'Cuéntanos en qué te podemos ayudar.' : !maximo(v, 500) ? 'Máximo 500 caracteres.' : null,
}

export default function Contacto() {
  const f = useFormulario({ nombre: '', correo: '', comentario: '' }, reglas)
  const [aviso, setAviso] = useState(null)

  function enviar(e) {
    e.preventDefault()
    if (!f.validarTodo()) return setAviso({ error: true, texto: 'Revisa los campos marcados en rojo.' })
    setAviso({ error: false, texto: '¡Gracias! Tu mensaje fue enviado, te responderemos a la brevedad.' })
    f.reiniciar()
  }

  return (
    <div className="container pagina">
      <div className="section-head"><div><h1>Hablemos</h1><p>¿Dudas, sugerencias o soporte técnico? Escríbenos.</p></div></div>
      <div className="contact-layout">
        <div>
          <div className="contact-info-item"><span className="contact-info-icon" aria-hidden="true">@</span><div><h3 style={{ marginBottom: 2 }}>Correo</h3><p>hola@levelupgamer.cl</p></div></div>
          <div className="contact-info-item"><span className="contact-info-icon" aria-hidden="true">☎</span><div><h3 style={{ marginBottom: 2 }}>WhatsApp soporte técnico</h3><p>+56 9 1234 5678 — respuesta en horario hábil.</p></div></div>
          <div className="contact-info-item"><span className="contact-info-icon" aria-hidden="true">📦</span><div><h3 style={{ marginBottom: 2 }}>Despachos</h3><p>Realizamos envíos a todo Chile, de lunes a sábado.</p></div></div>
          <a href="https://wa.me/56912345678" target="_blank" rel="noopener noreferrer" className="btn btn-accent">Chatear por WhatsApp</a>
        </div>

        <form className="form-card" onSubmit={enviar} noValidate style={{ maxWidth: 'none' }}>
          {aviso && <div className={`form-alert is-visible${aviso.error ? ' is-error' : ''}`}>{aviso.texto}</div>}
          <Campo id="nombre" etiqueta="Nombre completo" error={f.errores.nombre}>
            <input id="nombre" name="nombre" value={f.valores.nombre} onChange={f.cambiar} onBlur={f.salir} />
          </Campo>
          <Campo id="correo" etiqueta="Correo electrónico (opcional)" error={f.errores.correo} pista="Si nos dejas tu correo, te responderemos por ahí.">
            <input id="correo" name="correo" type="email" placeholder="tu@correo.com" value={f.valores.correo} onChange={f.cambiar} onBlur={f.salir} />
          </Campo>
          <Campo id="comentario" etiqueta="¿En qué te ayudamos?" error={f.errores.comentario}>
            <textarea id="comentario" name="comentario" value={f.valores.comentario} onChange={f.cambiar} onBlur={f.salir} />
          </Campo>
          <button type="submit" className="btn btn-primary btn-block">Enviar mensaje</button>
        </form>
      </div>
    </div>
  )
}
