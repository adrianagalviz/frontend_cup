import EstadoSistema from './EstadoSistema'

export default function EmptyState({ titulo = 'Sin datos', descripcion = 'No existen registros para mostrar.' }) {
  return <EstadoSistema tipo="vacio" titulo={titulo} descripcion={descripcion} className="border-dashed shadow-none" />
}
