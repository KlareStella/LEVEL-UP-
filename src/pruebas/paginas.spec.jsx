import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import Login from '../paginas/Login.jsx'
import Carrito, { calcularTotales } from '../paginas/Carrito.jsx'
import Catalogo from '../paginas/Catalogo.jsx'
import Checkout from '../paginas/Checkout.jsx'
import Ofertas from '../paginas/Ofertas.jsx'
import Categorias from '../paginas/Categorias.jsx'
import CompraExitosa from '../paginas/CompraExitosa.jsx'
import CompraError from '../paginas/CompraError.jsx'
import { ordenesDB } from '../datos/baseDatos.js'
import { producto, renderizarEnRuta } from './ayudas.jsx'

const productos = [
  producto({ codigo: 'A1', nombre: 'Mouse Pro', categoria: 'mouse', categoriaLabel: 'Mouse', precio: 20000 }),
  producto({ codigo: 'A2', nombre: 'Teclado Pro', categoria: 'accesorios', precio: 36000, descuento: 50 }),
  producto({ codigo: 'A3', nombre: 'Silla Gamer', categoria: 'sillas-gamers', categoriaLabel: 'Sillas', precio: 100000 }),
]
const escribir = (etiqueta, valor) => fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } })

beforeEach(() => localStorage.clear())
afterAll(() => localStorage.clear())

describe('Login (formulario + validación)', () => {
  it('muestra errores de validación al enviar vacío y NO llama onLogin', () => {
    const onLogin = jasmine.createSpy('onLogin')
    renderizarEnRuta(<Login onLogin={onLogin} />)
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(screen.getByText('Ingresa tu correo.')).toBeTruthy()
    expect(screen.getByText('Revisa los campos marcados en rojo.')).toBeTruthy()
    expect(onLogin).not.toHaveBeenCalled()
  })

  it('rechaza dominios de correo no permitidos', () => {
    renderizarEnRuta(<Login onLogin={() => {}} />)
    escribir('Correo electrónico', 'ana@hotmail.com')
    fireEvent.blur(screen.getByLabelText('Correo electrónico'))
    expect(screen.getByText(/Usa un correo @duoc.cl/)).toBeTruthy()
  })

  it('credenciales incorrectas muestran un mensaje y no inician sesión', () => {
    const onLogin = jasmine.createSpy('onLogin')
    renderizarEnRuta(<Login onLogin={onLogin} />)
    escribir('Correo electrónico', 'admin@duoc.cl')
    escribir('Contraseña', 'mala1234')
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(screen.getByText('Correo o contraseña incorrectos.')).toBeTruthy()
    expect(onLogin).not.toHaveBeenCalled()
  })

  it('credenciales correctas llaman onLogin y redirigen al panel del administrador', () => {
    jasmine.clock().install()
    try {
      const onLogin = jasmine.createSpy('onLogin')
      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes><Route path="/login" element={<Login onLogin={onLogin} />} /><Route path="/admin" element={<p>PANEL ADMIN</p>} /></Routes>
        </MemoryRouter>)
      escribir('Correo electrónico', 'admin@duoc.cl')
      escribir('Contraseña', 'admin123')
      fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
      expect(onLogin).toHaveBeenCalledTimes(1)
      expect(onLogin.calls.mostRecent().args[0].tipoUsuario).toBe('Administrador')
      act(() => jasmine.clock().tick(800))
      expect(screen.getByText('PANEL ADMIN')).toBeTruthy()
    } finally { jasmine.clock().uninstall() }
  })
})

