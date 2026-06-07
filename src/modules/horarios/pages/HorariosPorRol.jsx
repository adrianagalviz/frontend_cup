import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import BadgeEstado from '../../../components/common/BadgeEstado'
import Loader from '../../../components/common/Loader'
import MensajeError from '../../../components/common/MensajeError'
import TablaBase from '../../../components/tables/TablaBase'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import { useAuth } from '../../../hooks/useAuth'
import { obtenerMensajeError } from '../../../lib/errores'
import { listarHorariosAlumno, listarHorariosDocente } from '../../../services/horarios.service'

function nombreDocente(docente) {
  return [docente?.nombres, docente?.apellido_paterno, docente?.apellido_materno].filter(Boolean).join(' ') || 'Sin docente'
}

function proximaClase(horarios) {
  return horarios.find((horario) => horario.activo) || horarios[0]
}

export default function HorariosPorRol({ rol }) {
  const { usuario, refrescarPerfil } = useAuth()

  const perfilQuery = useQuery({
    queryKey: ['perfil-autenticado'],
    queryFn: refrescarPerfil,
    initialData: usuario,
    staleTime: 1000 * 60 * 5,
  })

  const perfil = perfilQuery.data || usuario
  const docenteId = perfil?.datos_rol?.docente?.id
  const alumnoId = perfil?.datos_rol?.alumno?.id
  const idConsulta = rol === 'docente' ? docenteId : alumnoId

  const horariosQuery = useQuery({
    queryKey: ['horarios', rol, idConsulta],
    queryFn: () => (rol === 'docente' ? listarHorariosDocente(idConsulta) : listarHorariosAlumno(idConsulta)),
    enabled: Boolean(idConsulta),
  })

  const horarios = horariosQuery.data?.horarios || []
  const siguiente = proximaClase(horarios)

  const columnas = useMemo(() => [
    {
      header: 'Clase',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-950">{row.original.materia?.nombre || 'Sin materia'}</p>
          <p className="text-xs text-slate-500">{row.original.grupo?.nombre || 'Sin grupo'} | {row.original.gestion_academica?.nombre || 'Sin gestion'}</p>
        </div>
      ),
    },
    {
      header: 'Dia y periodo',
      cell: ({ row }) => `${row.original.dia?.nombre || '-'} | ${row.original.turno?.nombre || '-'} | Periodo ${row.original.periodo?.numero_periodo || '-'}`,
    },
    {
      header: 'Hora',
      cell: ({ row }) => `${row.original.hora_inicio} - ${row.original.hora_fin}`,
    },
    {
      header: rol === 'docente' ? 'Aula' : 'Docente',
      cell: ({ row }) => (rol === 'docente' ? row.original.aula?.ubicacion || 'Sin aula' : nombreDocente(row.original.docente)),
    },
    {
      header: 'Estado',
      cell: ({ row }) => <BadgeEstado estado={row.original.activo ? 'activo' : 'inactivo'} />,
    },
  ], [rol])

  if (perfilQuery.isLoading) return <Loader texto="Cargando perfil..." />

  const titulo = rol === 'docente' ? 'Horarios docente' : 'Horarios alumno'
  const breadcrumb = rol === 'docente' ? ['Docente', 'Horarios'] : ['Alumno', 'Horarios']

  return (
    <div className="grid gap-5">
      <Breadcrumb items={breadcrumb} />
      <div>
        <h1 className="text-2xl font-bold text-slate-950">{titulo}</h1>
        <p className="mt-1 text-sm text-slate-600">Horarios permitidos para el usuario autenticado.</p>
      </div>

      {perfilQuery.error ? <MensajeError mensaje={obtenerMensajeError(perfilQuery.error)} /> : null}
      {horariosQuery.error ? <MensajeError mensaje={obtenerMensajeError(horariosQuery.error)} /> : null}
      {!idConsulta ? <MensajeError mensaje="No se encontro el identificador de rol necesario para consultar horarios." /> : null}

      <div className="rounded-md border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium uppercase text-slate-500">Proxima clase visible</p>
        <p className="mt-1 text-sm font-semibold text-slate-950">
          {siguiente ? `${siguiente.dia?.nombre || '-'} ${siguiente.hora_inicio} - ${siguiente.hora_fin} | ${siguiente.materia?.nombre || 'Materia'} | ${siguiente.aula?.ubicacion || 'Aula'}` : 'Sin horarios activos'}
        </p>
      </div>

      <TablaBase
        columnas={columnas}
        datos={horarios}
        cargando={horariosQuery.isLoading}
        mensajeVacio="No existen horarios disponibles para este usuario."
      />
    </div>
  )
}
