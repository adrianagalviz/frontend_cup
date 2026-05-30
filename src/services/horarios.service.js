import { get, post } from '../lib/api'

export function listarDias(params) {
  return get('/dias', { params })
}

export function listarTurnos(params) {
  return get('/turnos', { params })
}

export function crearTurno(payload) {
  return post('/turnos', payload)
}

export function listarPeriodos(params) {
  return get('/periodos', { params })
}

export function crearPeriodo(payload) {
  return post('/periodos', payload)
}

export function listarHorarios(params) {
  return get('/horarios', { params })
}

export function crearHorario(payload) {
  return post('/horarios', payload)
}

