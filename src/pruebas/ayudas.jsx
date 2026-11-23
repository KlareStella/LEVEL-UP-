import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

export const producto = (extra = {}) => ({
  codigo: 'T001', categoria: 'accesorios', categoriaLabel: 'Accesorios',
  nombre: 'Teclado Test', precio: 10000, stock: 10, stockCritico: 3,
  descripcion: 'Producto de prueba', imagen: 'pictures/ps5.png', ...extra,
})

export function renderizarEnRuta(ui, ruta = '/') {
  return render(<MemoryRouter initialEntries={[ruta]}>{ui}</MemoryRouter>)
}

// Mocks de axios: se usan con spyOn(api, 'get').and.callFake(exito(datos)) o .callFake(rechazo(401)).
// Son funciones (no promesas ya creadas) para que un rechazo no llamado no cause "unhandled rejection".
export const exito = (datos) => () => Promise.resolve({ data: datos })
export const rechazo = (status, datos = {}) => () =>
  Promise.reject(Object.assign(new Error(`HTTP ${status}`), { response: { status, data: datos } }))
export const sinConexion = () => () =>
  Promise.reject(Object.assign(new Error('Network Error'), { request: {} }))
