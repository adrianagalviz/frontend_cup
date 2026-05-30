import { useEffect } from 'react'
import { toast } from 'sonner'
import {
  esErrorConexion,
  esErrorPermiso,
  esErrorServidor,
  esErrorSesion,
  obtenerMensajeError,
  obtenerTituloError,
} from '../lib/errores'

export default function ApiErrorListener() {
  useEffect(() => {
    function manejarError(event) {
      const error = event.detail

      if (!(esErrorConexion(error) || esErrorSesion(error) || esErrorPermiso(error) || esErrorServidor(error))) {
        return
      }

      toast.error(obtenerTituloError(error), {
        description: obtenerMensajeError(error),
      })
    }

    window.addEventListener('cup:error-api', manejarError)

    return () => {
      window.removeEventListener('cup:error-api', manejarError)
    }
  }, [])

  return null
}

