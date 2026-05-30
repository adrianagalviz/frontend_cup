import { get, post, put } from '../lib/api'

export function listarCupos(params) {
  return get('/cupos', { params })
}

export function crearCupo(payload) {
  return post('/cupos', payload)
}

export function editarCupo(id, payload) {
  return put(`/cupos/${id}`, payload)
}

