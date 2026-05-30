const TOKEN_KEY = 'cup_ficct_token'
const USER_KEY = 'cup_ficct_usuario'

export function obtenerToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function guardarToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function eliminarToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function obtenerUsuarioGuardado() {
  const value = localStorage.getItem(USER_KEY)

  if (!value) return null

  try {
    return JSON.parse(value)
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export function guardarUsuario(usuario) {
  localStorage.setItem(USER_KEY, JSON.stringify(usuario))
}

export function limpiarSesionGuardada() {
  eliminarToken()
  localStorage.removeItem(USER_KEY)
}

