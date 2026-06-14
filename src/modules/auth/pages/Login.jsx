/* eslint-disable react-hooks/incompatible-library */
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import Boton from '../../../components/common/Boton'
import MensajeError from '../../../components/common/MensajeError'
import CampoPassword from '../../../components/forms/CampoPassword'
import CampoTexto from '../../../components/forms/CampoTexto'
import { useAuth } from '../../../hooks/useAuth'
import { obtenerRutaPorRol, ROLES } from '../../../lib/auth'
import { aplicarErroresFormulario, obtenerMensajeError } from '../../../lib/errores'

const schema = z.object({
  tipo_login: z.enum(['tradicional', 'alumno']),
  usuario: z.string(),
  password: z.string().optional(),
}).superRefine((values, ctx) => {
  if (!values.usuario?.trim()) {
    ctx.addIssue({
      code: 'custom',
      path: ['usuario'],
      message: values.tipo_login === 'alumno'
        ? 'El codigo del alumno es obligatorio.'
        : 'El usuario o correo es obligatorio.',
    })
  }

  if (!values.password) {
    ctx.addIssue({
      code: 'custom',
      path: ['password'],
      message: 'La contraseña es obligatoria.',
    })
  }
})

export default function Login() {
  const navigate = useNavigate()
  const { autenticado, usuario, iniciarSesion, iniciarSesionAlumno } = useAuth()
  const [mensajeError, setMensajeError] = useState('')
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError: setErrorFormulario,
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

  function seleccionarTipoLogin(tipo) {
    setValue('tipo_login', tipo, { shouldValidate: true })
    setValue('password', '', { shouldValidate: false })
    setMensajeError('')
  }

  async function onSubmit(values) {
    setMensajeError('')

    try {
      const datos = tipoLogin === 'alumno'
        ? await iniciarSesionAlumno({ codigo_alumno: values.usuario, password: values.password || '' })
        : await iniciarSesion({ usuario: values.usuario, password: values.password || '' })

      toast.success('Inicio de sesion correcto.')
      const rol = datos?.usuario?.rol

      if (tipoLogin === 'alumno' && rol !== ROLES.ALUMNO) {
        setMensajeError('El codigo ingresado no corresponde a un alumno.')
        return
      }

      navigate(obtenerRutaPorRol(rol), { replace: true })
    } catch (err) {
      aplicarErroresFormulario(err, setErrorFormulario)
      setMensajeError(obtenerMensajeError(err))
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <h2 className="text-xl font-bold text-slate-950">Iniciar sesion</h2>
        <p className="mt-1 text-sm text-slate-500">Acceso para administrador, docente o alumno.</p>
      </div>
      <Link
        to="/postulantes/registro"
        className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-center text-sm font-semibold text-sky-800 transition hover:border-sky-300 hover:bg-sky-100"
      >
        Registrarme como postulante
      </Link>
      {mensajeError ? <MensajeError mensaje={mensajeError} /> : null}
      <input type="hidden" {...register('tipo_login')} />
      <div className="grid grid-cols-2 gap-2 rounded-md bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => seleccionarTipoLogin('tradicional')}
          className={`rounded-md px-3 py-2 text-sm font-semibold transition ${tipoLogin === 'tradicional' ? 'bg-white text-sky-800 shadow-sm' : 'text-slate-600 hover:text-slate-950'}`}
        >
          Admin/Docente
        </button>
        <button
          type="button"
          onClick={() => seleccionarTipoLogin('alumno')}
          className={`rounded-md px-3 py-2 text-sm font-semibold transition ${tipoLogin === 'alumno' ? 'bg-white text-sky-800 shadow-sm' : 'text-slate-600 hover:text-slate-950'}`}
        >
          Alumno
        </button>
      </div>
      <CampoTexto
        label={tipoLogin === 'alumno' ? 'Codigo automatico de alumno' : 'Usuario o correo'}
        name="usuario"
        register={register}
        error={errors.usuario}
        autoComplete="username"
        requerido
        placeholder={tipoLogin === 'alumno' ? 'Ejemplo: 2026113541539' : 'admin o admin@cupficct.local'}
      />
      <CampoPassword
        label={tipoLogin === 'alumno' ? 'Contraseña (CI)' : 'Contraseña'}
        name="password"
        register={register}
        error={errors.password}
        requerido
        placeholder={tipoLogin === 'alumno' ? 'Numero de cedula de identidad' : undefined}
      />
      <Boton type="submit" cargando={isSubmitting}>Ingresar</Boton>
    </form>
  )
}
