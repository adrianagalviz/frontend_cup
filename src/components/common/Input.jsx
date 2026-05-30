export default function Input({ error, className = '', ...props }) {
  return (
    <input
      className={`min-h-10 w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 ${error ? 'border-red-400 focus:ring-red-200' : 'border-slate-300 focus:border-sky-600 focus:ring-sky-100'} ${className}`}
      {...props}
    />
  )
}

