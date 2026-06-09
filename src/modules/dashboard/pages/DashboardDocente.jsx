import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, ClipboardCheck, ClipboardList, Clock, GraduationCap, User, Users } from 'lucide-react'
import BadgeEstado from '../../../components/common/BadgeEstado'
import Boton from '../../../components/common/Boton'
import CardIndicador from '../../../components/common/CardIndicador'
import EmptyState from '../../../components/common/EmptyState'
import Loader from '../../../components/common/Loader'
import MensajeError from '../../../components/common/MensajeError'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import { useAuth } from '../../../hooks/useAuth'
import { obtenerMensajeError } from '../../../lib/errores'
import { listarAsignacionesDocente } from '../../../services/asignaciones.service'
import { obtenerHorarioActivoDocente } from '../../../services/asistencia.service'
import { listarHorariosDocente } from '../../../services/horarios.service'

function nombrePersona(persona) {
  return [persona?.nombres, persona?.apellido_paterno, persona?.apellido_materno].filter(Boolean).join(' ') || 'Docente'
}

function contarUnicos(items, selector) {
  return new Set(items.map(selector).filter(Boolean)).size
}

function horariosComoLista(respuesta) {
  return Array.isArray(respuesta?.horarios) ? respuesta.horarios : []
}

function asignacionesComoLista(respuesta) {
  return Array.isArray(respuesta?.asignaciones) ? respuesta.asignaciones : []
}

function texto(valor, alternativo = '-') {
  return valor || alternativo
}

function resumenHorario(horario) {
  if (!horario) return 'Sin horario disponible'
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
  const estado = claseActiva?.puede_marcar ? 'activo' : 'inactivo'
  const horarioClase = claseActiva?.horario || horario

  return (
    <section className="rounded-md border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Clase activa / proxima clase</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">{texto(horarioClase?.materia?.nombre || horarioClase?.materia, 'Sin clase visible')}</h2>
          <p className="mt-1 text-sm text-slate-600">{claseActiva?.mensaje || 'Consulta basada en horarios asignados al docente.'}</p>
        </div>
        <BadgeEstado estado={estado} />
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
            {claseActiva?.asistencia?.hora_entrada ? `Entrada ${claseActiva.asistencia.hora_entrada}` : 'Sin entrada marcada'}
          </p>
        </div>
      </div>
    </section>
  )
}

