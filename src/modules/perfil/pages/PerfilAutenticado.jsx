import { useQuery } from '@tanstack/react-query'
import BadgeEstado from '../../../components/common/BadgeEstado'
import Loader from '../../../components/common/Loader'
import MensajeError from '../../../components/common/MensajeError'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import { useAuth } from '../../../hooks/useAuth'
import { obtenerMensajeError } from '../../../lib/errores'

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
        <FilaDato etiqueta="Maestria" valor={docente?.tiene_maestria === undefined ? undefined : docente.tiene_maestria ? 'Si' : 'No'} />
        <FilaDato etiqueta="Diplomado educacion superior" valor={docente?.tiene_diplomado_educacion_superior === undefined ? undefined : docente.tiene_diplomado_educacion_superior ? 'Si' : 'No'} />
        <FilaDato etiqueta="Contratado" valor={docente?.contratado === undefined ? undefined : docente.contratado ? 'Si' : 'No'} />
      </>
    )
  }

  if (rol === 'alumno') {
    return (
      <>
        <FilaDato etiqueta="Codigo de alumno" valor={alumno?.codigo_alumno || usuario?.codigo_acceso} />
        <FilaDato etiqueta="Estado academico" valor={alumno?.estado_academico} />
        <FilaDato etiqueta="Gestion academica" valor={alumno?.gestion_academica_id} />
      </>
    )
  }

  return null
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
    </div>
  )
}

