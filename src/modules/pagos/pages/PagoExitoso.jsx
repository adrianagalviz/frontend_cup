import { CheckCircle2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import EstadoPagoPostulante from '../components/EstadoPagoPostulante'

export default function PagoExitoso() {
  const [params] = useSearchParams()
  const postulanteId = params.get('postulante_id')

  return (
    <div className="grid gap-5">
      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
        <div className="flex items-center gap-2 font-semibold">
          <CheckCircle2 className="h-5 w-5" />
          Retorno exitoso de Stripe
        </div>
        <p className="mt-1 text-sm">El pago se confirma definitivamente con la respuesta del backend y el webhook de Stripe.</p>
      </div>
      <EstadoPagoPostulante postulanteId={postulanteId} titulo="Resultado del pago" />
      <p className="text-sm text-slate-600">Si el pago aparece como pagado, el administrador debe validarlo antes de dar acceso como alumno.</p>
    </div>
  )
}
