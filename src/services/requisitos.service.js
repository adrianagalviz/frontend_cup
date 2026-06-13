import { api, extraerDatos, get, patch, post } from '../lib/api'

export function listarRequisitos(params) {
  return api.get('/requisitos', { params }).then((respuesta) => ({
    datos: extraerDatos(respuesta),
    meta: respuesta?.data?.meta,
  }))
}

export function subirDocumentoPostulante(postulanteId, formData) {
  return post(`/postulantes/${postulanteId}/documentos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function listarDocumentosPostulante(postulanteId) {
  return get(`/postulantes/${postulanteId}/documentos`)
}

export function validarRequisitos(postulanteId, payload) {
  return patch(`/postulantes/${postulanteId}/requisitos/validar`, payload)
}

export function validarRequisitoDesdeCola(postulanteId, payload) {
  return patch(`/requisitos/${postulanteId}/validar`, payload)
}
