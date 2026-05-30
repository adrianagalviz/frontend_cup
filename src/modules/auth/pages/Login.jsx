/* eslint-disable react-hooks/incompatible-library */
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import Boton from '../../../components/common/Boton'
import MensajeError from '../../../components/common/MensajeError'
import CampoPassword from '../../../components/forms/CampoPassword'
import CampoSelect from '../../../components/forms/CampoSelect'
import CampoTexto from '../../../components/forms/CampoTexto'
import { useAuth } from '../../../hooks/useAuth'
import { obtenerRutaPorRol } from '../../../lib/auth'
import { obtenerMensajeError } from '../../../lib/errores'

const schema = z.object({
  tipo_login: z.enum(['tradicional', 'alumno']),
  usuario: z.string().min(1, 'El usuario, correo o codigo es obligatorio.'),
  password: z.string().optional(),
}).superRefine((values, ctx) => {
  if (values.tipo_login === 'tradicional' && !values.password) {
    ctx.addIssue({
      code: 'custom',
      path: ['password'],
      message: 'La contrasena es obligatoria.',
    })
  }
})

export default function Login() {
  const navigate = useNavigate()
  const { autenticado, usuario, iniciarSesion, iniciarSesionAlumno } = useAuth()
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo_login: 'tradicional',
      usuario: '',
      password: '',
    },
  })

  if (autenticado) {
    return <Navigate to={obtenerRutaPorRol(usuario?.rol)} replace />
  }

  const tipoLogin = watch('tipo_login')

  async function onSubmit(values) {
    setError('')

    try {
      const datos = tipoLogin === 'alumno'
        ? await iniciarSesionAlumno({ codigo_alumno: values.usuario, password: values.password || undefined })
        : await iniciarSesion({ usuario: values.usuario, password: values.password || '' })

      toast.success('Inicio de sesion correcto.')
      navigate(obtenerRutaPorRol(datos?.usuario?.rol), { replace: true })
    } catch (err) {
      setError(obtenerMensajeError(err))
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <h2 className="text-xl font-bold text-slate-950">Iniciar sesion</h2>
        <p className="mt-1 text-sm text-slate-500">Acceso para administrador, docente o alumno.</p>
      </div>
      {error ? <MensajeError mensaje={error} /> : null}
      <CampoSelect label="Tipo de acceso" name="tipo_login" register={register} error={errors.tipo_login} requerido>
        <option value="tradicional">Usuario, correo o codigo</option>
        <option value="alumno">Codigo automatico de alumno</option>
      </CampoSelect>
      <CampoTexto
        label={tipoLogin === 'alumno' ? 'Codigo de alumno' : 'Usuario, correo o codigo'}
        name="usuario"
        register={register}
        error={errors.usuario}
        autoComplete="username"
        requerido
      />
      <CampoPassword
        label="Contrasena"
        name="password"
        register={register}
        error={errors.password}
      />
      <Boton type="submit" cargando={isSubmitting}>Ingresar</Boton>
    </form>
  )
}
