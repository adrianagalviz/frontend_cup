import { AlertCircle, CheckCircle2, Inbox, Loader2, LockKeyhole, ShieldAlert } from 'lucide-react'
import Boton from './Boton'

const configuracion = {
  cargando: {
    icono: Loader2,
    clases: 'border-sky-200 bg-sky-50 text-sky-700',
    animado: true,
    titulo: 'Cargando',
  },
  vacio: {
    icono: Inbox,
    clases: 'border-slate-200 bg-white text-slate-500',
    titulo: 'Sin datos',
  },
  error: {
    icono: AlertCircle,
    clases: 'border-red-200 bg-red-50 text-red-700',
    titulo: 'Error',
  },
  exito: {
    icono: CheckCircle2,
    clases: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    titulo: 'Accion completada',
  },
  'acceso-denegado': {
    icono: ShieldAlert,
    clases: 'border-amber-200 bg-amber-50 text-amber-700',
    titulo: 'Acceso denegado',
  },
  'sesion-expirada': {
    icono: LockKeyhole,
    clases: 'border-slate-200 bg-white text-slate-700',
    titulo: 'Sesion expirada',
  },
}

export default function EstadoSistema({
  tipo = 'vacio',
  titulo,
  descripcion,
  accion,
  onAccion,
  className = '',
}) {
  const estado = configuracion[tipo] || configuracion.vacio
  const Icono = estado.icono

  return (
    <section className={`flex flex-col items-center justify-center rounded-md border p-6 text-center shadow-sm ${estado.clases} ${className}`}>
      <Icono className={`h-10 w-10 ${estado.animado ? 'animate-spin' : ''}`} />
      <h2 className="mt-3 text-lg font-bold text-slate-950">{titulo || estado.titulo}</h2>
      {descripcion ? <p className="mt-2 max-w-md text-sm text-slate-600">{descripcion}</p> : null}
      {accion && onAccion ? (
        <Boton className="mt-5" onClick={onAccion}>
          {accion}
        </Boton>
      ) : null}
    </section>
  )
}
