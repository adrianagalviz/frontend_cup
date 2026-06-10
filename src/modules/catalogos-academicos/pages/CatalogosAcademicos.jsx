import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit, Eye, Plus, Power, PowerOff, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
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
import { crearAula, editarAula, listarAulas } from '../../../services/aulas.service'
import { listarDocentes } from '../../../services/docentes.service'
import { listarGestiones } from '../../../services/gestionAcademica.service'
import { calcularGruposNecesarios, crearGrupo, desactivarGrupo, editarGrupo, listarAlumnosGrupo, listarGrupos } from '../../../services/grupos.service'
import { crearHorario, crearPeriodo, crearTurno, editarTurno, eliminarTurno, listarDias, listarHorarios, listarPeriodos, listarTurnos } from '../../../services/horarios.service'
import { listarMaterias } from '../../../services/materias.service'
import { obtenerErroresValidacion, obtenerMensajeError } from '../../../lib/errores'

const tabs = [
  { id: 'materias', label: 'Materias' },
  { id: 'grupos', label: 'Grupos' },
  { id: 'aulas', label: 'Aulas' },
  { id: 'dias', label: 'Dias' },
  { id: 'turnos', label: 'Turnos' },
  { id: 'periodos', label: 'Periodos' },
  { id: 'horarios', label: 'Horarios' },
]

const DURACION_TURNO_MINUTOS = 360
const DURACION_PERIODO_MINUTOS = 90

const schemaGrupo = z.object({
  gestion_academica_id: z.string().min(1, 'La gestion academica es obligatoria.'),
  nombre: z.string().min(1, 'El nombre del grupo es obligatorio.'),
  cupo_maximo: z.coerce.number().min(1, 'El cupo minimo es 1.').max(70, 'El cupo maximo permitido es 70.'),
})

const schemaAula = z.object({
  aula: z.string().min(1, 'La ubicacion del aula es obligatoria.'),
})

const schemaTurno = z.object({
  nombre: z.string().min(1, 'El nombre del turno es obligatorio.'),
  hora_inicio: z.string().min(1, 'La hora de inicio es obligatoria.'),
  hora_fin: z.string().min(1, 'La hora de fin es obligatoria.'),
}).refine((values) => values.hora_inicio < values.hora_fin, {
  path: ['hora_fin'],
  message: 'La hora de fin debe ser posterior a la hora de inicio.',
}).refine((values) => {
  const minutos = diferenciaMinutos(values.hora_inicio, values.hora_fin)
  return minutos === DURACION_TURNO_MINUTOS
}, {
  path: ['hora_fin'],
  message: 'El turno debe durar exactamente 6 horas y dividirse en 4 periodos de 90 minutos.',
})

const schemaPeriodo = z.object({
  turno_id: z.string().min(1, 'El turno es obligatorio.'),
  numero_periodo: z.coerce.number().min(1, 'El numero de periodo es obligatorio.'),
  hora_inicio: z.string().min(1, 'La hora de inicio es obligatoria.'),
  hora_fin: z.string().min(1, 'La hora de fin es obligatoria.'),
}).refine((values) => diferenciaMinutos(values.hora_inicio, values.hora_fin) === DURACION_PERIODO_MINUTOS, {
  path: ['hora_fin'],
  message: 'Cada periodo debe durar exactamente 90 minutos.',
})

const schemaHorario = z.object({
  gestion_academica_id: z.string().min(1, 'La gestion academica es obligatoria.'),
  grupo_id: z.string().min(1, 'El grupo es obligatorio.'),
  materia_id: z.string().min(1, 'La materia es obligatoria.'),
  docente_id: z.string().min(1, 'El docente es obligatorio.'),
  aula_id: z.string().min(1, 'El aula es obligatoria.'),
  dia_ids: z.array(z.string()).min(1, 'Selecciona al menos un dia.'),
  turno_id: z.string().min(1, 'El turno es obligatorio.'),
  periodo_id: z.string().min(1, 'El periodo es obligatorio.'),
})

function estadoActivo(valor) {
  return valor ? 'activo' : 'inactivo'
}

function nombrePersona(persona) {
  return [persona?.nombres, persona?.apellido_paterno, persona?.apellido_materno].filter(Boolean).join(' ') || 'Sin nombre'
}

function nombreDocente(docente) {
  return nombrePersona(docente?.persona || docente)
}

function diferenciaMinutos(inicio, fin) {
  if (!inicio || !fin) return 0

  const [inicioHora, inicioMinuto] = inicio.split(':').map(Number)
  const [finHora, finMinuto] = fin.split(':').map(Number)

  return (finHora * 60 + finMinuto) - (inicioHora * 60 + inicioMinuto)
}

function minutosATiempo(totalMinutos) {
  const horas = Math.floor(totalMinutos / 60).toString().padStart(2, '0')
  const minutos = (totalMinutos % 60).toString().padStart(2, '0')

  return `${horas}:${minutos}`
}

function tiempoAMinutos(valor) {
  if (!valor) return 0

  const [hora, minuto] = valor.split(':').map(Number)

  return (hora * 60) + minuto
}

function generarVistaPreviaPeriodos(inicio, fin) {
  const duracion = diferenciaMinutos(inicio, fin)

  if (!inicio || !fin || duracion <= 0 || duracion % DURACION_PERIODO_MINUTOS !== 0) return []

  const base = tiempoAMinutos(inicio)
  const totalPeriodos = duracion / DURACION_PERIODO_MINUTOS

  return Array.from({ length: totalPeriodos }, (_, index) => ({
    numero: index + 1,
    inicio: minutosATiempo(base + (index * DURACION_PERIODO_MINUTOS)),
    fin: minutosATiempo(base + ((index + 1) * DURACION_PERIODO_MINUTOS)),
  }))
}

