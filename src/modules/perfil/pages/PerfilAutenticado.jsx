import { useQuery } from '@tanstack/react-query'
import { Copy, Download, FileText, Upload } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import BadgeEstado from '../../../components/common/BadgeEstado'
import Boton from '../../../components/common/Boton'
import Loader from '../../../components/common/Loader'
import MensajeError from '../../../components/common/MensajeError'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import { useAuth } from '../../../hooks/useAuth'
import { obtenerMensajeError } from '../../../lib/errores'
import { subirCvDocentePerfil } from '../../../services/auth.service'
import { descargarCvDocente } from '../../../services/docentes.service'

function FilaDato({ etiqueta, valor }) {
  if (valor === null || valor === undefined || valor === '') return null

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{etiqueta}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-950">{String(valor)}</dd>
    </div>
  )
}

function DatosRol({ usuario }) {
  const rol = usuario?.rol
  const datosRol = usuario?.datos_rol || {}
  const administrador = datosRol.administrador
  const docente = datosRol.docente
  const alumno = datosRol.alumno

  if (rol === 'administrador') {
    return (
      <>
        <FilaDato etiqueta="Administrador activo" valor={administrador?.activo === undefined ? undefined : administrador.activo ? 'Si' : 'No'} />
        <FilaDato etiqueta="ID administrador" valor={administrador?.id} />
      </>
    )
  }

  if (rol === 'docente') {
    return (
      <>
        <FilaDato etiqueta="Profesional del area" valor={docente?.es_profesional_area === undefined ? undefined : docente.es_profesional_area ? 'Si' : 'No'} />
        <FilaDato etiqueta="Area profesional" valor={docente?.materia_profesional?.nombre} />
        <FilaDato etiqueta="Maestria" valor={docente?.tiene_maestria === undefined ? undefined : docente.tiene_maestria ? 'Si' : 'No'} />
        <FilaDato etiqueta="Diplomado educacion superior" valor={docente?.tiene_diplomado_educacion_superior === undefined ? undefined : docente.tiene_diplomado_educacion_superior ? 'Si' : 'No'} />
        <FilaDato etiqueta="Contratado" valor={docente?.contratado === undefined ? undefined : docente.contratado ? 'Si' : 'No'} />
      </>
    )
  }

  if (rol === 'alumno') {
    return (
      <>
        <CodigoAlumno codigo={alumno?.codigo_alumno || usuario?.codigo_acceso} />
        <FilaDato etiqueta="Estado academico" valor={alumno?.estado_academico} />
        <FilaDato etiqueta="Gestion academica" valor={alumno?.gestion_academica_id} />
      </>
    )
  }

  return null
}

function CvDocente({ docente, onActualizado }) {
  const [archivo, setArchivo] = useState(null)
  const [subiendo, setSubiendo] = useState(false)
  const tieneCv = Boolean(docente?.cv_pdf?.tiene_pdf || docente?.cv_pdf?.url)

  function cambiarArchivo(event) {
    const seleccionado = event.target.files?.[0] || null

    if (seleccionado && seleccionado.type !== 'application/pdf') {
      toast.error('El CV debe ser un archivo PDF.')
      event.target.value = ''
      setArchivo(null)
      return
    }

    setArchivo(seleccionado)
  }

  async function subir(event) {
    event.preventDefault()

    if (!archivo) {
      toast.error('Selecciona un PDF para subir.')
      return
    }

    try {
      setSubiendo(true)
      await subirCvDocentePerfil(archivo)
      toast.success('CV subido correctamente.')
      setArchivo(null)
      await onActualizado()
    } catch (error) {
      toast.error(obtenerMensajeError(error))
    } finally {
      setSubiendo(false)
    }
  }

  function verCv() {
    if (!docente?.cv_pdf?.url) {
      toast.error('No existe un CV registrado.')
      return
    }

    window.open(docente.cv_pdf.url, '_blank', 'noopener,noreferrer')
  }

  function descargarCv() {
    descargarCvDocente(docente, docente?.cv_pdf?.nombre_original || `cv-docente-${docente?.id}.pdf`)
  }

  return (
    <section className="grid gap-3 rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">PDF del CV</h2>
          <p className="mt-1 break-all text-sm text-slate-600">{tieneCv ? docente.cv_pdf?.nombre_original || 'CV registrado' : 'Aun no subiste tu CV.'}</p>
        </div>
        {tieneCv ? (
          <div className="flex flex-wrap gap-2">
            <Boton variante="secundario" onClick={verCv}>
              <FileText className="h-4 w-4" />
              Ver PDF
            </Boton>
            <Boton variante="secundario" onClick={descargarCv}>
              <Download className="h-4 w-4" />
              Descargar
            </Boton>
          </div>
        ) : null}
      </div>

      <form className="grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={subir}>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          <span>{tieneCv ? 'Reemplazar CV' : 'Subir CV'}</span>
          <input
            type="file"
            accept="application/pdf"
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700"
            onChange={cambiarArchivo}
          />
          <span className="text-xs font-normal text-slate-500">Formato permitido: PDF hasta 10 MB.</span>
        </label>
        <div className="flex items-end">
          <Boton type="submit" cargando={subiendo} disabled={!archivo}>
            <Upload className="h-4 w-4" />
            Subir CV
          </Boton>
        </div>
      </form>
    </section>
  )
}

