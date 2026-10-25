export default function Campo({ id, etiqueta, error, pista, children }) {
  return (
    <div className={`field${error ? ' is-invalid' : ''}`}>
      <label htmlFor={id}>{etiqueta}</label>
      {children}
      {pista && <p className="hint">{pista}</p>}
      <p className="error-message">{error}</p>
    </div>
  )
}
