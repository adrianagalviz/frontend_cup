import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CalendarDays, ClipboardList, Copy, FileText } from 'lucide-react'
import { toast } from 'sonner'
import BadgeEstado from '../../../components/common/BadgeEstado'
import Boton from '../../../components/common/Boton'
import EmptyState from '../../../components/common/EmptyState'
import Loader from '../../../components/common/Loader'
import MensajeError from '../../../components/common/MensajeError'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import { verAlumno } from '../../../services/alumnos.service'
import { obtenerMensajeError } from '../../../lib/errores'

function nombreCompleto(persona) {
  return [persona?.nombres, persona?.apellido_paterno, persona?.apellido_materno].filter(Boolean).join(' ') || 'Sin nombre'
}

function texto(valor, alternativo = 'Sin dato') {
  return valor === null || valor === undefined || valor === '' ? alternativo : valor
}

function Fila({ etiqueta, valor }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
      <dt className="text-xs font-medium uppercase text-slate-500">{etiqueta}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-900">{texto(valor)}</dd>
    </div>
  )
}

function TarjetaIndicador({ etiqueta, valor, estado }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase text-slate-500">{etiqueta}</p>
      <div className="mt-1">
        {estado ? <BadgeEstado estado={estado} /> : <p className="text-xl font-bold text-slate-950">{texto(valor, '0')}</p>}
      </div>
    </div>
  )
}

export default function DetalleAlumno() {
  const { id } = useParams()

  const alumnoQuery = useQuery({
    queryKey: ['alumnos', 'detalle', id],
    queryFn: () => verAlumno(id),
  })

  if (alumnoQuery.isLoading) return <Loader texto="Cargando alumno..." />
  if (alumnoQuery.error) return <MensajeError mensaje={obtenerMensajeError(alumnoQuery.error)} />

  const alumno = alumnoQuery.data?.alumno

  if (!alumno) return <EmptyState titulo="Alumno no encontrado" />

  const asistencia = alumno.asistencia_resumen || {}
  const promedio = alumno.promedio_final
  const codigoAcceso = alumno.usuario?.codigo_acceso || alumno.codigo_alumno

  async function copiarCodigo() {
    if (!codigoAcceso) return
    await navigator.clipboard.writeText(codigoAcceso)
    toast.success('Codigo de acceso copiado.')
  }

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Administrador', 'Alumnos', 'Detalle']} />
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <Link to="/admin/alumnos" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-900">
            <ArrowLeft className="h-4 w-4" />
            Volver a alumnos
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-slate-950">{nombreCompleto(alumno.persona)}</h1>
          <p className="mt-1 text-sm text-slate-600">{alumno.codigo_alumno || 'Sin codigo de alumno'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <BadgeEstado estado={alumno.estado_academico} />
          <BadgeEstado estado={alumno.usuario?.activo ? 'usuario activo' : 'usuario inactivo'} />
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <TarjetaIndicador etiqueta="Grupo" valor={alumno.grupo_activo?.nombre || 'Sin grupo asignado'} />
        <TarjetaIndicador etiqueta="Gestion" valor={alumno.gestion_academica?.nombre || 'Sin gestion'} />
        <TarjetaIndicador etiqueta="Promedio final" valor={promedio?.promedio || 'Sin promedio'} estado={promedio?.estado_final} />
      </section>

      <section className="grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Acceso como alumno</h2>
            <p className="mt-1 text-sm text-slate-600">Codigo usado para el login del alumno.</p>
          </div>
          <Boton variante="secundario" onClick={copiarCodigo}>
            <Copy className="h-4 w-4" />
            Copiar codigo
          </Boton>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Fila etiqueta="Codigo alumno" valor={alumno.codigo_alumno} />
          <Fila etiqueta="Usuario" valor={alumno.usuario?.nombre_usuario} />
          <Fila etiqueta="Codigo acceso" valor={codigoAcceso} />
        </div>
      </section>

      <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-950">Datos personales</h2>
        <dl className="grid gap-3 md:grid-cols-3">
          <Fila etiqueta="CI" valor={alumno.persona?.cedula_identidad} />
          <Fila etiqueta="Correo" valor={alumno.persona?.correo} />
          <Fila etiqueta="Celular" valor={alumno.persona?.celular || alumno.persona?.telefono} />
          <Fila etiqueta="Fecha nacimiento" valor={alumno.persona?.fecha_nacimiento} />
          <Fila etiqueta="Sexo" valor={alumno.persona?.sexo} />
          <Fila etiqueta="Ciudad" valor={alumno.persona?.ciudad} />
          <div className="md:col-span-3">
            <Fila etiqueta="Direccion" valor={alumno.persona?.direccion} />
          </div>
        </dl>
      </section>

      <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-950">Origen y seguimiento</h2>
        <dl className="grid gap-3 md:grid-cols-3">
          <Fila etiqueta="Postulante origen" valor={alumno.postulante?.id ? `#${alumno.postulante.id}` : 'Sin postulante'} />
          <Fila etiqueta="Estado postulante" valor={alumno.postulante?.estado_postulante} />
          <Fila etiqueta="Requisitos" valor={alumno.postulante?.estado_requisitos} />
          <Fila etiqueta="Pago" valor={alumno.postulante?.estado_pago} />
          <Fila etiqueta="Asignacion grupo" valor={alumno.grupo_activo?.fecha_asignacion || 'Sin grupo asignado'} />
          <Fila etiqueta="Creado en" valor={alumno.creado_en} />
        </dl>
        <div className="flex flex-wrap gap-2">
          {alumno.postulante?.id ? (
            <Link to={`/admin/postulantes/${alumno.postulante.id}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50">
              <FileText className="h-4 w-4" />
              Ver postulante origen
            </Link>
          ) : null}
          <Link to="/admin/horarios" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            <CalendarDays className="h-4 w-4" />
            Ver horarios
          </Link>
          <Link to="/admin/notas" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            <ClipboardList className="h-4 w-4" />
            Ver notas
          </Link>
        </div>
      </section>

      <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-950">Resumen de asistencia</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <TarjetaIndicador etiqueta="Presentes" valor={asistencia.presentes} />
          <TarjetaIndicador etiqueta="Retrasos" valor={asistencia.retrasos} />
          <TarjetaIndicador etiqueta="Faltas" valor={asistencia.faltas} />
          <TarjetaIndicador etiqueta="Pendientes" valor={asistencia.pendientes} />
        </div>
      </section>
    </div>
  )
}
