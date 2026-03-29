"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

const ESTADO_STORAGE_KEY = "powercool.equipos.estadoOverrides.v1"
const TREND_MONTHS = 6

const RELEVANT_PARTS = [
  { key: "filtro", nombre: "Filtro de aire", umbral: 3 },
  { key: "gas", nombre: "Gas refrigerante", umbral: 2 },
  { key: "capacitor", nombre: "Capacitor", umbral: 2 },
  { key: "correa", nombre: "Correa", umbral: 2 },
]

function formatDate(value) {
  if (!value) return "Sin fecha"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "Sin fecha"
  return d.toLocaleDateString("es-UY")
}

function formatMonthLabel(date) {
  return date.toLocaleDateString("es-UY", { month: "short" })
}

function parseCapacidad(value) {
  if (!value) return null
  const asNumber = Number(String(value).replace(/[^\d]/g, ""))
  return Number.isFinite(asNumber) ? asNumber : null
}

function getCapacidadBucket(capacidadNum) {
  if (!capacidadNum) return "sin-dato"
  if (capacidadNum <= 12000) return "baja"
  if (capacidadNum <= 24000) return "media"
  return "alta"
}

function getEstadoLabel(estado) {
  if (estado === "mantenimiento") return "En mantenimiento"
  if (estado === "atencion") return "Atencion"
  if (estado === "critico") return "Critico"
  return "Operativo"
}

function getEstadoBadgeClass(estado) {
  if (estado === "mantenimiento") return "bg-[#fff3df] text-[#9f6c16]"
  if (estado === "atencion") return "bg-[#e9f1ff] text-[#2f69b0]"
  if (estado === "critico") return "bg-[#fdeeee] text-[#b44a4a]"
  return "bg-[#eaf7ef] text-[#2f7d4a]"
}

function getPrioridadFromEstado(estado) {
  if (estado === "critico" || estado === "mantenimiento") return "critico"
  if (estado === "atencion") return "atencion"
  return "normal"
}

function getPrioridadBadge(prioridad) {
  if (prioridad === "critico") return "bg-[#fdeeee] text-[#b44a4a]"
  if (prioridad === "atencion") return "bg-[#fff8e8] text-[#a97717]"
  return "bg-[#eaf7ef] text-[#2f7d4a]"
}

function getRepuestoBadgeClass(status) {
  if (status === "critico") return "bg-[#fdeeee] text-[#b44a4a]"
  if (status === "bajo") return "bg-[#fff8e8] text-[#a97717]"
  return "bg-[#eaf7ef] text-[#2f7d4a]"
}