function proximaClase(horarios = []) {
  return horarios.find((horario) => horario.activo) || horarios[0]
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

function FormularioGrupo({ grupo, gestiones = [], onGuardar, onCancelar, cargando }) {
  const [form, setForm] = useState({
    gestion_academica_id: grupo?.gestion_academica?.id ? String(grupo.gestion_academica.id) : '',
    nombre: grupo?.nombre || '',
    cupo_maximo: grupo?.cupo_maximo || 70,
  })
  const [errores, setErrores] = useState({})

  async function enviar(event) {
    event.preventDefault()
    const validacion = schemaGrupo.safeParse(form)

    if (!validacion.success) {
      setErrores(erroresZod(validacion))
      return
    }

    try {
      setErrores({})
      await onGuardar({
        gestion_academica_id: Number(validacion.data.gestion_academica_id),
        nombre: validacion.data.nombre,
        cupo_maximo: validacion.data.cupo_maximo,
      })
    } catch (error) {
      setErrores(extraerErrores(error))
    }
  }

  return (
    <form className="grid gap-4" onSubmit={enviar}>
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        <span>Gestion academica *</span>
        <Select value={form.gestion_academica_id} error={errores.gestion_academica_id} onChange={(event) => setForm((actual) => ({ ...actual, gestion_academica_id: event.target.value }))}>
          <option value="">Seleccionar gestion</option>
          {gestiones.map((gestion) => <option key={gestion.id} value={gestion.id}>{gestion.nombre}</option>)}
        </Select>
        {errores.gestion_academica_id ? <span className="text-xs text-red-600">{errores.gestion_academica_id}</span> : null}
      </label>

      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        <span>Nombre del grupo *</span>
        <Input value={form.nombre} error={errores.nombre} onChange={(event) => setForm((actual) => ({ ...actual, nombre: event.target.value }))} placeholder="Grupo A" />
        {errores.nombre ? <span className="text-xs text-red-600">{errores.nombre}</span> : null}
      </label>

      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        <span>Capacidad maxima *</span>
        <Input type="number" min="1" max="70" value={form.cupo_maximo} error={errores.cupo_maximo} onChange={(event) => setForm((actual) => ({ ...actual, cupo_maximo: event.target.value }))} />
        <span className="text-xs text-slate-500">Maximo permitido: 70 alumnos por grupo.</span>
        {errores.cupo_maximo ? <span className="text-xs text-red-600">{errores.cupo_maximo}</span> : null}
      </label>

      <div className="flex justify-end gap-3">
        <Boton variante="secundario" onClick={onCancelar}>Cancelar</Boton>
        <Boton type="submit" cargando={cargando}>{grupo ? 'Guardar cambios' : 'Crear grupo'}</Boton>
      </div>
    </form>
  )
}

function FormularioAula({ aula, onGuardar, onCancelar, cargando }) {
  const [form, setForm] = useState({ aula: aula?.ubicacion || '' })
  const [errores, setErrores] = useState({})

  async function enviar(event) {
    event.preventDefault()
    const validacion = schemaAula.safeParse(form)

    if (!validacion.success) {
      setErrores(erroresZod(validacion))
      return
    }

    try {
      setErrores({})
      await onGuardar({ aula: validacion.data.aula })
    } catch (error) {
      setErrores(extraerErrores(error))
    }
  }

  return (
    <form className="grid gap-4" onSubmit={enviar}>
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        <span>Ubicacion *</span>
        <Input value={form.aula} error={errores.aula} onChange={(event) => setForm({ aula: event.target.value })} placeholder="Modulo 236, Aula 11" />
        {errores.aula ? <span className="text-xs text-red-600">{errores.aula}</span> : null}
      </label>

      <div className="flex justify-end gap-3">
        <Boton variante="secundario" onClick={onCancelar}>Cancelar</Boton>
        <Boton type="submit" cargando={cargando}>{aula ? 'Guardar cambios' : 'Crear aula'}</Boton>
      </div>
    </form>
  )
}

function FormularioTurno({ turno, onGuardar, onCancelar, cargando }) {
  const [form, setForm] = useState({
    nombre: turno?.nombre || '',
    hora_inicio: turno?.hora_inicio?.slice(0, 5) || '',
    hora_fin: turno?.hora_fin?.slice(0, 5) || '',
  })
  const [errores, setErrores] = useState({})
  const duracion = diferenciaMinutos(form.hora_inicio, form.hora_fin)
  const periodosPrevios = generarVistaPreviaPeriodos(form.hora_inicio, form.hora_fin)
  const rangoValido = duracion === DURACION_TURNO_MINUTOS && periodosPrevios.length === 4

  async function enviar(event) {
    event.preventDefault()
    const validacion = schemaTurno.safeParse(form)

    if (!validacion.success) {
      setErrores(erroresZod(validacion))
      return
    }

    try {
      setErrores({})
      await onGuardar(validacion.data)
    } catch (error) {
      setErrores(extraerErrores(error))
    }
  }

  return (
    <form className="grid gap-4" onSubmit={enviar}>
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        <span>Nombre *</span>
        <Input value={form.nombre} error={errores.nombre} onChange={(event) => setForm((actual) => ({ ...actual, nombre: event.target.value }))} placeholder="Mañana" />
        {errores.nombre ? <span className="text-xs text-red-600">{errores.nombre}</span> : null}
      </label>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span>Hora inicio *</span>
            <Input type="time" value={form.hora_inicio} error={errores.hora_inicio} onChange={(event) => setForm((actual) => ({ ...actual, hora_inicio: event.target.value }))} />
            {errores.hora_inicio ? <span className="text-xs text-red-600">{errores.hora_inicio}</span> : null}
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span>Hora fin *</span>
            <Input type="time" value={form.hora_fin} error={errores.hora_fin} onChange={(event) => setForm((actual) => ({ ...actual, hora_fin: event.target.value }))} />
            {errores.hora_fin ? <span className="text-xs text-red-600">{errores.hora_fin}</span> : null}
          </label>
        </div>

        <div className={`rounded-md border px-3 py-2 ${rangoValido ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
          <p className="text-xs font-medium uppercase">Resumen</p>
          <p className="mt-1 text-sm font-semibold">{duracion > 0 ? `${duracion} minutos` : 'Sin rango'}</p>
          <p className="mt-1 text-xs">{periodosPrevios.length || 0} periodos de 90 min</p>
          <p className="text-xs">{rangoValido ? 'Turno valido de 6 horas' : 'Requiere 6 horas exactas'}</p>
        </div>
      </div>
      <div className="rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
        <p>Al guardar el turno, el backend generara automaticamente 4 periodos de 90 minutos. Cada clase usara 1 periodo completo.</p>
        {periodosPrevios.length ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {periodosPrevios.map((periodo) => (
              <div key={periodo.numero} className="rounded-md border border-sky-100 bg-white px-3 py-2">
                <p className="text-xs font-semibold text-sky-950">Periodo {periodo.numero}</p>
                <p className="text-xs text-sky-700">{periodo.inicio} - {periodo.fin}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs">Selecciona un rango exacto de 6 horas para ver los 4 periodos de 90 minutos.</p>
        )}
      </div>
      <div className="flex justify-end gap-3">
        <Boton variante="secundario" onClick={onCancelar}>Cancelar</Boton>
        <Boton type="submit" cargando={cargando} disabled={!rangoValido}>{turno ? 'Guardar cambios' : 'Crear turno'}</Boton>
      </div>
    </form>
  )
}

function FormularioPeriodo({ turnos = [], onGuardar, onCancelar, cargando }) {
  const [form, setForm] = useState({ turno_id: '', numero_periodo: '', hora_inicio: '', hora_fin: '' })
  const [errores, setErrores] = useState({})
  const duracion = diferenciaMinutos(form.hora_inicio, form.hora_fin)

  async function enviar(event) {
    event.preventDefault()
    const validacion = schemaPeriodo.safeParse(form)

    if (!validacion.success) {
      setErrores(erroresZod(validacion))
      return
    }

    try {
      setErrores({})
      await onGuardar({
        turno_id: Number(validacion.data.turno_id),
        numero_periodo: validacion.data.numero_periodo,
        hora_inicio: validacion.data.hora_inicio,
        hora_fin: validacion.data.hora_fin,
      })
    } catch (error) {
      setErrores(extraerErrores(error))
    }
  }

  return (
    <form className="grid gap-4" onSubmit={enviar}>
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        <span>Turno *</span>
        <Select value={form.turno_id} error={errores.turno_id} onChange={(event) => setForm((actual) => ({ ...actual, turno_id: event.target.value }))}>
          <option value="">Seleccionar turno</option>
          {turnos.map((turno) => <option key={turno.id} value={turno.id}>{turno.nombre} ({turno.hora_inicio} - {turno.hora_fin})</option>)}
        </Select>
        {errores.turno_id ? <span className="text-xs text-red-600">{errores.turno_id}</span> : null}
      </label>
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        <span>Numero de periodo *</span>
        <Input type="number" min="1" value={form.numero_periodo} error={errores.numero_periodo} onChange={(event) => setForm((actual) => ({ ...actual, numero_periodo: event.target.value }))} />
        {errores.numero_periodo ? <span className="text-xs text-red-600">{errores.numero_periodo}</span> : null}
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          <span>Hora inicio *</span>
          <Input type="time" value={form.hora_inicio} error={errores.hora_inicio} onChange={(event) => setForm((actual) => ({ ...actual, hora_inicio: event.target.value }))} />
          {errores.hora_inicio ? <span className="text-xs text-red-600">{errores.hora_inicio}</span> : null}
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          <span>Hora fin *</span>
          <Input type="time" value={form.hora_fin} error={errores.hora_fin} onChange={(event) => setForm((actual) => ({ ...actual, hora_fin: event.target.value }))} />
          {errores.hora_fin ? <span className="text-xs text-red-600">{errores.hora_fin}</span> : null}
        </label>
      </div>
      <div className={`rounded-md border px-3 py-2 text-sm ${duracion === DURACION_PERIODO_MINUTOS ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
        Duracion calculada: {duracion > 0 ? duracion : '-'} minutos. Requerido: 90 minutos.
      </div>
      <div className="flex justify-end gap-3">
        <Boton variante="secundario" onClick={onCancelar}>Cancelar</Boton>
        <Boton type="submit" cargando={cargando}>Crear periodo</Boton>
      </div>
    </form>
  )
}

function FormularioHorario({ gestiones = [], grupos = [], materias = [], docentes = [], aulas = [], dias = [], turnos = [], periodos = [], onGuardar, onCancelar, cargando }) {
  const [form, setForm] = useState({
    gestion_academica_id: '',
    grupo_id: '',
    materia_id: '',
    docente_id: '',
    aula_id: '',
    dia_ids: [],
    turno_id: '',
    periodo_id: '',
  })
  const [errores, setErrores] = useState({})

  const periodosFiltrados = (form.turno_id ? periodos.filter((periodo) => String(periodo.turno?.id) === String(form.turno_id)) : periodos)
    .filter((periodo) => Number(periodo.duracion_minutos || DURACION_PERIODO_MINUTOS) === DURACION_PERIODO_MINUTOS)

  async function enviar(event) {
    event.preventDefault()
    const validacion = schemaHorario.safeParse(form)

    if (!validacion.success) {
      setErrores(erroresZod(validacion))
      return
    }

    try {
      setErrores({})
      const { dia_ids: diaIds, ...datos } = validacion.data
      const payloadBase = Object.fromEntries(Object.entries(datos).map(([key, value]) => [key, Number(value)]))

      await onGuardar(diaIds.map((diaId) => ({ ...payloadBase, dia_id: Number(diaId) })))
    } catch (error) {
      const erroresBackend = extraerErrores(error)
      setErrores({
        ...erroresBackend,
        ...(erroresBackend.dia_id && !erroresBackend.dia_ids ? { dia_ids: erroresBackend.dia_id } : {}),
      })
    }
  }

  function actualizar(nombre, valor) {
    setForm((actual) => ({
      ...actual,
      [nombre]: valor,
      ...(nombre === 'turno_id' ? { periodo_id: '' } : {}),
    }))
  }

  function alternarDia(diaId) {
    setForm((actual) => {
      const seleccionado = actual.dia_ids.includes(String(diaId))

      return {
        ...actual,
        dia_ids: seleccionado
          ? actual.dia_ids.filter((id) => id !== String(diaId))
          : [...actual.dia_ids, String(diaId)],
      }
    })
  }

  return (
    <form className="grid gap-4" onSubmit={enviar}>
      <div className="grid gap-4 md:grid-cols-2">
        <SelectForm label="Gestion academica" value={form.gestion_academica_id} error={errores.gestion_academica_id} onChange={(value) => actualizar('gestion_academica_id', value)} options={gestiones.map((gestion) => ({ value: gestion.id, label: gestion.nombre }))} />
        <SelectForm label="Grupo" value={form.grupo_id} error={errores.grupo_id} onChange={(value) => actualizar('grupo_id', value)} options={grupos.map((grupo) => ({ value: grupo.id, label: `${grupo.nombre} - ${grupo.gestion_academica?.nombre || 'Sin gestion'}` }))} />
        <SelectForm label="Materia" value={form.materia_id} error={errores.materia_id} onChange={(value) => actualizar('materia_id', value)} options={materias.map((materia) => ({ value: materia.id, label: materia.nombre }))} />
        <SelectForm label="Docente" value={form.docente_id} error={errores.docente_id} onChange={(value) => actualizar('docente_id', value)} options={docentes.map((docente) => ({ value: docente.id, label: nombreDocente(docente) }))} />
        <SelectForm label="Aula" value={form.aula_id} error={errores.aula_id} onChange={(value) => actualizar('aula_id', value)} options={aulas.map((aula) => ({ value: aula.id, label: aula.ubicacion }))} />
        <SelectForm label="Turno" value={form.turno_id} error={errores.turno_id} onChange={(value) => actualizar('turno_id', value)} options={turnos.map((turno) => ({ value: turno.id, label: `${turno.nombre} (${turno.hora_inicio} - ${turno.hora_fin})` }))} />
        <SelectForm label="Periodo" value={form.periodo_id} error={errores.periodo_id} onChange={(value) => actualizar('periodo_id', value)} options={periodosFiltrados.map((periodo) => ({ value: periodo.id, label: `Periodo ${periodo.numero_periodo} (${periodo.hora_inicio} - ${periodo.hora_fin})` }))} />
        <div className="grid gap-1.5 text-sm font-medium text-slate-700 md:col-span-2">
          <span>Dias *</span>
          <div className={`grid gap-2 rounded-md border bg-white p-3 sm:grid-cols-2 lg:grid-cols-3 ${errores.dia_ids ? 'border-red-400' : 'border-slate-300'}`}>
            {dias.map((dia) => (
              <label key={dia.id} className="flex min-h-9 items-center gap-2 rounded-md px-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={form.dia_ids.includes(String(dia.id))}
                  onChange={() => alternarDia(dia.id)}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-100"
                />
                <span>{dia.nombre}</span>
              </label>
            ))}
          </div>
          {errores.dia_ids ? <span className="text-xs text-red-600">{errores.dia_ids}</span> : null}
        </div>
      </div>
      <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
        Se creara una clase de 90 minutos por cada dia seleccionado.
      </div>
      <div className="flex justify-end gap-3">
        <Boton variante="secundario" onClick={onCancelar}>Cancelar</Boton>
        <Boton type="submit" cargando={cargando}>{form.dia_ids.length > 1 ? 'Crear horarios' : 'Crear horario'}</Boton>
      </div>
    </form>
  )
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

function ModalAlumnosGrupo({ grupo, abierto, onCerrar }) {
  const alumnosQuery = useQuery({
    queryKey: ['grupos', grupo?.id, 'alumnos'],
    queryFn: () => listarAlumnosGrupo(grupo.id),
    enabled: abierto && Boolean(grupo?.id),
  })

  const alumnos = alumnosQuery.data?.alumnos || []

  const columnas = useMemo(() => [
    {
      header: 'Alumno',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-950">{nombrePersona(row.original.persona)}</p>
          <p className="text-xs text-slate-500">{row.original.codigo_alumno || 'Sin codigo'}</p>
        </div>
      ),
    },
    {
      header: 'CI',
      cell: ({ row }) => row.original.persona?.cedula_identidad || 'Sin CI',
    },
    {
      header: 'Estado academico',
      cell: ({ row }) => <BadgeEstado estado={row.original.estado_academico} />,
    },
  ], [])

  return (
    <Modal abierto={abierto} titulo={`Estudiantes de ${grupo?.nombre || 'grupo'}`} onCerrar={onCerrar} className="max-w-3xl">
      {alumnosQuery.error ? <MensajeError mensaje={obtenerMensajeError(alumnosQuery.error)} /> : null}
      <TablaBase columnas={columnas} datos={alumnos} cargando={alumnosQuery.isLoading} mensajeVacio="Este grupo no tiene estudiantes asignados." />
    </Modal>
  )
}

export default function CatalogosAcademicos() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('materias')
  const [paginaGrupos, setPaginaGrupos] = useState(1)
  const [paginaAulas, setPaginaAulas] = useState(1)
  const [filtroGestion, setFiltroGestion] = useState('')
  const [filtroGrupoActivo, setFiltroGrupoActivo] = useState('')
  const [filtroAulaActiva, setFiltroAulaActiva] = useState('')
  const [modalGrupo, setModalGrupo] = useState(false)
  const [grupoEditando, setGrupoEditando] = useState(null)
  const [grupoEstado, setGrupoEstado] = useState(null)
  const [modalAula, setModalAula] = useState(false)
  const [aulaEditando, setAulaEditando] = useState(null)
  const [aulaEstado, setAulaEstado] = useState(null)
  const [grupoAlumnos, setGrupoAlumnos] = useState(null)
  const [paginaTurnos, setPaginaTurnos] = useState(1)
  const [paginaPeriodos, setPaginaPeriodos] = useState(1)
  const [paginaHorarios, setPaginaHorarios] = useState(1)
  const [filtroTurnoActivo, setFiltroTurnoActivo] = useState('')
  const [filtroPeriodoTurno, setFiltroPeriodoTurno] = useState('')
  const [filtroHorarioGestion, setFiltroHorarioGestion] = useState('')
  const [modalTurno, setModalTurno] = useState(false)
  const [turnoEditando, setTurnoEditando] = useState(null)
  const [turnoEstado, setTurnoEstado] = useState(null)
  const [turnoEliminar, setTurnoEliminar] = useState(null)
  const [modalPeriodo, setModalPeriodo] = useState(false)
  const [modalHorario, setModalHorario] = useState(false)
  const [mensajeError, setMensajeError] = useState('')

  const gestionesQuery = useQuery({
    queryKey: ['gestiones-academicas'],
    queryFn: () => listarGestiones(),
  })

  const materiasQuery = useQuery({
    queryKey: ['materias'],
    queryFn: () => listarMaterias(),
  })

  const diasQuery = useQuery({
    queryKey: ['dias'],
    queryFn: () => listarDias(),
  })

  const gruposParams = {
    page: paginaGrupos,
    por_pagina: 10,
    gestion_academica_id: filtroGestion || undefined,
    activo: filtroGrupoActivo || undefined,
  }

  const gruposQuery = useQuery({
    queryKey: ['grupos', gruposParams],
    queryFn: () => listarGrupos(gruposParams),
  })

  const calculoQuery = useQuery({
    queryKey: ['grupos', 'calculo', filtroGestion],
    queryFn: () => calcularGruposNecesarios({ gestion_academica_id: filtroGestion }),
    enabled: Boolean(filtroGestion),
  })

  const aulasParams = {
    page: paginaAulas,
    por_pagina: 10,
    activa: filtroAulaActiva || undefined,
  }

  const aulasQuery = useQuery({
    queryKey: ['aulas', aulasParams],
    queryFn: () => listarAulas(aulasParams),
  })

  const turnosParams = {
    page: paginaTurnos,
    por_pagina: 10,
    activo: filtroTurnoActivo || undefined,
  }

  const turnosQuery = useQuery({
    queryKey: ['turnos', turnosParams],
    queryFn: () => listarTurnos(turnosParams),
  })

  const periodosParams = {
    page: paginaPeriodos,
    por_pagina: 10,
    turno_id: filtroPeriodoTurno || undefined,
  }

  const periodosQuery = useQuery({
    queryKey: ['periodos', periodosParams],
    queryFn: () => listarPeriodos(periodosParams),
  })

  const horariosParams = {
    page: paginaHorarios,
    por_pagina: 10,
    gestion_academica_id: filtroHorarioGestion || undefined,
  }

  const horariosQuery = useQuery({
    queryKey: ['horarios', horariosParams],
    queryFn: () => listarHorarios(horariosParams),
  })

  const docentesQuery = useQuery({
    queryKey: ['docentes', 'activos-para-horarios'],
    queryFn: () => listarDocentes({ activo: 'true', por_pagina: 100 }),
  })

  const gruposHorarioQuery = useQuery({
    queryKey: ['grupos', 'activos-para-horarios'],
    queryFn: () => listarGrupos({ activo: 'true', por_pagina: 100 }),
  })

  const aulasHorarioQuery = useQuery({
    queryKey: ['aulas', 'activas-para-horarios'],
    queryFn: () => listarAulas({ activa: 'true', por_pagina: 100 }),
  })

  const turnosHorarioQuery = useQuery({
    queryKey: ['turnos', 'activos-para-horarios'],
    queryFn: () => listarTurnos({ activo: 'true', por_pagina: 100 }),
  })

  const periodosHorarioQuery = useQuery({
    queryKey: ['periodos', 'activos-para-horarios'],
    queryFn: () => listarPeriodos({ activo: 'true', por_pagina: 100 }),
  })

  const gestiones = gestionesQuery.data || []
  const materias = materiasQuery.data?.materias || []
  const grupos = gruposQuery.data?.datos || []
  const aulas = aulasQuery.data?.datos || []
  const dias = diasQuery.data?.dias || []
  const turnos = turnosQuery.data?.datos || []
  const periodos = periodosQuery.data?.datos || []
  const horarios = horariosQuery.data?.datos || []
  const docentes = docentesQuery.data?.datos || []
  const gruposHorario = gruposHorarioQuery.data?.datos || grupos
  const aulasHorario = aulasHorarioQuery.data?.datos || aulas
  const turnosHorario = turnosHorarioQuery.data?.datos || turnos
  const periodosHorario = periodosHorarioQuery.data?.datos || periodos
  const metaGrupos = gruposQuery.data?.meta || { pagina_actual: paginaGrupos, ultima_pagina: 1, total: grupos.length }
  const metaAulas = aulasQuery.data?.meta || { pagina_actual: paginaAulas, ultima_pagina: 1, total: aulas.length }
  const metaTurnos = turnosQuery.data?.meta || { pagina_actual: paginaTurnos, ultima_pagina: 1, total: turnos.length }
  const metaPeriodos = periodosQuery.data?.meta || { pagina_actual: paginaPeriodos, ultima_pagina: 1, total: periodos.length }
  const metaHorarios = horariosQuery.data?.meta || { pagina_actual: paginaHorarios, ultima_pagina: 1, total: horarios.length }

  const crearGrupoMutation = useMutation({
    mutationFn: crearGrupo,
    onSuccess: () => {
      toast.success('Grupo creado correctamente.')
      setModalGrupo(false)
      queryClient.invalidateQueries({ queryKey: ['grupos'] })
    },
    onError: (error) => setMensajeError(obtenerMensajeError(error)),
  })

  const editarGrupoMutation = useMutation({
    mutationFn: ({ id, payload }) => editarGrupo(id, payload),
    onSuccess: () => {
      toast.success('Grupo actualizado correctamente.')
      setModalGrupo(false)
      setGrupoEditando(null)
      setGrupoEstado(null)
      queryClient.invalidateQueries({ queryKey: ['grupos'] })
    },
    onError: (error) => setMensajeError(obtenerMensajeError(error)),
  })

  const desactivarGrupoMutation = useMutation({
    mutationFn: desactivarGrupo,
    onSuccess: () => {
      toast.success('Grupo desactivado correctamente.')
      setGrupoEstado(null)
      queryClient.invalidateQueries({ queryKey: ['grupos'] })
    },
    onError: (error) => setMensajeError(obtenerMensajeError(error)),
  })

  const crearAulaMutation = useMutation({
    mutationFn: crearAula,
    onSuccess: () => {
      toast.success('Aula creada correctamente.')
      setModalAula(false)
      queryClient.invalidateQueries({ queryKey: ['aulas'] })
    },
    onError: (error) => setMensajeError(obtenerMensajeError(error)),
  })

  const editarAulaMutation = useMutation({
    mutationFn: ({ id, payload }) => editarAula(id, payload),
    onSuccess: () => {
      toast.success('Aula actualizada correctamente.')
      setModalAula(false)
      setAulaEditando(null)
      setAulaEstado(null)
      queryClient.invalidateQueries({ queryKey: ['aulas'] })
    },
    onError: (error) => setMensajeError(obtenerMensajeError(error)),
  })

  const crearTurnoMutation = useMutation({
    mutationFn: crearTurno,
    onSuccess: () => {
      toast.success('Turno creado correctamente.')
      setModalTurno(false)
      queryClient.invalidateQueries({ queryKey: ['turnos'] })
      queryClient.invalidateQueries({ queryKey: ['periodos'] })
    },
    onError: (error) => setMensajeError(obtenerMensajeError(error)),
  })

  const editarTurnoMutation = useMutation({
    mutationFn: ({ id, payload }) => editarTurno(id, payload),
    onSuccess: () => {
      toast.success('Turno actualizado correctamente.')
      setModalTurno(false)
      setTurnoEditando(null)
      setTurnoEstado(null)
      queryClient.invalidateQueries({ queryKey: ['turnos'] })
      queryClient.invalidateQueries({ queryKey: ['periodos'] })
    },
    onError: (error) => setMensajeError(obtenerMensajeError(error)),
  })

  const eliminarTurnoMutation = useMutation({
    mutationFn: eliminarTurno,
    onSuccess: () => {
      toast.success('Turno eliminado correctamente.')
      setTurnoEliminar(null)
      queryClient.invalidateQueries({ queryKey: ['turnos'] })
      queryClient.invalidateQueries({ queryKey: ['periodos'] })
      queryClient.invalidateQueries({ queryKey: ['horarios'] })
    },
    onError: (error) => setMensajeError(obtenerMensajeError(error)),
  })

  const crearPeriodoMutation = useMutation({
    mutationFn: crearPeriodo,
    onSuccess: () => {
      toast.success('Periodo creado correctamente.')
      setModalPeriodo(false)
      queryClient.invalidateQueries({ queryKey: ['periodos'] })
    },
    onError: (error) => setMensajeError(obtenerMensajeError(error)),
  })

  const crearHorarioMutation = useMutation({
    mutationFn: (payloads) => Promise.all(payloads.map((payload) => crearHorario(payload))),
    onSuccess: (_respuesta, payloads) => {
      toast.success(payloads.length > 1 ? 'Horarios creados correctamente.' : 'Horario creado correctamente.')
      setModalHorario(false)
      queryClient.invalidateQueries({ queryKey: ['horarios'] })
      queryClient.invalidateQueries({ queryKey: ['docentes'] })
    },
    onError: (error) => setMensajeError(obtenerMensajeError(error)),
  })

  const columnasMaterias = useMemo(() => [
    {
      header: 'Materia',
      cell: ({ row }) => <span className="font-semibold text-slate-950">{row.original.nombre}</span>,
    },
    {
      header: 'Base CUP',
      cell: ({ row }) => ['Fisica', 'Matematicas', 'Computacion', 'Ingles'].includes(row.original.nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '')) ? 'Si' : 'No',
    },
    {
      header: 'Estado',
      cell: ({ row }) => <BadgeEstado estado={estadoActivo(row.original.activa)} />,
    },
  ], [])

  const columnasGrupos = useMemo(() => [
    {
      header: 'Grupo',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-950">{row.original.nombre}</p>
          <p className="text-xs text-slate-500">{row.original.gestion_academica?.nombre || 'Sin gestion'}</p>
        </div>
      ),
    },
    {
      header: 'Estudiantes',
      cell: ({ row }) => `${row.original.cupos_ocupados || 0} / ${row.original.cupo_maximo || 70}`,
    },
    {
      header: 'Disponibles',
      cell: ({ row }) => row.original.cupos_disponibles ?? 0,
    },
    {
      header: 'Estado',
      cell: ({ row }) => <BadgeEstado estado={estadoActivo(row.original.activo)} />,
    },
    {
      header: 'Acciones',
      cell: ({ row }) => {
        const grupo = row.original

        return (
          <AccionesTabla>
            <Boton variante="secundario" className="min-h-9 px-3" title="Ver estudiantes" onClick={() => setGrupoAlumnos(grupo)}>
              <Eye className="h-4 w-4" />
            </Boton>
            <Boton variante="secundario" className="min-h-9 px-3" title="Editar grupo" onClick={() => abrirEditarGrupo(grupo)}>
              <Edit className="h-4 w-4" />
            </Boton>
            <Boton variante={grupo.activo ? 'peligro' : 'secundario'} className="min-h-9 px-3" title={grupo.activo ? 'Desactivar grupo' : 'Activar grupo'} onClick={() => setGrupoEstado(grupo)}>
              {grupo.activo ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
            </Boton>
          </AccionesTabla>
        )
      },
    },
  ], [])

  function abrirCrearGrupo() {
    setMensajeError('')
    setGrupoEditando(null)
    setModalGrupo(true)
  }

  function abrirEditarGrupo(grupo) {
    setMensajeError('')
    setGrupoEditando(grupo)
    setModalGrupo(true)
  }

  async function guardarGrupo(payload) {
    if (grupoEditando) {
      await editarGrupoMutation.mutateAsync({ id: grupoEditando.id, payload })
      return
    }

    await crearGrupoMutation.mutateAsync(payload)
  }

  function cambiarEstadoGrupo() {
    if (!grupoEstado.activo) {
      editarGrupoMutation.mutate({
        id: grupoEstado.id,
        payload: { activo: true },
      })
      return
    }

    desactivarGrupoMutation.mutate(grupoEstado.id)
  }

  const columnasAulas = useMemo(() => [
    {
      header: 'Ubicacion',
      cell: ({ row }) => <span className="font-semibold text-slate-950">{row.original.ubicacion}</span>,
    },
    {
      header: 'Estado',
      cell: ({ row }) => <BadgeEstado estado={estadoActivo(row.original.activa)} />,
    },
    {
      header: 'Acciones',
      cell: ({ row }) => {
        const aula = row.original

        return (
          <AccionesTabla>
            <Boton variante="secundario" className="min-h-9 px-3" title="Editar aula" onClick={() => abrirEditarAula(aula)}>
              <Edit className="h-4 w-4" />
            </Boton>
            <Boton variante={aula.activa ? 'peligro' : 'secundario'} className="min-h-9 px-3" title={aula.activa ? 'Desactivar aula' : 'Activar aula'} onClick={() => setAulaEstado(aula)}>
              {aula.activa ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
            </Boton>
          </AccionesTabla>
        )
      },
    },
  ], [])

  const columnasDias = useMemo(() => [
    {
      header: 'Dia',
      cell: ({ row }) => <span className="font-semibold text-slate-950">{row.original.nombre}</span>,
    },
    {
      header: 'Orden',
      cell: ({ row }) => row.original.orden,
    },
    {
      header: 'Estado',
      cell: ({ row }) => <BadgeEstado estado={estadoActivo(row.original.activo)} />,
    },
  ], [])

  const columnasTurnos = useMemo(() => [
    {
      header: 'Turno',
      cell: ({ row }) => <span className="font-semibold text-slate-950">{row.original.nombre}</span>,
    },
    {
      header: 'Horario',
      cell: ({ row }) => `${row.original.hora_inicio} - ${row.original.hora_fin}`,
    },
    {
      header: 'Estado',
      cell: ({ row }) => <BadgeEstado estado={estadoActivo(row.original.activo)} />,
    },
    {
      header: 'Acciones',
      cell: ({ row }) => {
        const turno = row.original

        return (
          <AccionesTabla>
            <Boton variante="secundario" className="min-h-9 px-3" title="Editar turno" onClick={() => abrirEditarTurno(turno)}>
              <Edit className="h-4 w-4" />
            </Boton>
            <Boton variante={turno.activo ? 'peligro' : 'secundario'} className="min-h-9 px-3" title={turno.activo ? 'Desactivar turno' : 'Activar turno'} onClick={() => setTurnoEstado(turno)}>
              {turno.activo ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
            </Boton>
            <Boton variante="peligro" className="min-h-9 px-3" title="Eliminar turno" onClick={() => setTurnoEliminar(turno)}>
              <Trash2 className="h-4 w-4" />
            </Boton>
          </AccionesTabla>
        )
      },
    },
  ], [])

  const columnasPeriodos = useMemo(() => [
    {
      header: 'Periodo',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-950">Periodo {row.original.numero_periodo}</p>
          <p className="text-xs text-slate-500">{row.original.turno?.nombre || 'Sin turno'}</p>
        </div>
      ),
    },
    {
      header: 'Horario',
      cell: ({ row }) => `${row.original.hora_inicio} - ${row.original.hora_fin}`,
    },
    {
      header: 'Duracion',
      cell: ({ row }) => `${row.original.duracion_minutos || DURACION_PERIODO_MINUTOS} min`,
    },
    {
      header: 'Estado',
      cell: ({ row }) => <BadgeEstado estado={estadoActivo(row.original.activo)} />,
    },
  ], [])

  const columnasHorarios = useMemo(() => [
    {
      header: 'Clase',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-950">{row.original.materia?.nombre || 'Sin materia'}</p>
          <p className="text-xs text-slate-500">{row.original.grupo?.nombre || 'Sin grupo'} | {row.original.gestion_academica?.nombre || 'Sin gestion'}</p>
        </div>
      ),
    },
    {
      header: 'Dia y periodo',
      cell: ({ row }) => `${row.original.dia?.nombre || '-'} | ${row.original.turno?.nombre || '-'} | Periodo ${row.original.periodo?.numero_periodo || '-'}`,
    },
    {
      header: 'Hora',
      cell: ({ row }) => `${row.original.hora_inicio} - ${row.original.hora_fin}`,
    },
    {
      header: 'Docente',
      cell: ({ row }) => row.original.docente ? nombreDocente(row.original.docente) : 'Sin docente',
    },
    {
      header: 'Aula',
      cell: ({ row }) => row.original.aula?.ubicacion || 'Sin aula',
    },
    {
      header: 'Estado',
      cell: ({ row }) => <BadgeEstado estado={estadoActivo(row.original.activo)} />,
    },
  ], [])

  function abrirCrearAula() {
    setMensajeError('')
    setAulaEditando(null)
    setModalAula(true)
  }

  function abrirEditarAula(aula) {
    setMensajeError('')
    setAulaEditando(aula)
    setModalAula(true)
  }

  async function guardarAula(payload) {
    if (aulaEditando) {
      await editarAulaMutation.mutateAsync({ id: aulaEditando.id, payload })
      return
    }

    await crearAulaMutation.mutateAsync(payload)
  }

  function cambiarEstadoAula() {
    editarAulaMutation.mutate({
      id: aulaEstado.id,
      payload: { activa: !aulaEstado.activa },
    })
  }

  function abrirCrearTurno() {
    setMensajeError('')
    setTurnoEditando(null)
    setModalTurno(true)
  }

  function abrirEditarTurno(turno) {
    setMensajeError('')
    setTurnoEditando(turno)
    setModalTurno(true)
  }

  async function guardarTurno(payload) {
    if (turnoEditando) {
      await editarTurnoMutation.mutateAsync({ id: turnoEditando.id, payload })
      return
    }

    await crearTurnoMutation.mutateAsync(payload)
  }

  function cambiarEstadoTurno() {
    editarTurnoMutation.mutate({
      id: turnoEstado.id,
      payload: { activo: !turnoEstado.activo },
    })
  }

  function confirmarEliminarTurno() {
    if (!turnoEliminar?.id) return

    eliminarTurnoMutation.mutate(turnoEliminar.id)
  }

  const totalPaginasGrupos = Number(metaGrupos.ultima_pagina || 1)
  const totalPaginasAulas = Number(metaAulas.ultima_pagina || 1)
  const totalPaginasTurnos = Number(metaTurnos.ultima_pagina || 1)
  const totalPaginasPeriodos = Number(metaPeriodos.ultima_pagina || 1)
  const totalPaginasHorarios = Number(metaHorarios.ultima_pagina || 1)
  const calculo = calculoQuery.data?.calculo
  const siguienteClaseAdmin = proximaClase(horarios)

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Administrador', 'Materias, grupos y aulas']} />
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Materias, grupos y aulas</h1>
          <p className="mt-1 text-sm text-slate-600">Catalogos academicos conectados al backend.</p>
        </div>
      </div>

      {mensajeError ? <MensajeError mensaje={mensajeError} /> : null}

      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`border-b-2 px-4 py-2 text-sm font-semibold ${tab === item.id ? 'border-sky-700 text-sky-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'materias' ? (
        <section className="grid gap-4">
          {materiasQuery.error ? <MensajeError mensaje={obtenerMensajeError(materiasQuery.error)} /> : null}
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            Materias base: Fisica, Matematicas, Computacion e Ingles. El backend no expone endpoints para crear, editar o desactivar materias en esta fase.
          </div>
          <TablaBase columnas={columnasMaterias} datos={materias} cargando={materiasQuery.isLoading} mensajeVacio="No existen materias registradas." />
        </section>
      ) : null}

      {tab === 'grupos' ? (
        <section className="grid gap-4">
          {gruposQuery.error ? <MensajeError mensaje={obtenerMensajeError(gruposQuery.error)} /> : null}
          {gestionesQuery.error ? <MensajeError mensaje={obtenerMensajeError(gestionesQuery.error)} /> : null}

          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div className="grid flex-1 gap-3 md:grid-cols-[minmax(220px,280px)_180px]">
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                <span>Gestion academica</span>
                <Select value={filtroGestion} onChange={(event) => {
                  setPaginaGrupos(1)
                  setFiltroGestion(event.target.value)
                }}>
                  <option value="">Todas</option>
                  {gestiones.map((gestion) => <option key={gestion.id} value={gestion.id}>{gestion.nombre}</option>)}
                </Select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                <span>Estado</span>
                <Select value={filtroGrupoActivo} onChange={(event) => {
                  setPaginaGrupos(1)
                  setFiltroGrupoActivo(event.target.value)
                }}>
                  <option value="">Todos</option>
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </Select>
              </label>
            </div>
            <Boton onClick={abrirCrearGrupo}>
              <Plus className="h-4 w-4" />
              Crear grupo
            </Boton>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Maximo por grupo</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">70</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Inscritos en gestion</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{calculo?.total_inscritos ?? '-'}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Grupos necesarios</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{calculo?.grupos_necesarios ?? '-'}</p>
            </div>
          </div>

          <div>
            <TablaBase columnas={columnasGrupos} datos={grupos} cargando={gruposQuery.isLoading} mensajeVacio="No existen grupos con los filtros seleccionados." />
            {grupos.length ? (
              <PaginacionTabla
                pagina={Number(metaGrupos.pagina_actual || paginaGrupos)}
                totalPaginas={totalPaginasGrupos}
                onAnterior={() => setPaginaGrupos((valor) => Math.max(1, valor - 1))}
                onSiguiente={() => setPaginaGrupos((valor) => Math.min(totalPaginasGrupos, valor + 1))}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {tab === 'aulas' ? (
        <section className="grid gap-4">
          {aulasQuery.error ? <MensajeError mensaje={obtenerMensajeError(aulasQuery.error)} /> : null}
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <label className="grid gap-1.5 text-sm font-medium text-slate-700 md:w-48">
              <span>Estado</span>
              <Select value={filtroAulaActiva} onChange={(event) => {
                setPaginaAulas(1)
                setFiltroAulaActiva(event.target.value)
              }}>
                <option value="">Todas</option>
                <option value="true">Activa</option>
                <option value="false">Inactiva</option>
              </Select>
            </label>
            <Boton onClick={abrirCrearAula}>
              <Plus className="h-4 w-4" />
              Crear aula
            </Boton>
          </div>

          <div>
            <TablaBase columnas={columnasAulas} datos={aulas} cargando={aulasQuery.isLoading} mensajeVacio="No existen aulas con los filtros seleccionados." />
            {aulas.length ? (
              <PaginacionTabla
                pagina={Number(metaAulas.pagina_actual || paginaAulas)}
                totalPaginas={totalPaginasAulas}
                onAnterior={() => setPaginaAulas((valor) => Math.max(1, valor - 1))}
                onSiguiente={() => setPaginaAulas((valor) => Math.min(totalPaginasAulas, valor + 1))}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {tab === 'dias' ? (
        <section className="grid gap-4">
          {diasQuery.error ? <MensajeError mensaje={obtenerMensajeError(diasQuery.error)} /> : null}
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            Los dias disponibles se obtienen desde el backend. Solo se programan clases de lunes a sabado.
          </div>
          <TablaBase columnas={columnasDias} datos={dias} cargando={diasQuery.isLoading} mensajeVacio="No existen dias registrados." />
        </section>
      ) : null}

      {tab === 'turnos' ? (
        <section className="grid gap-4">
          {turnosQuery.error ? <MensajeError mensaje={obtenerMensajeError(turnosQuery.error)} /> : null}
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <label className="grid gap-1.5 text-sm font-medium text-slate-700 md:w-48">
              <span>Estado</span>
              <Select value={filtroTurnoActivo} onChange={(event) => {
                setPaginaTurnos(1)
                setFiltroTurnoActivo(event.target.value)
              }}>
                <option value="">Todos</option>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </Select>
            </label>
            <Boton onClick={abrirCrearTurno}>
              <Plus className="h-4 w-4" />
              Crear turno
            </Boton>
          </div>
          <div>
            <TablaBase columnas={columnasTurnos} datos={turnos} cargando={turnosQuery.isLoading} mensajeVacio="No existen turnos con los filtros seleccionados." />
            {turnos.length ? (
              <PaginacionTabla
                pagina={Number(metaTurnos.pagina_actual || paginaTurnos)}
                totalPaginas={totalPaginasTurnos}
                onAnterior={() => setPaginaTurnos((valor) => Math.max(1, valor - 1))}
                onSiguiente={() => setPaginaTurnos((valor) => Math.min(totalPaginasTurnos, valor + 1))}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {tab === 'periodos' ? (
        <section className="grid gap-4">
          {periodosQuery.error ? <MensajeError mensaje={obtenerMensajeError(periodosQuery.error)} /> : null}
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <label className="grid gap-1.5 text-sm font-medium text-slate-700 md:w-72">
              <span>Turno</span>
              <Select value={filtroPeriodoTurno} onChange={(event) => {
                setPaginaPeriodos(1)
                setFiltroPeriodoTurno(event.target.value)
              }}>
                <option value="">Todos</option>
                {turnos.map((turno) => <option key={turno.id} value={turno.id}>{turno.nombre}</option>)}
              </Select>
            </label>
            <Boton variante="secundario" onClick={() => {
              setMensajeError('')
              setModalPeriodo(true)
            }}>
              <Plus className="h-4 w-4" />
              Crear periodo manual
            </Boton>
          </div>
          <div className="rounded-md border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
            Los periodos se generan automaticamente en bloques de 90 minutos al crear o ajustar un turno de 6 horas. Una clase ocupa 1 periodo completo.
          </div>
          <div>
            <TablaBase columnas={columnasPeriodos} datos={periodos} cargando={periodosQuery.isLoading} mensajeVacio="No existen periodos con los filtros seleccionados." />
            {periodos.length ? (
              <PaginacionTabla
                pagina={Number(metaPeriodos.pagina_actual || paginaPeriodos)}
                totalPaginas={totalPaginasPeriodos}
                onAnterior={() => setPaginaPeriodos((valor) => Math.max(1, valor - 1))}
                onSiguiente={() => setPaginaPeriodos((valor) => Math.min(totalPaginasPeriodos, valor + 1))}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {tab === 'horarios' ? (
        <section className="grid gap-4">
          {horariosQuery.error ? <MensajeError mensaje={obtenerMensajeError(horariosQuery.error)} /> : null}
          {docentesQuery.error ? <MensajeError mensaje={obtenerMensajeError(docentesQuery.error)} /> : null}
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <label className="grid gap-1.5 text-sm font-medium text-slate-700 md:w-72">
              <span>Gestion academica</span>
              <Select value={filtroHorarioGestion} onChange={(event) => {
                setPaginaHorarios(1)
                setFiltroHorarioGestion(event.target.value)
              }}>
                <option value="">Todas</option>
                {gestiones.map((gestion) => <option key={gestion.id} value={gestion.id}>{gestion.nombre}</option>)}
              </Select>
            </label>
            <Boton onClick={() => {
              setMensajeError('')
              setModalHorario(true)
            }}>
              <Plus className="h-4 w-4" />
              Crear horario
            </Boton>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Proxima clase visible</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {siguienteClaseAdmin ? `${siguienteClaseAdmin.dia?.nombre || '-'} ${siguienteClaseAdmin.hora_inicio} - ${siguienteClaseAdmin.hora_fin} | ${siguienteClaseAdmin.materia?.nombre || 'Materia'} | ${siguienteClaseAdmin.grupo?.nombre || 'Grupo'}` : 'Sin horarios activos'}
            </p>
          </div>

          <div>
            <TablaBase columnas={columnasHorarios} datos={horarios} cargando={horariosQuery.isLoading} mensajeVacio="No existen horarios con los filtros seleccionados." />
            {horarios.length ? (
              <PaginacionTabla
                pagina={Number(metaHorarios.pagina_actual || paginaHorarios)}
                totalPaginas={totalPaginasHorarios}
                onAnterior={() => setPaginaHorarios((valor) => Math.max(1, valor - 1))}
                onSiguiente={() => setPaginaHorarios((valor) => Math.min(totalPaginasHorarios, valor + 1))}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      <Modal abierto={modalGrupo} titulo={grupoEditando ? 'Editar grupo' : 'Crear grupo'} onCerrar={() => setModalGrupo(false)} acciones={<></>}>
        <FormularioGrupo
          key={grupoEditando?.id || 'nuevo-grupo'}
          grupo={grupoEditando}
          gestiones={gestiones}
          onGuardar={guardarGrupo}
          onCancelar={() => setModalGrupo(false)}
          cargando={crearGrupoMutation.isPending || editarGrupoMutation.isPending}
        />
      </Modal>

      <Modal abierto={modalAula} titulo={aulaEditando ? 'Editar aula' : 'Crear aula'} onCerrar={() => setModalAula(false)} acciones={<></>}>
        <FormularioAula
          aula={aulaEditando}
          onGuardar={guardarAula}
          onCancelar={() => setModalAula(false)}
          cargando={crearAulaMutation.isPending || editarAulaMutation.isPending}
        />
      </Modal>

      <Modal abierto={modalTurno} titulo={turnoEditando ? 'Editar turno' : 'Crear turno'} onCerrar={() => setModalTurno(false)} acciones={<></>}>
        <FormularioTurno
          key={turnoEditando?.id || 'nuevo-turno'}
          turno={turnoEditando}
          onGuardar={guardarTurno}
          onCancelar={() => setModalTurno(false)}
          cargando={crearTurnoMutation.isPending || editarTurnoMutation.isPending}
        />
      </Modal>

      <Modal abierto={modalPeriodo} titulo="Crear periodo" onCerrar={() => setModalPeriodo(false)} acciones={<></>}>
        <FormularioPeriodo
          turnos={turnos}
          onGuardar={(payload) => crearPeriodoMutation.mutateAsync(payload)}
          onCancelar={() => setModalPeriodo(false)}
          cargando={crearPeriodoMutation.isPending}
        />
      </Modal>

      <Modal abierto={modalHorario} titulo="Crear horario" onCerrar={() => setModalHorario(false)} acciones={<></>} className="max-w-4xl">
        <FormularioHorario
          gestiones={gestiones}
          grupos={gruposHorario}
          materias={materias}
          docentes={docentes}
          aulas={aulasHorario}
          dias={dias}
          turnos={turnosHorario}
          periodos={periodosHorario}
          onGuardar={(payload) => crearHorarioMutation.mutateAsync(payload)}
          onCancelar={() => setModalHorario(false)}
          cargando={crearHorarioMutation.isPending}
        />
      </Modal>

      <ModalAlumnosGrupo grupo={grupoAlumnos} abierto={Boolean(grupoAlumnos)} onCerrar={() => setGrupoAlumnos(null)} />

      <ConfirmDialog
        abierto={Boolean(grupoEstado)}
        titulo={grupoEstado?.activo ? 'Desactivar grupo' : 'Activar grupo'}
        mensaje={`Confirma cambiar el estado de ${grupoEstado?.nombre || 'este grupo'}?`}
        onCancelar={() => setGrupoEstado(null)}
        onConfirmar={cambiarEstadoGrupo}
        cargando={editarGrupoMutation.isPending || desactivarGrupoMutation.isPending}
      />

      <ConfirmDialog
        abierto={Boolean(aulaEstado)}
        titulo={aulaEstado?.activa ? 'Desactivar aula' : 'Activar aula'}
        mensaje={`Confirma cambiar el estado de ${aulaEstado?.ubicacion || 'esta aula'}?`}
        onCancelar={() => setAulaEstado(null)}
        onConfirmar={cambiarEstadoAula}
        cargando={editarAulaMutation.isPending}
      />

      <ConfirmDialog
        abierto={Boolean(turnoEstado)}
        titulo={turnoEstado?.activo ? 'Desactivar turno' : 'Activar turno'}
        mensaje={`Confirma cambiar el estado de ${turnoEstado?.nombre || 'este turno'}?`}
        onCancelar={() => setTurnoEstado(null)}
        onConfirmar={cambiarEstadoTurno}
        cargando={editarTurnoMutation.isPending}
      />

      <ConfirmDialog
        abierto={Boolean(turnoEliminar)}
        titulo="Eliminar turno"
        mensaje={`Confirma eliminar ${turnoEliminar?.nombre || 'este turno'}? Tambien se eliminaran sus periodos si no tiene horarios asignados.`}
        onCancelar={() => setTurnoEliminar(null)}
        onConfirmar={confirmarEliminarTurno}
        cargando={eliminarTurnoMutation.isPending}
      />
    </div>
  )
}
