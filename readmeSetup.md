# CUP — Sistema Académico y de Admisiones (Frontend)

Interfaz de usuario interactiva y panel administrativo para la gestión académica, control de asistencia, exámenes, notas, pagos y postulaciones del sistema CUP.

## Stack Tecnológico

| Capa / Integración | Tecnología / Librería | Puerto Dev / Detalle |
| ------------------ | --------------------- | -------------------- |
| Núcleo Frontend    | React 19 + Vite 8     | `:5173`              |
| Estilos y Layout   | Tailwind CSS v4       | —                    |
| Enrutador          | React Router DOM v7   | SPA Routing (CSR)    |
| Manejo de Estado   | TanStack React Query  | Caché y consultas    |
| Autenticación      | Firebase JS SDK v12   | Autenticación social |
| Pasarela de Pagos  | Stripe                | Pasarela de pagos    |
| Consumo API        | Axios                 | Comunicación Backend |
| Gráficos           | Recharts              | Dashboards           |

## Requisitos Previos

- [Node.js 20.x](https://nodejs.org/) o superior instalado
- [npm 10.x](https://www.npmjs.com/) o superior instalado (normalmente viene con Node.js)
- Git
- Un Backend funcional corriendo (generalmente una API REST de Laravel en `:8000` o la URL configurada en las variables de entorno)

## Setup Rápido

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd frontend_cup

# 2. Copiar y configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales de Firebase, Stripe y URL del Backend

# 3. Instalar las dependencias del proyecto
npm install

# 4. Iniciar el servidor local de desarrollo
npm run dev
```

## Acceso

- **Frontend (Servidor de Desarrollo):** http://localhost:5173
- **Backend API (Laravel):** http://localhost:8000/api (o el configurado en `VITE_API_URL`)
- **Consola de Firebase:** https://console.firebase.google.com (para configurar Google Auth y Firebase API keys)
- **Stripe Dashboard:** https://dashboard.stripe.com (para configurar llaves públicas de desarrollo)

## Estructura del Proyecto

```
frontend_cup/
├── public/             # Recursos estáticos (logos, favicons) servidos directamente
├── src/                # Código fuente de la aplicación
│   ├── app/            # Enrutador, proveedores globales y entrada (App.jsx, router.jsx, providers.jsx)
│   ├── assets/         # Imágenes, iconos y recursos multimedia locales
│   ├── components/     # Componentes compartidos y layouts (AdminLayout, AlumnoLayout, DocenteLayout)
│   ├── config/         # Configuraciones de API, Firebase y Stripe (stripe.config.js, firebase.config.js, etc.)
│   ├── hooks/          # React hooks personalizados compartidos
│   ├── lib/            # Clientes e instancias (Axios, Stripe)
│   ├── modules/        # Lógica de negocio dividida por módulos (admisión, notas, pagos, etc.)
│   ├── services/       # Peticiones e integración con las APIs del backend
│   └── styles/         # Estilos globales y directivas de Tailwind CSS (index.css)
├── .env                # Variables de entorno locales
├── .env.example        # Plantilla de variables de entorno del sistema
├── eslint.config.js    # Configuración de ESLint para calidad del código
├── package.json        # Configuración de scripts, dependencias y metadatos del proyecto
└── vite.config.js      # Configuración de compilación y plugins de Vite
```

## Módulos del Sistema

| Módulo | Descripción |
| --- | --- |
| **Auth** | Autenticación basada en Firebase, con redirección y protección de rutas por roles. |
| **Dashboard** | Paneles visuales e interactivos adaptados al rol de Administrador, Docente o Alumno. |
| **Usuarios** | Listado y administración del personal interno y usuarios de la plataforma. |
| **Postulantes** | Registro público de nuevos postulantes, edición de datos y visualización del perfil del aplicante. |
| **Requisitos** | Bandeja de control para revisar documentos cargados y validar requisitos académicos. |
| **Pagos** | Integración del frontend con Stripe para procesar matrículas o pagos de admisión (éxito/cancelado). |
| **Gestión Académica** | Registro de materias, asignaturas, planes de estudio y gestión administrativa. |
| **Docentes y Alumnos** | Listados de perfiles, consulta de cursos y generación automática de códigos. |
| **Horarios** | Calendario de horarios en tiempo real filtrados por perfil y rol de usuario. |
| **Asignaciones** | Herramienta administrativa para asignar materias y paralelos a los docentes. |
| **Asistencias** | Toma de asistencia diaria por parte de docentes y vista de porcentaje de asistencia del alumno. |
| **Exámenes** | Gestión de evaluaciones por parte de docentes y rendición interactiva por parte de alumnos. |
| **Notas** | Registro de calificaciones, ponderaciones y consulta de promedios para alumnos y docentes. |
| **Carga Masiva** | Importación ágil de datos de alumnos, docentes o materias mediante planillas. |
| **Reportes** | Módulo administrativo para la exportación y visualización de reportes del sistema. |

## Comandos Esenciales Frontend

```bash
# Iniciar servidor local de desarrollo con Hot Module Replacement (HMR)
npm run dev

# Compilar el proyecto optimizado para producción (carpeta dist/)
npm run build

# Analizar la calidad y formato del código con ESLint
npm run lint

# Previsualizar localmente la compilación de producción generada
npm run preview
```

## Solución de Problemas (Troubleshooting)

### Error al iniciar: `vite` no se reconoce como un comando interno o externo
Suele suceder si las dependencias no se instalaron correctamente o falta la carpeta `node_modules`.
```bash
# Limpiar instalaciones corruptas y volver a instalar
rm -rf node_modules package-lock.json
npm install
```

### Variables de entorno no cargadas en la UI (Firebase, API URL, Stripe)
Si agregas o modificas variables en el archivo `.env` mientras el servidor local está en ejecución, Vite no las recargará automáticamente en caliente.
**Solución:** Detén el servidor de desarrollo (`Ctrl + C` en la terminal) y ejecútalo de nuevo con `npm run dev`.

### Error de CORS al consumir la API del Backend
Las peticiones al backend fallan con errores de comunicación entre dominios.
**Solución:** Verifica que el backend (`backend_cup`) tenga habilitada la URL de origen del frontend (`http://localhost:5173`) en su archivo de configuración de CORS (por ejemplo, en Laravel CORS config).

## Licencia

Proyecto académico — Uso educativo. CUP.
