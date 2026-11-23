import api, { agregarToken, comoLista, esNoEncontrado, manejarErrorRespuesta, mensajeError, registrarAlExpirar } from '../servicios/api.js'
import { guardarSesion, leerRefresh, leerSesion, leerToken } from '../utilidades/almacen.js'
import { exito, rechazo } from './ayudas.jsx'

describe('api (axios: interceptores y utilidades)', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => registrarAlExpirar(null))
  afterAll(() => localStorage.clear())

  it('el interceptor de petición agrega Authorization: Bearer <token> si hay sesión', () => {
    guardarSesion({ nombre: 'Ana' }, 'abc.def')
    expect(agregarToken({ headers: {} }).headers.Authorization).toBe('Bearer abc.def')
  })

  it('las rutas /auth/* van sin Authorization (el backend rechaza un Bearer vencido incluso en rutas públicas)', () => {
    guardarSesion({ nombre: 'Ana' }, 'vencido')
    expect(agregarToken({ url: '/auth/refresh', headers: {} }).headers.Authorization).toBeUndefined()
    expect(agregarToken({ url: '/auth/login', headers: {} }).headers.Authorization).toBeUndefined()
  })

  it('sin sesión no agrega el encabezado Authorization', () => {
    expect(agregarToken({ headers: {} }).headers.Authorization).toBeUndefined()
  })

  it('401 con sesión activa: cierra la sesión, avisa a la app y rechaza el error', async () => {
    const alExpirar = jasmine.createSpy('alExpirar')
    registrarAlExpirar(alExpirar)
    guardarSesion({ nombre: 'Ana' }, 'vencido')
    const error = { config: { url: '/ordenes' }, response: { status: 401 } }
    await expectAsync(manejarErrorRespuesta(error)).toBeRejectedWith(error)
    expect(alExpirar).toHaveBeenCalledTimes(1)
    expect(leerToken()).toBeNull()
    expect(leerSesion()).toBeNull()
  })

  it('401 con refresh token: renueva con POST /auth/refresh, guarda los tokens nuevos y repite la petición', async () => {
    const alExpirar = jasmine.createSpy('alExpirar')
    registrarAlExpirar(alExpirar)
    guardarSesion({ nombre: 'Ana' }, 'vencido', 'ref-1')
    spyOn(api, 'post').and.callFake(exito({ accessToken: 'nuevo', refreshToken: 'ref-2' }))
    spyOn(api, 'request').and.callFake(exito({ ok: true }))
    const config = { url: '/productos', headers: {} }
    const respuesta = await manejarErrorRespuesta({ config, response: { status: 401 } })
    expect(api.post).toHaveBeenCalledWith('/auth/refresh', { refreshToken: 'ref-1' })
    expect(leerToken()).toBe('nuevo')
    expect(leerRefresh()).toBe('ref-2')
    expect(api.request).toHaveBeenCalledWith(jasmine.objectContaining({ url: '/productos', _reintento: true }))
    expect(respuesta.data).toEqual({ ok: true })
    expect(alExpirar).not.toHaveBeenCalled()
  })

  it('401 y el refresh token también falla (vencido): cierra la sesión y avisa a la app', async () => {
    const alExpirar = jasmine.createSpy('alExpirar')
    registrarAlExpirar(alExpirar)
    guardarSesion({ nombre: 'Ana' }, 'vencido', 'ref-vencido')
    spyOn(api, 'post').and.callFake(rechazo(401))
    const error = { config: { url: '/boletas', headers: {} }, response: { status: 401 } }
    await expectAsync(manejarErrorRespuesta(error)).toBeRejectedWith(error)
    expect(alExpirar).toHaveBeenCalledTimes(1)
    expect(leerToken()).toBeNull()
    expect(leerRefresh()).toBeNull()
  })

  it('una petición ya reintentada que vuelve a dar 401 no entra en bucle: cierra la sesión', async () => {
    const alExpirar = jasmine.createSpy('alExpirar')
    registrarAlExpirar(alExpirar)
    guardarSesion({ nombre: 'Ana' }, 'tok', 'ref')
    const post = spyOn(api, 'post')
    const error = { config: { url: '/boletas', _reintento: true, headers: {} }, response: { status: 401 } }
    await expectAsync(manejarErrorRespuesta(error)).toBeRejectedWith(error)
    expect(post).not.toHaveBeenCalled()
    expect(alExpirar).toHaveBeenCalledTimes(1)
  })

  it('401 del propio login (credenciales incorrectas) no cierra la sesión ni redirige', async () => {
    const alExpirar = jasmine.createSpy('alExpirar')
    registrarAlExpirar(alExpirar)
    guardarSesion({ nombre: 'Ana' }, 'vigente')
    await expectAsync(manejarErrorRespuesta({ config: { url: '/auth/login' }, response: { status: 401 } })).toBeRejected()
    expect(alExpirar).not.toHaveBeenCalled()
    expect(leerToken()).toBe('vigente')
  })

  it('otros errores (403, 500) no cierran la sesión', async () => {
    const alExpirar = jasmine.createSpy('alExpirar')
    registrarAlExpirar(alExpirar)
    guardarSesion({ nombre: 'Ana' }, 'vigente')
    await expectAsync(manejarErrorRespuesta({ config: { url: '/ordenes' }, response: { status: 403 } })).toBeRejected()
    await expectAsync(manejarErrorRespuesta({ config: { url: '/ordenes' }, response: { status: 500 } })).toBeRejected()
    expect(alExpirar).not.toHaveBeenCalled()
    expect(leerToken()).toBe('vigente')
  })

  it('comoLista acepta un arreglo o respuestas paginadas', () => {
    expect(comoLista([1, 2])).toEqual([1, 2])
    expect(comoLista({ content: [3] })).toEqual([3])
    expect(comoLista({ data: [4] })).toEqual([4])
    expect(comoLista(null)).toEqual([])
  })

  it('mensajeError prioriza el mensaje de la API y distingue la falta de conexión', () => {
    expect(mensajeError({ response: { status: 400, data: { message: 'RUN inválido' } } }, 'x')).toBe('RUN inválido')
    expect(mensajeError({ response: { status: 500, data: {} } }, 'Falló')).toBe('Falló')
    expect(mensajeError({ request: {} }, 'x')).toBe('No se pudo conectar con el servidor.')
  })

  it('esNoEncontrado reconoce 404 y 400 (el backend responde 400 «no encontrado» en varios recursos)', () => {
    expect(esNoEncontrado({ response: { status: 404 } })).toBeTrue()
    expect(esNoEncontrado({ response: { status: 400 } })).toBeTrue()
    expect(esNoEncontrado({ response: { status: 500 } })).toBeFalse()
    expect(esNoEncontrado({ request: {} })).toBeFalse()
  })
})
