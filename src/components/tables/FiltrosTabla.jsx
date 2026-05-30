import Input from '../common/Input'

export default function FiltrosTabla({ busqueda, onBuscar, placeholder = 'Buscar...' }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Input
        value={busqueda}
        onChange={(event) => onBuscar?.(event.target.value)}
        placeholder={placeholder}
        className="sm:max-w-xs"
      />
    </div>
  )
}

