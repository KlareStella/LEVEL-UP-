import { Navigate, Outlet } from 'react-router'

// Guardia por rol: deja pasar solo a los tipos de usuario indicados; al resto lo envía a `destino`.
export default function SoloRoles({ sesion, roles, destino = '/admin' }) {
  return roles.includes(sesion?.tipoUsuario) ? <Outlet /> : <Navigate to={destino} replace />
}
