import { get, post } from '../lib/api'

export function convertirPostulanteEnAlumno(postulanteId, payload) {
  return post(`/postulantes/${postulanteId}/convertir-alumno`, payload)
}

export function listarHorariosAlumno(alumnoId, params) {
  return get(`/horarios/alumno/${alumnoId}`, { params })
}
