import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpenCheck, ListChecks, Percent, Plus, Search, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from 'sonner'
import BadgeEstado from '../../../components/common/BadgeEstado'
import Boton from '../../../components/common/Boton'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import Input from '../../../components/common/Input'
import MensajeError from '../../../components/common/MensajeError'
import Modal from '../../../components/common/Modal'
import Select from '../../../components/common/Select'
import Textarea from '../../../components/common/Textarea'
import TablaBase from '../../../components/tables/TablaBase'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import { obtenerMensajeError } from '../../../lib/errores'
import {
  asignarMateriasExamen,
  crearExamen,
  crearOpcionesPregunta,
  crearPreguntaExamen,
  deshabilitarExamen,
  habilitarExamen,
  listarExamenes,
} from '../../../services/examenes.service'
import { listarGestiones } from '../../../services/gestionAcademica.service'
import { listarMaterias } from '../../../services/materias.service'

const valoresExamen = {
  gestion_academica_id: '',
  numero_parcial: '1',
  titulo: '',
  descripcion: '',
  fecha_inicio: '',
  fecha_fin: '',
}

const opcionesIniciales = [
  { texto_opcion: '', es_correcta: true },
  { texto_opcion: '', es_correcta: false },
  { texto_opcion: '', es_correcta: false },
  { texto_opcion: '', es_correcta: false },
]

function texto(valor, alternativo = '-') {
  return valor || alternativo
}

function nombreGestion(gestion) {
  return gestion?.nombre || `${gestion?.anio || ''}-${gestion?.numero_gestion || ''}` || 'Sin gestion'
}

function sumaPorcentajes(porcentajes) {
  return Object.values(porcentajes).reduce((total, valor) => total + Number(valor || 0), 0)
}

function materiasDeExamen(examen) {
  return examen?.materias || []
}

function preguntasDeExamen(examen) {
  return examen?.preguntas || []
}

