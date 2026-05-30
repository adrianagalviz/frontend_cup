import { LogIn } from 'lucide-react'
import Boton from '../../../components/common/Boton'

export default function BotonGoogle({ onClick, cargando = false }) {
  return (
    <Boton
      type="button"
      variante="secundario"
      cargando={cargando}
      onClick={onClick}
      className="w-full"
    >
      <LogIn className="h-4 w-4" />
      Continuar con Google
    </Boton>
  )
}
