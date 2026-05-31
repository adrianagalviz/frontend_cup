import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit, Power, PowerOff, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import AccionesTabla from '../../../components/tables/AccionesTabla'
import BadgeEstado from '../../../components/common/BadgeEstado'
import Boton from '../../../components/common/Boton'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import Input from '../../../components/common/Input'
import MensajeError from '../../../components/common/MensajeError'
import Modal from '../../../components/common/Modal'
import Select from '../../../components/common/Select'
import TablaBase from '../../../components/tables/TablaBase'
import PaginacionTabla from '../../../components/tables/PaginacionTabla'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import { cambiarEstadoUsuario, crearAdministrador, editarUsuario, listarUsuarios } from '../../../services/usuarios.service'
import { obtenerMensajeError } from '../../../lib/errores'
import FormularioAdministrador from '../components/FormularioAdministrador'

const rolesPermitidos = ['', 'administrador', 'docente', 'alumno']

function nombreCompleto(persona) {
  return [persona?.nombres, persona?.apellido_paterno, persona?.apellido_materno].filter(Boolean).join(' ') || 'Sin nombre'
}

export default function ListarUsuarios() {
  const queryClient = useQueryClient()
  const [pagina, setPagina] = useState(1)
  const [buscar, setBuscar] = useState('')
  const [filtros, setFiltros] = useState({ buscar: '', rol: '', estado: '' })
  const [modalAbierto, setModalAbierto] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState(null)
  const [usuarioEstado, setUsuarioEstado] = useState(null)
  const [mensajeError, setMensajeError] = useState('')

  const params = {
    pagina,
    por_pagina: 10,
    buscar: filtros.buscar || undefined,
    rol: filtros.rol || undefined,
    estado: filtros.estado || undefined,
  }

  const usuariosQuery = useQuery({
    queryKey: ['usuarios', params],
    queryFn: () => listarUsuarios(params),
  })

  const usuarios = usuariosQuery.data?.datos || []
  const meta = usuariosQuery.data?.meta || { pagina_actual: pagina, ultima_pagina: 1, total: usuarios.length }

  const invalidarUsuarios = () => queryClient.invalidateQueries({ queryKey: ['usuarios'] })

  const crearMutation = useMutation({
    mutationFn: crearAdministrador,
    onSuccess: () => {
      toast.success('Administrador creado correctamente.')
      setModalAbierto(false)
      setUsuarioEditando(null)
      invalidarUsuarios()
    },
    onError: (error) => setMensajeError(obtenerMensajeError(error)),
  })

  const editarMutation = useMutation({
    mutationFn: ({ id, payload }) => editarUsuario(id, payload),
    onSuccess: () => {
      toast.success('Usuario actualizado correctamente.')
      setModalAbierto(false)
      setUsuarioEditando(null)
      invalidarUsuarios()
    },
    onError: (error) => setMensajeError(obtenerMensajeError(error)),
  })

  const estadoMutation = useMutation({
    mutationFn: ({ id, activo }) => cambiarEstadoUsuario(id, { activo }),
    onSuccess: () => {
      toast.success('Estado de usuario actualizado correctamente.')
      setUsuarioEstado(null)
      invalidarUsuarios()
    },
    onError: (error) => setMensajeError(obtenerMensajeError(error)),
  })

  const columnas = useMemo(() => [
    {
      header: 'Usuario',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-950">{row.original.nombre_usuario}</p>
          <p className="text-xs text-slate-500">{nombreCompleto(row.original.persona)}</p>
        </div>
      ),
    },
    {
      header: 'Correo',
      cell: ({ row }) => row.original.persona?.correo || 'Sin correo',
    },
    {
      header: 'CI',
      cell: ({ row }) => row.original.persona?.cedula_identidad || 'Sin CI',
    },
    {
      header: 'Rol',
      cell: ({ row }) => <BadgeEstado estado={row.original.rol?.nombre} />,
    },
    {
      header: 'Estado',
      cell: ({ row }) => <BadgeEstado estado={row.original.activo ? 'activo' : 'inactivo'} />,
    },
    {
      header: 'Acciones',
      cell: ({ row }) => {
        const usuario = row.original

        return (
          <AccionesTabla>
            <Boton variante="secundario" className="min-h-9 px-3" onClick={() => abrirEdicion(usuario)}>
              <Edit className="h-4 w-4" />
            </Boton>
            <Boton variante={usuario.activo ? 'peligro' : 'secundario'} className="min-h-9 px-3" onClick={() => setUsuarioEstado(usuario)}>
              {usuario.activo ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
            </Boton>
          </AccionesTabla>
        )
      },
    },
  ], [])

  function aplicarFiltros(event) {
    event.preventDefault()
    setPagina(1)
    setFiltros((actuales) => ({ ...actuales, buscar }))
  }

  function actualizarFiltro(nombre, valor) {
    setPagina(1)
    setFiltros((actuales) => ({ ...actuales, [nombre]: valor }))
  }

  function abrirCreacion() {
    setMensajeError('')
    setUsuarioEditando(null)
    setModalAbierto(true)
  }

  function abrirEdicion(usuario) {
    setMensajeError('')
    setUsuarioEditando(usuario)
    setModalAbierto(true)
  }

  async function guardarUsuario(payload) {
    setMensajeError('')

    if (usuarioEditando) {
      await editarMutation.mutateAsync({ id: usuarioEditando.id, payload })
      return
    }

    await crearMutation.mutateAsync(payload)
  }

  const totalPaginas = Number(meta.ultima_pagina || 1)

  return (
    <div className="grid gap-5">
      <Breadcrumb items={['Administrador', 'Usuarios']} />
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Usuarios y administradores</h1>
          <p className="mt-1 text-sm text-slate-600">Listado conectado al backend Laravel con roles permitidos del sistema.</p>
        </div>
        <Boton onClick={abrirCreacion}>
          <Plus className="h-4 w-4" />
          Crear administrador
        </Boton>
      </div>

      {mensajeError ? <MensajeError mensaje={mensajeError} /> : null}
      {usuariosQuery.error ? <MensajeError mensaje={obtenerMensajeError(usuariosQuery.error)} /> : null}

      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <form className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]" onSubmit={aplicarFiltros}>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span>Buscar por nombre, correo o CI</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input className="pl-9" value={buscar} onChange={(event) => setBuscar(event.target.value)} placeholder="Nombre, correo, CI o usuario" />
            </div>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span>Rol</span>
            <Select value={filtros.rol} onChange={(event) => actualizarFiltro('rol', event.target.value)}>
              {rolesPermitidos.map((rol) => <option key={rol || 'todos'} value={rol}>{rol || 'Todos'}</option>)}
            </Select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span>Estado</span>
            <Select value={filtros.estado} onChange={(event) => actualizarFiltro('estado', event.target.value)}>
              <option value="">Todos</option>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </Select>
          </label>
          <div className="flex items-end">
            <Boton type="submit" className="w-full">Buscar</Boton>
          </div>
        </form>
      </section>

      <div>
        <TablaBase
          columnas={columnas}
          datos={usuarios}
          cargando={usuariosQuery.isLoading}
          mensajeVacio="No existen usuarios con los filtros seleccionados."
        />
        {usuarios.length ? (
          <PaginacionTabla
            pagina={Number(meta.pagina_actual || pagina)}
            totalPaginas={totalPaginas}
            onAnterior={() => setPagina((valor) => Math.max(1, valor - 1))}
            onSiguiente={() => setPagina((valor) => Math.min(totalPaginas, valor + 1))}
          />
        ) : null}
      </div>

      <Modal
        abierto={modalAbierto}
        titulo={usuarioEditando ? 'Editar usuario' : 'Crear administrador'}
        onCerrar={() => setModalAbierto(false)}
        acciones={<></>}
      >
        <FormularioAdministrador
          usuario={usuarioEditando}
          onGuardar={guardarUsuario}
          onCancelar={() => setModalAbierto(false)}
          cargando={crearMutation.isPending || editarMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        abierto={Boolean(usuarioEstado)}
        titulo={usuarioEstado?.activo ? 'Desactivar usuario' : 'Activar usuario'}
        mensaje={`Confirma cambiar el estado de ${usuarioEstado?.nombre_usuario || 'este usuario'}?`}
        onCancelar={() => setUsuarioEstado(null)}
        onConfirmar={() => estadoMutation.mutate({ id: usuarioEstado.id, activo: !usuarioEstado.activo })}
        cargando={estadoMutation.isPending}
      />
    </div>
  )
}
