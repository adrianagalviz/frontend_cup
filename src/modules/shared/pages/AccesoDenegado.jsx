import { useNavigate } from 'react-router-dom'
import EstadoSistema from '../../../components/common/EstadoSistema'

export default function AccesoDenegado() {
  const navigate = useNavigate()

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-4">
      <EstadoSistema
        tipo="acceso-denegado"
        titulo="Acceso denegado"
        descripcion="Tu rol no tiene permiso para ingresar a esta ruta."
        accion="Volver al panel"
        onAccion={() => navigate('/')}
        className="w-full max-w-md"
      />
    </main>
  )
}
