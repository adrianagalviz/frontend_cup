import { Check, Moon, Palette, Sun } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import Boton from '../../../components/common/Boton'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import { useAuth } from '../../../hooks/useAuth'
import { CONFIGURACION_VISUAL_DEFAULT, PALETAS_VISUALES, normalizarConfiguracionVisual } from '../../../config/theme.config'

const nombresPaletas = {
  rosa: 'Rosa',
  verde: 'Verde',
  amarillo: 'Amarillo',
  azul: 'Azul',
  lila: 'Lila',
  rojo: 'Rojo',
  gris: 'Gris',
}

export default function ConfiguracionVisual() {
  const { usuario, guardarConfiguracionVisual } = useAuth()
  const configuracionUsuario = useMemo(
    () => normalizarConfiguracionVisual(usuario?.configuracion_visual || CONFIGURACION_VISUAL_DEFAULT),
    [usuario?.configuracion_visual],
  )
  const [configuracion, setConfiguracion] = useState(configuracionUsuario)
  const [guardando, setGuardando] = useState(false)

  const hayCambios = configuracion.paleta !== configuracionUsuario.paleta || configuracion.modo !== configuracionUsuario.modo

  async function guardar(event) {
    event.preventDefault()
    setGuardando(true)

    try {
      await guardarConfiguracionVisual(configuracion)
      toast.success('Configuracion visual guardada.')
    } catch (error) {
      toast.error(error?.mensaje || 'No se pudo guardar la configuracion visual.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form className="grid gap-5" onSubmit={guardar}>
      <Breadcrumb items={['Usuario', 'Configuracion']} />
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Configuracion visual</h1>
        <p className="mt-1 text-sm text-slate-600">Tus colores y modo se guardan en tu usuario para mantenerlos al volver a iniciar sesion.</p>
      </div>

      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-sky-50 p-2 text-sky-700">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-950">Paleta de colores</h2>
            <p className="text-sm text-slate-500">Elige la combinacion principal para botones, tablas, modales, graficos y textos destacados.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Object.entries(PALETAS_VISUALES).map(([clave, colores]) => {
            const activa = configuracion.paleta === clave

            return (
              <button
                key={clave}
                type="button"
                className={`group rounded-md border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                  activa ? 'border-sky-700 ring-2 ring-sky-100' : 'border-slate-200 bg-white hover:border-sky-300'
                }`}
                onClick={() => setConfiguracion((actual) => ({ ...actual, paleta: clave }))}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-950">{nombresPaletas[clave]}</span>
                  {activa ? <Check className="h-4 w-4 text-sky-700" /> : null}
                </div>
                <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-md border border-slate-200">
                  {colores.map((color) => (
                    <span key={color} className="h-10" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Modo de visualizacion</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { valor: 'claro', label: 'Modo claro', icono: Sun },
            { valor: 'oscuro', label: 'Modo oscuro', icono: Moon },
          ].map(({ valor, label, icono: Icon }) => {
            const activo = configuracion.modo === valor

            return (
              <button
                key={valor}
                type="button"
                className={`flex min-h-16 items-center gap-3 rounded-md border px-4 text-left transition ${
                  activo ? 'border-sky-700 bg-sky-50 text-sky-900 ring-2 ring-sky-100' : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-slate-50'
                }`}
                onClick={() => setConfiguracion((actual) => ({ ...actual, modo: valor }))}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="font-semibold">{label}</span>
                {activo ? <Check className="ml-auto h-4 w-4" /> : null}
              </button>
            )
          })}
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Boton
          type="button"
          variante="secundario"
          onClick={() => setConfiguracion(configuracionUsuario)}
          disabled={!hayCambios || guardando}
        >
          Restaurar
        </Boton>
        <Boton type="submit" cargando={guardando} disabled={!hayCambios}>
          Guardar configuracion
        </Boton>
      </div>
    </form>
  )
}
