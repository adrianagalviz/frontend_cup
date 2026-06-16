/* eslint-disable react-hooks/incompatible-library */
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { GraduationCap, LogIn, ShieldUser, UserPlus } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import Boton from '../../../components/common/Boton'
import MensajeError from '../../../components/common/MensajeError'
import CampoPassword from '../../../components/forms/CampoPassword'
import CampoTexto from '../../../components/forms/CampoTexto'
import { useAuth } from '../../../hooks/useAuth'
import { obtenerRutaInicialUsuario, ROLES } from '../../../lib/auth'
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
    return <Navigate to={obtenerRutaInicialUsuario(usuario)} replace />
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

      navigate(obtenerRutaInicialUsuario(datos?.usuario), { replace: true })
    } catch (err) {
      aplicarErroresFormulario(err, setErrorFormulario)
      setMensajeError(obtenerMensajeError(err))
    }
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-sky-700 text-white shadow-sm">
            <LogIn className="h-4 w-4" aria-hidden="true" />
          </span>
          <h2 className="text-2xl font-bold text-slate-950">Iniciar sesion</h2>
        </div>
        <p className="text-sm font-medium text-slate-600">Acceso para administrador, docente o alumno.</p>
      </div>
      <Link
        to="/postulantes/registro"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-sky-200 bg-sky-50/90 px-3 py-2 text-center text-sm font-semibold text-sky-800 shadow-sm transition hover:border-sky-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
      >
        <UserPlus className="h-4 w-4" aria-hidden="true" />
        Registrarme como postulante
      </Link>
      {mensajeError ? <MensajeError mensaje={mensajeError} /> : null}
      <input type="hidden" {...register('tipo_login')} />
      <div className="grid grid-cols-2 gap-2 rounded-md bg-slate-100/90 p-1.5 shadow-inner">
        <button
          type="button"
          onClick={() => seleccionarTipoLogin('tradicional')}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${tipoLogin === 'tradicional' ? 'bg-white text-sky-800 shadow-sm' : 'text-slate-600 hover:bg-white/60 hover:text-slate-950'}`}
        >
          <ShieldUser className="h-4 w-4" aria-hidden="true" />
          Admin/Docente
        </button>
        <button
          type="button"
          onClick={() => seleccionarTipoLogin('alumno')}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${tipoLogin === 'alumno' ? 'bg-white text-sky-800 shadow-sm' : 'text-slate-600 hover:bg-white/60 hover:text-slate-950'}`}
        >
          <GraduationCap className="h-4 w-4" aria-hidden="true" />
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
        className="min-h-12 bg-white/95 shadow-sm"
      />
      <CampoPassword
        label={tipoLogin === 'alumno' ? 'Contraseña (CI)' : 'Contraseña'}
        name="password"
        register={register}
        error={errors.password}
        requerido
        placeholder={tipoLogin === 'alumno' ? 'Numero de cedula de identidad' : undefined}
        className="min-h-12 bg-white/95 shadow-sm"
      />
      <Boton type="submit" cargando={isSubmitting} className="min-h-12 shadow-md shadow-sky-950/15">
        Ingresar
      </Boton>
    </form>
  )
}
