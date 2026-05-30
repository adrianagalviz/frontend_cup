import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { obtenerRolUsuario } from '../../lib/auth'
import { useAuth } from '../../hooks/useAuth'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function DashboardLayout({ rol }) {
  const { usuario } = useAuth()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const rolActual = rol || obtenerRolUsuario(usuario)

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <Sidebar rol={rolActual} abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)} />
      <div className="min-w-0 flex-1">
        <Navbar onAbrirMenu={() => setMenuAbierto(true)} />
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

