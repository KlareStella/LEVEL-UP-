import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import UsuariosAdmin from '../paginas/admin/UsuariosAdmin.jsx'
import UsuarioForm from '../paginas/admin/UsuarioForm.jsx'
import Catalogo from '../paginas/Catalogo.jsx'
import Blogs from '../paginas/Blogs.jsx'
import Nosotros from '../paginas/Nosotros.jsx'
import api from '../servicios/api.js'
import { exito, producto, rechazo, renderizarEnRuta } from './ayudas.jsx'

const escribir = (etiqueta, valor) => fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } })

const usuariosApi = () => [
  { run: '123456785', nombre: 'Admin', apellidos: 'Level-Up', correo: 'admin@duoc.cl', tipoUsuario: 'Administrador' },
  { run: '987654325', nombre: 'Valentina', apellidos: 'Rojas', correo: 'vrojas@gmail.com', tipoUsuario: 'Vendedor' },
]

describe('UsuariosAdmin (CRUD de usuarios contra la API)', () => {
  it('MOCK axios: lista los usuarios que devuelve GET /usuarios con su rol', async () => {
    spyOn(api, 'get').and.callFake(exito(usuariosApi()))
    renderizarEnRuta(<UsuariosAdmin />)
    expect(await screen.findByText('admin@duoc.cl')).toBeTruthy()
    expect(screen.getByText('vrojas@gmail.com')).toBeTruthy()
    expect(api.get).toHaveBeenCalledWith('/usuarios')
  })

  it('si la API falla muestra el error y permite reintentar', async () => {
    const get = spyOn(api, 'get').and.callFake(rechazo(500, { message: 'Error interno' }))
    renderizarEnRuta(<UsuariosAdmin />)
    expect(await screen.findByText('Error interno')).toBeTruthy()
    get.and.callFake(exito(usuariosApi()))
    fireEvent.click(screen.getByText('Reintentar'))
    expect(await screen.findByText('admin@duoc.cl')).toBeTruthy()
  })

  it('MOCK: elimina un usuario (DELETE) solo si se confirma y recarga la lista', async () => {
    let lista = usuariosApi()
    spyOn(api, 'get').and.callFake(() => Promise.resolve({ data: lista }))
    spyOn(api, 'delete').and.callFake((url) => {
      lista = lista.filter((u) => u.run !== decodeURIComponent(url.split('/').pop()))
      return Promise.resolve({ data: {} })
    })
    const confirmar = spyOn(window, 'confirm').and.returnValues(false, true)
    renderizarEnRuta(<UsuariosAdmin />)
    await screen.findByText('vrojas@gmail.com')
    fireEvent.click(screen.getAllByText('Eliminar')[1])
    expect(api.delete).not.toHaveBeenCalled()
    fireEvent.click(screen.getAllByText('Eliminar')[1])
    await waitFor(() => expect(screen.queryByText('vrojas@gmail.com')).toBeNull())
    expect(confirmar).toHaveBeenCalledTimes(2)
    expect(api.delete).toHaveBeenCalledOnceWith('/usuarios/987654325')
  })
})

