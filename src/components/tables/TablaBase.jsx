/* eslint-disable react-hooks/incompatible-library */
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import EmptyState from '../common/EmptyState'
import Loader from '../common/Loader'

export default function TablaBase({
  columnas = [],
  datos = [],
  cargando = false,
  mensajeVacio = 'No existen registros para mostrar.',
}) {
  const table = useReactTable({
    data: datos,
    columns: columnas,
    getCoreRowModel: getCoreRowModel(),
  })

  if (cargando) return <Loader texto="Cargando registros..." />
  if (!datos.length) return <EmptyState descripcion={mensajeVacio} />

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="overflow-x-auto overscroll-x-contain">
        <table className="min-w-[760px] divide-y divide-slate-200 text-sm lg:min-w-full">
          <thead className="bg-slate-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-3 py-3 text-left font-semibold text-slate-700 sm:px-4">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="max-w-80 px-3 py-3 align-top text-slate-700 sm:px-4">
                    <div className="min-w-0 overflow-hidden text-ellipsis">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
