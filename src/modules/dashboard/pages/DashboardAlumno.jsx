import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, CalendarDays, ClipboardCheck, Copy, FileSpreadsheet, User } from 'lucide-react'
import { toast } from 'sonner'
import BadgeEstado from '../../../components/common/BadgeEstado'
import Boton from '../../../components/common/Boton'
import CardIndicador from '../../../components/common/CardIndicador'
import EmptyState from '../../../components/common/EmptyState'
import Loader from '../../../components/common/Loader'
import MensajeError from '../../../components/common/MensajeError'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import { useAuth } from '../../../hooks/useAuth'
import { obtenerMensajeError } from '../../../lib/errores'
import { obtenerHorarioActivoAlumno, listarMisAsistenciasAlumno } from '../../../services/asistencia.service'
import { listarExamenesHabilitadosAlumno } from '../../../services/examenes.service'
import { listarHorariosAlumno } from '../../../services/horarios.service'
import { listarNotasAlumno } from '../../../services/notas.service'

function nombrePersona(persona) {
  return [persona?.nombres, persona?.apellido_paterno, persona?.apellido_materno].filter(Boolean).join(' ') || 'Alumno'
}

function texto(valor, alternativo = '-') {
  return valor === null || valor === undefined || valor === '' ? alternativo : valor
}

function horariosComoLista(respuesta) {
  return Array.isArray(respuesta?.horarios) ? respuesta.horarios : []
}

function resumenHorario(horario) {
  if (!horario) return 'Sin horario visible'
  return `${texto(horario.dia?.nombre || horario.dia)} | ${texto(horario.turno?.nombre || horario.turno)} | Periodo ${texto(horario.periodo?.numero_periodo || horario.periodo)} | ${texto(horario.hora_inicio)} - ${texto(horario.hora_fin)}`
}

function buscarProximaClase(horarios) {
  return [...horarios]
    .filter((horario) => horario.activo)
    .sort((a, b) => {
      const diaA = a.dia?.orden ?? a.dia?.id ?? 0
      const diaB = b.dia?.orden ?? b.dia?.id ?? 0
      const periodoA = a.periodo?.numero_periodo ?? 0
      const periodoB = b.periodo?.numero_periodo ?? 0
      return diaA - diaB || periodoA - periodoB
    })[0]
}

function estadoPromedio(promedio) {
  return promedio?.estado_final || 'pendiente'
}

function AccesoRapido({ to, icono, titulo, descripcion }) {
  return (
    <Link
      to={to}
      className="rounded-md border border-slate-200 bg-white p-4 transition hover:border-sky-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-sky-50 p-2 text-sky-700">{icono}</div>
        <div>
          <p className="font-semibold text-slate-950">{titulo}</p>
          <p className="mt-1 text-sm text-slate-600">{descripcion}</p>
        </div>
      </div>
    </Link>
  )
}

