import { Navigate, createBrowserRouter } from 'react-router-dom'
import AdminLayout from '../components/layout/AdminLayout'
import AlumnoLayout from '../components/layout/AlumnoLayout'
import AuthLayout from '../components/layout/AuthLayout'
import DocenteLayout from '../components/layout/DocenteLayout'
import { RedireccionPorRol, RutaPorRol, RutaProtegida } from '../components/layout/RutasProtegidas'
import AccesoDenegado from '../modules/shared/pages/AccesoDenegado'
import NoEncontrado from '../modules/shared/pages/NoEncontrado'
import DashboardAdministrador from '../modules/dashboard/pages/DashboardAdministrador'
import DashboardAlumno from '../modules/dashboard/pages/DashboardAlumno'
import DashboardDocente from '../modules/dashboard/pages/DashboardDocente'
import Login from '../modules/auth/pages/Login'
import PagoCancelado from '../modules/pagos/pages/PagoCancelado'
import PagoExitoso from '../modules/pagos/pages/PagoExitoso'
import PerfilAutenticado from '../modules/perfil/pages/PerfilAutenticado'
import RegistroPostulante from '../modules/postulantes/pages/RegistroPostulante'
import VistaPendiente from '../modules/shared/pages/VistaPendiente'

const router = createBrowserRouter([
  {
    path: '/',
    element: <RedireccionPorRol />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/postulantes/registro', element: <RegistroPostulante /> },
      { path: '/pagos/exitoso', element: <PagoExitoso /> },
      { path: '/pagos/cancelado', element: <PagoCancelado /> },
      { path: '/firebase/retorno', element: <VistaPendiente titulo="Retorno Firebase" descripcion="Ruta publica preparada para validacion con Google/Firebase." /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <RutaProtegida>
        <RutaPorRol roles={['administrador']}>
          <AdminLayout />
        </RutaPorRol>
      </RutaProtegida>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardAdministrador /> },
      { path: 'perfil', element: <PerfilAutenticado /> },
      { path: 'postulantes', element: <VistaPendiente titulo="Postulantes" descripcion="Modulo administrativo definido para listar, validar y convertir postulantes." /> },
      { path: 'reportes', element: <VistaPendiente titulo="Reportes" descripcion="Modulo administrativo definido para reportes, PDF, Excel y comandos de voz." /> },
    ],
  },
  {
    path: '/docente',
    element: (
      <RutaProtegida>
        <RutaPorRol roles={['docente']}>
          <DocenteLayout />
        </RutaPorRol>
      </RutaProtegida>
    ),
    children: [
      { index: true, element: <Navigate to="/docente/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardDocente /> },
      { path: 'perfil', element: <PerfilAutenticado /> },
      { path: 'horarios', element: <VistaPendiente titulo="Horarios docente" descripcion="Ruta definida para la carga horaria del docente autenticado." /> },
      { path: 'asistencias', element: <VistaPendiente titulo="Asistencias docente" descripcion="Ruta definida para entrada, salida y asistencia de alumnos." /> },
    ],
  },
  {
    path: '/alumno',
    element: (
      <RutaProtegida>
        <RutaPorRol roles={['alumno']}>
          <AlumnoLayout />
        </RutaPorRol>
      </RutaProtegida>
    ),
    children: [
      { index: true, element: <Navigate to="/alumno/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardAlumno /> },
      { path: 'perfil', element: <PerfilAutenticado /> },
      { path: 'horarios', element: <VistaPendiente titulo="Horarios alumno" descripcion="Ruta definida para horarios segun el grupo del alumno." /> },
      { path: 'examenes', element: <VistaPendiente titulo="Examenes alumno" descripcion="Ruta definida para examenes habilitados, respuestas y notas." /> },
    ],
  },
  { path: '/acceso-denegado', element: <AccesoDenegado /> },
  { path: '*', element: <NoEncontrado /> },
])

export default router
