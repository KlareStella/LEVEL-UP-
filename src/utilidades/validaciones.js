const DOMINIOS = ['duoc.cl', 'profesor.duoc.cl', 'gmail.com']

export const requerido = (v) => v !== null && v !== undefined && String(v).trim().length > 0
export const maximo = (v, n) => String(v || '').trim().length <= n
export const minimo = (v, n) => String(v || '').trim().length >= n

export function correoValido(valor) {
  const v = String(valor || '').trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return false
  return DOMINIOS.includes(v.split('@')[1]?.toLowerCase())
}

export function runValido(valor) {
  const v = String(valor || '').trim().toUpperCase()
  if (!/^[0-9]{6,8}[0-9K]$/.test(v)) return false
  const cuerpo = v.slice(0, -1)
  let suma = 0
  let multiplo = 2
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * multiplo
    multiplo = multiplo === 7 ? 2 : multiplo + 1
  }
  const resto = 11 - (suma % 11)
  const esperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto)
  return v.slice(-1) === esperado
}

export const enteroPositivo = (v) => /^[0-9]+$/.test(String(v).trim())
export const decimalPositivo = (v) => /^[0-9]+(\.[0-9]+)?$/.test(String(v).trim())
