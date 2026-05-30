import { descargarArchivo, get, post } from '../lib/api'

export function reportePostulantes(params) {
  return get('/reportes/postulantes', { params })
}

export function reporteAprobados(params) {
  return get('/reportes/aprobados', { params })
}

export function reporteReprobados(params) {
  return get('/reportes/reprobados', { params })
}

export function reportePromedios(params) {
  return get('/reportes/promedios', { params })
}

export function reporteGrupos(params) {
  return get('/reportes/grupos', { params })
}

export function reporteEstadisticasMateria(params) {
  return get('/reportes/estadisticas-materia', { params })
}

export function reporteDocentesGrupos(params) {
  return get('/reportes/docentes-grupos', { params })
}

export function reporteGruposMayorAprobados(params) {
  return get('/reportes/grupos-mayor-aprobados', { params })
}

export function reporteAsistenciaDocentes(params) {
  return get('/reportes/asistencia-docentes', { params })
}

export function reporteAsistenciaAlumnos(params) {
  return get('/reportes/asistencia-alumnos', { params })
}

export function generarReportePorComandoVoz(payload) {
  return post('/reportes/comando-voz', payload)
}

export function exportarReporte(tipo, params, nombreArchivo) {
  return descargarArchivo(`/reportes/${tipo}/exportar`, params, nombreArchivo)
}

