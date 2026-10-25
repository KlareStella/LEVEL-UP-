import { correoValido, decimalPositivo, enteroPositivo, maximo, minimo, requerido, runValido } from '../utilidades/validaciones.js'

describe('validaciones', () => {
  it('requerido rechaza vacíos, espacios, null y undefined', () => {
    expect(requerido('')).toBeFalse()
    expect(requerido('   ')).toBeFalse()
    expect(requerido(null)).toBeFalse()
    expect(requerido(undefined)).toBeFalse()
    expect(requerido('hola')).toBeTrue()
  })

  it('minimo y maximo cuentan caracteres ignorando espacios en los bordes', () => {
    expect(minimo('  abc ', 3)).toBeTrue()
    expect(minimo('ab', 3)).toBeFalse()
    expect(maximo('abcd', 4)).toBeTrue()
    expect(maximo('abcde', 4)).toBeFalse()
  })

  it('correoValido acepta solo los dominios permitidos', () => {
    expect(correoValido('ana@duoc.cl')).toBeTrue()
    expect(correoValido('ana@profesor.duoc.cl')).toBeTrue()
    expect(correoValido('ANA@GMAIL.COM')).toBeTrue()
    expect(correoValido('ana@hotmail.com')).toBeFalse()
    expect(correoValido('ana@duoc')).toBeFalse()
    expect(correoValido('sin-arroba')).toBeFalse()
  })

  it('runValido verifica el dígito verificador (módulo 11)', () => {
    expect(runValido('10000013K')).toBeTrue() 
    expect(runValido('123456785')).toBeTrue() 
    expect(runValido('100000130')).toBeFalse()
    expect(runValido('12.345.678-5')).toBeFalse()
  })

  it('enteroPositivo y decimalPositivo validan el formato numérico', () => {
    expect(enteroPositivo('15')).toBeTrue()
    expect(enteroPositivo('-1')).toBeFalse()
    expect(enteroPositivo('1.5')).toBeFalse()
    expect(decimalPositivo('1.5')).toBeTrue()
    expect(decimalPositivo('abc')).toBeFalse()
  })
})
