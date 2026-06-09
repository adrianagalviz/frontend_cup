import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, BookOpen, CheckCircle2, FileCheck, Search } from 'lucide-react'
import { toast } from 'sonner'
import BadgeEstado from '../../../components/common/BadgeEstado'
import Boton from '../../../components/common/Boton'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import EmptyState from '../../../components/common/EmptyState'
import Loader from '../../../components/common/Loader'
import MensajeError from '../../../components/common/MensajeError'
import TablaBase from '../../../components/tables/TablaBase'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import { obtenerMensajeError } from '../../../lib/errores'
import {
  listarExamenesHabilitadosAlumno,
  responderExamenAlumno,
  verExamenAlumno,
  verResultadoExamenAlumno,
} from '../../../services/examenes.service'

function texto(valor, alternativo = '-') {
  return valor || alternativo
}

function nombreGestion(gestion) {
  return gestion?.nombre || `${gestion?.anio || ''}-${gestion?.numero_gestion || ''}` || 'Sin gestion'
}

function preguntasPorMateria(preguntas = []) {
  return preguntas.reduce((grupos, pregunta) => {
    const nombre = pregunta.materia?.nombre || 'Sin materia'
    return { ...grupos, [nombre]: [...(grupos[nombre] || []), pregunta] }
  }, {})
}

function TarjetaDato({ etiqueta, valor }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase text-slate-500">{etiqueta}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{texto(valor)}</p>
    </div>
  )
}

function ResultadoExamen({ resultado, onVolver }) {
  if (!resultado) return null

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Resultado registrado</h2>
          <p className="mt-1 text-sm text-slate-600">{resultado.examen?.titulo || 'Examen finalizado'}</p>
        </div>
        <Boton variante="secundario" onClick={onVolver}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Boton>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <TarjetaDato etiqueta="Estado" valor={resultado.estado} />
        <TarjetaDato etiqueta="Parcial" valor={resultado.nota_parcial?.numero_parcial ? `Parcial ${resultado.nota_parcial.numero_parcial}` : undefined} />
        <TarjetaDato etiqueta="Nota total" valor={resultado.nota_total} />
      </div>
      <div className="rounded-md border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-950">Notas por materia</h3>
        <div className="mt-3 grid gap-2">
          {resultado.notas_por_materia?.length ? resultado.notas_por_materia.map((nota) => (
            <div key={nota.materia_id} className="grid gap-2 rounded-md bg-slate-50 px-3 py-2 sm:grid-cols-[1fr_auto_auto] sm:items-center">
              <span className="font-medium text-slate-950">{nota.materia}</span>
              <span className="text-sm text-slate-600">Porcentaje {nota.porcentaje_aplicado}%</span>
              <span className="font-semibold text-slate-950">Nota {nota.nota}</span>
            </div>
          )) : <EmptyState descripcion="El backend no devolvio notas por materia para este resultado." />}
        </div>
      </div>
    </div>
  )
}

function VistaListado({ examenes, cargando, onIniciar, onResultado, cargandoResultadoId }) {
  const columnas = useMemo(() => [
    {
      header: 'Examen',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-950">{row.original.titulo}</p>
          <p className="text-xs text-slate-500">{nombreGestion(row.original.gestion_academica)} | Parcial {row.original.numero_parcial}</p>
        </div>
      ),
    },
    {
      header: 'Vigencia',
      cell: ({ row }) => `${texto(row.original.fecha_inicio)} - ${texto(row.original.fecha_fin)}`,
    },
    {
      header: 'Materias',
      cell: ({ row }) => row.original.materias?.map((materia) => `${materia.materia} ${materia.porcentaje}%`).join(', ') || 'Sin materias',
    },
    {
      header: 'Estado',
      cell: ({ row }) => <BadgeEstado estado={row.original.ya_respondio ? 'finalizado' : 'habilitado'} />,
    },
    {
      header: 'Acciones',
      cell: ({ row }) => (
        row.original.ya_respondio ? (
          <Boton variante="secundario" className="min-h-9 px-3" cargando={cargandoResultadoId === row.original.id} onClick={() => onResultado(row.original)}>
            <FileCheck className="h-4 w-4" />
            Resultado
          </Boton>
        ) : (
          <Boton className="min-h-9 px-3" onClick={() => onIniciar(row.original)}>
            <BookOpen className="h-4 w-4" />
            Iniciar
          </Boton>
        )
      ),
    },
  ], [cargandoResultadoId, onIniciar, onResultado])

  return (
    <TablaBase
      columnas={columnas}
      datos={examenes}
      cargando={cargando}
      mensajeVacio="No existen examenes habilitados para tu gestion academica."
    />
  )
}

