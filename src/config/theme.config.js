export const PALETAS_VISUALES = {
  rosa: ['#fbe8f2', '#f4add1', '#e15394'],
  verde: ['#b8e2bc', '#64b474', '#1f5d30'],
  amarillo: ['#e6e6a9', '#e6e6a9', '#928b2d'],
  azul: ['#c8dfef', '#3983b1', '#224c6a'],
  lila: ['#224c6a', '#a06fdd', '#421b6a'],
  rojo: ['#f3aeaf', '#ab2538', '#691b2b'],
  gris: ['#d4d3d3', '#737171', '#1a1919'],
}

export const CONFIGURACION_VISUAL_DEFAULT = {
  paleta: 'azul',
  modo: 'claro',
}

export function normalizarConfiguracionVisual(configuracion) {
  const paleta = configuracion?.paleta && PALETAS_VISUALES[configuracion.paleta]
    ? configuracion.paleta
    : CONFIGURACION_VISUAL_DEFAULT.paleta
  const modo = configuracion?.modo === 'oscuro' ? 'oscuro' : CONFIGURACION_VISUAL_DEFAULT.modo

  return { paleta, modo }
}
