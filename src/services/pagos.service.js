import { api, extraerDatos, get, patch, post } from '../lib/api'

export function crearSesionStripe(payload) {
  return post('/pagos/stripe/crear-sesion', payload)
}

export function listarPagos(params) {
  return api.get('/pagos', { params }).then((respuesta) => ({
    datos: extraerDatos(respuesta),
    meta: respuesta?.data?.meta,
  }))
}

export function consultarPagoPorPostulante(postulanteId) {
  return get(`/pagos/postulante/${postulanteId}`)
}

export function consultarEstadoPagoPublico(postulanteId) {
  return get(`/pagos/postulante/${postulanteId}/estado-publico`)
}

export function registrarPagoTemporalPostulante(postulanteId) {
  return post(`/pagos/postulante/${postulanteId}/pago-temporal`)
}

export function validarPagoAdmin(pagoId, payload) {
  return patch(`/pagos/${pagoId}/validar-admin`, payload)
}
