import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { FileImage, GraduationCap, UserRound } from 'lucide-react'
import Boton from '../../../components/common/Boton'
import CampoArchivo from '../../../components/forms/CampoArchivo'
import CampoFecha from '../../../components/forms/CampoFecha'
import CampoSelect from '../../../components/forms/CampoSelect'
import CampoTexto from '../../../components/forms/CampoTexto'
import { aplicarErroresFormulario } from '../../../lib/errores'

function crearSchema({ requiereArchivo }) {
  return z.object({
    cedula_identidad: z.string().min(1, 'La cedula de identidad es obligatoria.'),
    nombres: z.string().min(1, 'Los nombres son obligatorios.'),
    apellido_paterno: z.string().min(1, 'El apellido paterno es obligatorio.'),
    apellido_materno: z.string().min(1, 'El apellido materno es obligatorio.'),
    fecha_nacimiento: z.string().min(1, 'La fecha de nacimiento es obligatoria.'),
    sexo: z.string().min(1, 'El sexo es obligatorio.'),
    direccion: z.string().min(1, 'La direccion es obligatoria.'),
    telefono: z.string().min(1, 'El telefono es obligatorio.'),
    correo: z.string().min(1, 'El correo es obligatorio.').email('El correo debe ser valido.'),
    colegio_procedencia: z.string().min(1, 'El colegio de procedencia es obligatorio.'),
    ciudad: z.string().min(1, 'La ciudad es obligatoria.'),
    gestion_academica_id: z.string().optional(),
    primera_carrera_id: z.string().min(1, 'La primera opcion de carrera es obligatoria.'),
    segunda_carrera_id: z.string().min(1, 'La segunda opcion de carrera es obligatoria.'),
    titulo_bachiller: z.any().optional(),
  }).superRefine((values, ctx) => {
    if (values.primera_carrera_id && values.segunda_carrera_id && values.primera_carrera_id === values.segunda_carrera_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['segunda_carrera_id'],
        message: 'La primera y segunda opcion de carrera deben ser diferentes.',
      })
    }

    const archivo = values.titulo_bachiller?.[0]

    if (requiereArchivo && !archivo) {
      ctx.addIssue({
        code: 'custom',
        path: ['titulo_bachiller'],
        message: 'La imagen del titulo de bachiller es obligatoria.',
      })
      return
    }

    if (archivo && !['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
      ctx.addIssue({
        code: 'custom',
        path: ['titulo_bachiller'],
        message: 'La imagen debe ser JPG, PNG o WEBP.',
      })
    }
  })
}

const valoresIniciales = {
  cedula_identidad: '',
  nombres: '',
  apellido_paterno: '',
  apellido_materno: '',
  fecha_nacimiento: '',
  sexo: '',
  direccion: '',
  telefono: '',
  correo: '',
  colegio_procedencia: '',
  ciudad: '',
  gestion_academica_id: '',
  primera_carrera_id: '',
  segunda_carrera_id: '',
  titulo_bachiller: undefined,
}

function valoresDesdePostulante(postulante, gestionActual) {
  if (!postulante) {
    return {
      ...valoresIniciales,
      gestion_academica_id: gestionActual?.id ? String(gestionActual.id) : '',
    }
  }

  return {
    cedula_identidad: postulante.persona?.cedula_identidad || postulante.cedula_identidad || '',
    nombres: postulante.persona?.nombres || postulante.nombres || '',
    apellido_paterno: postulante.persona?.apellido_paterno || postulante.apellido_paterno || '',
    apellido_materno: postulante.persona?.apellido_materno || postulante.apellido_materno || '',
    fecha_nacimiento: postulante.persona?.fecha_nacimiento || '',
    sexo: postulante.persona?.sexo || '',
    direccion: postulante.persona?.direccion || '',
    telefono: postulante.persona?.telefono || postulante.telefono || '',
    correo: postulante.persona?.correo || postulante.correo || '',
    colegio_procedencia: postulante.colegio_procedencia || '',
    ciudad: postulante.persona?.ciudad || postulante.ciudad || '',
    gestion_academica_id: postulante.gestion_academica?.id ? String(postulante.gestion_academica.id) : '',
    primera_carrera_id: postulante.postulacion?.primera_carrera?.id ? String(postulante.postulacion.primera_carrera.id) : '',
    segunda_carrera_id: postulante.postulacion?.segunda_carrera?.id ? String(postulante.postulacion.segunda_carrera.id) : '',
    titulo_bachiller: undefined,
  }
}

function normalizarPayload(values) {
  const payload = {
    cedula_identidad: values.cedula_identidad,
    nombres: values.nombres,
    apellido_paterno: values.apellido_paterno,
    apellido_materno: values.apellido_materno,
    fecha_nacimiento: values.fecha_nacimiento,
    sexo: values.sexo,
    direccion: values.direccion,
    telefono: values.telefono,
    correo: values.correo,
    colegio_procedencia: values.colegio_procedencia,
    ciudad: values.ciudad,
    primera_carrera_id: Number(values.primera_carrera_id),
    segunda_carrera_id: Number(values.segunda_carrera_id),
  }

  if (values.gestion_academica_id) {
    payload.gestion_academica_id = Number(values.gestion_academica_id)
  }

  return {
    payload,
    archivo: values.titulo_bachiller?.[0] || null,
  }
}

