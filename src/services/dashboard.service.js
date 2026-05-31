import { get } from '../lib/api'

export function obtenerResumenDashboard(params) {
  return get('/dashboard/resumen', { params })
}

export function obtenerAsistenciaDashboard(params) {
  return get('/dashboard/asistencia', { params })
}

export function obtenerCuposDashboard(params) {
  return get('/dashboard/cupos', { params })
}

export function obtenerExamenesDashboard(params) {
  return get('/dashboard/examenes', { params })
}