function TarjetaClase({ horario, claseActiva }) {
  const horarioClase = claseActiva?.horario || horario
  const asistencia = claseActiva?.asistencia

  return (
    <section className="rounded-md border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Clase activa / proxima clase</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">{texto(horarioClase?.materia?.nombre || horarioClase?.materia, 'Sin clase visible')}</h2>
          <p className="mt-1 text-sm text-slate-600">{claseActiva?.mensaje || 'Consulta basada en el grupo asignado al alumno.'}</p>
        </div>
        <BadgeEstado estado={asistencia?.estado_asistencia || (claseActiva?.puede_marcar ? 'pendiente' : 'inactivo')} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Grupo</p>
          <p className="mt-1 text-sm font-medium text-slate-950">{texto(horarioClase?.grupo?.nombre || horarioClase?.grupo)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Aula</p>
          <p className="mt-1 text-sm font-medium text-slate-950">{texto(horarioClase?.aula?.ubicacion || horarioClase?.aula)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Horario</p>
          <p className="mt-1 text-sm font-medium text-slate-950">{resumenHorario(horarioClase)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Asistencia</p>
          <p className="mt-1 text-sm font-medium text-slate-950">
            {asistencia?.hora_marcada ? `Marcada ${asistencia.hora_marcada}` : 'Sin marca registrada'}
          </p>
        </div>
      </div>
    </section>
  )
}

function ListaExamenes({ examenes }) {
  const visibles = examenes.slice(0, 4)

  if (!visibles.length) return <EmptyState descripcion="No tienes examenes habilitados en este momento." />

  return (
    <div className="grid gap-3">
      {visibles.map((examen) => (
        <div key={examen.id} className="rounded-md border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-semibold text-slate-950">{examen.titulo}</p>
              <p className="mt-1 text-sm text-slate-600">Parcial {examen.numero_parcial} | {texto(examen.gestion_academica?.nombre, 'Sin gestion')}</p>
              <p className="mt-1 text-sm text-slate-500">{texto(examen.fecha_inicio)} - {texto(examen.fecha_fin)}</p>
            </div>
            <BadgeEstado estado={examen.ya_respondio ? 'finalizado' : 'habilitado'} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DashboardAlumno() {
  const { usuario, refrescarPerfil } = useAuth()
  const navigate = useNavigate()

  const perfilQuery = useQuery({
    queryKey: ['perfil-autenticado'],
    queryFn: refrescarPerfil,
    initialData: usuario,
    staleTime: 1000 * 60 * 5,
  })

  const perfil = perfilQuery.data || usuario
  const alumno = perfil?.datos_rol?.alumno
  const alumnoId = alumno?.id
  const persona = perfil?.persona || {}
  const codigoAlumno = alumno?.codigo_alumno || perfil?.codigo_acceso

  const horariosQuery = useQuery({
    queryKey: ['horarios', 'alumno', alumnoId, 'dashboard'],
    queryFn: () => listarHorariosAlumno(alumnoId),
    enabled: Boolean(alumnoId),
  })

  const claseActivaQuery = useQuery({
    queryKey: ['asistencia-alumno', 'clase-activa', 'dashboard'],
    queryFn: obtenerHorarioActivoAlumno,
    refetchInterval: 1000 * 60,
  })

  const asistenciasQuery = useQuery({
    queryKey: ['asistencia-alumno', 'mis-asistencias', 'dashboard'],
    queryFn: () => listarMisAsistenciasAlumno({ por_pagina: 10 }),
  })

  const examenesQuery = useQuery({
    queryKey: ['alumno', 'examenes-habilitados', 'dashboard'],
    queryFn: () => listarExamenesHabilitadosAlumno(),
  })

  const notasQuery = useQuery({
    queryKey: ['notas-alumno', alumnoId, 'dashboard'],
    queryFn: () => listarNotasAlumno(alumnoId),
    enabled: Boolean(alumnoId),
  })

  const horarios = horariosComoLista(horariosQuery.data)
  const proximaClase = buscarProximaClase(horarios)
  const asistencias = asistenciasQuery.data?.datos || []
  const examenes = examenesQuery.data?.examenes || []
  const pendientes = examenes.filter((examen) => !examen.ya_respondio).length
  const promedio = notasQuery.data?.promedio_final
  const notas = notasQuery.data?.notas_parciales || []
  const error = perfilQuery.error || horariosQuery.error || claseActivaQuery.error || asistenciasQuery.error || examenesQuery.error || notasQuery.error

  if (perfilQuery.isLoading) return <Loader texto="Cargando panel alumno..." />

  async function copiarCodigo() {
    if (!codigoAlumno) return
    await navigator.clipboard.writeText(codigoAlumno)
    toast.success('Codigo de alumno copiado.')
  }

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Alumno', 'Dashboard']} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Panel alumno</h1>
          <p className="mt-1 text-sm text-slate-600">Resumen de perfil, horarios, asistencias, examenes y notas del alumno autenticado.</p>
        </div>
        <BadgeEstado estado={alumno?.estado_academico || 'activo'} />
      </div>

      {error ? <MensajeError mensaje={obtenerMensajeError(error)} /> : null}
      {!alumnoId ? <MensajeError mensaje="No se encontro el identificador de alumno en el perfil autenticado." /> : null}

      <section className="rounded-md border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Alumno autenticado</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">{nombrePersona(persona)}</h2>
            <p className="mt-1 text-sm text-slate-600">{persona.correo || perfil?.nombre_usuario || 'Sin correo registrado'}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {codigoAlumno ? <code className="rounded-md bg-emerald-50 px-3 py-2 text-base font-bold text-emerald-800 ring-1 ring-emerald-200">{codigoAlumno}</code> : null}
            <Boton variante="secundario" onClick={copiarCodigo} disabled={!codigoAlumno}>
              <Copy className="h-4 w-4" />
              Copiar codigo
            </Boton>
            <Boton variante="secundario" onClick={() => navigate('/alumno/perfil')}>
              <User className="h-4 w-4" />
              Ver perfil
            </Boton>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <CardIndicador titulo="Horarios" valor={horarios.length} descripcion="Segun grupo asignado" icono={<CalendarDays className="h-5 w-5" />} />
        <CardIndicador titulo="Asistencias" valor={asistencias.length} descripcion="Ultimos registros propios" icono={<ClipboardCheck className="h-5 w-5" />} />
        <CardIndicador titulo="Examenes" valor={pendientes} descripcion="Pendientes habilitados" icono={<BookOpen className="h-5 w-5" />} />
        <CardIndicador titulo="Promedio" valor={promedio?.promedio || 'Pendiente'} descripcion={estadoPromedio(promedio)} icono={<FileSpreadsheet className="h-5 w-5" />} />
      </div>

      <TarjetaClase horario={proximaClase} claseActiva={claseActivaQuery.data} />

      <section className="grid gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Accesos rapidos</h2>
          <p className="mt-1 text-sm text-slate-600">Funciones permitidas para el rol alumno.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <AccesoRapido to="/alumno/perfil" icono={<User className="h-5 w-5" />} titulo="Perfil" descripcion="Datos personales, codigo y estado academico." />
          <AccesoRapido to="/alumno/horarios" icono={<CalendarDays className="h-5 w-5" />} titulo="Horarios" descripcion="Materia, docente, aula, dia, turno y periodo." />
          <AccesoRapido to="/alumno/asistencias" icono={<ClipboardCheck className="h-5 w-5" />} titulo="Asistencias" descripcion="Marcar asistencia y revisar historial." />
          <AccesoRapido to="/alumno/examenes" icono={<BookOpen className="h-5 w-5" />} titulo="Examenes" descripcion="Rendir solo examenes habilitados por backend." />
          <AccesoRapido to="/alumno/notas" icono={<FileSpreadsheet className="h-5 w-5" />} titulo="Notas" descripcion="Parciales, promedio y estado final." />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Examenes habilitados</h2>
            <p className="mt-1 text-sm text-slate-600">Listado devuelto por Laravel para tu gestion academica.</p>
          </div>
          {examenesQuery.isLoading ? <Loader texto="Cargando examenes..." /> : <ListaExamenes examenes={examenes} />}
        </div>

        <div className="grid gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Notas recientes</h2>
            <p className="mt-1 text-sm text-slate-600">Parciales registrados y promedio final si corresponde.</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4">
            {notasQuery.isLoading ? <Loader texto="Cargando notas..." /> : (
              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-600">Estado final</span>
                  <BadgeEstado estado={estadoPromedio(promedio)} />
                </div>
                {notas.length ? notas.slice(0, 3).map((nota) => (
                  <div key={nota.id} className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2">
                    <span className="text-sm font-medium text-slate-950">Parcial {nota.numero_parcial}</span>
                    <span className="text-sm font-bold text-slate-950">{nota.nota}</span>
                  </div>
                )) : <EmptyState descripcion="Todavia no tienes notas parciales registradas." />}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
