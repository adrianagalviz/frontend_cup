import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LogIn, RefreshCw, Search } from 'lucide-react'
import { toast } from 'sonner'
import BadgeEstado from '../../../components/common/BadgeEstado'
import Boton from '../../../components/common/Boton'
import Input from '../../../components/common/Input'
import MensajeError from '../../../components/common/MensajeError'
import Select from '../../../components/common/Select'
import TablaBase from '../../../components/tables/TablaBase'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import { obtenerMensajeError } from '../../../lib/errores'
import {
  listarAsistenciaDocente,
  marcarEntradaDocente,
  obtenerHorarioActivoDocente,
} from '../../../services/asistencia.service'
import { listarDocentes } from '../../../services/docentes.service'

function texto(valor, alternativo = '-') {
  return valor || alternativo
}

function nombreDocente(docente) {
  return [docente?.nombres, docente?.apellido_paterno, docente?.apellido_materno].filter(Boolean).join(' ') || 'Sin docente'
}

function resumenHorario(horario) {
  if (!horario) return 'Sin clase activa'
  return `${texto(horario.dia)} | ${texto(horario.turno)} | Periodo ${texto(horario.periodo)} | ${texto(horario.hora_inicio)} - ${texto(horario.hora_fin)}`
}

function TarjetaDato({ etiqueta, valor }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase text-slate-500">{etiqueta}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{texto(valor)}</p>
    </div>
  )
}

function VistaDocente() {
  const queryClient = useQueryClient()

  const claseQuery = useQuery({
    queryKey: ['asistencia-docente', 'clase-activa'],
    queryFn: obtenerHorarioActivoDocente,
    refetchInterval: 1000 * 60,
  })

  const datos = claseQuery.data || {}
  const horario = datos.horario
  const asistencia = datos.asistencia
  const puedeMarcar = Boolean(datos.puede_marcar && horario)
  const entradaMarcada = Boolean(asistencia?.hora_entrada)

  const refrescarClase = () => queryClient.invalidateQueries({ queryKey: ['asistencia-docente', 'clase-activa'] })

  const entradaMutation = useMutation({
    mutationFn: marcarEntradaDocente,
    onSuccess: (respuesta) => {
      toast.success(`Entrada registrada: ${respuesta?.asistencia?.estado_entrada || 'estado actualizado'}.`)
      refrescarClase()
    },
  })

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Docente', 'Asistencias']} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Asistencia docente</h1>
          <p className="mt-1 text-sm text-slate-600">Marcado de entrada y salida segun horario definido por administracion.</p>
        </div>
        <Boton variante="secundario" onClick={refrescarClase} disabled={claseQuery.isFetching}>
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Boton>
      </div>

      {claseQuery.error ? <MensajeError mensaje={obtenerMensajeError(claseQuery.error)} /> : null}
      {entradaMutation.error ? <MensajeError mensaje={obtenerMensajeError(entradaMutation.error)} /> : null}

      <div className="rounded-md border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Clase activa</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">{texto(horario?.materia, 'No hay clase activa')}</h2>
            <p className="mt-1 text-sm text-slate-600">{datos.mensaje || 'Consulta de horario pendiente.'}</p>
          </div>
          <BadgeEstado estado={asistencia?.estado_entrada || (puedeMarcar ? 'pendiente' : 'inactivo')} />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <TarjetaDato etiqueta="Grupo" valor={horario?.grupo} />
          <TarjetaDato etiqueta="Aula" valor={horario?.aula} />
          <TarjetaDato etiqueta="Horario" valor={resumenHorario(horario)} />
          <TarjetaDato etiqueta="Hora actual backend" valor={datos.hora_actual} />
        </div>

        <div className="mt-5 grid gap-3 rounded-md bg-slate-50 p-4 sm:grid-cols-2">
          <TarjetaDato etiqueta="Entrada" valor={asistencia?.hora_entrada ? `${asistencia.hora_entrada} (${asistencia.estado_entrada})` : 'Sin entrada marcada'} />
          <TarjetaDato etiqueta="Salida automatica" valor={asistencia?.hora_salida ? `${asistencia.hora_salida} (${asistencia.estado_salida})` : 'Se registrara con la entrada'} />
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Boton
            onClick={() => entradaMutation.mutate({})}
            disabled={!puedeMarcar || entradaMarcada}
            cargando={entradaMutation.isPending}
          >
            <LogIn className="h-4 w-4" />
            Marcar entrada
          </Boton>
        </div>
      </div>
    </div>
  )
}

