import axios from 'axios'
import { API_BASE_URL, API_VERSION_PREFIX } from '../config/api.config'
import { normalizarErrorApi } from './errores'
import { limpiarSesionGuardada, obtenerToken } from './storage'

export const api = axios.create({
  baseURL: `${API_BASE_URL.replace(/\/+$/, '')}${API_VERSION_PREFIX}`,
  headers: {
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = obtenerToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorNormalizado = normalizarErrorApi(error)

    if (error?.response?.status === 401) {
      limpiarSesionGuardada()
    }

    if (typeof window !== 'undefined' && error?.config?.mostrarErrorGlobal !== false) {
      window.dispatchEvent(new CustomEvent('cup:error-api', { detail: errorNormalizado }))
    }

    return Promise.reject(errorNormalizado)
  },
)

export function extraerDatos(respuesta) {
  return respuesta?.data?.datos ?? respuesta?.data ?? respuesta
}

export async function get(url, config) {
  return extraerDatos(await api.get(url, config))
}

export async function post(url, data, config) {
  return extraerDatos(await api.post(url, data, config))
}

export async function put(url, data, config) {
  return extraerDatos(await api.put(url, data, config))
}

export async function patch(url, data, config) {
  return extraerDatos(await api.patch(url, data, config))
}

export async function destroy(url, config) {
  return extraerDatos(await api.delete(url, config))
}

export async function descargarArchivo(url, params = {}, nombreArchivo = 'reporte') {
  const response = await api.get(url, {
    params,
    responseType: 'blob',
  })

  const blobUrl = window.URL.createObjectURL(new Blob([response.data]))
  const enlace = document.createElement('a')
  enlace.href = blobUrl
  enlace.download = nombreArchivo
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  window.URL.revokeObjectURL(blobUrl)
}
