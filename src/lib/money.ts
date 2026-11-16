export const pesosToCentavos = (pesos: number) => Math.round(pesos * 100)

export const centavosToPesos = (centavos: number) => Math.round(centavos / 100)

export const peso = (centavos: number) => `₱${centavosToPesos(centavos).toLocaleString('en-PH')}`

export const compactPeso = (centavos: number) => {
  const pesos = centavosToPesos(centavos)
  if (pesos >= 1000) return `₱${(pesos / 1000).toFixed(pesos % 1000 === 0 ? 0 : 1)}k`
  return `₱${pesos}`
}
