import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import Registro from '../paginas/Registro.jsx'
import Contacto from '../paginas/Contacto.jsx'
import DetalleProducto from '../paginas/DetalleProducto.jsx'
import DetalleBlog from '../paginas/DetalleBlog.jsx'
import ProductoForm from '../paginas/admin/ProductoForm.jsx'
import Perfil from '../paginas/admin/Perfil.jsx'
import HistorialCompras from '../paginas/admin/HistorialCompras.jsx'
import Dashboard from '../paginas/admin/Dashboard.jsx'
import PiePagina from '../componentes/PiePagina.jsx'
import { ordenesDB, usuariosDB } from '../datos/baseDatos.js'
import { leerUsuarios } from '../utilidades/almacen.js'
import { producto, renderizarEnRuta } from './ayudas.jsx'

const escribir = (etiqueta, valor) => fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } })
beforeEach(() => localStorage.clear())
afterAll(() => localStorage.clear())

describe('Registro (validación de formulario)', () => {
  const datosValidos = () => {
    escribir('RUN (sin puntos ni guion)', '10000013K'); escribir('Nombre completo', 'Ana'); escribir('Apellidos', 'Soto Mena')
    escribir('Correo electrónico', 'ana@duoc.cl'); escribir('Contraseña', 'clave1'); escribir('Confirmar contraseña', 'clave1')
    escribir('Región', 'Región de Valparaíso'); escribir('Comuna', 'Quilpué'); escribir('Dirección', 'Calle Falsa 123')
  }

  it('formulario vacío: muestra errores y no crea el usuario', () => {
    renderizarEnRuta(<Registro onLogin={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /Crear cuenta|Registrarme|Registrar/i }))
    expect(screen.getByText('El RUN es obligatorio.')).toBeTruthy()
    expect(leerUsuarios().length).toBe(2) 
  })

  it('las contraseñas distintas generan error', () => {
    renderizarEnRuta(<Registro onLogin={() => {}} />)
    escribir('Contraseña', 'clave1'); escribir('Confirmar contraseña', 'otra')
    fireEvent.blur(screen.getByLabelText('Confirmar contraseña'))
    expect(screen.getByText('Las contraseñas no coinciden.')).toBeTruthy()
  })

  it('un RUN con dígito verificador incorrecto es rechazado', () => {
    renderizarEnRuta(<Registro onLogin={() => {}} />)
    escribir('RUN (sin puntos ni guion)', '100000130')
    fireEvent.blur(screen.getByLabelText('RUN (sin puntos ni guion)'))
    expect(screen.getByText(/El RUN no es válido/)).toBeTruthy()
  })

  it('datos válidos: guarda el usuario, inicia sesión (mock) y avisa el éxito', () => {
    jasmine.clock().install()
    try {
      const onLogin = jasmine.createSpy('onLogin')
      renderizarEnRuta(<Registro onLogin={onLogin} />)
      datosValidos()
      fireEvent.click(screen.getByRole('button', { name: /Crear cuenta|Registrarme|Registrar/i }))
      expect(screen.getByText(/Cuenta creada con éxito/)).toBeTruthy()
      expect(onLogin).toHaveBeenCalled()
      expect(leerUsuarios().some((u) => u.correo === 'ana@duoc.cl')).toBeTrue()
      act(() => jasmine.clock().tick(1100))
    } finally { jasmine.clock().uninstall() }
  })

  it('un correo ya registrado muestra un error y no duplica el usuario', () => {
    renderizarEnRuta(<Registro onLogin={() => {}} />)
    datosValidos()
    escribir('Correo electrónico', 'admin@duoc.cl')
    fireEvent.click(screen.getByRole('button', { name: /Crear cuenta|Registrarme|Registrar/i }))
    expect(screen.getByText('Ya existe una cuenta registrada con ese correo.')).toBeTruthy()
    expect(leerUsuarios().length).toBe(2)
  })
})

