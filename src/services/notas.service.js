import { api, extraerDatos, get, post } from '../lib/api'

export function calcularPromedios(payload) {
  return post('/promedios/calcular', payload)
}

export function listarNotasAlumno(alumnoId, params) {
  return get(`/notas/alumno/${alumnoId}`, { params })
}

export function listarPromedios(params) {
  return api.get('/promedios', { params }).then((respuesta) => ({
    datos: extraerDatos(respuesta),
    meta: respuesta?.data?.meta,
  }))
}

export function listarAprobados(params) {
  return api.get('/promedios/aprobados', { params }).then((respuesta) => ({
    datos: extraerDatos(respuesta),
    meta: respuesta?.data?.meta,
  }))
}

export function listarReprobados(params) {
  return api.get('/promedios/reprobados', { params }).then((respuesta) => ({
    datos: extraerDatos(respuesta),
    meta: respuesta?.data?.meta,
  }))
}
