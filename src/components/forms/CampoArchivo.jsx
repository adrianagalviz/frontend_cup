import { ImageUp, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import Boton from '../common/Boton'

export default function CampoArchivo({
  label,
  name,
  register,
  error,
  requerido = false,
  accept = 'image/*',
  ayuda = 'Formatos permitidos: JPG, PNG o WEBP.',
  ...props
}) {
  const inputRef = useRef(null)
  const previewRef = useRef('')
  const [archivo, setArchivo] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const registro = register(name)
  const errorImagen = archivo && !archivo.type?.startsWith('image/')

  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current)
      }
    }
  }, [])

  function actualizarPreview(seleccionado) {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current)
      previewRef.current = ''
    }

    if (seleccionado?.type?.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(seleccionado)
      previewRef.current = objectUrl
      setPreviewUrl(objectUrl)
      return
    }

    setPreviewUrl('')
  }

  function asignarRef(elemento) {
    inputRef.current = elemento
    registro.ref(elemento)
  }

  function manejarCambio(event) {
    const seleccionado = event.target.files?.[0] || null
    setArchivo(seleccionado)
    actualizarPreview(seleccionado)
    registro.onChange(event)
  }

  function quitarArchivo() {
    if (inputRef.current) {
      inputRef.current.value = ''
    }

    setArchivo(null)
    actualizarPreview(null)
    registro.onChange({
      target: { name, value: undefined, files: [] },
      type: 'change',
    })
  }

  return (
    <div className="grid gap-2 text-sm font-medium text-slate-700">
      <label className="grid gap-1.5">
        <span>{label}{requerido ? ' *' : ''}</span>
        <input
          type="file"
          accept={accept}
          className={`block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 ${error || errorImagen ? 'border-red-400' : 'border-slate-300'}`}
          {...registro}
          ref={asignarRef}
          onChange={manejarCambio}
          {...props}
        />
      </label>

      {archivo ? (
        <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 md:grid-cols-[160px_1fr]">
          <div className="flex h-32 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white">
            {previewUrl ? (
              <img src={previewUrl} alt={`Vista previa de ${archivo.name}`} className="h-full w-full object-cover" />
            ) : (
              <ImageUp className="h-8 w-8 text-slate-400" />
            )}
          </div>
          <div className="grid content-start gap-2">
            <div>
              <p className="break-all text-sm font-semibold text-slate-900">{archivo.name}</p>
              <p className="mt-1 text-xs font-normal text-slate-500">{(archivo.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <Boton variante="secundario" className="w-fit px-3" onClick={quitarArchivo}>
              <X className="h-4 w-4" />
              Reemplazar archivo
            </Boton>
          </div>
        </div>
      ) : (
        <p className="text-xs font-normal text-slate-500">{ayuda}</p>
      )}

      {errorImagen ? <span className="text-xs font-normal text-red-600">El archivo seleccionado debe ser una imagen.</span> : null}
      {error ? <span className="text-xs font-normal text-red-600">{error.message}</span> : null}
    </div>
  )
}