function ListaAsignaciones({ asignaciones }) {
  const visibles = asignaciones.slice(0, 5)

  if (!visibles.length) return <EmptyState descripcion="No existen asignaciones activas para mostrar." />

  return (
    <div className="grid gap-3">
      {visibles.map((asignacion) => (
        <div key={asignacion.id} className="rounded-md border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-semibold text-slate-950">{asignacion.materia?.nombre || 'Sin materia'}</p>
              <p className="mt-1 text-sm text-slate-600">
                {asignacion.grupo?.nombre || 'Sin grupo'} | {asignacion.gestion_academica?.nombre || 'Sin gestion'}
              </p>
              <p className="mt-1 text-sm text-slate-500">{resumenHorario(asignacion.horario)}</p>
            </div>
            <BadgeEstado estado={asignacion.activo ? 'activo' : 'inactivo'} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DashboardDocente() {
  const { usuario, refrescarPerfil } = useAuth()
  const navigate = useNavigate()

  const perfilQuery = useQuery({
    queryKey: ['perfil-autenticado'],
    queryFn: refrescarPerfil,
    initialData: usuario,
    staleTime: 1000 * 60 * 5,
  })

  const perfil = perfilQuery.data || usuario
  const docenteId = perfil?.datos_rol?.docente?.id
  const persona = perfil?.persona || {}

  const horariosQuery = useQuery({
    queryKey: ['horarios', 'docente', docenteId, 'dashboard'],
    queryFn: () => listarHorariosDocente(docenteId),
    enabled: Boolean(docenteId),
  })

  const asignacionesQuery = useQuery({
    queryKey: ['asignaciones', 'docente', docenteId, 'dashboard'],
    queryFn: () => listarAsignacionesDocente(docenteId),
    enabled: Boolean(docenteId),
  })

  const claseActivaQuery = useQuery({
    queryKey: ['asistencia-docente', 'clase-activa', 'dashboard'],
    queryFn: obtenerHorarioActivoDocente,
    refetchInterval: 1000 * 60,
  })

  const horarios = horariosComoLista(horariosQuery.data)
  const asignaciones = asignacionesComoLista(asignacionesQuery.data)
  const proximaClase = buscarProximaClase(horarios)
  const totalGrupos = contarUnicos(asignaciones, (asignacion) => asignacion.grupo?.id)
  const totalMaterias = contarUnicos(asignaciones, (asignacion) => asignacion.materia?.id)
  const error = perfilQuery.error || horariosQuery.error || asignacionesQuery.error || claseActivaQuery.error

  if (perfilQuery.isLoading) return <Loader texto="Cargando panel docente..." />

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Docente', 'Dashboard']} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Panel docente</h1>
          <p className="mt-1 text-sm text-slate-600">Resumen de clases, grupos, materias y asistencia del docente autenticado.</p>
        </div>
        <BadgeEstado estado={perfil?.datos_rol?.docente?.contratado ? 'activo' : 'inactivo'} />
      </div>

      {error ? <MensajeError mensaje={obtenerMensajeError(error)} /> : null}
      {!docenteId ? <MensajeError mensaje="No se encontro el identificador de docente en el perfil autenticado." /> : null}

      <section className="rounded-md border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Docente autenticado</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">{nombrePersona(persona)}</h2>
            <p className="mt-1 text-sm text-slate-600">{persona.correo || perfil?.nombre_usuario || 'Sin correo registrado'}</p>
          </div>
          <Boton variante="secundario" onClick={() => navigate('/docente/perfil')}>
            <User className="h-4 w-4" />
            Ver perfil
          </Boton>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <CardIndicador titulo="Clases" valor={horarios.length} descripcion="Horarios asignados" icono={<CalendarDays className="h-5 w-5" />} />
        <CardIndicador titulo="Grupos" valor={totalGrupos} descripcion="Grupos propios" icono={<Users className="h-5 w-5" />} />
        <CardIndicador titulo="Materias" valor={totalMaterias} descripcion="Materias asignadas" icono={<GraduationCap className="h-5 w-5" />} />
        <CardIndicador titulo="Clase activa" valor={claseActivaQuery.data?.puede_marcar ? 'Si' : 'No'} descripcion="Marcado segun horario" icono={<Clock className="h-5 w-5" />} />
      </div>

      <TarjetaClase horario={proximaClase} claseActiva={claseActivaQuery.data} />

      <section className="grid gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Accesos rapidos</h2>
          <p className="mt-1 text-sm text-slate-600">Funciones permitidas para el rol docente.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <AccesoRapido to="/docente/perfil" icono={<User className="h-5 w-5" />} titulo="Perfil" descripcion="Datos personales y requisitos academicos." />
          <AccesoRapido to="/docente/horarios" icono={<CalendarDays className="h-5 w-5" />} titulo="Horarios" descripcion="Carga horaria por materia, grupo, aula y periodo." />
          <AccesoRapido to="/docente/asistencias" icono={<ClipboardList className="h-5 w-5" />} titulo="Mi asistencia" descripcion="Marcar entrada y salida de clase." />
          <AccesoRapido to="/docente/asistencia-alumnos" icono={<ClipboardCheck className="h-5 w-5" />} titulo="Asistencia alumnos" descripcion="Tomar asistencia y ver historial de tus grupos." />
        </div>
      </section>

      <section className="grid gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Materias y grupos asignados</h2>
          <p className="mt-1 text-sm text-slate-600">Asignaciones activas obtenidas desde Laravel.</p>
        </div>
        {asignacionesQuery.isLoading ? <Loader texto="Cargando asignaciones..." /> : <ListaAsignaciones asignaciones={asignaciones} />}
      </section>
    </div>
  )
}
