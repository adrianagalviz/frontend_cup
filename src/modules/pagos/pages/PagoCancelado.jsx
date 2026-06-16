import { XCircle } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import EstadoPagoPostulante from '../components/EstadoPagoPostulante'

export default function PagoCancelado() {
  const [params] = useSearchParams()
  const postulanteId = params.get('postulante_id')

  return (
    <div className="grid gap-5">
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-700">
        <div className="flex items-center gap-2 font-semibold">
          <XCircle className="h-5 w-5" />
          Pago cancelado o no completado
        </div>
        <p className="mt-1 text-sm">No se completo el pago en Stripe. Puedes volver a iniciar Checkout si el estado sigue pendiente.</p>
      </div>
      <EstadoPagoPostulante postulanteId={postulanteId} titulo="Estado despues del retorno" />
    </div>
  )
}
