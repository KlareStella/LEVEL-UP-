import { act, renderHook } from '@testing-library/react'
import useFormulario from '../hooks/useFormulario.js'

const reglas = {
  nombre: (v) => (v.trim() ? null : 'Obligatorio'),
  edad: (v) => (/^\d+$/.test(v) ? null : 'Solo números'),
}
const evento = (name, value) => ({ target: { name, value } })

describe('useFormulario (estado)', () => {
  it('parte con los valores iniciales y sin errores visibles', () => {
    const { result } = renderHook(() => useFormulario({ nombre: '', edad: '' }, reglas))
    expect(result.current.valores).toEqual({ nombre: '', edad: '' })
    expect(result.current.errores).toEqual({})
  })

  it('cambiar actualiza el estado del campo indicado', () => {
    const { result } = renderHook(() => useFormulario({ nombre: '', edad: '' }, reglas))
    act(() => result.current.cambiar(evento('nombre', 'Ana')))
    expect(result.current.valores.nombre).toBe('Ana')
  })

  it('el error solo aparece cuando el campo fue "tocado" (onBlur)', () => {
    const { result } = renderHook(() => useFormulario({ nombre: '', edad: '' }, reglas))
    expect(result.current.errores.nombre).toBeUndefined()
    act(() => result.current.salir(evento('nombre', '')))
    expect(result.current.errores.nombre).toBe('Obligatorio')
  })

  it('validarTodo marca todos los campos y devuelve false si hay errores', () => {
    const { result } = renderHook(() => useFormulario({ nombre: '', edad: 'x' }, reglas))
    let valido
    act(() => { valido = result.current.validarTodo() })
    expect(valido).toBeFalse()
    expect(Object.keys(result.current.errores)).toEqual(['nombre', 'edad'])
  })

  it('validarTodo devuelve true con datos correctos y reiniciar limpia todo', () => {
    const { result } = renderHook(() => useFormulario({ nombre: 'Ana', edad: '20' }, reglas))
    let valido
    act(() => { valido = result.current.validarTodo() })
    expect(valido).toBeTrue()
    act(() => result.current.cambiar(evento('nombre', 'Otra')))
    act(() => result.current.reiniciar())
    expect(result.current.valores.nombre).toBe('Ana')
  })
})
