import { Outlet, useLocation } from 'react-router-dom'

export default function AuthLayout() {
  const { pathname } = useLocation()
  const esFlujoPostulante = pathname.startsWith('/postulantes/registro') || pathname.startsWith('/pagos/')

  if (esFlujoPostulante) {
    return (
      <main className="min-h-dvh bg-slate-100">
        <div className="mx-auto grid min-h-dvh max-w-6xl content-start gap-6 px-3 py-5 sm:px-4 sm:py-8 lg:px-6">
          <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <p className="text-sm font-semibold uppercase text-sky-800">Admision universitaria</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">Sistema CUP para la FICCT</h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-600 sm:text-base">
              Completa tu registro de postulante, realiza el pago de postulacion y espera la revision administrativa.
            </p>
          </section>
          <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <Outlet />
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-slate-100">
      <div className="mx-auto grid min-h-dvh max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[1fr_420px]">
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
