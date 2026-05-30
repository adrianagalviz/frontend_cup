import { useState, useEffect } from 'react'
import { CheckCircle, Server, Database, Code, Layers, Activity, ChevronRight, Play } from 'lucide-react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'

function App() {
  const [count, setCount] = useState(0)
  const [apiStatus, setApiStatus] = useState('checking')
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

  useEffect(() => {
    // Check backend health
    fetch(apiUrl)
      .then(res => {
        if (res.ok) setApiStatus('online')
        else setApiStatus('error')
      })
      .catch(() => setApiStatus('offline'))
  }, [apiUrl])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-indigo-600 text-white font-extrabold px-3 py-1.5 rounded-lg text-sm tracking-wide shadow-md shadow-indigo-600/20">
              CUP-FICCT
            </span>
            <span className="text-slate-400 font-medium text-sm hidden sm:inline">|</span>
            <span className="text-slate-300 font-semibold text-sm hidden sm:inline">Portal de Admisión</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 rounded-full border border-slate-700/50 text-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${apiStatus === 'online' ? 'bg-emerald-500 animate-pulse' :
                  apiStatus === 'offline' ? 'bg-rose-500' :
                    apiStatus === 'error' ? 'bg-amber-500' : 'bg-slate-500 animate-ping'
                }`}></span>
              <span className="font-medium text-slate-300">
                Backend API: {
                  apiStatus === 'online' ? 'Online' :
                    apiStatus === 'offline' ? 'Offline (Local)' :
                      apiStatus === 'error' ? 'API Error' : 'Checking...'
                }
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 flex flex-col gap-12 relative z-10">
        {/* Hero Section */}
        <section className="text-center flex flex-col items-center gap-6 max-w-3xl mx-auto">
          <div className="flex items-center gap-6 justify-center mb-2">
            <img src={viteLogo} className="h-16 w-16 drop-shadow-[0_0_20px_rgba(100,108,255,0.3)] animate-[bounce_3s_infinite]" alt="Vite logo" />
            <img src={reactLogo} className="h-16 w-16 drop-shadow-[0_0_20px_rgba(97,218,251,0.3)] animate-[spin_20s_linear_infinite]" alt="React logo" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
            Frontend CUP-FICCT
          </h1>
          <p className="text-lg text-slate-400 font-normal leading-relaxed">
            Estructura base y arquitectura inicial en React con Vite y Tailwind CSS v4, lista para el consumo de las APIs REST de Laravel y base de datos PostgreSQL.
          </p>
        </section>

        {/* Tech Stack Grid */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl flex flex-col gap-3">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 w-fit rounded-xl">
              <Code className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-200 text-lg">React & Vite</h3>
            <p className="text-sm text-slate-400">Entorno de alto rendimiento con Vite para desarrollo ágil y reactivo.</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl flex flex-col gap-3">
            <div className="p-3 bg-purple-500/10 text-purple-400 w-fit rounded-xl">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-200 text-lg">Tailwind CSS v4</h3>
            <p className="text-sm text-slate-400">Estilos modernos y optimizados configurados directamente con el compilador nativo v4.</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl flex flex-col gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 w-fit rounded-xl">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-200 text-lg">PostgreSQL 16</h3>
            <p className="text-sm text-slate-400">Base de datos robusta para la persistencia del sistema de admisión preuniversitario.</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl flex flex-col gap-3">
            <div className="p-3 bg-sky-500/10 text-sky-400 w-fit rounded-xl">
              <Server className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-200 text-lg">Laravel API REST</h3>
            <p className="text-sm text-slate-400">Backend modular para control de sesión, postulaciones, Stripe y Cloudinary.</p>
          </div>
        </section>

        {/* Status / Scope Progress & Libraries */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Progress (Fases 0 a 2.1) */}
          <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800/70 p-6 rounded-2xl flex flex-col gap-6">
            <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              Progreso de Fases e Hitos Realizados
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex gap-4 items-start">
                <div className="mt-1 bg-emerald-500/20 text-emerald-400 p-1 rounded-full">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200">Fase 0: Planificación Técnica Completa</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Confirmación de alcance funcional y selección de librerías base para producción.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="mt-1 bg-emerald-500/20 text-emerald-400 p-1 rounded-full">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200">Fase 1: Creación del Proyecto & Tailwind 4</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Scaffolding de React con Vite, limpieza de plantilla, instalación de dependencias base y config de variables de entorno.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="mt-1 bg-emerald-500/20 text-emerald-400 p-1 rounded-full">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200">Fase 2.1: Estructura Modular de Carpetas</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Organización del directorio <code>src/</code> para escalabilidad con app, components, modules, services, hooks, config, lib, styles.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start border-t border-slate-800/80 pt-4 opacity-50">
                <div className="mt-1 bg-slate-800 text-slate-500 p-1 rounded-full">
                  <Play className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-300">Fase 2.2+ en adelante</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Pendiente para desarrollo posterior (Componentes comunes, Layouts, Rutas protegidas, Auth).</p>
                </div>
              </div>
            </div>
          </div>

          {/* Installed libraries list */}
          <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800/70 p-6 rounded-2xl flex flex-col gap-6">
            <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              Librerías React Instaladas
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-800/40 border border-slate-700/30 rounded-xl">
                <p className="font-bold text-slate-300">Rutas</p>
                <p className="text-slate-400 mt-1">react-router-dom</p>
              </div>
              <div className="p-3 bg-slate-800/40 border border-slate-700/30 rounded-xl">
                <p className="font-bold text-slate-300">HTTP REST</p>
                <p className="text-slate-400 mt-1">axios</p>
              </div>
              <div className="p-3 bg-slate-800/40 border border-slate-700/30 rounded-xl">
                <p className="font-bold text-slate-300">Formularios</p>
                <p className="text-slate-400 mt-1">react-hook-form</p>
              </div>
              <div className="p-3 bg-slate-800/40 border border-slate-700/30 rounded-xl">
                <p className="font-bold text-slate-300">Validaciones</p>
                <p className="text-slate-400 mt-1">zod</p>
              </div>
              <div className="p-3 bg-slate-800/40 border border-slate-700/30 rounded-xl">
                <p className="font-bold text-slate-300">Tablas Reutilizables</p>
                <p className="text-slate-400 mt-1">@tanstack/react-table</p>
              </div>
              <div className="p-3 bg-slate-800/40 border border-slate-700/30 rounded-xl">
                <p className="font-bold text-slate-300">Cache / Query</p>
                <p className="text-slate-400 mt-1">@tanstack/react-query</p>
              </div>
              <div className="p-3 bg-slate-800/40 border border-slate-700/30 rounded-xl col-span-2">
                <p className="font-bold text-slate-300">UI & Componentes</p>
                <p className="text-slate-400 mt-1">@headlessui/react, lucide-react, sonner, recharts</p>
              </div>
            </div>
          </div>
        </section>

        {/* State Interactive Test */}
        <section className="bg-gradient-to-r from-indigo-950/40 to-slate-900/60 border border-slate-800/80 p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-slate-200">Prueba de React State en Tiempo Real</h3>
            <p className="text-sm text-slate-400">Verifica que el HMR de Vite y la lógica interactiva funcionan correctamente.</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCount(count + 1)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 text-sm"
            >
              Incrementar Contador
              <span className="bg-indigo-800 text-white px-2 py-0.5 rounded-md font-mono text-xs">{count}</span>
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Universidad FICCT. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <a href="https://vite.dev/" target="_blank" className="hover:text-slate-300 transition-colors">Vite Docs</a>
            <a href="https://react.dev/" target="_blank" className="hover:text-slate-300 transition-colors">React Docs</a>
            <a href="https://tailwindcss.com/" target="_blank" className="hover:text-slate-300 transition-colors">Tailwind CSS v4</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
