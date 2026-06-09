import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ClipboardCheck, RefreshCw, Save, Search } from 'lucide-react'
import { toast } from 'sonner'
import BadgeEstado from '../../../components/common/BadgeEstado'
import Boton from '../../../components/common/Boton'
import Input from '../../../components/common/Input'
import MensajeError from '../../../components/common/MensajeError'
import Select from '../../../components/common/Select'
import TablaBase from '../../../components/tables/TablaBase'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import { useAuth } from '../../../hooks/useAuth'
import { obtenerMensajeError } from '../../../lib/errores'
import {
  listarAsistenciaAlumno,
  listarMisAlumnosDocente,
  listarMisAsistenciasAlumno,
  marcarAsistenciaAlumno,
  obtenerHorarioActivoAlumno,
  obtenerHorarioActivoDocente,
  registrarAsistenciaAlumnoPorDocente,
} from '../../../services/asistencia.service'
import { listarAlumnosGrupo } from '../../../services/grupos.service'
import { listarHorariosAlumno, listarHorariosDocente } from '../../../services/horarios.service'

function texto(valor, alternativo = '-') {
  return valor || alternativo
}

function nombrePersona(persona) {
  return [persona?.nombres, persona?.apellido_paterno, persona?.apellido_materno].filter(Boolean).join(' ') || 'Sin nombre'
}

function nombreAlumno(alumno) {
  return nombrePersona(alumno?.persona || alumno)
}

function nombreDocente(docente) {
  return nombrePersona(docente?.persona || docente)
}

function horarioTexto(horario) {
  if (!horario) return 'Sin clase activa'
  const dia = typeof horario.dia === 'string' ? horario.dia : horario.dia?.nombre
  const turno = typeof horario.turno === 'string' ? horario.turno : horario.turno?.nombre
  const periodo = typeof horario.periodo === 'object' ? horario.periodo?.numero_periodo : horario.periodo
  return `${texto(dia)} | ${texto(turno)} | Periodo ${texto(periodo)} | ${texto(horario.hora_inicio)} - ${texto(horario.hora_fin)}`
}

function TarjetaDato({ etiqueta, valor }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase text-slate-500">{etiqueta}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{texto(valor)}</p>
    </div>
  )
}

function FiltrosAsistencia({ filtros, onCambiar, onEnviar, mostrarDocente = false }) {
  return (
    <form onSubmit={onEnviar} className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_1fr_auto]">
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Fecha
        <Input type="date" value={filtros.fecha} onChange={(evento) => onCambiar('fecha', evento.target.value)} />
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Estado
        <Select value={filtros.estado} onChange={(evento) => onCambiar('estado', evento.target.value)}>
          <option value="">Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="presente">Presente</option>
          <option value="retraso">Retraso</option>
          <option value="falta">Falta</option>
        </Select>
      </label>
      {mostrarDocente ? null : null}
      <div className="flex items-end">
        <Boton type="submit" className="w-full">
          <Search className="h-4 w-4" />
          Filtrar
        </Boton>
      </div>
    </form>
  )
}

function TablaAsistenciasAlumno({ asistencias, cargando }) {
  const columnas = useMemo(() => [
    {
      header: 'Alumno',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-950">{nombreAlumno(row.original.alumno)}</p>
          <p className="text-xs text-slate-500">{row.original.alumno?.codigo_alumno || 'Sin codigo'}</p>
        </div>
      ),
    },
    { header: 'Fecha', accessorKey: 'fecha' },
    {
      header: 'Clase',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-950">{texto(row.original.horario?.materia, 'Sin materia')}</p>
          <p className="text-xs text-slate-500">{texto(row.original.horario?.grupo, 'Sin grupo')} | {texto(row.original.horario?.aula, 'Sin aula')}</p>
        </div>
      ),
    },
    {
      header: 'Horario',
      cell: ({ row }) => horarioTexto(row.original.horario),
    },
    {
      header: 'Docente',
      cell: ({ row }) => (row.original.docente ? nombreDocente(row.original.docente) : 'Autoregistro'),
    },
    {
      header: 'Estado',
      cell: ({ row }) => <BadgeEstado estado={row.original.estado_asistencia} />,
    },
    {
      header: 'Hora',
      cell: ({ row }) => texto(row.original.hora_marcada, 'Sin marca'),
    },
  ], [])

  return (
    <TablaBase
      columnas={columnas}
      datos={asistencias}
      cargando={cargando}
      mensajeVacio="No existen asistencias de alumnos con los filtros seleccionados."
    />
  )
}

