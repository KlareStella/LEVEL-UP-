import { Link, useNavigate, useParams } from 'react-router'
import Campo from '../../componentes/Campo.jsx'
import useFormulario from '../../hooks/useFormulario.js'
import { categoriasDB } from '../../datos/baseDatos.js'
import { decimalPositivo, enteroPositivo, maximo, minimo, requerido } from '../../utilidades/validaciones.js'

const IMAGEN_POR_DEFECTO = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80'

// PÁGINA ADMIN: /admin/productos/nuevo  y  /admin/productos/:codigo/editar
// Esta página solo busca el producto; el formulario va en un componente aparte con `key`
// para que, al cambiar de producto, el formulario se reinicie con los datos nuevos.
export default function ProductoForm({ productos, setProductos }) {
  const { codigo } = useParams()
  const existente = codigo ? productos.find((p) => p.codigo === codigo) : null

  if (codigo && !existente) {
    return (
      <div className="panel">
        <div className="empty-state">
          <p>No existe el producto «{codigo}».</p>
          <Link to="/admin/productos" className="btn btn-primary">Volver a productos</Link>
        </div>
      </div>
    )
  }
  return <FormularioProducto key={codigo ?? 'nuevo'} existente={existente} productos={productos} setProductos={setProductos} />
}

function FormularioProducto({ existente, productos, setProductos }) {
  const navegar = useNavigate()
  const esEdicion = Boolean(existente)

  const inicial = existente
    ? { codigo: existente.codigo, categoria: existente.categoria, nombre: existente.nombre, descripcion: existente.descripcion ?? '',
        precio: String(existente.precio), stock: String(existente.stock), stockCritico: String(existente.stockCritico ?? ''), descuento: String(existente.descuento ?? ''), imagen: existente.imagen ?? '' }
    : { codigo: '', categoria: '', nombre: '', descripcion: '', precio: '', stock: '', stockCritico: '', descuento: '', imagen: '' }

  const reglas = {
    codigo: (v) => esEdicion ? null
      : !requerido(v) ? 'El código es obligatorio.'
      : !minimo(v, 3) ? 'Mínimo 3 caracteres.'
      : productos.some((p) => p.codigo.toLowerCase() === v.trim().toLowerCase()) ? 'Ya existe un producto con ese código.' : null,
    categoria: (v) => requerido(v) ? null : 'Selecciona una categoría.',
    nombre: (v) => !requerido(v) ? 'El nombre es obligatorio.' : !maximo(v, 100) ? 'Máximo 100 caracteres.' : null,
    descripcion: (v) => maximo(v, 500) ? null : 'Máximo 500 caracteres.',
    precio: (v) => !requerido(v) ? 'El precio es obligatorio.' : !decimalPositivo(v) ? 'Ingresa un número válido (0 o más).' : null,
    stock: (v) => !requerido(v) ? 'El stock es obligatorio.' : !enteroPositivo(v) ? 'Solo números enteros, 0 o más.' : null,
    stockCritico: (v) => !requerido(v) || enteroPositivo(v) ? null : 'Solo números enteros, 0 o más.',
    descuento: (v) => !requerido(v) || (enteroPositivo(v) && Number(v) <= 90) ? null : 'Entero entre 0 y 90.',
  }
  const f = useFormulario(inicial, reglas)
  const v = f.valores

  function guardar(e) {
    e.preventDefault()
    if (!f.validarTodo()) return
    const categoria = categoriasDB.listar().find((c) => c.value === v.categoria)
    const datos = {
      codigo: esEdicion ? existente.codigo : v.codigo.trim().toUpperCase(),
      nombre: v.nombre.trim(),
      descripcion: v.descripcion.trim(),
      precio: parseFloat(v.precio),
      stock: parseInt(v.stock, 10),
      stockCritico: parseInt(v.stockCritico || '0', 10),
      descuento: parseInt(v.descuento || '0', 10),
      categoria: categoria.value,
      categoriaLabel: categoria.label,
      imagen: v.imagen.trim() || IMAGEN_POR_DEFECTO,
    }
    setProductos((lista) => esEdicion
      ? lista.map((p) => (p.codigo === existente.codigo ? { ...p, ...datos } : p))
      : [...lista, datos])
    navegar('/admin/productos')
  }

  const campo = (name, extra = {}) => (
    <input id={name} name={name} type="text" value={v[name]} onChange={f.cambiar} onBlur={f.salir} {...extra} />
  )

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>{esEdicion ? 'Editar producto' : 'Nuevo producto'}</h1>
          <p className="breadcrumb"><Link to="/admin/productos">Productos</Link> / Formulario</p>
        </div>
      </div>

      <form className="panel" onSubmit={guardar} noValidate style={{ maxWidth: 640 }}>
        <div className="field-row">
          <Campo id="codigo" etiqueta="Código de producto" error={f.errores.codigo} pista="Mínimo 3 caracteres. No editable una vez creado.">
            {campo('codigo', { placeholder: 'JM003', disabled: esEdicion })}
          </Campo>
          <Campo id="categoria" etiqueta="Categoría" error={f.errores.categoria}>
            <select id="categoria" name="categoria" value={v.categoria} onChange={f.cambiar} onBlur={f.salir}>
              <option value="">-- Seleccione --</option>
              {categoriasDB.listar().map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Campo>
        </div>

        <Campo id="nombre" etiqueta="Nombre del producto" error={f.errores.nombre}>{campo('nombre')}</Campo>

        <Campo id="descripcion" etiqueta="Descripción (opcional)" error={f.errores.descripcion} pista="Máximo 500 caracteres.">
          <textarea id="descripcion" name="descripcion" value={v.descripcion} onChange={f.cambiar} onBlur={f.salir} />
        </Campo>

        <div className="field-row">
          <Campo id="precio" etiqueta="Precio (CLP)" error={f.errores.precio} pista="0 o más. Admite decimales.">{campo('precio', { placeholder: '19990', inputMode: 'decimal' })}</Campo>
          <Campo id="stock" etiqueta="Stock" error={f.errores.stock} pista="Números enteros, 0 o más.">{campo('stock', { placeholder: '10', inputMode: 'numeric' })}</Campo>
        </div>

        <Campo id="stockCritico" etiqueta="Stock crítico (opcional)" error={f.errores.stockCritico} pista="Se mostrará una alerta cuando el stock sea igual o inferior a este valor.">
          {campo('stockCritico', { placeholder: '5', inputMode: 'numeric' })}
        </Campo>

        <Campo id="descuento" etiqueta="Descuento de oferta % (opcional)" error={f.errores.descuento} pista="Entero entre 0 y 90. Si es mayor que 0, el producto aparece en Ofertas.">
          {campo('descuento', { placeholder: '15', inputMode: 'numeric' })}
        </Campo>

        <Campo id="imagen" etiqueta="URL de imagen (opcional)" pista="Ej: https://... o pictures/ps5.png">{campo('imagen', { placeholder: 'https://...' })}</Campo>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button type="submit" className="btn btn-primary">Guardar producto</button>
          <Link to="/admin/productos" className="btn btn-outline">Cancelar</Link>
        </div>
      </form>
    </>
  )
}
