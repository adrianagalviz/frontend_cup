import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Eye, FileText, Search, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import AccionesTabla from '../../../components/tables/AccionesTabla'
import BadgeEstado from '../../../components/common/BadgeEstado'
import Boton from '../../../components/common/Boton'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import EmptyState from '../../../components/common/EmptyState'
import Input from '../../../components/common/Input'
import MensajeError from '../../../components/common/MensajeError'
import Modal from '../../../components/common/Modal'
import Select from '../../../components/common/Select'
import TablaBase from '../../../components/tables/TablaBase'
import Textarea from '../../../components/common/Textarea'
import PaginacionTabla from '../../../components/tables/PaginacionTabla'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import { listarGestiones } from '../../../services/gestionAcademica.service'
import { listarRequisitos, validarRequisitoDesdeCola } from '../../../services/requisitos.service'
import { obtenerMensajeError } from '../../../lib/errores'

function nombreCompleto(persona) {
  return [persona?.nombres, persona?.apellido_paterno, persona?.apellido_materno].filter(Boolean).join(' ') || 'Sin nombre'
}

function texto(valor, alternativo = 'Sin dato') {
  return valor === null || valor === undefined || valor === '' ? alternativo : valor
}

function documentoTexto(documento) {
  return documento?.cloudinary_url ? 'Titulo cargado' : 'Sin titulo cargado'
}

