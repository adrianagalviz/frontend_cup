import { AlertCircle } from 'lucide-react'

export default function MensajeError({ mensaje = 'No se pudo completar la accion.' }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{mensaje}</span>
    </div>
  )
}

