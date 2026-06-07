import { api, extraerDatos, post, put } from '../lib/api'

export function listarAulas(params) {
  return api.get('/aulas', { params }).then((respuesta) => ({
    datos: extraerDatos(respuesta),
    meta: respuesta?.data?.meta,
  }))
}

export function crearAula(payload) {
  return post('/aulas', payload)
}

export function editarAula(id, payload) {
  return put(`/aulas/${id}`, payload)
}
