import { borrarSesion, guardarCarrito, guardarSesion, leerCarrito, leerRefresh, leerSesion, leerToken } from '../utilidades/almacen.js'

describe('almacen (localStorage: solo carrito, token y sesión)', () => {
  beforeEach(() => localStorage.clear())
  afterAll(() => localStorage.clear())

  it('leerCarrito devuelve [] si no hay nada guardado', () => {
    expect(leerCarrito()).toEqual([])
  })

  it('guardarCarrito y leerCarrito hacen ida y vuelta', () => {
    guardarCarrito([{ codigo: 'JM001', cantidad: 2 }])
    expect(leerCarrito()).toEqual([{ codigo: 'JM001', cantidad: 2 }])
  })

  it('MOCK: si el dato almacenado está corrupto se usa el valor por defecto', () => {
    spyOn(Storage.prototype, 'getItem').and.returnValue('{esto no es json')
    expect(leerCarrito()).toEqual([])
    expect(Storage.prototype.getItem).toHaveBeenCalledWith('lug_cart')
  })

  it('guardarSesion guarda el token y el usuario, y nunca la contraseña', () => {
    const segura = guardarSesion({ nombre: 'Ana', correo: 'ana@duoc.cl', password: 'secreta' }, 'abc.def.ghi')
    expect(segura.password).toBeUndefined()
    expect(localStorage.getItem('lug_session')).not.toContain('secreta')
    expect(leerToken()).toBe('abc.def.ghi')
    expect(leerSesion().nombre).toBe('Ana')
  })

  it('la sesión persiste al recargar y borrarSesion elimina token y usuario', () => {
    guardarSesion({ nombre: 'Ana' }, 'tok')
    expect(leerSesion()).toEqual({ nombre: 'Ana' }) // "recarga": se lee de nuevo desde localStorage
    borrarSesion()
    expect(leerSesion()).toBeNull()
    expect(leerToken()).toBeNull()
  })

  it('guardarSesion también guarda el refresh token y borrarSesion lo elimina', () => {
    guardarSesion({ nombre: 'Ana' }, 'tok', 'ref')
    expect(leerRefresh()).toBe('ref')
    borrarSesion()
    expect(leerRefresh()).toBeNull()
  })

  it('sin token no hay sesión, aunque queden datos del usuario', () => {
    guardarSesion({ nombre: 'Ana' })
    expect(leerSesion()).toBeNull()
  })

  it('actualizar el perfil conserva el token ya guardado', () => {
    guardarSesion({ nombre: 'Ana' }, 'tok')
    guardarSesion({ nombre: 'Ana María' })
    expect(leerToken()).toBe('tok')
    expect(leerSesion().nombre).toBe('Ana María')
  })
})
