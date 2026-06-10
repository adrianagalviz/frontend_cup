import { api, destroy, extraerDatos, get, post, put } from '../lib/api'

export function listarDias(params) {
  return get('/dias', { params })
}

export function listarTurnos(params) {
  return api.get('/turnos', { params }).then((respuesta) => ({
    datos: extraerDatos(respuesta),
    meta: respuesta?.data?.meta,
  }))
}

export function crearTurno(payload) {
  return post('/turnos', payload)
}

export function editarTurno(id, payload) {
  return put(`/turnos/${id}`, payload)
}

export function eliminarTurno(id) {
  return destroy(`/turnos/${id}`)
}

export function listarPeriodos(params) {
  return api.get('/periodos', { params }).then((respuesta) => ({
    datos: extraerDatos(respuesta),
    meta: respuesta?.data?.meta,
  }))
}

export function crearPeriodo(payload) {
  return post('/periodos', payload)
}

export function listarHorarios(params) {
  return api.get('/horarios', { params }).then((respuesta) => ({
    datos: extraerDatos(respuesta),
    meta: respuesta?.data?.meta,
  }))
}

export function crearHorario(payload) {
  return post('/horarios', payload)
}

export function listarHorariosDocente(docenteId, params) {
  return get(`/horarios/docente/${docenteId}`, { params })
}

export function listarHorariosAlumno(alumnoId, params) {
  return get(`/horarios/alumno/${alumnoId}`, { params })
}
