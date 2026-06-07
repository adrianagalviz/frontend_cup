import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit, Eye, PowerOff, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import AccionesTabla from '../../../components/tables/AccionesTabla'
import BadgeEstado from '../../../components/common/BadgeEstado'
import Boton from '../../../components/common/Boton'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import Input from '../../../components/common/Input'
import MensajeError from '../../../components/common/MensajeError'
import Modal from '../../../components/common/Modal'
import Select from '../../../components/common/Select'
import TablaBase from '../../../components/tables/TablaBase'
import PaginacionTabla from '../../../components/tables/PaginacionTabla'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import { crearDocente, editarDocente, eliminarDocente, listarDocentes, verDocente } from '../../../services/docentes.service'
import { obtenerMensajeError } from '../../../lib/errores'
import FormularioDocente from '../components/FormularioDocente'

function nombreCompleto(persona) {
  return [persona?.nombres, persona?.apellido_paterno, persona?.apellido_materno].filter(Boolean).join(' ') || 'Sin nombre'
}

function siNo(valor) {
  return valor ? 'Si' : 'No'
}

function FilaDato({ etiqueta, valor }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
      <dt className="text-xs font-medium uppercase text-slate-500">{etiqueta}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-900">{valor || 'Sin dato'}</dd>
    </div>
  )
}

