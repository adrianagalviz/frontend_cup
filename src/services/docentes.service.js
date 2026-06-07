import { api, destroy, extraerDatos, get, post, put } from '../lib/api'

export function listarDocentes(params) {
  return api.get('/docentes', { params }).then((respuesta) => ({
    datos: extraerDatos(respuesta),
    meta: respuesta?.data?.meta,
  }))
}

export function crearDocente(payload) {
  return post('/docentes', payload)
}

export function buscarDocentes(params) {
  return get('/docentes/buscar', { params })
}

export function verDocente(id) {
  return get(`/docentes/${id}`)
}

export function editarDocente(id, payload) {
  return put(`/docentes/${id}`, payload)
}

export function eliminarDocente(id) {
  return destroy(`/docentes/${id}`)
}

export function listarHorariosDocente(docenteId, params) {
  return get(`/horarios/docente/${docenteId}`, { params })
}
