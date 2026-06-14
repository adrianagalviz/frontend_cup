import { api, get, post } from '../lib/api'
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
  
  if (/^https?:\/\//i.test(ruta)) {
    const base = API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/i, '')
    if (ruta.includes('/storage/')) {
      const parts = ruta.split('/storage/')
      return `${base}/storage/${parts[parts.length - 1]}`
    }
    return ruta
  }

  const base = API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/i, '')
  return `${base}/${String(ruta).replace(/^\/+/, '')}`
}

function normalizarExportacion(respuesta) {
  const archivo = respuesta?.archivo
  const url = urlPublicaBackend(archivo?.ruta) || urlPublicaBackend(archivo?.url)

  return {
    ...respuesta,
    archivo: {
      ...archivo,
      url,
    },
  }
}

function tipoMimePorFormato(formato) {
  if (formato === 'pdf') return 'application/pdf'
  return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
}

function extensionPorFormato(formato) {
  return formato === 'pdf' ? 'pdf' : 'xlsx'
}

async function descargarBlob(url, formato, ruta = null) {
  if (ruta) {
    try {
      const respuesta = await api.get('/reportes/descargar-archivo', {
        params: { ruta },
        responseType: 'blob',
      })
      return respuesta.data
    } catch (error) {
      console.warn('Fallo descarga via API, intentando fetch directo:', error)
    }
  }

  const respuesta = await fetch(url)

  if (!respuesta.ok) {
    throw new Error('No se pudo descargar el archivo generado.')
  }

  return respuesta.blob().then((blob) => (
    blob.type ? blob : new Blob([blob], { type: tipoMimePorFormato(formato) })
  ))
}

async function guardarArchivoExportado(url, nombreArchivo, formato, ruta = null) {
  if (!url || typeof window === 'undefined') return false

  const extension = extensionPorFormato(formato)
  const nombre = nombreArchivo || `reporte.${extension}`

  try {
    const blob = await descargarBlob(url, formato, ruta)

    if ('showSaveFilePicker' in window) {
      try {
        const manejador = await window.showSaveFilePicker({
          suggestedName: nombre,
          types: [
            {
              description: formato === 'pdf' ? 'Documento PDF' : 'Libro de Excel',
              accept: {
                [tipoMimePorFormato(formato)]: [`.${extension}`],
              },
            },
          ],
        })
        const writable = await manejador.createWritable()
        await writable.write(blob)
        await writable.close()
        return true
      } catch (error) {
        if (error?.name === 'AbortError') {
          return false
        }
        console.warn('showSaveFilePicker falló o fue denegado. Usando descarga automática:', error)
      }
    }

    const blobUrl = window.URL.createObjectURL(blob)
    const enlace = document.createElement('a')
    enlace.href = blobUrl
    enlace.download = nombre
    document.body.appendChild(enlace)
    enlace.click()
    enlace.remove()
    window.URL.revokeObjectURL(blobUrl)

    return true
  } catch (error) {
    console.warn('Fallo al descargar el archivo como blob, usando descarga nativa directa:', error)

    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = nombre
    enlace.target = '_blank'
    document.body.appendChild(enlace)
    enlace.click()
    enlace.remove()

    return true
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

  const guardado = await guardarArchivoExportado(url, exportacion.archivo?.nombre, formato, exportacion.archivo?.ruta)

  return {
    ...exportacion,
    guardado,
  }
}
