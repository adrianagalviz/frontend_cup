import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, Plus, PowerOff } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import AccionesTabla from '../../../components/tables/AccionesTabla'
import BadgeEstado from '../../../components/common/BadgeEstado'
import Boton from '../../../components/common/Boton'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import MensajeError from '../../../components/common/MensajeError'
import Modal from '../../../components/common/Modal'
import Select from '../../../components/common/Select'
import TablaBase from '../../../components/tables/TablaBase'
import PaginacionTabla from '../../../components/tables/PaginacionTabla'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import { crearAsignacion, desactivarAsignacion, listarAsignaciones, listarAsignacionesDocente } from '../../../services/asignaciones.service'
import { listarDocentes } from '../../../services/docentes.service'
import { listarGestiones } from '../../../services/gestionAcademica.service'
import { listarGrupos } from '../../../services/grupos.service'
import { listarHorarios } from '../../../services/horarios.service'
import { listarMaterias } from '../../../services/materias.service'
import { obtenerErroresValidacion, obtenerMensajeError } from '../../../lib/errores'

const schemaAsignacion = z.object({
  docente_id: z.string().min(1, 'El docente es obligatorio.'),
  grupo_id: z.string().min(1, 'El grupo es obligatorio.'),
  materia_id: z.string().min(1, 'La materia es obligatoria.'),
  gestion_academica_id: z.string().min(1, 'La gestion academica es obligatoria.'),
  horario_clase_id: z.string().min(1, 'El horario de clase es obligatorio.'),
})

function nombreDocente(docente) {
  return [docente?.persona?.nombres || docente?.nombres, docente?.persona?.apellido_paterno || docente?.apellido_paterno, docente?.persona?.apellido_materno || docente?.apellido_materno]
    .filter(Boolean)
    .join(' ') || 'Sin docente'
}

function extraerErrores(error) {
  const errores = obtenerErroresValidacion(error)

  return Object.fromEntries(
    Object.entries(errores).map(([campo, mensajes]) => [campo, Array.isArray(mensajes) ? mensajes[0] : String(mensajes)]),
  )
}

function erroresZod(resultado) {
  if (resultado.success) return {}

  return Object.fromEntries(resultado.error.issues.map((issue) => [issue.path[0], issue.message]))
}

function SelectForm({ label, value, error, onChange, options }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      <span>{label} *</span>
      <Select value={value} error={error} onChange={(event) => onChange(event.target.value)}>
        <option value="">Seleccionar</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </Select>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  )
}

