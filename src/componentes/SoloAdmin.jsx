import SoloRoles from './SoloRoles.jsx'

export default function SoloAdmin({ sesion }) {
  return <SoloRoles sesion={sesion} roles={['Administrador']} />
}
