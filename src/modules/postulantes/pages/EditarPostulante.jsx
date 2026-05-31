import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import Loader from '../../../components/common/Loader'
import MensajeError from '../../../components/common/MensajeError'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import { listarCarreras } from '../../../services/carreras.service'
import { listarGestiones } from '../../../services/gestionAcademica.service'
import { editarPostulante, subirTituloBachiller, verPostulante } from '../../../services/postulantes.service'
import { obtenerMensajeError } from '../../../lib/errores'
import FormularioPostulante from '../components/FormularioPostulante'

export default function EditarPostulante() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [mensajeError, setMensajeError] = useState('')

  const postulanteQuery = useQuery({
    queryKey: ['postulante', id],
    queryFn: () => verPostulante(id),
  })
  const carrerasQuery = useQuery({
    queryKey: ['postulantes', 'carreras'],
    queryFn: () => listarCarreras({ activa: 'true', por_pagina: 100 }),
  })
  const gestionesQuery = useQuery({
    queryKey: ['postulantes', 'gestiones'],
    queryFn: () => listarGestiones({ activa: 'true', por_pagina: 100 }),
  })

  const editarMutation = useMutation({
    mutationFn: async ({ payload, archivo }) => {
      const respuesta = await editarPostulante(id, payload)
      if (archivo) await subirTituloBachiller(id, archivo)
      return respuesta
    },
    onSuccess: () => {
      toast.success('Postulante actualizado correctamente.')
      navigate(`/admin/postulantes/${id}`)
    },
    onError: (error) => setMensajeError(obtenerMensajeError(error)),
  })

  if (postulanteQuery.isLoading) return <Loader texto="Cargando postulante..." />
  if (postulanteQuery.error) return <MensajeError mensaje={obtenerMensajeError(postulanteQuery.error)} />

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Administrador', 'Postulantes', 'Editar']} />
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Editar postulante</h1>
        <p className="mt-1 text-sm text-slate-600">Actualiza solo los datos permitidos por el backend Laravel.</p>
      </div>
      {mensajeError ? <MensajeError mensaje={mensajeError} /> : null}
      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <FormularioPostulante
          postulante={postulanteQuery.data?.postulante}
          carreras={carrerasQuery.data || []}
          gestiones={gestionesQuery.data || []}
          onGuardar={(datos) => editarMutation.mutateAsync(datos)}
          onCancelar={() => navigate(`/admin/postulantes/${id}`)}
          cargando={editarMutation.isPending}
        />
      </section>
    </div>
  )
}
