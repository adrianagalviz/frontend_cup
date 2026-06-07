import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Eye, Search } from 'lucide-react'
import { toast } from 'sonner'
import BadgeEstado from '../../../components/common/BadgeEstado'
import Boton from '../../../components/common/Boton'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import Input from '../../../components/common/Input'
import MensajeError from '../../../components/common/MensajeError'
import Modal from '../../../components/common/Modal'
import Select from '../../../components/common/Select'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import AccionesTabla from '../../../components/tables/AccionesTabla'
import PaginacionTabla from '../../../components/tables/PaginacionTabla'
import TablaBase from '../../../components/tables/TablaBase'
import { obtenerMensajeError } from '../../../lib/errores'
import { listarPagos, validarPagoAdmin } from '../../../services/pagos.service'

function nombrePostulante(pago) {
  const persona = pago.postulante?.persona
  return [persona?.nombres, persona?.apellido_paterno, persona?.apellido_materno].filter(Boolean).join(' ') || 'Postulante no registrado'
}

function Fila({ etiqueta, valor }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-slate-500">{etiqueta}</p>
      <p className="mt-1 text-sm text-slate-900">{valor || 'No registrado'}</p>
    </div>
  )
}

export default function ListarPagos() {
  const queryClient = useQueryClient()
  const [pagina, setPagina] = useState(1)
  const [buscar, setBuscar] = useState('')
  const [filtros, setFiltros] = useState({ buscar: '', estado_pago: '' })
  const [pagoDetalle, setPagoDetalle] = useState(null)
  const [pagoValidar, setPagoValidar] = useState(null)

  const params = {
    pagina,
    por_pagina: 10,
    buscar: filtros.buscar || undefined,
    estado_pago: filtros.estado_pago || undefined,
  }

  const pagosQuery = useQuery({
    queryKey: ['pagos-admin', params],
    queryFn: () => listarPagos(params),
  })

  const validarMutation = useMutation({
    mutationFn: (pago) => validarPagoAdmin(pago.id),
    onSuccess: () => {
      toast.success('Pago validado administrativamente correctamente.')
      setPagoValidar(null)
      queryClient.invalidateQueries({ queryKey: ['pagos-admin'] })
    },
  })

  const pagos = pagosQuery.data?.datos || []
  const meta = pagosQuery.data?.meta || { pagina_actual: pagina, ultima_pagina: 1 }
  const totalPaginas = Number(meta.ultima_pagina || 1)

  const columnas = useMemo(() => [
    {
      header: 'Postulante',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-950">{nombrePostulante(row.original)}</p>
          <p className="text-xs text-slate-500">{row.original.postulante?.persona?.correo || 'Sin correo'}</p>
        </div>
      ),
    },
    { header: 'CI', cell: ({ row }) => row.original.postulante?.persona?.cedula_identidad || 'No registrado' },
    { header: 'Monto', cell: ({ row }) => `${row.original.monto} ${row.original.moneda}` },
    { header: 'Stripe', cell: ({ row }) => <BadgeEstado estado={row.original.estado_pago} /> },
    { header: 'Admin', cell: ({ row }) => <BadgeEstado estado={row.original.validado_admin ? 'aprobado' : 'pendiente'} /> },
    {
      header: 'Acciones',
      cell: ({ row }) => (
        <AccionesTabla>
          <Boton variante="secundario" className="min-h-9 px-3" onClick={() => setPagoDetalle(row.original)}>
            <Eye className="h-4 w-4" />
          </Boton>
          <Boton
            disabled={row.original.estado_pago !== 'pagado' || row.original.validado_admin}
            className="min-h-9 px-3"
            onClick={() => setPagoValidar(row.original)}
          >
            <CheckCircle2 className="h-4 w-4" />
          </Boton>
        </AccionesTabla>
      ),
    },
  ], [])

  function aplicarFiltros(event) {
    event.preventDefault()
    setPagina(1)
    setFiltros((actuales) => ({ ...actuales, buscar }))
  }

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Administrador', 'Pagos']} />
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Pagos</h1>
        <p className="mt-1 text-sm text-slate-600">Revision de pagos Stripe relacionados con postulantes.</p>
      </div>

      {pagosQuery.error ? <MensajeError mensaje={obtenerMensajeError(pagosQuery.error)} /> : null}
      {validarMutation.error ? <MensajeError mensaje={obtenerMensajeError(validarMutation.error)} /> : null}

      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <form className="grid gap-3 lg:grid-cols-[1fr_220px_auto]" onSubmit={aplicarFiltros}>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span>Buscar postulante</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input className="pl-9" value={buscar} onChange={(event) => setBuscar(event.target.value)} placeholder="Nombre, CI o correo" />
            </div>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span>Estado Stripe</span>
            <Select value={filtros.estado_pago} onChange={(event) => { setPagina(1); setFiltros((actuales) => ({ ...actuales, estado_pago: event.target.value })) }}>
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
              <option value="fallido">Fallido</option>
            </Select>
          </label>
          <div className="flex items-end">
            <Boton type="submit" className="w-full">Buscar</Boton>
          </div>
        </form>
      </section>

      <div>
        <TablaBase columnas={columnas} datos={pagos} cargando={pagosQuery.isLoading} mensajeVacio="No existen pagos con los filtros seleccionados." />
        {pagos.length ? (
          <PaginacionTabla
            pagina={Number(meta.pagina_actual || pagina)}
            totalPaginas={totalPaginas}
            onAnterior={() => setPagina((valor) => Math.max(1, valor - 1))}
            onSiguiente={() => setPagina((valor) => Math.min(totalPaginas, valor + 1))}
          />
        ) : null}
      </div>

      <Modal abierto={Boolean(pagoDetalle)} titulo="Detalle de pago" onCerrar={() => setPagoDetalle(null)}>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Fila etiqueta="Postulante" valor={pagoDetalle ? nombrePostulante(pagoDetalle) : ''} />
            <Fila etiqueta="Cedula" valor={pagoDetalle?.postulante?.persona?.cedula_identidad} />
            <Fila etiqueta="Correo" valor={pagoDetalle?.postulante?.persona?.correo} />
            <Fila etiqueta="Monto" valor={pagoDetalle ? `${pagoDetalle.monto} ${pagoDetalle.moneda}` : ''} />
            <Fila etiqueta="Estado Stripe" valor={pagoDetalle?.estado_pago} />
            <Fila etiqueta="Fecha pago" valor={pagoDetalle?.fecha_pago} />
            <Fila etiqueta="Validado admin" valor={pagoDetalle?.validado_admin ? 'Si' : 'No'} />
            <Fila etiqueta="Validado en" valor={pagoDetalle?.validado_en} />
          </div>
          <Fila etiqueta="Checkout session" valor={pagoDetalle?.stripe_checkout_session_id} />
          <Fila etiqueta="Payment intent" valor={pagoDetalle?.stripe_payment_intent_id} />
        </div>
      </Modal>

      <ConfirmDialog
        abierto={Boolean(pagoValidar)}
        titulo="Validar pago"
        mensaje={`Confirma validar administrativamente el pago de ${pagoValidar ? nombrePostulante(pagoValidar) : 'este postulante'}?`}
        onCancelar={() => setPagoValidar(null)}
        onConfirmar={() => validarMutation.mutate(pagoValidar)}
        cargando={validarMutation.isPending}
      />
    </div>
  )
}
