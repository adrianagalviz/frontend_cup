import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Eye, Search } from 'lucide-react'
import AccionesTabla from '../../../components/tables/AccionesTabla'
import BadgeEstado from '../../../components/common/BadgeEstado'
import Boton from '../../../components/common/Boton'
import Input from '../../../components/common/Input'
import MensajeError from '../../../components/common/MensajeError'
import Select from '../../../components/common/Select'
import TablaBase from '../../../components/tables/TablaBase'
import PaginacionTabla from '../../../components/tables/PaginacionTabla'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import { listarAlumnos } from '../../../services/alumnos.service'
import { listarGestiones } from '../../../services/gestionAcademica.service'
import { listarGrupos } from '../../../services/grupos.service'
import { obtenerMensajeError } from '../../../lib/errores'

function nombreCompleto(persona) {
  return [persona?.nombres, persona?.apellido_paterno, persona?.apellido_materno].filter(Boolean).join(' ') || 'Sin nombre'
}

function texto(valor, alternativo = 'Sin dato') {
  return valor === null || valor === undefined || valor === '' ? alternativo : valor
}

export default function ListarAlumnos() {
  const [pagina, setPagina] = useState(1)
  const [filtros, setFiltros] = useState({ buscar: '', gestion_academica_id: '', grupo_id: '', estado_academico: '' })
  const [params, setParams] = useState({ page: 1, por_pagina: 10 })

  const alumnosQuery = useQuery({
    queryKey: ['alumnos', params],
    queryFn: () => listarAlumnos(params),
  })

  const gestionesQuery = useQuery({
    queryKey: ['gestiones-academicas', 'filtro-alumnos'],
    queryFn: () => listarGestiones({ por_pagina: 100 }),
  })

  const gruposQuery = useQuery({
    queryKey: ['grupos', 'filtro-alumnos'],
    queryFn: () => listarGrupos({ activo: 'true', por_pagina: 100 }),
  })

  const alumnos = alumnosQuery.data?.datos || []
  const gestiones = gestionesQuery.data || []
  const grupos = gruposQuery.data?.datos || []
  const meta = alumnosQuery.data?.meta || { pagina_actual: pagina, ultima_pagina: 1, total: alumnos.length }
  const totalPaginas = Number(meta.ultima_pagina || 1)

  function cambiarFiltro(nombre, valor) {
    setFiltros((actuales) => ({ ...actuales, [nombre]: valor }))
  }

  function aplicarFiltros(evento) {
    evento.preventDefault()
    setPagina(1)
    setParams({
      page: 1,
      por_pagina: 10,
      buscar: filtros.buscar || undefined,
      gestion_academica_id: filtros.gestion_academica_id || undefined,
      grupo_id: filtros.grupo_id || undefined,
      estado_academico: filtros.estado_academico || undefined,
    })
  }

  function cambiarPagina(valor) {
    const siguiente = Math.min(Math.max(1, valor), totalPaginas)
    setPagina(siguiente)
    setParams((actuales) => ({ ...actuales, page: siguiente }))
  }

  const columnas = useMemo(() => [
    {
      header: 'Alumno',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-950">{nombreCompleto(row.original.persona)}</p>
          <p className="text-xs text-slate-500">{row.original.codigo_alumno || 'Sin codigo'}</p>
        </div>
      ),
    },
    {
      header: 'CI',
      cell: ({ row }) => texto(row.original.persona?.cedula_identidad, 'Sin CI'),
    },
    {
      header: 'Gestion',
      cell: ({ row }) => texto(row.original.gestion_academica?.nombre, 'Sin gestion'),
    },
    {
      header: 'Grupo',
      cell: ({ row }) => texto(row.original.grupo_activo?.nombre, 'Sin grupo asignado'),
    },
    {
      header: 'Acceso',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-950">{texto(row.original.usuario?.codigo_acceso, 'Sin codigo')}</p>
          <p className="text-xs text-slate-500">{row.original.usuario?.activo ? 'Usuario activo' : 'Usuario inactivo'}</p>
        </div>
      ),
    },
    {
      header: 'Estado',
      cell: ({ row }) => <BadgeEstado estado={row.original.estado_academico} />,
    },
    {
      header: 'Acciones',
      cell: ({ row }) => (
        <AccionesTabla>
          <Link to={`/admin/alumnos/${row.original.id}`} className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50" title="Ver detalle">
            <Eye className="h-4 w-4" />
          </Link>
        </AccionesTabla>
      ),
    },
  ], [])

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Administrador', 'Alumnos']} />
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Alumnos</h1>
        <p className="mt-1 text-sm text-slate-600">Consulta de alumnos habilitados desde postulantes convertidos.</p>
      </div>

      {alumnosQuery.error ? <MensajeError mensaje={obtenerMensajeError(alumnosQuery.error)} /> : null}
      {gestionesQuery.error ? <MensajeError mensaje={obtenerMensajeError(gestionesQuery.error)} /> : null}
      {gruposQuery.error ? <MensajeError mensaje={obtenerMensajeError(gruposQuery.error)} /> : null}

      <form onSubmit={aplicarFiltros} className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Buscar
          <Input value={filtros.buscar} placeholder="Codigo, CI o nombre" onChange={(evento) => cambiarFiltro('buscar', evento.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Gestion
          <Select value={filtros.gestion_academica_id} onChange={(evento) => cambiarFiltro('gestion_academica_id', evento.target.value)}>
            <option value="">Todas</option>
            {gestiones.map((gestion) => <option key={gestion.id} value={gestion.id}>{gestion.nombre}</option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Grupo
          <Select value={filtros.grupo_id} onChange={(evento) => cambiarFiltro('grupo_id', evento.target.value)}>
            <option value="">Todos</option>
            {grupos.map((grupo) => <option key={grupo.id} value={grupo.id}>{grupo.nombre}</option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Estado
          <Select value={filtros.estado_academico} onChange={(evento) => cambiarFiltro('estado_academico', evento.target.value)}>
            <option value="">Todos</option>
            <option value="activo">Activo</option>
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

      <div className="rounded-md border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium uppercase text-slate-500">Registros encontrados</p>
        <p className="mt-1 text-2xl font-bold text-slate-950">{meta.total ?? alumnos.length}</p>
      </div>

      <div>
        <TablaBase columnas={columnas} datos={alumnos} cargando={alumnosQuery.isLoading} mensajeVacio="No existen alumnos con los filtros seleccionados." />
        {alumnos.length ? (
          <PaginacionTabla
            pagina={Number(meta.pagina_actual || pagina)}
            totalPaginas={totalPaginas}
            onAnterior={() => cambiarPagina(pagina - 1)}
            onSiguiente={() => cambiarPagina(pagina + 1)}
          />
        ) : null}
      </div>
    </div>
  )
}
