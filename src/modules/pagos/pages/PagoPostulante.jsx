import { useParams } from 'react-router-dom'
import EstadoPagoPostulante from '../components/EstadoPagoPostulante'

export default function PagoPostulante() {
  const { id } = useParams()

  return (
    <div className="grid gap-5">
      <EstadoPagoPostulante postulanteId={id} titulo="Pago de postulacion" />
    </div>
  )
}
