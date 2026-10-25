import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import ProductosAdmin from '../paginas/admin/ProductosAdmin.jsx'
import ProductosCriticos, { esCritico } from '../paginas/admin/ProductosCriticos.jsx'
import Reportes, { resumenVentas } from '../paginas/admin/Reportes.jsx'
import CategoriasAdmin from '../paginas/admin/CategoriasAdmin.jsx'
import Ordenes from '../paginas/admin/Ordenes.jsx'
import AdminLayout from '../componentes/AdminLayout.jsx'
import { categoriasDB, ordenesDB } from '../datos/baseDatos.js'
import { producto, renderizarEnRuta } from './ayudas.jsx'

const lista = [
  producto({ codigo: 'A1', nombre: 'Normal', stock: 20, stockCritico: 5 }),
  producto({ codigo: 'A2', nombre: 'Casi agotado', stock: 2, stockCritico: 5 }),
  producto({ codigo: 'A3', nombre: 'Agotado', stock: 0, stockCritico: 5 }),
]
const orden = (id, estado, total, categoria = 'mouse') => ({
  id, fecha: '2026-10-22T10:00:00Z', run: '123456785', estado, total, subtotal: total, descuento: 0,
  cliente: { nombre: 'Ana', apellidos: 'Soto', correo: 'ana@duoc.cl' },
  direccion: { calle: 'Calle 1', departamento: '', region: 'RM', comuna: 'Santiago', indicaciones: '' },
  lineas: [{ codigo: 'A1', nombre: 'Normal', imagen: 'pictures/ps5.png', precio: total, cantidad: 1, categoria }],
})

beforeEach(() => localStorage.clear())
afterAll(() => localStorage.clear())

describe('Panel admin · productos', () => {
  it('esCritico: stock menor o igual al stock crítico', () => {
    expect(esCritico(lista[0])).toBeFalse()
    expect(esCritico(lista[1])).toBeTrue()
    expect(esCritico(lista[2])).toBeTrue()
  })

  it('ProductosCriticos lista solo los críticos, del más bajo al más alto', () => {
    const { container } = renderizarEnRuta(<ProductosCriticos productos={lista} />)
    const filas = [...container.querySelectorAll('tbody tr')].map((f) => f.cells[1].textContent)
    expect(filas).toEqual(['Agotado', 'Casi agotado'])
  })

  it('el Vendedor ve el listado en solo lectura (sin botones de edición)', () => {
    renderizarEnRuta(<ProductosAdmin productos={lista} setProductos={() => {}} sesion={{ tipoUsuario: 'Vendedor' }} />)
    expect(screen.queryByText('+ Nuevo producto')).toBeNull()
    expect(screen.getAllByText('Solo lectura').length).toBe(3)
  })

  it('MOCK: el Administrador elimina un producto tras confirmar (window.confirm simulado)', () => {
    spyOn(window, 'confirm').and.returnValue(true)
    const setProductos = jasmine.createSpy('setProductos')
    renderizarEnRuta(<ProductosAdmin productos={lista} setProductos={setProductos} sesion={{ tipoUsuario: 'Administrador' }} />)
    fireEvent.click(screen.getAllByText('Eliminar')[0])
    expect(window.confirm).toHaveBeenCalled()
    expect(setProductos).toHaveBeenCalledTimes(1)
    const actualizar = setProductos.calls.mostRecent().args[0]
    expect(actualizar(lista).map((p) => p.codigo)).toEqual(['A2', 'A3'])
  })

  it('si el Administrador cancela la confirmación no se elimina nada', () => {
    spyOn(window, 'confirm').and.returnValue(false)
    const setProductos = jasmine.createSpy('setProductos')
    renderizarEnRuta(<ProductosAdmin productos={lista} setProductos={setProductos} sesion={{ tipoUsuario: 'Administrador' }} />)
    fireEvent.click(screen.getAllByText('Eliminar')[0])
    expect(setProductos).not.toHaveBeenCalled()
  })
})

