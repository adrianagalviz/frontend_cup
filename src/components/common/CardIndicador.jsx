export default function CardIndicador({ titulo, valor, descripcion, icono }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{titulo}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{valor}</p>
          {descripcion ? <p className="mt-1 text-sm text-slate-500">{descripcion}</p> : null}
        </div>
        {icono ? <div className="rounded-md bg-sky-50 p-2 text-sky-700">{icono}</div> : null}
      </div>
    </section>
  )
}

