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

export function alumnoTieneAccesos(usuario) {
  if (obtenerRolUsuario(usuario) !== ROLES.ALUMNO) return true

  const alumno = usuario?.datos_rol?.alumno
  return Boolean(alumno?.accesos_habilitados || alumno?.postulante?.estado_pago === 'pagado')
}

export function obtenerRutaInicialUsuario(usuario) {
  const rol = obtenerRolUsuario(usuario)

  if (rol === ROLES.ALUMNO && !alumnoTieneAccesos(usuario)) {
    return '/alumno/perfil'
  }

  return obtenerRutaPorRol(rol)
}

export function rolPermitido(usuario, rolesPermitidos = []) {
  const rol = obtenerRolUsuario(usuario)
  return Boolean(rol && rolesPermitidos.includes(rol))
}