function VistaAlumno() {
  const { usuario, refrescarPerfil } = useAuth()
  const queryClient = useQueryClient()
  const [filtros, setFiltros] = useState({ fecha: '', estado: '' })
  const [params, setParams] = useState({ por_pagina: 50 })

  const perfilQuery = useQuery({
    queryKey: ['perfil-autenticado'],
    queryFn: refrescarPerfil,
    initialData: usuario,
    staleTime: 1000 * 60 * 5,
  })

  const alumnoId = (perfilQuery.data || usuario)?.datos_rol?.alumno?.id

  const claseQuery = useQuery({
    queryKey: ['asistencia-alumno', 'clase-activa'],
    queryFn: obtenerHorarioActivoAlumno,
    refetchInterval: 1000 * 60,
  })

  const horariosQuery = useQuery({
    queryKey: ['horarios', 'alumno', alumnoId, 'asistencia-activa'],
    queryFn: () => listarHorariosAlumno(alumnoId),
    enabled: Boolean(alumnoId),
  })

  const historialQuery = useQuery({
    queryKey: ['asistencia-alumno', 'mis-asistencias', params],
    queryFn: () => listarMisAsistenciasAlumno(params),
  })

  const datos = claseQuery.data || {}
  const horarioActivo = datos.horario
  const horarioCompleto = horariosQuery.data?.horarios?.find((horario) => horario.id === horarioActivo?.id)
  const asistencia = datos.asistencia
  const puedeMarcar = Boolean(datos.puede_marcar && horarioActivo && !asistencia)
  const asistencias = historialQuery.data?.datos || []

  const marcarMutation = useMutation({
    mutationFn: marcarAsistenciaAlumno,
    onSuccess: (respuesta) => {
      toast.success(`Asistencia registrada: ${respuesta?.asistencia?.estado_asistencia || 'estado actualizado'}.`)
      queryClient.invalidateQueries({ queryKey: ['asistencia-alumno'] })
    },
  })

  function cambiarFiltro(nombre, valor) {
    setFiltros((actuales) => ({ ...actuales, [nombre]: valor }))
  }

  function aplicarFiltros(evento) {
    evento.preventDefault()
    setParams({
      por_pagina: 50,
      fecha: filtros.fecha || undefined,
      estado: filtros.estado || undefined,
    })
  }

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Alumno', 'Asistencias']} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Asistencia alumno</h1>
          <p className="mt-1 text-sm text-slate-600">Marcado de asistencia y consulta de historial propio.</p>
        </div>
        <Boton variante="secundario" onClick={() => queryClient.invalidateQueries({ queryKey: ['asistencia-alumno'] })} disabled={claseQuery.isFetching}>
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Boton>
      </div>

      {claseQuery.error ? <MensajeError mensaje={obtenerMensajeError(claseQuery.error)} /> : null}
      {historialQuery.error ? <MensajeError mensaje={obtenerMensajeError(historialQuery.error)} /> : null}
      {marcarMutation.error ? <MensajeError mensaje={obtenerMensajeError(marcarMutation.error)} /> : null}

      <div className="rounded-md border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Clase activa</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">{texto(horarioActivo?.materia, 'No hay clase activa')}</h2>
            <p className="mt-1 text-sm text-slate-600">{datos.mensaje || 'Consulta de horario pendiente.'}</p>
          </div>
          <BadgeEstado estado={asistencia?.estado_asistencia || (datos.puede_marcar ? 'pendiente' : 'inactivo')} />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <TarjetaDato etiqueta="Docente" valor={horarioCompleto?.docente ? nombreDocente(horarioCompleto.docente) : undefined} />
          <TarjetaDato etiqueta="Grupo" valor={horarioActivo?.grupo} />
          <TarjetaDato etiqueta="Aula" valor={horarioActivo?.aula} />
          <TarjetaDato etiqueta="Horario" valor={horarioTexto(horarioActivo)} />
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Boton onClick={() => marcarMutation.mutate({})} disabled={!puedeMarcar} cargando={marcarMutation.isPending}>
            <ClipboardCheck className="h-4 w-4" />
            Marcar asistencia
          </Boton>
          <p className="text-sm text-slate-600">
            {asistencia ? `Asistencia ya registrada como ${asistencia.estado_asistencia}.` : 'El estado final lo determina el backend segun el horario.'}
          </p>
        </div>
      </div>

      <FiltrosAsistencia filtros={filtros} onCambiar={cambiarFiltro} onEnviar={aplicarFiltros} />
      <TablaAsistenciasAlumno asistencias={asistencias} cargando={historialQuery.isLoading} />
    </div>
  )
}

