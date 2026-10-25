export function procesarPago({ total, simularRechazo = false }) {
  if (simularRechazo || total <= 0) return { ok: false, motivo: 'Pago rechazado por el banco emisor.' }
  return { ok: true, autorizacion: `AUT-${Date.now().toString(36).toUpperCase()}` }
}