describe('Contacto', () => {
  it('sin datos muestra error y con datos válidos confirma el envío', () => {
    renderizarEnRuta(<Contacto />)
    fireEvent.click(screen.getByRole('button', { name: /Enviar/i }))
    expect(screen.getByText('Revisa los campos marcados en rojo.')).toBeTruthy()
    escribir('Nombre completo', 'Ana Soto'); escribir('¿En qué te ayudamos?', 'Quiero información de despacho.')
    fireEvent.click(screen.getByRole('button', { name: /Enviar/i }))
    expect(screen.getByText(/Tu mensaje fue enviado/)).toBeTruthy()
  })
})

describe('DetalleProducto (useParams + estado de cantidad)', () => {
  const lista = [producto({ codigo: 'T001', stock: 5 }), producto({ codigo: 'T002', stock: 5 })]
  const montar = (id, onAgregar = () => {}) => render(
    <MemoryRouter initialEntries={[`/producto/${id}`]}>
      <Routes>
        <Route path="/producto/:id" element={<DetalleProducto productos={lista} onAgregar={onAgregar} />} />
        <Route path="/checkout" element={<p>IR A CHECKOUT</p>} /><Route path="/carrito" element={<p>IR A CARRITO</p>} />
      </Routes>
    </MemoryRouter>)

  it('un código inexistente muestra un mensaje claro', () => {
    montar('NOPE')
    expect(screen.getByText(/No existe el producto/)).toBeTruthy()
  })

  it('MOCK: el stepper cambia la cantidad (sin pasar el stock) y se envía a onAgregar', () => {
    const onAgregar = jasmine.createSpy('onAgregar')
    montar('T001', onAgregar)
    for (let i = 0; i < 10; i++) fireEvent.click(screen.getByText('+'))
    expect(screen.getByRole('spinbutton').value).toBe('5')
    fireEvent.click(screen.getAllByRole('button', { name: 'Añadir al carrito' })[0])
    expect(onAgregar).toHaveBeenCalledWith('T001', 5)
  })

  it('el stepper no baja de 1 unidad', () => {
    montar('T001')
    fireEvent.click(screen.getByText('−'))
    expect(screen.getByRole('spinbutton').value).toBe('1')
  })
})

describe('DetalleBlog (id numérico en la URL)', () => {
  const montar = (id) => render(<MemoryRouter initialEntries={[`/blogs/${id}`]}><Routes><Route path="/blogs/:id" element={<DetalleBlog />} /></Routes></MemoryRouter>)
  it('convierte el id a número y muestra el blog', () => { montar('1'); expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('parche') })
  it('un id inexistente muestra el aviso', () => { montar('99'); expect(screen.getByText('No existe el blog 99')).toBeTruthy() })
})

describe('ProductoForm (admin)', () => {
  const montar = (ruta, productos, setProductos) => render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/admin/productos/nuevo" element={<ProductoForm productos={productos} setProductos={setProductos} />} />
        <Route path="/admin/productos/:codigo/editar" element={<ProductoForm productos={productos} setProductos={setProductos} />} />
        <Route path="/admin/productos" element={<p>LISTADO</p>} />
      </Routes>
    </MemoryRouter>)

  it('crea un producto nuevo con datos válidos (incluye el descuento de oferta)', () => {
    const setProductos = jasmine.createSpy('setProductos')
    montar('/admin/productos/nuevo', [], setProductos)
    escribir('Código de producto', 'zz001'); escribir('Categoría', 'mouse'); escribir('Nombre del producto', 'Mouse X')
    escribir('Precio (CLP)', '15990'); escribir('Stock', '8'); escribir('Descuento de oferta % (opcional)', '10')
    fireEvent.click(screen.getByText('Guardar producto'))
    const creado = setProductos.calls.mostRecent().args[0]([])[0]
    expect(creado).toEqual(jasmine.objectContaining({ codigo: 'ZZ001', precio: 15990, stock: 8, descuento: 10, categoriaLabel: 'Mouse' }))
    expect(screen.getByText('LISTADO')).toBeTruthy()
  })

  it('rechaza código repetido, precio no numérico y descuento mayor a 90', () => {
    montar('/admin/productos/nuevo', [producto({ codigo: 'DUP01' })], () => {})
    escribir('Código de producto', 'dup01'); fireEvent.blur(screen.getByLabelText('Código de producto'))
    escribir('Precio (CLP)', 'abc'); fireEvent.blur(screen.getByLabelText('Precio (CLP)'))
    escribir('Descuento de oferta % (opcional)', '95'); fireEvent.blur(screen.getByLabelText('Descuento de oferta % (opcional)'))
    expect(screen.getByText('Ya existe un producto con ese código.')).toBeTruthy()
    expect(screen.getByText('Ingresa un número válido (0 o más).')).toBeTruthy()
    expect(screen.getByText('Entero entre 0 y 90.')).toBeTruthy()
  })

  it('editar un código inexistente muestra el aviso', () => {
    montar('/admin/productos/NOPE/editar', [], () => {})
    expect(screen.getByText(/No existe el producto/)).toBeTruthy()
  })
})

