import Boton from './Boton'
import Modal from './Modal'

export default function ConfirmDialog({
  abierto,
  titulo = 'Confirmar accion',
  mensaje,
  onCancelar,
  onConfirmar,
  cargando = false,
}) {
  return (
    <Modal
      abierto={abierto}
      titulo={titulo}
      onCerrar={onCancelar}
      acciones={(
        <>
          <Boton variante="secundario" onClick={onCancelar}>Cancelar</Boton>
          <Boton variante="peligro" cargando={cargando} onClick={onConfirmar}>Confirmar</Boton>
        </>
      )}
    >
      <p>{mensaje}</p>
    </Modal>
  )
}

