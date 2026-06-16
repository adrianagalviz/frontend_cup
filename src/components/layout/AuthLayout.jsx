import { Outlet, useLocation } from "react-router-dom";

export default function AuthLayout() {
  const { pathname } = useLocation();
  const esFlujoPostulante =
    pathname.startsWith("/postulantes/registro") ||
    pathname.startsWith("/pagos/");

  if (esFlujoPostulante) {
    return (
      <main className="min-h-dvh bg-slate-100">
        <div className="mx-auto grid min-h-dvh max-w-6xl content-start gap-6 px-3 py-5 sm:px-4 sm:py-8 lg:px-6">
          <section className="rounded-md border border-slate-200 bg-white p-4 text-center shadow-sm sm:p-6">
            <img
              src="/logo ficct.png"
              alt="Logo FICCT"
              className="mx-auto mb-4 h-auto w-24 max-w-full sm:w-32"
            />
            <p className="text-sm font-semibold uppercase text-sky-800">
              Admision universitaria
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">
              Sistema CUP para la FICCT
            </h1>
            <p className="mx-auto mt-3 max-w-3xl text-sm text-slate-600 sm:text-base">
              Completa tu registro de postulante, realiza el pago de postulacion
              y espera la revision administrativa.
            </p>
          </section>
          <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <Outlet />
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-slate-100">
      <div className="mx-auto grid min-h-dvh max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[1fr_420px]">
        <section className="text-center lg:-translate-x-8 xl:-translate-x-16">
          <img
            src="/logo ficct.png"
            alt="Logo FICCT"
            className="mx-auto mb-5 h-auto w-28 max-w-full sm:w-36"
          />
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-800">
              Admision universitaria
            </p>
            <h1 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">
              Sistema CUP para la FICCT
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-slate-600">
              Acceso al sistema de postulantes, pagos, validacion de requisitos,
              horarios, asistencias, examenes y reportes.
            </p>
        </section>
        <section className="relative isolate rounded-md border border-slate-200 bg-slate-950 p-6 shadow-sm">
          <div className="absolute top-0 -right-6 -bottom-8 left-0 -z-10 overflow-hidden rounded-md sm:-right-10 sm:-bottom-12 lg:-inset-y-24 lg:-right-55 lg:-left-10">
            <img
              src="/modulo236-FICCT-VF_1000.jpg"
              alt=""
              className="h-full w-full object-cover"
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 bg-slate-950/40"
              aria-hidden="true"
            />
          </div>
          <div
            className="absolute inset-4 -z-10 rounded-md bg-white/85 shadow-sm backdrop-blur-[2px]"
            aria-hidden="true"
          />
          <div className="relative z-10">
            <Outlet />
          </div>
        </section>
      </div>
    </main>
  );
}
