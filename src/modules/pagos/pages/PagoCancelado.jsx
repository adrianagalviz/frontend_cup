import EmptyState from '../../../components/common/EmptyState'

export default function PagoCancelado() {
  return (
    <EmptyState
      titulo="Pago cancelado o fallido"
      descripcion="Ruta publica preparada para el retorno cancelado o fallido del flujo Stripe."
    />
  )
}

