import { useState } from 'react'
import Campo from '../../componentes/Campo.jsx'
import { actualizarCategoria, crearCategoria, eliminarCategoria } from '../../servicios/categorias.js'
import { mensajeError } from '../../servicios/api.js'
import { maximo, minimo, requerido } from '../../utilidades/validaciones.js'

// PÁGINA ADMIN: /admin/categorias — listar, crear, editar y eliminar categorías (CRUD contra la API).
// Una categoría con productos no se puede eliminar (integridad referencial básica).
export default function CategoriasAdmin({ productos, categorias = [], onCambio }) {
  const [nombre, setNombre] = useState('')
  const [editando, setEditando] = useState(null) // value de la categoría que se edita
  const [error, setError] = useState('')

  const usadas = (valor) => productos.filter((p) => p.categoria === valor).length

  async function guardar(e) {
    e.preventDefault()
    if (!requerido(nombre)) return setError('El nombre es obligatorio.')
    if (!minimo(nombre, 3) || !maximo(nombre, 50)) return setError('Debe tener entre 3 y 50 caracteres.')
    if (categorias.some((c) => c.label.toLowerCase() === nombre.trim().toLowerCase() && c.value !== editando)) return setError('Ya existe una categoría con ese nombre.')
    try {
      // El id lo asigna el backend; al editar se conserva la descripción que ya tenía.
      if (editando) await actualizarCategoria(editando, { label: nombre.trim(), descripcion: categorias.find((c) => c.value === editando)?.descripcion })
      else await crearCategoria({ label: nombre.trim() })
      setNombre(''); setEditando(null); setError('')
      await onCambio?.()
    } catch (err) {
      setError(mensajeError(err, 'No se pudo guardar la categoría.'))
    }
  }
  async function eliminar(valor) {
    if (usadas(valor) > 0) return setError('No se puede eliminar: la categoría tiene productos.')
    try {
      await eliminarCategoria(valor)
      setError('')
      await onCambio?.()
    } catch (err) {
      setError(mensajeError(err, 'No se pudo eliminar la categoría.'))
    }
  }

  return (
    <>
      <div className="admin-topbar"><div><h1>Categorías</h1><p className="breadcrumb">Organiza los productos de la tienda</p></div></div>
      <form className="panel" onSubmit={guardar} noValidate style={{ maxWidth: 520 }}>
        <Campo id="nombre-categoria" etiqueta={editando ? 'Editar categoría' : 'Nueva categoría'} error={error}>
          <input id="nombre-categoria" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Monitores" />
        </Campo>
        <button type="submit" className="btn btn-primary">{editando ? 'Guardar cambios' : 'Crear categoría'}</button>
        {editando && <button type="button" className="btn btn-outline ms-2" onClick={() => { setEditando(null); setNombre('') }}>Cancelar</button>}
      </form>
      <div className="panel">
        <div className="table-responsive">
          <table className="data-table">
            <thead><tr><th>Código</th><th>Nombre</th><th>Productos</th><th>Acciones</th></tr></thead>
            <tbody>
              {categorias.map((c) => (
                <tr key={c.value}>
                  <td className="cell-strong">{c.value}</td><td>{c.label}</td><td>{usadas(c.value)}</td>
                  <td className="row-actions">
                    <button type="button" onClick={() => { setEditando(c.value); setNombre(c.label); setError('') }}>Editar</button>
                    <button type="button" className="danger" onClick={() => eliminar(c.value)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
