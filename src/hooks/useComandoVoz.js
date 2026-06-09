import { useCallback, useEffect, useRef, useState } from 'react'

function obtenerReconocedorVoz() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function useComandoVoz() {
  const reconocimientoRef = useRef(null)
  const [compatible] = useState(() => Boolean(obtenerReconocedorVoz()))
  const [escuchando, setEscuchando] = useState(false)
  const [texto, setTexto] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const SpeechRecognition = obtenerReconocedorVoz()

    if (!SpeechRecognition) return undefined

    const reconocimiento = new SpeechRecognition()
    reconocimiento.lang = 'es-BO'
    reconocimiento.continuous = false
    reconocimiento.interimResults = true

    reconocimiento.onstart = () => {
      setEscuchando(true)
      setError('')
    }

    reconocimiento.onresult = (evento) => {
      const transcripcion = Array.from(evento.results)
        .map((resultado) => resultado[0]?.transcript || '')
        .join(' ')
        .trim()

      setTexto(transcripcion)
    }

    reconocimiento.onerror = (evento) => {
      setError(evento.error === 'not-allowed' ? 'Permiso de microfono denegado.' : 'No se pudo capturar el comando de voz.')
      setEscuchando(false)
    }

    reconocimiento.onend = () => {
      setEscuchando(false)
    }

    reconocimientoRef.current = reconocimiento

    return () => {
      reconocimiento.stop()
      reconocimientoRef.current = null
    }
  }, [])

  const iniciar = useCallback(() => {
    if (!reconocimientoRef.current) {
      setError('El navegador no soporta Web Speech API.')
      return
    }

    setTexto('')
    setError('')
    reconocimientoRef.current.start()
  }, [])

  const detener = useCallback(() => {
    reconocimientoRef.current?.stop()
    setEscuchando(false)
  }, [])

  const limpiar = useCallback(() => {
    setTexto('')
    setError('')
  }, [])

  return {
    compatible,
    escuchando,
    texto,
    error,
    iniciar,
    detener,
    limpiar,
    setTexto,
  }
}
