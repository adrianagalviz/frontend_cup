import { useNavigate } from 'react-router-dom'
import EstadoSistema from '../../../components/common/EstadoSistema'

export default function NoEncontrado() {
  const navigate = useNavigate()

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-4">
      <EstadoSistema
        tipo="vacio"
        titulo="Ruta no encontrada"
        descripcion="La pantalla solicitada no existe en la configuracion actual."
        accion="Ir al inicio"
        onAccion={() => navigate('/')}
        className="w-full max-w-md"
      />
    </main>
  )
}
