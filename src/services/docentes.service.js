import { api, destroy, extraerDatos, get, post, put } from '../lib/api'

export function listarDocentes(params) {
  return api.get('/docentes', { params }).then((respuesta) => ({
    datos: extraerDatos(respuesta),
    meta: respuesta?.data?.meta,
  }))
}

export function crearDocente(payload) {
  return post('/docentes', payload)
}

export function buscarDocentes(params) {
  return get('/docentes/buscar', { params })
}

export function verDocente(id) {
  return get(`/docentes/${id}`)
}

export function editarDocente(id, payload) {
  if (payload instanceof FormData) {
    payload.append('_method', 'PUT')
    return post(`/docentes/${id}`, payload)
  }

  return put(`/docentes/${id}`, payload)
}

export function eliminarDocente(id) {
  return destroy(`/docentes/${id}`)
}

export function urlDescargaCvDocente(docente, nombreArchivo = 'cv-docente.pdf') {
  const url = docente?.cv_pdf?.url

  if (!url || !url.includes('/upload/')) {
    return url
  }

  const nombre = nombreArchivo.replace(/\.pdf$/i, '').replace(/[^A-Za-z0-9_-]+/g, '_') || 'cv-docente'

  return url.replace('/upload/', `/upload/fl_attachment:${nombre}/`)
}

export function descargarCvDocente(docente, nombreArchivo = 'cv-docente.pdf') {
  const url = urlDescargaCvDocente(docente, nombreArchivo)

  if (!url) return

  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  enlace.target = '_blank'
  enlace.rel = 'noopener noreferrer'
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
}

export function listarHorariosDocente(docenteId, params) {
  return get(`/horarios/docente/${docenteId}`, { params })
}
