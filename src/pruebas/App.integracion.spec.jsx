import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from '../App.jsx'

describe('App (flujo completo de la tienda)', () => {
  beforeEach(() => localStorage.clear())
  afterAll(() => localStorage.clear())
  const montar = (ruta = '/') => render(<MemoryRouter initialEntries={[ruta]}><App /></MemoryRouter>)

  it('la portada se renderiza con la barra de navegación y productos destacados', () => {
    montar()
    expect(screen.getByText('Productos destacados')).toBeTruthy()
    expect(screen.getByText('Ofertas')).toBeTruthy()
  })

  it('al añadir un producto sube el contador del carrito y se guarda en localStorage', () => {
    montar('/catalogo')
    fireEvent.click(screen.getAllByText('Añadir al carrito')[0])
    expect(within(screen.getByLabelText('Ver carrito')).getByText('1')).toBeTruthy()
    expect(JSON.parse(localStorage.getItem('lug_cart')).length).toBe(1)
  })

  it('una ruta inexistente muestra la página 404 dentro del layout', () => {
    montar('/ruta/que/no/existe')
    expect(screen.getByText(/\/ruta\/que\/no\/existe/)).toBeTruthy()
  })

  it('/admin sin sesión redirige al formulario de login', () => {
    montar('/admin')
    expect(screen.getByRole('heading', { name: 'Inicia sesión' })).toBeTruthy()
  })

  it('el catálogo respeta el stock: el carrito no supera las unidades disponibles', () => {
    montar('/producto/JM001')
    for (let i = 0; i < 40; i++) fireEvent.click(screen.getByText('+'))
    fireEvent.click(screen.getAllByRole('button', { name: 'Añadir al carrito' })[0])
    expect(JSON.parse(localStorage.getItem('lug_cart'))[0].cantidad).toBeLessThanOrEqual(18)
  })
})
