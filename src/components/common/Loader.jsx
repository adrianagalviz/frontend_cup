import { Loader2 } from 'lucide-react'

export default function Loader({ texto = 'Cargando...' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-600">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span>{texto}</span>
    </div>
  )
}

