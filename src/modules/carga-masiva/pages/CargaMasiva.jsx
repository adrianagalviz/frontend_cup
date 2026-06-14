import { useCallback, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, FileSpreadsheet, FileText, RefreshCw, Search, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import BadgeEstado from '../../../components/common/BadgeEstado'
import Boton from '../../../components/common/Boton'
import MensajeError from '../../../components/common/MensajeError'
import Select from '../../../components/common/Select'
import TablaBase from '../../../components/tables/TablaBase'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import { obtenerMensajeError } from '../../../lib/errores'
import { cargarCsv, cargarExcel, listarCargasMasivas, verDetalleCargaMasiva } from '../../../services/cargaMasiva.service'

const extensionesPermitidas = ['csv', 'txt', 'xls', 'xlsx']
const extensionesCsv = ['csv', 'txt']
const estadosCarga = ['procesando', 'finalizado', 'con_errores', 'fallido']

function extensionArchivo(archivo) {
  return archivo?.name?.split('.').pop()?.toLowerCase() || ''
}

function formatoPorExtension(extension) {
  if (extensionesCsv.includes(extension)) return 'csv'
  if (['xls', 'xlsx'].includes(extension)) return 'excel'
  return ''
}

function esArchivoValido(archivo) {
  return extensionesPermitidas.includes(extensionArchivo(archivo))
}

function normalizarListado(respuesta) {
  if (Array.isArray(respuesta)) return respuesta
  if (Array.isArray(respuesta?.datos)) return respuesta.datos
  return []
}

function normalizarDetalleCarga(respuesta) {
  return respuesta?.carga || respuesta?.datos?.carga || null
}

function numero(valor) {
  const convertido = Number(valor)
  return Number.isFinite(convertido) ? convertido : 0
}

function fechaLegible(valor) {
  if (!valor) return '-'
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return valor
  return fecha.toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' })
}

function textoDatosFila(datos) {
  if (!datos) return '-'
  if (typeof datos === 'string') return datos
  return Object.entries(datos)
    .map(([clave, valor]) => `${clave}: ${valor ?? '-'}`)
    .join(' | ')
}

function ResumenCarga({ carga }) {
  const total = numero(carga?.total_registros)
  const exitosos = numero(carga?.registros_exitosos)
  const errores = numero(carga?.registros_error)

  return (
    <div className="grid gap-3 md:grid-cols-4">
      <div className="rounded-md border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium uppercase text-slate-500">Total procesado</p>
        <p className="mt-1 text-2xl font-bold text-slate-950">{total}</p>
      </div>
      <div className="rounded-md border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium uppercase text-slate-500">Registros validos</p>
        <p className="mt-1 text-2xl font-bold text-emerald-700">{exitosos}</p>
      </div>
      <div className="rounded-md border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium uppercase text-slate-500">Registros con error</p>
        <p className="mt-1 text-2xl font-bold text-red-700">{errores}</p>
      </div>
      <div className="rounded-md border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium uppercase text-slate-500">Estado</p>
        <div className="mt-2">
          <BadgeEstado estado={carga?.estado} />
        </div>
      </div>
    </div>
  )
}

function PanelArchivo({ archivo, errorArchivo, cargando, onArchivo, onLimpiar, onEnviar }) {
  const inputRef = useRef(null)
  const extension = extensionArchivo(archivo)
  const formato = formatoPorExtension(extension)

  function seleccionarArchivo(evento) {
    const seleccionado = evento.target.files?.[0] || null
    onArchivo(seleccionado)
  }

  return (
    <form onSubmit={onEnviar} className="grid gap-4 rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Archivo Excel o CSV</h2>
          <p className="mt-1 text-sm text-slate-600">El backend recibe archivos .csv, .txt, .xls o .xlsx y procesa la carga masiva de usuarios.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Boton variante="secundario" onClick={() => inputRef.current?.click()} disabled={cargando}>
            <Upload className="h-4 w-4" />
            {archivo ? 'Reemplazar' : 'Seleccionar'}
          </Boton>
          <Boton variante="neutro" onClick={onLimpiar} disabled={!archivo || cargando}>
            <X className="h-4 w-4" />
            Quitar
          </Boton>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.txt,.xls,.xlsx"
        className="hidden"
        onChange={seleccionarArchivo}
      />

      <div className="grid gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 md:grid-cols-[auto_1fr_auto] md:items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white text-sky-700 ring-1 ring-slate-200">
          {formato === 'excel' ? <FileSpreadsheet className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
        </div>
        <div>
          <p className="font-semibold text-slate-950">{archivo?.name || 'Ningun archivo seleccionado'}</p>
          <p className="mt-1 text-sm text-slate-600">
            {archivo ? `Formato detectado: ${formato || 'no valido'} | Extension: .${extension}` : 'Selecciona un archivo antes de enviarlo al backend.'}
          </p>
        </div>
        <Boton type="submit" cargando={cargando} disabled={!archivo || Boolean(errorArchivo)} className="w-full md:w-auto">
          <Upload className="h-4 w-4" />
          Subir archivo
        </Boton>
      </div>

      <div className="grid gap-1 text-sm font-medium text-slate-700 md:max-w-xs">
        Tipo de carga
        <Select value="usuarios" disabled>
          <option value="usuarios">Usuarios</option>
        </Select>
      </div>

      {errorArchivo ? <MensajeError mensaje={errorArchivo} /> : null}
    </form>
  )
}

function FiltrosCargas({ filtros, onCambiar, onEnviar, onLimpiar }) {
  return (
    <form onSubmit={onEnviar} className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_1fr_1fr_auto_auto]">
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Formato
        <Select value={filtros.formato_archivo} onChange={(evento) => onCambiar('formato_archivo', evento.target.value)}>
          <option value="">Todos</option>
          <option value="csv">CSV</option>
          <option value="excel">Excel</option>
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Estado
        <Select value={filtros.estado} onChange={(evento) => onCambiar('estado', evento.target.value)}>
          <option value="">Todos</option>
          {estadosCarga.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Tipo
        <Select value={filtros.tipo_carga} onChange={(evento) => onCambiar('tipo_carga', evento.target.value)}>
          <option value="">Todos</option>
          <option value="usuarios">Usuarios</option>
        </Select>
      </label>
      <div className="flex items-end">
        <Boton type="submit" className="w-full">
          <Search className="h-4 w-4" />
          Filtrar
        </Boton>
      </div>
      <div className="flex items-end">
        <Boton variante="neutro" onClick={onLimpiar} className="w-full">
          <RefreshCw className="h-4 w-4" />
          Limpiar
        </Boton>
      </div>
    </form>
  )
}

export default function CargaMasiva() {
  const queryClient = useQueryClient()
  const resultadoRef = useRef(null)
  const [archivo, setArchivo] = useState(null)
  const [errorArchivo, setErrorArchivo] = useState('')
  const [filtros, setFiltros] = useState({ formato_archivo: '', estado: '', tipo_carga: '' })
  const [params, setParams] = useState({ por_pagina: 100 })
  const [cargaSeleccionadaId, setCargaSeleccionadaId] = useState(null)

  const cargasQuery = useQuery({
    queryKey: ['cargas-masivas', params],
    queryFn: () => listarCargasMasivas(params),
  })

  const detalleQuery = useQuery({
    queryKey: ['carga-masiva-detalle', cargaSeleccionadaId],
    queryFn: () => verDetalleCargaMasiva(cargaSeleccionadaId),
    enabled: Boolean(cargaSeleccionadaId),
  })

  const subirMutation = useMutation({
    mutationFn: ({ archivoSeleccionado, formato }) => {
      const formData = new FormData()
      formData.append('archivo', archivoSeleccionado)
      formData.append('tipo_carga', 'usuarios')
      return formato === 'excel' ? cargarExcel(formData) : cargarCsv(formData)
    },
    onSuccess: (respuesta) => {
      const carga = respuesta?.carga
      toast.success('Archivo enviado al backend correctamente.')
      setArchivo(null)
      setErrorArchivo('')
      if (carga?.id) setCargaSeleccionadaId(carga.id)
      queryClient.invalidateQueries({ queryKey: ['cargas-masivas'] })
    },
  })

  const cargas = normalizarListado(cargasQuery.data)
  const detalle = normalizarDetalleCarga(detalleQuery.data)
  const detalles = Array.isArray(detalle?.detalles) ? detalle.detalles : []

  const verDetalle = useCallback((carga) => {
    if (!carga?.id) return

    setCargaSeleccionadaId(carga.id)
    queryClient.invalidateQueries({ queryKey: ['carga-masiva-detalle', carga.id] })

    window.setTimeout(() => {
      resultadoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }, [queryClient])

  const columnasCargas = useMemo(() => [
    {
      header: 'Archivo',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-950">{row.original.nombre_archivo || '-'}</p>
          <p className="text-xs text-slate-500">{row.original.tipo_carga || 'usuarios'} | {row.original.formato_archivo || '-'}</p>
        </div>
      ),
    },
    {
      header: 'Procesados',
      cell: ({ row }) => `${numero(row.original.registros_exitosos)} validos / ${numero(row.original.registros_error)} errores`,
    },
    {
      header: 'Total',
      cell: ({ row }) => numero(row.original.total_registros),
    },
    {
      header: 'Estado',
      cell: ({ row }) => <BadgeEstado estado={row.original.estado} />,
    },
    {
      header: 'Creado',
      cell: ({ row }) => fechaLegible(row.original.creado_en),
    },
    {
      header: 'Acciones',
      cell: ({ row }) => (
        <Boton
          variante={cargaSeleccionadaId === row.original.id ? 'primario' : 'secundario'}
          cargando={detalleQuery.isFetching && cargaSeleccionadaId === row.original.id}
          onClick={() => verDetalle(row.original)}
          aria-label={`Ver detalle de ${row.original.nombre_archivo || 'la carga seleccionada'}`}
        >
          <Eye className="h-4 w-4" />
          {cargaSeleccionadaId === row.original.id ? 'Viendo' : 'Detalle'}
        </Boton>
      ),
    },
  ], [cargaSeleccionadaId, detalleQuery.isFetching, verDetalle])

  const columnasDetalle = useMemo(() => [
    {
      header: 'Fila',
      cell: ({ row }) => row.original.numero_fila || '-',
    },
    {
      header: 'Estado',
      cell: ({ row }) => <BadgeEstado estado={row.original.estado} />,
    },
    {
      header: 'Mensaje',
      cell: ({ row }) => row.original.mensaje_error || 'Registro procesado correctamente.',
    },
    {
      header: 'Datos de fila',
      cell: ({ row }) => (
        <div className="max-h-24 max-w-3xl overflow-auto rounded border border-slate-200 bg-slate-50 px-3 py-2">
          <span className="block min-w-max whitespace-nowrap font-mono text-xs leading-5 text-slate-700">
            {textoDatosFila(row.original.datos_fila)}
          </span>
        </div>
      ),
    },
  ], [])

  function cambiarArchivo(seleccionado) {
    setArchivo(seleccionado)

    if (!seleccionado) {
      setErrorArchivo('')
      return
    }

    setErrorArchivo(esArchivoValido(seleccionado) ? '' : 'Solo se permiten archivos CSV, TXT, XLS o XLSX.')
  }

  function limpiarArchivo() {
    setArchivo(null)
    setErrorArchivo('')
  }

  function enviarArchivo(evento) {
    evento.preventDefault()

    if (!archivo) {
      setErrorArchivo('Selecciona un archivo antes de subirlo.')
      return
    }

    if (!esArchivoValido(archivo)) {
      setErrorArchivo('Solo se permiten archivos CSV, TXT, XLS o XLSX.')
      return
    }

    subirMutation.mutate({
      archivoSeleccionado: archivo,
      formato: formatoPorExtension(extensionArchivo(archivo)),
    })
  }

  function cambiarFiltro(nombre, valor) {
    setFiltros((actuales) => ({ ...actuales, [nombre]: valor }))
  }

  function aplicarFiltros(evento) {
    evento.preventDefault()
    const nuevosParams = { por_pagina: 100 }
    if (filtros.formato_archivo) nuevosParams.formato_archivo = filtros.formato_archivo
    if (filtros.estado) nuevosParams.estado = filtros.estado
    if (filtros.tipo_carga) nuevosParams.tipo_carga = filtros.tipo_carga
    setParams(nuevosParams)
  }

  function limpiarFiltros() {
    setFiltros({ formato_archivo: '', estado: '', tipo_carga: '' })
    setParams({ por_pagina: 100 })
  }

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Administrador', 'Carga masiva']} />
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Carga masiva Excel/CSV</h1>
        <p className="mt-1 text-sm text-slate-600">Carga archivos soportados por Laravel y revisa el resultado por fila.</p>
      </div>

      {subirMutation.error ? <MensajeError mensaje={obtenerMensajeError(subirMutation.error)} /> : null}
      {cargasQuery.error ? <MensajeError mensaje={obtenerMensajeError(cargasQuery.error)} /> : null}
      {detalleQuery.error ? <MensajeError mensaje={obtenerMensajeError(detalleQuery.error)} /> : null}

      <PanelArchivo
        archivo={archivo}
        errorArchivo={errorArchivo}
        cargando={subirMutation.isPending}
        onArchivo={cambiarArchivo}
        onLimpiar={limpiarArchivo}
        onEnviar={enviarArchivo}
      />

      <section className="grid gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Historial de cargas</h2>
            <p className="mt-1 text-sm text-slate-600">Consulta cargas procesadas, en proceso o con errores.</p>
          </div>
          <Boton variante="secundario" onClick={() => queryClient.invalidateQueries({ queryKey: ['cargas-masivas'] })}>
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Boton>
        </div>

        <FiltrosCargas
          filtros={filtros}
          onCambiar={cambiarFiltro}
          onEnviar={aplicarFiltros}
          onLimpiar={limpiarFiltros}
        />

        <TablaBase
          columnas={columnasCargas}
          datos={cargas}
          cargando={cargasQuery.isLoading}
          mensajeVacio="No existen cargas masivas registradas."
        />
      </section>

      <section ref={resultadoRef} className="scroll-mt-6 grid gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Resultado de carga</h2>
          <p className="mt-1 text-sm text-slate-600">
            {detalle
              ? `Detalle de ${detalle.nombre_archivo || 'la carga seleccionada'}.`
              : 'Selecciona una carga del historial para ver totales, registros validos y errores por fila.'}
          </p>
        </div>

        {detalle ? <ResumenCarga carga={detalle} /> : null}

        <div className="max-h-[32rem] overflow-auto rounded-md border border-slate-200">
          <TablaBase
            columnas={columnasDetalle}
            datos={detalles}
            cargando={detalleQuery.isLoading}
            mensajeVacio={cargaSeleccionadaId ? 'La carga seleccionada no tiene detalle de filas.' : 'Selecciona una carga para revisar su detalle.'}
          />
        </div>
      </section>
    </div>
  )
}
