import { formatCLP, precioFinal, rutaImagen, tieneOferta } from '../utilidades/formato.js'

describe('formato', () => {
  it('formatCLP entrega pesos chilenos sin decimales', () => {
    const texto = formatCLP(29990).replace(/\s/g, '')
    expect(texto).toContain('29.990')
    expect(texto).toContain('$')
  })

  it('rutaImagen antepone BASE_URL a rutas relativas y respeta URLs externas', () => {
    expect(rutaImagen('pictures/ps5.png')).toBe('/pictures/ps5.png')
    expect(rutaImagen('/pictures/ps5.png')).toBe('/pictures/ps5.png')
    expect(rutaImagen('https://sitio.cl/a.png')).toBe('https://sitio.cl/a.png')
    expect(rutaImagen('')).toBe('')
  })

  it('precioFinal aplica el porcentaje de oferta y redondea', () => {
    expect(precioFinal({ precio: 79990, descuento: 20 })).toBe(63992)
    expect(precioFinal({ precio: 10000, descuento: 0 })).toBe(10000)
    expect(precioFinal({ precio: 10000 })).toBe(10000)
  })

  it('tieneOferta es verdadero solo con descuento mayor que 0', () => {
    expect(tieneOferta({ descuento: 15 })).toBeTrue()
    expect(tieneOferta({ descuento: 0 })).toBeFalse()
    expect(tieneOferta({})).toBeFalse()
  })
})
