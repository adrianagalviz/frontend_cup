import { BookOpen, CalendarDays, ClipboardCheck } from 'lucide-react'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import CardIndicador from '../../../components/common/CardIndicador'

export default function DashboardAlumno() {
  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Alumno', 'Dashboard']} />
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Panel alumno</h1>
        <p className="mt-1 text-sm text-slate-600">Base para perfil, horarios, asistencias, examenes habilitados y notas.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <CardIndicador titulo="Horario" valor="-" descripcion="Segun grupo asignado" icono={<CalendarDays className="h-5 w-5" />} />
        <CardIndicador titulo="Asistencia" valor="-" descripcion="Marcado segun horario" icono={<ClipboardCheck className="h-5 w-5" />} />
        <CardIndicador titulo="Examenes" valor="-" descripcion="Solo si estan habilitados" icono={<BookOpen className="h-5 w-5" />} />
      </div>
    </div>
  )
}

