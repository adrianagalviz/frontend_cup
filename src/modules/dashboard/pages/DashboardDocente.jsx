import { CalendarDays, ClipboardList, Users } from 'lucide-react'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import CardIndicador from '../../../components/common/CardIndicador'

export default function DashboardDocente() {
  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Docente', 'Dashboard']} />
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Panel docente</h1>
        <p className="mt-1 text-sm text-slate-600">Base para horarios, asistencia docente y asistencia de alumnos.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <CardIndicador titulo="Clases" valor="-" descripcion="Horarios asignados" icono={<CalendarDays className="h-5 w-5" />} />
        <CardIndicador titulo="Grupos" valor="-" descripcion="Grupos propios" icono={<Users className="h-5 w-5" />} />
        <CardIndicador titulo="Asistencia" valor="-" descripcion="Entrada, salida y alumnos" icono={<ClipboardList className="h-5 w-5" />} />
      </div>
    </div>
  )
}

