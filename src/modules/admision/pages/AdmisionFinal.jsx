import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, GraduationCap, PlayCircle, Search } from 'lucide-react'
import { toast } from 'sonner'
import BadgeEstado from '../../../components/common/BadgeEstado'
import Boton from '../../../components/common/Boton'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import EmptyState from '../../../components/common/EmptyState'
import MensajeError from '../../../components/common/MensajeError'
import Select from '../../../components/common/Select'
import TablaBase from '../../../components/tables/TablaBase'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import { obtenerMensajeError } from '../../../lib/errores'
import { asignarCarrerasPorAdmision, consultarAsignacionFinal } from '../../../services/admision.service'
import { listarGestiones } from '../../../services/gestionAcademica.service'

function texto(valor, alternativo = '-') {
  return valor === null || valor === undefined || valor === '' ? alternativo : valor
}

function nombrePersona(persona) {
  return [persona?.nombres, persona?.apellido_paterno, persona?.apellido_materno].filter(Boolean).join(' ') || 'Sin nombre'
}

function nombreGestion(gestion) {
  return gestion?.nombre || `${gestion?.anio || ''}-${gestion?.numero_gestion || ''}` || 'Sin gestion'
}

function nombreCarrera(carrera) {
  return carrera?.nombre || 'Sin carrera'
}

function motivoTexto(motivo) {
  const textos = {
    primera_opcion: 'Primera opcion',
    segunda_opcion: 'Segunda opcion',
  }

  return textos[motivo] || texto(motivo)
}

function agruparAsignacionesPorCarrera(asignaciones = [], cupos = []) {
  const grupos = new Map()

  cupos.forEach((cupo) => {
    const carreraId = cupo.carrera_id || cupo.carrera?.id
    grupos.set(carreraId, {
      carrera_id: carreraId,
      carrera: typeof cupo.carrera === 'string' ? cupo.carrera : cupo.carrera?.nombre,
      cantidad_cupos: cupo.cantidad_cupos,
      cupos_ocupados: cupo.cupos_ocupados || 0,
      cupos_disponibles: cupo.cupos_disponibles || 0,
      primera_opcion: [],
      segunda_opcion: [],
    })
  })

  asignaciones.forEach((asignacion) => {
    const carreraId = asignacion.carrera_asignada?.id
    if (!grupos.has(carreraId)) {
      grupos.set(carreraId, {
        carrera_id: carreraId,
        carrera: asignacion.carrera_asignada?.nombre,
        cantidad_cupos: 0,
        cupos_ocupados: 0,
        cupos_disponibles: 0,
        primera_opcion: [],
        segunda_opcion: [],
      })
    }

    const grupo = grupos.get(carreraId)
    const motivo = asignacion.motivo_asignacion || 'primera_opcion'
    grupo[motivo] = [...(grupo[motivo] || []), asignacion]
  })

  return Array.from(grupos.values())
}

function TarjetaDato({ etiqueta, valor }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase text-slate-500">{etiqueta}</p>
      <p className="mt-1 text-xl font-bold text-slate-950">{texto(valor)}</p>
    </div>
  )
}

function TablaAprobados({ datos, cargando }) {
  const columnas = useMemo(() => [
    {
      header: 'Alumno',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-950">{nombrePersona(row.original.alumno?.persona)}</p>
          <p className="text-xs text-slate-500">{row.original.alumno?.codigo_alumno || 'Sin codigo'}</p>
        </div>
      ),
    },
    {
      header: 'Promedio',
      cell: ({ row }) => <span className="font-semibold text-slate-950">{texto(row.original.promedio)}</span>,
    },
    {
      header: 'Estado',
      cell: ({ row }) => <BadgeEstado estado={row.original.estado_final || 'aprobado'} />,
    },
    {
      header: 'Primera opcion',
      cell: ({ row }) => nombreCarrera(row.original.primera_opcion),
    },
    {
      header: 'Segunda opcion',
      cell: ({ row }) => nombreCarrera(row.original.segunda_opcion),
    },
    {
      header: 'Carrera asignada',
      cell: ({ row }) => row.original.carrera_asignada ? nombreCarrera(row.original.carrera_asignada) : 'Pendiente',
    },
  ], [])

  return (
    <TablaBase
      columnas={columnas}
      datos={datos}
      cargando={cargando}
      mensajeVacio="No existen alumnos aprobados para la gestion seleccionada."
    />
  )
}

