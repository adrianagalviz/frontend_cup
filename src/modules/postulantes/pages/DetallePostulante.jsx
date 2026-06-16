import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, Copy, Edit, GraduationCap, XCircle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import BadgeEstado from '../../../components/common/BadgeEstado'
import Boton from '../../../components/common/Boton'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import EmptyState from '../../../components/common/EmptyState'
import Loader from '../../../components/common/Loader'
import MensajeError from '../../../components/common/MensajeError'
import Modal from '../../../components/common/Modal'
import Textarea from '../../../components/common/Textarea'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import { obtenerMensajeError } from '../../../lib/errores'
import { convertirPostulanteEnAlumno } from '../../../services/alumnos.service'
import { verPostulante } from '../../../services/postulantes.service'
import { validarRequisitos } from '../../../services/requisitos.service'

function Fila({ label, valor }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-900">{valor || 'No registrado'}</p>
    </div>
  )
}

function nombreCarrera(carrera) {
  if (!carrera) return ''
  return carrera.codigo ? `${carrera.codigo} - ${carrera.nombre}` : carrera.nombre
}

export default function DetallePostulante() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [accionRevision, setAccionRevision] = useState(null)
  const [observacion, setObservacion] = useState('')
  const [confirmarConversion, setConfirmarConversion] = useState(false)
  const [alumnoConvertido, setAlumnoConvertido] = useState(null)
  const postulanteQuery = useQuery({
    queryKey: ['postulante', id],
    queryFn: () => verPostulante(id),
  })

  const validarMutation = useMutation({
    mutationFn: ({ estadoRevision, observacionRevision }) => validarRequisitos(id, {
      estado_revision: estadoRevision,
      observacion: observacionRevision || undefined,
    }),
    onSuccess: () => {
      toast.success('Requisitos del postulante validados correctamente.')
      setAccionRevision(null)
      setObservacion('')
      queryClient.invalidateQueries({ queryKey: ['postulante', id] })
      queryClient.invalidateQueries({ queryKey: ['postulantes'] })
    },
  })

  const convertirMutation = useMutation({
    mutationFn: () => convertirPostulanteEnAlumno(id),
    onSuccess: (respuesta) => {
      const alumno = respuesta?.alumno
      setAlumnoConvertido(alumno || null)
      setConfirmarConversion(false)
      toast.success('Postulante convertido a alumno correctamente.')
      queryClient.invalidateQueries({ queryKey: ['postulante', id] })
      queryClient.invalidateQueries({ queryKey: ['postulantes'] })
    },
  })

  if (postulanteQuery.isLoading) return <Loader texto="Cargando postulante..." />
  if (postulanteQuery.error) return <MensajeError mensaje={obtenerMensajeError(postulanteQuery.error)} />

  const postulante = postulanteQuery.data?.postulante
  const documento = postulante?.documentos?.find((item) => item.tipo_documento === 'titulo_bachiller')
  const requisitosAprobados = postulante?.estado_requisitos === 'aprobado'
  const pagoConfirmado = postulante?.pago?.estado_pago === 'pagado' || postulante?.estado_pago === 'pagado'
  const pagoValidado = Boolean(postulante?.pago?.validado_por_usuario_id && postulante?.pago?.validado_en)
  const yaEsAlumno = postulante?.estado_postulante === 'habilitado_alumno'
  const puedeConvertir = requisitosAprobados && !yaEsAlumno
  const codigoAlumnoVisible = alumnoConvertido?.codigo_alumno || postulante?.alumno?.codigo_alumno || postulante?.alumno?.codigo_acceso
  const puedeValidar = Boolean(documento?.cloudinary_url)

  if (!postulante) return <EmptyState titulo="Postulante no encontrado" />

  async function copiarCodigo(codigo) {
    if (!codigo) return
    await navigator.clipboard.writeText(codigo)
    toast.success('Codigo de alumno copiado.')
  }

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Administrador', 'Postulantes', 'Detalle']} />
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">{postulante.persona?.nombres} {postulante.persona?.apellido_paterno}</h1>
          <p className="mt-1 text-sm text-slate-600">Detalle completo del postulante antes de validar o convertir.</p>
        </div>
        <Link to={`/admin/postulantes/${id}/editar`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800">
          <Edit className="h-4 w-4" />
          Editar
        </Link>
      </div>

      <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
        <Fila label="Cedula" valor={postulante.persona?.cedula_identidad} />
        <Fila label="Correo" valor={postulante.persona?.correo} />
        <Fila label="Telefono" valor={postulante.persona?.telefono} />
        <Fila label="Fecha nacimiento" valor={postulante.persona?.fecha_nacimiento} />
        <Fila label="Sexo" valor={postulante.persona?.sexo} />
        <Fila label="Ciudad" valor={postulante.persona?.ciudad} />
        <div className="md:col-span-3">
          <Fila label="Direccion" valor={postulante.persona?.direccion} />
        </div>
      </section>

      <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
        <Fila label="Colegio" valor={postulante.colegio_procedencia} />
        <Fila label="Gestion" valor={postulante.gestion_academica?.nombre} />
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Requisitos</p>
          <div className="mt-1"><BadgeEstado estado={postulante.estado_requisitos} /></div>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Pago</p>
          <div className="mt-1"><BadgeEstado estado={postulante.estado_pago} /></div>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Acceso como alumno</p>
          <div className="mt-1"><BadgeEstado estado={postulante.estado_postulante} /></div>
        </div>
        <Fila label="Observacion" valor={postulante.requisitos?.observacion} />
        <Fila label="Primera opcion" valor={nombreCarrera(postulante.postulacion?.primera_carrera)} />
        <Fila label="Segunda opcion" valor={nombreCarrera(postulante.postulacion?.segunda_carrera)} />
        <Fila label="Carrera asignada" valor={nombreCarrera(postulante.postulacion?.carrera_asignada)} />
        <div className="md:col-span-3">
          <div className={`rounded-md border p-3 text-sm ${requisitosAprobados ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
            {requisitosAprobados
              ? 'Los requisitos estan aprobados. Puedes dar acceso como alumno; el pago pendiente se completara desde su perfil.'
              : 'El administrador debe aprobar los requisitos antes de convertir el postulante en alumno.'}
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Acceso como alumno</h2>
            <p className="mt-1 text-sm text-slate-600">El codigo automatico lo genera el backend al convertir el postulante. La contrasena inicial es su numero de CI.</p>
          </div>
          <Boton disabled={!puedeConvertir} cargando={convertirMutation.isPending} onClick={() => setConfirmarConversion(true)}>
            <GraduationCap className="h-4 w-4" />
            Dar acceso como alumno
          </Boton>
        </div>

        {convertirMutation.error ? <MensajeError mensaje={obtenerMensajeError(convertirMutation.error)} /> : null}

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-medium uppercase text-slate-500">Requisitos</p>
            <div className="mt-2"><BadgeEstado estado={postulante.estado_requisitos} /></div>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-medium uppercase text-slate-500">Pago</p>
            <div className="mt-2"><BadgeEstado estado={pagoConfirmado ? 'pagado' : postulante.estado_pago} /></div>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-medium uppercase text-slate-500">Validacion pago</p>
            <div className="mt-2"><BadgeEstado estado={pagoValidado ? 'aprobado' : 'pendiente'} /></div>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-medium uppercase text-slate-500">Alumno</p>
            <div className="mt-2"><BadgeEstado estado={yaEsAlumno ? 'activo' : 'pendiente'} /></div>
          </div>
        </div>

        <div className={`rounded-md border p-3 text-sm ${puedeConvertir ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
          {puedeConvertir
            ? 'El postulante cumple requisitos. Al convertirlo, podra iniciar sesion como alumno y completar el pago desde su perfil.'
            : 'Para convertir debe tener requisitos aprobados y no haber sido convertido previamente.'}
        </div>

        {codigoAlumnoVisible ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">Codigo automatico del alumno</p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
              <code className="rounded-md bg-white px-3 py-2 text-lg font-bold text-slate-950 ring-1 ring-emerald-200">{codigoAlumnoVisible}</code>
              <Boton variante="secundario" onClick={() => copiarCodigo(codigoAlumnoVisible)}>
                <Copy className="h-4 w-4" />
                Copiar codigo
              </Boton>
            </div>
            <p className="mt-2 text-sm text-emerald-700">Para ingresar debe usar este codigo y su numero de CI como contrasena.</p>
          </div>
        ) : null}
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Titulo de bachiller</h2>
            <p className="mt-1 text-sm text-slate-600">Documento obligatorio para validar requisitos del postulante.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Boton disabled={!puedeValidar} onClick={() => setAccionRevision({ estado: 'aprobado', titulo: 'Aprobar requisitos' })}>
              <CheckCircle2 className="h-4 w-4" />
              Aprobar
            </Boton>
            <Boton variante="peligro" disabled={!puedeValidar} onClick={() => setAccionRevision({ estado: 'rechazado', titulo: 'Rechazar requisitos' })}>
              <XCircle className="h-4 w-4" />
              Rechazar
            </Boton>
          </div>
        </div>
        {validarMutation.error ? <div className="mt-4"><MensajeError mensaje={obtenerMensajeError(validarMutation.error)} /></div> : null}
        {documento?.cloudinary_url ? (
          <div className="mt-4 grid gap-3 md:grid-cols-[240px_1fr]">
            <img src={documento.cloudinary_url} alt="Titulo de bachiller" className="h-48 w-full rounded-md border border-slate-200 object-cover" />
            <div className="grid content-start gap-3">
              <BadgeEstado estado={documento.estado_revision} />
              <a className="break-all text-sm font-medium text-sky-700 hover:text-sky-800" href={documento.cloudinary_url} target="_blank" rel="noreferrer">
                Ver imagen en Cloudinary
              </a>
              <Fila label="Formato" valor={documento.formato_archivo} />
              <Fila label="Observacion" valor={documento.observacion} />
            </div>
          </div>
        ) : (
          <EmptyState titulo="Sin titulo de bachiller" descripcion="No existe documento cargado para este postulante." />
        )}
      </section>

      <Modal
        abierto={Boolean(accionRevision)}
        titulo={accionRevision?.titulo || 'Validar requisitos'}
        onCerrar={() => {
          if (!validarMutation.isPending) {
            setAccionRevision(null)
            setObservacion('')
          }
        }}
        acciones={(
          <>
            <Boton variante="secundario" disabled={validarMutation.isPending} onClick={() => { setAccionRevision(null); setObservacion('') }}>
              Cancelar
            </Boton>
            <Boton
              variante={accionRevision?.estado === 'rechazado' ? 'peligro' : 'primario'}
              cargando={validarMutation.isPending}
              onClick={() => validarMutation.mutate({
                estadoRevision: accionRevision.estado,
                observacionRevision: observacion,
              })}
            >
              Confirmar
            </Boton>
          </>
        )}
      >
        <div className="grid gap-3">
          <p>
            Confirma cambiar la revision del titulo de bachiller a <span className="font-semibold">{accionRevision?.estado}</span>.
          </p>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span>Observacion administrativa</span>
            <Textarea
              value={observacion}
              onChange={(event) => setObservacion(event.target.value)}
              placeholder="Opcional segun backend"
            />
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        abierto={confirmarConversion}
        titulo="Dar acceso como alumno"
        mensaje="Confirma convertir este postulante en alumno? El backend generara el codigo automatico de acceso y usara su numero de CI como contrasena inicial."
        onCancelar={() => setConfirmarConversion(false)}
        onConfirmar={() => convertirMutation.mutate()}
        cargando={convertirMutation.isPending}
      />
    </div>
  )
}
