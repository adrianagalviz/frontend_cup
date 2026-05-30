import { get, post } from '../lib/api'

export function listarAsistenciaDocente(params) {
  return get('/asistencia-docente', { params })
}

export function listarAsistenciaPorDocente(docenteId, params) {
  return get(`/asistencia-docente/docente/${docenteId}`, { params })
}

export function generarFaltasDocente(payload) {
  return post('/asistencia-docente/generar-faltas', payload)
}

export function obtenerHorarioActivoDocente() {
  return get('/asistencia-docente/horario-activo')
}

export function marcarEntradaDocente(payload) {
  return post('/asistencia-docente/marcar-entrada', payload)
}

export function marcarSalidaDocente(payload) {
  return post('/asistencia-docente/marcar-salida', payload)
}

export function listarAsistenciaAlumno(params) {
  return get('/asistencia-alumno', { params })
}

export function generarFaltasAlumno(payload) {
  return post('/asistencia-alumno/generar-faltas', payload)
}

export function obtenerHorarioActivoAlumno() {
  return get('/asistencia-alumno/horario-activo')
}

export function marcarAsistenciaAlumno(payload) {
  return post('/asistencia-alumno/marcar', payload)
}

export function listarMisAsistenciasAlumno(params) {
  return get('/asistencia-alumno/mis-asistencias', { params })
}

export function registrarAsistenciaAlumnoPorDocente(payload) {
  return post('/asistencia-alumno/docente/registrar', payload)
}

export function listarMisAlumnosDocente(params) {
  return get('/asistencia-alumno/docente/mis-alumnos', { params })
}

