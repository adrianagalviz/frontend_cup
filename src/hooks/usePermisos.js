import { rolPermitido } from '../lib/auth'
import { useAuth } from './useAuth'

export function usePermisos(rolesPermitidos = []) {
  const { usuario } = useAuth()

  return rolPermitido(usuario, rolesPermitidos)
}

