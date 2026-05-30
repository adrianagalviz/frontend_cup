import { get, post } from '../lib/api'

export function calcularPromedios(payload) {
  return post('/promedios/calcular', payload)
}

export function listarNotasAlumno(alumnoId, params) {
  return get(`/notas/alumno/${alumnoId}`, { params })
}

export function listarPromedios(params) {
  return get('/promedios', { params })
}

export function listarAprobados(params) {
  return get('/promedios/aprobados', { params })
}

export function listarReprobados(params) {
  return get('/promedios/reprobados', { params })
}

export function asignarCarrerasPorAdmision(payload) {
  return post('/admisiones/asignar-carreras', payload)
}

