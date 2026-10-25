import { Outlet } from 'react-router'
import BarraNavegacion from './BarraNavegacion.jsx'
import PiePagina from './PiePagina.jsx'

export default function Layout({ totalCarrito, sesion, onSalir }) {
  return (
    <div className="d-flex flex-column min-vh-100">
      <BarraNavegacion totalCarrito={totalCarrito} sesion={sesion} onSalir={onSalir} />
      <main className="flex-grow-1">
        <Outlet />
      </main>
      <PiePagina />
    </div>
  )
}
