export default function CampoArchivo({ label, name, register, error, requerido = false, accept, ...props }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      <span>{label}{requerido ? ' *' : ''}</span>
      <input
        type="file"
        accept={accept}
        className={`block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 ${error ? 'border-red-400' : 'border-slate-300'}`}
        {...register(name)}
        {...props}
      />
      {error ? <span className="text-xs text-red-600">{error.message}</span> : null}
    </label>
  )
}

