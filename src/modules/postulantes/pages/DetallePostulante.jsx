import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { Edit } from 'lucide-react'
import BadgeEstado from '../../../components/common/BadgeEstado'
import EmptyState from '../../../components/common/EmptyState'
import Loader from '../../../components/common/Loader'
import MensajeError from '../../../components/common/MensajeError'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import { obtenerMensajeError } from '../../../lib/errores'
import { verPostulante } from '../../../services/postulantes.service'

function Fila({ label, valor }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-900">{valor || 'No registrado'}</p>
    </div>
  )
}

export default function DetallePostulante() {
  const { id } = useParams()
  const postulanteQuery = useQuery({
    queryKey: ['postulante', id],
    queryFn: () => verPostulante(id),
  })

  if (postulanteQuery.isLoading) return <Loader texto="Cargando postulante..." />
  if (postulanteQuery.error) return <MensajeError mensaje={obtenerMensajeError(postulanteQuery.error)} />

  const postulante = postulanteQuery.data?.postulante
  const documento = postulante?.documentos?.find((item) => item.tipo_documento === 'titulo_bachiller')

  if (!postulante) return <EmptyState titulo="Postulante no encontrado" />

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Administrador', 'Postulantes', 'Detalle']} />
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">{postulante.persona?.nombres} {postulante.persona?.apellido_paterno}</h1>
          <p className="mt-1 text-sm text-slate-600">Detalle completo del postulante antes de validar o convertir.</p>
        </div>
        <Link to={`/admin/postulantes/${id}/editar`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800">
          <Edit className="h-4 w-4" />
          Editar
        </Link>
      </div>

      <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
        <Fila label="Cedula" valor={postulante.persona?.cedula_identidad} />
        <Fila label="Correo" valor={postulante.persona?.correo} />
        <Fila label="Telefono" valor={postulante.persona?.telefono} />
        <Fila label="Fecha nacimiento" valor={postulante.persona?.fecha_nacimiento} />
        <Fila label="Sexo" valor={postulante.persona?.sexo} />
        <Fila label="Ciudad" valor={postulante.persona?.ciudad} />
        <div className="md:col-span-3">
          <Fila label="Direccion" valor={postulante.persona?.direccion} />
        </div>
      </section>

      <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
        <Fila label="Colegio" valor={postulante.colegio_procedencia} />
        <Fila label="Gestion" valor={postulante.gestion_academica?.nombre} />
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Requisitos</p>
          <div className="mt-1"><BadgeEstado estado={postulante.estado_requisitos} /></div>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Pago</p>
          <div className="mt-1"><BadgeEstado estado={postulante.estado_pago} /></div>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Acceso como alumno</p>
          <div className="mt-1"><BadgeEstado estado={postulante.estado_postulante} /></div>
        </div>
        <Fila label="Observacion" valor={postulante.requisitos?.observacion} />
        <Fila label="Primera opcion" valor={postulante.postulacion?.primera_carrera?.nombre} />
        <Fila label="Segunda opcion" valor={postulante.postulacion?.segunda_carrera?.nombre} />
        <Fila label="Carrera asignada" valor={postulante.postulacion?.carrera_asignada?.nombre} />
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Titulo de bachiller</h2>
        {documento?.cloudinary_url ? (
          <div className="mt-4 grid gap-3 md:grid-cols-[240px_1fr]">
            <img src={documento.cloudinary_url} alt="Titulo de bachiller" className="h-48 w-full rounded-md border border-slate-200 object-cover" />
            <div className="grid content-start gap-3">
              <BadgeEstado estado={documento.estado_revision} />
              <Fila label="Formato" valor={documento.formato_archivo} />
              <Fila label="Observacion" valor={documento.observacion} />
            </div>
          </div>
        ) : (
          <EmptyState titulo="Sin titulo de bachiller" descripcion="No existe documento cargado para este postulante." />
        )}
      </section>
    </div>
  )
}
