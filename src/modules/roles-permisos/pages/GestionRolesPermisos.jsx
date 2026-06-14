import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit, LockKeyhole, Plus, Power, PowerOff, Save, ShieldCheck, X } from 'lucide-react'
import { toast } from 'sonner'
import BadgeEstado from '../../../components/common/BadgeEstado'
import Boton from '../../../components/common/Boton'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import Input from '../../../components/common/Input'
import MensajeError from '../../../components/common/MensajeError'
import Modal from '../../../components/common/Modal'
import Textarea from '../../../components/common/Textarea'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import { cambiarEstadoRol, crearRol, editarRol, listarRolesPermisos } from '../../../services/rolesPermisos.service'
import { obtenerMensajeError } from '../../../lib/errores'

const formularioInicial = {
  nombre: '',
  descripcion: '',
  activo: true,
  permisos: [],
}

function agruparPermisos(permisos) {
  return permisos.reduce((grupos, permiso) => {
    const categoria = permiso.categoria || 'General'
    return {
      ...grupos,
      [categoria]: [...(grupos[categoria] || []), permiso],
    }
  }, {})
}

function normalizarNombreRol(valor) {
  return valor
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

export default function GestionRolesPermisos() {
  const queryClient = useQueryClient()
  const [rolSeleccionadoId, setRolSeleccionadoId] = useState(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [rolEditando, setRolEditando] = useState(null)
  const [rolEstado, setRolEstado] = useState(null)
  const [formulario, setFormulario] = useState(formularioInicial)
  const [mensajeError, setMensajeError] = useState('')

  const rolesQuery = useQuery({
    queryKey: ['roles-permisos'],
    queryFn: listarRolesPermisos,
  })

  const roles = useMemo(() => rolesQuery.data?.roles || [], [rolesQuery.data])
  const permisos = useMemo(() => rolesQuery.data?.permisos || [], [rolesQuery.data])
  const permisosPorCategoria = useMemo(() => agruparPermisos(permisos), [permisos])
  const rolSeleccionado = roles.find((rol) => rol.id === rolSeleccionadoId) || roles[0]
  const permisosSeleccionados = new Set(rolSeleccionado?.permisos_ids || [])

  const invalidarRoles = () => queryClient.invalidateQueries({ queryKey: ['roles-permisos'] })

  const guardarMutation = useMutation({
    mutationFn: ({ id, payload }) => (id ? editarRol(id, payload) : crearRol(payload)),
    onSuccess: () => {
      toast.success(rolEditando ? 'Rol actualizado correctamente.' : 'Rol creado correctamente.')
      setModalAbierto(false)
      setRolEditando(null)
      setFormulario(formularioInicial)
      invalidarRoles()
    },
    onError: (error) => setMensajeError(obtenerMensajeError(error)),
  })

  const estadoMutation = useMutation({
    mutationFn: ({ id, activo }) => cambiarEstadoRol(id, { activo }),
    onSuccess: () => {
      toast.success('Estado de rol actualizado correctamente.')
      setRolEstado(null)
      invalidarRoles()
    },
    onError: (error) => setMensajeError(obtenerMensajeError(error)),
  })

  function abrirCreacion() {
    setMensajeError('')
    setRolEditando(null)
    setFormulario(formularioInicial)
    setModalAbierto(true)
  }

  function abrirEdicion(rol) {
    setMensajeError('')
    setRolEditando(rol)
    setFormulario({
      nombre: rol.nombre,
      descripcion: rol.descripcion || '',
      activo: rol.activo,
      permisos: rol.permisos_ids || [],
    })
    setModalAbierto(true)
  }

  function actualizarFormulario(campo, valor) {
    setFormulario((actual) => ({
      ...actual,
      [campo]: campo === 'nombre' ? normalizarNombreRol(valor) : valor,
    }))
  }

  function alternarPermiso(permisoId) {
    setFormulario((actual) => {
      const permisosActuales = new Set(actual.permisos)

      if (permisosActuales.has(permisoId)) {
        permisosActuales.delete(permisoId)
      } else {
        permisosActuales.add(permisoId)
      }

      return { ...actual, permisos: Array.from(permisosActuales) }
    })
  }

  function guardarRol(event) {
    event.preventDefault()
    setMensajeError('')

    guardarMutation.mutate({
      id: rolEditando?.id,
      payload: {
        nombre: formulario.nombre,
        descripcion: formulario.descripcion || null,
        activo: formulario.activo,
        permisos: formulario.permisos,
      },
    })
  }

  const esAdministradorEditando = rolEditando?.nombre === 'administrador'

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Administrador', 'Roles y permisos']} />
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Roles y permisos</h1>
          <p className="mt-1 text-sm text-slate-600">Administracion de accesos por rol del sistema.</p>
        </div>
        <Boton onClick={abrirCreacion}>
          <Plus className="h-4 w-4" />
          Crear rol
        </Boton>
      </div>

      {mensajeError ? <MensajeError mensaje={mensajeError} /> : null}
      {rolesQuery.error ? <MensajeError mensaje={obtenerMensajeError(rolesQuery.error)} /> : null}

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <section className="rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-base font-semibold text-slate-950">Roles</h2>
          </div>
          <div className="grid gap-2 p-3">
            {rolesQuery.isLoading ? (
              <p className="px-2 py-3 text-sm text-slate-500">Cargando roles...</p>
            ) : null}
            {roles.map((rol) => {
              const activo = rolSeleccionado?.id === rol.id

              return (
                <button
                  key={rol.id}
                  type="button"
                  onClick={() => setRolSeleccionadoId(rol.id)}
                  className={`rounded-md border p-3 text-left transition ${
                    activo ? 'border-sky-600 bg-sky-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-words text-sm font-bold text-slate-950">{rol.nombre}</p>
                        {rol.base ? <BadgeEstado estado="base" /> : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{rol.descripcion || 'Sin descripcion'}</p>
                    </div>
                    <BadgeEstado estado={rol.activo ? 'activo' : 'inactivo'} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>{rol.usuarios_count ?? 0} usuarios</span>
                    <span>{rol.permisos_ids?.length || 0} permisos</span>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white shadow-sm">
          {rolSeleccionado ? (
            <>
              <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-sky-700" />
                    <h2 className="text-lg font-semibold text-slate-950">{rolSeleccionado.nombre}</h2>
                    <BadgeEstado estado={rolSeleccionado.activo ? 'activo' : 'inactivo'} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{rolSeleccionado.descripcion || 'Sin descripcion'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Boton variante="secundario" onClick={() => abrirEdicion(rolSeleccionado)}>
                    <Edit className="h-4 w-4" />
                    Editar
                  </Boton>
                  <Boton
                    variante={rolSeleccionado.activo ? 'peligro' : 'secundario'}
                    disabled={rolSeleccionado.nombre === 'administrador'}
                    onClick={() => setRolEstado(rolSeleccionado)}
                  >
                    {rolSeleccionado.activo ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                    {rolSeleccionado.activo ? 'Desactivar' : 'Activar'}
                  </Boton>
                </div>
              </div>

              <div className="grid gap-4 p-4">
                {Object.entries(permisosPorCategoria).map(([categoria, items]) => (
                  <div key={categoria} className="rounded-md border border-slate-200">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                      <h3 className="text-sm font-bold text-slate-800">{categoria}</h3>
                    </div>
                    <div className="grid gap-0 divide-y divide-slate-100">
                      {items.map((permiso) => {
                        const permitido = permisosSeleccionados.has(permiso.id)

                        return (
                          <div key={permiso.id} className="flex items-start gap-3 px-4 py-3">
                            <span
                              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border ${
                                permitido ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'
                              }`}
                            >
                              {permitido ? <Save className="h-3 w-3" /> : null}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-950">{permiso.nombre}</p>
                              <p className="text-xs text-slate-500">{permiso.descripcion}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="p-4 text-sm text-slate-500">No existen roles registrados.</p>
          )}
        </section>
      </div>

      <Modal
        abierto={modalAbierto}
        titulo={rolEditando ? 'Editar rol' : 'Crear rol'}
        onCerrar={() => setModalAbierto(false)}
        className="max-w-4xl"
        acciones={<></>}
      >
        <form className="grid gap-5" onSubmit={guardarRol}>
          <div className="grid gap-4 md:grid-cols-[1fr_160px]">
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              <span>Nombre</span>
              <Input
                value={formulario.nombre}
                onChange={(event) => actualizarFormulario('nombre', event.target.value)}
                disabled={Boolean(rolEditando?.base)}
                placeholder="coordinador"
                required
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              <span>Estado</span>
              <select
                className="min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                value={String(formulario.activo)}
                disabled={esAdministradorEditando}
                onChange={(event) => actualizarFormulario('activo', event.target.value === 'true')}
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </label>
          </div>

          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span>Descripcion</span>
            <Textarea
              rows={3}
              value={formulario.descripcion}
              onChange={(event) => actualizarFormulario('descripcion', event.target.value)}
              placeholder="Responsabilidad principal del rol"
            />
          </label>

          <div className="grid gap-4">
            <div className="flex items-center gap-2">
              <LockKeyhole className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-950">Permisos</h3>
            </div>
            {esAdministradorEditando ? (
              <MensajeError mensaje="El rol administrador conserva acceso total al sistema." />
            ) : null}
            {Object.entries(permisosPorCategoria).map(([categoria, items]) => (
              <div key={categoria} className="rounded-md border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <h4 className="text-sm font-bold text-slate-800">{categoria}</h4>
                </div>
                <div className="grid gap-0 divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0">
                  {items.map((permiso) => {
                    const seleccionado = esAdministradorEditando || formulario.permisos.includes(permiso.id)

                    return (
                      <label key={permiso.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-600"
                          checked={seleccionado}
                          disabled={esAdministradorEditando}
                          onChange={() => alternarPermiso(permiso.id)}
                        />
                        <span>
                          <span className="block font-semibold text-slate-950">{permiso.nombre}</span>
                          <span className="block text-xs text-slate-500">{permiso.descripcion}</span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col-reverse justify-end gap-2 border-t border-slate-200 pt-4 sm:flex-row">
            <Boton variante="secundario" type="button" onClick={() => setModalAbierto(false)}>
              <X className="h-4 w-4" />
              Cancelar
            </Boton>
            <Boton type="submit" cargando={guardarMutation.isPending}>
              <Save className="h-4 w-4" />
              Guardar
            </Boton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        abierto={Boolean(rolEstado)}
        titulo={rolEstado?.activo ? 'Desactivar rol' : 'Activar rol'}
        mensaje={`Confirma cambiar el estado del rol ${rolEstado?.nombre || ''}?`}
        onCancelar={() => setRolEstado(null)}
        onConfirmar={() => estadoMutation.mutate({ id: rolEstado.id, activo: !rolEstado.activo })}
        cargando={estadoMutation.isPending}
      />
    </div>
  )
}
