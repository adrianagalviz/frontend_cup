import { ChevronRight, Home } from 'lucide-react'

export default function Breadcrumb({ items = [] }) {
  return (
    <nav aria-label="Ruta actual" className="min-w-0 overflow-x-auto pb-1">
      <div className="flex w-max max-w-full items-center gap-2 text-sm text-slate-500">
        <Home className="h-4 w-4 shrink-0" />
        {items.map((item) => (
          <span key={item} className="flex min-w-0 items-center gap-2">
            <ChevronRight className="h-4 w-4 shrink-0" />
            <span className="max-w-40 truncate sm:max-w-none">{item}</span>
          </span>
        ))}
      </div>
    </nav>
  )
}
