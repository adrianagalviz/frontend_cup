export function obtenerMensajeError(error) {
  return (
    error?.response?.data?.mensaje ||
    error?.response?.data?.message ||
    error?.message ||
    'Ocurrio un error inesperado.'
  )
}

export function obtenerErroresValidacion(error) {
  const errores = error?.response?.data?.errores

  if (!errores || typeof errores !== 'object') return {}

  return errores
}

