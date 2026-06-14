import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { BarChart3, Download, FileSpreadsheet, FileText, Mic, MicOff, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import BadgeEstado from '../../../components/common/BadgeEstado'
import Boton from '../../../components/common/Boton'
import EmptyState from '../../../components/common/EmptyState'
import Input from '../../../components/common/Input'
import MensajeError from '../../../components/common/MensajeError'
import Select from '../../../components/common/Select'
import TablaBase from '../../../components/tables/TablaBase'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import { useComandoVoz } from '../../../hooks/useComandoVoz'
import { obtenerMensajeError } from '../../../lib/errores'
import { listarDocentes } from '../../../services/docentes.service'
import { listarGestiones } from '../../../services/gestionAcademica.service'
import { listarGrupos } from '../../../services/grupos.service'
import {
  exportarReporte,
  generarReportePorComandoVoz,
  reporteAprobados,
  reporteAsistenciaAlumnos,
  reporteAsistenciaDocentes,
  reporteDocentesGrupos,
  reporteEstadisticasMateria,
  reporteGrupos,
  reporteGruposMayorAprobados,
  reportePostulantes,
  reportePromedios,
  reporteReprobados,
} from '../../../services/reportes.service'

const reportes = [
  { tipo: 'postulantes', titulo: 'Lista general de postulantes', categoria: 'Academicos', descripcion: 'Postulantes registrados, estados, carreras y gestion.', servicio: reportePostulantes, filtros: ['gestion', 'estado_postulante'], campoGrafico: 'postulante_id' },
  { tipo: 'aprobados', titulo: 'Postulantes aprobados', categoria: 'Academicos', descripcion: 'Alumnos aprobados por promedio final.', servicio: reporteAprobados, filtros: ['gestion'], campoGrafico: 'promedio' },
  { tipo: 'reprobados', titulo: 'Postulantes reprobados', categoria: 'Academicos', descripcion: 'Alumnos reprobados por promedio final.', servicio: reporteReprobados, filtros: ['gestion'], campoGrafico: 'promedio' },
  { tipo: 'promedios', titulo: 'Promedios generales', categoria: 'Academicos', descripcion: 'Notas parciales, promedio y estado final.', servicio: reportePromedios, filtros: ['gestion'], campoGrafico: 'promedio' },
  { tipo: 'grupos', titulo: 'Cantidad de grupos habilitados', categoria: 'Grupos', descripcion: 'Grupos, cupos y cantidad de alumnos.', servicio: reporteGrupos, filtros: ['gestion', 'activo'], campoGrafico: 'cantidad_alumnos' },
  { tipo: 'estadisticas-materia', titulo: 'Estadisticas por materia', categoria: 'Academicos', descripcion: 'Promedios, minimos, maximos y aprobados por materia.', servicio: reporteEstadisticasMateria, filtros: ['gestion'], campoGrafico: 'promedio_materia' },
  { tipo: 'docentes-grupos', titulo: 'Docentes por grupos', categoria: 'Grupos', descripcion: 'Docentes asignados a materias, grupos y horarios.', servicio: reporteDocentesGrupos, filtros: ['gestion', 'docente'], campoGrafico: 'asignacion_id' },
  { tipo: 'grupos-mayor-aprobados', titulo: 'Grupos con mayor cantidad de aprobados', categoria: 'Grupos', descripcion: 'Ranking de grupos por cantidad de aprobados.', servicio: reporteGruposMayorAprobados, filtros: ['gestion'], campoGrafico: 'cantidad_aprobados' },
  { tipo: 'asistencia-docentes', titulo: 'Asistencia de docentes', categoria: 'Asistencia', descripcion: 'Presentes, retrasos, faltas y pendientes docentes.', servicio: reporteAsistenciaDocentes, filtros: ['gestion', 'docente', 'fechas'], campoGrafico: 'presentes' },
  { tipo: 'asistencia-alumnos', titulo: 'Asistencia de alumnos', categoria: 'Asistencia', descripcion: 'Presentes, retrasos, faltas y pendientes de alumnos.', servicio: reporteAsistenciaAlumnos, filtros: ['gestion', 'grupo', 'fechas'], campoGrafico: 'presentes' },
]

function nombrePersona(persona) {
  return [persona?.nombres, persona?.apellido_paterno, persona?.apellido_materno].filter(Boolean).join(' ') || 'Sin nombre'
}

function nombreGestion(gestion) {
  return gestion?.nombre || `${gestion?.anio || ''}-${gestion?.numero_gestion || ''}` || 'Sin gestion'
}

function aTexto(valor) {
  if (valor === null || valor === undefined || valor === '') return '-'
  if (typeof valor === 'boolean') return valor ? 'Si' : 'No'
  if (Array.isArray(valor)) return valor.length ? `${valor.length} item(s)` : '-'
  if (typeof valor === 'object') {
    if ('nombre' in valor) return valor.nombre
    if ('nombres' in valor) return nombrePersona(valor)
    return Object.values(valor).filter(Boolean).join(' ')
  }
  return String(valor)
}

function etiquetaColumna(clave) {
  return clave.replaceAll('_', ' ').replaceAll('.', ' ')
}

function normalizarFilas(datos) {
  return Array.isArray(datos) ? datos : []
}

function valorGrafico(fila, campo) {
  const valor = Number(fila?.[campo])
  return Number.isFinite(valor) ? valor : 0
}

function nombreFila(fila) {
  return fila.materia || fila.grupo || fila.nombre || fila.codigo_alumno || fila.ci || fila.docente?.apellido_paterno || fila.alumno?.apellido_paterno || fila.nombres || String(fila.id || '-')
}

function extraerFilas(respuesta) {
  return normalizarFilas(respuesta?.datos?.datos || respuesta?.datos || respuesta)
}

function filtrosParaBackend(filtros, reporte) {
  const params = { por_pagina: 100 }

  if (reporte.filtros.includes('gestion') && filtros.gestion_academica_id) params.gestion_academica_id = filtros.gestion_academica_id
  if (reporte.filtros.includes('estado_postulante') && filtros.estado_postulante) params.estado_postulante = filtros.estado_postulante
  if (reporte.filtros.includes('activo') && filtros.activo) params.activo = filtros.activo
  if (reporte.filtros.includes('docente') && filtros.docente_id) params.docente_id = filtros.docente_id
  if (reporte.filtros.includes('grupo') && filtros.grupo_id) params.grupo_id = filtros.grupo_id
  if (reporte.filtros.includes('fechas')) {
    if (filtros.fecha_desde) params.fecha_desde = filtros.fecha_desde
    if (filtros.fecha_hasta) params.fecha_hasta = filtros.fecha_hasta
  }

  return params
}

function MenuReportes({ seleccionado, onSeleccionar }) {
  const categorias = ['Academicos', 'Asistencia', 'Grupos', 'Pagos']

  return (
    <div className="grid gap-4">
      {categorias.map((categoria) => {
        const items = reportes.filter((reporte) => reporte.categoria === categoria)
        if (!items.length) {
          return (
            <section key={categoria} className="grid gap-2">
              <h2 className="text-sm font-bold uppercase text-slate-500">{categoria}</h2>
              <div className="rounded-md border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">Sin reportes obligatorios definidos para esta categoria.</div>
            </section>
          )
        }

        return (
          <section key={categoria} className="grid gap-2">
            <h2 className="text-sm font-bold uppercase text-slate-500">{categoria}</h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {items.map((reporte) => (
                <button
                  key={reporte.tipo}
                  type="button"
                  onClick={() => onSeleccionar(reporte.tipo)}
                  className={`min-h-28 rounded-md border bg-white p-4 text-left transition hover:border-sky-300 hover:shadow-sm ${seleccionado === reporte.tipo ? 'border-sky-600 ring-2 ring-sky-100' : 'border-slate-200'}`}
                >
                  <p className="font-semibold text-slate-950">{reporte.titulo}</p>
                  <p className="mt-1 text-sm text-slate-600">{reporte.descripcion}</p>
                </button>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function FiltrosReportes({ reporte, filtros, gestiones, docentes, grupos, onCambiar, onEnviar }) {
  return (
    <form onSubmit={onEnviar} className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 lg:grid-cols-4">
      {reporte.filtros.includes('gestion') ? (
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Gestion
          <Select value={filtros.gestion_academica_id} onChange={(evento) => onCambiar('gestion_academica_id', evento.target.value)}>
            <option value="">Todas</option>
            {gestiones.map((gestion) => <option key={gestion.id} value={gestion.id}>{nombreGestion(gestion)}</option>)}
          </Select>
        </label>
      ) : null}

      {reporte.filtros.includes('estado_postulante') ? (
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Estado
          <Select value={filtros.estado_postulante} onChange={(evento) => onCambiar('estado_postulante', evento.target.value)}>
            <option value="">Todos</option>
            <option value="registrado">Registrado</option>
            <option value="pendiente_pago">Pendiente pago</option>
            <option value="pagado">Pagado</option>
            <option value="habilitado_alumno">Habilitado alumno</option>
            <option value="rechazado">Rechazado</option>
          </Select>
        </label>
      ) : null}

      {reporte.filtros.includes('activo') ? (
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Activo
          <Select value={filtros.activo} onChange={(evento) => onCambiar('activo', evento.target.value)}>
            <option value="">Todos</option>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </Select>
        </label>
      ) : null}

      {reporte.filtros.includes('docente') ? (
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Docente
          <Select value={filtros.docente_id} onChange={(evento) => onCambiar('docente_id', evento.target.value)}>
            <option value="">Todos</option>
            {docentes.map((docente) => <option key={docente.id} value={docente.id}>{nombrePersona(docente.persona || docente)}</option>)}
          </Select>
        </label>
      ) : null}

      {reporte.filtros.includes('grupo') ? (
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Grupo
          <Select value={filtros.grupo_id} onChange={(evento) => onCambiar('grupo_id', evento.target.value)}>
            <option value="">Todos</option>
            {grupos.map((grupo) => <option key={grupo.id} value={grupo.id}>{grupo.nombre}</option>)}
          </Select>
        </label>
      ) : null}

      {reporte.filtros.includes('fechas') ? (
        <>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Desde
            <Input type="date" value={filtros.fecha_desde} onChange={(evento) => onCambiar('fecha_desde', evento.target.value)} />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Hasta
            <Input type="date" value={filtros.fecha_hasta} onChange={(evento) => onCambiar('fecha_hasta', evento.target.value)} />
          </label>
        </>
      ) : null}

      <div className="flex items-end">
        <Boton type="submit" className="w-full">
          <Search className="h-4 w-4" />
          Aplicar
        </Boton>
      </div>
    </form>
  )
}

function TablaReporte({ filas, cargando }) {
  const columnas = useMemo(() => {
    const primera = filas[0]
    if (!primera) return []

    return Object.keys(primera).slice(0, 8).map((clave) => ({
      header: etiquetaColumna(clave),
      cell: ({ row }) => {
        const valor = row.original[clave]
        const textoValor = aTexto(valor)
        if (['estado', 'estado_final', 'estado_pago', 'estado_requisitos'].includes(clave)) return <BadgeEstado estado={textoValor} />
        return textoValor
      },
    }))
  }, [filas])

  return (
    <TablaBase
      columnas={columnas}
      datos={filas}
      cargando={cargando}
      mensajeVacio="No existen datos para el reporte con los filtros seleccionados."
    />
  )
}

function GraficoReporte({ reporte, filas }) {
  const datos = filas
    .map((fila) => ({ nombre: nombreFila(fila), valor: valorGrafico(fila, reporte.campoGrafico) }))
    .filter((item) => item.valor > 0)
    .slice(0, 10)

  if (!datos.length) return <EmptyState descripcion="No hay datos numericos suficientes para graficar este reporte." />

  return (
    <div className="h-72 min-h-72 min-w-0 overflow-hidden rounded-md border border-slate-200 bg-white p-4">
      <div className="h-60 min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={datos} margin={{ top: 8, right: 12, left: 0, bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="valor" fill="var(--theme-strong)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function PanelComandoVoz({ filtros, onReporteReconocido, onError }) {
  const comandoVoz = useComandoVoz()
  const [formato, setFormato] = useState('')
  const [ultimoResultado, setUltimoResultado] = useState(null)

  const comandoMutation = useMutation({
    mutationFn: () => generarReportePorComandoVoz({
      texto: comandoVoz.texto,
      formato: formato || undefined,
      filtros: {
        ...filtros,
        por_pagina: 100,
      },
    }),
    onSuccess: (respuesta) => {
      setUltimoResultado(respuesta)
      onReporteReconocido(respuesta)
      toast.success('Comando de voz interpretado correctamente.')
    },
    onError: (error) => {
      onError(error)
    },
  })

  const puedeEnviar = comandoVoz.texto.trim().length > 0
  const comandosPermitidos = ultimoResultado?.comandos_permitidos || [
    'listar alumnos aprobados',
    'listar alumnos reprobados',
    'listar alumnos reprobados y aprobados',
    'listar postulantes',
    'listar grupos habilitados',
    'listar asistencia docentes',
    'listar asistencia alumnos',
    'listar promedios generales',
  ]

  return (
    <section className="grid gap-3 rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Comando de voz</h2>
          <p className="mt-1 text-sm text-slate-600">Web Speech API convierte voz a texto; Laravel interpreta el reporte solicitado.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Boton
            variante={comandoVoz.escuchando ? 'peligro' : 'secundario'}
            onClick={comandoVoz.escuchando ? comandoVoz.detener : comandoVoz.iniciar}
            disabled={!comandoVoz.compatible}
          >
            {comandoVoz.escuchando ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {comandoVoz.escuchando ? 'Detener' : 'Microfono'}
          </Boton>
          <Boton variante="neutro" onClick={comandoVoz.limpiar} disabled={!comandoVoz.texto}>
            <X className="h-4 w-4" />
            Limpiar
          </Boton>
        </div>
      </div>

      {!comandoVoz.compatible ? <MensajeError mensaje="Este navegador no soporta Web Speech API." /> : null}
      {comandoVoz.error ? <MensajeError mensaje={comandoVoz.error} /> : null}

      <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Texto reconocido
          <Input value={comandoVoz.texto} onChange={(evento) => comandoVoz.setTexto(evento.target.value)} placeholder="Ejemplo: listar alumnos reprobados y aprobados" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Formato
          <Select value={formato} onChange={(evento) => setFormato(evento.target.value)}>
            <option value="">Ver reporte</option>
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
          </Select>
        </label>
        <div className="flex items-end">
          <Boton onClick={() => comandoMutation.mutate()} disabled={!puedeEnviar} cargando={comandoMutation.isPending} className="w-full">
            <Search className="h-4 w-4" />
            Interpretar
          </Boton>
        </div>
      </div>

      <div className="rounded-md bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase text-slate-500">Comandos permitidos por backend</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {comandosPermitidos.map((comando) => (
            <button
              key={comando}
              type="button"
              onClick={() => comandoVoz.setTexto(comando)}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:border-sky-300"
            >
              {comando}
            </button>
          ))}
        </div>
      </div>

      {ultimoResultado?.exportacion?.archivo?.url ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <p className="font-semibold">Exportacion generada por comando de voz</p>
          <a className="mt-1 inline-flex items-center gap-2 underline" href={ultimoResultado.exportacion.archivo.url} target="_blank" rel="noreferrer">
            <Download className="h-4 w-4" />
            {ultimoResultado.exportacion.archivo.nombre}
          </a>
        </div>
      ) : null}
    </section>
  )
}

export default function ReportesAdministrativos() {
  const [tipoReporte, setTipoReporte] = useState('postulantes')
  const [filtros, setFiltros] = useState({
    gestion_academica_id: '',
    estado_postulante: '',
    activo: '',
    docente_id: '',
    grupo_id: '',
    fecha_desde: '',
    fecha_hasta: '',
  })
  const [params, setParams] = useState({ por_pagina: 100 })
  const [ultimaExportacion, setUltimaExportacion] = useState(null)
  const [resultadoVoz, setResultadoVoz] = useState(null)
  const [errorVoz, setErrorVoz] = useState(null)

  const reporte = reportes.find((item) => item.tipo === tipoReporte) || reportes[0]

  const gestionesQuery = useQuery({ queryKey: ['gestiones-academicas', 'reportes'], queryFn: () => listarGestiones({ por_pagina: 100 }) })
  const docentesQuery = useQuery({ queryKey: ['docentes', 'reportes'], queryFn: () => listarDocentes({ activo: 'true', por_pagina: 100 }) })
  const gruposQuery = useQuery({ queryKey: ['grupos', 'reportes'], queryFn: () => listarGrupos({ activo: 'true', por_pagina: 100 }) })

  const reporteQuery = useQuery({
    queryKey: ['reportes', tipoReporte, params],
    queryFn: () => reporte.servicio(params),
  })

  const exportarMutation = useMutation({
    mutationFn: (formato) => exportarReporte(tipoReporte, filtrosParaBackend(filtros, reporte), formato),
    onSuccess: (respuesta) => {
      setUltimaExportacion(respuesta)
      if (respuesta?.guardado === false) {
        toast.info('Reporte generado. Guardado cancelado por el usuario.')
        return
      }
      toast.success(`Reporte exportado en ${respuesta?.formato || 'formato solicitado'}.`)
    },
  })

  const filas = resultadoVoz ? extraerFilas(resultadoVoz.datos) : extraerFilas(reporteQuery.data)
  const total = resultadoVoz?.datos?.meta?.total ?? reporteQuery.data?.meta?.total ?? filas.length
  const gestiones = gestionesQuery.data || []
  const docentes = docentesQuery.data?.datos || []
  const grupos = gruposQuery.data?.datos || []
  const error = reporteQuery.error || gestionesQuery.error || docentesQuery.error || gruposQuery.error

  function seleccionarReporte(tipo) {
    setTipoReporte(tipo)
    setUltimaExportacion(null)
    setResultadoVoz(null)
    setErrorVoz(null)
  }

  function cambiarFiltro(nombre, valor) {
    setFiltros((actuales) => ({ ...actuales, [nombre]: valor }))
  }

  function aplicarFiltros(evento) {
    evento.preventDefault()
    setUltimaExportacion(null)
    setResultadoVoz(null)
    setErrorVoz(null)
    setParams(filtrosParaBackend(filtros, reporte))
  }

  function aplicarReporteVoz(respuesta) {
    const tipo = respuesta?.tipo_reporte
    const reporteReconocido = reportes.find((item) => item.tipo === tipo)

    if (reporteReconocido) {
      setTipoReporte(tipo)
      setParams(filtrosParaBackend(filtros, reporteReconocido))
    }

    setErrorVoz(null)
    setResultadoVoz(respuesta?.datos ? respuesta : null)

    if (respuesta?.exportacion) {
      setUltimaExportacion(respuesta.exportacion)
      setResultadoVoz(null)
    }
  }

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Administrador', 'Reportes']} />
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Reportes administrativos</h1>
        <p className="mt-1 text-sm text-slate-600">Reportes obligatorios del sistema CUP-FICCT consumidos desde Laravel.</p>
      </div>

      <MenuReportes seleccionado={tipoReporte} onSeleccionar={seleccionarReporte} />

      {error ? <MensajeError mensaje={obtenerMensajeError(error)} /> : null}
      {errorVoz ? <MensajeError mensaje={obtenerMensajeError(errorVoz)} /> : null}
      {exportarMutation.error ? <MensajeError mensaje={obtenerMensajeError(exportarMutation.error)} /> : null}

      <PanelComandoVoz
        filtros={params}
        onReporteReconocido={aplicarReporteVoz}
        onError={setErrorVoz}
      />

      <section className="grid gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">{reporte.titulo}</h2>
            <p className="mt-1 text-sm text-slate-600">{reporte.descripcion}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Boton variante="secundario" cargando={exportarMutation.isPending} onClick={() => exportarMutation.mutate('pdf')}>
              <FileText className="h-4 w-4" />
              PDF
            </Boton>
            <Boton variante="secundario" cargando={exportarMutation.isPending} onClick={() => exportarMutation.mutate('excel')}>
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Boton>
          </div>
        </div>

        <FiltrosReportes
          reporte={reporte}
          filtros={filtros}
          gestiones={gestiones}
          docentes={docentes}
          grupos={grupos}
          onCambiar={cambiarFiltro}
          onEnviar={aplicarFiltros}
        />

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Registros</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{total}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Categoria</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{reporte.categoria}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Exportacion</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{ultimaExportacion?.archivo?.nombre || 'Sin exportacion reciente'}</p>
          </div>
        </div>

        {resultadoVoz ? (
          <div className="rounded-md border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
            <p className="font-semibold">Reporte generado por comando de voz</p>
            <p className="mt-1">Intencion detectada: {resultadoVoz.tipo_reporte}</p>
          </div>
        ) : null}

        <div className="grid gap-3">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-950">
            <BarChart3 className="h-5 w-5 text-sky-700" />
            Visualizacion
          </h3>
          <GraficoReporte reporte={reporte} filas={filas} />
        </div>

        <TablaReporte filas={filas} cargando={reporteQuery.isLoading} />

        {ultimaExportacion?.archivo?.url ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <p className="font-semibold">Archivo generado por backend</p>
            <a className="mt-1 inline-flex items-center gap-2 underline" href={ultimaExportacion.archivo.url} target="_blank" rel="noreferrer">
              <Download className="h-4 w-4" />
              {ultimaExportacion.archivo.nombre}
            </a>
          </div>
        ) : null}
      </section>
    </div>
  )
}
