import { useEffect, useState } from 'react'
import { mensajeError } from '../servicios/api.js'

// Carga un recurso de la API: { datos, cargando, error, recargar }.
// `cargar` debe devolver una promesa; `deps` indica cuándo volver a pedirlo.
export default function useRecurso(cargar, deps = []) {
  const [estado, setEstado] = useState({ datos: null, cargando: true, error: '' })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let activo = true
    setEstado((e) => ({ ...e, cargando: true, error: '' }))
    cargar()
      .then((datos) => { if (activo) setEstado({ datos, cargando: false, error: '' }) })
      .catch((err) => {
        if (activo) setEstado({ datos: null, cargando: false, error: mensajeError(err, 'No se pudo cargar la información.') })
      })
    return () => { activo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  return { ...estado, recargar: () => setVersion((v) => v + 1) }
}
