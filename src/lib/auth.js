export const ROLES = {
  ADMINISTRADOR: 'administrador',
  DOCENTE: 'docente',
  ALUMNO: 'alumno',
}

export function obtenerRolUsuario(usuario) {
  return usuario?.rol?.nombre || usuario?.rol || null
}

export function obtenerRutaPorRol(rol) {
  const rutas = {
    [ROLES.ADMINISTRADOR]: '/admin/dashboard',
    [ROLES.DOCENTE]: '/docente/dashboard',
    [ROLES.ALUMNO]: '/alumno/dashboard',
  }

  return rutas[rol] || '/acceso-denegado'
}

export function rolPermitido(usuario, rolesPermitidos = []) {
  const rol = obtenerRolUsuario(usuario)
  return Boolean(rol && rolesPermitidos.includes(rol))
}