function VistaDocente() {
  const { usuario, refrescarPerfil } = useAuth()
  const queryClient = useQueryClient()
  const [filtros, setFiltros] = useState({ fecha: '', estado: '' })
  const [params, setParams] = useState({ por_pagina: 50 })
  const [estados, setEstados] = useState({})

  const perfilQuery = useQuery({
    queryKey: ['perfil-autenticado'],
    queryFn: refrescarPerfil,
    initialData: usuario,
    staleTime: 1000 * 60 * 5,
  })

  const docenteId = (perfilQuery.data || usuario)?.datos_rol?.docente?.id

  const claseQuery = useQuery({
    queryKey: ['asistencia-docente', 'clase-activa-para-alumnos'],
    queryFn: obtenerHorarioActivoDocente,
    refetchInterval: 1000 * 60,
  })

  const horariosQuery = useQuery({
    queryKey: ['horarios', 'docente', docenteId, 'asistencia-alumnos'],
    queryFn: () => listarHorariosDocente(docenteId),
    enabled: Boolean(docenteId),
  })

  const horarioActivo = claseQuery.data?.horario
  const horarioCompleto = horariosQuery.data?.horarios?.find((horario) => horario.id === horarioActivo?.id)
  const grupoId = horarioCompleto?.grupo?.id

  const alumnosQuery = useQuery({
    queryKey: ['grupos', grupoId, 'alumnos-asistencia'],
    queryFn: () => listarAlumnosGrupo(grupoId),
    enabled: Boolean(grupoId),
  })

  const historialQuery = useQuery({
    queryKey: ['asistencia-alumno', 'docente', params],
    queryFn: () => listarMisAlumnosDocente(params),
  })

  const alumnos = useMemo(() => alumnosQuery.data?.alumnos || [], [alumnosQuery.data])
  const asistencias = historialQuery.data?.datos || []
  const fechaActiva = claseQuery.data?.fecha

  const registrarMutation = useMutation({
    mutationFn: registrarAsistenciaAlumnoPorDocente,
    onSuccess: (respuesta) => {
      toast.success(`Asistencias registradas: ${respuesta?.cantidad_registrada || 0}.`)
      queryClient.invalidateQueries({ queryKey: ['asistencia-alumno'] })
    },
  })

  function cambiarEstado(alumnoId, estado) {
    setEstados((actuales) => ({ ...actuales, [alumnoId]: estado }))
  }

  function registrarAsistencia() {
    if (!horarioActivo?.id || !alumnos.length) return

    registrarMutation.mutate({
      horario_clase_id: horarioActivo.id,
      asistencias: alumnos.map((alumno) => ({
        alumno_id: alumno.id,
        estado_asistencia: estados[alumno.id] || 'presente',
      })),
    })
  }

  function cambiarFiltro(nombre, valor) {
    setFiltros((actuales) => ({ ...actuales, [nombre]: valor }))
  }

  function aplicarFiltros(evento) {
    evento.preventDefault()
    setParams({
      por_pagina: 50,
      fecha: filtros.fecha || undefined,
      estado: filtros.estado || undefined,
      grupo_id: grupoId || undefined,
    })
  }

  const columnasAlumnos = useMemo(() => [
    {
      header: 'Alumno',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-950">{nombreAlumno(row.original)}</p>
          <p className="text-xs text-slate-500">{row.original.codigo_alumno || 'Sin codigo'}</p>
        </div>
      ),
    },
    {
      header: 'Estado a registrar',
      cell: ({ row }) => (
        <Select value={estados[row.original.id] || 'presente'} onChange={(evento) => cambiarEstado(row.original.id, evento.target.value)}>
          <option value="presente">Presente</option>
          <option value="retraso">Retraso</option>
          <option value="falta">Falta</option>
        </Select>
      ),
    },
  ], [estados])

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Docente', 'Asistencia de alumnos']} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Asistencia de alumnos</h1>
          <p className="mt-1 text-sm text-slate-600">Registro de asistencia para alumnos del grupo asignado en la clase activa.</p>
        </div>
        <Boton variante="secundario" onClick={() => queryClient.invalidateQueries({ queryKey: ['asistencia'] })} disabled={claseQuery.isFetching}>
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Boton>
      </div>

      {claseQuery.error ? <MensajeError mensaje={obtenerMensajeError(claseQuery.error)} /> : null}
      {horariosQuery.error ? <MensajeError mensaje={obtenerMensajeError(horariosQuery.error)} /> : null}
      {alumnosQuery.error ? <MensajeError mensaje={obtenerMensajeError(alumnosQuery.error)} /> : null}
      {historialQuery.error ? <MensajeError mensaje={obtenerMensajeError(historialQuery.error)} /> : null}
      {registrarMutation.error ? <MensajeError mensaje={obtenerMensajeError(registrarMutation.error)} /> : null}

      <div className="rounded-md border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Clase activa</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">{texto(horarioActivo?.materia, 'No hay clase activa')}</h2>
            <p className="mt-1 text-sm text-slate-600">{claseQuery.data?.mensaje || 'Consulta de horario pendiente.'}</p>
          </div>
          <BadgeEstado estado={claseQuery.data?.puede_marcar ? 'activo' : 'inactivo'} />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <TarjetaDato etiqueta="Grupo" valor={horarioActivo?.grupo} />
          <TarjetaDato etiqueta="Aula" valor={horarioActivo?.aula} />
          <TarjetaDato etiqueta="Horario" valor={horarioTexto(horarioActivo)} />
          <TarjetaDato etiqueta="Fecha" valor={fechaActiva} />
        </div>
      </div>

      <div className="grid gap-4 rounded-md border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Alumnos del grupo activo</h2>
            <p className="text-sm text-slate-600">El backend valida que el docente tenga asignado el horario y que los alumnos pertenezcan al grupo.</p>
          </div>
          <Boton onClick={registrarAsistencia} disabled={!horarioActivo?.id || !alumnos.length} cargando={registrarMutation.isPending}>
            <Save className="h-4 w-4" />
            Guardar asistencia
          </Boton>
        </div>
        <TablaBase columnas={columnasAlumnos} datos={alumnos} cargando={alumnosQuery.isLoading} mensajeVacio="No hay alumnos disponibles para el grupo activo." />
      </div>

      <FiltrosAsistencia filtros={filtros} onCambiar={cambiarFiltro} onEnviar={aplicarFiltros} />
      <TablaAsistenciasAlumno asistencias={asistencias} cargando={historialQuery.isLoading} />
    </div>
  )
}

