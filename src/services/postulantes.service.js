import { destroy, get, post, put } from '../lib/api'

export function registrarPostulante(payload) {
  return post('/postulantes', payload)
}

export function listarPostulantes(params) {
  return get('/postulantes', { params })
}

export function verPostulante(id) {
  return get(`/postulantes/${id}`)
}

export function editarPostulante(id, payload) {
  return put(`/postulantes/${id}`, payload)
}

export function eliminarPostulante(id) {
  return destroy(`/postulantes/${id}`)
}