describe('Carrito (props, estado y reglas de negocio)', () => {
  it('calcularTotales: sin descuento para clientes comunes', () => {
    const t = calcularTotales([{ codigo: 'A1', cantidad: 2 }], productos, { correo: 'a@gmail.com' }, false)
    expect(t).toEqual(jasmine.objectContaining({ subtotal: 40000, descuento: 0, total: 40000 }))
  })

  it('calcularTotales: 20% con correo @duoc.cl o con cupón, y usa el precio de oferta', () => {
    const duoc = calcularTotales([{ codigo: 'A1', cantidad: 1 }], productos, { correo: 'a@duoc.cl' }, false)
    expect(duoc.total).toBe(16000)
    const oferta = calcularTotales([{ codigo: 'A2', cantidad: 1 }], productos, null, true)
    expect(oferta.subtotal).toBe(18000)
    expect(oferta.total).toBe(14400)
  })

  it('carrito vacío muestra el mensaje y el enlace al catálogo', () => {
    renderizarEnRuta(<Carrito carrito={[]} productos={productos} sesion={null} onCambiar={() => {}} onQuitar={() => {}} />)
    expect(screen.getByText('Tu carrito está vacío')).toBeTruthy()
    expect(screen.getByText('Ver productos')).toBeTruthy()
  })

  it('MOCK: los botones +, − y Eliminar llaman a los callbacks con el código correcto', () => {
    const onCambiar = jasmine.createSpy('onCambiar'); const onQuitar = jasmine.createSpy('onQuitar')
    renderizarEnRuta(<Carrito carrito={[{ codigo: 'A1', cantidad: 2 }]} productos={productos} sesion={null} onCambiar={onCambiar} onQuitar={onQuitar} />)
    fireEvent.click(screen.getByText('+'))
    fireEvent.click(screen.getByText('−'))
    fireEvent.click(screen.getByText('Eliminar'))
    expect(onCambiar.calls.allArgs()).toEqual([['A1', 1], ['A1', -1]])
    expect(onQuitar).toHaveBeenCalledWith('A1')
  })

  it('el cupón LEVELUP20 aplica 20% y un cupón inválido muestra error', () => {
    renderizarEnRuta(<Carrito carrito={[{ codigo: 'A1', cantidad: 1 }]} productos={productos} sesion={null} onCambiar={() => {}} onQuitar={() => {}} />)
    const campo = screen.getByPlaceholderText('Código de descuento')
    fireEvent.change(campo, { target: { value: 'xxx' } })
    fireEvent.click(screen.getByText('Aplicar'))
    expect(screen.getByText('Cupón no válido.')).toBeTruthy()
    fireEvent.change(campo, { target: { value: 'levelup20' } })
    fireEvent.click(screen.getByText('Aplicar'))
    expect(screen.getByText('Cupón aplicado: 20% de descuento.')).toBeTruthy()
    expect(screen.getByText(/Descuento \(20%\)/)).toBeTruthy()
  })
})

describe('Catalogo (filtros en la URL)', () => {
  const montar = (ruta) => render(
    <MemoryRouter initialEntries={[ruta]}><Catalogo productos={productos} onAgregar={() => {}} /></MemoryRouter>)

  it('sin filtros lista todos los productos', () => {
    montar('/catalogo')
    expect(screen.getByText('3 productos')).toBeTruthy()
  })

  it('filtra por texto de búsqueda (?buscar=)', () => {
    montar('/catalogo?buscar=silla')
    expect(screen.getByText('1 producto')).toBeTruthy()
    expect(screen.getAllByText('Silla Gamer').length).toBeGreaterThan(0)
  })

  it('filtra por categoría (?categoria=) y muestra mensaje si no hay resultados', () => {
    montar('/catalogo?categoria=mouse')
    expect(screen.getByText('1 producto')).toBeTruthy()
    montar('/catalogo?buscar=zzzz')
    expect(screen.getByText('No se encontraron productos con esos filtros.')).toBeTruthy()
  })

  it('ordena por precio final (considera la oferta)', () => {
    const { container } = montar('/catalogo?orden=precio-asc')
    const nombres = [...container.querySelectorAll('.product-name')].map((n) => n.textContent)
    expect(nombres).toEqual(['Teclado Pro', 'Mouse Pro', 'Silla Gamer'])
  })
})

describe('Ofertas y Categorias', () => {
  it('Ofertas muestra solo los productos con descuento', () => {
    renderizarEnRuta(<Ofertas productos={productos} onAgregar={() => {}} />)
    expect(screen.getByText('1 producto con descuento')).toBeTruthy()
    expect(screen.queryByText('Mouse Pro')).toBeNull()
  })

  it('Ofertas sin descuentos muestra el mensaje vacío', () => {
    renderizarEnRuta(<Ofertas productos={[productos[0]]} onAgregar={() => {}} />)
    expect(screen.getByText('Por ahora no hay productos en oferta.')).toBeTruthy()
  })

  it('Categorias/:valor muestra los productos de esa categoría', () => {
    render(
      <MemoryRouter initialEntries={['/categorias/mouse']}>
        <Routes><Route path="/categorias/:valor" element={<Categorias productos={productos} onAgregar={() => {}} />} /></Routes>
      </MemoryRouter>)
    expect(screen.getAllByText('Mouse Pro').length).toBeGreaterThan(0)
    expect(screen.queryByText('Silla Gamer')).toBeNull()
  })

  it('Categorias con una categoría inexistente avisa al usuario', () => {
    render(
      <MemoryRouter initialEntries={['/categorias/no-existe']}>
        <Routes><Route path="/categorias/:valor" element={<Categorias productos={productos} onAgregar={() => {}} />} /></Routes>
      </MemoryRouter>)
    expect(screen.getByText(/no existe/)).toBeTruthy()
  })
})

