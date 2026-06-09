import { get, post } from '../lib/api'
import { API_BASE_URL } from '../config/api.config'

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

function urlPublicaBackend(ruta) {
  if (!ruta) return ''
  if (/^https?:\/\//i.test(ruta)) return ruta

  const base = API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/i, '')
  return `${base}/${String(ruta).replace(/^\/+/, '')}`
}

function normalizarExportacion(respuesta) {
  const archivo = respuesta?.archivo
  const url = urlPublicaBackend(archivo?.ruta)

  return {
    ...respuesta,
    archivo: {
      ...archivo,
      url,
    },
  }
}

export async function generarReportePorComandoVoz(payload) {
  const respuesta = await post('/reportes/comando-voz', payload)

  if (respuesta?.exportacion) {
    return {
      ...respuesta,
      exportacion: normalizarExportacion(respuesta.exportacion),
    }
  }

  return respuesta
}

export async function exportarReporte(tipo, params, formato = 'pdf') {
  const respuesta = await get(`/reportes/${tipo}/exportar`, {
    params: {
      ...params,
      formato,
      por_pagina: params?.por_pagina || 5000,
    },
  })

  const exportacion = normalizarExportacion(respuesta)
  const url = exportacion.archivo?.url

  if (url && typeof window !== 'undefined') {
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = exportacion.archivo?.nombre || `reporte.${formato === 'pdf' ? 'pdf' : 'xlsx'}`
    enlace.target = '_blank'
    document.body.appendChild(enlace)
    enlace.click()
    enlace.remove()
  }

  return exportacion
}
