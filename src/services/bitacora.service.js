import { api, extraerDatos } from '../lib/api'

export function listarBitacora(params) {
  return api.get('/bitacora', { params }).then((respuesta) => ({
    datos: extraerDatos(respuesta),
    meta: respuesta?.data?.meta,
  }))
}