function VistaAdministrativa() {
  const [filtros, setFiltros] = useState({ fecha: '', estado: '' })
  const [params, setParams] = useState({ por_pagina: 50 })

  const asistenciaQuery = useQuery({
    queryKey: ['asistencia-alumno', 'admin', params],
    queryFn: () => listarAsistenciaAlumno(params),
  })

  const asistencias = asistenciaQuery.data?.datos || []
  const total = asistenciaQuery.data?.meta?.total ?? asistencias.length
  const resumen = asistencias.reduce((acumulado, asistencia) => {
    const estado = asistencia.estado_asistencia || 'pendiente'
    return { ...acumulado, [estado]: (acumulado[estado] || 0) + 1 }
  }, {})

  function cambiarFiltro(nombre, valor) {
    setFiltros((actuales) => ({ ...actuales, [nombre]: valor }))
  }

  function aplicarFiltros(evento) {
    evento.preventDefault()
    setParams({
      por_pagina: 50,
      fecha: filtros.fecha || undefined,
      estado: filtros.estado || undefined,
    })
  }

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Administrador', 'Asistencia de alumnos']} />
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Asistencia de alumnos</h1>
        <p className="mt-1 text-sm text-slate-600">Visualizacion de asistencia de todos los alumnos segun permisos administrativos.</p>
      </div>

      {asistenciaQuery.error ? <MensajeError mensaje={obtenerMensajeError(asistenciaQuery.error)} /> : null}

      <FiltrosAsistencia filtros={filtros} onCambiar={cambiarFiltro} onEnviar={aplicarFiltros} />

      <div className="grid gap-3 md:grid-cols-4">
        <TarjetaDato etiqueta="Total" valor={total} />
        <TarjetaDato etiqueta="Presentes" valor={resumen.presente || 0} />
        <TarjetaDato etiqueta="Retrasos" valor={resumen.retraso || 0} />
        <TarjetaDato etiqueta="Faltas" valor={resumen.falta || 0} />
      </div>

      <TablaAsistenciasAlumno asistencias={asistencias} cargando={asistenciaQuery.isLoading} />
    </div>
  )
}

export default function AsistenciaAlumnos({ modo = 'alumno' }) {
  if (modo === 'admin') return <VistaAdministrativa />
  if (modo === 'docente') return <VistaDocente />
  return <VistaAlumno />
}
