import { useState } from 'react'
export default function useFormulario(inicial, reglas) {
  const [valores, setValores] = useState(inicial)
  const [tocados, setTocados] = useState({})

  const todosLosErrores = {}
  for (const campo in reglas) {
    const mensaje = reglas[campo](valores[campo], valores)
    if (mensaje) todosLosErrores[campo] = mensaje
  }
  const errores = Object.fromEntries(Object.entries(todosLosErrores).filter(([k]) => tocados[k]))

  const cambiar = (e) => setValores((v) => ({ ...v, [e.target.name]: e.target.value }))
  const salir = (e) => setTocados((t) => ({ ...t, [e.target.name]: true }))
  const validarTodo = () => {
    setTocados(Object.fromEntries(Object.keys(reglas).map((k) => [k, true])))
    return Object.keys(todosLosErrores).length === 0
  }
  const reiniciar = () => { setValores(inicial); setTocados({}) }

  return { valores, errores, cambiar, salir, validarTodo, reiniciar, setValores }
}
