import api, { comoLista, esNoEncontrado } from './api.js'
import { aOrden, aProducto } from './adaptadores.js'
import { normalizarUsuario } from './auth.js'

// En el backend una orden es una «boleta» (/boletas) con estados PENDIENTE → PAGADA / RECHAZADA.
// No guarda cliente, dirección ni motivo: se recuerdan aquí solo para mostrar la compra recién hecha.
const entregas = new Map()

const porId = (lista, hacer = (x) => x) => new Map(lista.map((x) => [String(x.id), hacer(x)]))

// Productos (imagen y categoría de cada línea) y usuarios (nombre del cliente). La lista de usuarios
// es solo para Administrador: si el rol no puede verla, se usa «Cliente #id».
async function cargarContexto(boletas) {
  if (!boletas.some((b) => Array.isArray(b.detalles))) return {}
  const [productos, usuarios] = await Promise.all([
    api.get('/productos').then((r) => comoLista(r.data)).catch(() => []),
    api.get('/usuarios').then((r) => comoLista(r.data)).catch(() => []),
  ])
  return {
    productos: porId(productos, (p) => aProducto(p)),
    usuarios: porId(usuarios, normalizarUsuario),
  }
}

export async function listarOrdenes() {
  const boletas = await api.get('/boletas').then((r) => comoLista(r.data))
  const contexto = await cargarContexto(boletas)
  return boletas.map((b) => aOrden(b, { ...contexto, entrega: entregas.get(String(b.id)) }))
}

// Devuelve null si la orden no existe para que la vista muestre «No existe la orden».
export async function obtenerOrden(id) {
  let boleta
  try {
    boleta = (await api.get(`/boletas/${encodeURIComponent(id)}`)).data
  } catch (e) {
    if (esNoEncontrado(e)) return null
    throw e
  }
  const contexto = await cargarContexto([boleta])
  return aOrden(boleta, { ...contexto, entrega: entregas.get(String(boleta.id)) })
}

// Crea la boleta (valida stock y precios en el backend) y luego la confirma o la rechaza según el
// resultado del pago. Al confirmar, el backend descuenta el stock y aplica el descuento.
export async function crearOrden(orden) {
  const usuarioId = Number(orden.usuarioId ?? orden.run)
  if (!Number.isFinite(usuarioId)) throw new Error('Debes iniciar sesión para registrar la compra.')

  const { data: creada } = await api.post('/boletas', {
    usuarioId,
    items: orden.lineas.map((l) => ({ productoId: Number(l.productoId ?? l.codigo), cantidad: l.cantidad })),
  })
  const base = `/boletas/${creada.id}`

  let final
  try {
    if (orden.estado === 'Pagada') {
      // El backend calcula el descuento como porcentaje del subtotal a precio de lista.
      const lista = Number(creada.total)
      const porcentaje = lista > 0 ? Math.round((1 - orden.total / lista) * 10000) / 100 : 0
      final = (await api.patch(`${base}/confirmar`, { descuentoPorcentaje: Math.min(100, Math.max(0, porcentaje)) })).data
    } else {
      final = (await api.patch(`${base}/rechazar`)).data
    }
  } catch (err) {
    // No dejar la boleta PENDIENTE (p. ej. si el stock cambió mientras se pagaba).
    await api.patch(`${base}/rechazar`).catch(() => {})
    throw err
  }

  const entrega = { cliente: orden.cliente, direccion: orden.direccion, motivo: orden.motivo ?? null }
  entregas.set(String(final.id), entrega)
  return aOrden(final, { entrega })
}
