import { fireEvent, render, screen } from '@testing-library/react'
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
import api from '../servicios/api.js'
import { exito, producto, rechazo, renderizarEnRuta } from './ayudas.jsx'

const escribir = (etiqueta, valor) => fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } })

describe('Registro (validación de formulario + API)', () => {
  const datosValidos = () => {
    escribir('RUN (sin puntos ni guion)', '10000013K'); escribir('Nombre completo', 'Ana'); escribir('Apellidos', 'Soto Mena')
    escribir('Correo electrónico', 'ana@duoc.cl'); escribir('Contraseña', 'clave1234'); escribir('Confirmar contraseña', 'clave1234')
    escribir('Región', 'Región de Valparaíso'); escribir('Comuna', 'Quilpué'); escribir('Dirección', 'Calle Falsa 123')
  }
  const registrar = () => fireEvent.click(screen.getByRole('button', { name: /Crear cuenta|Registrarme|Registrar/i }))

  it('formulario vacío: muestra errores y no llama a la API', () => {
    spyOn(api, 'post')
    renderizarEnRuta(<Registro onLogin={() => {}} />)
    registrar()
    expect(screen.getByText('El RUN es obligatorio.')).toBeTruthy()
    expect(api.post).not.toHaveBeenCalled()
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

  it('MOCK axios: datos válidos → POST /auth/register (nombre completo, correo, contrasena), inicia sesión con el token y redirige, inicia sesión con el token y redirige', async () => {
    spyOn(api, 'post').and.callFake(exito({ accessToken: 'jwt-ana', refreshToken: 'ref-ana', usuario: { run: '10000013K', nombre: 'Ana', correo: 'ana@duoc.cl', tipoUsuario: 'Cliente' } }))
    const onLogin = jasmine.createSpy('onLogin')
    render(
      <MemoryRouter initialEntries={['/registro']}>
        <Routes><Route path="/registro" element={<Registro onLogin={onLogin} />} /><Route path="/" element={<p>INICIO</p>} /></Routes>
      </MemoryRouter>)
    datosValidos()
    registrar()
    expect(await screen.findByText(/Cuenta creada con éxito/)).toBeTruthy()
    const [url, cuerpo] = api.post.calls.mostRecent().args
    expect(url).toBe('/auth/register')
    expect(cuerpo).toEqual(jasmine.objectContaining({ correo: 'ana@duoc.cl', contrasena: 'clave1234' }))
    expect(cuerpo.password).toBeUndefined()
    expect(cuerpo.confirmPassword).toBeUndefined()
    expect(onLogin).toHaveBeenCalledWith(jasmine.objectContaining({ nombre: 'Ana' }), 'jwt-ana', 'ref-ana')
    expect(await screen.findByText('INICIO', {}, { timeout: 3000 })).toBeTruthy()
  })

  it('MOCK axios: un correo ya registrado (409) muestra un error y no inicia sesión', async () => {
    spyOn(api, 'post').and.callFake(rechazo(409))
    const onLogin = jasmine.createSpy('onLogin')
    renderizarEnRuta(<Registro onLogin={onLogin} />)
    datosValidos()
    escribir('Correo electrónico', 'admin@duoc.cl')
    registrar()
    expect(await screen.findByText('Ya existe una cuenta registrada con ese correo o RUN.')).toBeTruthy()
    expect(onLogin).not.toHaveBeenCalled()
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
  // En la API las categorías se identifican por id numérico (el frontend lo usa como texto).
  const categorias = [{ value: '1', label: 'Mouse' }, { value: '2', label: 'Accesorios' }]
  const montar = (ruta, productos, onCambio = () => {}) => render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/admin/productos/nuevo" element={<ProductoForm productos={productos} categorias={categorias} onCambio={onCambio} />} />
        <Route path="/admin/productos/:codigo/editar" element={<ProductoForm productos={productos} categorias={categorias} onCambio={onCambio} />} />
        <Route path="/admin/productos" element={<p>LISTADO</p>} />
      </Routes>
    </MemoryRouter>)

  it('MOCK axios: crea un producto con datos válidos (POST /productos con la categoría por id) y recarga el catálogo', async () => {
    spyOn(api, 'post').and.callFake(exito({}))
    const onCambio = jasmine.createSpy('onCambio')
    montar('/admin/productos/nuevo', [], onCambio)
    escribir('Código de producto', 'zz001'); escribir('Categoría', '1'); escribir('Nombre del producto', 'Mouse X')
    escribir('Precio (CLP)', '15990'); escribir('Stock', '8'); escribir('Descuento de oferta % (opcional)', '10')
    fireEvent.click(screen.getByText('Guardar producto'))
    expect(await screen.findByText('LISTADO')).toBeTruthy()
    expect(api.post).toHaveBeenCalledWith('/productos', { nombre: 'Mouse X', precio: 15990, stock: 8, categoria: { id: 1 } })
    expect(onCambio).toHaveBeenCalledTimes(1)
  })

  it('MOCK axios: editar un producto usa PUT /productos/:codigo', async () => {
    spyOn(api, 'put').and.callFake(exito({}))
    montar('/admin/productos/T001/editar', [producto({ codigo: 'T001', categoria: '1', nombre: 'Viejo' })])
    escribir('Nombre del producto', 'Nuevo nombre')
    fireEvent.click(screen.getByText('Guardar producto'))
    expect(await screen.findByText('LISTADO')).toBeTruthy()
    expect(api.put).toHaveBeenCalledWith('/productos/T001', jasmine.objectContaining({ nombre: 'Nuevo nombre', categoria: { id: 1 } }))
  })

  it('si la API falla al guardar muestra el error y no navega', async () => {
    spyOn(api, 'post').and.callFake(rechazo(500, { message: 'Base de datos caída' }))
    montar('/admin/productos/nuevo', [])
    escribir('Código de producto', 'zz001'); escribir('Categoría', '1'); escribir('Nombre del producto', 'Mouse X')
    escribir('Precio (CLP)', '15990'); escribir('Stock', '8')
    fireEvent.click(screen.getByText('Guardar producto'))
    expect(await screen.findByText('Base de datos caída')).toBeTruthy()
    expect(screen.queryByText('LISTADO')).toBeNull()
  })

  it('rechaza código repetido, precio no numérico y descuento mayor a 90', () => {
    montar('/admin/productos/nuevo', [producto({ codigo: 'DUP01' })])
    escribir('Código de producto', 'dup01'); fireEvent.blur(screen.getByLabelText('Código de producto'))
    escribir('Precio (CLP)', 'abc'); fireEvent.blur(screen.getByLabelText('Precio (CLP)'))
    escribir('Descuento de oferta % (opcional)', '95'); fireEvent.blur(screen.getByLabelText('Descuento de oferta % (opcional)'))
    expect(screen.getByText('Ya existe un producto con ese código.')).toBeTruthy()
    expect(screen.getByText('Ingresa un número válido (0 o más).')).toBeTruthy()
    expect(screen.getByText('Entero entre 0 y 90.')).toBeTruthy()
  })

  it('editar un código inexistente muestra el aviso', () => {
    montar('/admin/productos/NOPE/editar', [])
    expect(screen.getByText(/No existe el producto/)).toBeTruthy()
  })
})

describe('Perfil, historial y dashboard', () => {
  const admin = { run: '123456785', nombre: 'Admin', apellidos: 'Level-Up', correo: 'admin@duoc.cl', tipoUsuario: 'Administrador', direccion: 'Av. Uno 1' }

  it('MOCK axios: Perfil guarda los cambios (PUT /usuarios/:run) y notifica a la app', async () => {
    spyOn(api, 'put').and.callFake(exito({}))
    const onActualizar = jasmine.createSpy('onActualizar')
    renderizarEnRuta(<Perfil sesion={admin} onActualizar={onActualizar} />)
    escribir('Nombre', 'Administradora'); fireEvent.click(screen.getByText('Guardar perfil'))
    expect(await screen.findByText('Perfil actualizado.')).toBeTruthy()
    // La API guarda un solo campo `nombre` (nombre + apellidos) y exige el correo.
    expect(api.put).toHaveBeenCalledWith('/usuarios/123456785', { nombre: 'Administradora Level-Up', correo: 'admin@duoc.cl' })
    expect(onActualizar).toHaveBeenCalledWith(jasmine.objectContaining({ nombre: 'Administradora', run: '123456785' }))
  })

  it('Perfil muestra el error si la API rechaza el cambio y no notifica a la app', async () => {
    spyOn(api, 'put').and.callFake(rechazo(500))
    const onActualizar = jasmine.createSpy('onActualizar')
    renderizarEnRuta(<Perfil sesion={admin} onActualizar={onActualizar} />)
    fireEvent.click(screen.getByText('Guardar perfil'))
    expect(await screen.findByText('No se pudo actualizar el perfil.')).toBeTruthy()
    expect(onActualizar).not.toHaveBeenCalled()
  })

  it('Perfil exige nombre y apellidos', () => {
    spyOn(api, 'put')
    renderizarEnRuta(<Perfil sesion={admin} onActualizar={() => {}} />)
    escribir('Nombre', '   '); fireEvent.click(screen.getByText('Guardar perfil'))
    expect(screen.getByText('Nombre y apellidos son obligatorios.')).toBeTruthy()
    expect(api.put).not.toHaveBeenCalled()
  })

  it('HistorialCompras muestra solo las órdenes del usuario (por RUN) que entrega la API', async () => {
    const base = { fecha: '2026-10-22T10:00:00Z', estado: 'Pagada', total: 5000, subtotal: 5000, descuento: 0, cliente: {}, direccion: {}, lineas: [] }
    spyOn(api, 'get').and.callFake((url) => Promise.resolve({
      data: url.startsWith('/usuarios/')
        ? { run: '123456785', nombre: 'Admin', apellidos: 'Level-Up', tipoUsuario: 'Administrador' }
        : [{ ...base, id: 'ORD-A', run: '123456785' }, { ...base, id: 'ORD-B', run: '999999999' }],
    }))
    render(<MemoryRouter initialEntries={['/admin/usuarios/123456785/historial']}><Routes><Route path="/admin/usuarios/:run/historial" element={<HistorialCompras />} /></Routes></MemoryRouter>)
    expect(await screen.findByText('ORD-A')).toBeTruthy()
    expect(screen.queryByText('ORD-B')).toBeNull()
    expect(screen.getByText(/Admin Level-Up/)).toBeTruthy()
  })

  it('Dashboard cuenta productos con stock bajo y sin stock, y usuarios y órdenes de la API', async () => {
    spyOn(api, 'get').and.callFake((url) => Promise.resolve({
      data: url === '/usuarios' ? [{ run: '1' }, { run: '2' }, { run: '3' }, { run: '4' }] : [{ id: 'O1', estado: 'Pagada' }, { id: 'O2', estado: 'Rechazada' }],
    }))
    const lista = [producto({ codigo: 'A', stock: 2, stockCritico: 5 }), producto({ codigo: 'B', stock: 0 }), producto({ codigo: 'C', stock: 50 })]
    const { container } = renderizarEnRuta(<Dashboard productos={lista} />)
    await screen.findByText('Usuarios registrados')
    const valores = [...container.querySelectorAll('.stat-value')].map((n) => n.textContent)
    expect(valores[0]).toBe('3')       // productos activos
    expect(valores[1]).toBe('4')       // usuarios registrados (API)
    expect(valores[3]).toBe('1')       // órdenes pagadas (API)
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