function getMovimientoBadge(movimiento) {
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

function downloadTextFile(content, fileName, mimeType) {
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

export default function Equipos() {
  const [equipos, setEquipos] = useState([])
  const [tramites, setTramites] = useState([])
  const [repuestosDb, setRepuestosDb] = useState([])
  const [movimientosRepuestosDb, setMovimientosRepuestosDb] = useState([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [tipoFilter, setTipoFilter] = useState("todos")
  const [ubicacionFilter, setUbicacionFilter] = useState("todas")
  const [capacidadFilter, setCapacidadFilter] = useState("todas")
  const [estadoFilter, setEstadoFilter] = useState("todos")
  const [prioridadFilter, setPrioridadFilter] = useState("todas")
  const [minStockThreshold, setMinStockThreshold] = useState(2)
  const [estadoOverrides, setEstadoOverrides] = useState({})
  const [dbColumnsAvailable, setDbColumnsAvailable] = useState(true)
  const [repuestosSchemaAvailable, setRepuestosSchemaAvailable] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [inventoryView, setInventoryView] = useState("equipos")
  const [inventoryEquiposFilter, setInventoryEquiposFilter] = useState("todos")
  const [inventoryRepuestosFilter, setInventoryRepuestosFilter] = useState("todos")
  const [updatingTramiteId, setUpdatingTramiteId] = useState(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = window.localStorage.getItem(ESTADO_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        setEstadoOverrides(parsed && typeof parsed === "object" ? parsed : {})
      }
    } catch (error) {
      console.error("No se pudo leer estado local de equipos", error)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      window.localStorage.setItem(ESTADO_STORAGE_KEY, JSON.stringify(estadoOverrides))
    } catch (error) {
      console.error("No se pudo guardar estado local de equipos", error)
    }
  }, [estadoOverrides])

  const cargarEquipos = async () => {
    setLoading(true)

    try {
      const [equiposRes, tramitesOrdered, schemaProbe, repuestosRes, movimientosRepuestosOrdered] = await Promise.all([
        supabase.from("equipos").select("*"),
        supabase
          .from("tramites")
          .select("*")
          .not("equipo_id", "is", null)
          .order("created_at", { ascending: false }),
        supabase.from("equipos").select("id, estado_operativo, prioridad").limit(1),
        supabase.from("repuestos").select("*"),
        supabase.from("movimientos_repuestos").select("*").order("created_at", { ascending: false }),
      ])

      let tramitesRes = tramitesOrdered
      if (tramitesOrdered.error) {
        tramitesRes = await supabase
          .from("tramites")
          .select("*")
          .not("equipo_id", "is", null)
      }

      let movRepuestosRes = movimientosRepuestosOrdered
      if (movimientosRepuestosOrdered.error) {
        movRepuestosRes = await supabase.from("movimientos_repuestos").select("*")
      }

      setEquipos(equiposRes.data || [])
      setTramites(tramitesRes.data || [])
      setDbColumnsAvailable(!schemaProbe.error)
      setRepuestosDb(repuestosRes.error ? [] : (repuestosRes.data || []))
      setMovimientosRepuestosDb(movRepuestosRes.error ? [] : (movRepuestosRes.data || []))
      setRepuestosSchemaAvailable(!repuestosRes.error)
    } catch (error) {
      console.error("Error cargando inventario", error)
      setEquipos([])
      setTramites([])
      setRepuestosDb([])
      setMovimientosRepuestosDb([])
      setDbColumnsAvailable(false)
      setRepuestosSchemaAvailable(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarEquipos()
  }, [])

  const tramitesByEquipo = useMemo(() => {
    return tramites.reduce((acc, tramite) => {
      const key = String(tramite.equipo_id || "")
      if (!key) return acc
      if (!acc[key]) acc[key] = []
      acc[key].push(tramite)
      return acc
    }, {})
  }, [tramites])

  const equiposEnriquecidos = useMemo(() => {
    return equipos.map((equipo) => {
      const key = String(equipo.id)
      const list = tramitesByEquipo[key] || []

      let estadoOperativo = "operativo"
      if (equipo.estado_operativo) {
        estadoOperativo = equipo.estado_operativo
      } else if (estadoOverrides[key]) {
        estadoOperativo = estadoOverrides[key]
      } else if (list.some((t) => t.estado === "en_proceso")) {
        estadoOperativo = "mantenimiento"
      } else if (list.some((t) => t.estado === "pendiente")) {
        estadoOperativo = "atencion"
      }

      const capacidadNum = parseCapacidad(equipo.capacidad)
      const prioridad = equipo.prioridad || getPrioridadFromEstado(estadoOperativo)

      const proximo = [...list]
        .filter((t) => t.estado === "pendiente" || t.estado === "en_proceso")
        .sort((a, b) => new Date(a.fecha_programada || a.created_at || 0) - new Date(b.fecha_programada || b.created_at || 0))[0]

      const ultimo = [...list]
        .filter((t) => t.estado === "completado")
        .sort((a, b) => new Date(b.fecha_programada || b.created_at || 0) - new Date(a.fecha_programada || a.created_at || 0))[0]

      return {
        ...equipo,
        estadoOperativo,
        prioridad,
        capacidadNum,
        capacidadBucket: getCapacidadBucket(capacidadNum),
        proximo,
        ultimo,
      }
    })
  }, [equipos, tramitesByEquipo, estadoOverrides])

  const tiposDisponibles = useMemo(() => {
    return Array.from(new Set(equiposEnriquecidos.map((e) => (e.tipo || "split").toLowerCase())))
  }, [equiposEnriquecidos])

  const ubicacionesDisponibles = useMemo(() => {
    return Array.from(new Set(equiposEnriquecidos.map((e) => e.ubicacion || "Sin ubicación")))
  }, [equiposEnriquecidos])

  const movimientosReales = useMemo(() => {
    const events = []

    const repuestosById = repuestosDb.reduce((acc, repuesto) => {
      acc[String(repuesto.id)] = repuesto
      return acc
    }, {})

    for (const equipo of equiposEnriquecidos) {
      if (equipo.created_at) {
        events.push({
          id: `ing-${equipo.id}`,
          tipo: "ingreso",
          detalle: `Alta de ${equipo.marca || "Equipo"} ${equipo.modelo || ""}`,
          motivo: "Ingreso al inventario",
          usuario: "Sistema",
          referencia: `EQ-${equipo.id}`,
          date: equipo.created_at,
        })
      }
    }

    for (const tramite of tramites) {
      const baseDate = tramite.fecha_programada || tramite.created_at
      events.push({
        id: `tr-${tramite.id}`,
        tipo: "tramite",
        estadoTramite: tramite.estado || "pendiente",
        detalle: `${tramite.tipo === "abono" ? "Abono" : "Mantenimiento"}`,
        motivo: tramite.descripcion || "Movimiento asociado a tramite",
        usuario: tramite.usuario || tramite.tecnico || "Sistema",
        referencia: `TR-${tramite.id}`,
        date: baseDate,
      })
    }

    for (const mov of movimientosRepuestosDb) {
      const repuesto = repuestosById[String(mov.repuesto_id)]
      const repuestoNombre = repuesto?.nombre || "Repuesto"
      const repuestoCodigo = repuesto?.codigo ? `(${repuesto.codigo})` : ""
      const date = mov.fecha_movimiento || mov.created_at

      events.push({
        id: `rep-${mov.id}`,
        tipo: mov.tipo || "ajuste",
        detalle: `Repuesto ${repuestoNombre} ${repuestoCodigo}`,
        motivo: mov.motivo || "Movimiento de repuesto",
        usuario: mov.usuario || "Sistema",
        referencia: mov.referencia_id ? `${mov.referencia_tipo || "manual"}-${mov.referencia_id}` : (mov.referencia_tipo || "manual"),
        date,
      })
    }

    return events
      .filter((e) => e.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [equiposEnriquecidos, tramites, movimientosRepuestosDb, repuestosDb])

  const inventoryMovements = useMemo(() => movimientosReales.slice(0, 8), [movimientosReales])

  const upcomingMaintenances = useMemo(() => {
    return equiposEnriquecidos
      .filter((e) => e.proximo)
      .sort(
        (a, b) =>
          new Date(a.proximo?.fecha_programada || a.proximo?.created_at || 0) -
          new Date(b.proximo?.fecha_programada || b.proximo?.created_at || 0)
      )
      .slice(0, 6)
  }, [equiposEnriquecidos])

  const modelStock = useMemo(() => {
    const grouped = {}
    for (const e of equiposEnriquecidos) {
      const modeloKey = `${e.marca || "Sin marca"} ${e.modelo || "Sin modelo"}`.trim()
      if (!grouped[modeloKey]) grouped[modeloKey] = { modeloKey, total: 0 }
      grouped[modeloKey].total += 1
    }
    return Object.values(grouped).sort((a, b) => a.total - b.total)
  }, [equiposEnriquecidos])

  const stockAlerts = useMemo(() => {
    return modelStock.filter((m) => m.total <= Number(minStockThreshold || 0))
  }, [modelStock, minStockThreshold])

  const repuestosInventario = useMemo(() => {
    if (repuestosSchemaAvailable && repuestosDb.length > 0) {
      return repuestosDb.map((rep) => {
        const relatedMovs = movimientosRepuestosDb.filter((m) => String(m.repuesto_id) === String(rep.id))
        const demand = relatedMovs.filter((m) => m.tipo === "salida").length
        const ultimoUso = [...relatedMovs]
          .map((m) => m.fecha_movimiento || m.created_at)
          .filter(Boolean)
          .sort((a, b) => new Date(b) - new Date(a))[0]

        const stockActual = Number(rep.stock_actual || 0)
        const stockMinimo = Number(rep.stock_minimo || minStockThreshold || 0)
        const status = stockActual <= 1 ? "critico" : stockActual <= stockMinimo ? "bajo" : "ok"

        return {
          key: String(rep.id),
          nombre: rep.nombre || "Repuesto",
          demand,
          estimatedStock: stockActual,
          status,
          ultimoUso,
        }
      })
    }

    return RELEVANT_PARTS.map((part) => {
      const matching = tramites.filter((t) => String(t.descripcion || "").toLowerCase().includes(part.key))
      const demand = matching.length
      const ultimoUso = matching
        .map((t) => t.fecha_programada || t.created_at)
        .filter(Boolean)
        .sort((a, b) => new Date(b) - new Date(a))[0]

      const estimatedStock = Math.max(0, 12 - demand * 2)
      const status = estimatedStock <= 1 ? "critico" : estimatedStock <= Number(minStockThreshold || 0) ? "bajo" : "ok"

      return {
        ...part,
        nombre: part.nombre,
        demand,
        estimatedStock,
        status,
        ultimoUso,
      }
    })
  }, [tramites, minStockThreshold, repuestosSchemaAvailable, repuestosDb, movimientosRepuestosDb])

  const repuestosCriticos = useMemo(() => {
    return repuestosInventario
      .filter((item) => item.status === "critico" || item.status === "bajo")
      .map((item) => ({ nombre: item.nombre, demand: item.demand }))
  }, [repuestosInventario])

  const depositoSummary = useMemo(() => {
    const grouped = {}

    for (const e of equiposEnriquecidos) {
      const key = e.ubicacion || "Sin ubicación"
      if (!grouped[key]) {
        grouped[key] = {
          deposito: key,
          total: 0,
          criticos: 0,
          enMantenimiento: 0,
          operativos: 0,
        }
      }

      grouped[key].total += 1

      if (e.estadoOperativo === "critico") grouped[key].criticos += 1
      if (e.estadoOperativo === "mantenimiento") grouped[key].enMantenimiento += 1
      if (e.estadoOperativo === "operativo") grouped[key].operativos += 1
    }

    return Object.values(grouped).sort((a, b) => b.total - a.total)
  }, [equiposEnriquecidos])

  const trendData = useMemo(() => {
    const months = []
    const now = new Date()

    for (let i = TREND_MONTHS - 1; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        key: `${d.getFullYear()}-${d.getMonth() + 1}`,
        month: d,
        ingresos: 0,
        salidas: 0,
      })
    }

    const monthIndex = months.reduce((acc, m, idx) => {
      acc[m.key] = idx
      return acc
    }, {})

    for (const mov of movimientosReales) {
      if (mov.tipo !== "ingreso" && mov.tipo !== "salida") continue
      const date = new Date(mov.date)
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`
      const idx = monthIndex[key]
      if (idx === undefined) continue
      if (mov.tipo === "ingreso") months[idx].ingresos += 1
      if (mov.tipo === "salida") months[idx].salidas += 1
    }

    return months
  }, [movimientosReales])

  const maxTrendValue = useMemo(() => {
    const all = trendData.flatMap((m) => [m.ingresos, m.salidas])
    const max = Math.max(...all, 1)
    return max
  }, [trendData])

  const rotacion = useMemo(() => {
    const totalSalidas = trendData.reduce((acc, month) => acc + month.salidas, 0)
    const base = Math.max(equiposEnriquecidos.length, 1)
    return (totalSalidas / base).toFixed(2)
  }, [trendData, equiposEnriquecidos.length])

  const filtrados = useMemo(() => {
    const term = search.trim().toLowerCase()

    return equiposEnriquecidos.filter((e) => {
      const bySearch =
        !term ||
        `${e.marca || ""} ${e.modelo || ""} ${e.ubicacion || ""} ${e.id || ""}`.toLowerCase().includes(term)

      const byTipo = tipoFilter === "todos" ? true : (e.tipo || "split").toLowerCase() === tipoFilter
      const byUbicacion = ubicacionFilter === "todas" ? true : (e.ubicacion || "Sin ubicación") === ubicacionFilter
      const byEstado = estadoFilter === "todos" ? true : e.estadoOperativo === estadoFilter
      const byPrioridad = prioridadFilter === "todas" ? true : e.prioridad === prioridadFilter

      let byCapacidad = true
      if (capacidadFilter === "baja") byCapacidad = e.capacidadBucket === "baja"
      if (capacidadFilter === "media") byCapacidad = e.capacidadBucket === "media"
      if (capacidadFilter === "alta") byCapacidad = e.capacidadBucket === "alta"
      if (capacidadFilter === "sin-dato") byCapacidad = e.capacidadBucket === "sin-dato"

      return bySearch && byTipo && byUbicacion && byEstado && byPrioridad && byCapacidad
    })
  }, [equiposEnriquecidos, search, tipoFilter, ubicacionFilter, capacidadFilter, estadoFilter, prioridadFilter])

  const inventarioEquiposFiltrados = useMemo(() => {
    if (inventoryEquiposFilter === "critico") {
      return filtrados.filter((e) => e.estadoOperativo === "critico" || e.prioridad === "critico")
    }
    if (inventoryEquiposFilter === "mantenimiento") {
      return filtrados.filter((e) => e.estadoOperativo === "mantenimiento")
    }
    if (inventoryEquiposFilter === "atencion") {
      return filtrados.filter((e) => e.estadoOperativo === "atencion")
    }
    if (inventoryEquiposFilter === "operativo") {
      return filtrados.filter((e) => e.estadoOperativo === "operativo")
    }
    return filtrados
  }, [filtrados, inventoryEquiposFilter])

  const inventarioRepuestosFiltrados = useMemo(() => {
    if (inventoryRepuestosFilter === "critico") {
      return repuestosInventario.filter((r) => r.status === "critico")
    }
    if (inventoryRepuestosFilter === "bajo") {
      return repuestosInventario.filter((r) => r.status === "bajo")
    }
    if (inventoryRepuestosFilter === "ok") {
      return repuestosInventario.filter((r) => r.status === "ok")
    }
    return repuestosInventario
  }, [repuestosInventario, inventoryRepuestosFilter])

  const exportFilteredAsCsv = () => {
    const headers = [
      "ID",
      "Marca",
      "Modelo",
      "Tipo",
      "Capacidad",
      "Ubicacion",
      "Estado",
      "Prioridad",
      "Proximo mantenimiento",
      "Ultimo mantenimiento",
    ]

    const rows = filtrados.map((e) => [
      e.id,
      e.marca || "",
      e.modelo || "",
      e.tipo || "",
      e.capacidad || "",
      e.ubicacion || "",
      getEstadoLabel(e.estadoOperativo),
      e.prioridad,
      formatDate(e.proximo?.fecha_programada || e.proximo?.created_at),
      formatDate(e.ultimo?.fecha_programada || e.ultimo?.created_at),
    ])

    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n")

    downloadTextFile(csv, `inventario-filtrado-${Date.now()}.csv`, "text/csv;charset=utf-8")
  }

  const exportFilteredAsPdf = async () => {
    setExportingPdf(true)

    try {
      const jsPdfModule = await import("jspdf")
      const PDF = jsPdfModule.default
      const pdf = new PDF({ orientation: "portrait", unit: "mm", format: "a4" })

      let y = 12
      pdf.setFontSize(14)
      pdf.text("Inventario Filtrado", 10, y)
      y += 7

      pdf.setFontSize(9)
      pdf.text(`Fecha: ${new Date().toLocaleString("es-UY")}`, 10, y)
      y += 6
      pdf.text(`Total: ${filtrados.length} equipos`, 10, y)
      y += 8

      filtrados.forEach((e, idx) => {
        if (y > 275) {
          pdf.addPage()
          y = 12
        }

        const line = `${idx + 1}. ${e.marca || ""} ${e.modelo || ""} | ${e.id} | ${e.ubicacion || "Sin ubicación"}`
        const line2 = `Estado: ${getEstadoLabel(e.estadoOperativo)} | Prioridad: ${e.prioridad} | Tipo: ${e.tipo || "-"}`

        pdf.text(line.slice(0, 110), 10, y)
        y += 4
        pdf.text(line2.slice(0, 110), 10, y)
        y += 6
      })

      pdf.save(`inventario-filtrado-${Date.now()}.pdf`)
    } catch (error) {
      console.error("No se pudo exportar PDF", error)
    } finally {
      setExportingPdf(false)
    }
  }

  const setEstadoRapido = async (equipoId, estado) => {
    const prioridad = getPrioridadFromEstado(estado)

    if (dbColumnsAvailable) {
      const { error } = await supabase
        .from("equipos")
        .update({ estado_operativo: estado, prioridad })
        .eq("id", equipoId)

      if (!error) {
        setEquipos((prev) =>
          prev.map((item) =>
            String(item.id) === String(equipoId)
              ? { ...item, estado_operativo: estado, prioridad }
              : item
          )
        )
        return
      }

      // Compatibilidad: si el esquema aún no tiene las columnas, se usa fallback local.
      const errorMessage = String(error?.message || "")
      if (errorMessage.toLowerCase().includes("estado_operativo") || errorMessage.toLowerCase().includes("prioridad")) {
        setDbColumnsAvailable(false)
      }
      console.error("No se pudo guardar estado en Supabase, usando fallback local", error)
    }

    setEstadoOverrides((prev) => ({
      ...prev,
      [String(equipoId)]: estado,
    }))
  }

  const updateTramiteEstado = async (tramiteId, newEstado) => {
    if (!tramiteId || updatingTramiteId) return

    setUpdatingTramiteId(String(tramiteId))
    const { error } = await supabase.from("tramites").update({ estado: newEstado }).eq("id", tramiteId)
    setUpdatingTramiteId(null)

    if (!error) {
      setTramites((prev) => prev.map((t) => (String(t.id) === String(tramiteId) ? { ...t, estado: newEstado } : t)))
      return
    }

    console.error("No se pudo actualizar estado del trámite", error)
  }

  return (
    <div className="py-4 sm:py-6">
      <div className="px-4 sm:px-6 border-b border-[#d4dfec] pb-4 mb-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1f4371] tracking-tight">Inventario</h1>
            <p className="text-sm sm:text-base font-medium text-[#4f6f95] mt-1">Gestión y control de equipos de climatización</p>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Link
              href="/equipos/nuevo"
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all"
            >
              Nuevo Equipo
            </Link>

            <button
              type="button"
              onClick={exportFilteredAsCsv}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#edf4ff] text-[#1f6bc1] border border-[#cad8ea] hover:bg-[#dfeeff]"
            >
              Exportar Excel (CSV)
            </button>

            <button
              type="button"
              onClick={exportFilteredAsPdf}
              disabled={exportingPdf}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#edf4ff] text-[#1f6bc1] border border-[#cad8ea] hover:bg-[#dfeeff] disabled:opacity-60"
            >
              {exportingPdf ? "Generando PDF..." : "Exportar PDF"}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 mb-5">
        <div className="rounded-xl border border-[#d1dcec] bg-[#f7faff] p-4 shadow-[0_6px_16px_rgba(36,84,145,.11)]">
          <h2 className="text-lg font-bold text-[#2a4d7a] mb-3">Búsqueda y Filtros Avanzados</h2>
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
            <input
              type="text"
              placeholder="Buscar por modelo, marca, ubicación o ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="lg:col-span-2 w-full px-3 py-2.5 border border-[#cad8ea] rounded-lg bg-white text-[#1f4371] text-sm placeholder-[#7f96b8] focus:outline-none focus:ring-2 focus:ring-[#a2bbe0]"
            />

            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="w-full px-3 py-2.5 border border-[#cad8ea] rounded-lg bg-white text-[#1f4371] text-sm"
            >
              <option value="todos">Tipo: Todos</option>
              {tiposDisponibles.map((tipo) => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>

            <select
              value={ubicacionFilter}
              onChange={(e) => setUbicacionFilter(e.target.value)}
              className="w-full px-3 py-2.5 border border-[#cad8ea] rounded-lg bg-white text-[#1f4371] text-sm"
            >
              <option value="todas">Ubicación: Todas</option>
              {ubicacionesDisponibles.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>

            <select
              value={capacidadFilter}
              onChange={(e) => setCapacidadFilter(e.target.value)}
              className="w-full px-3 py-2.5 border border-[#cad8ea] rounded-lg bg-white text-[#1f4371] text-sm"
            >
              <option value="todas">Capacidad: Todas</option>
              <option value="baja">Hasta 12.000</option>
              <option value="media">12.001 a 24.000</option>
              <option value="alta">Más de 24.000</option>
              <option value="sin-dato">Sin dato</option>
            </select>

            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="w-full px-3 py-2.5 border border-[#cad8ea] rounded-lg bg-white text-[#1f4371] text-sm"
            >
              <option value="todos">Estado: Todos</option>
              <option value="operativo">Operativo</option>
              <option value="mantenimiento">En mantenimiento</option>
              <option value="atencion">Atención</option>
              <option value="critico">Crítico</option>
            </select>

            <select
              value={prioridadFilter}
              onChange={(e) => setPrioridadFilter(e.target.value)}
              className="w-full px-3 py-2.5 border border-[#cad8ea] rounded-lg bg-white text-[#1f4371] text-sm"
            >
              <option value="todas">Prioridad: Todas</option>
              <option value="normal">Normal</option>
              <option value="atencion">Atención</option>
              <option value="critico">Crítico</option>
            </select>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#48688f]">
            <label className="flex items-center gap-2">
              Alerta de stock mínimo:
              <input
                type="number"
                min="1"
                value={minStockThreshold}
                onChange={(e) => setMinStockThreshold(Number(e.target.value || 1))}
                className="w-16 px-2 py-1 border border-[#cad8ea] rounded bg-white text-[#1f4371]"
              />
            </label>
            <span className="text-[#607b9f]">Mostrando {filtrados.length} de {equiposEnriquecidos.length} equipos</span>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 mb-5 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section className="rounded-xl border border-[#d1dcec] bg-[#f7faff] p-4 shadow-[0_6px_16px_rgba(36,84,145,.11)]">
          <h3 className="text-lg font-bold text-[#2a4d7a] mb-3">Alertas de Stock y Repuestos</h3>

          <p className="text-xs font-semibold text-[#607b9f] mb-1">Modelos con bajo stock</p>
          {stockAlerts.length === 0 ? (
            <p className="text-sm text-[#5f7ea4] mb-3">Sin alertas de stock mínimo.</p>
          ) : (
            <div className="space-y-2 mb-3">
              {stockAlerts.map((item) => (
                <div key={item.modeloKey} className="rounded-md border border-[#f3dddd] bg-[#fff8f8] px-3 py-2 text-sm text-[#7f4a4a]">
                  {item.modeloKey}: {item.total} unidades
                </div>
              ))}
            </div>
          )}

          <p className="text-xs font-semibold text-[#607b9f] mb-1">Repuestos críticos (demanda alta)</p>
          {repuestosCriticos.length === 0 ? (
            <p className="text-sm text-[#5f7ea4]">Sin repuestos críticos detectados.</p>
          ) : (
            <div className="space-y-2">
              {repuestosCriticos.map((part) => (
                <div key={part.key} className="rounded-md border border-[#fff0cd] bg-[#fffaf0] px-3 py-2 text-sm text-[#946b1d]">
                  {part.nombre}: {part.demand} solicitudes
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-[#d1dcec] bg-[#f7faff] p-4 shadow-[0_6px_16px_rgba(36,84,145,.11)]">
          <h3 className="text-lg font-bold text-[#2a4d7a] mb-1">Tendencia de Movimientos y Rotación</h3>
          <p className="text-xs text-[#6f87a8] mb-2">Compara ingresos/salidas por mes y calcula cuántas salidas hubo por equipo en el período.</p>

          <div className="space-y-2">
            {trendData.map((m) => (
              <div key={m.key} className="grid grid-cols-[52px_1fr_auto] gap-2 items-center text-xs">
                <span className="font-semibold text-[#58789f]">{formatMonthLabel(m.month)}</span>
                <div className="space-y-1">
                  <div className="h-2 rounded-full bg-[#dbe6f4] overflow-hidden">
                    <div className="h-full bg-[#45a66a]" style={{ width: `${(m.ingresos / maxTrendValue) * 100}%` }} />
                  </div>
                  <div className="h-2 rounded-full bg-[#dbe6f4] overflow-hidden">
                    <div className="h-full bg-[#d05b5b]" style={{ width: `${(m.salidas / maxTrendValue) * 100}%` }} />
                  </div>
                </div>
                <span className="text-[#4f6f95]">I:{m.ingresos} S:{m.salidas}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-md border border-[#dbe6f4] bg-white px-3 py-2 text-sm text-[#4f6f95]">
            Rotación acumulada: <span className="font-bold text-[#2a4d7a]">{rotacion}</span>
          </div>
        </section>

        <section className="rounded-xl border border-[#d1dcec] bg-[#f7faff] p-4 shadow-[0_6px_16px_rgba(36,84,145,.11)]">
          <h3 className="text-lg font-bold text-[#2a4d7a] mb-1">Inventario por Sucursal/Depósito</h3>
          <p className="text-xs text-[#6f87a8] mb-2">Agrupa equipos por ubicación física para ver carga operativa y criticidad por sede.</p>
          {depositoSummary.length === 0 ? (
            <p className="text-sm text-[#5f7ea4]">No hay ubicaciones disponibles.</p>
          ) : (
            <div className="space-y-2">
              {depositoSummary.map((dep) => (
                <div key={dep.deposito} className="rounded-md border border-[#dbe6f4] bg-white px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#2a4d7a] truncate">{dep.deposito}</p>
                    <span className="text-xs text-[#4f6f95] font-semibold">{dep.total} equipos</span>
                  </div>
                  <p className="text-xs text-[#607b9f] mt-1">
                    Operativos: {dep.operativos} | En mantenimiento: {dep.enMantenimiento} | Críticos: {dep.criticos}
                  </p>
                </div>
              ))}

              <div className="rounded-md border border-[#cad8ea] bg-[#edf4ff] px-3 py-2 text-sm text-[#2f69b0] font-semibold">
                Consolidado general: {equiposEnriquecidos.length} equipos en total
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="px-4 sm:px-6 mb-5">
        <div className="rounded-xl border border-[#d1dcec] bg-[#f7faff] overflow-hidden shadow-[0_6px_16px_rgba(36,84,145,.11)]">
          <div className="px-4 py-3 border-b border-[#dbe4f3]">
            <h2 className="text-lg font-bold text-[#284a76]">Historial de Movimientos de Inventario</h2>
            <p className="text-xs text-[#6f87a8] mt-1">Incluye tipo, motivo, usuario y referencia.</p>
          </div>
          <div className="p-4 space-y-2">
            {inventoryMovements.length === 0 ? (
              <p className="text-sm text-[#6d84a5]">No hay movimientos para mostrar.</p>
            ) : (
              inventoryMovements.map((m) => (
                <div key={m.id} className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-2 items-center rounded-md border border-[#dbe6f4] bg-white px-3 py-2">
                  {(() => {
                    const badge = getMovimientoBadge(m)
                    return (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold w-fit ${badge.cls}`}
                  >
                    {badge.label}
                  </span>
                    )
                  })()}

                  <div>
                    <p className="text-sm text-[#36557b]">{m.detalle}</p>
                    <p className="text-xs text-[#6d84a5]">Motivo: {m.motivo}</p>
                    <p className="text-xs text-[#6d84a5]">Usuario: {m.usuario} | Ref: {m.referencia}</p>
                  </div>

                  <span className="text-xs text-[#4f6f95] bg-[#e8eff9] px-2 py-1 rounded w-fit">{formatDate(m.date)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 mb-6">
        <div className="rounded-xl border border-[#d1dcec] bg-[#f7faff] overflow-hidden shadow-[0_6px_16px_rgba(36,84,145,.11)]">
          <div className="px-4 py-3 border-b border-[#dbe4f3] bg-gradient-to-r from-[#f7faff] to-[#edf4ff]">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-lg font-bold text-[#284a76]">Próximos Mantenimientos</h2>
                <p className="text-xs text-[#6f87a8] mt-0.5">Agenda operativa de mantenimientos por prioridad y fecha.</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#e8eff9] text-[#355985]">
                {upcomingMaintenances.length} programados
              </span>
            </div>
          </div>
          <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
            {upcomingMaintenances.length === 0 ? (
              <p className="text-sm text-[#6d84a5] lg:col-span-2">No hay mantenimientos próximos.</p>
            ) : (
              upcomingMaintenances.map((item) => (
                <article key={item.id} className="rounded-xl border border-[#d4e0f1] bg-white p-3 shadow-[0_4px_12px_rgba(36,84,145,.08)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#294f7d] truncate">{item.marca || "Equipo"} {item.modelo || ""}</p>
                      <p className="text-xs text-[#6d84a5] mt-0.5 truncate">{item.ubicacion || "Sin ubicación"}</p>
                    </div>
                    {(() => {
                      const scheduled = new Date(item.proximo?.fecha_programada || item.proximo?.created_at || 0)
                      const today = new Date()
                      const diffDays = Number.isNaN(scheduled.getTime())
                        ? null
                        : Math.ceil((new Date(scheduled.getFullYear(), scheduled.getMonth(), scheduled.getDate()) - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000)

                      const urgencyClass = diffDays !== null && diffDays <= 1
                        ? "bg-[#fdeeee] text-[#b44a4a]"
                        : diffDays !== null && diffDays <= 3
                          ? "bg-[#fff8e8] text-[#a97717]"
                          : "bg-[#eaf2ff] text-[#2f69b0]"

                      const urgencyLabel = diffDays === null
                        ? "Sin fecha"
                        : diffDays <= 0
                          ? "Hoy"
                          : diffDays === 1
                            ? "Mañana"
                            : `En ${diffDays} días`

                      return (
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${urgencyClass}`}>
                          {urgencyLabel}
                        </span>
                      )
                    })()}
                  </div>

                  <div className="mt-3 rounded-md border border-[#dbe6f4] bg-[#f8fbff] px-2.5 py-2 flex items-center justify-between">
                    <p className="text-[11px] text-[#5f7ea4]">Fecha programada</p>
                    <span className="text-xs text-[#355985] font-bold">
                      {formatDate(item.proximo?.fecha_programada || item.proximo?.created_at)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.proximo?.id && (
                      <Link
                        href={`/tramites/${item.proximo.id}`}
                        className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-[#edf4ff] text-[#1f6bc1] text-[11px] font-semibold hover:bg-[#dfebff]"
                      >
                        Ver trámite
                      </Link>
                    )}

                    <Link
                      href={`/equipos/${item.id}`}
                      className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-[#edf4ff] text-[#1f6bc1] text-[11px] font-semibold hover:bg-[#dfebff]"
                    >
                      Ver equipo
                    </Link>

                    {item.proximo?.id && item.proximo?.estado !== "en_proceso" && (
                      <button
                        type="button"
                        disabled={updatingTramiteId === String(item.proximo.id)}
                        onClick={() => updateTramiteEstado(item.proximo.id, "en_proceso")}
                        className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-[#e9f1ff] text-[#2f69b0] text-[11px] font-semibold hover:bg-[#dce8ff] disabled:opacity-60"
                      >
                        Iniciar
                      </button>
                    )}

                    {item.proximo?.id && item.proximo?.estado !== "completado" && (
                      <button
                        type="button"
                        disabled={updatingTramiteId === String(item.proximo.id)}
                        onClick={() => updateTramiteEstado(item.proximo.id, "completado")}
                        className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-[#eaf7ef] text-[#2f7d4a] text-[11px] font-semibold hover:bg-[#dff2e6] disabled:opacity-60"
                      >
                        Completar
                      </button>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 mb-6">
        <div className="rounded-xl border border-[#d1dcec] bg-[#f7faff] overflow-hidden shadow-[0_6px_16px_rgba(36,84,145,.11)]">
          <div className="px-4 py-3 border-b border-[#dbe4f3] bg-gradient-to-r from-[#f7faff] to-[#edf4ff]">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-lg font-bold text-[#284a76]">Trámites Activos</h2>
                <p className="text-xs text-[#6f87a8] mt-0.5">Seguimiento de mantenimientos y abonos pendientes o en proceso.</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#e8eff9] text-[#355985]">
                {tramites.filter((t) => t.estado === "pendiente" || t.estado === "en_proceso").length} activos
              </span>
            </div>
          </div>
          <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
            {tramites.filter((t) => t.estado === "pendiente" || t.estado === "en_proceso").length === 0 ? (
              <p className="text-sm text-[#6d84a5] lg:col-span-2">No hay trámites pendientes o en proceso.</p>
            ) : (
              tramites
                .filter((t) => t.estado === "pendiente" || t.estado === "en_proceso")
                .sort((a, b) => new Date(a.fecha_programada || a.created_at || 0) - new Date(b.fecha_programada || b.created_at || 0))
                .slice(0, 6)
                .map((tramite) => {
                  const equipo = equiposEnriquecidos.find((e) => String(e.id) === String(tramite.equipo_id))
                  const badge = getMovimientoBadge({ tipo: "tramite", estadoTramite: tramite.estado })

                  return (
                    <article key={tramite.id} className="rounded-xl border border-[#d4e0f1] bg-white p-3 shadow-[0_4px_12px_rgba(36,84,145,.08)]">
                      {/* Header con tipo y estado */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#e8eff9] text-[#2f69b0]">
                              {tramite.tipo === "mantenimiento" ? "Mantenimiento" : "Abono"}
                            </span>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-[#294f7d] mt-2 truncate">
                            {equipo ? `${equipo.marca || "Equipo"} ${equipo.modelo || ""}` : "Equipo no encontrado"}
                          </p>
                          <p className="text-xs text-[#6d84a5] mt-0.5 truncate">
                            {equipo?.ubicacion || "Sin ubicación"}
                          </p>
                        </div>
                      </div>

                      {/* Descripción */}
                      {tramite.descripcion && (
                        <p className="text-xs text-[#5f7ea4] bg-[#f8fbff] px-2.5 py-2 rounded-md mb-3">
                          {tramite.descripcion}
                        </p>
                      )}

                      {/* Información de fecha y monto */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="rounded-md border border-[#dbe6f4] bg-[#f8fbff] px-2.5 py-2 flex flex-col">
                          <p className="text-[11px] text-[#5f7ea4]">Fecha programada</p>
                          <span className="text-xs text-[#355985] font-bold mt-1">
                            {formatDate(tramite.fecha_programada || tramite.created_at)}
                          </span>
                        </div>
                        {tramite.monto && (
                          <div className="rounded-md border border-[#dbe6f4] bg-[#f8fbff] px-2.5 py-2 flex flex-col">
                            <p className="text-[11px] text-[#5f7ea4]">Monto</p>
                            <span className="text-xs text-[#355985] font-bold mt-1">
                              {tramite.monto} {tramite.moneda || "USD"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Botones de acción */}
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/tramites/${tramite.id}`}
                          className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-[#edf4ff] text-[#1f6bc1] text-[11px] font-semibold hover:bg-[#dfebff]"
                        >
                          Ver detalles
                        </Link>

                        {equipo && (
                          <Link
                            href={`/equipos/${equipo.id}`}
                            className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-[#edf4ff] text-[#1f6bc1] text-[11px] font-semibold hover:bg-[#dfebff]"
                          >
                            Ver equipo
                          </Link>
                        )}

                        {tramite.estado !== "en_proceso" && (
                          <button
                            type="button"
                            disabled={updatingTramiteId === String(tramite.id)}
                            onClick={() => updateTramiteEstado(tramite.id, "en_proceso")}
                            className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-[#e9f1ff] text-[#2f69b0] text-[11px] font-semibold hover:bg-[#dce8ff] disabled:opacity-60"
                          >
                            Iniciar
                          </button>
                        )}

                        {tramite.estado !== "completado" && (
                          <button
                            type="button"
                            disabled={updatingTramiteId === String(tramite.id)}
                            onClick={() => updateTramiteEstado(tramite.id, "completado")}
                            className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-[#eaf7ef] text-[#2f7d4a] text-[11px] font-semibold hover:bg-[#dff2e6] disabled:opacity-60"
                          >
                            Completar
                          </button>
                        )}
                      </div>
                    </article>
                  )
                })
            )}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6">
        <div className="mb-3 rounded-xl border border-[#d1dcec] bg-[#f7faff] p-3 shadow-[0_6px_16px_rgba(36,84,145,.11)]">
          <h2 className="text-lg font-bold text-[#2a4d7a] mb-2">Vista de Inventario</h2>
          <p className="text-xs text-[#6f87a8] mb-3">Separamos la operación en dos vistas: equipos instalados y repuestos del depósito.</p>
          <div className="inline-flex rounded-md border border-[#cad8ea] overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setInventoryView("equipos")}
              className={`px-3 py-1.5 text-xs font-semibold ${inventoryView === "equipos" ? "bg-[#1f6bc1] text-white" : "text-[#1f6bc1] hover:bg-[#edf4ff]"}`}
            >
              Equipos
            </button>
            <button
              type="button"
              onClick={() => setInventoryView("repuestos")}
              className={`px-3 py-1.5 text-xs font-semibold ${inventoryView === "repuestos" ? "bg-[#1f6bc1] text-white" : "text-[#1f6bc1] hover:bg-[#edf4ff]"}`}
            >
              Repuestos
            </button>
          </div>

          <div className="mt-3 rounded-lg border border-[#dbe4f3] bg-white px-2 py-2">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
              <p className="text-[11px] font-semibold text-[#5e7da3]">
                Filtros rápidos de {inventoryView === "equipos" ? "equipos" : "repuestos"}
              </p>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#edf4ff] text-[#2f69b0] font-semibold">
                {inventoryView === "equipos" ? inventarioEquiposFiltrados.length : inventarioRepuestosFiltrados.length} resultados
              </span>
            </div>

            {inventoryView === "equipos" ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setInventoryEquiposFilter("todos")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${inventoryEquiposFilter === "todos" ? "bg-[#1f6bc1] text-white" : "bg-[#edf4ff] text-[#2f69b0] hover:bg-[#dfebff]"}`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setInventoryEquiposFilter("critico")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${inventoryEquiposFilter === "critico" ? "bg-[#b44a4a] text-white" : "bg-[#fdeeee] text-[#b44a4a] hover:brightness-95"}`}
                >
                  Críticos
                </button>
                <button
                  type="button"
                  onClick={() => setInventoryEquiposFilter("mantenimiento")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${inventoryEquiposFilter === "mantenimiento" ? "bg-[#a97717] text-white" : "bg-[#fff8e8] text-[#a97717] hover:brightness-95"}`}
                >
                  Mantenimiento
                </button>
                <button
                  type="button"
                  onClick={() => setInventoryEquiposFilter("atencion")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${inventoryEquiposFilter === "atencion" ? "bg-[#2f69b0] text-white" : "bg-[#e9f1ff] text-[#2f69b0] hover:brightness-95"}`}
                >
                  Atención
                </button>
                <button
                  type="button"
                  onClick={() => setInventoryEquiposFilter("operativo")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${inventoryEquiposFilter === "operativo" ? "bg-[#2f7d4a] text-white" : "bg-[#eaf7ef] text-[#2f7d4a] hover:brightness-95"}`}
                >
                  Operativos
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setInventoryRepuestosFilter("todos")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${inventoryRepuestosFilter === "todos" ? "bg-[#1f6bc1] text-white" : "bg-[#edf4ff] text-[#2f69b0] hover:bg-[#dfebff]"}`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setInventoryRepuestosFilter("critico")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${inventoryRepuestosFilter === "critico" ? "bg-[#b44a4a] text-white" : "bg-[#fdeeee] text-[#b44a4a] hover:brightness-95"}`}
                >
                  Críticos
                </button>
                <button
                  type="button"
                  onClick={() => setInventoryRepuestosFilter("bajo")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${inventoryRepuestosFilter === "bajo" ? "bg-[#a97717] text-white" : "bg-[#fff8e8] text-[#a97717] hover:brightness-95"}`}
                >
                  Bajo stock
                </button>
                <button
                  type="button"
                  onClick={() => setInventoryRepuestosFilter("ok")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${inventoryRepuestosFilter === "ok" ? "bg-[#2f7d4a] text-white" : "bg-[#eaf7ef] text-[#2f7d4a] hover:brightness-95"}`}
                >
                  Stock OK
                </button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#d8e4f3] border-b-[#2d72c4]" />
          </div>
        ) : inventoryView === "equipos" && inventarioEquiposFiltrados.length === 0 ? (
          <div className="text-center py-8 bg-[#f7faff] rounded-xl border border-[#d1dcec]">
            <h3 className="mt-2 text-sm font-semibold text-[#1f4371]">No se encontraron equipos</h3>
            <p className="mt-1 text-xs text-[#6f87a8]">
              {search ? "Intenta con otros filtros de inventario" : "Aún no hay equipos registrados"}
            </p>
          </div>
        ) : inventoryView === "repuestos" ? (
          <div className="rounded-xl border border-[#d1dcec] bg-[#f7faff] overflow-hidden shadow-[0_6px_16px_rgba(36,84,145,.11)]">
            <div className="px-4 py-3 border-b border-[#dbe4f3]">
              <h3 className="text-base font-bold text-[#284a76]">Inventario de Repuestos</h3>
              <p className="text-xs text-[#6f87a8] mt-1">Estimación operativa basada en consumo detectado en trámites.</p>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {inventarioRepuestosFiltrados.length === 0 ? (
                <p className="text-sm text-[#6d84a5] md:col-span-2 xl:col-span-4">No hay repuestos para el filtro seleccionado.</p>
              ) : inventarioRepuestosFiltrados.map((rep) => (
                <article key={rep.key} className="rounded-md border border-[#dbe6f4] bg-white p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h4 className="text-sm font-semibold text-[#2a4d7a]">{rep.nombre}</h4>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${getRepuestoBadgeClass(rep.status)}`}>
                      {rep.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#607b9f]">Stock estimado: <span className="font-semibold">{rep.estimatedStock}</span></p>
                  <p className="text-xs text-[#607b9f] mt-1">Demanda: <span className="font-semibold">{rep.demand} usos</span></p>
                  <p className="text-xs text-[#607b9f] mt-1">Último uso: <span className="font-semibold">{formatDate(rep.ultimoUso)}</span></p>
                  <div className="mt-2">
                    <Link
                      href="/tramites"
                      className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-[#edf4ff] text-[#1f6bc1] text-[11px] font-semibold hover:bg-[#dfebff]"
                    >
                      Ver movimientos
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {inventarioEquiposFiltrados.map((equipo) => (
              <article
                key={equipo.id}
                className="h-full bg-[#f9fbff] rounded-xl border border-[#d1dcec] p-4 shadow-[0_6px_16px_rgba(36,84,145,.11)]"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h2 className="text-base font-bold text-[#1f4371] line-clamp-1">
                    {equipo.marca} {equipo.modelo}
                  </h2>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${getPrioridadBadge(equipo.prioridad)}`}>
                    {equipo.prioridad}
                  </span>
                </div>

                <p className="text-xs text-[#5f7ea4]">ID: {equipo.id}</p>
                <p className="text-xs text-[#5f7ea4] mt-1">Ubicación: {equipo.ubicacion || "Sin ubicación"}</p>
                <p className="text-xs text-[#5f7ea4] mt-1">Tipo: {equipo.tipo || "Sin tipo"}</p>
                <p className="text-xs text-[#5f7ea4] mt-1">Capacidad: {equipo.capacidad || "Sin dato"}</p>

                <div className="mt-2 flex items-center gap-2">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${getEstadoBadgeClass(equipo.estadoOperativo)}`}>
                    {getEstadoLabel(equipo.estadoOperativo)}
                  </span>
                </div>

                <div className="mt-3 text-[11px] text-[#607b9f] space-y-1">
                  <p>Próximo: {formatDate(equipo.proximo?.fecha_programada || equipo.proximo?.created_at)}</p>
                  <p>Último: {formatDate(equipo.ultimo?.fecha_programada || equipo.ultimo?.created_at)}</p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    href={`/equipos/${equipo.id}`}
                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-[#1f6bc1] text-white text-xs font-semibold hover:bg-[#19599f]"
                  >
                    Ver detalle
                  </Link>

                  <Link
                    href={`/tramites?nuevo=1&equipoId=${equipo.id}`}
                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-[#edf4ff] text-[#1f6bc1] text-xs font-semibold hover:bg-[#dfebff]"
                  >
                    Nuevo trámite
                  </Link>

                  <Link
                    href={`/tramites?nuevo=1&tipo=mantenimiento&equipoId=${equipo.id}`}
                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-[#edf4ff] text-[#1f6bc1] text-xs font-semibold hover:bg-[#dfebff] col-span-2"
                  >
                    Programar mantenimiento
                  </Link>
                </div>

                <div className="mt-2">
                  <label className="block text-[11px] font-semibold text-[#5e7da3] mb-1">Marcar estado rápido</label>
                  <select
                    value={equipo.estadoOperativo}
                    onChange={(e) => setEstadoRapido(equipo.id, e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-[#cad8ea] rounded-md text-[#2a4f7d] text-xs"
                  >
                    <option value="operativo">Operativo</option>
                    <option value="atencion">Atención</option>
                    <option value="mantenimiento">En mantenimiento</option>
                    <option value="critico">Crítico</option>
                  </select>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
