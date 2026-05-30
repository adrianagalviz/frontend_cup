import { obtenerRolUsuario } from '../lib/auth'
import { useAuth } from './useAuth'

export function useRol() {
  const { usuario } = useAuth()
  const rol = obtenerRolUsuario(usuario)

  return {
    rol,
    esAdministrador: rol === 'administrador',
    esDocente: rol === 'docente',
    esAlumno: rol === 'alumno',
  }
}

