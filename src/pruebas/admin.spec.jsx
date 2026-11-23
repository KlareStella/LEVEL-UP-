import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import ProductosAdmin from '../paginas/admin/ProductosAdmin.jsx'
import ProductoDetalleAdmin from '../paginas/admin/ProductoDetalleAdmin.jsx'
import ProductosCriticos, { esCritico } from '../paginas/admin/ProductosCriticos.jsx'
import Reportes, { resumenVentas } from '../paginas/admin/Reportes.jsx'
import CategoriasAdmin from '../paginas/admin/CategoriasAdmin.jsx'
import Ordenes from '../paginas/admin/Ordenes.jsx'
import AdminLayout from '../componentes/AdminLayout.jsx'
import SoloRoles from '../componentes/SoloRoles.jsx'
import api from '../servicios/api.js'
import { exito, producto, rechazo, renderizarEnRuta } from './ayudas.jsx'

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

  it('el Vendedor ve el listado y el detalle, pero sin botones de crear, editar ni eliminar', () => {
    renderizarEnRuta(<ProductosAdmin productos={lista} sesion={{ tipoUsuario: 'Vendedor' }} onCambio={() => {}} />)
    expect(screen.queryByText('+ Nuevo producto')).toBeNull()
    expect(screen.queryByText('Editar')).toBeNull()
    expect(screen.queryByText('Eliminar')).toBeNull()
    expect(screen.getAllByText('Ver detalle').length).toBe(3)
  })

  it('el Administrador ve crear, editar y eliminar', () => {
    renderizarEnRuta(<ProductosAdmin productos={lista} sesion={{ tipoUsuario: 'Administrador' }} onCambio={() => {}} />)
    expect(screen.getByText('+ Nuevo producto')).toBeTruthy()
    expect(screen.getAllByText('Editar').length).toBe(3)
    expect(screen.getAllByText('Eliminar').length).toBe(3)
  })

  it('MOCK axios: el Administrador elimina un producto (DELETE) tras confirmar y se recarga el catálogo', async () => {
    spyOn(window, 'confirm').and.returnValue(true)
    spyOn(api, 'delete').and.callFake(exito({}))
    const onCambio = jasmine.createSpy('onCambio')
    renderizarEnRuta(<ProductosAdmin productos={lista} sesion={{ tipoUsuario: 'Administrador' }} onCambio={onCambio} />)
    fireEvent.click(screen.getAllByText('Eliminar')[0])
    await waitFor(() => expect(onCambio).toHaveBeenCalledTimes(1))
    expect(window.confirm).toHaveBeenCalled()
    expect(api.delete).toHaveBeenCalledOnceWith('/productos/A1')
  })

  it('si la API rechaza la eliminación muestra el error y no recarga', async () => {
    spyOn(window, 'confirm').and.returnValue(true)
    spyOn(api, 'delete').and.callFake(rechazo(500, { message: 'Producto en uso' }))
    const onCambio = jasmine.createSpy('onCambio')
    renderizarEnRuta(<ProductosAdmin productos={lista} sesion={{ tipoUsuario: 'Administrador' }} onCambio={onCambio} />)
    fireEvent.click(screen.getAllByText('Eliminar')[0])
    expect(await screen.findByText('Producto en uso')).toBeTruthy()
    expect(onCambio).not.toHaveBeenCalled()
  })

  it('si el Administrador cancela la confirmación no se llama a la API', () => {
    spyOn(window, 'confirm').and.returnValue(false)
    spyOn(api, 'delete')
    renderizarEnRuta(<ProductosAdmin productos={lista} sesion={{ tipoUsuario: 'Administrador' }} onCambio={() => {}} />)
    fireEvent.click(screen.getAllByText('Eliminar')[0])
    expect(api.delete).not.toHaveBeenCalled()
  })

  it('ProductoDetalleAdmin muestra el detalle de solo lectura y avisa si el código no existe', () => {
    const montar = (codigo) => render(
      <MemoryRouter initialEntries={[`/admin/productos/${codigo}`]}>
        <Routes><Route path="/admin/productos/:codigo" element={<ProductoDetalleAdmin productos={lista} />} /></Routes>
      </MemoryRouter>)
    const { unmount } = montar('A2')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Casi agotado')
    expect(screen.queryByText('Editar')).toBeNull()
    unmount()
    montar('NOPE')
    expect(screen.getByText(/No existe el producto/)).toBeTruthy()
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

  it('MOCK axios: Reportes lee las órdenes desde GET /boletas y muestra el total vendido', async () => {
    spyOn(api, 'get').and.callFake(exito([orden('ORD-1', 'Pagada', 25000)]))
    renderizarEnRuta(<Reportes />)
    expect((await screen.findAllByText(/25\.000/)).length).toBeGreaterThan(0)
    expect(api.get).toHaveBeenCalledWith('/boletas')
  })

  it('Reportes muestra el error si la API falla', async () => {
    spyOn(api, 'get').and.callFake(rechazo(500, { message: 'Servicio caído' }))
    renderizarEnRuta(<Reportes />)
    expect(await screen.findByText('Servicio caído')).toBeTruthy()
  })

  it('MOCK axios: Ordenes lista las órdenes de la API (más recientes primero)', async () => {
    spyOn(api, 'get').and.callFake(exito([orden('ORD-1', 'Pagada', 25000), orden('ORD-2', 'Rechazada', 9000)]))
    const { container } = render(<MemoryRouter initialEntries={['/admin/ordenes']}><Routes><Route path="/admin/ordenes" element={<Ordenes />} /></Routes></MemoryRouter>)
    await screen.findByText('ORD-1')
    expect([...container.querySelectorAll('tbody tr td:first-child')].map((c) => c.textContent)).toEqual(['ORD-2', 'ORD-1'])
  })

  it('MOCK axios: Ordenes /:id pide la boleta a GET /boletas/:id', async () => {
    spyOn(api, 'get').and.callFake(exito(orden('ORD-1', 'Pagada', 25000)))
    render(
      <MemoryRouter initialEntries={['/admin/ordenes/ORD-1']}>
        <Routes><Route path="/admin/ordenes/:id" element={<Ordenes />} /></Routes>
      </MemoryRouter>)
    expect(screen.getByText('Boleta ORD-1')).toBeTruthy()
    expect(await screen.findByText(/Ana Soto/)).toBeTruthy()
    expect(api.get).toHaveBeenCalledWith('/boletas/ORD-1')
  })

  it('Ordenes /:id con una orden inexistente (404) muestra el aviso', async () => {
    spyOn(api, 'get').and.callFake(rechazo(404))
    render(<MemoryRouter initialEntries={['/admin/ordenes/NOPE']}><Routes><Route path="/admin/ordenes/:id" element={<Ordenes />} /></Routes></MemoryRouter>)
    expect(await screen.findByText(/No existe la orden/)).toBeTruthy()
  })

  it('MOCK axios: CategoriasAdmin crea una categoría (POST /categorias) y recarga', async () => {
    spyOn(api, 'post').and.callFake(exito({}))
    const onCambio = jasmine.createSpy('onCambio')
    renderizarEnRuta(<CategoriasAdmin productos={lista} categorias={[{ value: 'accesorios', label: 'Accesorios' }]} onCambio={onCambio} />)
    fireEvent.change(screen.getByLabelText('Nueva categoría'), { target: { value: 'Monitores 4K' } })
    fireEvent.click(screen.getByText('Crear categoría'))
    await waitFor(() => expect(onCambio).toHaveBeenCalledTimes(1))
    expect(api.post).toHaveBeenCalledWith('/categorias', { nombre: 'Monitores 4K', descripcion: '' })
  })

  it('CategoriasAdmin valida nombres repetidos sin llamar a la API', () => {
    spyOn(api, 'post')
    renderizarEnRuta(<CategoriasAdmin productos={lista} categorias={[{ value: 'monitores-4k', label: 'Monitores 4K' }]} onCambio={() => {}} />)
    fireEvent.change(screen.getByLabelText('Nueva categoría'), { target: { value: 'monitores 4k' } })
    fireEvent.click(screen.getByText('Crear categoría'))
    expect(screen.getByText('Ya existe una categoría con ese nombre.')).toBeTruthy()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('MOCK axios: CategoriasAdmin elimina una categoría sin productos (DELETE) y recarga', async () => {
    spyOn(api, 'delete').and.callFake(exito({}))
    const onCambio = jasmine.createSpy('onCambio')
    renderizarEnRuta(<CategoriasAdmin productos={lista} categorias={[{ value: 'vacia', label: 'Vacía' }]} onCambio={onCambio} />)
    fireEvent.click(screen.getByText('vacia').closest('tr').querySelector('button.danger'))
    await waitFor(() => expect(onCambio).toHaveBeenCalledTimes(1))
    expect(api.delete).toHaveBeenCalledWith('/categorias/vacia')
  })

  it('CategoriasAdmin no elimina una categoría que tiene productos', () => {
    spyOn(api, 'delete')
    renderizarEnRuta(<CategoriasAdmin productos={lista} categorias={[{ value: 'accesorios', label: 'Accesorios' }]} onCambio={() => {}} />)
    const fila = screen.getByText('accesorios').closest('tr')
    fireEvent.click(fila.querySelector('button.danger'))
    expect(screen.getByText('No se puede eliminar: la categoría tiene productos.')).toBeTruthy()
    expect(api.delete).not.toHaveBeenCalled()
  })
})

describe('AdminLayout (guardia por rol y menú según el rol)', () => {
  const montar = (sesion) => render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/login" element={<p>LOGIN</p>} /><Route path="/" element={<p>TIENDA</p>} />
        <Route path="/admin" element={<AdminLayout sesion={sesion} onSalir={() => {}} />}><Route index element={<p>INICIO ADMIN</p>} /></Route>
      </Routes>
    </MemoryRouter>)

  it('sin sesión redirige al login', () => { montar(null); expect(screen.getByText('LOGIN')).toBeTruthy() })
  it('un cliente vuelve a la tienda', () => { montar({ tipoUsuario: 'Cliente', nombre: 'Ana' }); expect(screen.getByText('TIENDA')).toBeTruthy() })

  it('el Vendedor solo ve Órdenes y Productos: sin Dashboard, Críticos, Categorías, Reportes, Perfil ni Usuarios', () => {
    montar({ tipoUsuario: 'Vendedor', nombre: 'Val', apellidos: 'R' })
    expect(screen.getByText('INICIO ADMIN')).toBeTruthy()
    expect(screen.getByText(/Órdenes/)).toBeTruthy()
    expect(screen.getByText(/Productos/)).toBeTruthy()
    for (const oculto of [/Dashboard/, /Críticos/, /Categorías/, /Reportes/, /Perfil/, /Usuarios/]) {
      expect(screen.queryByText(oculto)).toBeNull()
    }
  })

  it('el Administrador ve el menú completo', () => {
    montar({ tipoUsuario: 'Administrador', nombre: 'Admin' })
    for (const visible of [/Dashboard/, /Órdenes/, /Productos/, /Críticos/, /Categorías/, /Reportes/, /Usuarios/, /Perfil/]) {
      expect(screen.getByText(visible)).toBeTruthy()
    }
  })
})

describe('SoloRoles (guardia por rol en las rutas)', () => {
  const montar = (sesion, roles) => render(
    <MemoryRouter initialEntries={['/admin/reportes']}>
      <Routes>
        <Route path="/admin" element={<p>HOME ADMIN</p>} />
        <Route element={<SoloRoles sesion={sesion} roles={roles} />}><Route path="/admin/reportes" element={<p>REPORTES</p>} /></Route>
      </Routes>
    </MemoryRouter>)

  it('deja pasar al rol permitido', () => { montar({ tipoUsuario: 'Administrador' }, ['Administrador']); expect(screen.getByText('REPORTES')).toBeTruthy() })
  it('el Vendedor no entra a una ruta solo de Administrador', () => { montar({ tipoUsuario: 'Vendedor' }, ['Administrador']); expect(screen.getByText('HOME ADMIN')).toBeTruthy() })
  it('permite varios roles a la vez', () => { montar({ tipoUsuario: 'Vendedor' }, ['Administrador', 'Vendedor']); expect(screen.getByText('REPORTES')).toBeTruthy() })
  it('sin sesión no entra', () => { montar(null, ['Administrador', 'Vendedor']); expect(screen.getByText('HOME ADMIN')).toBeTruthy() })
})
