import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import Boton from '../../../components/common/Boton'
import CampoArchivo from '../../../components/forms/CampoArchivo'
import CampoPassword from '../../../components/forms/CampoPassword'
import CampoTexto from '../../../components/forms/CampoTexto'
import { aplicarErroresFormulario } from '../../../lib/errores'

const schema = z.object({
  id: z.number().optional(),
  cedula_identidad: z.string().min(1, 'La cedula de identidad es obligatoria.'),
  nombres: z.string().min(1, 'El nombre es obligatorio.'),
  apellido_paterno: z.string().min(1, 'El apellido paterno es obligatorio.'),
  apellido_materno: z.string().min(1, 'El apellido materno es obligatorio.'),
  celular: z.string().min(1, 'El celular es obligatorio.'),
  correo: z.string().min(1, 'El correo es obligatorio.').email('El correo debe ser valido.'),
  nombre_usuario: z.string().optional(),
  password: z.string().optional(),
  es_profesional_area: z.boolean().refine(Boolean, 'El docente debe ser profesional en el area.'),
  tiene_maestria: z.boolean().refine(Boolean, 'El docente debe tener maestria.'),
  tiene_diplomado_educacion_superior: z.boolean().refine(Boolean, 'El docente debe tener diplomado en educacion superior.'),
  cv_pdf: z.any().optional(),
}).superRefine((values, ctx) => {
  if (values.password && values.password.length > 0 && values.password.length < 8) {
    ctx.addIssue({
      code: 'custom',
      path: ['password'],
      message: 'La contrasena debe tener al menos 8 caracteres.',
    })
  }

  const archivo = values.cv_pdf?.[0]
  if (archivo && archivo.type !== 'application/pdf') {
    ctx.addIssue({
      code: 'custom',
      path: ['cv_pdf'],
      message: 'El CV debe ser un archivo PDF.',
    })
  }
})

const valoresIniciales = {
  cedula_identidad: '',
  nombres: '',
  apellido_paterno: '',
  apellido_materno: '',
  celular: '',
  correo: '',
  nombre_usuario: '',
  password: '',
  es_profesional_area: false,
  tiene_maestria: false,
  tiene_diplomado_educacion_superior: false,
  cv_pdf: undefined,
}

function valoresDesdeDocente(docente) {
  if (!docente) return valoresIniciales

  return {
    id: docente.id,
    cedula_identidad: docente.persona?.cedula_identidad || '',
    nombres: docente.persona?.nombres || '',
    apellido_paterno: docente.persona?.apellido_paterno || '',
    apellido_materno: docente.persona?.apellido_materno || '',
    celular: docente.persona?.celular || '',
    correo: docente.persona?.correo || '',
    nombre_usuario: docente.usuario?.nombre_usuario || '',
    password: '',
    es_profesional_area: Boolean(docente.es_profesional_area),
    tiene_maestria: Boolean(docente.tiene_maestria),
    tiene_diplomado_educacion_superior: Boolean(docente.tiene_diplomado_educacion_superior),
    cv_pdf: undefined,
  }
}

function prepararPayload(values) {
  const payload = {
    cedula_identidad: values.cedula_identidad,
    nombres: values.nombres,
    apellido_paterno: values.apellido_paterno,
    apellido_materno: values.apellido_materno,
    celular: values.celular,
    correo: values.correo,
    es_profesional_area: values.es_profesional_area,
    tiene_maestria: values.tiene_maestria,
    tiene_diplomado_educacion_superior: values.tiene_diplomado_educacion_superior,
  }

  if (values.nombre_usuario) {
    payload.nombre_usuario = values.nombre_usuario
  }

  if (values.password) {
    payload.password = values.password
  }

  const archivoCv = values.cv_pdf?.[0]

  if (!archivoCv) {
    return payload
  }

  const formData = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    formData.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : value)
  })
  formData.append('cv_pdf', archivoCv)

  return formData
}

function CampoCheckbox({ label, name, register, error }) {
  return (
    <label className={`flex min-h-11 items-start gap-3 rounded-md border px-3 py-2 text-sm ${error ? 'border-red-300 bg-red-50 text-red-700' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-200"
        {...register(name)}
      />
      <span>
        <span className="font-medium">{label} *</span>
        {error ? <span className="mt-1 block text-xs text-red-600">{error.message}</span> : null}
      </span>
    </label>
  )
}

export default function FormularioDocente({ docente, onGuardar, onCancelar, cargando = false }) {
  const editando = Boolean(docente)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: valoresDesdeDocente(docente),
  })

  useEffect(() => {
    reset(valoresDesdeDocente(docente))
  }, [docente, reset])

  async function enviar(values) {
    try {
      await onGuardar(prepararPayload(values))
    } catch (error) {
      aplicarErroresFormulario(error, setError)
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(enviar)}>
      <div className="grid gap-4 md:grid-cols-2">
        <CampoTexto label="Cedula de identidad" name="cedula_identidad" register={register} error={errors.cedula_identidad} requerido />
        <CampoTexto label="Nombre" name="nombres" register={register} error={errors.nombres} requerido />
        <CampoTexto label="Apellido paterno" name="apellido_paterno" register={register} error={errors.apellido_paterno} requerido />
        <CampoTexto label="Apellido materno" name="apellido_materno" register={register} error={errors.apellido_materno} requerido />
        <CampoTexto label="Celular" name="celular" register={register} error={errors.celular} requerido />
        <CampoTexto label="Correo" name="correo" type="email" register={register} error={errors.correo} requerido />
        <CampoTexto label="Nombre de usuario" name="nombre_usuario" register={register} error={errors.nombre_usuario} placeholder="docente_CI si se deja vacio" />
        <CampoPassword label={editando ? 'Nueva contrasena' : 'Contrasena'} name="password" register={register} error={errors.password} />
      </div>

      {editando && docente?.cv_pdf?.tiene_pdf ? (
        <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          CV actual: <span className="font-semibold text-slate-900">{docente.cv_pdf.nombre_original || 'CV registrado'}</span>
        </p>
      ) : null}

      <CampoArchivo
        label="PDF del CV"
        name="cv_pdf"
        register={register}
        error={errors.cv_pdf}
        accept="application/pdf"
        ayuda={editando ? 'Opcional. Si seleccionas un PDF, reemplazara el CV actual.' : 'Opcional. Formato permitido: PDF hasta 10 MB.'}
        validarImagen={false}
      />

      <div className="grid gap-3">
        <CampoCheckbox label="Profesional en el area" name="es_profesional_area" register={register} error={errors.es_profesional_area} />
        <CampoCheckbox label="Maestria" name="tiene_maestria" register={register} error={errors.tiene_maestria} />
        <CampoCheckbox label="Diplomado en educacion superior" name="tiene_diplomado_educacion_superior" register={register} error={errors.tiene_diplomado_educacion_superior} />
      </div>

      <div className="flex justify-end gap-3">
        <Boton variante="secundario" onClick={onCancelar}>Cancelar</Boton>
        <Boton type="submit" cargando={cargando}>{editando ? 'Guardar cambios' : 'Registrar docente'}</Boton>
      </div>
    </form>
  )
}
