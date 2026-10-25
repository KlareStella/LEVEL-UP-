import { useSearchParams } from 'react-router'
import GrillaProductos from '../componentes/GrillaProductos.jsx'
import { categoriasDB } from '../datos/baseDatos.js'
import { precioFinal } from '../utilidades/formato.js'

export default function Catalogo({ productos, onAgregar }) {
  const [parametros, setParametros] = useSearchParams()
  const buscar = parametros.get('buscar') ?? ''
  const orden = parametros.get('orden') ?? 'relevancia'
  const categorias = (parametros.get('categoria') ?? '').split(',').filter(Boolean)

  function actualizar(clave, valor) {
    const copia = new URLSearchParams(parametros)
    if (valor) copia.set(clave, valor)
    else copia.delete(clave)
    setParametros(copia)
  }
  function alternarCategoria(valor) {
    const nuevas = categorias.includes(valor) ? categorias.filter((c) => c !== valor) : [...categorias, valor]
    actualizar('categoria', nuevas.join(','))
  }

  let lista = productos.filter((p) =>
    (categorias.length === 0 || categorias.includes(p.categoria)) &&
    p.nombre.toLowerCase().includes(buscar.toLowerCase().trim()))

  if (orden === 'precio-asc') lista = [...lista].sort((a, b) => precioFinal(a) - precioFinal(b))
  if (orden === 'precio-desc') lista = [...lista].sort((a, b) => precioFinal(b) - precioFinal(a))
  if (orden === 'nombre') lista = [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre))

  return (
    <div className="container pagina">
      <div className="section-head">
        <div>
          <h1>Catálogo de productos</h1>
          <p>{lista.length} producto{lista.length === 1 ? '' : 's'}</p>
        </div>
        <input
          type="search"
          placeholder="Buscar producto…"
          value={buscar}
          onChange={(e) => actualizar('buscar', e.target.value)}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 14px', minWidth: 220 }}
        />
      </div>

      <div className="catalog-layout">
        <aside className="filters">
          <h3>Categorías</h3>
          <div className="filter-group">
            {categoriasDB.listar().map((c) => (
              <label key={c.value}>
                <input type="checkbox" checked={categorias.includes(c.value)} onChange={() => alternarCategoria(c.value)} /> {c.label}
              </label>
            ))}
          </div>
          <h3>Ordenar por</h3>
          <div className="filter-group">
            <select value={orden} onChange={(e) => actualizar('orden', e.target.value === 'relevancia' ? '' : e.target.value)}
              style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: 8 }}>
              <option value="relevancia">Relevancia</option>
              <option value="precio-asc">Precio: menor a mayor</option>
              <option value="precio-desc">Precio: mayor a menor</option>
              <option value="nombre">Nombre A-Z</option>
            </select>
          </div>
          {parametros.size > 0 && (
            <button type="button" className="btn btn-outline btn-sm btn-block" onClick={() => setParametros({})}>Limpiar filtros</button>
          )}
        </aside>

        <div>
          {lista.length ? (
            <GrillaProductos productos={lista} onAgregar={onAgregar} xl={3} />
          ) : (
            <p className="mensaje-vacio">No se encontraron productos con esos filtros.</p>
          )}
        </div>
      </div>
    </div>
  )
}
