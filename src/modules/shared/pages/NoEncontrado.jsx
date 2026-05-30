import { Link } from 'react-router-dom'
import Boton from '../../../components/common/Boton'

export default function NoEncontrado() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-4">
      <section className="max-w-md rounded-md border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">Ruta no encontrada</h1>
        <p className="mt-2 text-sm text-slate-600">La pantalla solicitada no existe en la configuracion actual.</p>
        <Link to="/" className="mt-5 inline-flex">
          <Boton>Ir al inicio</Boton>
        </Link>
      </section>
    </main>
  )
}

