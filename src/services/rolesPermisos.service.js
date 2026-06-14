import { get, patch, post, put } from '../lib/api'

export function listarRolesPermisos() {
  return get('/roles-permisos')
}

export function crearRol(payload) {
  return post('/roles-permisos/roles', payload)
}

export function editarRol(id, payload) {
  return put(`/roles-permisos/roles/${id}`, payload)
}

export function cambiarEstadoRol(id, payload) {
  return patch(`/roles-permisos/roles/${id}/estado`, payload)
}
