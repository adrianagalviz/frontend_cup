import { Inbox } from 'lucide-react'

export default function EmptyState({ titulo = 'Sin datos', descripcion = 'No existen registros para mostrar.' }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-white p-8 text-center">
      <Inbox className="h-10 w-10 text-slate-400" />
      <h3 className="mt-3 text-sm font-semibold text-slate-900">{titulo}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{descripcion}</p>
    </div>
  )
}