function ListaSimple({ titulo, items, render }) {
  return (
    <section className="grid gap-2">
      <h3 className="text-sm font-semibold text-slate-950">{titulo}</h3>
      {items?.length ? (
        <div className="grid gap-2">
          {items.map((item) => (
            <div key={`${titulo}-${item.id}`} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              {render(item)}
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">Sin registros.</p>
      )}
    </section>
  )
}

function DetalleDocente({ docente }) {
  if (!docente) return null

  const asignaciones = docente.asignaciones || {}

  return (
    <div className="grid max-h-[72vh] gap-5 overflow-y-auto pr-1">
      <section className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{nombreCompleto(docente.persona)}</h2>
            <p className="text-sm text-slate-500">{docente.persona?.correo || 'Sin correo'}</p>
          </div>
          <div className="flex gap-2">
            <BadgeEstado estado={docente.activo ? 'activo' : 'inactivo'} />
            <BadgeEstado estado={docente.contratado ? 'contratado' : 'no contratado'} />
          </div>
        </div>
        <dl className="grid gap-3 md:grid-cols-3">
          <FilaDato etiqueta="CI" valor={docente.persona?.cedula_identidad} />
          <FilaDato etiqueta="Celular" valor={docente.persona?.celular} />
          <FilaDato etiqueta="Usuario" valor={docente.usuario?.nombre_usuario} />
          <FilaDato etiqueta="Profesional en el area" valor={siNo(docente.es_profesional_area)} />
          <FilaDato etiqueta="Maestria" valor={siNo(docente.tiene_maestria)} />
          <FilaDato etiqueta="Diplomado educacion superior" valor={siNo(docente.tiene_diplomado_educacion_superior)} />
        </dl>
      </section>

      <section className="grid gap-3">
        <h3 className="text-sm font-semibold text-slate-950">Asignaciones relacionadas</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <ListaSimple titulo="Materias" items={asignaciones.materias || []} render={(materia) => materia.nombre} />
          <ListaSimple titulo="Grupos" items={asignaciones.grupos || []} render={(grupo) => grupo.nombre} />
        </div>
        <ListaSimple
          titulo="Horarios"
          items={asignaciones.horarios || []}
          render={(horario) => (
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-950">{horario.dia}</span>
                <span>{horario.hora_inicio} - {horario.hora_fin}</span>
                <BadgeEstado estado={horario.activo ? 'activo' : 'inactivo'} />
              </div>
              <span className="text-xs text-slate-500">
                {horario.materia?.nombre || 'Materia'} | {horario.grupo?.nombre || 'Grupo'} | {horario.gestion?.nombre || 'Gestion'} | {horario.aula || 'Aula'} | Periodo {horario.periodo}
              </span>
            </div>
          )}
        />
      </section>
    </div>
  )
}

export default function ListarDocentes() {
  const queryClient = useQueryClient()
  const [pagina, setPagina] = useState(1)
  const [buscar, setBuscar] = useState('')
  const [filtros, setFiltros] = useState({ buscar: '', activo: '' })
  const [modalFormulario, setModalFormulario] = useState(false)
  const [docenteEditando, setDocenteEditando] = useState(null)
  const [docenteDetalleId, setDocenteDetalleId] = useState(null)
  const [docenteDesactivar, setDocenteDesactivar] = useState(null)
  const [mensajeError, setMensajeError] = useState('')

  const params = {
    pagina,
    por_pagina: 10,
    buscar: filtros.buscar || undefined,
    activo: filtros.activo || undefined,
  }

  const docentesQuery = useQuery({
    queryKey: ['docentes', params],
    queryFn: () => listarDocentes(params),
  })

  const detalleQuery = useQuery({
    queryKey: ['docentes', 'detalle', docenteDetalleId],
    queryFn: () => verDocente(docenteDetalleId),
    enabled: Boolean(docenteDetalleId),
  })

  const docentes = docentesQuery.data?.datos || []
  const meta = docentesQuery.data?.meta || { pagina_actual: pagina, ultima_pagina: 1, total: docentes.length }
  const docenteDetalle = detalleQuery.data?.docente

  const invalidarDocentes = () => queryClient.invalidateQueries({ queryKey: ['docentes'] })

  const crearMutation = useMutation({
    mutationFn: crearDocente,
    onSuccess: () => {
      toast.success('Docente registrado correctamente.')
      setModalFormulario(false)
      setDocenteEditando(null)
      invalidarDocentes()
    },
    onError: (error) => setMensajeError(obtenerMensajeError(error)),
  })

  const editarMutation = useMutation({
    mutationFn: ({ id, payload }) => editarDocente(id, payload),
    onSuccess: () => {
      toast.success('Docente actualizado correctamente.')
      setModalFormulario(false)
      setDocenteEditando(null)
      invalidarDocentes()
    },
    onError: (error) => setMensajeError(obtenerMensajeError(error)),
  })

  const desactivarMutation = useMutation({
    mutationFn: eliminarDocente,
    onSuccess: () => {
      toast.success('Docente desactivado correctamente.')
      setDocenteDesactivar(null)
      invalidarDocentes()
    },
    onError: (error) => setMensajeError(obtenerMensajeError(error)),
  })

  const columnas = useMemo(() => [
    {
      header: 'Docente',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-950">{nombreCompleto(row.original.persona)}</p>
          <p className="text-xs text-slate-500">{row.original.usuario?.nombre_usuario || 'Sin usuario'}</p>
        </div>
      ),
    },
    {
      header: 'CI',
      cell: ({ row }) => row.original.persona?.cedula_identidad || 'Sin CI',
    },
    {
      header: 'Correo',
      cell: ({ row }) => row.original.persona?.correo || 'Sin correo',
    },
    {
      header: 'Requisitos',
      cell: ({ row }) => (
        <div className="grid gap-1 text-xs">
          <span>Profesional: {siNo(row.original.es_profesional_area)}</span>
          <span>Maestria: {siNo(row.original.tiene_maestria)}</span>
          <span>Diplomado: {siNo(row.original.tiene_diplomado_educacion_superior)}</span>
        </div>
      ),
    },
    {
      header: 'Estado',
      cell: ({ row }) => <BadgeEstado estado={row.original.activo ? 'activo' : 'inactivo'} />,
    },
    {
      header: 'Acciones',
      cell: ({ row }) => {
        const docente = row.original

        return (
          <AccionesTabla>
            <Boton variante="secundario" className="min-h-9 px-3" title="Ver detalle" onClick={() => abrirDetalle(docente.id)}>
              <Eye className="h-4 w-4" />
            </Boton>
            <Boton variante="secundario" className="min-h-9 px-3" title="Editar docente" onClick={() => abrirEdicion(docente)}>
              <Edit className="h-4 w-4" />
            </Boton>
            {docente.activo ? (
              <Boton variante="peligro" className="min-h-9 px-3" title="Desactivar docente" onClick={() => setDocenteDesactivar(docente)}>
                <PowerOff className="h-4 w-4" />
              </Boton>
            ) : null}
          </AccionesTabla>
        )
      },
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

  function abrirCreacion() {
    setMensajeError('')
    setDocenteEditando(null)
    setModalFormulario(true)
  }

  function abrirEdicion(docente) {
    setMensajeError('')
    setDocenteEditando(docente)
    setModalFormulario(true)
  }

  function abrirDetalle(id) {
    setMensajeError('')
    setDocenteDetalleId(id)
  }

  async function guardarDocente(payload) {
    setMensajeError('')

    if (docenteEditando) {
      await editarMutation.mutateAsync({ id: docenteEditando.id, payload })
      return
    }

    await crearMutation.mutateAsync(payload)
  }

  const totalPaginas = Number(meta.ultima_pagina || 1)

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Administrador', 'Docentes']} />
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Docentes</h1>
          <p className="mt-1 text-sm text-slate-600">Registro, busqueda, edicion, detalle y desactivacion.</p>
        </div>
        <Boton onClick={abrirCreacion}>
          <Plus className="h-4 w-4" />
          Registrar docente
        </Boton>
      </div>

      {mensajeError ? <MensajeError mensaje={mensajeError} /> : null}
      {docentesQuery.error ? <MensajeError mensaje={obtenerMensajeError(docentesQuery.error)} /> : null}

      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <form className="grid gap-3 md:grid-cols-[1fr_180px_auto]" onSubmit={aplicarFiltros}>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span>Buscar por nombre, cedula o correo</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input className="pl-9" value={buscar} onChange={(event) => setBuscar(event.target.value)} placeholder="Nombre, cedula o correo" />
            </div>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span>Estado</span>
            <Select value={filtros.activo} onChange={(event) => actualizarFiltro('activo', event.target.value)}>
              <option value="">Todos</option>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </Select>
          </label>
          <div className="flex items-end">
            <Boton type="submit" className="w-full">Buscar</Boton>
          </div>
        </form>
      </section>

      <div>
        <TablaBase
          columnas={columnas}
          datos={docentes}
          cargando={docentesQuery.isLoading}
          mensajeVacio="No existen docentes con los filtros seleccionados."
        />
        {docentes.length ? (
          <PaginacionTabla
            pagina={Number(meta.pagina_actual || pagina)}
            totalPaginas={totalPaginas}
            onAnterior={() => setPagina((valor) => Math.max(1, valor - 1))}
            onSiguiente={() => setPagina((valor) => Math.min(totalPaginas, valor + 1))}
          />
        ) : null}
      </div>

      <Modal
        abierto={modalFormulario}
        titulo={docenteEditando ? 'Editar docente' : 'Registrar docente'}
        onCerrar={() => setModalFormulario(false)}
        acciones={<></>}
        className="max-w-3xl"
      >
        <FormularioDocente
          docente={docenteEditando}
          onGuardar={guardarDocente}
          onCancelar={() => setModalFormulario(false)}
          cargando={crearMutation.isPending || editarMutation.isPending}
        />
      </Modal>

      <Modal
        abierto={Boolean(docenteDetalleId)}
        titulo="Detalle del docente"
        onCerrar={() => setDocenteDetalleId(null)}
        className="max-w-4xl"
      >
        {detalleQuery.error ? <MensajeError mensaje={obtenerMensajeError(detalleQuery.error)} /> : null}
        {detalleQuery.isLoading ? <p>Cargando detalle...</p> : <DetalleDocente docente={docenteDetalle} />}
      </Modal>

      <ConfirmDialog
        abierto={Boolean(docenteDesactivar)}
        titulo="Desactivar docente"
        mensaje={`Confirma desactivar a ${nombreCompleto(docenteDesactivar?.persona)}?`}
        onCancelar={() => setDocenteDesactivar(null)}
        onConfirmar={() => desactivarMutation.mutate(docenteDesactivar.id)}
        cargando={desactivarMutation.isPending}
      />
    </div>
  )
}
