const estilos = {
  pendiente: 'bg-amber-50 text-amber-700 ring-amber-200',
  aprobado: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  pagado: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  activo: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  habilitado: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  presente: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  finalizado: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  exitoso: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  procesando: 'bg-sky-50 text-sky-700 ring-sky-200',
  retraso: 'bg-amber-50 text-amber-700 ring-amber-200',
  'con_errores': 'bg-amber-50 text-amber-700 ring-amber-200',
  error: 'bg-red-50 text-red-700 ring-red-200',
  falta: 'bg-red-50 text-red-700 ring-red-200',
  fallido: 'bg-red-50 text-red-700 ring-red-200',
  rechazado: 'bg-red-50 text-red-700 ring-red-200',
  reprobado: 'bg-red-50 text-red-700 ring-red-200',
  inactivo: 'bg-slate-100 text-slate-700 ring-slate-200',
  'no habilitado': 'bg-slate-100 text-slate-700 ring-slate-200',
}

export default function BadgeEstado({ estado }) {
  const valor = estado || 'sin estado'

  return (
    <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ring-1 ${estilos[valor] || estilos.inactivo}`}>
      {valor}
    </span>
  )
}
