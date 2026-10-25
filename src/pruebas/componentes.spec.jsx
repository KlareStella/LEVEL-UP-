import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import Campo from '../componentes/Campo.jsx'
import TarjetaProducto from '../componentes/TarjetaProducto.jsx'
import GrillaProductos from '../componentes/GrillaProductos.jsx'
import SoloAdmin from '../componentes/SoloAdmin.jsx'
import BarraNavegacion from '../componentes/BarraNavegacion.jsx'
import ResumenOrden from '../componentes/ResumenOrden.jsx'
import { producto, renderizarEnRuta } from './ayudas.jsx'

describe('Campo (props + renderizado condicional)', () => {
  it('asocia la etiqueta al control y muestra el mensaje de error recibido', () => {
    render(<Campo id="x" etiqueta="Correo" error="Obligatorio"><input id="x" /></Campo>)
    expect(screen.getByLabelText('Correo')).toBeTruthy()
    expect(screen.getByText('Obligatorio')).toBeTruthy()
  })

  it('muestra la pista solo cuando se entrega y marca el campo como inválido', () => {
    const { container, rerender } = render(<Campo id="x" etiqueta="A"><input id="x" /></Campo>)
    expect(container.querySelector('.hint')).toBeNull()
    rerender(<Campo id="x" etiqueta="A" pista="Ayuda" error="Mal"><input id="x" /></Campo>)
    expect(screen.getByText('Ayuda')).toBeTruthy()
    expect(container.querySelector('.field.is-invalid')).not.toBeNull()
  })
})

describe('TarjetaProducto', () => {
  it('renderiza nombre, categoría y precio recibidos por props', () => {
    renderizarEnRuta(<TarjetaProducto producto={producto()} onAgregar={() => {}} />)
    expect(screen.getAllByText('Teclado Test').length).toBeGreaterThan(0)
    expect(screen.getByText('Accesorios')).toBeTruthy()
    expect(screen.getByText(/10\.000/)).toBeTruthy()
  })

  it('MOCK: al hacer clic llama onAgregar con el código y cantidad 1', () => {
    const onAgregar = jasmine.createSpy('onAgregar')
    renderizarEnRuta(<TarjetaProducto producto={producto()} onAgregar={onAgregar} />)
    fireEvent.click(screen.getByRole('button', { name: 'Añadir al carrito' }))
    expect(onAgregar).toHaveBeenCalledOnceWith('T001', 1)
  })

  it('ESTADO: muestra "¡Añadido!" y vuelve al texto original después de 1 segundo', () => {
    jasmine.clock().install()
    try {
      renderizarEnRuta(<TarjetaProducto producto={producto()} onAgregar={() => {}} />)
      fireEvent.click(screen.getByRole('button'))
      expect(screen.getByRole('button').textContent).toBe('¡Añadido!')
      act(() => jasmine.clock().tick(1001))
      expect(screen.getByRole('button').textContent).toBe('Añadir al carrito')
    } finally { jasmine.clock().uninstall() }
  })

  it('stock en cero deshabilita el botón y avisa "Sin stock"', () => {
    renderizarEnRuta(<TarjetaProducto producto={producto({ stock: 0 })} onAgregar={() => {}} />)
    expect(screen.getByRole('button').disabled).toBeTrue()
    expect(screen.getByText('Sin stock')).toBeTruthy()
  })

  it('stock bajo muestra la advertencia con las unidades restantes', () => {
    renderizarEnRuta(<TarjetaProducto producto={producto({ stock: 2 })} onAgregar={() => {}} />)
    expect(screen.getByText('¡Quedan solo 2 unidades!')).toBeTruthy()
  })

  it('un producto en oferta muestra la insignia de descuento y el precio rebajado', () => {
    renderizarEnRuta(<TarjetaProducto producto={producto({ descuento: 20 })} onAgregar={() => {}} />)
    expect(screen.getByText('-20%')).toBeTruthy()
    expect(screen.getByText(/8\.000/)).toBeTruthy()
  })
})

