import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileSpreadsheet, Search } from 'lucide-react'
import { toast } from 'sonner'
import BadgeEstado from '../../../components/common/BadgeEstado'
import Boton from '../../../components/common/Boton'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import EmptyState from '../../../components/common/EmptyState'
import Loader from '../../../components/common/Loader'
import MensajeError from '../../../components/common/MensajeError'
import Select from '../../../components/common/Select'
import TablaBase from '../../../components/tables/TablaBase'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import { useAuth } from '../../../hooks/useAuth'
import { obtenerMensajeError } from '../../../lib/errores'
import { calcularPromedios, listarNotasAlumno, listarPromedios } from '../../../services/notas.service'
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

function estadoVisual(promedio) {
  return promedio?.estado_final || 'pendiente'
}

function TarjetaDato({ etiqueta, valor, estado }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase text-slate-500">{etiqueta}</p>
      <div className="mt-1">
        {estado ? <BadgeEstado estado={estado} /> : <p className="text-xl font-bold text-slate-950">{texto(valor)}</p>}
      </div>
    </div>
  )
}

function TablaPromedios({ promedios, cargando }) {
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
      header: 'Gestion',
      cell: ({ row }) => nombreGestion(row.original.gestion_academica),
    },
    { header: 'Parcial 1', cell: ({ row }) => texto(row.original.parcial_1) },
    { header: 'Parcial 2', cell: ({ row }) => texto(row.original.parcial_2) },
    { header: 'Parcial 3', cell: ({ row }) => texto(row.original.parcial_3) },
    {
      header: 'Promedio',
      cell: ({ row }) => <span className="font-semibold text-slate-950">{texto(row.original.promedio)}</span>,
    },
    {
      header: 'Estado',
      cell: ({ row }) => <BadgeEstado estado={estadoVisual(row.original)} />,
    },
  ], [])

  return (
    <TablaBase
      columnas={columnas}
      datos={promedios}
      cargando={cargando}
      mensajeVacio="No existen promedios finales con los filtros seleccionados."
    />
  )
}

function VistaAdministrativa() {
  const queryClient = useQueryClient()
  const [filtros, setFiltros] = useState({ gestion_academica_id: '', estado_final: '' })
  const [params, setParams] = useState({ por_pagina: 100 })
  const [gestionCalcular, setGestionCalcular] = useState(null)

  const promediosQuery = useQuery({
    queryKey: ['promedios-admin', params],
    queryFn: () => listarPromedios(params),
  })

  const gestionesQuery = useQuery({
    queryKey: ['gestiones-academicas', 'notas'],
    queryFn: () => listarGestiones({ por_pagina: 100 }),
  })

  const promedios = promediosQuery.data?.datos || []
  const meta = promediosQuery.data?.meta
  const gestiones = gestionesQuery.data || []
  const total = meta?.total ?? promedios.length
  const aprobados = promedios.filter((promedio) => promedio.estado_final === 'aprobado').length
  const reprobados = promedios.filter((promedio) => promedio.estado_final === 'reprobado').length
  const pendientes = promedios.filter((promedio) => !promedio.estado_final).length

  const calcularMutation = useMutation({
    mutationFn: (gestion) => calcularPromedios({ gestion_academica_id: Number(gestion.id) }),
    onSuccess: (respuesta) => {
      toast.success(`Promedios calculados: ${respuesta?.cantidad_calculada || 0}.`)
      setGestionCalcular(null)
      queryClient.invalidateQueries({ queryKey: ['promedios-admin'] })
    },
  })

  function cambiarFiltro(nombre, valor) {
    setFiltros((actuales) => ({ ...actuales, [nombre]: valor }))
  }

  function aplicarFiltros(evento) {
    evento.preventDefault()
    setParams({
      por_pagina: 100,
      gestion_academica_id: filtros.gestion_academica_id || undefined,
      estado_final: filtros.estado_final || undefined,
    })
  }

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Administrador', 'Notas']} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Notas, promedios y estado final</h1>
          <p className="mt-1 text-sm text-slate-600">Promedios finales calculados por backend a partir de los tres parciales.</p>
        </div>
        <Select className="sm:w-72" value="" onChange={(evento) => {
          const gestion = gestiones.find((item) => String(item.id) === evento.target.value)
          if (gestion) setGestionCalcular(gestion)
        }}>
          <option value="">Calcular por gestion</option>
          {gestiones.map((gestion) => <option key={gestion.id} value={gestion.id}>{nombreGestion(gestion)}</option>)}
        </Select>
      </div>

      {promediosQuery.error ? <MensajeError mensaje={obtenerMensajeError(promediosQuery.error)} /> : null}
      {gestionesQuery.error ? <MensajeError mensaje={obtenerMensajeError(gestionesQuery.error)} /> : null}
      {calcularMutation.error ? <MensajeError mensaje={obtenerMensajeError(calcularMutation.error)} /> : null}

      <form onSubmit={aplicarFiltros} className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_1fr_auto]">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Gestion
          <Select value={filtros.gestion_academica_id} onChange={(evento) => cambiarFiltro('gestion_academica_id', evento.target.value)}>
            <option value="">Todas</option>
            {gestiones.map((gestion) => <option key={gestion.id} value={gestion.id}>{nombreGestion(gestion)}</option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Estado
          <Select value={filtros.estado_final} onChange={(evento) => cambiarFiltro('estado_final', evento.target.value)}>
            <option value="">Todos</option>
            <option value="aprobado">Aprobado</option>
            <option value="reprobado">Reprobado</option>
          </Select>
        </label>
        <div className="flex items-end">
          <Boton type="submit" className="w-full">
            <Search className="h-4 w-4" />
            Filtrar
          </Boton>
        </div>
      </form>

      <div className="grid gap-3 md:grid-cols-4">
        <TarjetaDato etiqueta="Total" valor={total} />
        <TarjetaDato etiqueta="Aprobados" valor={aprobados} />
        <TarjetaDato etiqueta="Reprobados" valor={reprobados} />
        <TarjetaDato etiqueta="Pendientes" valor={pendientes} />
      </div>

      <TablaPromedios promedios={promedios} cargando={promediosQuery.isLoading} />

      <ConfirmDialog
        abierto={Boolean(gestionCalcular)}
        titulo="Calcular promedios"
        mensaje={`Confirma calcular promedios para ${nombreGestion(gestionCalcular)}? El backend omitira alumnos sin los 3 parciales.`}
        onCancelar={() => setGestionCalcular(null)}
        onConfirmar={() => calcularMutation.mutate(gestionCalcular)}
        cargando={calcularMutation.isPending}
      />
    </div>
  )
}

