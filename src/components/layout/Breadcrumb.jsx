import { ChevronRight, Home } from 'lucide-react'

export default function Breadcrumb({ items = [] }) {
  return (
    <nav aria-label="Ruta actual" className="flex items-center gap-2 text-sm text-slate-500">
      <Home className="h-4 w-4" />
      {items.map((item) => (
        <span key={item} className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4" />
          <span>{item}</span>
        </span>
      ))}
    </nav>
  )
}

