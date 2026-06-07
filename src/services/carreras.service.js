import { get, post, put } from '../lib/api'

export function listarCarreras(params) {
  return get('/carreras', { params })
}

export function listarCarrerasActivas(params) {
  return get('/carreras/activas', { params })
}

export function crearCarrera(payload) {
  return post('/carreras', payload)
}

export function editarCarrera(id, payload) {
  return put(`/carreras/${id}`, payload)
}
