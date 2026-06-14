import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  BarChart3,
  BookOpenCheck,
  ClipboardCheck,
  CreditCard,
  Filter,
  GraduationCap,
  LayoutGrid,
  PieChart as PieChartIcon,
  RefreshCw,
  School,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Boton from '../../../components/common/Boton'
import CardIndicador from '../../../components/common/CardIndicador'
import EmptyState from '../../../components/common/EmptyState'
import Input from '../../../components/common/Input'
import Loader from '../../../components/common/Loader'
import MensajeError from '../../../components/common/MensajeError'
import Select from '../../../components/common/Select'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import { listarCarreras } from '../../../services/carreras.service'
import {
  obtenerAsistenciaDashboard,
  obtenerCuposDashboard,
  obtenerExamenesDashboard,
  obtenerResumenDashboard,
} from '../../../services/dashboard.service'
import { listarGestiones } from '../../../services/gestionAcademica.service'
import { listarUsuarios } from '../../../services/usuarios.service'

const coloresGrafico = ['#0369a1', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0f766e', '#be123c', '#4f46e5']
const filtrosIniciales = {
  gestion_academica_id: '',
  carrera_id: '',
  fecha_desde: '',
  fecha_hasta: '',
}

function numero(valor) {
  return Number(valor || 0).toLocaleString('es-BO')
}

function porcentaje(valor) {
  return `${Number(valor || 0).toLocaleString('es-BO', { maximumFractionDigits: 2 })}%`
}

function limpiarParams(filtros) {
  return Object.fromEntries(Object.entries(filtros).filter(([, valor]) => valor !== '' && valor !== null && valor !== undefined))
}

function datosDesdeObjeto(objeto = {}, etiquetas = {}) {
  return Object.entries(objeto)
    .map(([clave, valor]) => ({
      nombre: etiquetas[clave] || clave.replaceAll('_', ' '),
      valor: Number(valor || 0),
    }))
    .filter((item) => item.valor > 0)
}

function etiquetaCarreraGrafico(nombre = 'Carrera') {
  const normalizado = nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

  if (normalizado.includes('redes') && normalizado.includes('telecomunicaciones')) {
    return 'Ingenieria en Redes'
  }

  return nombre
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
      <div className="h-72 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} margin={{ top: 8, right: 12, left: 0, bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="nombre"
              height={58}
              interval={0}
              tick={{ fontSize: 11 }}
              tickLine={false}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={36} />
            <Tooltip formatter={(value) => numero(value)} />
            <Bar dataKey="valor" fill="#0369a1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

function PanelCircular({ titulo, descripcion, datos }) {
  if (!datos.length) {
    return <EmptyState titulo={titulo} descripcion="No hay datos suficientes para este grafico." />
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-950">{titulo}</h2>
        {descripcion ? <p className="mt-1 text-sm text-slate-500">{descripcion}</p> : null}
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={datos} dataKey="valor" nameKey="nombre" innerRadius={54} outerRadius={86} paddingAngle={2}>
              {datos.map((item, index) => <Cell key={item.nombre} fill={coloresGrafico[index % coloresGrafico.length]} />)}
            </Pie>
            <Tooltip formatter={(value) => numero(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

export default function DashboardAdministrador() {
  const [filtros, setFiltros] = useState(filtrosIniciales)
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtrosIniciales)
  const paramsDashboard = useMemo(() => limpiarParams(filtrosAplicados), [filtrosAplicados])

  const resumenQuery = useQuery({
    queryKey: ['dashboard', 'resumen', paramsDashboard],
    queryFn: () => obtenerResumenDashboard(paramsDashboard),
  })

  const asistenciaQuery = useQuery({
    queryKey: ['dashboard', 'asistencia', paramsDashboard],
    queryFn: () => obtenerAsistenciaDashboard(paramsDashboard),
  })

  const cuposQuery = useQuery({
    queryKey: ['dashboard', 'cupos', paramsDashboard],
    queryFn: () => obtenerCuposDashboard(paramsDashboard),
  })

  const examenesQuery = useQuery({
    queryKey: ['dashboard', 'examenes', paramsDashboard],
    queryFn: () => obtenerExamenesDashboard(paramsDashboard),
  })

  const gestionesQuery = useQuery({
    queryKey: ['dashboard', 'gestiones'],
    queryFn: () => listarGestiones({ por_pagina: 100 }),
  })

  const carrerasQuery = useQuery({
    queryKey: ['dashboard', 'carreras'],
    queryFn: () => listarCarreras({ por_pagina: 100, activa: 'true' }),
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
  const postulantesPorEstado = resumenQuery.data?.postulantes_por_estado || {}
  const resultados = resumenQuery.data?.resultados || {}
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
    nombre: etiquetaCarreraGrafico(item.carrera?.nombre || 'Carrera'),
    valor: Number(item.cupos_disponibles || 0),
  })), [cupos])
  const cuposOcupacionGrafico = useMemo(() => cupos.slice(0, 8).map((item) => ({
    nombre: etiquetaCarreraGrafico(item.carrera?.nombre || 'Carrera'),
    valor: Number(item.cupos_ocupados || 0),
  })), [cupos])

  const asistenciaGrafico = [
    { nombre: 'Doc. presentes', valor: asistencia.total_asistencias_docentes },
    { nombre: 'Doc. retrasos', valor: asistencia.total_retrasos_docentes },
    { nombre: 'Doc. faltas', valor: asistencia.total_faltas_docentes },
    { nombre: 'Alum. presentes', valor: asistencia.total_asistencias_alumnos },
    { nombre: 'Alum. retrasos', valor: asistencia.total_retrasos_alumnos },
    { nombre: 'Alum. faltas', valor: asistencia.total_faltas_alumnos },
  ].filter((item) => Number(item.valor || 0) > 0)

  const pagosGrafico = datosDesdeObjeto(pagos.distribucion, {
    pendiente: 'Pendientes',
    pagado: 'Pagados',
    rechazado: 'Rechazados',
    fallido: 'Fallidos',
  })
  const postulantesGrafico = datosDesdeObjeto(postulantesPorEstado, {
    registrado: 'Registrados',
    pendiente_pago: 'Pendiente pago',
    pagado: 'Pagados',
    habilitado_alumno: 'Habilitados alumno',
    rechazado: 'Rechazados',
  })
  const resultadosGrafico = datosDesdeObjeto({
    aprobados: resultados.aprobados,
    reprobados: resultados.reprobados,
  }, {
    aprobados: 'Aprobados',
    reprobados: 'Reprobados',
  })
  const examenesGrafico = datosDesdeObjeto(examenes.distribucion, {
    habilitados: 'Habilitados',
    deshabilitados: 'Deshabilitados',
  })

  const gestiones = gestionesQuery.data || []
  const carreras = carrerasQuery.data || []

  function actualizarFiltro(nombre, valor) {
    setFiltros((actuales) => ({ ...actuales, [nombre]: valor }))
  }

  function aplicarFiltros(event) {
    event.preventDefault()
    setFiltrosAplicados(filtros)
  }

  function reiniciarFiltros() {
    setFiltros(filtrosIniciales)
    setFiltrosAplicados(filtrosIniciales)
  }

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Administrador', 'Dashboard']} />
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Panel administrativo</h1>
        <p className="mt-1 text-sm text-slate-600">Resumen general del sistema CUP-FICCT conectado al backend Laravel.</p>
      </div>

      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <form className="grid gap-3 xl:grid-cols-[1fr_1fr_180px_180px_auto_auto]" onSubmit={aplicarFiltros}>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span>Gestion</span>
            <Select value={filtros.gestion_academica_id} onChange={(event) => actualizarFiltro('gestion_academica_id', event.target.value)}>
              <option value="">Todas</option>
              {gestiones.map((gestion) => (
                <option key={gestion.id} value={gestion.id}>{gestion.nombre}</option>
              ))}
            </Select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span>Carrera</span>
            <Select value={filtros.carrera_id} onChange={(event) => actualizarFiltro('carrera_id', event.target.value)}>
              <option value="">Todas</option>
              {carreras.map((carrera) => (
                <option key={carrera.id} value={carrera.id}>{carrera.codigo ? `${carrera.codigo} - ${carrera.nombre}` : carrera.nombre}</option>
              ))}
            </Select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span>Desde</span>
            <Input type="date" value={filtros.fecha_desde} onChange={(event) => actualizarFiltro('fecha_desde', event.target.value)} />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span>Hasta</span>
            <Input type="date" value={filtros.fecha_hasta} onChange={(event) => actualizarFiltro('fecha_hasta', event.target.value)} />
          </label>
          <div className="flex items-end">
            <Boton type="submit" className="w-full">
              <Filter className="h-4 w-4" />
              Filtrar
            </Boton>
          </div>
          <div className="flex items-end">
            <Boton type="button" variante="secundario" className="w-full" onClick={reiniciarFiltros}>
              <RefreshCw className="h-4 w-4" />
              Limpiar
            </Boton>
          </div>
        </form>
      </section>

      {cargando ? <Loader texto="Cargando indicadores del dashboard..." /> : null}
      {error ? <MensajeError mensaje={error.mensaje || 'No se pudieron cargar los indicadores del dashboard.'} /> : null}
      {gestionesQuery.error ? <MensajeError mensaje="No se pudieron cargar las gestiones para el filtro." /> : null}
      {carrerasQuery.error ? <MensajeError mensaje="No se pudieron cargar las carreras para el filtro." /> : null}

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

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <CardIndicador titulo="Cupos totales" valor={numero(cuposTotales)} descripcion="Segun filtros aplicados" icono={<LayoutGrid className="h-5 w-5" />} />
            <CardIndicador titulo="Cupos ocupados" valor={numero(cuposOcupados)} descripcion="Asignados a aprobados" icono={<Users className="h-5 w-5" />} />
            <CardIndicador titulo="Cupos disponibles" valor={numero(cuposDisponibles)} descripcion="Capacidad restante" icono={<TrendingUp className="h-5 w-5" />} />
            <CardIndicador titulo="Pagos fallidos" valor={numero(pagos.total_pagos_fallidos)} descripcion="Transacciones con error" icono={<AlertTriangle className="h-5 w-5" />} />
            <CardIndicador titulo="Alumnos que rindieron" valor={numero(examenes.alumnos_que_rindieron)} descripcion="Con intento registrado" icono={<BookOpenCheck className="h-5 w-5" />} />
            <CardIndicador titulo="Alumnos pendientes" valor={numero(examenes.alumnos_pendientes)} descripcion="Sin rendir examenes habilitados" icono={<Users className="h-5 w-5" />} />
            <CardIndicador titulo="Aprobacion" valor={porcentaje(resultados.porcentaje_aprobacion)} descripcion={`${numero(resultados.aprobados)} aprobados`} icono={<PieChartIcon className="h-5 w-5" />} />
            <CardIndicador titulo="Reprobacion" valor={porcentaje(resultados.porcentaje_reprobacion)} descripcion={`${numero(resultados.reprobados)} reprobados`} icono={<BarChart3 className="h-5 w-5" />} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <PanelDistribucion titulo="Asistencia" descripcion="Distribucion de presentes, retrasos y faltas." datos={asistenciaGrafico} />
            <PanelDistribucion titulo="Cupos disponibles" descripcion={`Total: ${numero(cuposTotales)} | Ocupados: ${numero(cuposOcupados)} | Disponibles: ${numero(cuposDisponibles)}`} datos={cuposGrafico} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <PanelCircular titulo="Pagos por estado" descripcion="Distribucion del estado de pagos registrados." datos={pagosGrafico} />
            <PanelCircular titulo="Resultados finales" descripcion="Relacion de aprobados y reprobados." datos={resultadosGrafico} />
            <PanelDistribucion titulo="Postulantes por estado" descripcion="Seguimiento del flujo de postulacion." datos={postulantesGrafico} />
            <PanelDistribucion titulo="Cupos ocupados por carrera" descripcion="Ocupacion de cupos segun carreras filtradas." datos={cuposOcupacionGrafico} />
            <PanelCircular titulo="Examenes por estado" descripcion="Examenes habilitados frente a deshabilitados." datos={examenesGrafico} />
          </div>
        </>
      ) : null}
    </div>
  )
}
