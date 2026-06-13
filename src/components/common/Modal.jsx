import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import Boton from './Boton'

export default function Modal({ abierto, titulo, children, onCerrar, acciones, className = 'max-w-lg' }) {
  return (
    <Dialog open={abierto} onClose={onCerrar} className="relative z-50">
      <div className="fixed inset-0 bg-slate-950/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className={`flex max-h-[calc(100vh-2rem)] w-full flex-col rounded-md bg-white p-6 shadow-xl ${className}`}>
          <DialogTitle className="shrink-0 text-lg font-semibold text-slate-950">{titulo}</DialogTitle>
          <div className="mt-4 min-h-0 overflow-y-auto pr-1 text-sm text-slate-700">{children}</div>
          <div className="mt-6 flex shrink-0 justify-end gap-3">
            {acciones || <Boton variante="secundario" onClick={onCerrar}>Cerrar</Boton>}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