function TablaCupos({ cupos, cargando }) {
  const columnas = useMemo(() => [
    {
      header: 'Carrera',
      cell: ({ row }) => (typeof row.original.carrera === 'string' ? row.original.carrera : nombreCarrera(row.original.carrera)),
    },
    { header: 'Cupos', accessorKey: 'cantidad_cupos' },
    { header: 'Usados', accessorKey: 'cupos_ocupados' },
    { header: 'Disponibles', accessorKey: 'cupos_disponibles' },
  ], [])

  return (
    <TablaBase
      columnas={columnas}
      datos={cupos}
      cargando={cargando}
      mensajeVacio="No existen cupos configurados para la gestion seleccionada."
    />
  )
}

function ResultadoAsignacion({ resultado, cargando }) {
  if (!resultado && !cargando) return null

  const grupos = agruparAsignacionesPorCarrera(resultado?.asignaciones || [], resultado?.cupos || [])

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 md:grid-cols-4">
        <TarjetaDato etiqueta="Aprobados" valor={resultado?.cantidad_aprobados || 0} />
        <TarjetaDato etiqueta="Asignados" valor={resultado?.cantidad_asignados || 0} />
        <TarjetaDato etiqueta="Omitidos" valor={resultado?.cantidad_omitidos || 0} />
        <TarjetaDato etiqueta="Reasignado" valor={resultado?.reasignado ? 'Si' : 'No'} />
      </div>

      <section className="grid gap-3 rounded-md border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-950">Visualizacion por carrera</h2>
        {grupos.length ? grupos.map((grupo) => (
          <div key={grupo.carrera_id || grupo.carrera} className="rounded-md border border-slate-200 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-semibold text-slate-950">{grupo.carrera}</h3>
                <p className="text-sm text-slate-600">Cupos usados {grupo.cupos_ocupados} de {grupo.cantidad_cupos} | Disponibles {grupo.cupos_disponibles}</p>
              </div>
              <BadgeEstado estado={grupo.cupos_disponibles > 0 ? 'activo' : 'inactivo'} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {['primera_opcion', 'segunda_opcion'].map((motivo) => (
                <div key={motivo} className="rounded-md bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-950">{motivoTexto(motivo)}</p>
                  <div className="mt-2 grid gap-2">
                    {grupo[motivo]?.length ? grupo[motivo].map((asignacion) => (
                      <div key={`${motivo}-${asignacion.alumno?.id}`} className="rounded-md bg-white px-3 py-2 text-sm">
                        <p className="font-medium text-slate-950">{nombrePersona(asignacion.alumno?.persona)}</p>
                        <p className="text-xs text-slate-500">Promedio {asignacion.promedio} | Orden {asignacion.orden_prioridad}</p>
                      </div>
                    )) : <p className="text-sm text-slate-500">Sin alumnos.</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )) : <EmptyState descripcion="Consulta o ejecuta la asignacion para ver la distribucion por carrera." />}
      </section>

      {resultado?.omitidos?.length ? (
        <section className="grid gap-3 rounded-md border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-base font-semibold text-amber-900">Omitidos</h2>
          {resultado.omitidos.map((omitido) => (
            <div key={omitido.alumno?.id} className="rounded-md bg-white px-3 py-2 text-sm">
              <p className="font-medium text-slate-950">{nombrePersona(omitido.alumno?.persona)}</p>
              <p className="text-slate-600">{omitido.mensaje || 'Primera y segunda opcion sin cupo disponible.'}</p>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  )
}

export default function AdmisionFinal() {
  const queryClient = useQueryClient()
  const [filtros, setFiltros] = useState({ gestion_academica_id: '' })
  const [params, setParams] = useState({})
  const [confirmar, setConfirmar] = useState(false)
  const [reasignar, setReasignar] = useState(false)
  const [ultimoResultado, setUltimoResultado] = useState(null)

  const gestionesQuery = useQuery({
    queryKey: ['gestiones-academicas', 'admision'],
    queryFn: () => listarGestiones({ por_pagina: 100 }),
  })

  const resumenQuery = useQuery({
    queryKey: ['admision', 'asignacion-final', params.gestion_academica_id],
    queryFn: () => consultarAsignacionFinal({ gestion_academica_id: params.gestion_academica_id }),
    enabled: Boolean(params.gestion_academica_id),
  })

  const gestiones = gestionesQuery.data || []
  const resultado = resumenQuery.data || ultimoResultado
  const aprobados = resultado?.aprobados_ordenados || []
  const cupos = resultado?.cupos || []
  const gestionSeleccionada = gestiones.find((gestion) => String(gestion.id) === String(params.gestion_academica_id))
  const cuposDisponibles = cupos.reduce((total, cupo) => total + Number(cupo.cupos_disponibles || 0), 0)
  const puedeEjecutar = Boolean(params.gestion_academica_id) && aprobados.length > 0 && cupos.length > 0
  const error = gestionesQuery.error || resumenQuery.error

  const asignarMutation = useMutation({
    mutationFn: () => asignarCarrerasPorAdmision({
      gestion_academica_id: Number(params.gestion_academica_id),
      reasignar,
    }),
    onSuccess: (respuesta) => {
      toast.success(`Asignacion procesada: ${respuesta?.cantidad_asignados || 0} alumnos asignados.`)
      setUltimoResultado(respuesta || null)
      setConfirmar(false)
      queryClient.invalidateQueries({ queryKey: ['admision', 'asignacion-final', params.gestion_academica_id] })
      queryClient.invalidateQueries({ queryKey: ['promedios-admin'] })
    },
  })

  function cambiarFiltro(nombre, valor) {
    setFiltros((actuales) => ({ ...actuales, [nombre]: valor }))
  }

  function aplicarFiltros(evento) {
    evento.preventDefault()
    setUltimoResultado(null)
    setParams({
      gestion_academica_id: filtros.gestion_academica_id || undefined,
    })
  }

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Administrador', 'Admision final']} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Asignacion final de carrera</h1>
          <p className="mt-1 text-sm text-slate-600">Proceso de admision por mayor promedio y cupos de primera o segunda opcion.</p>
        </div>
        <Boton disabled={!puedeEjecutar || asignarMutation.isPending} onClick={() => setConfirmar(true)}>
          <PlayCircle className="h-4 w-4" />
          Ejecutar asignacion
        </Boton>
      </div>

      {error ? <MensajeError mensaje={obtenerMensajeError(error)} /> : null}
      {asignarMutation.error ? <MensajeError mensaje={obtenerMensajeError(asignarMutation.error)} /> : null}

      <form onSubmit={aplicarFiltros} className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_auto]">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Gestion academica
          <Select value={filtros.gestion_academica_id} onChange={(evento) => cambiarFiltro('gestion_academica_id', evento.target.value)}>
            <option value="">Seleccionar gestion</option>
            {gestiones.map((gestion) => <option key={gestion.id} value={gestion.id}>{nombreGestion(gestion)}</option>)}
          </Select>
        </label>
        <div className="flex items-end">
          <Boton type="submit" className="w-full">
            <Search className="h-4 w-4" />
            Consultar
          </Boton>
        </div>
      </form>

      <label className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700">
        <input type="checkbox" checked={reasignar} onChange={(evento) => setReasignar(evento.target.checked)} className="h-4 w-4 accent-sky-700" />
        Reasignar alumnos que ya tienen carrera asignada
      </label>

      <div className="grid gap-3 md:grid-cols-4">
        <TarjetaDato etiqueta="Gestion" valor={gestionSeleccionada ? nombreGestion(gestionSeleccionada) : 'Sin seleccionar'} />
        <TarjetaDato etiqueta="Aprobados" valor={aprobados.length} />
        <TarjetaDato etiqueta="Carreras con cupo" valor={cupos.length} />
        <TarjetaDato etiqueta="Cupos disponibles" valor={cuposDisponibles} />
      </div>

      <section className="grid gap-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-sky-700" />
          <h2 className="text-base font-semibold text-slate-950">Alumnos aprobados aptos para asignacion</h2>
        </div>
        <TablaAprobados datos={aprobados} cargando={resumenQuery.isLoading} />
      </section>

      <section className="grid gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-sky-700" />
          <h2 className="text-base font-semibold text-slate-950">Cupos por carrera</h2>
        </div>
        <TablaCupos cupos={cupos} cargando={resumenQuery.isLoading} />
      </section>

      <ResultadoAsignacion resultado={resultado} cargando={resumenQuery.isLoading} />

      <ConfirmDialog
        abierto={confirmar}
        titulo={reasignar ? 'Reasignar carreras' : 'Ejecutar asignacion final'}
        mensaje={`Confirma ${reasignar ? 'reasignar' : 'ejecutar'} la asignacion final para ${nombreGestion(gestionSeleccionada)}? Solo se asignara primera o segunda opcion; si ambas estan llenas, el alumno sera omitido.`}
        onCancelar={() => setConfirmar(false)}
        onConfirmar={() => asignarMutation.mutate()}
        cargando={asignarMutation.isPending}
      />
    </div>
  )
}