function FormularioExamen({ gestiones, onGuardar, onCancelar, cargando }) {
  const [form, setForm] = useState(valoresExamen)
  const [error, setError] = useState('')

  function actualizar(nombre, valor) {
    setForm((actual) => ({ ...actual, [nombre]: valor }))
  }

  function enviar(evento) {
    evento.preventDefault()
    if (!form.gestion_academica_id || !form.numero_parcial || !form.titulo.trim()) {
      setError('Gestion, parcial y titulo son obligatorios.')
      return
    }

    setError('')
    onGuardar({
      gestion_academica_id: Number(form.gestion_academica_id),
      numero_parcial: Number(form.numero_parcial),
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim() || undefined,
      fecha_inicio: form.fecha_inicio || undefined,
      fecha_fin: form.fecha_fin || undefined,
    })
  }

  return (
    <form onSubmit={enviar} className="grid gap-4">
      {error ? <MensajeError mensaje={error} /> : null}
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Gestion academica
        <Select value={form.gestion_academica_id} onChange={(evento) => actualizar('gestion_academica_id', evento.target.value)}>
          <option value="">Seleccionar gestion</option>
          {gestiones.map((gestion) => <option key={gestion.id} value={gestion.id}>{nombreGestion(gestion)}</option>)}
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Parcial
        <Select value={form.numero_parcial} onChange={(evento) => actualizar('numero_parcial', evento.target.value)}>
          <option value="1">Parcial 1</option>
          <option value="2">Parcial 2</option>
          <option value="3">Parcial 3</option>
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Titulo
        <Input value={form.titulo} onChange={(evento) => actualizar('titulo', evento.target.value)} placeholder="Ejemplo: Primer parcial CUP" />
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Descripcion
        <Textarea value={form.descripcion} onChange={(evento) => actualizar('descripcion', evento.target.value)} rows={3} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Fecha inicio
          <Input type="date" value={form.fecha_inicio} onChange={(evento) => actualizar('fecha_inicio', evento.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Fecha fin
          <Input type="date" value={form.fecha_fin} onChange={(evento) => actualizar('fecha_fin', evento.target.value)} />
        </label>
      </div>
      <div className="flex justify-end gap-3">
        <Boton variante="secundario" onClick={onCancelar}>Cancelar</Boton>
        <Boton type="submit" cargando={cargando}>Crear examen</Boton>
      </div>
    </form>
  )
}

function FormularioPorcentajes({ examen, materias, onGuardar, onCancelar, cargando }) {
  const valoresActuales = Object.fromEntries(materiasDeExamen(examen).map((item) => [String(item.materia_id), item.porcentaje]))
  const [porcentajes, setPorcentajes] = useState(() => Object.fromEntries(materias.map((materia) => [String(materia.id), valoresActuales[String(materia.id)] || ''])))
  const [error, setError] = useState('')
  const total = sumaPorcentajes(porcentajes)

  function enviar(evento) {
    evento.preventDefault()
    const materiasPayload = materias
      .map((materia) => ({
        materia_id: Number(materia.id),
        porcentaje: Number(porcentajes[String(materia.id)] || 0),
      }))
      .filter((item) => item.porcentaje > 0)

    if (!materiasPayload.length) {
      setError('Debes ingresar al menos una materia con porcentaje.')
      return
    }

    if (Math.round(total * 100) / 100 !== 100) {
      setError('La suma de porcentajes debe ser 100.')
      return
    }

    setError('')
    onGuardar({ materias: materiasPayload })
  }

  return (
    <form onSubmit={enviar} className="grid gap-4">
      {error ? <MensajeError mensaje={error} /> : null}
      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-semibold text-slate-950">{examen.titulo}</p>
        <p className="text-xs text-slate-500">Suma actual: {total}%</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {materias.map((materia) => (
          <label key={materia.id} className="grid gap-1 text-sm font-medium text-slate-700">
            {materia.nombre}
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={porcentajes[String(materia.id)] || ''}
              onChange={(evento) => setPorcentajes((actual) => ({ ...actual, [String(materia.id)]: evento.target.value }))}
            />
          </label>
        ))}
      </div>
      <div className="flex justify-end gap-3">
        <Boton variante="secundario" onClick={onCancelar}>Cancelar</Boton>
        <Boton type="submit" cargando={cargando}>Guardar porcentajes</Boton>
      </div>
    </form>
  )
}

function FormularioPregunta({ examen, onGuardar, onCancelar, cargando }) {
  const materias = materiasDeExamen(examen)
  const [form, setForm] = useState({ materia_id: materias[0]?.materia_id ? String(materias[0].materia_id) : '', enunciado: '', puntaje: '1' })
  const [opciones, setOpciones] = useState(opcionesIniciales)
  const [error, setError] = useState('')

  function actualizarOpcion(indice, valor) {
    setOpciones((actuales) => actuales.map((opcion, actualIndice) => actualIndice === indice ? { ...opcion, texto_opcion: valor } : opcion))
  }

  function marcarCorrecta(indice) {
    setOpciones((actuales) => actuales.map((opcion, actualIndice) => ({ ...opcion, es_correcta: actualIndice === indice })))
  }

  function enviar(evento) {
    evento.preventDefault()
    const opcionesValidas = opciones
      .map((opcion, indice) => ({ ...opcion, texto_opcion: opcion.texto_opcion.trim(), orden: indice + 1 }))
      .filter((opcion) => opcion.texto_opcion)

    if (!form.materia_id || !form.enunciado.trim()) {
      setError('Materia y enunciado son obligatorios.')
      return
    }

    if (opcionesValidas.length < 2) {
      setError('Cada pregunta debe tener al menos dos opciones.')
      return
    }

    if (opcionesValidas.filter((opcion) => opcion.es_correcta).length !== 1) {
      setError('Cada pregunta debe tener exactamente una opcion correcta.')
      return
    }

    setError('')
    onGuardar({
      pregunta: {
        materia_id: Number(form.materia_id),
        enunciado: form.enunciado.trim(),
        puntaje: Number(form.puntaje || 1),
        activa: true,
      },
      opciones: opcionesValidas,
    })
  }

  return (
    <form onSubmit={enviar} className="grid gap-4">
      {error ? <MensajeError mensaje={error} /> : null}
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Materia
        <Select value={form.materia_id} onChange={(evento) => setForm((actual) => ({ ...actual, materia_id: evento.target.value }))}>
          <option value="">Seleccionar materia</option>
          {materias.map((materia) => <option key={materia.materia_id} value={materia.materia_id}>{materia.materia}</option>)}
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Enunciado
        <Textarea value={form.enunciado} onChange={(evento) => setForm((actual) => ({ ...actual, enunciado: evento.target.value }))} rows={4} />
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Puntaje
        <Input type="number" min="0.01" max="100" step="0.01" value={form.puntaje} onChange={(evento) => setForm((actual) => ({ ...actual, puntaje: evento.target.value }))} />
      </label>
      <div className="grid gap-3">
        <p className="text-sm font-semibold text-slate-950">Opciones de respuesta</p>
        {opciones.map((opcion, indice) => (
          <div key={indice} className="grid gap-2 rounded-md border border-slate-200 p-3 sm:grid-cols-[auto_1fr] sm:items-center">
            <input
              type="radio"
              name="opcion_correcta"
              checked={opcion.es_correcta}
              onChange={() => marcarCorrecta(indice)}
              className="h-4 w-4 accent-sky-700"
              aria-label={`Opcion ${indice + 1} correcta`}
            />
            <Input value={opcion.texto_opcion} onChange={(evento) => actualizarOpcion(indice, evento.target.value)} placeholder={`Opcion ${indice + 1}`} />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-3">
        <Boton variante="secundario" onClick={onCancelar}>Cancelar</Boton>
        <Boton type="submit" cargando={cargando}>Crear pregunta</Boton>
      </div>
    </form>
  )
}

function DetalleExamen({ examen }) {
  if (!examen) return null

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-md border border-slate-200 p-3">
          <p className="text-xs font-medium uppercase text-slate-500">Materias</p>
          <p className="mt-1 text-xl font-bold text-slate-950">{materiasDeExamen(examen).length}</p>
        </div>
        <div className="rounded-md border border-slate-200 p-3">
          <p className="text-xs font-medium uppercase text-slate-500">Preguntas</p>
          <p className="mt-1 text-xl font-bold text-slate-950">{preguntasDeExamen(examen).length}</p>
        </div>
        <div className="rounded-md border border-slate-200 p-3">
          <p className="text-xs font-medium uppercase text-slate-500">Estado</p>
          <div className="mt-1"><BadgeEstado estado={examen.habilitado ? 'habilitado' : 'no habilitado'} /></div>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-950">Porcentajes por materia</h3>
        <div className="mt-2 grid gap-2">
          {materiasDeExamen(examen).length ? materiasDeExamen(examen).map((materia) => (
            <div key={materia.id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <span>{materia.materia}</span>
              <span className="font-semibold text-slate-950">{materia.porcentaje}%</span>
            </div>
          )) : <p className="text-sm text-slate-500">Sin materias registradas.</p>}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-950">Banco de preguntas</h3>
        <div className="mt-2 grid gap-3">
          {preguntasDeExamen(examen).length ? preguntasDeExamen(examen).map((pregunta) => (
            <div key={pregunta.id} className="rounded-md border border-slate-200 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-950">{pregunta.enunciado}</p>
                  <p className="text-xs text-slate-500">{pregunta.materia?.nombre} | {pregunta.tipo_pregunta} | Puntaje {pregunta.puntaje}</p>
                </div>
                <BadgeEstado estado={pregunta.activa ? 'activo' : 'inactivo'} />
              </div>
              <div className="mt-3 grid gap-2">
                {pregunta.opciones?.map((opcion) => (
                  <div key={opcion.id || opcion.orden} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                    <span>{opcion.orden}. {opcion.texto_opcion}</span>
                    {opcion.es_correcta ? <BadgeEstado estado="aprobado" /> : null}
                  </div>
                ))}
              </div>
            </div>
          )) : <p className="text-sm text-slate-500">Sin preguntas registradas.</p>}
        </div>
      </div>
    </div>
  )
}

export default function GestionExamenes() {
  const queryClient = useQueryClient()
  const [filtros, setFiltros] = useState({ gestion_academica_id: '', numero_parcial: '', habilitado: '' })
  const [params, setParams] = useState({ por_pagina: 100 })
  const [modalExamen, setModalExamen] = useState(false)
  const [examenPorcentajes, setExamenPorcentajes] = useState(null)
  const [examenPregunta, setExamenPregunta] = useState(null)
  const [examenDetalle, setExamenDetalle] = useState(null)
  const [examenEstado, setExamenEstado] = useState(null)

  const examenesQuery = useQuery({
    queryKey: ['examenes-admin', params],
    queryFn: () => listarExamenes(params),
  })

  const gestionesQuery = useQuery({
    queryKey: ['gestiones-academicas', 'examenes'],
    queryFn: () => listarGestiones({ por_pagina: 100 }),
  })

  const materiasQuery = useQuery({
    queryKey: ['materias', 'examenes'],
    queryFn: () => listarMaterias(),
  })

  const examenes = examenesQuery.data || []
  const gestiones = gestionesQuery.data || []
  const materias = materiasQuery.data?.materias || []
  const error = examenesQuery.error || gestionesQuery.error || materiasQuery.error

  function invalidarExamenes() {
    queryClient.invalidateQueries({ queryKey: ['examenes-admin'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'examenes'] })
  }

  const crearExamenMutation = useMutation({
    mutationFn: crearExamen,
    onSuccess: () => {
      toast.success('Examen creado correctamente.')
      setModalExamen(false)
      invalidarExamenes()
    },
  })

  const porcentajesMutation = useMutation({
    mutationFn: ({ id, payload }) => asignarMateriasExamen(id, payload),
    onSuccess: () => {
      toast.success('Porcentajes registrados correctamente.')
      setExamenPorcentajes(null)
      invalidarExamenes()
    },
  })

  const preguntaMutation = useMutation({
    mutationFn: async ({ examenId, payload }) => {
      const respuesta = await crearPreguntaExamen(examenId, payload.pregunta)
      const preguntaId = respuesta?.pregunta?.id
      if (!preguntaId) return respuesta
      return crearOpcionesPregunta(preguntaId, { opciones: payload.opciones })
    },
    onSuccess: () => {
      toast.success('Pregunta y opciones registradas correctamente.')
      setExamenPregunta(null)
      invalidarExamenes()
    },
  })

  const estadoMutation = useMutation({
    mutationFn: (examen) => (examen.habilitado ? deshabilitarExamen(examen.id) : habilitarExamen(examen.id)),
    onSuccess: () => {
      toast.success('Estado del examen actualizado correctamente.')
      setExamenEstado(null)
      invalidarExamenes()
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
      numero_parcial: filtros.numero_parcial || undefined,
      habilitado: filtros.habilitado || undefined,
    })
  }

  const columnas = useMemo(() => [
    {
      header: 'Examen',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-950">{row.original.titulo}</p>
          <p className="text-xs text-slate-500">{row.original.gestion_academica?.nombre || 'Sin gestion'} | Parcial {row.original.numero_parcial}</p>
        </div>
      ),
    },
    {
      header: 'Vigencia',
      cell: ({ row }) => `${texto(row.original.fecha_inicio)} - ${texto(row.original.fecha_fin)}`,
    },
    {
      header: 'Estructura',
      cell: ({ row }) => `${materiasDeExamen(row.original).length} materias | ${preguntasDeExamen(row.original).length} preguntas`,
    },
    {
      header: 'Estado',
      cell: ({ row }) => <BadgeEstado estado={row.original.habilitado ? 'habilitado' : 'no habilitado'} />,
    },
    {
      header: 'Acciones',
      cell: ({ row }) => {
        const examen = row.original
        return (
          <div className="flex flex-wrap gap-2">
            <Boton variante="secundario" className="min-h-9 px-3" title="Ver detalle" onClick={() => setExamenDetalle(examen)}>
              <ListChecks className="h-4 w-4" />
            </Boton>
            <Boton variante="secundario" className="min-h-9 px-3" title="Porcentajes" disabled={examen.habilitado} onClick={() => setExamenPorcentajes(examen)}>
              <Percent className="h-4 w-4" />
            </Boton>
            <Boton variante="secundario" className="min-h-9 px-3" title="Crear pregunta" disabled={examen.habilitado || !materiasDeExamen(examen).length} onClick={() => setExamenPregunta(examen)}>
              <Plus className="h-4 w-4" />
            </Boton>
            <Boton variante={examen.habilitado ? 'neutro' : 'primario'} className="min-h-9 px-3" title={examen.habilitado ? 'Deshabilitar' : 'Habilitar'} onClick={() => setExamenEstado(examen)}>
              {examen.habilitado ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
            </Boton>
          </div>
        )
      },
    },
  ], [])

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Administrador', 'Examenes']} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Examenes y preguntas</h1>
          <p className="mt-1 text-sm text-slate-600">Creacion de examenes, porcentajes por materia, preguntas de seleccion multiple y habilitacion.</p>
        </div>
        <Boton onClick={() => setModalExamen(true)}>
          <BookOpenCheck className="h-4 w-4" />
          Crear examen
        </Boton>
      </div>

      {error ? <MensajeError mensaje={obtenerMensajeError(error)} /> : null}
      {crearExamenMutation.error ? <MensajeError mensaje={obtenerMensajeError(crearExamenMutation.error)} /> : null}
      {porcentajesMutation.error ? <MensajeError mensaje={obtenerMensajeError(porcentajesMutation.error)} /> : null}
      {preguntaMutation.error ? <MensajeError mensaje={obtenerMensajeError(preguntaMutation.error)} /> : null}
      {estadoMutation.error ? <MensajeError mensaje={obtenerMensajeError(estadoMutation.error)} /> : null}

      <form onSubmit={aplicarFiltros} className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Gestion
          <Select value={filtros.gestion_academica_id} onChange={(evento) => cambiarFiltro('gestion_academica_id', evento.target.value)}>
            <option value="">Todas</option>
            {gestiones.map((gestion) => <option key={gestion.id} value={gestion.id}>{nombreGestion(gestion)}</option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Parcial
          <Select value={filtros.numero_parcial} onChange={(evento) => cambiarFiltro('numero_parcial', evento.target.value)}>
            <option value="">Todos</option>
            <option value="1">Parcial 1</option>
            <option value="2">Parcial 2</option>
            <option value="3">Parcial 3</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Estado
          <Select value={filtros.habilitado} onChange={(evento) => cambiarFiltro('habilitado', evento.target.value)}>
            <option value="">Todos</option>
            <option value="true">Habilitado</option>
            <option value="false">No habilitado</option>
          </Select>
        </label>
        <div className="flex items-end">
          <Boton type="submit" className="w-full">
            <Search className="h-4 w-4" />
            Filtrar
          </Boton>
        </div>
      </form>

      <TablaBase columnas={columnas} datos={examenes} cargando={examenesQuery.isLoading} mensajeVacio="No existen examenes con los filtros seleccionados." />

      <Modal abierto={modalExamen} titulo="Crear examen" onCerrar={() => setModalExamen(false)} className="max-w-2xl" acciones={null}>
        <FormularioExamen
          gestiones={gestiones}
          onGuardar={(payload) => crearExamenMutation.mutate(payload)}
          onCancelar={() => setModalExamen(false)}
          cargando={crearExamenMutation.isPending}
        />
      </Modal>

      <Modal abierto={Boolean(examenPorcentajes)} titulo="Porcentajes por materia" onCerrar={() => setExamenPorcentajes(null)} className="max-w-2xl" acciones={null}>
        {examenPorcentajes ? (
          <FormularioPorcentajes
            examen={examenPorcentajes}
            materias={materias}
            onGuardar={(payload) => porcentajesMutation.mutate({ id: examenPorcentajes.id, payload })}
            onCancelar={() => setExamenPorcentajes(null)}
            cargando={porcentajesMutation.isPending}
          />
        ) : null}
      </Modal>

      <Modal abierto={Boolean(examenPregunta)} titulo="Crear pregunta de seleccion multiple" onCerrar={() => setExamenPregunta(null)} className="max-w-3xl" acciones={null}>
        {examenPregunta ? (
          <FormularioPregunta
            examen={examenPregunta}
            onGuardar={(payload) => preguntaMutation.mutate({ examenId: examenPregunta.id, payload })}
            onCancelar={() => setExamenPregunta(null)}
            cargando={preguntaMutation.isPending}
          />
        ) : null}
      </Modal>

      <Modal abierto={Boolean(examenDetalle)} titulo="Detalle del examen" onCerrar={() => setExamenDetalle(null)} className="max-w-4xl">
        <DetalleExamen examen={examenDetalle} />
      </Modal>

      <ConfirmDialog
        abierto={Boolean(examenEstado)}
        titulo={examenEstado?.habilitado ? 'Deshabilitar examen' : 'Habilitar examen'}
        mensaje={examenEstado?.habilitado ? 'Confirma deshabilitar este examen?' : 'Confirma habilitar este examen? El backend validara materias, preguntas y opciones.'}
        onCancelar={() => setExamenEstado(null)}
        onConfirmar={() => estadoMutation.mutate(examenEstado)}
        cargando={estadoMutation.isPending}
      />
    </div>
  )
}