export default function FormularioPostulante({
  postulante,
  carreras = [],
  gestionActual,
  onGuardar,
  onCancelar,
  cargando = false,
  requiereArchivo = false,
}) {
  const schema = useMemo(() => crearSchema({ requiereArchivo }), [requiereArchivo])
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: valoresDesdePostulante(postulante, gestionActual),
  })

  useEffect(() => {
    reset(valoresDesdePostulante(postulante, gestionActual))
  }, [gestionActual, postulante, reset])

  async function enviar(values) {
    try {
      await onGuardar(normalizarPayload(values))
    } catch (error) {
      aplicarErroresFormulario(error, setError)
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(enviar)}>
      <section className="grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2">
          <UserRound className="h-5 w-5 text-sky-700" />
          <h2 className="text-base font-bold text-slate-950">Datos personales</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <CampoTexto label="Cedula de identidad" name="cedula_identidad" register={register} error={errors.cedula_identidad} requerido />
          <CampoTexto label="Nombres" name="nombres" register={register} error={errors.nombres} requerido />
          <CampoTexto label="Apellido paterno" name="apellido_paterno" register={register} error={errors.apellido_paterno} requerido />
          <CampoTexto label="Apellido materno" name="apellido_materno" register={register} error={errors.apellido_materno} requerido />
          <CampoFecha label="Fecha de nacimiento" name="fecha_nacimiento" register={register} error={errors.fecha_nacimiento} requerido />
          <CampoSelect label="Sexo" name="sexo" register={register} error={errors.sexo} requerido>
            <option value="">Seleccionar</option>
            <option value="femenino">Femenino</option>
            <option value="masculino">Masculino</option>
          </CampoSelect>
          <CampoTexto label="Telefono" name="telefono" register={register} error={errors.telefono} requerido />
          <CampoTexto label="Correo electronico" name="correo" type="email" register={register} error={errors.correo} requerido />
          <CampoTexto label="Ciudad" name="ciudad" register={register} error={errors.ciudad} requerido />
          <div className="md:col-span-2 xl:col-span-3">
            <CampoTexto label="Direccion" name="direccion" register={register} error={errors.direccion} requerido />
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-sky-700" />
          <h2 className="text-base font-bold text-slate-950">Datos academicos</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <CampoTexto label="Colegio de procedencia" name="colegio_procedencia" register={register} error={errors.colegio_procedencia} requerido />
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <input type="hidden" {...register('gestion_academica_id')} />
            <p className="text-xs font-medium uppercase text-slate-500">Gestion academica</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {postulante?.gestion_academica?.nombre || gestionActual?.nombre || 'Gestion global no configurada'}
            </p>
            <p className="mt-1 text-xs text-slate-500">Se asigna automaticamente segun la gestion global definida por administracion.</p>
            {errors.gestion_academica_id ? <span className="mt-1 block text-xs text-red-600">{errors.gestion_academica_id.message}</span> : null}
          </div>
          <CampoSelect label="Primera opcion de carrera" name="primera_carrera_id" register={register} error={errors.primera_carrera_id} requerido>
            <option value="">Seleccionar carrera</option>
            {carreras.map((carrera) => <option key={carrera.id} value={carrera.id}>{carrera.codigo ? `${carrera.codigo} - ${carrera.nombre}` : carrera.nombre}</option>)}
          </CampoSelect>
          <CampoSelect label="Segunda opcion de carrera" name="segunda_carrera_id" register={register} error={errors.segunda_carrera_id} requerido>
            <option value="">Seleccionar carrera</option>
            {carreras.map((carrera) => <option key={carrera.id} value={carrera.id}>{carrera.codigo ? `${carrera.codigo} - ${carrera.nombre}` : carrera.nombre}</option>)}
          </CampoSelect>
        </div>
      </section>

      <section className="grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2">
          <FileImage className="h-5 w-5 text-sky-700" />
          <h2 className="text-base font-bold text-slate-950">Documento de respaldo</h2>
        </div>
        <CampoArchivo label="Titulo de bachiller como imagen" name="titulo_bachiller" register={register} error={errors.titulo_bachiller} requerido={requiereArchivo} accept="image/jpeg,image/png,image/webp" />
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancelar ? <Boton variante="secundario" onClick={onCancelar}>Cancelar</Boton> : null}
        <Boton type="submit" cargando={cargando} className="w-full sm:w-auto">{postulante ? 'Guardar cambios' : 'Registrar postulante'}</Boton>
      </div>
    </form>
  )
}
