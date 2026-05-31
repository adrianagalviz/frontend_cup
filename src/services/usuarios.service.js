import { api, extraerDatos, get, patch, post, put } from '../lib/api'

export function listarUsuarios(params) {
  return api.get('/usuarios', { params }).then((respuesta) => ({
    datos: extraerDatos(respuesta),
    meta: respuesta?.data?.meta,
  }))
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