export default function GestionRequisitos() {
  const queryClient = useQueryClient()
  const [pagina, setPagina] = useState(1)
  const [filtros, setFiltros] = useState({ buscar: '', estado_requisitos: '', gestion_academica_id: '', documento: '' })
  const [params, setParams] = useState({ page: 1, por_pagina: 10 })
  const [requisitoRevision, setRequisitoRevision] = useState(null)
  const [confirmacion, setConfirmacion] = useState(null)
  const [observacion, setObservacion] = useState('')

  const requisitosQuery = useQuery({
    queryKey: ['requisitos', params],
    queryFn: () => listarRequisitos(params),
  })

  const gestionesQuery = useQuery({
    queryKey: ['gestiones-academicas', 'filtro-requisitos'],
    queryFn: () => listarGestiones({ por_pagina: 100 }),
  })

  const requisitos = requisitosQuery.data?.datos || []
  const gestiones = gestionesQuery.data || []
  const meta = requisitosQuery.data?.meta || { pagina_actual: pagina, ultima_pagina: 1, total: requisitos.length }
  const totalPaginas = Number(meta.ultima_pagina || 1)
  const puedeValidar = Boolean(requisitoRevision?.documento?.cloudinary_url)

  const validarMutation = useMutation({
    mutationFn: ({ id, payload }) => validarRequisitoDesdeCola(id, payload),
    onSuccess: () => {
      toast.success('Requisitos actualizados correctamente.')
      cerrarRevision()
      setConfirmacion(null)
      queryClient.invalidateQueries({ queryKey: ['requisitos'] })
      queryClient.invalidateQueries({ queryKey: ['postulantes'] })
    },
  })

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
      estado_requisitos: filtros.estado_requisitos || undefined,
      gestion_academica_id: filtros.gestion_academica_id || undefined,
      documento: filtros.documento || undefined,
    })
  }

  function cambiarPagina(valor) {
    const siguiente = Math.min(Math.max(1, valor), totalPaginas)
    setPagina(siguiente)
    setParams((actuales) => ({ ...actuales, page: siguiente }))
  }

  function abrirRevision(requisito) {
    setRequisitoRevision(requisito)
    setObservacion(requisito.documento?.observacion || requisito.observacion || '')
  }

  function cerrarRevision() {
    setRequisitoRevision(null)
    setConfirmacion(null)
    setObservacion('')
  }

  function solicitarConfirmacion(requisito, estadoRevision) {
    if (!requisito?.id) return

    setRequisitoRevision(requisito)
    setObservacion(requisito.documento?.observacion || requisito.observacion || '')
    setConfirmacion({ requisito, estadoRevision })
  }

  function validarConfirmado() {
    if (!confirmacion?.requisito?.id) return

    validarMutation.mutate({
      id: confirmacion.requisito.id,
      payload: {
        estado_revision: confirmacion.estadoRevision,
        observacion: observacion || undefined,
      },
    })
  }

  const columnas = useMemo(() => [
    {
      header: 'Postulante',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-950">{nombreCompleto(row.original.persona)}</p>
          <p className="text-xs text-slate-500">{row.original.persona?.correo || 'Sin correo'}</p>
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
      header: 'Requisitos',
      cell: ({ row }) => <BadgeEstado estado={row.original.estado_requisitos} />,
    },
    {
      header: 'Pago',
      cell: ({ row }) => <BadgeEstado estado={row.original.estado_pago} />,
    },
    {
      header: 'Documento',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-950">{documentoTexto(row.original.documento)}</p>
          <p className="text-xs text-slate-500">{texto(row.original.documento?.subido_en, 'Sin fecha')}</p>
        </div>
      ),
    },
    {
      header: 'Acciones',
      cell: ({ row }) => (
        <AccionesTabla>
          <Boton variante="secundario" className="min-h-9 px-3" title="Revisar documento" onClick={() => abrirRevision(row.original)}>
            <Eye className="h-4 w-4" />
          </Boton>
          <Boton variante="secundario" className="min-h-9 px-3" title="Aprobar requisitos" disabled={!row.original.documento?.cloudinary_url} onClick={() => solicitarConfirmacion(row.original, 'aprobado')}>
            <CheckCircle2 className="h-4 w-4" />
          </Boton>
          <Link to={`/admin/postulantes/${row.original.id}`} className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50" title="Ver postulante">
            <FileText className="h-4 w-4" />
          </Link>
        </AccionesTabla>
      ),
    },
  ], [])

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Administrador', 'Requisitos']} />
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Requisitos</h1>
        <p className="mt-1 text-sm text-slate-600">Cola de revision de titulos de bachiller enviados por postulantes.</p>
      </div>

      {requisitosQuery.error ? <MensajeError mensaje={obtenerMensajeError(requisitosQuery.error)} /> : null}
      {gestionesQuery.error ? <MensajeError mensaje={obtenerMensajeError(gestionesQuery.error)} /> : null}
      {validarMutation.error ? <MensajeError mensaje={obtenerMensajeError(validarMutation.error)} /> : null}

      <form onSubmit={aplicarFiltros} className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Buscar
          <Input value={filtros.buscar} placeholder="CI o nombre" onChange={(evento) => cambiarFiltro('buscar', evento.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Gestion
          <Select value={filtros.gestion_academica_id} onChange={(evento) => cambiarFiltro('gestion_academica_id', evento.target.value)}>
            <option value="">Todas</option>
            {gestiones.map((gestion) => <option key={gestion.id} value={gestion.id}>{gestion.nombre}</option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Estado
          <Select value={filtros.estado_requisitos} onChange={(evento) => cambiarFiltro('estado_requisitos', evento.target.value)}>
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobado">Aprobado</option>
            <option value="rechazado">Rechazado</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Documento
          <Select value={filtros.documento} onChange={(evento) => cambiarFiltro('documento', evento.target.value)}>
            <option value="">Todos</option>
            <option value="con_documento">Con documento</option>
            <option value="sin_documento">Sin documento</option>
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
        <p className="mt-1 text-2xl font-bold text-slate-950">{meta.total ?? requisitos.length}</p>
      </div>

      <div>
        <TablaBase columnas={columnas} datos={requisitos} cargando={requisitosQuery.isLoading} mensajeVacio="No existen requisitos con los filtros seleccionados." />
        {requisitos.length ? (
          <PaginacionTabla
            pagina={Number(meta.pagina_actual || pagina)}
            totalPaginas={totalPaginas}
            onAnterior={() => cambiarPagina(pagina - 1)}
            onSiguiente={() => cambiarPagina(pagina + 1)}
          />
        ) : null}
      </div>

      <Modal
        abierto={Boolean(requisitoRevision)}
        titulo="Revisar titulo de bachiller"
        onCerrar={cerrarRevision}
        className="max-w-4xl"
        acciones={(
          <>
            <Boton variante="secundario" onClick={cerrarRevision}>Cerrar</Boton>
            <Boton variante="peligro" disabled={!puedeValidar} cargando={validarMutation.isPending} onClick={() => solicitarConfirmacion(requisitoRevision, 'rechazado')}>
              <XCircle className="h-4 w-4" />
              Rechazar
            </Boton>
            <Boton disabled={!puedeValidar} cargando={validarMutation.isPending} onClick={() => solicitarConfirmacion(requisitoRevision, 'aprobado')}>
              <CheckCircle2 className="h-4 w-4" />
              Aprobar
            </Boton>
          </>
        )}
      >
        {requisitoRevision ? (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              {requisitoRevision.documento?.cloudinary_url ? (
                <a href={requisitoRevision.documento.cloudinary_url} target="_blank" rel="noreferrer">
                  <img src={requisitoRevision.documento.cloudinary_url} alt="Titulo de bachiller" className="max-h-[60vh] w-full rounded-md object-contain" />
                </a>
              ) : (
                <EmptyState titulo="Sin titulo cargado" descripcion="El postulante aun no subio el documento requerido." />
              )}
            </div>
            <div className="grid gap-3 content-start">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Postulante</p>
                <p className="mt-1 text-base font-semibold text-slate-950">{nombreCompleto(requisitoRevision.persona)}</p>
                <p className="text-xs text-slate-500">{texto(requisitoRevision.persona?.cedula_identidad, 'Sin CI')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <BadgeEstado estado={requisitoRevision.estado_requisitos} />
                {requisitoRevision.documento?.estado_revision ? <BadgeEstado estado={requisitoRevision.documento.estado_revision} /> : null}
              </div>
              <div className="grid gap-1">
                <span className="text-sm font-medium text-slate-700">Observacion</span>
                <Textarea value={observacion} onChange={(evento) => setObservacion(evento.target.value)} placeholder="Motivo u observacion de revision" />
              </div>
              <Link to={`/admin/postulantes/${requisitoRevision.id}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                <FileText className="h-4 w-4" />
                Ver detalle completo
              </Link>
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        abierto={Boolean(confirmacion)}
        titulo={confirmacion?.estadoRevision === 'aprobado' ? 'Aprobar requisitos' : 'Rechazar requisitos'}
        mensaje={`Confirma ${confirmacion?.estadoRevision === 'aprobado' ? 'aprobar' : 'rechazar'} los requisitos de ${nombreCompleto(confirmacion?.requisito?.persona)}?`}
        onCancelar={() => setConfirmacion(null)}
        onConfirmar={validarConfirmado}
        cargando={validarMutation.isPending}
      />
    </div>
  )
}
