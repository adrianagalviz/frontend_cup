import { Loader2 } from 'lucide-react'

const variantes = {
  primario: 'bg-sky-700 text-white hover:bg-sky-800 focus-visible:ring-sky-600',
  secundario: 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-400',
  peligro: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  neutro: 'bg-slate-100 text-slate-800 hover:bg-slate-200 focus-visible:ring-slate-400',
}

export default function Boton({
  children,
  variante = 'primario',
  cargando = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      className={`inline-flex min-h-10 max-w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${variantes[variante] || variantes.primario} ${className}`}
      {...props}
    >
      {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  )
}
