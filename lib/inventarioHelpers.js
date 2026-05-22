export const TREND_MONTHS = 6

export const RELEVANT_PARTS = [
  { key: "filtro", nombre: "Filtro de aire", umbral: 3 },
  { key: "gas", nombre: "Gas refrigerante", umbral: 2 },
  { key: "capacitor", nombre: "Capacitor", umbral: 2 },
  { key: "correa", nombre: "Correa", umbral: 2 },
]

export function formatDate(value) {
  if (!value) return "Sin fecha"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "Sin fecha"
  return d.toLocaleDateString("es-UY")
}

export function formatDateTime(value) {
  if (!value) return "Sin fecha"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "Sin fecha"
  return d.toLocaleString("es-UY")
}

export function formatMonthLabel(date) {
  return date.toLocaleDateString("es-UY", { month: "short" })
}

export function parseCapacidad(value) {
  if (!value) return null
  const asNumber = Number(String(value).replace(/[^\d]/g, ""))
  return Number.isFinite(asNumber) ? asNumber : null
}

export function getCapacidadBucket(capacidadNum) {
  if (!capacidadNum) return "sin-dato"
  if (capacidadNum <= 12000) return "baja"
  if (capacidadNum <= 24000) return "media"
  return "alta"
}

export function getEstadoLabel(estado) {
  if (estado === "mantenimiento") return "En mantenimiento"
  if (estado === "atencion") return "Atencion"
  if (estado === "critico") return "Critico"
  return "Operativo"
}

export function getEstadoBadgeClass(estado) {
  if (estado === "mantenimiento") return "bg-[#fff3df] text-[#9f6c16]"
  if (estado === "atencion") return "bg-[#e9f1ff] text-[#2f69b0]"
  if (estado === "critico") return "bg-[#fdeeee] text-[#b44a4a]"
  return "bg-[#eaf7ef] text-[#2f7d4a]"
}

export function getPrioridadFromEstado(estado) {
  if (estado === "critico" || estado === "mantenimiento") return "critico"
  if (estado === "atencion") return "atencion"
  return "normal"
}

export function getPrioridadBadge(prioridad) {
  if (prioridad === "critico") return "bg-[#fdeeee] text-[#b44a4a]"
  if (prioridad === "atencion") return "bg-[#fff8e8] text-[#a97717]"
  return "bg-[#eaf7ef] text-[#2f7d4a]"
}

export function getRepuestoBadgeClass(status) {
  if (status === "critico") return "bg-[#fdeeee] text-[#b44a4a]"
  if (status === "bajo") return "bg-[#fff8e8] text-[#a97717]"
  return "bg-[#eaf7ef] text-[#2f7d4a]"
}

export function getMovimientoBadge(movimiento) {
  if (movimiento.tipo === "tramite") {
    if (movimiento.estadoTramite === "completado") return { label: "completado", cls: "bg-[#e8f6ee] text-[#2f7d4a]" }
    if (movimiento.estadoTramite === "cancelado") return { label: "cancelado", cls: "bg-[#fdeeee] text-[#b44a4a]" }
    if (movimiento.estadoTramite === "en_proceso") return { label: "en proceso", cls: "bg-[#e9f1ff] text-[#2f69b0]" }
    return { label: "pendiente", cls: "bg-[#fff8e8] text-[#a97717]" }
  }

  if (movimiento.tipo === "ingreso") return { label: "ingreso", cls: "bg-[#e8f6ee] text-[#2f7d4a]" }
  if (movimiento.tipo === "salida") return { label: "salida", cls: "bg-[#fdeeee] text-[#b44a4a]" }
  return { label: "ajuste", cls: "bg-[#fff8e8] text-[#a97717]" }
}

export function downloadTextFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
