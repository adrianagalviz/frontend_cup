import { get, patch, post } from '../lib/api'

export function listarExamenes(params) {
  return get('/examenes', { params })
}

export function crearExamen(payload) {
  return post('/examenes', payload)
}

export function asignarMateriasExamen(examenId, payload) {
  return post(`/examenes/${examenId}/materias`, payload)
}

export function crearPreguntaExamen(examenId, payload) {
  return post(`/examenes/${examenId}/preguntas`, payload)
}

export function habilitarExamen(examenId, payload) {
  return patch(`/examenes/${examenId}/habilitar`, payload)
}

export function deshabilitarExamen(examenId, payload) {
  return patch(`/examenes/${examenId}/deshabilitar`, payload)
}

export function crearOpcionesPregunta(preguntaId, payload) {
  return post(`/preguntas/${preguntaId}/opciones`, payload)
}

export function listarExamenesHabilitadosAlumno(params) {
  return get('/alumno/examenes/habilitados', { params })
}

export function verExamenAlumno(examenId) {
  return get(`/alumno/examenes/${examenId}`)
}

export function responderExamenAlumno(examenId, payload) {
  return post(`/alumno/examenes/${examenId}/responder`, payload)
}

export function verResultadoExamenAlumno(examenId) {
  return get(`/alumno/examenes/${examenId}/resultado`)
}

