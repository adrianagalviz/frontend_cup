import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Edit, Eye, Plus, Search, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import BadgeEstado from '../../../components/common/BadgeEstado'
import Boton from '../../../components/common/Boton'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import Input from '../../../components/common/Input'
import MensajeError from '../../../components/common/MensajeError'
import Modal from '../../../components/common/Modal'
import Select from '../../../components/common/Select'
import Textarea from '../../../components/common/Textarea'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import AccionesTabla from '../../../components/tables/AccionesTabla'
import TablaBase from '../../../components/tables/TablaBase'
import { obtenerMensajeError } from '../../../lib/errores'
import { crearCarrera, editarCarrera, listarCarreras } from '../../../services/carreras.service'
import { crearCupo, editarCupo, listarCupos } from '../../../services/cupos.service'
import { activarGestionGlobal, crearGestion, listarGestiones, obtenerGestionActual } from '../../../services/gestionAcademica.service'

const anioActual = new Date().getFullYear()

function estadoActivo(valor) {
  return valor ? 'activo' : 'inactivo'
}

function FormularioCarrera({ carrera, onGuardar, onCancelar, cargando }) {
  const [formulario, setFormulario] = useState({
    codigo: carrera?.codigo || '',
    nombre: carrera?.nombre || '',
    descripcion: carrera?.descripcion || '',
    activa: carrera?.activa ?? true,
  })

  function actualizar(campo, valor) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
  }

  function enviar(event) {
    event.preventDefault()
    onGuardar({
      codigo: formulario.codigo.trim().toUpperCase(),
      nombre: formulario.nombre.trim(),
      descripcion: formulario.descripcion.trim() || null,
      activa: Boolean(formulario.activa),
    })
  }

  return (
    <form className="grid gap-4" onSubmit={enviar}>
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        <span>Codigo de la carrera *</span>
        <Input value={formulario.codigo} onChange={(event) => actualizar('codigo', event.target.value)} required maxLength={30} placeholder="Ej. SIS" />
      </label>
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        <span>Nombre de la carrera *</span>
        <Input value={formulario.nombre} onChange={(event) => actualizar('nombre', event.target.value)} required maxLength={150} />
      </label>
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        <span>Descripcion</span>
        <Textarea value={formulario.descripcion} onChange={(event) => actualizar('descripcion', event.target.value)} />
      </label>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={formulario.activa}
          onChange={(event) => actualizar('activa', event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-600"
        />
        Carrera activa para postulaciones
      </label>
      <div className="flex justify-end gap-3">
        <Boton variante="secundario" onClick={onCancelar}>Cancelar</Boton>
        <Boton type="submit" cargando={cargando}>{carrera ? 'Guardar cambios' : 'Crear carrera'}</Boton>
      </div>
    </form>
  )
}

function FormularioGestion({ onGuardar, onCancelar, cargando }) {
  const [formulario, setFormulario] = useState({
    anio: String(anioActual),
    numero_gestion: '1',
    nombre: `${anioActual}-1`,
    fecha_inicio: '',
    fecha_fin: '',
    activa: true,
  })

  function actualizar(campo, valor) {
    setFormulario((actual) => {
      const siguiente = { ...actual, [campo]: valor }

      if (campo === 'anio' || campo === 'numero_gestion') {
        siguiente.nombre = `${siguiente.anio}-${siguiente.numero_gestion}`
      }

      return siguiente
    })
  }

  function enviar(event) {
    event.preventDefault()
    onGuardar({
      anio: Number(formulario.anio),
      numero_gestion: Number(formulario.numero_gestion),
      nombre: formulario.nombre.trim(),
      fecha_inicio: formulario.fecha_inicio || null,
      fecha_fin: formulario.fecha_fin || null,
      activa: Boolean(formulario.activa),
    })
  }

  return (
    <form className="grid gap-4" onSubmit={enviar}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          <span>Anio *</span>
          <Input type="number" min="2000" max="2100" value={formulario.anio} onChange={(event) => actualizar('anio', event.target.value)} required />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          <span>Gestion *</span>
          <Select value={formulario.numero_gestion} onChange={(event) => actualizar('numero_gestion', event.target.value)} required>
            <option value="1">1ra gestion</option>
            <option value="2">2da gestion</option>
          </Select>
        </label>
      </div>
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        <span>Nombre *</span>
        <Input value={formulario.nombre} onChange={(event) => actualizar('nombre', event.target.value)} required maxLength={100} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          <span>Fecha inicio</span>
          <Input type="date" value={formulario.fecha_inicio} onChange={(event) => actualizar('fecha_inicio', event.target.value)} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          <span>Fecha fin</span>
          <Input type="date" value={formulario.fecha_fin} onChange={(event) => actualizar('fecha_fin', event.target.value)} />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={formulario.activa}
          onChange={(event) => actualizar('activa', event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-600"
        />
        Definir como gestion global al crear
      </label>
      <div className="flex justify-end gap-3">
        <Boton variante="secundario" onClick={onCancelar}>Cancelar</Boton>
        <Boton type="submit" cargando={cargando}>Crear gestion</Boton>
      </div>
    </form>
  )
}

function FormularioCupo({ cupo, carreras = [], gestiones = [], onGuardar, onCancelar, cargando }) {
  const [formulario, setFormulario] = useState({
    carrera_id: cupo?.carrera?.id ? String(cupo.carrera.id) : '',
    gestion_academica_id: cupo?.gestion_academica?.id ? String(cupo.gestion_academica.id) : '',
    cantidad_cupos: cupo?.cantidad_cupos !== undefined ? String(cupo.cantidad_cupos) : '',
  })

  function actualizar(campo, valor) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
  }

  function enviar(event) {
    event.preventDefault()
    onGuardar({
      carrera_id: Number(formulario.carrera_id),
      gestion_academica_id: Number(formulario.gestion_academica_id),
      cantidad_cupos: Number(formulario.cantidad_cupos),
    })
  }

  return (
    <form className="grid gap-4" onSubmit={enviar}>
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        <span>Carrera *</span>
        <Select value={formulario.carrera_id} onChange={(event) => actualizar('carrera_id', event.target.value)} required>
          <option value="">Seleccionar carrera</option>
          {carreras.map((carrera) => <option key={carrera.id} value={carrera.id}>{carrera.codigo ? `${carrera.codigo} - ${carrera.nombre}` : carrera.nombre}</option>)}
        </Select>
      </label>
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        <span>Gestion academica *</span>
        <Select value={formulario.gestion_academica_id} onChange={(event) => actualizar('gestion_academica_id', event.target.value)} required>
          <option value="">Seleccionar gestion</option>
          {gestiones.map((gestion) => <option key={gestion.id} value={gestion.id}>{gestion.nombre}</option>)}
        </Select>
      </label>
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        <span>Cantidad de cupos *</span>
        <Input type="number" min="0" value={formulario.cantidad_cupos} onChange={(event) => actualizar('cantidad_cupos', event.target.value)} required />
      </label>
      {cupo ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <p>Cupos usados: <span className="font-semibold text-slate-950">{cupo.cupos_ocupados}</span></p>
          <p>Cupos disponibles: <span className="font-semibold text-slate-950">{cupo.cupos_disponibles}</span></p>
        </div>
      ) : null}
      <div className="flex justify-end gap-3">
        <Boton variante="secundario" onClick={onCancelar}>Cancelar</Boton>
        <Boton type="submit" cargando={cargando}>{cupo ? 'Guardar cupo' : 'Crear cupo'}</Boton>
      </div>
    </form>
  )
}

function FilaDetalle({ etiqueta, valor }) {
  const texto = valor === null || valor === undefined || valor === '' ? 'No registrado' : valor

  return (
    <div>
      <p className="text-xs font-medium uppercase text-slate-500">{etiqueta}</p>
      <p className="mt-1 text-sm text-slate-900">{texto}</p>
    </div>
  )
}

export default function GestionAcademica() {
  const queryClient = useQueryClient()
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState({ buscar: '', activa: '' })
  const [filtrosCupos, setFiltrosCupos] = useState({ carrera_id: '', gestion_academica_id: '' })
  const [modalCarrera, setModalCarrera] = useState(null)
  const [detalleCarrera, setDetalleCarrera] = useState(null)
  const [carreraEstado, setCarreraEstado] = useState(null)
  const [modalGestion, setModalGestion] = useState(false)
  const [gestionActivar, setGestionActivar] = useState(null)
  const [modalCupo, setModalCupo] = useState(null)
  const [detalleCupo, setDetalleCupo] = useState(null)

  const gestionesQuery = useQuery({
    queryKey: ['gestiones-academicas'],
    queryFn: () => listarGestiones({ por_pagina: 100 }),
  })

  const gestionActualQuery = useQuery({
    queryKey: ['gestion-academica-actual'],
    queryFn: obtenerGestionActual,
    retry: false,
  })

  const carrerasQuery = useQuery({
    queryKey: ['carreras-admin', filtros],
    queryFn: () => listarCarreras({
      por_pagina: 100,
      buscar: filtros.buscar || undefined,
      activa: filtros.activa || undefined,
    }),
  })

  const carrerasActivasQuery = useQuery({
    queryKey: ['carreras-opciones-cupos'],
    queryFn: () => listarCarreras({ por_pagina: 100, activa: 'true' }),
  })

  const cuposQuery = useQuery({
    queryKey: ['cupos-admin', filtrosCupos],
    queryFn: () => listarCupos({
      por_pagina: 100,
      carrera_id: filtrosCupos.carrera_id || undefined,
      gestion_academica_id: filtrosCupos.gestion_academica_id || undefined,
    }),
  })

  const crearGestionMutation = useMutation({
    mutationFn: crearGestion,
    onSuccess: () => {
      toast.success('Gestion academica creada correctamente.')
      setModalGestion(false)
      queryClient.invalidateQueries({ queryKey: ['gestiones-academicas'] })
      queryClient.invalidateQueries({ queryKey: ['gestion-academica-actual'] })
      queryClient.invalidateQueries({ queryKey: ['postulantes', 'gestion-actual'] })
    },
  })

  const activarGestionMutation = useMutation({
    mutationFn: (gestion) => activarGestionGlobal(gestion.id),
    onSuccess: () => {
      toast.success('Gestion global actualizada correctamente.')
      setGestionActivar(null)
      queryClient.invalidateQueries({ queryKey: ['gestiones-academicas'] })
      queryClient.invalidateQueries({ queryKey: ['gestion-academica-actual'] })
      queryClient.invalidateQueries({ queryKey: ['postulantes', 'gestion-actual'] })
    },
  })

  const guardarCarreraMutation = useMutation({
    mutationFn: ({ carrera, payload }) => (carrera ? editarCarrera(carrera.id, payload) : crearCarrera(payload)),
    onSuccess: () => {
      toast.success('Carrera guardada correctamente.')
      setModalCarrera(null)
      queryClient.invalidateQueries({ queryKey: ['carreras-admin'] })
      queryClient.invalidateQueries({ queryKey: ['postulantes', 'carreras'] })
      queryClient.invalidateQueries({ queryKey: ['carreras-opciones-cupos'] })
    },
  })

  const cambiarEstadoCarreraMutation = useMutation({
    mutationFn: (carrera) => editarCarrera(carrera.id, { activa: !carrera.activa }),
    onSuccess: () => {
      toast.success('Estado de carrera actualizado correctamente.')
      setCarreraEstado(null)
      queryClient.invalidateQueries({ queryKey: ['carreras-admin'] })
      queryClient.invalidateQueries({ queryKey: ['postulantes', 'carreras'] })
      queryClient.invalidateQueries({ queryKey: ['carreras-opciones-cupos'] })
    },
  })

  const guardarCupoMutation = useMutation({
    mutationFn: ({ cupo, payload }) => (cupo ? editarCupo(cupo.id, payload) : crearCupo(payload)),
    onSuccess: () => {
      toast.success('Cupo guardado correctamente.')
      setModalCupo(null)
      queryClient.invalidateQueries({ queryKey: ['cupos-admin'] })
    },
  })

  const gestionActual = gestionActualQuery.data?.gestion
  const gestiones = gestionesQuery.data || []
  const carreras = carrerasQuery.data || []
  const carrerasActivas = carrerasActivasQuery.data || []
  const cupos = cuposQuery.data || []
  const cupoMenosOcupado = cupos.length
    ? cupos.reduce((menor, cupo) => Number(cupo.cupos_ocupados || 0) < Number(menor.cupos_ocupados || 0) ? cupo : menor, cupos[0])
    : null

  const columnasGestiones = useMemo(() => [
    { header: 'Nombre', cell: ({ row }) => row.original.nombre },
    { header: 'Anio', cell: ({ row }) => row.original.anio },
    { header: 'Gestion', cell: ({ row }) => row.original.numero_gestion === 1 ? '1ra gestion' : '2da gestion' },
    { header: 'Estado', cell: ({ row }) => <BadgeEstado estado={estadoActivo(row.original.activa)} /> },
    {
      header: 'Acciones',
      cell: ({ row }) => (
        <AccionesTabla>
          <Boton
            variante={row.original.activa ? 'neutro' : 'secundario'}
            disabled={row.original.activa}
            className="min-h-9 px-3"
            onClick={() => setGestionActivar(row.original)}
          >
            <CheckCircle2 className="h-4 w-4" />
            {row.original.activa ? 'Actual' : 'Activar'}
          </Boton>
        </AccionesTabla>
      ),
    },
  ], [])

  const columnasCarreras = useMemo(() => [
    {
      header: 'Carrera',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-950">{row.original.nombre}</p>
          <p className="text-xs font-semibold text-sky-700">{row.original.codigo || 'Sin codigo'}</p>
          <p className="max-w-xl truncate text-xs text-slate-500">{row.original.descripcion || 'Sin descripcion'}</p>
        </div>
      ),
    },
    { header: 'Codigo', cell: ({ row }) => row.original.codigo || 'No registrado' },
    { header: 'Estado', cell: ({ row }) => <BadgeEstado estado={estadoActivo(row.original.activa)} /> },
    {
      header: 'Acciones',
      cell: ({ row }) => (
        <AccionesTabla>
          <Boton variante="secundario" className="min-h-9 px-3" onClick={() => setDetalleCarrera(row.original)}>
            <Eye className="h-4 w-4" />
          </Boton>
          <Boton variante="secundario" className="min-h-9 px-3" onClick={() => setModalCarrera(row.original)}>
            <Edit className="h-4 w-4" />
          </Boton>
          <Boton variante={row.original.activa ? 'peligro' : 'primario'} className="min-h-9 px-3" onClick={() => setCarreraEstado(row.original)}>
            {row.original.activa ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          </Boton>
        </AccionesTabla>
      ),
    },
  ], [])

  const columnasCupos = useMemo(() => [
    { header: 'Carrera', cell: ({ row }) => row.original.carrera?.codigo ? `${row.original.carrera.codigo} - ${row.original.carrera.nombre}` : row.original.carrera?.nombre || 'No registrada' },
    { header: 'Gestion', cell: ({ row }) => row.original.gestion_academica?.nombre || 'No registrada' },
    { header: 'Cupos', cell: ({ row }) => row.original.cantidad_cupos },
    { header: 'Usados', cell: ({ row }) => row.original.cupos_ocupados },
    { header: 'Disponibles', cell: ({ row }) => row.original.cupos_disponibles },
    {
      header: 'Acciones',
      cell: ({ row }) => (
        <AccionesTabla>
          <Boton variante="secundario" className="min-h-9 px-3" onClick={() => setDetalleCupo(row.original)}>
            <Eye className="h-4 w-4" />
          </Boton>
          <Boton variante="secundario" className="min-h-9 px-3" onClick={() => setModalCupo(row.original)}>
            <Edit className="h-4 w-4" />
          </Boton>
        </AccionesTabla>
      ),
    },
  ], [])

  function aplicarFiltros(event) {
    event.preventDefault()
    setFiltros((actuales) => ({ ...actuales, buscar: busqueda }))
  }

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Administrador', 'Gestion academica']} />
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Gestion academica</h1>
          <p className="mt-1 text-sm text-slate-600">Gestion global de postulaciones y CRUD de carreras.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Boton variante="secundario" onClick={() => setModalGestion(true)}>
            <Plus className="h-4 w-4" />
            Crear gestion
          </Boton>
          <Boton onClick={() => setModalCarrera({})}>
            <Plus className="h-4 w-4" />
            Crear carrera
          </Boton>
          <Boton variante="secundario" onClick={() => setModalCupo({})}>
            <Plus className="h-4 w-4" />
            Crear cupo
          </Boton>
        </div>
      </div>

      {gestionesQuery.error ? <MensajeError mensaje={obtenerMensajeError(gestionesQuery.error)} /> : null}
      {gestionActualQuery.error ? <MensajeError mensaje="No existe una gestion academica global activa. Crea o activa una gestion para habilitar nuevos postulantes." /> : null}
      {carrerasQuery.error ? <MensajeError mensaje={obtenerMensajeError(carrerasQuery.error)} /> : null}
      {crearGestionMutation.error ? <MensajeError mensaje={obtenerMensajeError(crearGestionMutation.error)} /> : null}
      {activarGestionMutation.error ? <MensajeError mensaje={obtenerMensajeError(activarGestionMutation.error)} /> : null}
      {guardarCarreraMutation.error ? <MensajeError mensaje={obtenerMensajeError(guardarCarreraMutation.error)} /> : null}
      {cambiarEstadoCarreraMutation.error ? <MensajeError mensaje={obtenerMensajeError(cambiarEstadoCarreraMutation.error)} /> : null}
      {cuposQuery.error ? <MensajeError mensaje={obtenerMensajeError(cuposQuery.error)} /> : null}
      {guardarCupoMutation.error ? <MensajeError mensaje={obtenerMensajeError(guardarCupoMutation.error)} /> : null}

      <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[280px_1fr]">
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Gestion global actual</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">{gestionActual?.nombre || 'Sin gestion activa'}</h2>
          <p className="mt-2 text-sm text-slate-600">
            Esta gestion se asigna automaticamente a todos los nuevos postulantes.
          </p>
        </div>
        <TablaBase columnas={columnasGestiones} datos={gestiones} cargando={gestionesQuery.isLoading} mensajeVacio="No existen gestiones academicas registradas." />
      </section>

      <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Carreras</h2>
            <p className="mt-1 text-sm text-slate-600">Carreras disponibles para primera y segunda opcion de postulacion.</p>
          </div>
          <form className="grid gap-3 sm:grid-cols-[1fr_180px_auto]" onSubmit={aplicarFiltros}>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              <span>Buscar</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input className="pl-9" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Nombre o codigo de carrera" />
              </div>
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              <span>Estado</span>
              <Select value={filtros.activa} onChange={(event) => setFiltros((actuales) => ({ ...actuales, activa: event.target.value }))}>
                <option value="">Todas</option>
                <option value="true">Activas</option>
                <option value="false">Inactivas</option>
              </Select>
            </label>
            <div className="flex items-end">
              <Boton type="submit" className="w-full">Buscar</Boton>
            </div>
          </form>
        </div>
        <TablaBase columnas={columnasCarreras} datos={carreras} cargando={carrerasQuery.isLoading} mensajeVacio="No existen carreras con los filtros seleccionados." />
      </section>

      <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Cupos por carrera y gestion</h2>
            <p className="mt-1 text-sm text-slate-600">Control de cupos definidos, usados y disponibles segun respuesta del backend.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[220px_220px_auto]">
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              <span>Carrera</span>
              <Select value={filtrosCupos.carrera_id} onChange={(event) => setFiltrosCupos((actuales) => ({ ...actuales, carrera_id: event.target.value }))}>
                <option value="">Todas</option>
                {carrerasActivas.map((carrera) => <option key={carrera.id} value={carrera.id}>{carrera.codigo ? `${carrera.codigo} - ${carrera.nombre}` : carrera.nombre}</option>)}
              </Select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              <span>Gestion</span>
              <Select value={filtrosCupos.gestion_academica_id} onChange={(event) => setFiltrosCupos((actuales) => ({ ...actuales, gestion_academica_id: event.target.value }))}>
                <option value="">Todas</option>
                {gestiones.map((gestion) => <option key={gestion.id} value={gestion.id}>{gestion.nombre}</option>)}
              </Select>
            </label>
            <div className="flex items-end">
              <Boton variante="secundario" className="w-full" onClick={() => setFiltrosCupos({ carrera_id: '', gestion_academica_id: '' })}>
                Limpiar
              </Boton>
            </div>
          </div>
        </div>

        {cupoMenosOcupado ? (
          <div className="rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
            Carrera con menos personas en los filtros actuales: <span className="font-semibold">{cupoMenosOcupado.carrera?.codigo ? `${cupoMenosOcupado.carrera.codigo} - ${cupoMenosOcupado.carrera.nombre}` : cupoMenosOcupado.carrera?.nombre}</span> con {cupoMenosOcupado.cupos_ocupados} cupos usados.
          </div>
        ) : null}

        <TablaBase columnas={columnasCupos} datos={cupos} cargando={cuposQuery.isLoading} mensajeVacio="No existen cupos registrados para los filtros seleccionados." />
      </section>

      <Modal
        abierto={Boolean(modalGestion)}
        titulo="Crear gestion academica"
        onCerrar={() => setModalGestion(false)}
        acciones={<></>}
      >
        <FormularioGestion
          onGuardar={(payload) => crearGestionMutation.mutate(payload)}
          onCancelar={() => setModalGestion(false)}
          cargando={crearGestionMutation.isPending}
        />
      </Modal>

      <Modal
        abierto={Boolean(modalCarrera)}
        titulo={modalCarrera?.id ? 'Editar carrera' : 'Crear carrera'}
        onCerrar={() => setModalCarrera(null)}
        acciones={<></>}
      >
        <FormularioCarrera
          carrera={modalCarrera?.id ? modalCarrera : null}
          onGuardar={(payload) => guardarCarreraMutation.mutate({ carrera: modalCarrera?.id ? modalCarrera : null, payload })}
          onCancelar={() => setModalCarrera(null)}
          cargando={guardarCarreraMutation.isPending}
        />
      </Modal>

      <Modal
        abierto={Boolean(detalleCarrera)}
        titulo="Detalle de carrera"
        onCerrar={() => setDetalleCarrera(null)}
      >
        <div className="grid gap-4">
          <FilaDetalle etiqueta="Nombre" valor={detalleCarrera?.nombre} />
          <FilaDetalle etiqueta="Codigo" valor={detalleCarrera?.codigo} />
          <FilaDetalle etiqueta="Descripcion" valor={detalleCarrera?.descripcion} />
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Estado</p>
            <div className="mt-1"><BadgeEstado estado={estadoActivo(detalleCarrera?.activa)} /></div>
          </div>
        </div>
      </Modal>

      <Modal
        abierto={Boolean(modalCupo)}
        titulo={modalCupo?.id ? 'Editar cupo' : 'Crear cupo'}
        onCerrar={() => setModalCupo(null)}
        acciones={<></>}
      >
        <FormularioCupo
          cupo={modalCupo?.id ? modalCupo : null}
          carreras={carrerasActivas}
          gestiones={gestiones}
          onGuardar={(payload) => guardarCupoMutation.mutate({ cupo: modalCupo?.id ? modalCupo : null, payload })}
          onCancelar={() => setModalCupo(null)}
          cargando={guardarCupoMutation.isPending}
        />
      </Modal>

      <Modal
        abierto={Boolean(detalleCupo)}
        titulo="Detalle de cupo"
        onCerrar={() => setDetalleCupo(null)}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FilaDetalle etiqueta="Carrera" valor={detalleCupo?.carrera?.codigo ? `${detalleCupo.carrera.codigo} - ${detalleCupo.carrera.nombre}` : detalleCupo?.carrera?.nombre} />
          <FilaDetalle etiqueta="Gestion" valor={detalleCupo?.gestion_academica?.nombre} />
          <FilaDetalle etiqueta="Cupos definidos" valor={detalleCupo?.cantidad_cupos} />
          <FilaDetalle etiqueta="Cupos usados" valor={detalleCupo?.cupos_ocupados} />
          <FilaDetalle etiqueta="Cupos disponibles" valor={detalleCupo?.cupos_disponibles} />
          <FilaDetalle etiqueta="Actualizado en" valor={detalleCupo?.actualizado_en} />
        </div>
      </Modal>

      <ConfirmDialog
        abierto={Boolean(gestionActivar)}
        titulo="Definir gestion global"
        mensaje={`Confirma definir ${gestionActivar?.nombre || 'esta gestion'} como gestion global para nuevos postulantes?`}
        onCancelar={() => setGestionActivar(null)}
        onConfirmar={() => activarGestionMutation.mutate(gestionActivar)}
        cargando={activarGestionMutation.isPending}
      />

      <ConfirmDialog
        abierto={Boolean(carreraEstado)}
        titulo={carreraEstado?.activa ? 'Desactivar carrera' : 'Activar carrera'}
        mensaje={`Confirma ${carreraEstado?.activa ? 'desactivar' : 'activar'} la carrera ${carreraEstado?.nombre || ''}?`}
        onCancelar={() => setCarreraEstado(null)}
        onConfirmar={() => cambiarEstadoCarreraMutation.mutate(carreraEstado)}
        cargando={cambiarEstadoCarreraMutation.isPending}
      />
    </div>
  )
}
