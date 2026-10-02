export function boton(botones, id) {
  if (!Array.isArray(botones)) return null
  return botones.find((item) => item?.id === id) || null
}
