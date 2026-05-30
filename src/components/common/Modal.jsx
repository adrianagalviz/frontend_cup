import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import Boton from './Boton'

export default function Modal({ abierto, titulo, children, onCerrar, acciones }) {
  return (
    <Dialog open={abierto} onClose={onCerrar} className="relative z-50">
      <div className="fixed inset-0 bg-slate-950/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-lg rounded-md bg-white p-6 shadow-xl">
          <DialogTitle className="text-lg font-semibold text-slate-950">{titulo}</DialogTitle>
          <div className="mt-4 text-sm text-slate-700">{children}</div>
          <div className="mt-6 flex justify-end gap-3">
            {acciones || <Boton variante="secundario" onClick={onCerrar}>Cerrar</Boton>}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

