import Input from '../common/Input'

export default function CampoTexto({ label, name, register, error, requerido = false, ...props }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      <span>{label}{requerido ? ' *' : ''}</span>
      <Input error={error} {...register(name)} {...props} />
      {error ? <span className="text-xs text-red-600">{error.message}</span> : null}
    </label>
  )
}

