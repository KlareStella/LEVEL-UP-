import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import Login from '../paginas/Login.jsx'
import Carrito, { calcularTotales } from '../paginas/Carrito.jsx'
import Catalogo from '../paginas/Catalogo.jsx'
import Checkout from '../paginas/Checkout.jsx'
import Ofertas from '../paginas/Ofertas.jsx'
import Categorias from '../paginas/Categorias.jsx'
import CompraExitosa from '../paginas/CompraExitosa.jsx'
import CompraError from '../paginas/CompraError.jsx'
import api from '../servicios/api.js'
import { exito, producto, rechazo, renderizarEnRuta, sinConexion } from './ayudas.jsx'

const productos = [
  producto({ id: 1, codigo: 'A1', nombre: 'Mouse Pro', categoria: 'mouse', categoriaLabel: 'Mouse', precio: 20000 }),
  producto({ codigo: 'A2', nombre: 'Teclado Pro', categoria: 'accesorios', precio: 36000, descuento: 50 }),
  producto({ codigo: 'A3', nombre: 'Silla Gamer', categoria: 'sillas-gamers', categoriaLabel: 'Sillas', precio: 100000 }),
]
const categorias = [
  { value: 'mouse', label: 'Mouse' }, { value: 'accesorios', label: 'Accesorios' }, { value: 'sillas-gamers', label: 'Sillas' },
]
const escribir = (etiqueta, valor) => fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } })

beforeEach(() => localStorage.clear())
afterAll(() => localStorage.clear())

describe('Login (formulario + API)', () => {
  const credenciales = () => { escribir('Correo electrónico', 'admin@duoc.cl'); escribir('Contraseña', 'admin123') }
  const enviar = () => fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
  const rutas = (onLogin) => (
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login onLogin={onLogin} />} />
        <Route path="/admin" element={<p>PANEL ADMIN</p>} />
        <Route path="/admin/ordenes" element={<p>ORDENES VENDEDOR</p>} />
        <Route path="/" element={<p>TIENDA</p>} />
      </Routes>
    </MemoryRouter>)

  it('muestra errores de validación al enviar vacío y NO llama a la API', () => {
    const onLogin = jasmine.createSpy('onLogin')
    spyOn(api, 'post')
    renderizarEnRuta(<Login onLogin={onLogin} />)
    enviar()
    expect(screen.getByText('Ingresa tu correo.')).toBeTruthy()
    expect(screen.getByText('Revisa los campos marcados en rojo.')).toBeTruthy()
    expect(api.post).not.toHaveBeenCalled()
    expect(onLogin).not.toHaveBeenCalled()
  })

  it('rechaza dominios de correo no permitidos', () => {
    renderizarEnRuta(<Login onLogin={() => {}} />)
    escribir('Correo electrónico', 'ana@hotmail.com')
    fireEvent.blur(screen.getByLabelText('Correo electrónico'))
    expect(screen.getByText(/Usa un correo @duoc.cl/)).toBeTruthy()
  })

  it('MOCK axios: credenciales incorrectas (401) muestran un mensaje y no inician sesión', async () => {
    const onLogin = jasmine.createSpy('onLogin')
    spyOn(api, 'post').and.callFake(rechazo(401))
    renderizarEnRuta(<Login onLogin={onLogin} />)
    credenciales(); enviar()
    expect(await screen.findByText('Correo o contraseña incorrectos.')).toBeTruthy()
    expect(onLogin).not.toHaveBeenCalled()
  })

  it('MOCK axios: si el servidor no responde muestra el error de conexión', async () => {
    spyOn(api, 'post').and.callFake(sinConexion())
    renderizarEnRuta(<Login onLogin={() => {}} />)
    credenciales(); enviar()
    expect(await screen.findByText('No se pudo conectar con el servidor.')).toBeTruthy()
  })

  it('MOCK axios: credenciales correctas envían correo y contraseña a la API, entregan token y usuario, y redirigen al panel', async () => {
    const usuario = { run: '1', nombre: 'Admin', tipoUsuario: 'Administrador' }
    spyOn(api, 'post').and.callFake(exito({ accessToken: 'jwt-admin', refreshToken: 'ref-admin', usuario }))
    const onLogin = jasmine.createSpy('onLogin')
    render(rutas(onLogin))
    credenciales(); enviar()
    expect(await screen.findByText('PANEL ADMIN', {}, { timeout: 3000 })).toBeTruthy()
    expect(api.post).toHaveBeenCalledWith('/auth/login', { correo: 'admin@duoc.cl', contrasena: 'admin123' })
    expect(onLogin).toHaveBeenCalledWith(jasmine.objectContaining({ tipoUsuario: 'Administrador' }), 'jwt-admin', 'ref-admin')
  })

  it('el Vendedor entra directo a la lista de órdenes (no tiene Dashboard)', async () => {
    spyOn(api, 'post').and.callFake(exito({ token: 't', usuario: { run: '2', nombre: 'Val', rol: 'VENDEDOR' } }))
    render(rutas(() => {}))
    credenciales(); enviar()
    expect(await screen.findByText('ORDENES VENDEDOR', {}, { timeout: 3000 })).toBeTruthy()
  })

  it('un cliente vuelve a la tienda', async () => {
    spyOn(api, 'post').and.callFake(exito({ token: 't', usuario: { run: '3', nombre: 'Ana', tipoUsuario: 'Cliente' } }))
    render(rutas(() => {}))
    credenciales(); enviar()
    expect(await screen.findByText('TIENDA', {}, { timeout: 3000 })).toBeTruthy()
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
    <MemoryRouter initialEntries={[ruta]}><Catalogo productos={productos} listaCategorias={categorias} onAgregar={() => {}} /></MemoryRouter>)

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
        <Routes><Route path="/categorias/:valor" element={<Categorias productos={productos} listaCategorias={categorias} onAgregar={() => {}} />} /></Routes>
      </MemoryRouter>)
    expect(screen.getAllByText('Mouse Pro').length).toBeGreaterThan(0)
    expect(screen.queryByText('Silla Gamer')).toBeNull()
  })

  it('Categorias con una categoría inexistente avisa al usuario', () => {
    render(
      <MemoryRouter initialEntries={['/categorias/no-existe']}>
        <Routes><Route path="/categorias/:valor" element={<Categorias productos={productos} listaCategorias={categorias} onAgregar={() => {}} />} /></Routes>
      </MemoryRouter>)
    expect(screen.getByText(/no existe/)).toBeTruthy()
  })
})

