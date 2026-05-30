import { get, post } from '../lib/api'

export function listarGrupos(params) {
  return get('/grupos', { params })
}

export function crearGrupo(payload) {
  return post('/grupos', payload)
}

export function calcularGruposNecesarios(params) {
  return get('/grupos/calcular-necesarios', { params })
}

export function asignarAlumnosAGrupos(payload) {
  return post('/grupos/asignar-alumnos', payload)
}

export function listarAlumnosGrupo(grupoId, params) {
  return get(`/grupos/${grupoId}/alumnos`, { params })
}

