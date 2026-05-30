import axios from 'axios'
import { API_BASE_URL, API_VERSION_PREFIX } from '../config/api.config'
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
    if (error?.response?.status === 401) {
      limpiarSesionGuardada()
    }

    return Promise.reject(error)
  },
)

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