describe('Perfil, historial y dashboard', () => {
  it('Perfil guarda los cambios en usuariosDB y notifica a la app (mock)', () => {
    const admin = leerUsuarios()[0]
    const onActualizar = jasmine.createSpy('onActualizar')
    renderizarEnRuta(<Perfil sesion={admin} onActualizar={onActualizar} />)
    escribir('Nombre', 'Administradora'); fireEvent.click(screen.getByText('Guardar perfil'))
    expect(usuariosDB.obtener(admin.run).nombre).toBe('Administradora')
    expect(onActualizar).toHaveBeenCalled()
    expect(screen.getByText('Perfil actualizado.')).toBeTruthy()
  })

  it('Perfil exige nombre y apellidos', () => {
    renderizarEnRuta(<Perfil sesion={leerUsuarios()[0]} onActualizar={() => {}} />)
    escribir('Nombre', '   '); fireEvent.click(screen.getByText('Guardar perfil'))
    expect(screen.getByText('Nombre y apellidos son obligatorios.')).toBeTruthy()
  })

  it('HistorialCompras muestra solo las órdenes del usuario (por RUN)', () => {
    const base = { fecha: '2026-10-22T10:00:00Z', estado: 'Pagada', total: 5000, subtotal: 5000, descuento: 0, cliente: {}, direccion: {}, lineas: [] }
    ordenesDB.crear({ ...base, id: 'ORD-A', run: '123456785' })
    ordenesDB.crear({ ...base, id: 'ORD-B', run: '999999999' })
    render(<MemoryRouter initialEntries={['/admin/usuarios/123456785/historial']}><Routes><Route path="/admin/usuarios/:run/historial" element={<HistorialCompras />} /></Routes></MemoryRouter>)
    expect(screen.getByText('ORD-A')).toBeTruthy()
    expect(screen.queryByText('ORD-B')).toBeNull()
  })

  it('Dashboard cuenta productos con stock bajo y sin stock', () => {
    const lista = [producto({ codigo: 'A', stock: 2, stockCritico: 5 }), producto({ codigo: 'B', stock: 0 }), producto({ codigo: 'C', stock: 50 })]
    const { container } = renderizarEnRuta(<Dashboard productos={lista} />)
    const valores = [...container.querySelectorAll('.stat-value')].map((n) => n.textContent)
    expect(valores[0]).toBe('3')
    expect(valores).toContain('1')
  })
})

describe('PiePagina (formulario controlado)', () => {
  it('suscribirse con un correo muestra el agradecimiento y limpia el campo', () => {
    renderizarEnRuta(<PiePagina />)
    const campo = screen.getByRole('textbox')
    fireEvent.change(campo, { target: { value: 'ana@duoc.cl' } })
    fireEvent.submit(campo.closest('form'))
    expect(screen.getByText('¡Gracias por suscribirte!')).toBeTruthy()
    expect(screen.getByRole('textbox').value).toBe('')
  })
})
