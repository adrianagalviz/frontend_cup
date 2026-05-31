import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import MensajeError from '../../../components/common/MensajeError'
import { listarCarreras } from '../../../services/carreras.service'
import { listarGestiones } from '../../../services/gestionAcademica.service'
import { registrarPostulante, subirTituloBachiller } from '../../../services/postulantes.service'
import { obtenerMensajeError } from '../../../lib/errores'
import FormularioPostulante from '../components/FormularioPostulante'

export default function RegistroPostulante() {
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)
  const carrerasQuery = useQuery({
    queryKey: ['postulantes', 'carreras'],
    queryFn: () => listarCarreras({ activa: 'true', por_pagina: 100 }),
    retry: false,
  })
  const gestionesQuery = useQuery({
    queryKey: ['postulantes', 'gestiones'],
    queryFn: () => listarGestiones({ activa: 'true', por_pagina: 100 }),
    retry: false,
  })

  async function guardar({ payload, archivo }) {
    setMensaje('')
    setCargando(true)

    try {
      const respuesta = await registrarPostulante(payload)
      const postulanteId = respuesta?.postulante?.id

      if (archivo && postulanteId) {
        await subirTituloBachiller(postulanteId, archivo)
      }

      toast.success('Postulante registrado correctamente.')
      setMensaje('Registro completado. El administrador revisara los requisitos y el pago segun el flujo definido.')
    } catch (error) {
      setMensaje(obtenerMensajeError(error))
      throw error
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Registro de postulante</h1>
        <p className="mt-1 text-sm text-slate-600">Formulario conectado al backend Laravel para el registro CUP-FICCT.</p>
      </div>
      {mensaje ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{mensaje}</div> : null}
      {carrerasQuery.error ? <MensajeError mensaje="No se pudieron cargar las carreras desde el backend. El registro requiere carreras reales." /> : null}
      <FormularioPostulante
        carreras={carrerasQuery.data || []}
        gestiones={gestionesQuery.data || []}
        onGuardar={guardar}
        cargando={cargando}
        requiereArchivo
      />
    </div>
  )
}
