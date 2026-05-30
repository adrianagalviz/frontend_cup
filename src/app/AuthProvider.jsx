import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AuthContext } from '../hooks/authContext'
import { cerrarSesion, loginAlumno, loginFirebase, loginTradicional, obtenerPerfil } from '../services/auth.service'
import { cerrarSesionFirebase } from '../lib/firebase'
import { limpiarSesionGuardada, guardarToken, guardarUsuario, obtenerToken, obtenerUsuarioGuardado } from '../lib/storage'

function transformarPerfil(respuesta) {
  const datos = respuesta?.datos || respuesta

  return datos?.usuario
    ? {
        ...datos.usuario,
        rol: datos.rol?.nombre || datos.usuario?.rol,
        persona: datos.persona || datos.usuario?.persona,
        datos_rol: datos.datos_rol,
      }
    : null
}

export default function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [usuario, setUsuario] = useState(() => obtenerUsuarioGuardado())
  const [token, setToken] = useState(() => obtenerToken())
  const [validandoSesion, setValidandoSesion] = useState(Boolean(obtenerToken()))

  const aplicarSesion = useCallback(async (respuesta) => {
    const datos = respuesta?.datos || respuesta
    const nuevoToken = datos?.token
    const nuevoUsuario = datos?.usuario

    if (nuevoToken) {
      guardarToken(nuevoToken)
      setToken(nuevoToken)
    }

    let usuarioSesion = nuevoUsuario

    if (nuevoToken) {
      try {
        usuarioSesion = transformarPerfil(await obtenerPerfil()) || nuevoUsuario
      } catch {
        usuarioSesion = nuevoUsuario
      }
    }

    if (usuarioSesion) {
      guardarUsuario(usuarioSesion)
      setUsuario(usuarioSesion)
    }

    return {
      ...datos,
      usuario: usuarioSesion,
    }
  }, [])

  const iniciarSesion = useCallback(async (payload) => {
    const respuesta = await loginTradicional(payload)
    return aplicarSesion(respuesta)
  }, [aplicarSesion])

  const iniciarSesionAlumno = useCallback(async (payload) => {
    const respuesta = await loginAlumno(payload)
    return aplicarSesion(respuesta)
  }, [aplicarSesion])

  const iniciarSesionFirebase = useCallback(async (firebaseToken) => {
    const respuesta = await loginFirebase({ firebase_token: firebaseToken })
    return aplicarSesion(respuesta)
  }, [aplicarSesion])

  const refrescarPerfil = useCallback(async () => {
    const respuesta = await obtenerPerfil()
    const perfil = transformarPerfil(respuesta)

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
      await cerrarSesionFirebase()
      queryClient.clear()
      limpiarSesionGuardada()
      setUsuario(null)
      setToken(null)
    }
  }, [queryClient, token])

  useEffect(() => {
    if (!token) return

    let activo = true

    obtenerPerfil()
      .then((respuesta) => {
        const perfil = transformarPerfil(respuesta)

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
    iniciarSesionFirebase,
    refrescarPerfil,
    salir,
  }), [iniciarSesion, iniciarSesionAlumno, iniciarSesionFirebase, refrescarPerfil, salir, token, usuario, validandoSesion])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
