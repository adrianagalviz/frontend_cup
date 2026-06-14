import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CreditCard, FileCheck2, LockKeyhole, LogIn, RefreshCw, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import BadgeEstado from '../../../components/common/BadgeEstado'
import Boton from '../../../components/common/Boton'
import Input from '../../../components/common/Input'
import Loader from '../../../components/common/Loader'
import MensajeError from '../../../components/common/MensajeError'
import Modal from '../../../components/common/Modal'
import { obtenerMensajeError } from '../../../lib/errores'
import { consultarEstadoPagoPublico, registrarPagoTemporalPostulante } from '../../../services/pagos.service'

function puedeReintentar(estado) {
  return estado?.puede_pagar_temporal && !estado?.existe_pago_pagado
}

const pagoInicial = {
  numero_tarjeta: '',
  nombre_titular: '',
  fecha_vencimiento: '',
  cvv: '',
}

function soloDigitos(valor, maximo) {
  return valor.replace(/\D/g, '').slice(0, maximo)
}

function formatearVencimiento(valor) {
  const digitos = soloDigitos(valor, 4)
  if (digitos.length <= 2) return digitos

  return `${digitos.slice(0, 2)}/${digitos.slice(2)}`
}

function validarPago(datos) {
  const errores = {}

  if (!/^\d{16}$/.test(datos.numero_tarjeta)) {
    errores.numero_tarjeta = 'El numero de tarjeta debe tener 16 digitos.'
  }

  if (!datos.nombre_titular.trim()) {
    errores.nombre_titular = 'El nombre del titular es obligatorio.'
  }

  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(datos.fecha_vencimiento)) {
    errores.fecha_vencimiento = 'La fecha debe tener formato MM/AA.'
  }

  if (!/^\d{3}$/.test(datos.cvv)) {
    errores.cvv = 'El CVV debe tener 3 digitos.'
  }

  return errores
}

