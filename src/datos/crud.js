export function crearColeccion(clave, semilla = [], campoId = 'id') {
  const guardar = (lista) => localStorage.setItem(clave, JSON.stringify(lista))
  const listar = () => {
    try {
      const guardado = localStorage.getItem(clave)
      if (guardado) return JSON.parse(guardado)
    } catch {}
    return semilla.map((x) => ({ ...x }))
  }
  const mismo = (a, b) => String(a) === String(b)

  return {
    listar,
    obtener: (id) => listar().find((x) => mismo(x[campoId], id)) ?? null,
    crear(item) {
      const lista = listar()
      if (lista.some((x) => mismo(x[campoId], item[campoId]))) {
        throw new Error(`Ya existe un registro con ${campoId} = ${item[campoId]}`)
      }
      guardar([...lista, item])
      return item
    },
    actualizar(id, cambios) {
      const lista = listar()
      if (!lista.some((x) => mismo(x[campoId], id))) return null
      const nueva = lista.map((x) => (mismo(x[campoId], id) ? { ...x, ...cambios, [campoId]: x[campoId] } : x))
      guardar(nueva)
      return nueva.find((x) => mismo(x[campoId], id))
    },
    eliminar(id) {
      const lista = listar()
      const restantes = lista.filter((x) => !mismo(x[campoId], id))
      if (restantes.length === lista.length) return false
      guardar(restantes)
      return true
    },
    reiniciar: () => localStorage.removeItem(clave),
  }
}
