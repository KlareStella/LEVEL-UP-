import api from '../servicios/api.js'
import { extraerSesion, iniciarSesion, normalizarRol, registrarUsuario } from '../servicios/auth.js'
import { actualizarProducto, crearProducto, eliminarProducto, listarProductos } from '../servicios/productos.js'
import { actualizarCategoria, crearCategoria, listarCategorias } from '../servicios/categorias.js'
import { crearOrden, listarOrdenes, obtenerOrden } from '../servicios/ordenes.js'
import { actualizarUsuario, crearUsuario, listarUsuarios, obtenerUsuario } from '../servicios/usuarios.js'
import { exito, rechazo } from './ayudas.jsx'

describe('servicios (axios mockeado con spyOn)', () => {
  describe('productos y categorías (backend: ids numéricos)', () => {
    it('listarProductos hace GET /productos y adapta cada producto a la forma del frontend', async () => {
      spyOn(api, 'get').and.callFake(exito([{ id: 4, nombre: 'Teclado', precio: 29990, stock: 15, categoriaId: 2 }]))
      const [p] = await listarProductos()
      expect(api.get).toHaveBeenCalledWith('/productos')
      expect(p).toEqual(jasmine.objectContaining({ codigo: '4', categoria: '2', descuento: 0, stockCritico: 5 }))
    })

    it('listarProductos acepta respuestas paginadas y respeta los campos extra que envíe el backend', async () => {
      spyOn(api, 'get').and.callFake(exito({ content: [{ id: 1, categoriaId: 3, descuento: 15, stockCritico: 2, imagen: 'x.png' }] }))
      const [p] = await listarProductos()
      expect(p).toEqual(jasmine.objectContaining({ descuento: 15, stockCritico: 2, imagen: 'x.png' }))
    })

    it('crear y actualizar envían solo lo que guarda el backend, con la categoría por id', async () => {
      spyOn(api, 'post').and.callFake(exito({ id: 9, categoriaId: 3 }))
      spyOn(api, 'put').and.callFake(exito({ id: 9, categoriaId: 3, precio: 5 }))
      spyOn(api, 'delete').and.callFake(exito({}))
      const nuevo = { codigo: 'IGNORADO', nombre: 'N', precio: 5, stock: 1, categoria: '3', categoriaLabel: 'C', descuento: 10 }
      await crearProducto(nuevo)
      await actualizarProducto('9', nuevo)
      await eliminarProducto('9')
      const cuerpo = { nombre: 'N', precio: 5, stock: 1, categoria: { id: 3 } }
      expect(api.post).toHaveBeenCalledWith('/productos', cuerpo)
      expect(api.put).toHaveBeenCalledWith('/productos/9', cuerpo)
      expect(api.delete).toHaveBeenCalledWith('/productos/9')
    })

    it('listarCategorias traduce nombre → label e id → value; crear y actualizar envían nombre y descripción', async () => {
      spyOn(api, 'get').and.callFake(exito([{ id: 1, nombre: 'Mouse', descripcion: 'Ratones' }]))
      spyOn(api, 'post').and.callFake(exito({ id: 2, nombre: 'X' }))
      spyOn(api, 'put').and.callFake(exito({ id: 1, nombre: 'Y' }))
      expect((await listarCategorias())[0]).toEqual(jasmine.objectContaining({ value: '1', label: 'Mouse' }))
      await crearCategoria({ label: 'X' })
      await actualizarCategoria('1', { label: 'Y', descripcion: 'Ratones' })
      expect(api.post).toHaveBeenCalledWith('/categorias', { nombre: 'X', descripcion: '' })
      expect(api.put).toHaveBeenCalledWith('/categorias/1', { nombre: 'Y', descripcion: 'Ratones' })
    })
  })

  describe('órdenes (boletas del backend) y usuarios', () => {
    const boleta = (estado, total) => ({
      id: 7, usuarioId: 3, fecha: '2026-11-22T10:00:00', estado, total,
      detalles: [{ productoId: 1, nombreProducto: 'Mouse', cantidad: 2, precioUnitario: 20000, subtotal: 40000 }],
    })
    const ordenFrontend = (estado, total) => ({
      usuarioId: 3, estado, total, motivo: estado === 'Rechazada' ? 'Sin fondos' : null,
      cliente: { nombre: 'Pedro', apellidos: 'H', correo: 'p@gmail.com' },
      direccion: { calle: 'Calle 1', departamento: '', region: 'R', comuna: 'C', indicaciones: '' },
      lineas: [{ codigo: '1', productoId: 1, cantidad: 2 }],
    })

    it('listarOrdenes hace GET /boletas y convierte cada boleta (estado, descuento, líneas con imagen y categoría)', async () => {
      spyOn(api, 'get').and.callFake((url) => url === '/boletas' ? exito([boleta('PAGADA', 36000)])()
        : url === '/productos' ? exito([{ id: 1, nombre: 'Mouse', precio: 20000, stock: 3, categoriaId: 8 }])() : rechazo(403)())
      const [o] = await listarOrdenes()
      expect(o).toEqual(jasmine.objectContaining({ id: '7', run: '3', estado: 'Pagada', subtotal: 40000, descuento: 4000, total: 36000 }))
      expect(o.lineas[0]).toEqual(jasmine.objectContaining({ codigo: '1', categoria: '8', cantidad: 2 }))
      expect(o.cliente.nombre).toBe('Cliente #3') // el Vendedor no puede leer /usuarios (403)
    })

    it('crearOrden pagada: POST /boletas y PATCH /confirmar con el porcentaje de descuento', async () => {
      spyOn(api, 'post').and.callFake(exito(boleta('PENDIENTE', 40000)))
      spyOn(api, 'patch').and.callFake(exito(boleta('PAGADA', 36000)))
      const creada = await crearOrden(ordenFrontend('Pagada', 36000))
      expect(api.post).toHaveBeenCalledWith('/boletas', { usuarioId: 3, items: [{ productoId: 1, cantidad: 2 }] })
      expect(api.patch).toHaveBeenCalledWith('/boletas/7/confirmar', { descuentoPorcentaje: 10 })
      expect(creada).toEqual(jasmine.objectContaining({ id: '7', estado: 'Pagada' }))
    })

    it('crearOrden rechazada: PATCH /rechazar y recuerda cliente y motivo para mostrar la boleta', async () => {
      spyOn(api, 'post').and.callFake(exito(boleta('PENDIENTE', 40000)))
      spyOn(api, 'patch').and.callFake(exito(boleta('RECHAZADA', 40000)))
      const creada = await crearOrden(ordenFrontend('Rechazada', 40000))
      expect(api.patch).toHaveBeenCalledWith('/boletas/7/rechazar')
      expect(creada).toEqual(jasmine.objectContaining({ estado: 'Rechazada', motivo: 'Sin fondos' }))
      expect(creada.cliente.nombre).toBe('Pedro')
    })

    it('si confirmar falla (p. ej. sin stock) rechaza la boleta pendiente y propaga el error', async () => {
      spyOn(api, 'post').and.callFake(exito(boleta('PENDIENTE', 40000)))
      spyOn(api, 'patch').and.callFake((url) => url.endsWith('/confirmar') ? rechazo(400, { mensaje: 'Stock insuficiente' })() : exito(boleta('RECHAZADA', 40000))())
      await expectAsync(crearOrden(ordenFrontend('Pagada', 40000))).toBeRejected()
      expect(api.patch).toHaveBeenCalledWith('/boletas/7/rechazar')
    })

    it('crearOrden sin usuario no llama a la API', async () => {
      spyOn(api, 'post')
      await expectAsync(crearOrden({ ...ordenFrontend('Pagada', 1), usuarioId: null })).toBeRejectedWithError(/iniciar sesión/)
      expect(api.post).not.toHaveBeenCalled()
    })

    it('obtenerOrden devuelve null si la API responde 404 o 400 «no encontrada» y propaga otros errores', async () => {
      const get = spyOn(api, 'get').and.callFake(rechazo(404))
      expect(await obtenerOrden('NOPE')).toBeNull()
      get.and.callFake(rechazo(400, { mensaje: 'Boleta no encontrada: 9' }))
      expect(await obtenerOrden('9')).toBeNull()
      get.and.callFake(rechazo(500))
      await expectAsync(obtenerOrden('X')).toBeRejected()
    })

    it('listarUsuarios normaliza id → run, rol y nombre completo, y quita la contraseña; obtenerUsuario devuelve null si no existe', async () => {
      const get = spyOn(api, 'get').and.callFake(exito([{ id: 5, nombre: 'Ana María Soto', correo: 'a@b.cl', rol: 'VENDEDOR', contrasena: 'hash' }]))
      const [u] = await listarUsuarios()
      expect(u).toEqual(jasmine.objectContaining({ run: '5', nombre: 'Ana', apellidos: 'María Soto', tipoUsuario: 'Vendedor' }))
      expect(u.contrasena).toBeUndefined()
      get.and.callFake(rechazo(400, { mensaje: 'Usuario no encontrado: 999' }))
      expect(await obtenerUsuario('999')).toBeNull()
    })

    it('crearUsuario usa POST /usuarios/registro y actualizarUsuario envía nombre completo y correo', async () => {
      spyOn(api, 'post').and.callFake(exito({}))
      spyOn(api, 'put').and.callFake(exito({}))
      await crearUsuario({ nombre: 'Luis', apellidos: 'Mora', correo: 'l@m.cl', password: 'levelup2026', tipoUsuario: 'Cliente' })
      await actualizarUsuario('5', { nombre: 'Ana', apellidos: 'María Soto', correo: 'a@b.cl', direccion: 'x' })
      expect(api.post).toHaveBeenCalledWith('/usuarios/registro', { nombre: 'Luis Mora', correo: 'l@m.cl', contrasena: 'levelup2026' })
      expect(api.put).toHaveBeenCalledWith('/usuarios/5', { nombre: 'Ana María Soto', correo: 'a@b.cl' })
    })
  })

  describe('autenticación', () => {
    it('normalizarRol entiende los nombres de rol más comunes', () => {
      expect(normalizarRol('ADMIN')).toBe('Administrador')
      expect(normalizarRol('ROLE_ADMIN')).toBe('Administrador')
      expect(normalizarRol('Vendedor')).toBe('Vendedor')
      expect(normalizarRol('cliente')).toBe('Cliente')
      expect(normalizarRol(undefined)).toBe('Cliente')
    })

    it('iniciarSesion envía las credenciales a /auth/login y devuelve token y usuario sin contraseña', async () => {
      spyOn(api, 'post').and.callFake(exito({ accessToken: 'jwt1', refreshToken: 'ref1', usuario: { id: 1, nombre: 'Ana', rol: 'ADMIN', password: 'x' } }))
      const { token, refreshToken, usuario } = await iniciarSesion({ correo: 'ana@duoc.cl', password: 'clave1234' })
      // el backend espera el campo `contrasena`
      expect(api.post).toHaveBeenCalledWith('/auth/login', { correo: 'ana@duoc.cl', contrasena: 'clave1234' })
      expect(token).toBe('jwt1')
      expect(refreshToken).toBe('ref1')
      expect(usuario.tipoUsuario).toBe('Administrador')
      expect(usuario.password).toBeUndefined()
    })

    it('extraerSesion acepta accessToken/user y rechaza respuestas incompletas', () => {
      expect(extraerSesion({ accessToken: 't', user: { nombre: 'A', role: 'VENDEDOR' } }).usuario.tipoUsuario).toBe('Vendedor')
      expect(() => extraerSesion({ token: 't' })).toThrowError(/no incluye/)
    })

    it('registrarUsuario inicia sesión a continuación si el registro no devuelve token', async () => {
      const post = spyOn(api, 'post').and.returnValues(
        Promise.resolve({ data: { id: 1 } }),
        Promise.resolve({ data: { token: 'jwt2', usuario: { run: '1', nombre: 'Ana', tipoUsuario: 'Cliente' } } }))
      const { token } = await registrarUsuario({ nombre: 'Ana', apellidos: 'Soto', correo: 'ana@duoc.cl', password: 'clave1234' })
      expect(post.calls.argsFor(0)).toEqual(['/auth/register', { nombre: 'Ana Soto', correo: 'ana@duoc.cl', contrasena: 'clave1234' }])
      expect(post.calls.argsFor(1)[0]).toBe('/auth/login')
      expect(token).toBe('jwt2')
    })
  })
})
