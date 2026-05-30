import { get, patch, post, put } from '../lib/api'

export function listarUsuarios(params) {
  return get('/usuarios', { params })
}

export function crearAdministrador(payload) {
  return post('/usuarios/administradores', payload)
}

export function verUsuario(id) {
  return get(`/usuarios/${id}`)
}

export function editarUsuario(id, payload) {
  return put(`/usuarios/${id}`, payload)
}

export function cambiarEstadoUsuario(id, payload) {
  return patch(`/usuarios/${id}/estado`, payload)
}