function CodigoAlumno({ codigo }) {
  if (!codigo) return null

  async function copiar() {
    await navigator.clipboard.writeText(codigo)
    toast.success('Codigo de alumno copiado.')
  }

  return (
    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Codigo de alumno</dt>
      <dd className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
        <code className="rounded-md bg-white px-3 py-2 text-lg font-bold text-slate-950 ring-1 ring-emerald-200">{codigo}</code>
        <Boton variante="secundario" onClick={copiar}>
          <Copy className="h-4 w-4" />
          Copiar
        </Boton>
      </dd>
      <p className="mt-2 text-sm text-emerald-700">Este codigo sirve para iniciar sesion como alumno.</p>
    </div>
  )
}

export default function PerfilAutenticado() {
  const { usuario, refrescarPerfil } = useAuth()
  const { data, isLoading, error } = useQuery({
    queryKey: ['perfil-autenticado'],
    queryFn: refrescarPerfil,
    initialData: usuario,
    staleTime: 1000 * 60 * 5,
  })

  if (isLoading) return <Loader texto="Cargando perfil..." />

  const perfil = data || usuario
  const persona = perfil?.persona || {}

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Perfil']} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Perfil autenticado</h1>
          <p className="mt-1 text-sm text-slate-600">Datos obtenidos desde el backend Laravel.</p>
        </div>
        <BadgeEstado estado={perfil?.rol} />
      </div>

      {error ? <MensajeError mensaje={obtenerMensajeError(error)} /> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <FilaDato etiqueta="Usuario" valor={perfil?.nombre_usuario} />
        <FilaDato etiqueta="Rol" valor={perfil?.rol} />
        <FilaDato etiqueta="Cuenta activa" valor={perfil?.activo === undefined ? undefined : perfil.activo ? 'Si' : 'No'} />
        <FilaDato etiqueta="Correo verificado" valor={perfil?.correo_verificado === undefined ? undefined : perfil.correo_verificado ? 'Si' : 'No'} />
        <FilaDato etiqueta="Codigo de acceso" valor={perfil?.codigo_acceso} />
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-950">Datos personales</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <FilaDato etiqueta="Cedula de identidad" valor={persona.cedula_identidad} />
          <FilaDato etiqueta="Nombres" valor={persona.nombres} />
          <FilaDato etiqueta="Apellido paterno" valor={persona.apellido_paterno} />
          <FilaDato etiqueta="Apellido materno" valor={persona.apellido_materno} />
          <FilaDato etiqueta="Correo" valor={persona.correo} />
          <FilaDato etiqueta="Celular" valor={persona.celular} />
          <FilaDato etiqueta="Ciudad" valor={persona.ciudad} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-950">Informacion segun rol</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <DatosRol usuario={perfil} />
        </div>
      </section>

      {perfil?.rol === 'docente' ? <CvDocente docente={perfil?.datos_rol?.docente} onActualizado={refrescarPerfil} /> : null}
    </div>
  )
}