describe('Checkout (formulario, mock de pago y navegación)', () => {
  const carrito = [{ codigo: 'A1', cantidad: 2 }]
  const rutas = (procesarPago, onVaciar, sesion = null, items = carrito) => (
    <MemoryRouter initialEntries={['/checkout']}>
      <Routes>
        <Route path="/checkout" element={<Checkout carrito={items} productos={productos} sesion={sesion} onVaciar={onVaciar} procesarPago={procesarPago} />} />
        <Route path="/carrito" element={<p>PAGINA CARRITO</p>} />
        <Route path="/compra-exitosa/:id" element={<CompraExitosa />} />
        <Route path="/compra-error/:id" element={<CompraError />} />
      </Routes>
    </MemoryRouter>)
  const completar = () => {
    escribir('Nombre', 'Pedro'); escribir('Apellidos', 'Hacker'); escribir('Correo', 'pedro@gmail.com'); escribir('Calle', 'Los Crisantemos 123')
    escribir('Región', 'Región Metropolitana de Santiago'); escribir('Comuna', 'Santiago')
  }

  it('con el carrito vacío redirige a /carrito', () => {
    render(rutas(() => ({ ok: true }), () => {}, null, []))
    expect(screen.getByText('PAGINA CARRITO')).toBeTruthy()
  })

  it('formulario vacío: muestra errores y NO procesa el pago', () => {
    const pago = jasmine.createSpy('procesarPago').and.returnValue({ ok: true })
    render(rutas(pago, () => {}))
    fireEvent.click(screen.getByRole('button', { name: /Pagar ahora/ }))
    expect(screen.getByText('El nombre es obligatorio.')).toBeTruthy()
    expect(screen.getByText('Selecciona una región.')).toBeTruthy()
    expect(pago).not.toHaveBeenCalled()
  })

  it('con sesión iniciada los datos del cliente se rellenan automáticamente', () => {
    render(rutas(() => ({ ok: true }), () => {}, { nombre: 'Ana', apellidos: 'Soto', correo: 'ana@duoc.cl', direccion: 'Av. Uno 1', region: 'Región de Valparaíso', comuna: 'Quilpué' }))
    expect(screen.getByLabelText('Nombre').value).toBe('Ana')
    expect(screen.getByLabelText('Comuna').value).toBe('Quilpué')
  })

  it('PAGO OK (mock): crea la orden Pagada, vacía el carrito y muestra la compra exitosa', () => {
    const pago = jasmine.createSpy('procesarPago').and.returnValue({ ok: true })
    const onVaciar = jasmine.createSpy('onVaciar')
    render(rutas(pago, onVaciar))
    completar()
    fireEvent.click(screen.getByRole('button', { name: /Pagar ahora/ }))
    expect(pago).toHaveBeenCalledWith({ total: 40000, simularRechazo: false })
    expect(onVaciar).toHaveBeenCalledTimes(1)
    expect(ordenesDB.listar()[0].estado).toBe('Pagada')
    expect(screen.getByText(/Se ha realizado la compra/)).toBeTruthy()
    expect(screen.getByText(/Pedro Hacker/)).toBeTruthy()
  })

  it('PAGO RECHAZADO (mock): guarda la orden Rechazada, conserva el carrito y ofrece reintentar', () => {
    const pago = jasmine.createSpy('procesarPago').and.returnValue({ ok: false, motivo: 'Sin fondos' })
    const onVaciar = jasmine.createSpy('onVaciar')
    render(rutas(pago, onVaciar))
    completar()
    fireEvent.click(screen.getByRole('button', { name: /Pagar ahora/ }))
    expect(onVaciar).not.toHaveBeenCalled()
    expect(ordenesDB.listar()[0].estado).toBe('Rechazada')
    expect(screen.getByText(/No se pudo realizar el pago/)).toBeTruthy()
    expect(screen.getByText('Sin fondos')).toBeTruthy()
    expect(screen.getByText('VOLVER A REALIZAR EL PAGO')).toBeTruthy()
  })

  it('la casilla de demo envía simularRechazo = true a la pasarela', () => {
    const pago = jasmine.createSpy('procesarPago').and.returnValue({ ok: false })
    render(rutas(pago, () => {}))
    completar()
    fireEvent.click(screen.getByLabelText(/simular pago rechazado/))
    fireEvent.click(screen.getByRole('button', { name: /Pagar ahora/ }))
    expect(pago.calls.mostRecent().args[0].simularRechazo).toBeTrue()
  })

  it('CompraExitosa con una orden inexistente muestra un aviso', () => {
    render(<MemoryRouter initialEntries={['/compra-exitosa/XYZ']}><Routes><Route path="/compra-exitosa/:id" element={<CompraExitosa />} /></Routes></MemoryRouter>)
    expect(screen.getByText(/No existe la orden/)).toBeTruthy()
  })
})
