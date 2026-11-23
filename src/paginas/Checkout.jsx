import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Campo from '../componentes/Campo.jsx'
import useFormulario from '../hooks/useFormulario.js'
import { REGIONES_COMUNAS } from '../datos/data.js'
import { crearOrden } from '../servicios/ordenes.js'
import { mensajeError } from '../servicios/api.js'
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
  const [enviando, setEnviando] = useState(false)
  const [errorOrden, setErrorOrden] = useState('')
  const f = useFormulario({
    nombre: sesion?.nombre ?? '', apellidos: sesion?.apellidos ?? '', correo: sesion?.correo ?? '',
    calle: sesion?.direccion ?? '', departamento: '', region: sesion?.region ?? '', comuna: sesion?.comuna ?? '', indicaciones: '',
  }, reglas)

  if (carrito.length === 0 && !finalizado.current) return <Navigate to="/carrito" replace />

  const { lineas, subtotal, descuento, total } = calcularTotales(carrito, productos, { correo: f.valores.correo }, false)
  const comunas = REGIONES_COMUNAS[f.valores.region] ?? []

  async function pagar(e) {
    e.preventDefault()
    if (!f.validarTodo() || enviando) return
    // La API registra la compra a nombre de un usuario: hace falta haber iniciado sesión.
    if (!sesion?.id && !sesion?.run) return setErrorOrden('Inicia sesión para completar la compra.')
    const v = f.valores
    const orden = {
      fecha: new Date().toISOString(),
      run: sesion?.run ?? null,
      usuarioId: sesion?.id ?? null,
      cliente: { nombre: v.nombre.trim(), apellidos: v.apellidos.trim(), correo: v.correo.trim() },
      direccion: { calle: v.calle.trim(), departamento: v.departamento.trim(), region: v.region, comuna: v.comuna, indicaciones: v.indicaciones.trim() },
      lineas: lineas.map((l) => ({ codigo: l.codigo, productoId: l.producto.id ?? Number(l.codigo), nombre: l.producto.nombre, imagen: l.producto.imagen, precio: precioFinal(l.producto), cantidad: l.cantidad, categoria: l.producto.categoria })),
      subtotal, descuento, total,
    }
    setEnviando(true); setErrorOrden('')
    try {
      const resultado = await procesarPago({ total, simularRechazo })
      // La orden se crea en la API (con el resultado del pago); ella asigna el número de orden.
      const creada = await crearOrden({ ...orden, estado: resultado.ok ? 'Pagada' : 'Rechazada', motivo: resultado.motivo ?? null })
      if (resultado.ok) {
        finalizado.current = true
        onVaciar()
        navegar(`/compra-exitosa/${creada.id}`, { replace: true })
      } else {
        navegar(`/compra-error/${creada.id}`, { replace: true })
      }
    } catch (err) {
      setErrorOrden(err.response?.status === 403
        ? 'Tu cuenta no tiene permiso para registrar compras en el servidor.'
        : mensajeError(err, 'No se pudo registrar la orden. Inténtalo nuevamente.'))
      setEnviando(false)
    }
  }

  return (
    <div className="container pagina">
      <div className="section-head"><div><h1>Checkout</h1><p>Completa tus datos y la dirección de entrega.</p></div></div>
      <form onSubmit={pagar} noValidate>
        {errorOrden && <div className="form-alert is-visible is-error" role="alert">{errorOrden}</div>}
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
              <button type="submit" className="btn btn-accent btn-block" disabled={enviando}>Pagar ahora {formatCLP(total)}</button>
              <p style={{ marginTop: 14 }}><Link to="/carrito">← Volver al carrito</Link></p>
            </aside>
          </Col>
        </Row>
      </form>
    </div>
  )
}
