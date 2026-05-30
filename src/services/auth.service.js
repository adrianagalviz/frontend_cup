import { get, post } from '../lib/api'

export async function loginTradicional(payload) {
  return post('/auth/login', payload)
}

export async function loginAlumno(payload) {
  return post('/auth/alumno/login', payload)
}

export async function loginFirebase(payload) {
  return post('/auth/firebase', payload)
}

export async function obtenerPerfil() {
  return get('/auth/perfil')
}

export async function cerrarSesion() {
  return post('/auth/logout')
}
