import { NavLink } from 'react-router-dom'
import { BookOpen, CalendarDays, ClipboardList, FileText, Home, Users } from 'lucide-react'

const menuPorRol = {
  administrador: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: Home },
    { to: '/admin/postulantes', label: 'Postulantes', icon: Users },
    { to: '/admin/reportes', label: 'Reportes', icon: FileText },
  ],
  docente: [
    { to: '/docente/dashboard', label: 'Dashboard', icon: Home },
    { to: '/docente/horarios', label: 'Horarios', icon: CalendarDays },
    { to: '/docente/asistencias', label: 'Asistencias', icon: ClipboardList },
  ],
  alumno: [
    { to: '/alumno/dashboard', label: 'Dashboard', icon: Home },
    { to: '/alumno/horarios', label: 'Horarios', icon: CalendarDays },
    { to: '/alumno/examenes', label: 'Examenes', icon: BookOpen },
  ],
}

export default function Sidebar({ rol = 'administrador', abierto = false, onCerrar }) {
  const items = menuPorRol[rol] || []

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-slate-950/40 lg:hidden ${abierto ? 'block' : 'hidden'}`} onClick={onCerrar} />
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200 bg-white transition lg:static lg:z-auto lg:block lg:translate-x-0 ${abierto ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center border-b border-slate-200 px-5">
          <span className="rounded-md bg-sky-700 px-3 py-1.5 text-sm font-bold text-white">CUP-FICCT</span>
        </div>
        <nav className="grid gap-1 p-3">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onCerrar}
              className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-sky-50 text-sky-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}

