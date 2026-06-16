import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CreditCard, ExternalLink, FileCheck2, LogIn, RefreshCw, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import BadgeEstado from '../../../components/common/BadgeEstado'
import Boton from '../../../components/common/Boton'
import Loader from '../../../components/common/Loader'
import MensajeError from '../../../components/common/MensajeError'
import { obtenerMensajeError } from '../../../lib/errores'
import { consultarEstadoPagoPublico, crearSesionStripe } from '../../../services/pagos.service'

function puedeReintentar(estado) {
  return estado?.puede_pagar && !estado?.existe_pago_pagado
}

export default function EstadoPagoPostulante({
  postulanteId,
  titulo = 'Estado de pago',
  redirigirAlLoginAlPagar = true,
  onPagoRegistrado,
}) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const pagoQuery = useQuery({
    queryKey: ['pago-publico', postulanteId],
    queryFn: () => consultarEstadoPagoPublico(postulanteId),
    enabled: Boolean(postulanteId),
    retry: false,
  })

  const stripeMutation = useMutation({
    mutationFn: () => crearSesionStripe({ postulante_id: postulanteId }),
    onSuccess: (respuesta) => {
      queryClient.invalidateQueries({ queryKey: ['pago-publico', postulanteId] })
      const checkoutUrl = respuesta?.checkout_url

      if (!checkoutUrl) {
        toast.error('Stripe no devolvio una URL de pago.')
        return
      }

      window.location.assign(checkoutUrl)
    },
  })

  const estado = pagoQuery.data?.estado_pago_postulante
  const pagos = estado?.pagos || []
  const ultimoPago = pagos[0]
  const pagoRealizado = estado?.existe_pago_pagado || estado?.estado_pago === 'pagado'

  useEffect(() => {
    if (pagoRealizado) {
      onPagoRegistrado?.()
    }
  }, [onPagoRegistrado, pagoRealizado])

  if (!postulanteId) return <MensajeError mensaje="No se recibio el identificador del postulante." />
  if (pagoQuery.isLoading) return <Loader texto="Consultando estado de pago..." />

  return (
    <section className="grid gap-5 rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-sky-50 p-3 text-sky-700">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
          <h1 className="text-2xl font-bold text-slate-950">{titulo}</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              {redirigirAlLoginAlPagar
                ? 'Seras redirigido a Stripe Checkout para completar el pago de postulacion.'
                : 'Completa tu pago en Stripe Checkout para habilitar tus accesos de alumno.'}
            </p>
          </div>
        </div>
        <Boton variante="secundario" onClick={() => pagoQuery.refetch()} disabled={pagoQuery.isFetching} className="w-full lg:w-auto">
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Boton>
      </div>

      {pagoQuery.error ? <MensajeError mensaje={obtenerMensajeError(pagoQuery.error)} /> : null}
      {stripeMutation.error ? <MensajeError mensaje={obtenerMensajeError(stripeMutation.error)} /> : null}

      {estado ? (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <FileCheck2 className="h-5 w-5 text-sky-700" />
              <p className="text-xs font-medium uppercase text-slate-500">Requisitos</p>
              <div className="mt-2"><BadgeEstado estado={estado.estado_requisitos} /></div>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <CreditCard className="h-5 w-5 text-sky-700" />
              <p className="text-xs font-medium uppercase text-slate-500">Pago</p>
              <div className="mt-2"><BadgeEstado estado={estado.estado_pago} /></div>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <ShieldCheck className="h-5 w-5 text-sky-700" />
              <p className="text-xs font-medium uppercase text-slate-500">Validacion administrativa</p>
              <div className="mt-2"><BadgeEstado estado={estado.existe_pago_validado_admin ? 'aprobado' : 'pendiente'} /></div>
            </div>
          </div>

          <div className={`rounded-md border p-3 text-sm ${pagoRealizado ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-sky-200 bg-sky-50 text-sky-700'}`}>
            {pagoRealizado
              ? 'Pago registrado. Tus accesos de alumno quedan habilitados.'
              : 'Pago pendiente. Stripe confirmara el pago mediante webhook despues de completar Checkout.'}
          </div>

          {ultimoPago ? (
            <div className="rounded-md border border-slate-200 p-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-950">Ultimo intento de pago</p>
              <p className="mt-1">Monto: {ultimoPago.monto} {ultimoPago.moneda}</p>
              <p>Estado de pago: {ultimoPago.estado_pago}</p>
              <p>Validacion administrativa: {ultimoPago.validado_admin ? 'Aprobada' : 'Pendiente'}</p>
            </div>
          ) : null}

          {puedeReintentar(estado) ? (
            <div className="grid gap-4 rounded-md border border-sky-200 bg-sky-50 p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="font-semibold text-slate-950">Pago de postulacion</p>
                <p className="mt-1 text-sm text-slate-600">
                  {redirigirAlLoginAlPagar
                    ? 'Abre Stripe Checkout y completa el pago con una tarjeta de prueba.'
                    : 'Abre Stripe Checkout y vuelve a esta pantalla cuando termines el pago.'}
                </p>
              </div>
              <Boton
                cargando={stripeMutation.isPending}
                onClick={() => stripeMutation.mutate()}
                className="w-full md:w-auto"
              >
                <ExternalLink className="h-4 w-4" />
                Pagar con Stripe
              </Boton>
            </div>
          ) : null}

          {pagoRealizado && redirigirAlLoginAlPagar ? (
            <Boton variante="secundario" onClick={() => navigate('/login', { replace: true })} className="w-full sm:w-fit">
              <LogIn className="h-4 w-4" />
              Ir al login
            </Boton>
          ) : null}
        </>
      ) : null}
    </section>
  )
}
