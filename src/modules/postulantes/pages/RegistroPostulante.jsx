import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'
import { CreditCard, FileCheck2, UserRoundPlus } from 'lucide-react'
import MensajeError from '../../../components/common/MensajeError'
import { listarCarrerasActivas } from '../../../services/carreras.service'
import { obtenerGestionActual } from '../../../services/gestionAcademica.service'
import { registrarPostulante, subirTituloBachiller } from '../../../services/postulantes.service'
import { obtenerMensajeError } from '../../../lib/errores'
import FormularioPostulante from '../components/FormularioPostulante'

export default function RegistroPostulante() {
  const navigate = useNavigate()
  const [mensaje, setMensaje] = useState('')
  const [documentoTitulo, setDocumentoTitulo] = useState(null)
  const [cargando, setCargando] = useState(false)
  const carrerasQuery = useQuery({
    queryKey: ['postulantes', 'carreras'],
    queryFn: () => listarCarrerasActivas({ por_pagina: 100 }),
    retry: false,
  })
  const gestionActualQuery = useQuery({
    queryKey: ['postulantes', 'gestion-actual'],
    queryFn: obtenerGestionActual,
    retry: false,
  })

  async function guardar({ payload, archivo }) {
    setMensaje('')
    setDocumentoTitulo(null)
    setCargando(true)

    try {
      const respuesta = await registrarPostulante(payload)
      const postulanteId = respuesta?.postulante?.id

      if (archivo && postulanteId) {
        const respuestaDocumento = await subirTituloBachiller(postulanteId, archivo)
        setDocumentoTitulo(respuestaDocumento?.documento || null)
      }

      toast.success('Postulante registrado correctamente.')
      setMensaje('Registro completado. Seras redirigido al pago de postulacion.')
      if (postulanteId) navigate(`/pagos/postulante/${postulanteId}`, { replace: true })
    } catch (error) {
      setMensaje(obtenerMensajeError(error))
      throw error
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-sky-800">Postulacion CUP-FICCT</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Registro de postulante</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Completa tus datos personales, selecciona tus carreras y sube tu titulo de bachiller. Al finalizar pasaras al pago de postulacion.
          </p>
        </div>
        <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm sm:grid-cols-3 lg:w-[520px]">
          <div className="flex items-center gap-2">
            <UserRoundPlus className="h-4 w-4 text-sky-700" />
            <span className="font-medium text-slate-700">Registro</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-sky-700" />
            <span className="font-medium text-slate-700">Pago</span>
          </div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-sky-700" />
            <span className="font-medium text-slate-700">Revision admin</span>
          </div>
        </div>
      </div>
      {mensaje ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{mensaje}</div> : null}
      {documentoTitulo?.cloudinary_url ? (
        <section className="grid gap-3 rounded-md border border-emerald-200 bg-white p-4 shadow-sm md:grid-cols-[180px_1fr]">
          <img src={documentoTitulo.cloudinary_url} alt="Titulo de bachiller subido" className="h-36 w-full rounded-md border border-slate-200 object-cover" />
          <div className="grid content-start gap-2">
            <h2 className="text-base font-semibold text-slate-950">Titulo de bachiller cargado</h2>
            <a className="break-all text-sm font-medium text-sky-700 hover:text-sky-800" href={documentoTitulo.cloudinary_url} target="_blank" rel="noreferrer">
              {documentoTitulo.cloudinary_url}
            </a>
            <p className="text-sm text-slate-600">La imagen visualizada proviene de la respuesta del backend.</p>
          </div>
        </section>
      ) : null}
      {carrerasQuery.error ? <MensajeError mensaje="No se pudieron cargar las carreras desde el backend. El registro requiere carreras reales." /> : null}
      {gestionActualQuery.error ? <MensajeError mensaje="No se pudo cargar la gestion academica global. El administrador debe definir una gestion activa." /> : null}
      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <FormularioPostulante
          carreras={carrerasQuery.data || []}
          gestionActual={gestionActualQuery.data?.gestion}
          onGuardar={guardar}
          cargando={cargando || gestionActualQuery.isLoading}
          requiereArchivo
        />
      </section>
    </div>
  )
}
