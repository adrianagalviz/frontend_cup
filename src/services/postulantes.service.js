import { api, destroy, extraerDatos, get, post, put } from '../lib/api'

export function registrarPostulante(payload) {
  return post('/postulantes', payload)
}

export function listarPostulantes(params) {
  return api.get('/postulantes', { params }).then((respuesta) => ({
    datos: extraerDatos(respuesta),
    meta: respuesta?.data?.meta,
  }))
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

export function eliminarPostulanteConObservacion(id, observacion) {
  return destroy(`/postulantes/${id}`, { data: { observacion } })
}

export function subirTituloBachiller(postulanteId, archivo) {
  const formData = new FormData()
  formData.append('titulo_bachiller', archivo)

  return post(`/postulantes/${postulanteId}/documentos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
