// Traduce entre lo que responde el backend (Spring Boot, ids numéricos) y las formas que usa el
// frontend (codigo, value/label, run, órdenes con cliente y líneas).
// Son tolerantes: si el dato ya viene con la forma del frontend (o si el backend agrega más
// campos, p. ej. `descuento` o `imagen` en el producto) se respeta y no se pisa.

export const IMAGEN_POR_DEFECTO = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80'
export const STOCK_CRITICO_POR_DEFECTO = 5

// ---------- Categorías: { id, nombre, descripcion } ⇄ { value, label } ----------
export const aCategoria = (c) => ({ ...c, value: String(c.value ?? c.id), label: c.label ?? c.nombre ?? '' })

export const aCuerpoCategoria = (c) => ({ nombre: c.label ?? c.nombre, descripcion: c.descripcion ?? '' })

// ---------- Productos: { id, nombre, precio, stock, categoriaId } ⇄ producto del frontend ----------
export function aProducto(p, etiquetas = {}) {
  const cat = p.categoria && typeof p.categoria === 'object' ? p.categoria.id : (p.categoria ?? p.categoriaId)
  const categoria = cat == null ? '' : String(cat)
  return {
    ...p,
    codigo: String(p.codigo ?? p.id),
    categoria,
    categoriaLabel: p.categoriaLabel ?? etiquetas[categoria] ?? '',
    descuento: Number(p.descuento ?? 0),
    stockCritico: Number(p.stockCritico ?? STOCK_CRITICO_POR_DEFECTO),
    descripcion: p.descripcion ?? '',
    imagen: p.imagen ?? IMAGEN_POR_DEFECTO,
  }
}

// Hoy el backend solo guarda estos campos (si A agrega descuento, stockCritico, descripcion o
// imagen a la entidad Producto, súmalos aquí para que también se envíen).
export const aCuerpoProducto = (p) => ({
  nombre: p.nombre,
  precio: p.precio,
  stock: p.stock,
  categoria: { id: Number(p.categoria) },
})

// ---------- Usuarios: el backend solo guarda `nombre` (completo) y `correo` ----------
export const nombreCompleto = (u) => [u.nombre, u.apellidos].filter(Boolean).join(' ').trim()

// Separa «Ana María Soto» en nombre «Ana» y apellidos «María Soto» (el total mostrado no cambia).
export function separarNombre(completo) {
  const [nombre = '', ...resto] = String(completo ?? '').trim().split(/\s+/)
  return { nombre, apellidos: resto.join(' ') }
}

// ---------- Órdenes: boleta del backend ⇄ orden del frontend ----------
const ESTADOS = { PENDIENTE: 'Pendiente', PAGADA: 'Pagada', RECHAZADA: 'Rechazada' }
const DIRECCION_VACIA = { calle: '', departamento: '', region: '', comuna: '', indicaciones: '' }
const redondear = (n) => Math.round(n * 100) / 100

// `contexto`: { productos: Map(id → producto), usuarios: Map(id → usuario), entrega }.
// El backend no guarda cliente ni dirección: se toman del usuario (si el rol puede verlo) o de
// `entrega`, los datos que el checkout acaba de enviar en esta sesión.
export function aOrden(b, { productos = new Map(), usuarios = new Map(), entrega } = {}) {
  if (!Array.isArray(b?.detalles)) return b // no es una boleta del backend: ya tiene la forma del frontend

  const lineas = b.detalles.map((d) => {
    const p = productos.get(String(d.productoId))
    return {
      codigo: String(d.productoId),
      nombre: d.nombreProducto,
      imagen: p?.imagen ?? IMAGEN_POR_DEFECTO,
      precio: Number(d.precioUnitario),
      cantidad: d.cantidad,
      categoria: p?.categoria ?? '',
    }
  })
  const subtotal = redondear(b.detalles.reduce((suma, d) => suma + Number(d.subtotal), 0))
  const total = Number(b.total)
  const estado = ESTADOS[b.estado] ?? b.estado
  const usuario = usuarios.get(String(b.usuarioId))

  return {
    id: String(b.id),
    fecha: b.fecha,
    run: String(b.usuarioId),
    estado,
    subtotal,
    // El backend guarda solo el total final: el descuento es la diferencia con el subtotal.
    descuento: estado === 'Pagada' ? Math.max(0, redondear(subtotal - total)) : 0,
    total,
    cliente: entrega?.cliente ?? (usuario
      ? { nombre: usuario.nombre, apellidos: usuario.apellidos ?? '', correo: usuario.correo ?? '' }
      : { nombre: `Cliente #${b.usuarioId}`, apellidos: '', correo: '' }),
    direccion: entrega?.direccion ?? DIRECCION_VACIA,
    motivo: entrega?.motivo ?? null,
    lineas,
  }
}
