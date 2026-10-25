import { crearColeccion } from '../datos/crud.js'
import { nuevoIdOrden, ordenesDB, productosDB, slug } from '../datos/baseDatos.js'

describe('crud (archivo de datos simulado)', () => {
  const semilla = [{ id: 1, nombre: 'Uno' }, { id: 2, nombre: 'Dos' }]
  let tabla
  beforeEach(() => { localStorage.clear(); tabla = crearColeccion('lug_prueba', semilla, 'id') })
  afterAll(() => localStorage.clear())

  it('LEER: listar parte con la semilla y obtener busca por id', () => {
    expect(tabla.listar().length).toBe(2)
    expect(tabla.obtener(2).nombre).toBe('Dos')
    expect(tabla.obtener(99)).toBeNull()
  })

  it('CREAR: agrega un registro y rechaza ids duplicados', () => {
    tabla.crear({ id: 3, nombre: 'Tres' })
    expect(tabla.listar().length).toBe(3)
    expect(() => tabla.crear({ id: 3, nombre: 'Otro' })).toThrowError(/Ya existe/)
  })

  it('ACTUALIZAR: modifica campos pero no el id; devuelve null si no existe', () => {
    const cambiado = tabla.actualizar(1, { nombre: 'Uno!', id: 999 })
    expect(cambiado).toEqual({ id: 1, nombre: 'Uno!' })
    expect(tabla.actualizar(77, { nombre: 'x' })).toBeNull()
  })

  it('ELIMINAR: borra el registro y avisa si no existía', () => {
    expect(tabla.eliminar(1)).toBeTrue()
    expect(tabla.eliminar(1)).toBeFalse()
    expect(tabla.listar().map((x) => x.id)).toEqual([2])
  })

  it('PERSISTENCIA: los cambios quedan en localStorage', () => {
    tabla.crear({ id: 3, nombre: 'Tres' })
    const otraInstancia = crearColeccion('lug_prueba', semilla, 'id')
    expect(otraInstancia.obtener(3).nombre).toBe('Tres')
  })

  it('productosDB parte con el catálogo semilla', () => {
    expect(productosDB.obtener('JM001').nombre).toContain('D&D')
  })

  it('nuevoIdOrden genera correlativos por día', () => {
    const fecha = new Date('2026-10-22T12:00:00Z')
    expect(nuevoIdOrden(fecha, [])).toBe('ORD-20261022-0001')
    expect(nuevoIdOrden(fecha, [{ id: 'ORD-20261022-0001' }, { id: 'ORD-20261021-0001' }])).toBe('ORD-20261022-0002')
    ordenesDB.reiniciar()
  })

  it('slug normaliza tildes, espacios y símbolos', () => {
    expect(slug('  Cámaras & Webcams ')).toBe('camaras-webcams')
  })
})
