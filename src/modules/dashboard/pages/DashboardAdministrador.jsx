import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  BookOpenCheck,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  LayoutGrid,
  School,
  Users,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import CardIndicador from '../../../components/common/CardIndicador'
import EmptyState from '../../../components/common/EmptyState'
import Loader from '../../../components/common/Loader'
import MensajeError from '../../../components/common/MensajeError'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import {
  obtenerAsistenciaDashboard,
  obtenerCuposDashboard,
  obtenerExamenesDashboard,
  obtenerResumenDashboard,
} from '../../../services/dashboard.service'
import { listarUsuarios } from '../../../services/usuarios.service'

function numero(valor) {
  return Number(valor || 0).toLocaleString('es-BO')
}

function PanelDistribucion({ titulo, descripcion, datos }) {
  if (!datos.length) {
    return <EmptyState titulo={titulo} descripcion="El backend no devolvio datos para esta distribucion." />
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-950">{titulo}</h2>
        {descripcion ? <p className="mt-1 text-sm text-slate-500">{descripcion}</p> : null}
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => numero(value)} />
            <Bar dataKey="valor" fill="#0369a1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

export default function DashboardAdministrador() {
  const resumenQuery = useQuery({
    queryKey: ['dashboard', 'resumen'],
    queryFn: () => obtenerResumenDashboard(),
  })

  const asistenciaQuery = useQuery({
    queryKey: ['dashboard', 'asistencia'],
    queryFn: () => obtenerAsistenciaDashboard(),
  })

  const cuposQuery = useQuery({
    queryKey: ['dashboard', 'cupos'],
    queryFn: () => obtenerCuposDashboard(),
  })

  const examenesQuery = useQuery({
    queryKey: ['dashboard', 'examenes'],
    queryFn: () => obtenerExamenesDashboard(),
  })

  const docentesQuery = useQuery({
    queryKey: ['dashboard', 'usuarios', 'docente'],
    queryFn: () => listarUsuarios({ rol: 'docente', por_pagina: 1 }),
  })

  const alumnosQuery = useQuery({
    queryKey: ['dashboard', 'usuarios', 'alumno'],
    queryFn: () => listarUsuarios({ rol: 'alumno', por_pagina: 1 }),
  })

  const cargando = resumenQuery.isLoading || asistenciaQuery.isLoading || cuposQuery.isLoading || examenesQuery.isLoading || docentesQuery.isLoading || alumnosQuery.isLoading
  const error = resumenQuery.error || asistenciaQuery.error || cuposQuery.error || examenesQuery.error || docentesQuery.error || alumnosQuery.error
  const resumen = resumenQuery.data?.resumen_general || {}
  const pagos = resumenQuery.data?.pagos || {}
  const asistencia = asistenciaQuery.data?.asistencia || {}
  const cuposRespuesta = cuposQuery.data?.cupos
  const cupos = useMemo(() => cuposRespuesta || [], [cuposRespuesta])
  const examenes = examenesQuery.data?.examenes || {}
  const totalDocentes = docentesQuery.data?.meta?.total || 0
  const totalAlumnos = alumnosQuery.data?.meta?.total || 0

  const cuposTotales = useMemo(() => cupos.reduce((total, item) => total + Number(item.cupos_por_carrera || 0), 0), [cupos])
  const cuposOcupados = useMemo(() => cupos.reduce((total, item) => total + Number(item.cupos_ocupados || 0), 0), [cupos])
  const cuposDisponibles = useMemo(() => cupos.reduce((total, item) => total + Number(item.cupos_disponibles || 0), 0), [cupos])
  const cuposGrafico = useMemo(() => cupos.slice(0, 8).map((item) => ({
    nombre: item.carrera?.nombre || 'Carrera',
    valor: Number(item.cupos_disponibles || 0),
  })), [cupos])

  const asistenciaGrafico = [
    { nombre: 'Doc. presentes', valor: asistencia.total_asistencias_docentes },
    { nombre: 'Doc. retrasos', valor: asistencia.total_retrasos_docentes },
    { nombre: 'Doc. faltas', valor: asistencia.total_faltas_docentes },
    { nombre: 'Alum. presentes', valor: asistencia.total_asistencias_alumnos },
    { nombre: 'Alum. retrasos', valor: asistencia.total_retrasos_alumnos },
    { nombre: 'Alum. faltas', valor: asistencia.total_faltas_alumnos },
  ].filter((item) => Number(item.valor || 0) > 0)

  const accesosRapidos = [
    { to: '/admin/postulantes', label: 'Postulantes' },
    { to: '/admin/pagos', label: 'Pagos' },
    { to: '/admin/docentes', label: 'Docentes' },
    { to: '/admin/horarios', label: 'Horarios' },
    { to: '/admin/examenes', label: 'Examenes' },
    { to: '/admin/reportes', label: 'Reportes' },
  ]

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Administrador', 'Dashboard']} />
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Panel administrativo</h1>
        <p className="mt-1 text-sm text-slate-600">Resumen general del sistema CUP-FICCT conectado al backend Laravel.</p>
      </div>

      {cargando ? <Loader texto="Cargando indicadores del dashboard..." /> : null}
      {error ? <MensajeError mensaje={error.mensaje || 'No se pudieron cargar los indicadores del dashboard.'} /> : null}

      {!cargando && !error ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <CardIndicador titulo="Total inscritos" valor={numero(resumen.total_inscritos)} descripcion="Postulantes registrados" icono={<GraduationCap className="h-5 w-5" />} />
            <CardIndicador titulo="Total aprobados" valor={numero(resumen.total_aprobados)} descripcion="Promedios finales aprobados" icono={<ClipboardCheck className="h-5 w-5" />} />
            <CardIndicador titulo="Total reprobados" valor={numero(resumen.total_reprobados)} descripcion="Promedios finales reprobados" icono={<BarChart3 className="h-5 w-5" />} />
            <CardIndicador titulo="Grupos habilitados" valor={numero(resumen.total_grupos_habilitados)} descripcion="Grupos activos" icono={<LayoutGrid className="h-5 w-5" />} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <CardIndicador titulo="Pagos pendientes" valor={numero(pagos.total_pagos_pendientes)} descripcion="Stripe pendiente" icono={<CreditCard className="h-5 w-5" />} />
            <CardIndicador titulo="Pagos validados" valor={numero(pagos.total_pagos_validados)} descripcion="Pagados y validados" icono={<CreditCard className="h-5 w-5" />} />
            <CardIndicador titulo="Listos para alumno" valor={numero(pagos.total_postulantes_listos_para_convertirse_en_alumnos)} descripcion="Requisitos y pago completos" icono={<Users className="h-5 w-5" />} />
            <CardIndicador titulo="Examenes habilitados" valor={numero(examenes.examenes_habilitados)} descripcion={`${numero(examenes.examenes_creados)} creados`} icono={<BookOpenCheck className="h-5 w-5" />} />
            <CardIndicador titulo="Docentes" valor={numero(totalDocentes)} descripcion="Usuarios con rol docente" icono={<School className="h-5 w-5" />} />
            <CardIndicador titulo="Alumnos" valor={numero(totalAlumnos)} descripcion="Usuarios con rol alumno" icono={<GraduationCap className="h-5 w-5" />} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <PanelDistribucion titulo="Asistencia" descripcion="Distribucion de presentes, retrasos y faltas." datos={asistenciaGrafico} />
            <PanelDistribucion titulo="Cupos disponibles" descripcion={`Total: ${numero(cuposTotales)} | Ocupados: ${numero(cuposOcupados)} | Disponibles: ${numero(cuposDisponibles)}`} datos={cuposGrafico} />
          </div>

          <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Accesos rapidos</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {accesosRapidos.map((item) => (
                <Link key={item.to} to={item.to} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800">
                  {item.label}
                </Link>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