export default function EstadoPagoPostulante({ postulanteId, titulo = 'Estado de pago' }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [modalPago, setModalPago] = useState(false)
  const [datosPago, setDatosPago] = useState(pagoInicial)
  const [erroresPago, setErroresPago] = useState({})
  const pagoQuery = useQuery({
    queryKey: ['pago-publico', postulanteId],
    queryFn: () => consultarEstadoPagoPublico(postulanteId),
    enabled: Boolean(postulanteId),
    retry: false,
  })

  const pagoTemporalMutation = useMutation({
    mutationFn: () => registrarPagoTemporalPostulante(postulanteId),
    onSuccess: (respuesta) => {
      toast.success(respuesta?.mensaje || 'Pago registrado automaticamente.')
      setModalPago(false)
      setDatosPago(pagoInicial)
      setErroresPago({})
      queryClient.invalidateQueries({ queryKey: ['pago-publico', postulanteId] })
      navigate('/login', { replace: true })
    },
  })

  function cerrarModalPago() {
    if (pagoTemporalMutation.isPending) return
    setModalPago(false)
    setErroresPago({})
  }

  function cambiarDatoPago(nombre, valor) {
    const normalizado = nombre === 'numero_tarjeta'
      ? soloDigitos(valor, 16)
      : nombre === 'cvv'
        ? soloDigitos(valor, 3)
        : nombre === 'fecha_vencimiento'
          ? formatearVencimiento(valor)
          : valor

    setDatosPago((actuales) => ({ ...actuales, [nombre]: normalizado }))
    setErroresPago((actuales) => ({ ...actuales, [nombre]: undefined }))
  }

  function confirmarPago(evento) {
    evento.preventDefault()
    const errores = validarPago(datosPago)
    setErroresPago(errores)

    if (Object.keys(errores).length) return

    pagoTemporalMutation.mutate()
  }

  if (!postulanteId) return <MensajeError mensaje="No se recibio el identificador del postulante." />
  if (pagoQuery.isLoading) return <Loader texto="Consultando estado de pago..." />

  const estado = pagoQuery.data?.estado_pago_postulante
  const pagos = estado?.pagos || []
  const ultimoPago = pagos[0]
  const pagoRealizado = estado?.existe_pago_pagado || estado?.estado_pago === 'pagado'

  return (
    <section className="grid gap-5 rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-sky-50 p-3 text-sky-700">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
          <h1 className="text-2xl font-bold text-slate-950">{titulo}</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">Registra tu pago de postulacion. Al completar este paso volveras al login mientras administracion revisa tus datos.</p>
          </div>
        </div>
        <Boton variante="secundario" onClick={() => pagoQuery.refetch()} disabled={pagoQuery.isFetching} className="w-full lg:w-auto">
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Boton>
      </div>

      {pagoQuery.error ? <MensajeError mensaje={obtenerMensajeError(pagoQuery.error)} /> : null}
      {pagoTemporalMutation.error ? <MensajeError mensaje={obtenerMensajeError(pagoTemporalMutation.error)} /> : null}

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
              ? 'Pago registrado. La validacion administrativa sigue pendiente hasta que el administrador la acepte.'
              : 'Pago temporal disponible. Proximamente este paso se reemplazara por Stripe.'}
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
                <p className="mt-1 text-sm text-slate-600">Completa los datos de tu tarjeta para registrar el pago simulado. Despues volveras al login.</p>
              </div>
              <Boton
                cargando={pagoTemporalMutation.isPending}
                onClick={() => setModalPago(true)}
                className="w-full md:w-auto"
              >
                <CreditCard className="h-4 w-4" />
                Pagar postulacion
              </Boton>
            </div>
          ) : null}

          {pagoRealizado ? (
            <Boton variante="secundario" onClick={() => navigate('/login', { replace: true })} className="w-full sm:w-fit">
              <LogIn className="h-4 w-4" />
              Ir al login
            </Boton>
          ) : null}

          <Modal
            abierto={modalPago}
            titulo="Pago de postulacion"
            onCerrar={cerrarModalPago}
            className="max-w-xl"
            acciones={(
              <>
                <Boton variante="secundario" onClick={cerrarModalPago} disabled={pagoTemporalMutation.isPending}>Cancelar</Boton>
                <Boton type="submit" form="formulario-pago-simulado" cargando={pagoTemporalMutation.isPending}>
                  <LockKeyhole className="h-4 w-4" />
                  Pagar postulacion
                </Boton>
              </>
            )}
          >
            <form id="formulario-pago-simulado" onSubmit={confirmarPago} className="grid gap-4">
              <div className="rounded-md bg-slate-950 p-4 text-white">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">CUP-FICCT</p>
                  <CreditCard className="h-5 w-5" />
                </div>
                <p className="mt-8 font-mono text-lg tracking-wider">
                  {datosPago.numero_tarjeta.padEnd(16, '*').replace(/(.{4})/g, '$1 ').trim()}
                </p>
                <div className="mt-5 flex items-end justify-between gap-4 text-xs">
                  <div className="min-w-0">
                    <p className="uppercase text-slate-400">Titular</p>
                    <p className="truncate font-semibold">{datosPago.nombre_titular || 'Nombre del titular'}</p>
                  </div>
                  <div>
                    <p className="uppercase text-slate-400">Vence</p>
                    <p className="font-semibold">{datosPago.fecha_vencimiento || 'MM/AA'}</p>
                  </div>
                </div>
              </div>

              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Numero de tarjeta
                <Input
                  value={datosPago.numero_tarjeta}
                  onChange={(evento) => cambiarDatoPago('numero_tarjeta', evento.target.value)}
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="0000000000000000"
                  maxLength={16}
                  error={erroresPago.numero_tarjeta}
                />
                {erroresPago.numero_tarjeta ? <span className="text-xs text-red-600">{erroresPago.numero_tarjeta}</span> : null}
              </label>

              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Nombre del titular
                <Input
                  value={datosPago.nombre_titular}
                  onChange={(evento) => cambiarDatoPago('nombre_titular', evento.target.value)}
                  autoComplete="cc-name"
                  placeholder="Nombre como figura en la tarjeta"
                  error={erroresPago.nombre_titular}
                />
                {erroresPago.nombre_titular ? <span className="text-xs text-red-600">{erroresPago.nombre_titular}</span> : null}
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  Fecha de vencimiento
                  <Input
                    value={datosPago.fecha_vencimiento}
                    onChange={(evento) => cambiarDatoPago('fecha_vencimiento', evento.target.value)}
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="MM/AA"
                    maxLength={5}
                    error={erroresPago.fecha_vencimiento}
                  />
                  {erroresPago.fecha_vencimiento ? <span className="text-xs text-red-600">{erroresPago.fecha_vencimiento}</span> : null}
                </label>

                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  CVV
                  <Input
                    value={datosPago.cvv}
                    onChange={(evento) => cambiarDatoPago('cvv', evento.target.value)}
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="000"
                    maxLength={3}
                    error={erroresPago.cvv}
                  />
                  {erroresPago.cvv ? <span className="text-xs text-red-600">{erroresPago.cvv}</span> : null}
                </label>
              </div>
            </form>
          </Modal>
        </>
      ) : null}
    </section>
  )
}
