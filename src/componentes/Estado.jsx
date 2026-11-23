// Muestra «Cargando…» o el error de una carga; cuando todo está bien, muestra los hijos.
export default function Estado({ cargando, error, onReintentar, children }) {
  if (cargando) return <p className="empty-state" role="status">Cargando…</p>
  if (error) {
    return (
      <div className="empty-state" role="alert">
        <p>{error}</p>
        {onReintentar && <button type="button" className="btn btn-outline btn-sm" onClick={onReintentar}>Reintentar</button>}
      </div>
    )
  }
  return children
}
