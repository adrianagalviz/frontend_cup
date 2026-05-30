import { get, post } from '../lib/api'

export function listarCargasMasivas(params) {
  return get('/cargas', { params })
}

export function cargarCsv(formData) {
  return post('/cargas/csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function cargarExcel(formData) {
  return post('/cargas/excel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function verDetalleCargaMasiva(cargaId, params) {
  return get(`/cargas/${cargaId}/detalle`, { params })
}

