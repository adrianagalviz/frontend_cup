import { get } from '../lib/api'

export function listarMaterias(params) {
  return get('/materias', { params })
}