describe('UsuarioForm', () => {
  const montar = (ruta) => render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/admin/usuarios/nuevo" element={<UsuarioForm />} />
        <Route path="/admin/usuarios/:run/editar" element={<UsuarioForm />} />
        <Route path="/admin/usuarios" element={<p>LISTADO USUARIOS</p>} />
      </Routes>
    </MemoryRouter>)
  const llenarValido = () => {
    escribir('RUN (sin puntos ni guion)', '10000013K'); escribir('Tipo de usuario', 'Cliente'); escribir('Nombre', 'Luis'); escribir('Apellidos', 'Mora')
    escribir('Correo electrónico', 'luis@gmail.com'); escribir('Dirección', 'Av. Central 10')
  }
  beforeEach(() => spyOn(api, 'get').and.callFake(exito(usuariosApi())))

  it('crea un usuario válido (POST /usuarios/registro con contraseña inicial) y vuelve al listado', async () => {
    spyOn(api, 'post').and.callFake(exito({}))
    montar('/admin/usuarios/nuevo')
    await screen.findByLabelText('RUN (sin puntos ni guion)')
    llenarValido()
    fireEvent.click(screen.getByRole('button', { name: /Guardar/ }))
    expect(await screen.findByText('LISTADO USUARIOS')).toBeTruthy()
    expect(api.post).toHaveBeenCalledWith('/usuarios/registro', { nombre: 'Luis Mora', correo: 'luis@gmail.com', contrasena: 'levelup2026' })
  })

  it('si la API responde 409 muestra que el usuario ya existe y no navega', async () => {
    spyOn(api, 'post').and.callFake(rechazo(409))
    montar('/admin/usuarios/nuevo')
    await screen.findByLabelText('RUN (sin puntos ni guion)')
    llenarValido()
    fireEvent.click(screen.getByRole('button', { name: /Guardar/ }))
    expect(await screen.findByText('Ya existe un usuario con ese RUN o correo.')).toBeTruthy()
    expect(screen.queryByText('LISTADO USUARIOS')).toBeNull()
  })

  it('rechaza un RUN repetido y un correo ya usado (según los usuarios de la API)', async () => {
    montar('/admin/usuarios/nuevo')
    await screen.findByLabelText('RUN (sin puntos ni guion)')
    escribir('RUN (sin puntos ni guion)', '123456785'); fireEvent.blur(screen.getByLabelText('RUN (sin puntos ni guion)'))
    escribir('Correo electrónico', 'admin@duoc.cl'); fireEvent.blur(screen.getByLabelText('Correo electrónico'))
    expect(screen.getByText('Ya existe un usuario con ese RUN.')).toBeTruthy()
    expect(screen.getByText('Ya existe un usuario con ese correo.')).toBeTruthy()
  })

  it('al editar, el RUN viene cargado y se guarda con PUT sin enviar la contraseña', async () => {
    spyOn(api, 'put').and.callFake(exito({}))
    montar('/admin/usuarios/123456785/editar')
    expect((await screen.findByLabelText('RUN (sin puntos ni guion)')).value).toBe('123456785')
    escribir('Dirección', 'Nueva 456')
    fireEvent.click(screen.getByRole('button', { name: /Guardar/ }))
    expect(await screen.findByText('LISTADO USUARIOS')).toBeTruthy()
    const [url, cuerpo] = api.put.calls.mostRecent().args
    expect(url).toBe('/usuarios/123456785')
    expect(cuerpo).toEqual({ nombre: 'Admin Level-Up', correo: 'admin@duoc.cl' }) // sin contraseña; la API solo guarda nombre y correo
  })

  it('editar un RUN que no existe muestra el aviso', async () => {
    montar('/admin/usuarios/000/editar')
    expect(await screen.findByText(/No existe el usuario/)).toBeTruthy()
  })
})

describe('Catalogo (interacción con los filtros)', () => {
  const lista = [producto({ codigo: 'A', nombre: 'Mouse', categoria: 'mouse', precio: 5000 }), producto({ codigo: 'B', nombre: 'Silla', categoria: 'sillas-gamers', precio: 90000 })]
  const categorias = [{ value: 'mouse', label: 'Mouse' }, { value: 'sillas-gamers', label: 'Sillas Gamers' }]
  const montar = () => render(<MemoryRouter initialEntries={['/catalogo']}><Catalogo productos={lista} listaCategorias={categorias} onAgregar={() => {}} /></MemoryRouter>)

  it('marcar una categoría filtra la lista y "Limpiar filtros" la restaura', () => {
    montar()
    fireEvent.click(screen.getByLabelText('Mouse'))
    expect(screen.getByText('1 producto')).toBeTruthy()
    fireEvent.click(screen.getByText('Limpiar filtros'))
    expect(screen.getByText('2 productos')).toBeTruthy()
  })

  it('escribir en el buscador actualiza el resultado', () => {
    montar()
    fireEvent.change(screen.getByPlaceholderText('Buscar producto…'), { target: { value: 'silla' } })
    expect(screen.getByText('1 producto')).toBeTruthy()
  })

  it('cambiar el orden a "mayor a menor" pone el producto más caro primero', () => {
    const { container } = montar()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'precio-desc' } })
    expect(container.querySelector('.product-name').textContent).toBe('Silla')
  })
})

describe('Páginas informativas', () => {
  it('Blogs lista las entradas y Nosotros se renderiza', () => {
    const { unmount } = renderizarEnRuta(<Blogs />)
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy()
    unmount()
    renderizarEnRuta(<Nosotros />)
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy()
  })
})
