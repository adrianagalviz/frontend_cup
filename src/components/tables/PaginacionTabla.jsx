import Boton from '../common/Boton'

export default function PaginacionTabla({ pagina = 1, totalPaginas = 1, onAnterior, onSiguiente }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
      <span>Pagina {pagina} de {totalPaginas}</span>
      <div className="flex gap-2">
        <Boton variante="secundario" disabled={pagina <= 1} onClick={onAnterior}>Anterior</Boton>
        <Boton variante="secundario" disabled={pagina >= totalPaginas} onClick={onSiguiente}>Siguiente</Boton>
      </div>
    </div>
  )
}

