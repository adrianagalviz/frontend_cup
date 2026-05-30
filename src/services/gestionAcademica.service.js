import { get, post } from '../lib/api'

export function listarGestiones(params) {
  return get('/gestiones', { params })
}

export function crearGestion(payload) {
  return post('/gestiones', payload)
}

export function obtenerGestionActual() {
  return get('/gestiones/actual')
}

