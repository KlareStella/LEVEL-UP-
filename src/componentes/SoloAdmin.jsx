import { Navigate, Outlet } from 'react-router'

export default function SoloAdmin({ sesion }) {
  return sesion?.tipoUsuario === 'Administrador' ? <Outlet /> : <Navigate to="/admin" replace />
}
