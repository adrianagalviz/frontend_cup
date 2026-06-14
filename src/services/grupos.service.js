import { api, destroy, extraerDatos, get, post, put } from '../lib/api'

export function listarGrupos(params) {
  return api.get('/grupos', { params }).then((respuesta) => ({
    datos: extraerDatos(respuesta),
    meta: respuesta?.data?.meta,
  }))
}

export function crearGrupo(payload) {
  return post('/grupos', payload)
}

export function editarGrupo(id, payload) {
  return put(`/grupos/${id}`, payload)
}

export function desactivarGrupo(id) {
  return destroy(`/grupos/${id}`)
}

export function calcularGruposNecesarios(params) {
  return get('/grupos/calcular-necesarios', { params })
}

export function asignarAlumnosAGrupos(payload) {
  return post('/grupos/asignar-alumnos', payload)
}

export function obtenerOpcionesGrupoAlumno() {
  return get('/alumno/grupos/opciones')
}

export function asignarGrupoAlumno(payload = {}) {
  return post('/alumno/grupo/asignacion', payload)
}

export function listarAlumnosGrupo(grupoId, params) {
  return get(`/grupos/${grupoId}/alumnos`, { params })
}
