import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[1fr_420px]">
        <section>
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-800">Admision universitaria</p>
          <h1 className="mt-3 text-4xl font-bold text-slate-950">Sistema CUP para la FICCT</h1>
          <p className="mt-4 max-w-xl text-base text-slate-600">
            Acceso al sistema de postulantes, pagos, validacion de requisitos, horarios, asistencias, examenes y reportes.
          </p>
        </section>
        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <Outlet />
        </section>
      </div>
    </main>
  )
}

