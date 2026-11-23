import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from '../App.jsx'
import api, { manejarErrorRespuesta } from '../servicios/api.js'
import { CATEGORIES, PRODUCTS } from '../datos/data.js'
import { guardarSesion } from '../utilidades/almacen.js'
import { sinConexion } from './ayudas.jsx'

describe('App (flujo completo de la tienda con la API simulada)', () => {
  beforeEach(() => {
    localStorage.clear()
    // La API simulada responde por URL: el catálogo, las categorías y (vacías) las órdenes/usuarios.
    spyOn(api, 'get').and.callFake((url) => Promise.resolve({
      data: url === '/productos' ? PRODUCTS : url === '/categorias' ? CATEGORIES : [],
    }))
  })
  afterAll(() => localStorage.clear())
  const montar = (ruta = '/') => render(<MemoryRouter initialEntries={[ruta]}><App /></MemoryRouter>)

  it('la portada se renderiza con la barra de navegación y productos destacados', async () => {
    montar()
    expect(await screen.findByText('Productos destacados')).toBeTruthy()
    expect(screen.getByText('Ofertas')).toBeTruthy()
  })

  it('al abrir la app pide productos y categorías a la API (no a localStorage)', async () => {
    montar('/catalogo')
    await screen.findAllByText('Añadir al carrito')
    expect(api.get).toHaveBeenCalledWith('/productos')
    expect(api.get).toHaveBeenCalledWith('/categorias')
    expect(localStorage.getItem('lug_admin_products')).toBeNull()
  })

  it('si la API no responde muestra el aviso y un botón para reintentar', async () => {
    api.get.and.callFake(sinConexion())
    montar('/catalogo')
    expect(await screen.findByText(/No se pudo conectar con el servidor/)).toBeTruthy()
    expect(screen.getByText('Reintentar')).toBeTruthy()
  })

  it('al añadir un producto sube el contador del carrito y se guarda en localStorage', async () => {
    montar('/catalogo')
    fireEvent.click((await screen.findAllByText('Añadir al carrito'))[0])
    expect(within(screen.getByLabelText('Ver carrito')).getByText('1')).toBeTruthy()
    expect(JSON.parse(localStorage.getItem('lug_cart')).length).toBe(1)
  })

  it('una ruta inexistente muestra la página 404 dentro del layout', () => {
    montar('/ruta/que/no/existe')
    expect(screen.getByText(/\/ruta\/que\/no\/existe/)).toBeTruthy()
  })

  it('el catálogo respeta el stock: el carrito no supera las unidades disponibles', async () => {
    montar('/producto/JM001')
    await screen.findByText('+')
    for (let i = 0; i < 40; i++) fireEvent.click(screen.getByText('+'))
    fireEvent.click(screen.getAllByRole('button', { name: 'Añadir al carrito' })[0])
    expect(JSON.parse(localStorage.getItem('lug_cart'))[0].cantidad).toBeLessThanOrEqual(18)
  })

  describe('sesión y permisos por rol', () => {
    const iniciar = (usuario) => guardarSesion({ run: '1', apellidos: 'Prueba', ...usuario }, 'jwt-de-prueba')

    it('/admin sin sesión redirige al formulario de login', () => {
      montar('/admin')
      expect(screen.getByRole('heading', { name: 'Inicia sesión' })).toBeTruthy()
    })

    it('la sesión (token + usuario) persiste al recargar la página', async () => {
      iniciar({ nombre: 'Ana', tipoUsuario: 'Cliente' })
      montar('/')
      expect(await screen.findByText('Ana')).toBeTruthy()
      expect(screen.queryByText('Iniciar sesión')).toBeNull()
    })

    it('un Cliente que entra a /admin vuelve a la tienda', async () => {
      iniciar({ nombre: 'Ana', tipoUsuario: 'Cliente' })
      montar('/admin')
      expect(await screen.findByText('Productos destacados')).toBeTruthy()
    })

    it('el Administrador entra al Dashboard', async () => {
      iniciar({ nombre: 'Admin', tipoUsuario: 'Administrador' })
      montar('/admin')
      expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeTruthy()
    })

    it('el Vendedor entra directo a Órdenes y no ve Dashboard, Reportes ni Perfil', async () => {
      iniciar({ nombre: 'Val', tipoUsuario: 'Vendedor' })
      montar('/admin')
      expect(await screen.findByText('Órdenes / Boletas')).toBeTruthy()
      for (const oculto of [/Dashboard/, /Reportes/, /Perfil/, /Categorías/, /Críticos/]) expect(screen.queryByText(oculto)).toBeNull()
    })

    it('el Vendedor no puede abrir por URL las vistas de Administrador (se redirige a Órdenes)', async () => {
      iniciar({ nombre: 'Val', tipoUsuario: 'Vendedor' })
      for (const ruta of ['/admin/reportes', '/admin/usuarios', '/admin/categorias', '/admin/productos/nuevo', '/admin/productos/JM001/editar']) {
        const { unmount } = montar(ruta)
        expect(await screen.findByText('Órdenes / Boletas')).toBeTruthy()
        unmount()
      }
    })

    it('el Vendedor sí ve la lista de productos sin botones de edición', async () => {
      iniciar({ nombre: 'Val', tipoUsuario: 'Vendedor' })
      montar('/admin/productos')
      expect((await screen.findAllByText('Ver detalle')).length).toBeGreaterThan(0)
      expect(screen.queryByText('+ Nuevo producto')).toBeNull()
      expect(screen.queryByText('Eliminar')).toBeNull()
    })

    it('un 401 de la API (token vencido) cierra la sesión y lleva al login con aviso', async () => {
      iniciar({ nombre: 'Admin', tipoUsuario: 'Administrador' })
      montar('/admin')
      await screen.findByRole('heading', { name: 'Dashboard' })
      // Lo que haría axios si cualquier petición respondiera 401:
      await act(async () => {
        await manejarErrorRespuesta({ config: { url: '/ordenes' }, response: { status: 401 } }).catch(() => {})
      })
      expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeTruthy()
      expect(screen.getByText('Tu sesión expiró. Vuelve a iniciar sesión.')).toBeTruthy()
      expect(localStorage.getItem('lug_token')).toBeNull()
      expect(localStorage.getItem('lug_session')).toBeNull()
    })
  })
})