describe('Checkout (formulario, mock de pago, API de órdenes y navegación)', () => {
  const carrito = [{ codigo: 'A1', cantidad: 2 }]
  // La API registra la compra a nombre de un usuario: el checkout exige sesión.
  const cliente = { id: 3, run: '3', nombre: 'Pedro', apellidos: 'Hacker', correo: 'pedro@gmail.com' }
  const rutas = (procesarPago, onVaciar, sesion = cliente, items = carrito) => (
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
  // API simulada del backend: POST /boletas crea la boleta PENDIENTE; PATCH /boletas/:id/confirmar|rechazar
  // la cierra; GET /boletas/:id la devuelve (o 404). Los productos salen de GET /productos.
  function simularApiOrdenes() {
    const guardadas = {}
    spyOn(api, 'post').and.callFake((url, cuerpo) => {
      const detalles = cuerpo.items.map((i) => {
        const p = productos.find((x) => x.id === i.productoId)
        return { productoId: i.productoId, nombreProducto: p.nombre, cantidad: i.cantidad, precioUnitario: p.precio, subtotal: p.precio * i.cantidad }
      })
      const boleta = { id: 7, usuarioId: cuerpo.usuarioId, fecha: '2026-11-22T10:00:00', estado: 'PENDIENTE', detalles, total: detalles.reduce((t, d) => t + d.subtotal, 0) }
      guardadas[boleta.id] = boleta
      return Promise.resolve({ data: boleta })
    })
    spyOn(api, 'patch').and.callFake((url, cuerpo) => {
      const [, , id, accion] = url.split('/') // /boletas/7/confirmar
      const boleta = guardadas[id]
      boleta.estado = accion === 'confirmar' ? 'PAGADA' : 'RECHAZADA'
      if (accion === 'confirmar') boleta.total = boleta.total * (1 - cuerpo.descuentoPorcentaje / 100)
      return Promise.resolve({ data: boleta })
    })
    spyOn(api, 'get').and.callFake((url) => {
      if (url === '/productos') return Promise.resolve({ data: productos })
      const id = decodeURIComponent(url.split('/').pop())
      return url.startsWith('/boletas/') && guardadas[id] ? Promise.resolve({ data: guardadas[id] }) : rechazo(url === '/usuarios' ? 403 : 404)()
    })
  }

  it('con el carrito vacío redirige a /carrito', () => {
    render(rutas(() => ({ ok: true }), () => {}, null, []))
    expect(screen.getByText('PAGINA CARRITO')).toBeTruthy()
  })

  it('formulario vacío: muestra errores y NO procesa el pago ni llama a la API', () => {
    const pago = jasmine.createSpy('procesarPago').and.returnValue({ ok: true })
    spyOn(api, 'post')
    render(rutas(pago, () => {}, null))
    fireEvent.click(screen.getByRole('button', { name: /Pagar ahora/ }))
    expect(screen.getByText('El nombre es obligatorio.')).toBeTruthy()
    expect(screen.getByText('Selecciona una región.')).toBeTruthy()
    expect(pago).not.toHaveBeenCalled()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('sin sesión no procesa el pago ni llama a la API: pide iniciar sesión', () => {
    const pago = jasmine.createSpy('procesarPago').and.returnValue({ ok: true })
    spyOn(api, 'post')
    render(rutas(pago, () => {}, null))
    completar()
    fireEvent.click(screen.getByRole('button', { name: /Pagar ahora/ }))
    expect(screen.getByText('Inicia sesión para completar la compra.')).toBeTruthy()
    expect(pago).not.toHaveBeenCalled()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('con sesión iniciada los datos del cliente se rellenan automáticamente', () => {
    render(rutas(() => ({ ok: true }), () => {}, { nombre: 'Ana', apellidos: 'Soto', correo: 'ana@duoc.cl', direccion: 'Av. Uno 1', region: 'Región de Valparaíso', comuna: 'Quilpué' }))
    expect(screen.getByLabelText('Nombre').value).toBe('Ana')
    expect(screen.getByLabelText('Comuna').value).toBe('Quilpué')
  })

  it('PAGO OK (mock): crea la boleta, la confirma en la API, vacía el carrito y muestra la compra exitosa', async () => {
    simularApiOrdenes()
    const pago = jasmine.createSpy('procesarPago').and.returnValue({ ok: true })
    const onVaciar = jasmine.createSpy('onVaciar')
    render(rutas(pago, onVaciar))
    completar()
    fireEvent.click(screen.getByRole('button', { name: /Pagar ahora/ }))
    expect(await screen.findByText(/Se ha realizado la compra/)).toBeTruthy()
    expect(pago).toHaveBeenCalledWith({ total: 40000, simularRechazo: false })
    expect(api.post).toHaveBeenCalledWith('/boletas', { usuarioId: 3, items: [{ productoId: 1, cantidad: 2 }] })
    expect(api.patch).toHaveBeenCalledWith('/boletas/7/confirmar', { descuentoPorcentaje: 0 })
    expect(onVaciar).toHaveBeenCalledTimes(1)
    expect(screen.getByText(/Pedro Hacker/)).toBeTruthy()
  })

  it('PAGO RECHAZADO (mock): rechaza la boleta en la API, conserva el carrito y ofrece reintentar', async () => {
    simularApiOrdenes()
    const pago = jasmine.createSpy('procesarPago').and.returnValue({ ok: false, motivo: 'Sin fondos' })
    const onVaciar = jasmine.createSpy('onVaciar')
    render(rutas(pago, onVaciar))
    completar()
    fireEvent.click(screen.getByRole('button', { name: /Pagar ahora/ }))
    expect(await screen.findByText(/No se pudo realizar el pago/)).toBeTruthy()
    expect(api.patch).toHaveBeenCalledWith('/boletas/7/rechazar')
    expect(onVaciar).not.toHaveBeenCalled()
    expect(screen.getByText('Sin fondos')).toBeTruthy()
    expect(screen.getByText('VOLVER A REALIZAR EL PAGO')).toBeTruthy()
  })

  it('si la API falla al crear la orden muestra el error, no vacía el carrito y permite reintentar', async () => {
    spyOn(api, 'post').and.callFake(rechazo(500))
    const onVaciar = jasmine.createSpy('onVaciar')
    render(rutas(() => ({ ok: true }), onVaciar))
    completar()
    fireEvent.click(screen.getByRole('button', { name: /Pagar ahora/ }))
    expect(await screen.findByText('No se pudo registrar la orden. Inténtalo nuevamente.')).toBeTruthy()
    expect(onVaciar).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /Pagar ahora/ }).disabled).toBeFalse()
  })

  it('la casilla de demo envía simularRechazo = true a la pasarela', async () => {
    simularApiOrdenes()
    const pago = jasmine.createSpy('procesarPago').and.returnValue({ ok: false })
    render(rutas(pago, () => {}))
    completar()
    fireEvent.click(screen.getByLabelText(/simular pago rechazado/))
    fireEvent.click(screen.getByRole('button', { name: /Pagar ahora/ }))
    expect(await screen.findByText(/No se pudo realizar el pago/)).toBeTruthy()
    expect(pago.calls.mostRecent().args[0].simularRechazo).toBeTrue()
  })

  it('CompraExitosa con una orden inexistente (404 de la API) muestra un aviso', async () => {
    spyOn(api, 'get').and.callFake(rechazo(404))
    render(<MemoryRouter initialEntries={['/compra-exitosa/XYZ']}><Routes><Route path="/compra-exitosa/:id" element={<CompraExitosa />} /></Routes></MemoryRouter>)
    expect(await screen.findByText(/No existe la orden/)).toBeTruthy()
  })

  it('CompraError muestra el error si la API no responde', async () => {
    spyOn(api, 'get').and.callFake(sinConexion())
    render(<MemoryRouter initialEntries={['/compra-error/XYZ']}><Routes><Route path="/compra-error/:id" element={<CompraError />} /></Routes></MemoryRouter>)
    expect(await screen.findByText('No se pudo conectar con el servidor.')).toBeTruthy()
  })
})