function VistaAlumno() {
  const { usuario, refrescarPerfil } = useAuth()

  const perfilQuery = useQuery({
    queryKey: ['perfil-autenticado'],
    queryFn: refrescarPerfil,
    initialData: usuario,
    staleTime: 1000 * 60 * 5,
  })

  const perfil = perfilQuery.data || usuario
  const alumnoId = perfil?.datos_rol?.alumno?.id

  const notasQuery = useQuery({
    queryKey: ['notas-alumno', alumnoId],
    queryFn: () => listarNotasAlumno(alumnoId),
    enabled: Boolean(alumnoId),
  })

  const datos = notasQuery.data || {}
  const alumno = datos.alumno
  const notas = datos.notas_parciales || []
  const promedio = datos.promedio_final
  const notasPorParcial = Object.fromEntries(notas.map((nota) => [nota.numero_parcial, nota]))

  if (perfilQuery.isLoading) return <Loader texto="Cargando perfil..." />

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Alumno', 'Notas']} />
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Mis notas</h1>
        <p className="mt-1 text-sm text-slate-600">Consulta de parciales, promedio y estado final propios.</p>
      </div>

      {perfilQuery.error ? <MensajeError mensaje={obtenerMensajeError(perfilQuery.error)} /> : null}
      {notasQuery.error ? <MensajeError mensaje={obtenerMensajeError(notasQuery.error)} /> : null}
      {!alumnoId ? <MensajeError mensaje="No se encontro el identificador de alumno autenticado." /> : null}

      <div className="rounded-md border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Alumno</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">{nombrePersona(alumno?.persona)}</h2>
            <p className="text-sm text-slate-600">{alumno?.codigo_alumno || perfil?.codigo_acceso || 'Sin codigo'}</p>
          </div>
          <BadgeEstado estado={estadoVisual(promedio)} />
        </div>
      </div>

      {notasQuery.isLoading ? <Loader texto="Cargando notas..." /> : (
        <>
          <div className="grid gap-3 md:grid-cols-5">
            <TarjetaDato etiqueta="Parcial 1" valor={notasPorParcial[1]?.nota} />
            <TarjetaDato etiqueta="Parcial 2" valor={notasPorParcial[2]?.nota} />
            <TarjetaDato etiqueta="Parcial 3" valor={notasPorParcial[3]?.nota} />
            <TarjetaDato etiqueta="Promedio" valor={promedio?.promedio || 'Pendiente'} />
            <TarjetaDato etiqueta="Estado final" estado={estadoVisual(promedio)} />
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
              <FileSpreadsheet className="h-5 w-5 text-sky-700" />
              Detalle de parciales
            </h2>
            <div className="mt-3 grid gap-3">
              {notas.length ? notas.map((nota) => (
                <div key={nota.id} className="grid gap-2 rounded-md bg-slate-50 px-3 py-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                  <div>
                    <p className="font-semibold text-slate-950">{nota.examen?.titulo || `Parcial ${nota.numero_parcial}`}</p>
                    <p className="text-xs text-slate-500">Parcial {nota.numero_parcial} | Registrado {texto(nota.registrado_en)}</p>
                  </div>
                  <span className="text-sm text-slate-600">Intento {nota.intento_examen_id}</span>
                  <span className="text-lg font-bold text-slate-950">{nota.nota}</span>
                </div>
              )) : <EmptyState descripcion="Todavia no tienes notas parciales registradas." />}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function NotasPromedios({ modo = 'admin' }) {
  return modo === 'alumno' ? <VistaAlumno /> : <VistaAdministrativa />
}
