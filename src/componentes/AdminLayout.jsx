import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router'


export default function AdminLayout({ sesion, onSalir }) {
  const ubicacion = useLocation()
  if (!sesion) return <Navigate to="/login" replace state={{ from: ubicacion.pathname }} />

  const esAdmin = sesion.tipoUsuario === 'Administrador'
  if (!esAdmin && sesion.tipoUsuario !== 'Vendedor') return <Navigate to="/" replace />

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand"><span className="brand-mark" aria-hidden="true"></span>Level-Up Admin</div>
        <ul className="admin-nav">
          {}
          <li><NavLink to="/admin" end>📊 Dashboard</NavLink></li>
          <li className="nav-section-label">Catálogo</li>
          <li><NavLink to="/admin/ordenes">🧾 Órdenes</NavLink></li>
          <li><NavLink to="/admin/productos" end>🎮 Productos</NavLink></li>
          <li><NavLink to="/admin/productos/criticos">⚠️ Críticos</NavLink></li>
          <li><NavLink to="/admin/categorias">🏷️ Categorías</NavLink></li>
          <li><NavLink to="/admin/reportes">📈 Reportes</NavLink></li>
          {}
          {esAdmin && <li className="nav-section-label">Personas</li>}
          {esAdmin && <li><NavLink to="/admin/usuarios">👤 Usuarios</NavLink></li>}
          <li><NavLink to="/admin/perfil">🙍 Perfil</NavLink></li>
        </ul>
        <div className="admin-sidebar-footer">
          <p><strong>{`${sesion.nombre} ${sesion.apellidos || ''}`.trim()}</strong></p>
          <p><span className={`badge badge-role-${sesion.tipoUsuario}`}>{sesion.tipoUsuario}</span></p>
          <p style={{ marginTop: 10 }}>
            <a href="#salir" onClick={(e) => { e.preventDefault(); onSalir('/login') }}>Cerrar sesión</a> · <Link to="/">Ir a la tienda</Link>
          </p>
        </div>
      </aside>
      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  )
}
