import { LogOut, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Boton from '../common/Boton'
import { useAuth } from '../../hooks/useAuth'

export default function Navbar({ onAbrirMenu }) {
  const navigate = useNavigate()
  const { usuario, salir } = useAuth()

  async function cerrarSesion() {
    await salir()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 lg:px-6">
        <button
          type="button"
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          onClick={onAbrirMenu}
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <p className="text-sm font-semibold text-slate-950">CUP-FICCT</p>
          <p className="text-xs text-slate-500">{usuario?.persona?.nombres || usuario?.nombre_usuario || 'Usuario autenticado'}</p>
        </div>
        <Boton variante="secundario" onClick={cerrarSesion}>
          <LogOut className="h-4 w-4" />
          Salir
        </Boton>
      </div>
    </header>
  )
}
