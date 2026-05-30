export function obtenerMensajeError(error) {
  return (
    error?.mensaje ||
    error?.response?.data?.mensaje ||
    error?.response?.data?.message ||
    error?.message ||
    'Ocurrio un error inesperado.'
  )
}

export function obtenerErroresValidacion(error) {
  const errores = error?.errores || error?.response?.data?.errores

  if (!errores || typeof errores !== 'object') return {}

  return errores
}

export function esErrorConexion(error) {
  return error?.tipo === 'conexion' || error?.status === 0
}

export function esErrorSesion(error) {
  return error?.tipo === 'sesion' || error?.status === 401
}

export function esErrorPermiso(error) {
  return error?.tipo === 'permiso' || error?.status === 403
}

export function esErrorValidacion(error) {
  return error?.tipo === 'validacion' || error?.status === 422
}

export function esErrorServidor(error) {
  return error?.tipo === 'servidor' || error?.status >= 500
}

export function obtenerTituloError(error) {
  if (esErrorConexion(error)) return 'Error de conexion'
  if (esErrorSesion(error)) return 'Sesion expirada'
  if (esErrorPermiso(error)) return 'Acceso denegado'
  if (esErrorValidacion(error)) return 'Datos no validos'
  if (esErrorServidor(error)) return 'Error del servidor'

  return 'Error'
}

export function listarMensajesValidacion(error) {
  const errores = obtenerErroresValidacion(error)

  return Object.entries(errores).flatMap(([campo, mensajes]) => {
    if (Array.isArray(mensajes)) {
      return mensajes.map((mensaje) => ({ campo, mensaje }))
    }

    return [{ campo, mensaje: String(mensajes) }]
  })
}

export function aplicarErroresFormulario(error, setError) {
  if (!esErrorValidacion(error) || typeof setError !== 'function') return

  listarMensajesValidacion(error).forEach(({ campo, mensaje }) => {
    setError(campo, {
      type: 'server',
      message: mensaje,
    })
  })
}

export function normalizarErrorApi(error) {
  if (!error?.response) {
    return {
      status: 0,
      tipo: 'conexion',
      mensaje: 'No se pudo conectar con el backend Laravel.',
      errores: {},
      original: error,
    }
  }

  const status = error.response.status
  const data = error.response.data || {}
  const tipos = {
    401: 'sesion',
    403: 'permiso',
    422: 'validacion',
    500: 'servidor',
  }

  const mensajes = {
    401: data.mensaje || 'Sesion expirada o credenciales invalidas.',
    403: data.mensaje || 'No tienes permiso para realizar esta accion.',
    422: data.mensaje || 'Revisa los datos del formulario.',
    500: data.mensaje || 'El backend no pudo completar la operacion.',
  }

  return {
    status,
    tipo: tipos[status] || 'api',
    mensaje: mensajes[status] || data.mensaje || data.message || 'Ocurrio un error inesperado.',
    errores: data.errores || {},
    original: error,
  }
}
