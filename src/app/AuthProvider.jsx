import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from '../hooks/authContext'
import { cerrarSesion, loginAlumno, loginTradicional, obtenerPerfil } from '../services/auth.service'
import { limpiarSesionGuardada, guardarToken, guardarUsuario, obtenerToken, obtenerUsuarioGuardado } from '../lib/storage'

export default function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => obtenerUsuarioGuardado())
  const [token, setToken] = useState(() => obtenerToken())
  const [validandoSesion, setValidandoSesion] = useState(Boolean(obtenerToken()))

  const aplicarSesion = useCallback((respuesta) => {
    const datos = respuesta?.datos || respuesta
    const nuevoToken = datos?.token
    const nuevoUsuario = datos?.usuario

    if (nuevoToken) {
      guardarToken(nuevoToken)
      setToken(nuevoToken)
    }

    if (nuevoUsuario) {
      guardarUsuario(nuevoUsuario)
      setUsuario(nuevoUsuario)
    }

    return datos
  }, [])

  const iniciarSesion = useCallback(async (payload) => {
    const respuesta = await loginTradicional(payload)
    return aplicarSesion(respuesta)
  }, [aplicarSesion])

  const iniciarSesionAlumno = useCallback(async (payload) => {
    const respuesta = await loginAlumno(payload)
    return aplicarSesion(respuesta)
  }, [aplicarSesion])

  const refrescarPerfil = useCallback(async () => {
    const respuesta = await obtenerPerfil()
    const datos = respuesta?.datos || respuesta
    const perfil = datos?.usuario
      ? {
          ...datos.usuario,
          rol: datos.rol?.nombre,
          persona: datos.persona,
          datos_rol: datos.datos_rol,
        }
      : null

    if (perfil) {
      guardarUsuario(perfil)
      setUsuario(perfil)
    }

    return perfil
  }, [])

  const salir = useCallback(async () => {
    try {
      if (token) await cerrarSesion()
    } finally {
      limpiarSesionGuardada()
      setUsuario(null)
      setToken(null)
    }
  }, [token])

  useEffect(() => {
    if (!token) return

    let activo = true

    obtenerPerfil()
      .then((respuesta) => {
        const datos = respuesta?.datos || respuesta
        const perfil = datos?.usuario
          ? {
              ...datos.usuario,
              rol: datos.rol?.nombre,
              persona: datos.persona,
              datos_rol: datos.datos_rol,
            }
          : null

        if (activo && perfil) {
          guardarUsuario(perfil)
          setUsuario(perfil)
        }
      })
      .catch(() => {
        limpiarSesionGuardada()
        if (activo) {
          setUsuario(null)
          setToken(null)
        }
      })
      .finally(() => {
        if (activo) setValidandoSesion(false)
      })

    return () => {
      activo = false
    }
  }, [token])

  const value = useMemo(() => ({
    usuario,
    token,
    autenticado: Boolean(token && usuario),
    validandoSesion,
    iniciarSesion,
    iniciarSesionAlumno,
    refrescarPerfil,
    salir,
  }), [iniciarSesion, iniciarSesionAlumno, refrescarPerfil, salir, token, usuario, validandoSesion])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

