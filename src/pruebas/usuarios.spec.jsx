import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import UsuariosAdmin from '../paginas/admin/UsuariosAdmin.jsx'
import UsuarioForm from '../paginas/admin/UsuarioForm.jsx'
import Catalogo from '../paginas/Catalogo.jsx'
import Blogs from '../paginas/Blogs.jsx'
import Nosotros from '../paginas/Nosotros.jsx'
import { leerUsuarios } from '../utilidades/almacen.js'
import { producto, renderizarEnRuta } from './ayudas.jsx'

const escribir = (etiqueta, valor) => fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } })
beforeEach(() => localStorage.clear())
afterAll(() => localStorage.clear())

describe('UsuariosAdmin (CRUD de usuarios)', () => {
  it('lista los usuarios semilla con su rol', () => {
    renderizarEnRuta(<UsuariosAdmin />)
    expect(screen.getByText('admin@duoc.cl')).toBeTruthy()
    expect(screen.getByText('vrojas@gmail.com')).toBeTruthy()
  })

  it('MOCK: elimina un usuario solo si se confirma', () => {
    const confirmar = spyOn(window, 'confirm').and.returnValues(false, true)
    renderizarEnRuta(<UsuariosAdmin />)
    fireEvent.click(screen.getAllByText('Eliminar')[1])
    expect(leerUsuarios().length).toBe(2)
    fireEvent.click(screen.getAllByText('Eliminar')[1])
    expect(confirmar).toHaveBeenCalledTimes(2)
    expect(leerUsuarios().length).toBe(1)
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

  it('crea un usuario válido con contraseña inicial y vuelve al listado', () => {
    montar('/admin/usuarios/nuevo')
    escribir('RUN (sin puntos ni guion)', '10000013K'); escribir('Tipo de usuario', 'Cliente'); escribir('Nombre', 'Luis'); escribir('Apellidos', 'Mora')
    escribir('Correo electrónico', 'luis@gmail.com'); escribir('Dirección', 'Av. Central 10')
    fireEvent.click(screen.getByRole('button', { name: /Guardar/ }))
    expect(screen.getByText('LISTADO USUARIOS')).toBeTruthy()
    expect(leerUsuarios().find((u) => u.run === '10000013K').password).toBe('levelup2026')
  })

  it('rechaza un RUN repetido y un correo ya usado', () => {
    montar('/admin/usuarios/nuevo')
    escribir('RUN (sin puntos ni guion)', '123456785'); fireEvent.blur(screen.getByLabelText('RUN (sin puntos ni guion)'))
    escribir('Correo electrónico', 'admin@duoc.cl'); fireEvent.blur(screen.getByLabelText('Correo electrónico'))
    expect(screen.getByText('Ya existe un usuario con ese RUN.')).toBeTruthy()
    expect(screen.getByText('Ya existe un usuario con ese correo.')).toBeTruthy()
  })

  it('al editar, el RUN viene cargado y el usuario inexistente muestra aviso', () => {
    montar('/admin/usuarios/123456785/editar')
    expect(screen.getByLabelText('RUN (sin puntos ni guion)').value).toBe('123456785')
  })
  it('editar un RUN que no existe muestra el aviso', () => {
    montar('/admin/usuarios/000/editar')
    expect(screen.getByText(/No existe el usuario/)).toBeTruthy()
  })
})

describe('Catalogo (interacción con los filtros)', () => {
  const lista = [producto({ codigo: 'A', nombre: 'Mouse', categoria: 'mouse', precio: 5000 }), producto({ codigo: 'B', nombre: 'Silla', categoria: 'sillas-gamers', precio: 90000 })]
  const montar = () => render(<MemoryRouter initialEntries={['/catalogo']}><Catalogo productos={lista} onAgregar={() => {}} /></MemoryRouter>)

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