function FormularioAsignacion({ docentes, grupos, materias, gestiones, horarios, asignacionesActuales, onDocenteChange, onGuardar, onCancelar, cargando }) {
  const [form, setForm] = useState({ docente_id: '', grupo_id: '', materia_id: '', gestion_academica_id: '', horario_clase_id: '' })
  const [errores, setErrores] = useState({})
  const horariosFiltrados = horarios.filter((horario) => {
    if (form.gestion_academica_id && String(horario.gestion_academica?.id) !== String(form.gestion_academica_id)) return false
    if (form.grupo_id && String(horario.grupo?.id) !== String(form.grupo_id)) return false
    if (form.materia_id && String(horario.materia?.id) !== String(form.materia_id)) return false
    return true
  })

  async function enviar(event) {
    event.preventDefault()
    const validacion = schemaAsignacion.safeParse(form)

    if (!validacion.success) {
      setErrores(erroresZod(validacion))
      return
    }

    try {
      setErrores({})
      await onGuardar(Object.fromEntries(Object.entries(validacion.data).map(([key, value]) => [key, Number(value)])))
    } catch (error) {
      setErrores(extraerErrores(error))
    }
  }

  function actualizar(nombre, valor) {
    setForm((actual) => ({
      ...actual,
      [nombre]: valor,
      ...(nombre === 'grupo_id' || nombre === 'materia_id' || nombre === 'gestion_academica_id' ? { horario_clase_id: '' } : {}),
    }))

    if (nombre === 'docente_id') onDocenteChange(valor)
  }

  return (
    <form className="grid gap-4" onSubmit={enviar}>
      <div className="grid gap-4 md:grid-cols-2">
        <SelectForm label="Docente" value={form.docente_id} error={errores.docente_id} onChange={(value) => actualizar('docente_id', value)} options={docentes.map((docente) => ({ value: docente.id, label: nombreDocente(docente) }))} />
        <SelectForm label="Gestion academica" value={form.gestion_academica_id} error={errores.gestion_academica_id} onChange={(value) => actualizar('gestion_academica_id', value)} options={gestiones.map((gestion) => ({ value: gestion.id, label: gestion.nombre }))} />
        <SelectForm label="Grupo" value={form.grupo_id} error={errores.grupo_id} onChange={(value) => actualizar('grupo_id', value)} options={grupos.map((grupo) => ({ value: grupo.id, label: `${grupo.nombre} - ${grupo.gestion_academica?.nombre || 'Sin gestion'}` }))} />
        <SelectForm label="Materia" value={form.materia_id} error={errores.materia_id} onChange={(value) => actualizar('materia_id', value)} options={materias.map((materia) => ({ value: materia.id, label: materia.nombre }))} />
      </div>
      <SelectForm
        label="Horario de clase"
        value={form.horario_clase_id}
        error={errores.horario_clase_id}
        onChange={(value) => actualizar('horario_clase_id', value)}
        options={horariosFiltrados.map((horario) => ({
          value: horario.id,
          label: `${horario.dia?.nombre || '-'} ${horario.hora_inicio} - ${horario.hora_fin} | ${horario.aula?.ubicacion || 'Sin aula'}`,
        }))}
      />

      <section className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
        <h3 className="text-sm font-semibold text-slate-950">Asignaciones actuales del docente</h3>
        {form.docente_id ? (
          asignacionesActuales.length ? (
            <div className="grid gap-2">
              {asignacionesActuales.map((asignacion) => (
                <div key={asignacion.id} className="rounded-md bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200">
                  {asignacion.materia?.nombre || 'Materia'} | {asignacion.grupo?.nombre || 'Grupo'} | {asignacion.horario?.dia || 'Dia'} {asignacion.horario?.hora_inicio} - {asignacion.horario?.hora_fin}
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-slate-500">El docente no tiene asignaciones registradas.</p>
        ) : <p className="text-sm text-slate-500">Selecciona un docente para ver sus asignaciones.</p>}
      </section>

      <div className="flex justify-end gap-3">
        <Boton variante="secundario" onClick={onCancelar}>Cancelar</Boton>
        <Boton type="submit" cargando={cargando}>Crear asignacion</Boton>
      </div>
    </form>
  )
}

function DetalleAsignacion({ asignacion }) {
  if (!asignacion) return null

  return (
    <dl className="grid gap-3 md:grid-cols-2">
      <Dato etiqueta="Docente" valor={nombreDocente(asignacion.docente)} />
      <Dato etiqueta="Materia" valor={asignacion.materia?.nombre} />
      <Dato etiqueta="Grupo" valor={asignacion.grupo?.nombre} />
      <Dato etiqueta="Gestion" valor={asignacion.gestion_academica?.nombre} />
      <Dato etiqueta="Horario" valor={`${asignacion.horario?.dia || '-'} ${asignacion.horario?.hora_inicio || ''} - ${asignacion.horario?.hora_fin || ''}`} />
      <Dato etiqueta="Aula" valor={asignacion.horario?.aula} />
    </dl>
  )
}

function Dato({ etiqueta, valor }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <dt className="text-xs font-medium uppercase text-slate-500">{etiqueta}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-950">{valor || 'Sin dato'}</dd>
    </div>
  )
}

export default function GestionAsignaciones() {
  const queryClient = useQueryClient()
  const [pagina, setPagina] = useState(1)
  const [filtros, setFiltros] = useState({ docente_id: '', grupo_id: '', materia_id: '', activo: '' })
  const [modalFormulario, setModalFormulario] = useState(false)
  const [asignacionDetalle, setAsignacionDetalle] = useState(null)
  const [asignacionDesactivar, setAsignacionDesactivar] = useState(null)
  const [docenteFormulario, setDocenteFormulario] = useState('')
  const [mensajeError, setMensajeError] = useState('')

  const params = {
    page: pagina,
    por_pagina: 10,
    docente_id: filtros.docente_id || undefined,
    grupo_id: filtros.grupo_id || undefined,
    materia_id: filtros.materia_id || undefined,
    activo: filtros.activo || undefined,
  }

  const asignacionesQuery = useQuery({
    queryKey: ['asignaciones', params],
    queryFn: () => listarAsignaciones(params),
  })
  const docentesQuery = useQuery({ queryKey: ['docentes', 'asignaciones'], queryFn: () => listarDocentes({ activo: 'true', por_pagina: 100 }) })
  const gruposQuery = useQuery({ queryKey: ['grupos', 'asignaciones'], queryFn: () => listarGrupos({ activo: 'true', por_pagina: 100 }) })
  const materiasQuery = useQuery({ queryKey: ['materias'], queryFn: () => listarMaterias() })
  const gestionesQuery = useQuery({ queryKey: ['gestiones-academicas'], queryFn: () => listarGestiones() })
  const horariosQuery = useQuery({ queryKey: ['horarios', 'asignaciones'], queryFn: () => listarHorarios({ activo: 'true', por_pagina: 100 }) })
  const asignacionesDocenteQuery = useQuery({
    queryKey: ['asignaciones', 'docente', docenteFormulario],
    queryFn: () => listarAsignacionesDocente(docenteFormulario),
    enabled: Boolean(docenteFormulario),
  })

  const asignaciones = asignacionesQuery.data?.datos || []
  const meta = asignacionesQuery.data?.meta || { pagina_actual: pagina, ultima_pagina: 1, total: asignaciones.length }
  const docentes = docentesQuery.data?.datos || []
  const grupos = gruposQuery.data?.datos || []
  const materias = materiasQuery.data?.materias || []
  const gestiones = gestionesQuery.data || []
  const horarios = horariosQuery.data?.datos || []
  const asignacionesActuales = asignacionesDocenteQuery.data?.asignaciones || []

  const crearMutation = useMutation({
    mutationFn: crearAsignacion,
    onSuccess: () => {
      toast.success('Asignacion creada correctamente.')
      setModalFormulario(false)
      setDocenteFormulario('')
      queryClient.invalidateQueries({ queryKey: ['asignaciones'] })
    },
    onError: (error) => setMensajeError(obtenerMensajeError(error)),
  })

  const desactivarMutation = useMutation({
    mutationFn: desactivarAsignacion,
    onSuccess: () => {
      toast.success('Asignacion desactivada correctamente.')
      setAsignacionDesactivar(null)
      queryClient.invalidateQueries({ queryKey: ['asignaciones'] })
    },
    onError: (error) => setMensajeError(obtenerMensajeError(error)),
  })

  const columnas = useMemo(() => [
    {
      header: 'Docente',
      cell: ({ row }) => <span className="font-semibold text-slate-950">{nombreDocente(row.original.docente)}</span>,
    },
    {
      header: 'Materia y grupo',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-950">{row.original.materia?.nombre || 'Sin materia'}</p>
          <p className="text-xs text-slate-500">{row.original.grupo?.nombre || 'Sin grupo'}</p>
        </div>
      ),
    },
    {
      header: 'Horario',
      cell: ({ row }) => `${row.original.horario?.dia || '-'} ${row.original.horario?.hora_inicio || ''} - ${row.original.horario?.hora_fin || ''}`,
    },
    {
      header: 'Aula',
      cell: ({ row }) => row.original.horario?.aula || 'Sin aula',
    },
    {
      header: 'Estado',
      cell: ({ row }) => <BadgeEstado estado={row.original.activo ? 'activo' : 'inactivo'} />,
    },
    {
      header: 'Acciones',
      cell: ({ row }) => (
        <AccionesTabla>
          <Boton variante="secundario" className="min-h-9 px-3" title="Ver detalle" onClick={() => setAsignacionDetalle(row.original)}>
            <Eye className="h-4 w-4" />
          </Boton>
          {row.original.activo ? (
            <Boton variante="peligro" className="min-h-9 px-3" title="Desactivar asignacion" onClick={() => setAsignacionDesactivar(row.original)}>
              <PowerOff className="h-4 w-4" />
            </Boton>
          ) : null}
        </AccionesTabla>
      ),
    },
  ], [])

  function actualizarFiltro(nombre, valor) {
    setPagina(1)
    setFiltros((actual) => ({ ...actual, [nombre]: valor }))
  }

  const totalPaginas = Number(meta.ultima_pagina || 1)

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Administrador', 'Asignaciones']} />
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Asignaciones docente-materia-grupo</h1>
          <p className="mt-1 text-sm text-slate-600">Administracion de docentes asignados a materias, grupos y horarios.</p>
        </div>
        <Boton onClick={() => {
          setMensajeError('')
          setDocenteFormulario('')
          setModalFormulario(true)
        }}>
          <Plus className="h-4 w-4" />
          Crear asignacion
        </Boton>
      </div>

      {mensajeError ? <MensajeError mensaje={mensajeError} /> : null}
      {asignacionesQuery.error ? <MensajeError mensaje={obtenerMensajeError(asignacionesQuery.error)} /> : null}

      <section className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 md:grid-cols-4">
        <Filtro label="Docente" value={filtros.docente_id} onChange={(value) => actualizarFiltro('docente_id', value)} options={docentes.map((docente) => ({ value: docente.id, label: nombreDocente(docente) }))} />
        <Filtro label="Grupo" value={filtros.grupo_id} onChange={(value) => actualizarFiltro('grupo_id', value)} options={grupos.map((grupo) => ({ value: grupo.id, label: grupo.nombre }))} />
        <Filtro label="Materia" value={filtros.materia_id} onChange={(value) => actualizarFiltro('materia_id', value)} options={materias.map((materia) => ({ value: materia.id, label: materia.nombre }))} />
        <Filtro label="Estado" value={filtros.activo} onChange={(value) => actualizarFiltro('activo', value)} options={[{ value: 'true', label: 'Activo' }, { value: 'false', label: 'Inactivo' }]} />
      </section>

      <div>
        <TablaBase columnas={columnas} datos={asignaciones} cargando={asignacionesQuery.isLoading} mensajeVacio="No existen asignaciones con los filtros seleccionados." />
        {asignaciones.length ? (
          <PaginacionTabla
            pagina={Number(meta.pagina_actual || pagina)}
            totalPaginas={totalPaginas}
            onAnterior={() => setPagina((valor) => Math.max(1, valor - 1))}
            onSiguiente={() => setPagina((valor) => Math.min(totalPaginas, valor + 1))}
          />
        ) : null}
      </div>

      <Modal abierto={modalFormulario} titulo="Crear asignacion" onCerrar={() => setModalFormulario(false)} acciones={<></>} className="max-w-4xl">
        <FormularioAsignacion
          key={modalFormulario ? 'formulario-asignacion-abierto' : 'formulario-asignacion-cerrado'}
          docentes={docentes}
          grupos={grupos}
          materias={materias}
          gestiones={gestiones}
          horarios={horarios}
          asignacionesActuales={asignacionesActuales}
          onDocenteChange={setDocenteFormulario}
          onGuardar={(payload) => {
            return crearMutation.mutateAsync(payload)
          }}
          onCancelar={() => setModalFormulario(false)}
          cargando={crearMutation.isPending}
        />
      </Modal>

      <Modal abierto={Boolean(asignacionDetalle)} titulo="Detalle de asignacion" onCerrar={() => setAsignacionDetalle(null)} className="max-w-3xl">
        <DetalleAsignacion asignacion={asignacionDetalle} />
      </Modal>

      <ConfirmDialog
        abierto={Boolean(asignacionDesactivar)}
        titulo="Desactivar asignacion"
        mensaje={`Confirma desactivar la asignacion de ${nombreDocente(asignacionDesactivar?.docente)}?`}
        onCancelar={() => setAsignacionDesactivar(null)}
        onConfirmar={() => desactivarMutation.mutate(asignacionDesactivar.id)}
        cargando={desactivarMutation.isPending}
      />
    </div>
  )
}

function Filtro({ label, value, onChange, options }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <Select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Todos</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </Select>
    </label>
  )
}
