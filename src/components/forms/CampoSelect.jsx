import Select from '../common/Select'

export default function CampoSelect({ label, name, register, error, requerido = false, children, ...props }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      <span>{label}{requerido ? ' *' : ''}</span>
      <Select error={error} {...register(name)} {...props}>
        {children}
      </Select>
      {error ? <span className="text-xs text-red-600">{error.message}</span> : null}
    </label>
  )
}

