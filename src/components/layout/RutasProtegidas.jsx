import { Navigate } from 'react-router-dom'
import Loader from '../common/Loader'
import { obtenerRutaPorRol, rolPermitido } from '../../lib/auth'
import { useAuth } from '../../hooks/useAuth'

export function RutaProtegida({ children }) {
  const { autenticado, validandoSesion } = useAuth()

  if (validandoSesion) return <Loader texto="Validando sesion..." />
  if (!autenticado) return <Navigate to="/login" replace />

  return children
}

export function RutaPorRol({ roles, children }) {
  const { usuario } = useAuth()

  if (!rolPermitido(usuario, roles)) {
    return <Navigate to="/acceso-denegado" replace />
  }

  return children
}

export function RedireccionPorRol() {
  const { autenticado, usuario, validandoSesion } = useAuth()

  if (validandoSesion) return <Loader texto="Preparando panel..." />
  if (!autenticado) return <Navigate to="/login" replace />

  return <Navigate to={obtenerRutaPorRol(usuario?.rol)} replace />
}

