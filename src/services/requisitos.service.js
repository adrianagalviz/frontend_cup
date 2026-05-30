import { get, patch, post } from '../lib/api'

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

