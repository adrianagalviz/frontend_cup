import { BarChart3, ClipboardCheck, GraduationCap } from 'lucide-react'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import CardIndicador from '../../../components/common/CardIndicador'

export default function DashboardAdministrador() {
  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Administrador', 'Dashboard']} />
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Panel administrativo</h1>
        <p className="mt-1 text-sm text-slate-600">Base lista para consumir resumen, asistencia, cupos y examenes del backend.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <CardIndicador titulo="Postulantes" valor="-" descripcion="Pendiente de endpoint dashboard/resumen" icono={<GraduationCap className="h-5 w-5" />} />
        <CardIndicador titulo="Requisitos" valor="-" descripcion="Validacion administrativa" icono={<ClipboardCheck className="h-5 w-5" />} />
        <CardIndicador titulo="Reportes" valor="-" descripcion="PDF, Excel y voz" icono={<BarChart3 className="h-5 w-5" />} />
      </div>
    </div>
  )
}

