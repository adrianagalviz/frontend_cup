import { LogOut, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Boton from '../common/Boton'
import { useAuth } from '../../hooks/useAuth'

export default function Navbar({ sidebarContraido = false, onAbrirMenu, onAlternarSidebar }) {
  const navigate = useNavigate()
  const { usuario, salir } = useAuth()

  async function cerrarSesion() {
    await salir()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="rounded-md p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 lg:hidden"
            onClick={onAbrirMenu}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="hidden rounded-md p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 lg:inline-flex"
            onClick={onAlternarSidebar}
            aria-label={sidebarContraido ? 'Mostrar menu lateral' : 'Ocultar menu lateral'}
            title={sidebarContraido ? 'Mostrar menu lateral' : 'Ocultar menu lateral'}
          >
            {sidebarContraido ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">CUP-FICCT</p>
            <p className="truncate text-xs text-slate-500">{usuario?.persona?.nombres || usuario?.nombre_usuario || 'Usuario autenticado'}</p>
          </div>
        </div>
        <Boton variante="secundario" onClick={cerrarSesion}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Salir</span>
        </Boton>
      </div>
    </header>
  )
}