function VistaResolucion({ examen, respuestas, onResponder, onConfirmarEnvio, onVolver, enviando }) {
  const preguntas = examen?.preguntas || []
  const grupos = preguntasPorMateria(preguntas)
  const respondidas = Object.keys(respuestas).length
  const progreso = preguntas.length ? Math.round((respondidas / preguntas.length) * 100) : 0

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">{examen.titulo}</h2>
          <p className="mt-1 text-sm text-slate-600">{nombreGestion(examen.gestion_academica)} | Parcial {examen.numero_parcial}</p>
        </div>
        <Boton variante="secundario" onClick={onVolver} disabled={enviando}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Boton>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <TarjetaDato etiqueta="Preguntas" valor={preguntas.length} />
        <TarjetaDato etiqueta="Respondidas" valor={`${respondidas}/${preguntas.length}`} />
        <TarjetaDato etiqueta="Progreso" valor={`${progreso}%`} />
        <TarjetaDato etiqueta="Estado" valor="En resolucion" />
      </div>

      <div className="h-2 overflow-hidden rounded-md bg-slate-100">
        <div className="h-full bg-sky-700 transition-all" style={{ width: `${progreso}%` }} />
      </div>

      {Object.entries(grupos).map(([materia, preguntasMateria]) => (
        <section key={materia} className="grid gap-3 rounded-md border border-slate-200 bg-white p-4">
          <h3 className="text-base font-semibold text-slate-950">{materia}</h3>
          {preguntasMateria.map((pregunta, indice) => (
            <div key={pregunta.id} className="grid gap-3 rounded-md border border-slate-100 bg-slate-50 p-3">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Pregunta {indice + 1}</p>
                <p className="mt-1 font-semibold text-slate-950">{pregunta.enunciado}</p>
              </div>
              <div className="grid gap-2">
                {pregunta.opciones?.map((opcion) => (
                  <label key={opcion.id} className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 bg-white p-3 text-sm transition hover:border-sky-300">
                    <input
                      type="radio"
                      name={`pregunta-${pregunta.id}`}
                      checked={Number(respuestas[pregunta.id]) === Number(opcion.id)}
                      onChange={() => onResponder(pregunta.id, opcion.id)}
                      className="mt-0.5 h-4 w-4 accent-sky-700"
                      disabled={enviando}
                    />
                    <span>{opcion.texto_opcion}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}

      <div className="sticky bottom-4 flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-lg shadow-slate-950/10 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">Revisa tus respuestas antes de enviar. Despues del envio el backend bloquea cambios.</p>
        <Boton onClick={onConfirmarEnvio} cargando={enviando}>
          <CheckCircle2 className="h-4 w-4" />
          Enviar respuestas
        </Boton>
      </div>
    </div>
  )
}

export default function ExamenesAlumno() {
  const queryClient = useQueryClient()
  const [examenActivoId, setExamenActivoId] = useState(null)
  const [respuestas, setRespuestas] = useState({})
  const [confirmarEnvio, setConfirmarEnvio] = useState(false)
  const [mensajeValidacion, setMensajeValidacion] = useState('')
  const [resultado, setResultado] = useState(null)
  const [cargandoResultadoId, setCargandoResultadoId] = useState(null)

  const examenesQuery = useQuery({
    queryKey: ['alumno', 'examenes-habilitados'],
    queryFn: () => listarExamenesHabilitadosAlumno(),
  })

  const examenQuery = useQuery({
    queryKey: ['alumno', 'examen', examenActivoId],
    queryFn: () => verExamenAlumno(examenActivoId),
    enabled: Boolean(examenActivoId),
  })

  const examenActivo = examenQuery.data?.examen
  const preguntas = examenActivo?.preguntas || []
  const hayRespuestasSinEnviar = Boolean(examenActivo && Object.keys(respuestas).length)

  useEffect(() => {
    if (!hayRespuestasSinEnviar) return undefined

    const prevenirSalida = (evento) => {
      evento.preventDefault()
      evento.returnValue = ''
    }

    window.addEventListener('beforeunload', prevenirSalida)
    return () => window.removeEventListener('beforeunload', prevenirSalida)
  }, [hayRespuestasSinEnviar])

  const enviarMutation = useMutation({
    mutationFn: () => responderExamenAlumno(examenActivo.id, {
      respuestas: preguntas.map((pregunta) => ({
        pregunta_id: pregunta.id,
        opcion_pregunta_id: Number(respuestas[pregunta.id]),
      })),
    }),
    onSuccess: (respuesta) => {
      toast.success('Respuestas registradas correctamente.')
      setResultado(respuesta?.resultado || null)
      setConfirmarEnvio(false)
      setExamenActivoId(null)
      setRespuestas({})
      queryClient.invalidateQueries({ queryKey: ['alumno', 'examenes-habilitados'] })
    },
  })

  function iniciarExamen(examen) {
    setResultado(null)
    setMensajeValidacion('')
    setRespuestas({})
    setExamenActivoId(examen.id)
  }

  function responder(preguntaId, opcionId) {
    setRespuestas((actuales) => ({ ...actuales, [preguntaId]: opcionId }))
  }

  function solicitarEnvio() {
    const faltantes = preguntas.filter((pregunta) => !respuestas[pregunta.id])

    if (faltantes.length) {
      setMensajeValidacion(`Faltan ${faltantes.length} pregunta(s) por responder.`)
      return
    }

    setMensajeValidacion('')
    setConfirmarEnvio(true)
  }

  function volverListado() {
    setExamenActivoId(null)
    setRespuestas({})
    setMensajeValidacion('')
  }

  async function verResultado(examen) {
    setCargandoResultadoId(examen.id)
    try {
      const respuesta = await verResultadoExamenAlumno(examen.id)
      setResultado(respuesta?.resultado || null)
      setExamenActivoId(null)
      setRespuestas({})
    } catch (error) {
      toast.error(obtenerMensajeError(error))
    } finally {
      setCargandoResultadoId(null)
    }
  }

  const examenes = examenesQuery.data?.examenes || []

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Alumno', 'Examenes']} />
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Examenes habilitados</h1>
        <p className="mt-1 text-sm text-slate-600">Resolucion de examenes permitidos por backend para tu gestion academica.</p>
      </div>

      {examenesQuery.error ? <MensajeError mensaje={obtenerMensajeError(examenesQuery.error)} /> : null}
      {examenQuery.error ? <MensajeError mensaje={obtenerMensajeError(examenQuery.error)} /> : null}
      {enviarMutation.error ? <MensajeError mensaje={obtenerMensajeError(enviarMutation.error)} /> : null}
      {mensajeValidacion ? <MensajeError mensaje={mensajeValidacion} /> : null}

      {resultado ? (
        <ResultadoExamen resultado={resultado} onVolver={() => setResultado(null)} />
      ) : examenActivoId ? (
        examenQuery.isLoading ? <Loader texto="Cargando examen..." /> : examenActivo ? (
          <VistaResolucion
            examen={examenActivo}
            respuestas={respuestas}
            onResponder={responder}
            onConfirmarEnvio={solicitarEnvio}
            onVolver={volverListado}
            enviando={enviarMutation.isPending}
          />
        ) : <EmptyState descripcion="No se pudo cargar el examen seleccionado." />
      ) : (
        <>
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-sky-700" />
              <div>
                <p className="font-semibold text-slate-950">Examenes disponibles</p>
                <p className="text-sm text-slate-600">El listado muestra solo examenes habilitados y vigentes devueltos por Laravel.</p>
              </div>
            </div>
          </div>
          <VistaListado
            examenes={examenes}
            cargando={examenesQuery.isLoading}
            onIniciar={iniciarExamen}
            onResultado={verResultado}
            cargandoResultadoId={cargandoResultadoId}
          />
        </>
      )}

      <ConfirmDialog
        abierto={confirmarEnvio}
        titulo="Enviar respuestas"
        mensaje="Confirma enviar tus respuestas? Despues del envio no podras modificar este examen."
        onCancelar={() => setConfirmarEnvio(false)}
        onConfirmar={() => enviarMutation.mutate()}
        cargando={enviarMutation.isPending}
      />
    </div>
  )
}
