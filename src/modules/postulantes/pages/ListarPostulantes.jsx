import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit, Eye, Search, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import AccionesTabla from '../../../components/tables/AccionesTabla'
import BadgeEstado from '../../../components/common/BadgeEstado'
import Boton from '../../../components/common/Boton'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import Input from '../../../components/common/Input'
import MensajeError from '../../../components/common/MensajeError'
import Select from '../../../components/common/Select'
import TablaBase from '../../../components/tables/TablaBase'
import PaginacionTabla from '../../../components/tables/PaginacionTabla'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import { eliminarPostulanteConObservacion, listarPostulantes } from '../../../services/postulantes.service'
import { obtenerMensajeError } from '../../../lib/errores'

function nombreCompleto(postulante) {
  return [postulante.nombres, postulante.apellido_paterno, postulante.apellido_materno].filter(Boolean).join(' ')
}

export default function ListarPostulantes() {
  const queryClient = useQueryClient()
  const [pagina, setPagina] = useState(1)
  const [buscar, setBuscar] = useState('')
  const [filtros, setFiltros] = useState({ buscar: '', estado: '' })
  const [postulanteEliminar, setPostulanteEliminar] = useState(null)

  const params = {
    pagina,
    por_pagina: 10,
    buscar: filtros.buscar || undefined,
    estado: filtros.estado || undefined,
  }

  const postulantesQuery = useQuery({
    queryKey: ['postulantes', params],
    queryFn: () => listarPostulantes(params),
  })

  const eliminarMutation = useMutation({
    mutationFn: (postulante) => eliminarPostulanteConObservacion(postulante.id, 'Eliminacion logica desde frontend administrativo.'),
    onSuccess: () => {
      toast.success('Postulante eliminado logicamente correctamente.')
      setPostulanteEliminar(null)
      queryClient.invalidateQueries({ queryKey: ['postulantes'] })
    },
  })

  const postulantes = postulantesQuery.data?.datos || []
  const meta = postulantesQuery.data?.meta || { pagina_actual: pagina, ultima_pagina: 1 }
  const totalPaginas = Number(meta.ultima_pagina || 1)

  const columnas = useMemo(() => [
    {
      header: 'Postulante',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-950">{nombreCompleto(row.original)}</p>
          <p className="text-xs text-slate-500">{row.original.correo}</p>
        </div>
      ),
    },
    { header: 'CI', cell: ({ row }) => row.original.cedula_identidad },
    { header: 'Ciudad', cell: ({ row }) => row.original.ciudad || 'Sin ciudad' },
    { header: 'Requisitos', cell: ({ row }) => <BadgeEstado estado={row.original.estado_requisitos} /> },
    { header: 'Pago', cell: ({ row }) => <BadgeEstado estado={row.original.estado_pago} /> },
    { header: 'Acceso', cell: ({ row }) => <BadgeEstado estado={row.original.estado_postulante} /> },
    {
      header: 'Acciones',
      cell: ({ row }) => (
        <AccionesTabla>
          <Link to={`/admin/postulantes/${row.original.id}`} className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            <Eye className="h-4 w-4" />
          </Link>
          <Link to={`/admin/postulantes/${row.original.id}/editar`} className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            <Edit className="h-4 w-4" />
          </Link>
          <Boton variante="peligro" className="min-h-9 px-3" onClick={() => setPostulanteEliminar(row.original)}>
            <Trash2 className="h-4 w-4" />
          </Boton>
        </AccionesTabla>
      ),
    },
  ], [])

  function aplicarFiltros(event) {
    event.preventDefault()
    setPagina(1)
    setFiltros((actuales) => ({ ...actuales, buscar }))
  }

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Administrador', 'Postulantes']} />
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Postulantes</h1>
          <p className="mt-1 text-sm text-slate-600">Listado filtrable conectado al backend Laravel.</p>
        </div>
        <Link to="/admin/postulantes/registro" className="inline-flex min-h-10 items-center justify-center rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800">
          Registrar postulante
        </Link>
      </div>
      {postulantesQuery.error ? <MensajeError mensaje={obtenerMensajeError(postulantesQuery.error)} /> : null}
      {eliminarMutation.error ? <MensajeError mensaje={obtenerMensajeError(eliminarMutation.error)} /> : null}

      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <form className="grid gap-3 lg:grid-cols-[1fr_220px_auto]" onSubmit={aplicarFiltros}>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span>Buscar</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input className="pl-9" value={buscar} onChange={(event) => setBuscar(event.target.value)} placeholder="Nombre o cedula" />
            </div>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span>Estado</span>
            <Select value={filtros.estado} onChange={(event) => { setPagina(1); setFiltros((actuales) => ({ ...actuales, estado: event.target.value })) }}>
              <option value="">Todos</option>
              <option value="registrado">Registrado</option>
              <option value="pendiente_pago">Pendiente pago</option>
              <option value="pagado">Pagado</option>
              <option value="habilitado_alumno">Habilitado alumno</option>
              <option value="rechazado">Rechazado</option>
            </Select>
          </label>
          <div className="flex items-end">
            <Boton type="submit" className="w-full">Buscar</Boton>
          </div>
        </form>
      </section>

      <div>
        <TablaBase columnas={columnas} datos={postulantes} cargando={postulantesQuery.isLoading} mensajeVacio="No existen postulantes con los filtros seleccionados." />
        {postulantes.length ? (
          <PaginacionTabla
            pagina={Number(meta.pagina_actual || pagina)}
            totalPaginas={totalPaginas}
            onAnterior={() => setPagina((valor) => Math.max(1, valor - 1))}
            onSiguiente={() => setPagina((valor) => Math.min(totalPaginas, valor + 1))}
          />
        ) : null}
      </div>

      <ConfirmDialog
        abierto={Boolean(postulanteEliminar)}
        titulo="Eliminar logicamente postulante"
        mensaje={`Confirma rechazar/eliminar logicamente a ${postulanteEliminar ? nombreCompleto(postulanteEliminar) : 'este postulante'}?`}
        onCancelar={() => setPostulanteEliminar(null)}
        onConfirmar={() => eliminarMutation.mutate(postulanteEliminar)}
        cargando={eliminarMutation.isPending}
      />
    </div>
  )
}
