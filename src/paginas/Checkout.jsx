import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Campo from '../componentes/Campo.jsx'
import useFormulario from '../hooks/useFormulario.js'
import { REGIONES_COMUNAS } from '../datos/data.js'
import { nuevoIdOrden, ordenesDB } from '../datos/baseDatos.js'
import { procesarPago as pasarelaReal } from '../servicios/pagos.js'
import { formatCLP, precioFinal } from '../utilidades/formato.js'
import { correoValido, maximo, requerido } from '../utilidades/validaciones.js'
import { calcularTotales } from './Carrito.jsx'

const reglas = {
  nombre: (v) => !requerido(v) ? 'El nombre es obligatorio.' : !maximo(v, 50) ? 'Máximo 50 caracteres.' : null,
  apellidos: (v) => !requerido(v) ? 'Los apellidos son obligatorios.' : !maximo(v, 100) ? 'Máximo 100 caracteres.' : null,
  correo: (v) => !requerido(v) ? 'El correo es obligatorio.' : !correoValido(v) ? 'Usa un correo @duoc.cl, @profesor.duoc.cl o @gmail.com.' : null,
  calle: (v) => !requerido(v) ? 'La calle es obligatoria.' : !maximo(v, 300) ? 'Máximo 300 caracteres.' : null,
  region: (v) => requerido(v) ? null : 'Selecciona una región.',
  comuna: (v) => requerido(v) ? null : 'Selecciona una comuna.',
}

export default function Checkout({ carrito, productos, sesion, onVaciar, procesarPago = pasarelaReal }) {
  const navegar = useNavigate()
  const finalizado = useRef(false) 
  const [simularRechazo, setSimularRechazo] = useState(false)
  const f = useFormulario({
    nombre: sesion?.nombre ?? '', apellidos: sesion?.apellidos ?? '', correo: sesion?.correo ?? '',
    calle: sesion?.direccion ?? '', departamento: '', region: sesion?.region ?? '', comuna: sesion?.comuna ?? '', indicaciones: '',
  }, reglas)

  if (carrito.length === 0 && !finalizado.current) return <Navigate to="/carrito" replace />

  const { lineas, subtotal, descuento, total } = calcularTotales(carrito, productos, { correo: f.valores.correo }, false)
  const comunas = REGIONES_COMUNAS[f.valores.region] ?? []

  function pagar(e) {
    e.preventDefault()
    if (!f.validarTodo()) return
    const v = f.valores
    const orden = {
      id: nuevoIdOrden(),
      fecha: new Date().toISOString(),
      run: sesion?.run ?? null,
      cliente: { nombre: v.nombre.trim(), apellidos: v.apellidos.trim(), correo: v.correo.trim() },
      direccion: { calle: v.calle.trim(), departamento: v.departamento.trim(), region: v.region, comuna: v.comuna, indicaciones: v.indicaciones.trim() },
      lineas: lineas.map((l) => ({ codigo: l.codigo, nombre: l.producto.nombre, imagen: l.producto.imagen, precio: precioFinal(l.producto), cantidad: l.cantidad, categoria: l.producto.categoria })),
      subtotal, descuento, total,
    }
    const resultado = procesarPago({ total, simularRechazo })
    ordenesDB.crear({ ...orden, estado: resultado.ok ? 'Pagada' : 'Rechazada', motivo: resultado.motivo ?? null })
    if (resultado.ok) {
      finalizado.current = true
      onVaciar() 
      navegar(`/compra-exitosa/${orden.id}`, { replace: true })
    } else {
      navegar(`/compra-error/${orden.id}`, { replace: true })
    }
  }

  return (
    <div className="container pagina">
      <div className="section-head"><div><h1>Checkout</h1><p>Completa tus datos y la dirección de entrega.</p></div></div>
      <form onSubmit={pagar} noValidate>
        <Row className="g-4">
          <Col lg={7}>
            <h2 className="h5">Información del cliente</h2>
            <Row className="g-2">
              <Col sm={6}><Campo id="nombre" etiqueta="Nombre" error={f.errores.nombre}><input id="nombre" name="nombre" value={f.valores.nombre} onChange={f.cambiar} onBlur={f.salir} /></Campo></Col>
              <Col sm={6}><Campo id="apellidos" etiqueta="Apellidos" error={f.errores.apellidos}><input id="apellidos" name="apellidos" value={f.valores.apellidos} onChange={f.cambiar} onBlur={f.salir} /></Campo></Col>
              <Col xs={12}><Campo id="correo" etiqueta="Correo" error={f.errores.correo}><input id="correo" name="correo" type="email" value={f.valores.correo} onChange={f.cambiar} onBlur={f.salir} /></Campo></Col>
            </Row>
            <h2 className="h5 mt-3">Dirección de entrega</h2>
            <Row className="g-2">
              <Col sm={8}><Campo id="calle" etiqueta="Calle" error={f.errores.calle}><input id="calle" name="calle" value={f.valores.calle} onChange={f.cambiar} onBlur={f.salir} /></Campo></Col>
              <Col sm={4}><Campo id="departamento" etiqueta="Departamento (opcional)"><input id="departamento" name="departamento" placeholder="Ej: 603" value={f.valores.departamento} onChange={f.cambiar} /></Campo></Col>
              <Col sm={6}>
                <Campo id="region" etiqueta="Región" error={f.errores.region}>
                  <select id="region" name="region" value={f.valores.region} onChange={(e) => f.setValores((v) => ({ ...v, region: e.target.value, comuna: '' }))} onBlur={f.salir}>
                    <option value="">-- Seleccione --</option>
                    {Object.keys(REGIONES_COMUNAS).map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Campo>
              </Col>
              <Col sm={6}>
                <Campo id="comuna" etiqueta="Comuna" error={f.errores.comuna}>
                  <select id="comuna" name="comuna" value={f.valores.comuna} onChange={f.cambiar} onBlur={f.salir}>
                    <option value="">-- Seleccione --</option>
                    {comunas.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Campo>
              </Col>
              <Col xs={12}><Campo id="indicaciones" etiqueta="Indicaciones para la entrega (opcional)"><textarea id="indicaciones" name="indicaciones" value={f.valores.indicaciones} onChange={f.cambiar} /></Campo></Col>
            </Row>
          </Col>

          <Col lg={5}>
            <aside className="cart-summary">
              <h2 className="h5">Tu pedido</h2>
              {lineas.map(({ producto, cantidad }) => (
                <div className="cart-summary-row" key={producto.codigo}><span>{cantidad} × {producto.nombre}</span><span>{formatCLP(precioFinal(producto) * cantidad)}</span></div>
              ))}
              <div className="cart-summary-row"><span>Subtotal</span><span>{formatCLP(subtotal)}</span></div>
              {descuento > 0 && <div className="cart-summary-row"><span>Descuento Duoc (20%)</span><span>− {formatCLP(descuento)}</span></div>}
              <div className="cart-summary-total"><span>Total a pagar</span><span>{formatCLP(total)}</span></div>
              <label className="d-block my-3 small">
                <input type="checkbox" checked={simularRechazo} onChange={(e) => setSimularRechazo(e.target.checked)} /> Demo: simular pago rechazado
              </label>
              <button type="submit" className="btn btn-accent btn-block">Pagar ahora {formatCLP(total)}</button>
              <p style={{ marginTop: 14 }}><Link to="/carrito">← Volver al carrito</Link></p>
            </aside>
          </Col>
        </Row>
      </form>
    </div>
  )
}
