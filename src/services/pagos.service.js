import { get, patch, post } from '../lib/api'

export function crearSesionStripe(payload) {
  return post('/pagos/stripe/crear-sesion', payload)
}

export function consultarPagoPorPostulante(postulanteId) {
  return get(`/pagos/postulante/${postulanteId}`)
}

export function validarPagoAdmin(pagoId, payload) {
  return patch(`/pagos/${pagoId}/validar-admin`, payload)
}

