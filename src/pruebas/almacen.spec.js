import { borrarSesion, guardarCarrito, guardarSesion, leerCarrito, leerSesion, leerUsuarios } from '../utilidades/almacen.js'

describe('almacen (localStorage)', () => {
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

  it('guardarSesion nunca almacena la contraseña', () => {
    const segura = guardarSesion({ nombre: 'Ana', correo: 'ana@duoc.cl', password: 'secreta' })
    expect(segura.password).toBeUndefined()
    expect(localStorage.getItem('lug_session')).not.toContain('secreta')
    expect(leerSesion().nombre).toBe('Ana')
    borrarSesion()
    expect(leerSesion()).toBeNull()
  })

  it('leerUsuarios siembra los usuarios iniciales la primera vez', () => {
    const usuarios = leerUsuarios()
    expect(usuarios.some((u) => u.correo === 'admin@duoc.cl')).toBeTrue()
    expect(localStorage.getItem('lug_users')).not.toBeNull()
  })
})
