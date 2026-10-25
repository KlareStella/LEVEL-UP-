import { procesarPago } from '../servicios/pagos.js'

describe('servicios/pagos (pasarela simulada)', () => {
  it('aprueba un pago normal y entrega un código de autorización', () => {
    const r = procesarPago({ total: 15000 })
    expect(r.ok).toBeTrue()
    expect(r.autorizacion).toMatch(/^AUT-/)
  })
  it('rechaza el pago cuando se simula el rechazo', () => {
    const r = procesarPago({ total: 15000, simularRechazo: true })
    expect(r.ok).toBeFalse()
    expect(r.motivo).toContain('rechazado')
  })
  it('rechaza montos en cero o negativos', () => {
    expect(procesarPago({ total: 0 }).ok).toBeFalse()
    expect(procesarPago({ total: -5 }).ok).toBeFalse()
  })
})
