import { Navigate, createBrowserRouter } from 'react-router-dom'
import AdminLayout from '../components/layout/AdminLayout'
import AlumnoLayout from '../components/layout/AlumnoLayout'
import AuthLayout from '../components/layout/AuthLayout'
import DocenteLayout from '../components/layout/DocenteLayout'
import { RedireccionPorRol, RutaPorRol, RutaProtegida } from '../components/layout/RutasProtegidas'
import AdmisionFinal from '../modules/admision/pages/AdmisionFinal'
import DetalleAlumno from '../modules/alumnos/pages/DetalleAlumno'
import ListarAlumnos from '../modules/alumnos/pages/ListarAlumnos'
import AsistenciaAlumnos from '../modules/asistencia-alumnos/pages/AsistenciaAlumnos'
import AsistenciaDocente from '../modules/asistencia-docente/pages/AsistenciaDocente'
import GestionAsignaciones from '../modules/asignaciones/pages/GestionAsignaciones'
import AccesoDenegado from '../modules/shared/pages/AccesoDenegado'
import NoEncontrado from '../modules/shared/pages/NoEncontrado'
import DashboardAdministrador from '../modules/dashboard/pages/DashboardAdministrador'
import DashboardAlumno from '../modules/dashboard/pages/DashboardAlumno'
import DashboardDocente from '../modules/dashboard/pages/DashboardDocente'
import CargaMasiva from '../modules/carga-masiva/pages/CargaMasiva'
import CatalogosAcademicos from '../modules/catalogos-academicos/pages/CatalogosAcademicos'
import ListarDocentes from '../modules/docentes/pages/ListarDocentes'
import ExamenesAlumno from '../modules/examenes-alumno/pages/ExamenesAlumno'
import GestionExamenes from '../modules/examenes/pages/GestionExamenes'
import GestionAcademica from '../modules/gestion-academica/pages/GestionAcademica'
import HorariosPorRol from '../modules/horarios/pages/HorariosPorRol'
import Login from '../modules/auth/pages/Login'
import ListarPagos from '../modules/pagos/pages/ListarPagos'
import NotasPromedios from '../modules/notas/pages/NotasPromedios'
import PagoCancelado from '../modules/pagos/pages/PagoCancelado'
import PagoExitoso from '../modules/pagos/pages/PagoExitoso'
import PagoPostulante from '../modules/pagos/pages/PagoPostulante'
import PerfilAutenticado from '../modules/perfil/pages/PerfilAutenticado'
import DetallePostulante from '../modules/postulantes/pages/DetallePostulante'
import EditarPostulante from '../modules/postulantes/pages/EditarPostulante'
import ListarPostulantes from '../modules/postulantes/pages/ListarPostulantes'
import RegistroPostulante from '../modules/postulantes/pages/RegistroPostulante'
import GestionRequisitos from '../modules/requisitos/pages/GestionRequisitos'
import ReportesAdministrativos from '../modules/reportes/pages/ReportesAdministrativos'
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
      { path: 'requisitos', element: <GestionRequisitos /> },
      { path: 'pagos', element: <ListarPagos /> },
      { path: 'alumnos', element: <ListarAlumnos /> },
      { path: 'alumnos/:id', element: <DetalleAlumno /> },
      { path: 'gestion-academica', element: <GestionAcademica /> },
      { path: 'docentes', element: <ListarDocentes /> },
      { path: 'horarios', element: <CatalogosAcademicos /> },
      { path: 'asignaciones', element: <GestionAsignaciones /> },
      { path: 'asistencias', element: <AsistenciaDocente modo="admin" /> },
      { path: 'asistencias-alumnos', element: <AsistenciaAlumnos modo="admin" /> },
      { path: 'examenes', element: <GestionExamenes /> },
      { path: 'notas', element: <NotasPromedios modo="admin" /> },
      { path: 'admision', element: <AdmisionFinal /> },
      { path: 'reportes', element: <ReportesAdministrativos /> },
      { path: 'carga-masiva', element: <CargaMasiva /> },
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
      { path: 'asistencias', element: <AsistenciaDocente modo="docente" /> },
      { path: 'asistencia-alumnos', element: <AsistenciaAlumnos modo="docente" /> },
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
      { path: 'asistencias', element: <AsistenciaAlumnos modo="alumno" /> },
      { path: 'examenes', element: <ExamenesAlumno /> },
      { path: 'notas', element: <NotasPromedios modo="alumno" /> },
    ],
  },
  { path: '/acceso-denegado', element: <AccesoDenegado /> },
  { path: '*', element: <NoEncontrado /> },
])

export default router
