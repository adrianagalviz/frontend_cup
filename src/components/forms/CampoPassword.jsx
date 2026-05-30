import CampoTexto from './CampoTexto'

export default function CampoPassword(props) {
  return <CampoTexto type="password" autoComplete="current-password" {...props} />
}

