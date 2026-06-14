import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RotateCcw, Search } from 'lucide-react'
import BadgeEstado from '../../../components/common/BadgeEstado'
import Boton from '../../../components/common/Boton'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import Input from '../../../components/common/Input'
import MensajeError from '../../../components/common/MensajeError'
import Select from '../../../components/common/Select'
import TablaBase from '../../../components/tables/TablaBase'
import PaginacionTabla from '../../../components/tables/PaginacionTabla'
import { obtenerMensajeError } from '../../../lib/errores'
import { listarBitacora } from '../../../services/bitacora.service'

const metodos = ['', 'POST', 'PUT', 'PATCH', 'DELETE']

function nombreCompleto(usuario) {
  const persona = usuario?.persona
  return [persona?.nombres, persona?.apellido_paterno, persona?.apellido_materno].filter(Boolean).join(' ') || usuario?.nombre_usuario || 'Usuario eliminado'
}

function formatearFecha(valor) {
  if (!valor) return 'Sin fecha'

  return new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(valor))
}

function estadoHttp(estado) {
  if (!estado) return 'sin estado'
  if (estado >= 200 && estado < 300) return 'exitoso'
  if (estado >= 400) return 'error'
  return 'procesando'
}

export default function BitacoraSistema() {
  const [pagina, setPagina] = useState(1)
  const [buscar, setBuscar] = useState('')
  const [filtros, setFiltros] = useState({
    buscar: '',
    metodo_http: '',
    fecha_desde: '',
    fecha_hasta: '',
  })

  const params = {
    pagina,
    por_pagina: 12,
    buscar: filtros.buscar || undefined,
    metodo_http: filtros.metodo_http || undefined,
    fecha_desde: filtros.fecha_desde || undefined,
    fecha_hasta: filtros.fecha_hasta || undefined,
  }

  const bitacoraQuery = useQuery({
    queryKey: ['bitacora', params],
    queryFn: () => listarBitacora(params),
  })

  const registros = bitacoraQuery.data?.datos || []
  const meta = bitacoraQuery.data?.meta || { pagina_actual: pagina, ultima_pagina: 1, total: registros.length }
  const totalPaginas = Number(meta.ultima_pagina || 1)

  const columnas = useMemo(() => [
    {
      header: 'Fecha',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-950">{formatearFecha(row.original.creado_en)}</p>
          <p className="text-xs text-slate-500">{row.original.direccion_ip || 'IP no disponible'}</p>
        </div>
      ),
    },
    {
      header: 'Usuario',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-950">{nombreCompleto(row.original.usuario)}</p>
          <p className="text-xs text-slate-500">{row.original.usuario?.nombre_usuario || 'Sin usuario'}</p>
        </div>
      ),
    },
    {
      header: 'Modulo',
      cell: ({ row }) => row.original.modulo,
    },
    {
      header: 'Accion',
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center gap-2">
          <BadgeEstado estado={row.original.metodo_http?.toLowerCase()} />
          <span className="font-medium text-slate-800">{row.original.accion}</span>
        </div>
      ),
    },
    {
      header: 'Ruta',
      cell: ({ row }) => (
        <code className="block max-w-80 truncate rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
          {row.original.ruta}
        </code>
      ),
    },
    {
      header: 'Estado',
      cell: ({ row }) => (
        <div className="grid gap-1">
          <BadgeEstado estado={estadoHttp(row.original.estado_http)} />
          <span className="text-xs text-slate-500">HTTP {row.original.estado_http || '-'}</span>
        </div>
      ),
    },
  ], [])

  function aplicarFiltros(event) {
    event.preventDefault()
    setPagina(1)
    setFiltros((actuales) => ({ ...actuales, buscar }))
  }

  function actualizarFiltro(nombre, valor) {
    setPagina(1)
    setFiltros((actuales) => ({ ...actuales, [nombre]: valor }))
  }

  function limpiarFiltros() {
    setPagina(1)
    setBuscar('')
    setFiltros({
      buscar: '',
      metodo_http: '',
      fecha_desde: '',
      fecha_hasta: '',
    })
  }

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Administrador', 'Bitacora']} />
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Bitacora del sistema</h1>
        <p className="mt-1 text-sm text-slate-600">Registro de acciones realizadas por usuarios autenticados.</p>
      </div>

      {bitacoraQuery.error ? <MensajeError mensaje={obtenerMensajeError(bitacoraQuery.error)} /> : null}

      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <form className="grid gap-3 xl:grid-cols-[1fr_160px_170px_170px_auto_auto]" onSubmit={aplicarFiltros}>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span>Buscar</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input className="pl-9" value={buscar} onChange={(event) => setBuscar(event.target.value)} placeholder="Usuario, modulo, accion o ruta" />
            </div>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span>Metodo</span>
            <Select value={filtros.metodo_http} onChange={(event) => actualizarFiltro('metodo_http', event.target.value)}>
              {metodos.map((metodo) => <option key={metodo || 'todos'} value={metodo}>{metodo || 'Todos'}</option>)}
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
            <Boton type="submit" className="w-full">Buscar</Boton>
          </div>
          <div className="flex items-end">
            <Boton type="button" variante="secundario" className="w-full" onClick={limpiarFiltros}>
              <RotateCcw className="h-4 w-4" />
              Limpiar
            </Boton>
          </div>
        </form>
      </section>

      <div>
        <TablaBase
          columnas={columnas}
          datos={registros}
          cargando={bitacoraQuery.isLoading}
          mensajeVacio="No existen acciones registradas con los filtros seleccionados."
        />
        {registros.length ? (
          <PaginacionTabla
            pagina={Number(meta.pagina_actual || pagina)}
            totalPaginas={totalPaginas}
            onAnterior={() => setPagina((valor) => Math.max(1, valor - 1))}
            onSiguiente={() => setPagina((valor) => Math.min(totalPaginas, valor + 1))}
          />
        ) : null}
      </div>
    </div>
  )
}
