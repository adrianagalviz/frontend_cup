import { get, post, put } from '../lib/api'

export function listarAulas(params) {
  return get('/aulas', { params })
}

export function crearAula(payload) {
  return post('/aulas', payload)
}

export function editarAula(id, payload) {
  return put(`/aulas/${id}`, payload)
}

