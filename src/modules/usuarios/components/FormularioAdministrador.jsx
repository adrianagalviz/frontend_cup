import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import Boton from '../../../components/common/Boton'
import CampoPassword from '../../../components/forms/CampoPassword'
import CampoTexto from '../../../components/forms/CampoTexto'
import { aplicarErroresFormulario } from '../../../lib/errores'

const schema = z.object({
  id: z.number().optional(),
  cedula_identidad: z.string().min(1, 'La cedula de identidad es obligatoria.'),
  nombres: z.string().min(1, 'Los nombres son obligatorios.'),
  apellido_paterno: z.string().min(1, 'El apellido paterno es obligatorio.'),
  apellido_materno: z.string().optional(),
  correo: z.string().min(1, 'El correo es obligatorio.').email('El correo debe ser valido.'),
  celular: z.string().optional(),
  ciudad: z.string().optional(),
  nombre_usuario: z.string().min(1, 'El nombre de usuario es obligatorio.'),
  password: z.string().optional(),
}).superRefine((values, ctx) => {
  if (!values.id && (!values.password || values.password.length < 8)) {
    ctx.addIssue({
      code: 'custom',
      path: ['password'],
      message: 'La contrasena debe tener al menos 8 caracteres.',
    })
  }

  if (values.password && values.password.length > 0 && values.password.length < 8) {
    ctx.addIssue({
      code: 'custom',
      path: ['password'],
      message: 'La contrasena debe tener al menos 8 caracteres.',
    })
  }
})

const valoresIniciales = {
  cedula_identidad: '',
  nombres: '',
  apellido_paterno: '',
  apellido_materno: '',
  correo: '',
  celular: '',
  ciudad: '',
  nombre_usuario: '',
  password: '',
}

function valoresDesdeUsuario(usuario) {
  if (!usuario) return valoresIniciales

  return {
    id: usuario.id,
    cedula_identidad: usuario.persona?.cedula_identidad || '',
    nombres: usuario.persona?.nombres || '',
    apellido_paterno: usuario.persona?.apellido_paterno || '',
    apellido_materno: usuario.persona?.apellido_materno || '',
    correo: usuario.persona?.correo || '',
    celular: usuario.persona?.celular || '',
    ciudad: usuario.persona?.ciudad || '',
    nombre_usuario: usuario.nombre_usuario || '',
    password: '',
  }
}

export default function FormularioAdministrador({ usuario, onGuardar, onCancelar, cargando = false }) {
  const editando = Boolean(usuario)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: valoresDesdeUsuario(usuario),
  })

  useEffect(() => {
    reset(valoresDesdeUsuario(usuario))
  }, [reset, usuario])

  async function enviar(values) {
    try {
      const payload = {
        cedula_identidad: values.cedula_identidad,
        nombres: values.nombres,
        apellido_paterno: values.apellido_paterno,
        apellido_materno: values.apellido_materno || null,
        correo: values.correo,
        celular: values.celular || null,
        ciudad: values.ciudad || null,
        nombre_usuario: values.nombre_usuario,
      }

      if (!editando || values.password) {
        payload.password = values.password
      }

      await onGuardar(payload)
    } catch (error) {
      aplicarErroresFormulario(error, setError)
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(enviar)}>
      <div className="grid gap-4 md:grid-cols-2">
        <CampoTexto label="Cedula de identidad" name="cedula_identidad" register={register} error={errors.cedula_identidad} requerido />
        <CampoTexto label="Nombres" name="nombres" register={register} error={errors.nombres} requerido />
        <CampoTexto label="Apellido paterno" name="apellido_paterno" register={register} error={errors.apellido_paterno} requerido />
        <CampoTexto label="Apellido materno" name="apellido_materno" register={register} error={errors.apellido_materno} />
        <CampoTexto label="Correo" name="correo" type="email" register={register} error={errors.correo} requerido />
        <CampoTexto label="Celular" name="celular" register={register} error={errors.celular} />
        <CampoTexto label="Ciudad" name="ciudad" register={register} error={errors.ciudad} />
        <CampoTexto label="Nombre de usuario" name="nombre_usuario" register={register} error={errors.nombre_usuario} requerido />
        <CampoPassword label={editando ? 'Nueva contrasena' : 'Contrasena'} name="password" register={register} error={errors.password} requerido={!editando} />
      </div>
      <div className="flex justify-end gap-3">
        <Boton variante="secundario" onClick={onCancelar}>Cancelar</Boton>
        <Boton type="submit" cargando={cargando}>{editando ? 'Guardar cambios' : 'Crear administrador'}</Boton>
      </div>
    </form>
  )
}
