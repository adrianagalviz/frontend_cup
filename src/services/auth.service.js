import { get, patch, post } from '../lib/api'

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

export async function actualizarConfiguracionVisual(payload) {
  return patch('/auth/configuracion-visual', payload)
}

export async function subirCvDocentePerfil(file) {
  const formData = new FormData()
  formData.append('cv_pdf', file)

  return post('/auth/perfil/docente/cv', formData)
}
