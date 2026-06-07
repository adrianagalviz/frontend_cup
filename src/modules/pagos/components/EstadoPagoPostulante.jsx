import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CreditCard, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import BadgeEstado from '../../../components/common/BadgeEstado'
import Boton from '../../../components/common/Boton'
import Input from '../../../components/common/Input'
import Loader from '../../../components/common/Loader'
import MensajeError from '../../../components/common/MensajeError'
import { obtenerMensajeError } from '../../../lib/errores'
import { consultarEstadoPagoPublico, crearSesionStripe } from '../../../services/pagos.service'

function puedeReintentar(estado) {
  return estado?.puede_pagar && !estado?.existe_pago_pagado
}

export default function EstadoPagoPostulante({ postulanteId, titulo = 'Estado de pago' }) {
  const queryClient = useQueryClient()
  const [monto, setMonto] = useState('')
  const pagoQuery = useQuery({
    queryKey: ['pago-publico', postulanteId],
    queryFn: () => consultarEstadoPagoPublico(postulanteId),
    enabled: Boolean(postulanteId),
    retry: false,
  })

  const crearSesionMutation = useMutation({
    mutationFn: () => crearSesionStripe({
      postulante_id: Number(postulanteId),
      monto: Number(monto),
      moneda: 'BOB',
      success_url: `${window.location.origin}/pagos/exitoso?postulante_id=${postulanteId}`,
      cancel_url: `${window.location.origin}/pagos/cancelado?postulante_id=${postulanteId}`,
    }),
    onSuccess: (respuesta) => {
      queryClient.invalidateQueries({ queryKey: ['pago-publico', postulanteId] })

      if (respuesta?.checkout_url) {
        window.location.href = respuesta.checkout_url
        return
      }

      toast.error('El backend no devolvio la URL de Stripe.')
    },
  })

  if (!postulanteId) return <MensajeError mensaje="No se recibio el identificador del postulante." />
  if (pagoQuery.isLoading) return <Loader texto="Consultando estado de pago..." />

  const estado = pagoQuery.data?.estado_pago_postulante
  const pagos = estado?.pagos || []
  const ultimoPago = pagos[0]
  const requisitosAprobados = estado?.estado_requisitos === 'aprobado'
  const montoValido = Number(monto) > 0

  return (
    <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">{titulo}</h1>
          <p className="mt-1 text-sm text-slate-600">El estado mostrado viene del backend Laravel.</p>
        </div>
        <Boton variante="secundario" onClick={() => pagoQuery.refetch()} disabled={pagoQuery.isFetching}>
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Boton>
      </div>

      {pagoQuery.error ? <MensajeError mensaje={obtenerMensajeError(pagoQuery.error)} /> : null}
      {crearSesionMutation.error ? <MensajeError mensaje={obtenerMensajeError(crearSesionMutation.error)} /> : null}

      {estado ? (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-medium uppercase text-slate-500">Requisitos</p>
              <div className="mt-2"><BadgeEstado estado={estado.estado_requisitos} /></div>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-medium uppercase text-slate-500">Pago</p>
              <div className="mt-2"><BadgeEstado estado={estado.estado_pago} /></div>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-medium uppercase text-slate-500">Validacion administrativa</p>
              <div className="mt-2"><BadgeEstado estado={estado.existe_pago_validado_admin ? 'aprobado' : 'pendiente'} /></div>
            </div>
          </div>

          <div className={`rounded-md border p-3 text-sm ${requisitosAprobados ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
            {requisitosAprobados
              ? 'Los requisitos estan aprobados. El pago puede iniciarse si Stripe aun no confirmo un pago previo.'
              : 'El pago se habilita solamente cuando el administrador aprueba los requisitos.'}
          </div>

          {ultimoPago ? (
            <div className="rounded-md border border-slate-200 p-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-950">Ultimo intento de pago</p>
              <p className="mt-1">Monto: {ultimoPago.monto} {ultimoPago.moneda}</p>
              <p>Estado Stripe: {ultimoPago.estado_pago}</p>
              <p>Validado por administrador: {ultimoPago.validado_admin ? 'Si' : 'No'}</p>
            </div>
          ) : null}

          {puedeReintentar(estado) ? (
            <div className="grid gap-3 md:grid-cols-[220px_auto] md:items-end">
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                <span>Monto de pago *</span>
                <Input type="number" min="1" step="0.01" value={monto} onChange={(event) => setMonto(event.target.value)} placeholder="0.00" />
              </label>
              <Boton
                disabled={!montoValido}
                cargando={crearSesionMutation.isPending}
                onClick={() => crearSesionMutation.mutate()}
              >
                <CreditCard className="h-4 w-4" />
                Iniciar pago con Stripe
              </Boton>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  )
}
