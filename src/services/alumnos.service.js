import { api, extraerDatos, get, post } from '../lib/api'

export function listarAlumnos(params) {
  return api.get('/alumnos', { params }).then((respuesta) => ({
    datos: extraerDatos(respuesta),
    meta: respuesta?.data?.meta,
  }))
}

export function verAlumno(id) {
  return get(`/alumnos/${id}`)
}

export function convertirPostulanteEnAlumno(postulanteId, payload) {
  return post(`/postulantes/${postulanteId}/convertir-alumno`, payload)
}

export function listarHorariosAlumno(alumnoId, params) {
  return get(`/horarios/alumno/${alumnoId}`, { params })
}