describe('GrillaProductos (listas)', () => {
  it('renderiza una tarjeta por cada producto del arreglo', () => {
    const lista = [producto({ codigo: 'A1', nombre: 'Uno' }), producto({ codigo: 'A2', nombre: 'Dos' }), producto({ codigo: 'A3', nombre: 'Tres' })]
    const { container } = renderizarEnRuta(<GrillaProductos productos={lista} onAgregar={() => {}} />)
    expect(container.querySelectorAll('article.product-card').length).toBe(3)
  })
})

describe('SoloAdmin (ruta protegida por rol)', () => {
  const montar = (sesion) => render(
    <MemoryRouter initialEntries={['/admin/usuarios']}>
      <Routes>
        <Route path="/admin" element={<p>DASHBOARD</p>} />
        <Route element={<SoloAdmin sesion={sesion} />}><Route path="/admin/usuarios" element={<p>USUARIOS</p>} /></Route>
      </Routes>
    </MemoryRouter>)

  it('deja pasar al Administrador', () => { montar({ tipoUsuario: 'Administrador' }); expect(screen.getByText('USUARIOS')).toBeTruthy() })
  it('redirige al Vendedor al dashboard', () => { montar({ tipoUsuario: 'Vendedor' }); expect(screen.getByText('DASHBOARD')).toBeTruthy() })
  it('redirige si no hay sesión', () => { montar(null); expect(screen.getByText('DASHBOARD')).toBeTruthy() })
})

describe('BarraNavegacion', () => {
  it('sin sesión ofrece "Iniciar sesión" y muestra la cantidad del carrito', () => {
    renderizarEnRuta(<BarraNavegacion totalCarrito={3} sesion={null} onSalir={() => {}} />)
    expect(screen.getByText('Iniciar sesión')).toBeTruthy()
    expect(screen.getByLabelText('Ver carrito').textContent).toContain('3')
  })

  it('con sesión de cliente saluda, no muestra el panel y "Salir" llama al callback', () => {
    const onSalir = jasmine.createSpy('onSalir')
    renderizarEnRuta(<BarraNavegacion totalCarrito={0} sesion={{ nombre: 'Ana', tipoUsuario: 'Cliente' }} onSalir={onSalir} />)
    expect(screen.getByText('Ana')).toBeTruthy()
    expect(screen.queryByText('Panel')).toBeNull()
    fireEvent.click(screen.getByText('Salir'))
    expect(onSalir).toHaveBeenCalled()
  })

  it('el personal (Administrador/Vendedor) ve el enlace al Panel', () => {
    renderizarEnRuta(<BarraNavegacion totalCarrito={0} sesion={{ nombre: 'Admin', tipoUsuario: 'Administrador' }} onSalir={() => {}} />)
    expect(screen.getByText('Panel')).toBeTruthy()
  })
})

describe('ResumenOrden', () => {
  const orden = {
    estado: 'Pagada', descuento: 0, total: 20000,
    cliente: { nombre: 'Pedro', apellidos: 'Hacker', correo: 'p@duoc.cl' },
    direccion: { calle: 'Los Crisantemos', departamento: '603', region: 'RM', comuna: 'Cerrillos', indicaciones: 'Dejar con conserje' },
    lineas: [{ codigo: 'T001', nombre: 'Teclado Test', imagen: 'pictures/ps5.png', precio: 10000, cantidad: 2 }],
  }
  it('muestra cliente, dirección, líneas y total pagado', () => {
    renderizarEnRuta(<ResumenOrden orden={orden} />)
    expect(screen.getByText(/Pedro Hacker/)).toBeTruthy()
    expect(screen.getByText(/Cerrillos/)).toBeTruthy()
    expect(screen.getByText('Teclado Test')).toBeTruthy()
    expect(screen.getByText(/Total pagado/)).toBeTruthy()
  })
  it('una orden rechazada dice "a pagar" y sin indicaciones no las muestra', () => {
    renderizarEnRuta(<ResumenOrden orden={{ ...orden, estado: 'Rechazada', direccion: { ...orden.direccion, indicaciones: '' } }} />)
    expect(screen.getByText(/Total a pagar/)).toBeTruthy()
    expect(screen.queryByText('Indicaciones')).toBeNull()
  })
})
