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
