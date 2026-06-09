import EstadoSistema from './EstadoSistema'

export default function Loader({ texto = 'Cargando...' }) {
  return <EstadoSistema tipo="cargando" titulo={texto} className="border-0 bg-transparent shadow-none" />
}
