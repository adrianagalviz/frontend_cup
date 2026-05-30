import { api } from '../lib/api'

export async function loginTradicional(payload) {
  const { data } = await api.post('/auth/login', payload)
  return data
}

export async function loginAlumno(payload) {
  const { data } = await api.post('/auth/alumno/login', payload)
  return data
}

export async function loginFirebase(payload) {
  const { data } = await api.post('/auth/firebase', payload)
  return data
}

export async function obtenerPerfil() {
  const { data } = await api.get('/auth/perfil')
  return data
}

export async function cerrarSesion() {
  const { data } = await api.post('/auth/logout')
  return data
}

