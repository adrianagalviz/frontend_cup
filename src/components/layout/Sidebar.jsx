import { NavLink } from 'react-router-dom'
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Home,
  Landmark,
  LayoutGrid,
  School,
  User,
  UserCog,
  Users,
  X,
} from 'lucide-react'

const menuPorRol = {
  administrador: [
    {
      modulo: 'Inicio',
      items: [
        { to: '/admin/dashboard', label: 'Dashboard', icon: Home },
        { to: '/admin/perfil', label: 'Perfil', icon: User },
      ],
    },
    {
      modulo: 'Administracion',
      items: [
        { to: '/admin/usuarios', label: 'Usuarios', icon: UserCog },
        { to: '/admin/postulantes', label: 'Postulantes', icon: Users },
        { to: '/admin/requisitos', label: 'Requisitos', icon: ClipboardCheck },
        { to: '/admin/pagos', label: 'Pagos', icon: CreditCard },
        { to: '/admin/alumnos', label: 'Alumnos', icon: GraduationCap },
      ],
    },
    {
      modulo: 'Academico',
      items: [
        { to: '/admin/gestion-academica', label: 'Gestion academica', icon: Landmark },
        { to: '/admin/docentes', label: 'Docentes', icon: School },
        { to: '/admin/horarios', label: 'Horarios', icon: CalendarDays },
        { to: '/admin/asignaciones', label: 'Asignaciones', icon: LayoutGrid },
      ],
    },
    {
      modulo: 'Seguimiento',
      items: [
        { to: '/admin/asistencias', label: 'Asistencias', icon: ClipboardList },
        { to: '/admin/examenes', label: 'Examenes', icon: BookOpen },
        { to: '/admin/notas', label: 'Notas', icon: FileSpreadsheet },
        { to: '/admin/admision', label: 'Admision final', icon: GraduationCap },
      ],
    },
    {
      modulo: 'Reportes',
      items: [
        { to: '/admin/reportes', label: 'Reportes', icon: FileText },
        { to: '/admin/carga-masiva', label: 'Carga masiva', icon: FileSpreadsheet },
      ],
    },
  ],
  docente: [
    {
      modulo: 'Inicio',
      items: [
        { to: '/docente/dashboard', label: 'Dashboard', icon: Home },
        { to: '/docente/perfil', label: 'Perfil', icon: User },
      ],
    },
    {
      modulo: 'Docencia',
      items: [
        { to: '/docente/horarios', label: 'Horarios', icon: CalendarDays },
        { to: '/docente/asistencias', label: 'Asistencias', icon: ClipboardList },
      ],
    },
  ],
  alumno: [
    {
      modulo: 'Inicio',
      items: [
        { to: '/alumno/dashboard', label: 'Dashboard', icon: Home },
        { to: '/alumno/perfil', label: 'Perfil', icon: User },
      ],
    },
    {
      modulo: 'Curso',
      items: [
        { to: '/alumno/horarios', label: 'Horarios', icon: CalendarDays },
        { to: '/alumno/examenes', label: 'Examenes', icon: BookOpen },
      ],
    },
  ],
}

const rolTexto = {
  administrador: 'Administrador',
  docente: 'Docente',
  alumno: 'Alumno',
}

export default function Sidebar({
  rol = 'administrador',
  abierto = false,
  contraido = false,
  onCerrar,
  onAlternarContraido,
}) {
  const modulos = menuPorRol[rol] || []
  const ancho = contraido ? 'lg:w-20' : 'lg:w-72'

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm transition-opacity lg:hidden ${abierto ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onCerrar}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white shadow-2xl shadow-slate-950/10 transition-all duration-300 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 lg:shadow-none ${ancho} ${abierto ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className={`flex h-20 items-center gap-3 border-b border-slate-200 px-4 ${contraido ? 'lg:justify-center lg:px-3' : ''}`}>
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-sky-700 text-sm font-black text-white shadow-lg shadow-sky-900/20">
            CF
          </div>
          <div className={`min-w-0 flex-1 ${contraido ? 'lg:hidden' : ''}`}>
            <p className="truncate text-sm font-black text-slate-950">CUP-FICCT</p>
            <p className="truncate text-xs font-medium text-slate-500">{rolTexto[rol] || 'Usuario'}</p>
          </div>
          <button
            type="button"
            className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 lg:hidden"
            onClick={onCerrar}
            aria-label="Cerrar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {modulos.map(({ modulo, items }) => (
            <section key={modulo} className="space-y-1.5">
              <div className={`px-3 text-xs font-bold uppercase text-slate-400 ${contraido ? 'lg:px-0 lg:text-center' : ''}`}>
                <span className={contraido ? 'lg:hidden' : ''}>{modulo}</span>
                <span className={`mx-auto hidden h-px w-8 bg-slate-200 ${contraido ? 'lg:block' : ''}`} />
              </div>
              {items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onCerrar}
                  title={contraido ? label : undefined}
                  className={({ isActive }) =>
                    `group relative flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${
                      contraido ? 'lg:justify-center lg:px-0' : ''
                    } ${
                      isActive
                        ? 'bg-sky-700 text-white shadow-lg shadow-sky-900/15'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-700'}`} />
                      <span className={`truncate ${contraido ? 'lg:hidden' : ''}`}>{label}</span>
                      {isActive ? <span className={`ml-auto h-2 w-2 rounded-full bg-emerald-300 ${contraido ? 'lg:hidden' : ''}`} /> : null}
                    </>
                  )}
                </NavLink>
              ))}
            </section>
          ))}
        </nav>

        <div className="hidden border-t border-slate-200 p-3 lg:block">
          <button
            type="button"
            className={`flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 ${contraido ? 'justify-center px-0' : ''}`}
            onClick={onAlternarContraido}
            aria-label={contraido ? 'Mostrar menu lateral' : 'Ocultar menu lateral'}
            title={contraido ? 'Mostrar menu lateral' : 'Ocultar menu lateral'}
          >
            {contraido ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            <span className={contraido ? 'lg:hidden' : ''}>{contraido ? 'Mostrar' : 'Ocultar'}</span>
          </button>
        </div>
      </aside>
    </>
  )
}
