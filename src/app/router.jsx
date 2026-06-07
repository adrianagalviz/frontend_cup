import { Navigate, createBrowserRouter } from 'react-router-dom'
import AdminLayout from '../components/layout/AdminLayout'
import AlumnoLayout from '../components/layout/AlumnoLayout'
import AuthLayout from '../components/layout/AuthLayout'
import DocenteLayout from '../components/layout/DocenteLayout'
import { RedireccionPorRol, RutaPorRol, RutaProtegida } from '../components/layout/RutasProtegidas'
import GestionAsignaciones from '../modules/asignaciones/pages/GestionAsignaciones'
import AccesoDenegado from '../modules/shared/pages/AccesoDenegado'
import NoEncontrado from '../modules/shared/pages/NoEncontrado'
import DashboardAdministrador from '../modules/dashboard/pages/DashboardAdministrador'
import DashboardAlumno from '../modules/dashboard/pages/DashboardAlumno'
import DashboardDocente from '../modules/dashboard/pages/DashboardDocente'
import CatalogosAcademicos from '../modules/catalogos-academicos/pages/CatalogosAcademicos'
import ListarDocentes from '../modules/docentes/pages/ListarDocentes'
import GestionAcademica from '../modules/gestion-academica/pages/GestionAcademica'
import HorariosPorRol from '../modules/horarios/pages/HorariosPorRol'
import Login from '../modules/auth/pages/Login'
import ListarPagos from '../modules/pagos/pages/ListarPagos'
import PagoCancelado from '../modules/pagos/pages/PagoCancelado'
import PagoExitoso from '../modules/pagos/pages/PagoExitoso'
import PagoPostulante from '../modules/pagos/pages/PagoPostulante'
import PerfilAutenticado from '../modules/perfil/pages/PerfilAutenticado'
import DetallePostulante from '../modules/postulantes/pages/DetallePostulante'
import EditarPostulante from '../modules/postulantes/pages/EditarPostulante'
import ListarPostulantes from '../modules/postulantes/pages/ListarPostulantes'
import RegistroPostulante from '../modules/postulantes/pages/RegistroPostulante'
import VistaPendiente from '../modules/shared/pages/VistaPendiente'
import ListarUsuarios from '../modules/usuarios/pages/ListarUsuarios'

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
      { path: '/pagos/postulante/:id', element: <PagoPostulante /> },
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
      { path: 'usuarios', element: <ListarUsuarios /> },
      { path: 'postulantes/registro', element: <RegistroPostulante /> },
      { path: 'postulantes', element: <ListarPostulantes /> },
      { path: 'postulantes/:id', element: <DetallePostulante /> },
      { path: 'postulantes/:id/editar', element: <EditarPostulante /> },
      { path: 'requisitos', element: <VistaPendiente titulo="Requisitos" descripcion="Modulo administrativo definido para revisar documentos y validar requisitos." /> },
      { path: 'pagos', element: <ListarPagos /> },
      { path: 'alumnos', element: <VistaPendiente titulo="Alumnos" descripcion="Modulo administrativo definido para consultar alumnos y codigos automaticos." /> },
      { path: 'gestion-academica', element: <GestionAcademica /> },
      { path: 'docentes', element: <ListarDocentes /> },
      { path: 'horarios', element: <CatalogosAcademicos /> },
      { path: 'asignaciones', element: <GestionAsignaciones /> },
      { path: 'asistencias', element: <VistaPendiente titulo="Asistencias" descripcion="Modulo administrativo definido para asistencia docente y asistencia de alumnos." /> },
      { path: 'examenes', element: <VistaPendiente titulo="Examenes" descripcion="Modulo administrativo definido para examenes, preguntas y opciones." /> },
      { path: 'notas', element: <VistaPendiente titulo="Notas y promedios" descripcion="Modulo administrativo definido para notas, promedios y estado final." /> },
      { path: 'admision', element: <VistaPendiente titulo="Admision final" descripcion="Modulo administrativo definido para asignacion final de carrera por mayor nota y cupos." /> },
      { path: 'reportes', element: <VistaPendiente titulo="Reportes" descripcion="Modulo administrativo definido para reportes, PDF, Excel y comandos de voz." /> },
      { path: 'carga-masiva', element: <VistaPendiente titulo="Carga masiva" descripcion="Modulo administrativo definido para archivos Excel o CSV." /> },
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
      { path: 'horarios', element: <HorariosPorRol rol="docente" /> },
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
      { path: 'horarios', element: <HorariosPorRol rol="alumno" /> },
      { path: 'examenes', element: <VistaPendiente titulo="Examenes alumno" descripcion="Ruta definida para examenes habilitados, respuestas y notas." /> },
    ],
  },
  { path: '/acceso-denegado', element: <AccesoDenegado /> },
  { path: '*', element: <NoEncontrado /> },
])

export default router
