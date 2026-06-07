import { api, destroy, extraerDatos, get, post } from '../lib/api'

export function listarAsignaciones(params) {
  return api.get('/asignaciones', { params }).then((respuesta) => ({
    datos: extraerDatos(respuesta),
    meta: respuesta?.data?.meta,
  }))
}

export function crearAsignacion(payload) {
  return post('/asignaciones/docente-materia-grupo', payload)
}

export function listarAsignacionesDocente(docenteId) {
  return get(`/asignaciones/docente/${docenteId}`)
}

export function desactivarAsignacion(id) {
  return destroy(`/asignaciones/${id}`)
}