describe('Panel admin · reportes, órdenes y categorías', () => {
  it('resumenVentas suma solo órdenes pagadas y agrupa por categoría', () => {
    const r = resumenVentas([orden('1', 'Pagada', 10000, 'mouse'), orden('2', 'Pagada', 30000, 'consolas'), orden('3', 'Rechazada', 99999)])
    expect(r.ordenes).toBe(2)
    expect(r.rechazadas).toBe(1)
    expect(r.total).toBe(40000)
    expect(r.ticketPromedio).toBe(20000)
    expect(r.porCategoria).toEqual({ mouse: 10000, consolas: 30000 })
  })

  it('resumenVentas sin órdenes no divide por cero', () => {
    expect(resumenVentas([]).ticketPromedio).toBe(0)
  })

  it('Reportes lee las órdenes guardadas y muestra el total vendido', () => {
    ordenesDB.crear(orden('ORD-1', 'Pagada', 25000))
    renderizarEnRuta(<Reportes />)
    expect(screen.getAllByText(/25\.000/).length).toBeGreaterThan(0)
  })

  it('Ordenes lista las órdenes y /:id muestra la boleta', () => {
    ordenesDB.crear(orden('ORD-1', 'Pagada', 25000))
    render(
      <MemoryRouter initialEntries={['/admin/ordenes/ORD-1']}>
        <Routes><Route path="/admin/ordenes/:id" element={<Ordenes />} /></Routes>
      </MemoryRouter>)
    expect(screen.getByText('Boleta ORD-1')).toBeTruthy()
    expect(screen.getByText(/Ana Soto/)).toBeTruthy()
  })

  it('CategoriasAdmin crea una categoría nueva y valida nombres repetidos', () => {
    renderizarEnRuta(<CategoriasAdmin productos={lista} />)
    const campo = screen.getByLabelText('Nueva categoría')
    fireEvent.change(campo, { target: { value: 'Monitores 4K' } })
    fireEvent.click(screen.getByText('Crear categoría'))
    expect(categoriasDB.obtener('monitores-4k').label).toBe('Monitores 4K')
    fireEvent.change(screen.getByLabelText('Nueva categoría'), { target: { value: 'monitores 4k' } })
    fireEvent.click(screen.getByText('Crear categoría'))
    expect(screen.getByText('Ya existe una categoría con ese nombre.')).toBeTruthy()
  })

  it('CategoriasAdmin no elimina una categoría que tiene productos', () => {
    renderizarEnRuta(<CategoriasAdmin productos={lista} />)
    const fila = screen.getByText('accesorios').closest('tr')
    fireEvent.click(fila.querySelector('button.danger'))
    expect(screen.getByText('No se puede eliminar: la categoría tiene productos.')).toBeTruthy()
    expect(categoriasDB.obtener('accesorios')).not.toBeNull()
  })
})

describe('AdminLayout (guardia por rol)', () => {
  const montar = (sesion) => render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/login" element={<p>LOGIN</p>} /><Route path="/" element={<p>TIENDA</p>} />
        <Route path="/admin" element={<AdminLayout sesion={sesion} onSalir={() => {}} />}><Route index element={<p>DASHBOARD</p>} /></Route>
      </Routes>
    </MemoryRouter>)

  it('sin sesión redirige al login', () => { montar(null); expect(screen.getByText('LOGIN')).toBeTruthy() })
  it('un cliente vuelve a la tienda', () => { montar({ tipoUsuario: 'Cliente', nombre: 'Ana' }); expect(screen.getByText('TIENDA')).toBeTruthy() })
  it('el Vendedor entra pero no ve el menú Usuarios', () => {
    montar({ tipoUsuario: 'Vendedor', nombre: 'Val', apellidos: 'R' })
    expect(screen.getByText('DASHBOARD')).toBeTruthy()
    expect(screen.queryByText(/Usuarios/)).toBeNull()
  })
  it('el Administrador ve el menú completo, incluido Órdenes y Reportes', () => {
    montar({ tipoUsuario: 'Administrador', nombre: 'Admin' })
    expect(screen.getByText(/Usuarios/)).toBeTruthy()
    expect(screen.getByText(/Órdenes/)).toBeTruthy()
    expect(screen.getByText(/Reportes/)).toBeTruthy()
  })
})
