import { get, post } from '../lib/api'

export function consultarAsignacionFinal(params) {
  return get('/admisiones/asignacion-final', { params })
}

export function asignarCarrerasPorAdmision(payload) {
  return post('/admisiones/asignar-carreras', payload)
}