function VistaAdministrativa() {
  const [filtros, setFiltros] = useState({ fecha: '', docente_id: '', estado: '' })
  const [params, setParams] = useState({ por_pagina: 50 })

  const docentesQuery = useQuery({
    queryKey: ['docentes', 'filtro-asistencia'],
    queryFn: () => listarDocentes({ activo: 'true', por_pagina: 100 }),
  })

  const asistenciaQuery = useQuery({
    queryKey: ['asistencia-docente', 'admin', params],
    queryFn: () => listarAsistenciaDocente(params),
  })

  const docentes = docentesQuery.data?.datos || []
  const asistencias = asistenciaQuery.data?.datos || []
  const total = asistenciaQuery.data?.meta?.total ?? asistencias.length

  function actualizarFiltro(nombre, valor) {
    setFiltros((actuales) => ({ ...actuales, [nombre]: valor }))
  }

  function aplicarFiltros(evento) {
    evento.preventDefault()
    setParams({
      por_pagina: 50,
      fecha: filtros.fecha || undefined,
      docente_id: filtros.docente_id || undefined,
      estado: filtros.estado || undefined,
    })
  }

  const columnas = useMemo(() => [
    {
      header: 'Docente',
      cell: ({ row }) => <span className="font-semibold text-slate-950">{nombreDocente(row.original.docente)}</span>,
    },
    {
      header: 'Fecha',
      accessorKey: 'fecha',
    },
    {
      header: 'Clase',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-950">{texto(row.original.horario?.materia, 'Sin materia')}</p>
          <p className="text-xs text-slate-500">{texto(row.original.horario?.grupo, 'Sin grupo')} | {texto(row.original.horario?.aula, 'Sin aula')}</p>
        </div>
      ),
    },
    {
      header: 'Horario',
      cell: ({ row }) => `${texto(row.original.horario?.dia)} | ${texto(row.original.horario?.hora_inicio)} - ${texto(row.original.horario?.hora_fin)}`,
    },
    {
      header: 'Entrada',
      cell: ({ row }) => (
        <div className="grid gap-1">
          <span>{texto(row.original.hora_entrada, 'Sin marca')}</span>
          <BadgeEstado estado={row.original.estado_entrada} />
        </div>
      ),
    },
    {
      header: 'Salida',
      cell: ({ row }) => (
        <div className="grid gap-1">
          <span>{texto(row.original.hora_salida, 'Sin marca')}</span>
          {row.original.estado_salida ? <BadgeEstado estado={row.original.estado_salida} /> : null}
        </div>
      ),
    },
    {
      header: 'Observacion',
      cell: ({ row }) => texto(row.original.observacion),
    },
  ], [])

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Administrador', 'Asistencias docentes']} />
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Asistencia docente</h1>
        <p className="mt-1 text-sm text-slate-600">Visualizacion administrativa de presentes, retrasos y faltas docentes.</p>
      </div>

      {docentesQuery.error ? <MensajeError mensaje={obtenerMensajeError(docentesQuery.error)} /> : null}
      {asistenciaQuery.error ? <MensajeError mensaje={obtenerMensajeError(asistenciaQuery.error)} /> : null}

      <form onSubmit={aplicarFiltros} className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Fecha
          <Input type="date" value={filtros.fecha} onChange={(evento) => actualizarFiltro('fecha', evento.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Docente
          <Select value={filtros.docente_id} onChange={(evento) => actualizarFiltro('docente_id', evento.target.value)}>
            <option value="">Todos</option>
            {docentes.map((docente) => <option key={docente.id} value={docente.id}>{nombreDocente(docente.persona || docente)}</option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Estado
          <Select value={filtros.estado} onChange={(evento) => actualizarFiltro('estado', evento.target.value)}>
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="presente">Presente</option>
            <option value="retraso">Retraso</option>
            <option value="falta">Falta</option>
          </Select>
        </label>
        <div className="flex items-end">
          <Boton type="submit" className="w-full">
            <Search className="h-4 w-4" />
            Filtrar
          </Boton>
        </div>
      </form>

      <div className="rounded-md border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium uppercase text-slate-500">Registros encontrados</p>
        <p className="mt-1 text-2xl font-bold text-slate-950">{total}</p>
      </div>

      <TablaBase
        columnas={columnas}
        datos={asistencias}
        cargando={asistenciaQuery.isLoading}
        mensajeVacio="No existen asistencias docentes con los filtros seleccionados."
      />
    </div>
  )
}

export default function AsistenciaDocente({ modo = 'docente' }) {
  return modo === 'admin' ? <VistaAdministrativa /> : <VistaDocente />
}
