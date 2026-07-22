"use client"

import Image from "next/image"
import { useCallback, useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { useDemoMode } from "@/lib/useDemoMode"
import { useAuthSession } from "@/lib/useAuthSession"
import { DEMO_CLIENTES, DEMO_EQUIPOS, DEMO_STATS, DEMO_TRAMITES } from "@/lib/demoData"

type ClientSummary = {
  id: string | number
  cliente: string
  ubicacion: string
  equipos: number
  estado: "activo" | "mantenimiento"
}

type Tramite = {
  id: number
  tipo: string
  estado: string
  created_at: string
  fecha_programada?: string
  cliente_id?: string
  clientes?: { nombre?: string } | Array<{ nombre?: string }>
  [key: string]: unknown
}

type ClienteGeoInput = {
  latitud?: number | string | null
  latitude?: number | string | null
  longitud?: number | string | null
  longitude?: number | string | null
  direccion?: string | null
  ciudad?: string | null
}

type InventoryMovement = {
  id: string
  tipo: "ingreso" | "salida" | "ajuste"
  detalle: string
  whenLabel: string
}

type UpcomingMaintenance = {
  id: number
  title: string
  dateLabel: string
}

type MapPoint = {
  id: string
  label: string
  lat: number
  lng: number
  color: string
}

const CITY_COORDS_UY: Record<string, { lat: number; lng: number }> = {
  montevideo: { lat: -34.9011, lng: -56.1645 },
  canelones: { lat: -34.5228, lng: -56.2778 },
  maldonado: { lat: -34.9068, lng: -54.958 },
  "punta del este": { lat: -34.9683, lng: -54.95 },
  rocha: { lat: -34.4833, lng: -54.3333 },
  chuy: { lat: -33.6971, lng: -53.4593 },
  "la paloma": { lat: -34.6639, lng: -54.1645 },
  salto: { lat: -31.3833, lng: -57.9667 },
  paysandu: { lat: -32.3214, lng: -58.0756 },
  "paysandú": { lat: -32.3214, lng: -58.0756 },
  mercedes: { lat: -33.2524, lng: -58.0305 },
  tacuarembo: { lat: -31.7333, lng: -55.9833 },
  "tacuarembó": { lat: -31.7333, lng: -55.9833 },
  rivera: { lat: -30.9053, lng: -55.5508 },
  melo: { lat: -32.3667, lng: -54.1833 },
  artigas: { lat: -30.4, lng: -56.4667 },
  durazno: { lat: -33.4131, lng: -56.5006 },
  florida: { lat: -34.0994, lng: -56.2142 },
  "san jose de mayo": { lat: -34.3375, lng: -56.7136 },
  "san josé de mayo": { lat: -34.3375, lng: -56.7136 },
  "colonia del sacramento": { lat: -34.4698, lng: -57.8442 },
  "fray bentos": { lat: -33.1325, lng: -58.2956 },
  minas: { lat: -34.3759, lng: -55.2377 },
  "treinta y tres": { lat: -33.2333, lng: -54.3833 },
  trinidad: { lat: -33.5442, lng: -56.8886 },
}

const UNIFIED_LOGO_SIZE = 20

export default function Home() {
  const [stats, setStats] = useState({ clientesActivos: 0, maquinasInstaladas: 0, unidadesStock: 0, mantenimientosPendientes: 0 })
  const [clientRows, setClientRows] = useState<ClientSummary[]>([])
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([])
  const [upcomingMaintenances, setUpcomingMaintenances] = useState<UpcomingMaintenance[]>([])
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [dashboardError, setDashboardError] = useState("")
  const { demoMode } = useDemoMode()
  const { displayName, loading: authLoading, permissions } = useAuthSession()

  const canViewClientes = permissions?.clientes !== false
  const canViewEquipos = permissions?.equipos !== false
  const canViewTramites = permissions?.tramites !== false
  const canViewRepuestos = permissions?.repuestos !== false

  const getClienteNombre = (clientes: Tramite["clientes"]) => {
    if (!clientes) return "Cliente"
    if (Array.isArray(clientes)) return clientes[0]?.nombre || "Cliente"
    return clientes.nombre || "Cliente"
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  const normalizeCityKey = useCallback((city: string) =>
    String(city || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""), [])

  const resolveClientCoords = useCallback(async (cliente: ClienteGeoInput): Promise<{ lat: number; lng: number } | null> => {
    const lat = Number(cliente?.latitud ?? cliente?.latitude)
    const lng = Number(cliente?.longitud ?? cliente?.longitude)
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng }
    }

    const cityKey = normalizeCityKey(cliente?.ciudad || "")
    const coords = CITY_COORDS_UY[cityKey]
    return coords ? { lat: coords.lat, lng: coords.lng } : null
  }, [normalizeCityKey])

  const loadDemoDashboard = useCallback(() => {
    const equiposByCliente = DEMO_EQUIPOS.reduce<Record<string, number>>((acc, e) => {
      acc[e.cliente_id] = (acc[e.cliente_id] || 0) + 1
      return acc
    }, {})

    const statusByCliente = DEMO_TRAMITES.reduce<Record<string, Tramite>>((acc, t) => {
      if (!acc[t.cliente_id]) acc[t.cliente_id] = t
      return acc
    }, {})

    setClientRows(
      DEMO_CLIENTES.slice(0, 6).map((c) => {
        const estado: ClientSummary["estado"] = ["pendiente", "en_proceso"].includes(statusByCliente[c.id]?.estado)
          ? "mantenimiento"
          : "activo"
        return {
          id: c.id,
          cliente: c.nombre,
          ubicacion: c.ciudad,
          equipos: equiposByCliente[c.id] || 0,
          estado,
        }
      })
    )

    setStats({
      clientesActivos: DEMO_STATS.clientes,
      maquinasInstaladas: DEMO_STATS.equipos,
      unidadesStock: Math.max(8, Math.round(DEMO_STATS.equipos * 0.35)),
      mantenimientosPendientes: DEMO_STATS.pendientes,
    })

    setMapPoints(
      DEMO_CLIENTES.slice(0, 6).flatMap((c) => {
        const cityKey = normalizeCityKey(c.ciudad)
        const coords = CITY_COORDS_UY[cityKey]
        if (!coords) return []
        return {
          id: String(c.id),
          label: `${c.nombre} (${c.ciudad})`,
          lat: coords.lat,
          lng: coords.lng,
          color: "#1e6bc1",
        }
      }).filter(Boolean) as MapPoint[]
    )

    setInventoryMovements(
      DEMO_EQUIPOS.slice(0, 5).map((e) => ({
        id: String(e.id),
        tipo: "ingreso" as const,
        detalle: `Alta de equipo: ${e.marca} ${e.modelo}`,
        whenLabel: new Date(e.created_at).toLocaleDateString("es-UY", { day: "2-digit", month: "short" }),
      }))
    )

    setUpcomingMaintenances([
      { id: 1, title: "Mantenimiento - Hotel Oasis", dateLabel: "25 Sep" },
      { id: 2, title: "Revisión - Clínica Médica", dateLabel: "28 Sep" },
      { id: 3, title: "Servicio - Oficinas TechCorp", dateLabel: "30 Sep" },
    ])

    setLoading(false)
  }, [normalizeCityKey])

  const loadDashboardData = useCallback(async () => {
    setDashboardError("")
    try {
      if (demoMode) {
        loadDemoDashboard()
        return
      }

      const emptyResult = { data: [], error: null }
      const clientesQuery = canViewClientes ? supabase.from("clientes").select("*") : Promise.resolve(emptyResult)
      const equiposQuery = canViewEquipos ? supabase.from("equipos").select("*") : Promise.resolve(emptyResult)
      const tramitesQuery = canViewTramites ? supabase.from("tramites").select("*, clientes(nombre)") : Promise.resolve(emptyResult)
      const repuestosQuery = canViewRepuestos ? supabase.from("repuestos").select("id, stock_actual") : Promise.resolve(emptyResult)
      const movimientosQuery = canViewRepuestos
        ? supabase.from("movimientos_repuestos").select("id, tipo, cantidad, motivo, fecha_movimiento, created_at, repuestos(nombre, codigo)").order("fecha_movimiento", { ascending: false }).limit(5)
        : Promise.resolve(emptyResult)

      const [clientesRes, equiposRes, tramitesRes, repuestosRes, movimientosRes] = await Promise.all([
        clientesQuery,
        equiposQuery,
        tramitesQuery,
        repuestosQuery,
        movimientosQuery,
      ])

      const clientesData = clientesRes.data || []
      const equiposData = equiposRes.data || []
      const tramitesData = tramitesRes.data || []

      if (clientesRes.error || equiposRes.error || tramitesRes.error || repuestosRes.error || movimientosRes.error) {
        console.error("Error obteniendo datos de Supabase", {
          clientesError: clientesRes.error,
          equiposError: equiposRes.error,
          tramitesError: tramitesRes.error,
          repuestosError: repuestosRes.error,
          movimientosError: movimientosRes.error,
        })
        setMapPoints([])
        setClientRows([])
        setInventoryMovements([])
        setUpcomingMaintenances([])
        setStats({ clientesActivos: 0, maquinasInstaladas: 0, unidadesStock: 0, mantenimientosPendientes: 0 })
        setDashboardError("No se pudo sincronizar con Supabase. Verificá la conexión y la configuración del proyecto.")
        return
      }

      const clientes = clientesData || []
      const equipos = equiposData || []
      const tramitesRaw = [...(tramitesData || [])].sort(
        (a, b) => new Date(b.created_at || b.fecha_programada || 0).getTime() - new Date(a.created_at || a.fecha_programada || 0).getTime()
      )

      const points = (
        await Promise.all(
          clientes.map(async (c) => {
            const coords = await resolveClientCoords(c)
            if (!coords) return null

            return {
              id: String(c.id),
              label: `${c.nombre || "Cliente"} (${c.ciudad || "Sin ciudad"})`,
              lat: coords.lat,
              lng: coords.lng,
              color: "#1e6bc1",
            }
          })
        )
      ).filter(Boolean) as MapPoint[]

      setMapPoints(points)

      const equiposByCliente = equipos.reduce<Record<string, number>>((acc, equipo) => {
        const key = String(equipo.cliente_id || "")
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {})

      const latestByCliente: Record<string, Tramite> = {}
      tramitesRaw.forEach((t) => {
        const key = String(t.cliente_id || "")
        if (!key) return
        if (!latestByCliente[key]) latestByCliente[key] = t
      })

      const clientSummary = clientes.slice(0, 8).map((c) => {
        const hasMaintenance = ["pendiente", "en_proceso"].includes(latestByCliente[String(c.id)]?.estado)
        const estado: ClientSummary["estado"] = hasMaintenance ? "mantenimiento" : "activo"
        return {
          id: c.id,
          cliente: c.nombre || "Sin nombre",
          ubicacion: c.ciudad || "Sin ciudad",
          equipos: equiposByCliente[String(c.id)] || 0,
          estado,
        }
      })

      setClientRows(clientSummary)

      const mantenimientosPendientes = tramitesRaw.filter(
        (t) => t.tipo === "mantenimiento" && ["pendiente", "en_proceso"].includes(t.estado)
      ).length

      const unidadesStock = (repuestosRes.data || []).reduce((acc, repuesto) => {
        const stock = Number(repuesto.stock_actual || 0)
        return acc + (Number.isFinite(stock) ? stock : 0)
      }, 0)

      setStats({
        clientesActivos: clientes.length,
        maquinasInstaladas: equipos.length,
        unidadesStock,
        mantenimientosPendientes,
      })

      const movements = (movimientosRes.data || []).map((m) => {
        const created = new Date(m.fecha_movimiento || m.created_at)
        const repuestoRef = Array.isArray(m.repuestos) ? m.repuestos[0] : m.repuestos
        const repuestoNombre = repuestoRef?.nombre || "Repuesto"
        return {
          id: String(m.id),
          tipo: m.tipo || "ajuste",
          detalle: `${repuestoNombre} x${m.cantidad || 0}${m.motivo ? ` (${m.motivo})` : ""}`,
          whenLabel: created.toLocaleDateString("es-UY", { day: "2-digit", month: "short" }),
        }
      })

      setInventoryMovements(movements)

      const today = new Date()
      const upcoming = tramitesRaw
        .filter((t) => t.tipo === "mantenimiento" && t.fecha_programada && t.estado !== "cancelado")
        .filter((t) => new Date(t.fecha_programada) >= today)
        .slice(0, 3)
        .map((t) => ({
          id: t.id,
          title: `${t.estado === "en_proceso" ? "Servicio" : "Mantenimiento"} - ${getClienteNombre(t.clientes)}`,
          dateLabel: new Date(t.fecha_programada).toLocaleDateString("es-UY", { day: "2-digit", month: "short" }),
        }))

      setUpcomingMaintenances(upcoming)
    } catch (error) {
      console.error("Error cargando dashboard:", error)
      setMapPoints([])
      setClientRows([])
      setInventoryMovements([])
      setUpcomingMaintenances([])
      setStats({ clientesActivos: 0, maquinasInstaladas: 0, unidadesStock: 0, mantenimientosPendientes: 0 })
      setDashboardError("No se pudo cargar el dashboard. Revisá la conexión a Supabase e intentá nuevamente.")
    } finally {
      setLoading(false)
    }
  }, [canViewClientes, canViewEquipos, canViewRepuestos, canViewTramites, demoMode, loadDemoDashboard, resolveClientCoords])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const visibleStats = stats
  const filteredClients = clientRows.filter((c) => c.cliente.toLowerCase().includes(search.toLowerCase()))

  const statCards = [
    { title: "Clientes", value: visibleStats.clientesActivos, helper: "Activos", icon: "/logos/clientes.png", color: "bg-[#2459a8]", valueColor: "text-[#1d3f6d]", helperColor: "text-[#6f86a8]" },
    { title: "Máquinas", value: visibleStats.maquinasInstaladas, helper: "Equipos", icon: "/logos/equipos.png", color: "bg-[#3f79d6]", valueColor: "text-[#1d3f6d]", helperColor: "text-[#6f86a8]" },
    { title: "Stock", value: visibleStats.unidadesStock, helper: "Unidades", icon: "/logos/unidadesstock.png", color: "bg-[#35a66b]", valueColor: "text-[#1d3f6d]", helperColor: "text-[#6f86a8]" },
    { title: "Mantenimientos", value: visibleStats.mantenimientosPendientes, helper: "Pendientes", icon: "/logos/mantenimiento.png", color: "bg-[#e76868]", valueColor: "text-[#c03838]", helperColor: "text-[#6f86a8]" },
  ]

  return (
    <div className="min-h-screen bg-[#e9eef5] flex flex-col pb-20">
      <div className="sticky top-0 z-40 bg-gradient-to-r from-[#0f4f9f] via-[#1f6cca] to-[#2c7fe0] px-4 py-4 shadow-[0_6px_18px_rgba(15,79,159,0.25)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-[#d5e8ff] uppercase tracking-wide">Gestión móvil</p>
            <h1 className="text-[18px] font-bold text-white truncate leading-tight">{authLoading ? "..." : displayName}</h1>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition">🔍</button>
            <button className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center text-white hover:bg-white/25 relative transition">🔔<span className="absolute top-1 right-1 w-2 h-2 bg-[#ff8a5c] rounded-full"></span></button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 space-y-4">
          {dashboardError && (
            <div className="rounded-lg border border-[#f0c9c9] bg-[#fff4f4] px-3 py-2 text-xs text-[#8c3f3f] font-medium">
              {dashboardError}
            </div>
          )}

          <div className="rounded-xl border border-[#d7e0ed] bg-white shadow-sm p-4">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-[36px] font-bold text-[#0f4f9f] font-mono">{loading ? "..." : visibleStats.mantenimientosPendientes}</span>
            </div>
            <p className="text-[13px] font-semibold text-[#5a7299] mb-4">Mantenimientos programados hoy</p>
            <div className="flex border-t border-[#d7e0ed] pt-3 gap-0">
              <div className="flex-1 text-center">
                <p className="text-[16px] font-bold text-[#1f9d63]">{loading ? "..." : Math.max(0, visibleStats.mantenimientosPendientes - 2)}</p>
                <p className="text-[10px] font-semibold text-[#5a7299] uppercase">A tiempo</p>
              </div>
              <div className="border-l border-[#d7e0ed]"></div>
              <div className="flex-1 text-center">
                <p className="text-[16px] font-bold text-[#c8810a]">2</p>
                <p className="text-[10px] font-semibold text-[#5a7299] uppercase">Próximos</p>
              </div>
              <div className="border-l border-[#d7e0ed]"></div>
              <div className="flex-1 text-center">
                <p className="text-[16px] font-bold text-[#d23b3b]">{loading ? "..." : Math.max(0, visibleStats.mantenimientosPendientes - Math.max(0, visibleStats.mantenimientosPendientes - 2) - 2)}</p>
                <p className="text-[10px] font-semibold text-[#5a7299] uppercase">Atrasados</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {statCards.map((card) => (
              <div key={card.title} className="rounded-lg border border-[#d7e0ed] bg-white px-3 py-3 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-7 h-7 rounded-full ${card.color} flex items-center justify-center flex-shrink-0`}>
                    <Image src={card.icon} alt={card.title} width={14} height={14} className="object-contain" />
                  </div>
                  <p className="text-[11px] font-semibold text-[#5a7299]">{card.title}</p>
                </div>
                <p className={`text-[20px] font-bold ${card.valueColor}`}>{loading ? "..." : card.value}</p>
                <p className={`text-[9px] font-semibold ${card.helperColor}`}>{card.helper}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-[#d7e0ed] bg-white shadow-sm p-3 flex items-center gap-3">
            <div className="w-14 h-14 rounded-lg bg-[#f2f5fa] border border-[#cad8eb] flex-shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#e8eff9] to-[#f2f5fa]"></div>
              {mapPoints.slice(0, 3).map((p, i) => (
                <div key={p.id} className="absolute w-3 h-3 rounded-full border border-white" style={{ background: p.color, top: `${20 + i * 15}px`, left: `${15 + i * 12}px` }}></div>
              ))}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-[#1f3b61]">{mapPoints.length} puntos activos en ruta</p>
              <p className="text-[11px] text-[#5a7299] mt-0.5">Ubicaciones de clientes y equipos</p>
            </div>
            <div className="text-[#1f6cca] font-bold text-lg flex-shrink-0">→</div>
          </div>

          <div className="bg-white rounded-lg border border-[#d7e0ed] shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[#d7e0ed] flex items-center justify-between">
              <h2 className="text-[14px] font-bold text-[#1f3b61]">Próximos mantenimientos</h2>
              {upcomingMaintenances.length > 0 && <Link href="/tramites" className="text-[11px] font-semibold text-[#1f6cca] hover:text-[#0f4f9f]">Ver agenda</Link>}
            </div>
            <div className="divide-y divide-[#d7e0ed]">
              {upcomingMaintenances.length === 0 ? (
                <div className="px-4 py-6 text-center text-[12px] text-[#5a7299]">No hay mantenimientos próximos</div>
              ) : (
                upcomingMaintenances.slice(0, 4).map((item) => (
                  <div key={item.id} className="px-4 py-3 flex gap-3">
                    <div className="flex flex-col items-center flex-shrink-0 pt-1">
                      <div className="w-3 h-3 bg-[#1f6cca] rounded-full"></div>
                      <div className="w-0.5 h-12 bg-[#cad8eb] mt-1"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-[12px] font-bold text-[#1f3b61] leading-snug">{item.title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#f3cf9b] to-[#c98953]"></div>
                        <span className="text-[10px] text-[#5a7299] font-medium">Técnico asignado</span>
                      </div>
                      <button className="text-[10px] font-semibold text-[#1f6cca] mt-2 px-2 py-1 rounded bg-[#f2f5fa] hover:bg-[#e8eff9] transition">Ver ruta</button>
                    </div>
                    <div className="text-[11px] font-bold text-[#5a7299] text-right flex-shrink-0">{item.dateLabel}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[#d7e0ed] shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[#d7e0ed] flex items-center justify-between">
              <h2 className="text-[14px] font-bold text-[#1f3b61]">Actividad reciente</h2>
              {inventoryMovements.length > 0 && <Link href="/equipos" className="text-[11px] font-semibold text-[#1f6cca] hover:text-[#0f4f9f]">Ver todo</Link>}
            </div>
            <div className="divide-y divide-[#d7e0ed]">
              {inventoryMovements.length === 0 ? (
                <div className="px-4 py-6 text-center text-[12px] text-[#5a7299]">No hay actividad</div>
              ) : (
                inventoryMovements.slice(0, 3).map((m) => (
                  <div key={m.id} className="px-4 py-3 flex gap-3 items-start">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[12px] ${m.tipo === "ingreso" ? "bg-[#e3f5ec] text-[#1f9d63]" : "bg-[#fce8e8] text-[#d23b3b]"}`}>
                      {m.tipo === "ingreso" ? "✓" : "⚠"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-[#1f3b61] leading-snug"><span className="font-bold">{m.tipo === "ingreso" ? "Ingreso" : "Salida"}</span>: {m.detalle.substring(0, 50)}</p>
                      <p className="text-[10px] text-[#5a7299] font-mono mt-1">{m.whenLabel}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {canViewClientes && (
            <div className="bg-white rounded-lg border border-[#d7e0ed] shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-[#d7e0ed] flex items-center justify-between">
                <h2 className="text-[14px] font-bold text-[#1f3b61]">Clientes</h2>
                <Link href="/clientes" className="text-[11px] font-semibold text-[#1f6cca] hover:text-[#0f4f9f]">Ver todos</Link>
              </div>
              <div className="px-4 py-3">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar cliente..."
                  className="w-full px-3 py-2 rounded-lg border border-[#cad8eb] bg-[#f9fbff] text-[12px] text-[#304f76] placeholder:text-[#8fa4c0] focus:outline-none focus:ring-2 focus:ring-[#7fa4d6]"
                />
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-[#d7e0ed]">
                {filteredClients.slice(0, 5).map((row) => (
                  <div key={row.id} className="px-4 py-3 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-[#1f3b61] truncate">{row.cliente}</p>
                      <p className="text-[11px] text-[#5a7299] mt-0.5">{row.ubicacion} · {row.equipos} eq</p>
                    </div>
                    <span className={`flex-shrink-0 text-[9px] px-2 py-1 rounded font-bold whitespace-nowrap ${row.estado === "activo" ? "bg-[#e3f5ec] text-[#1f9d63]" : "bg-[#fbf0dd] text-[#c8810a]"}`}>
                      {row.estado === "activo" ? "Activo" : "Mto."}
                    </span>
                  </div>
                ))}
                {filteredClients.length === 0 && (
                  <div className="px-4 py-6 text-center text-[12px] text-[#5a7299]">No hay clientes coincidentes</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#d7e0ed] px-4 py-2 shadow-[0_-4px_16px_rgba(31,59,97,0.06)]">
        <div className="flex items-center justify-around">
          <Link href="/" className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg hover:bg-[#f9fbff] transition text-[#1f3b61]">
            <span className="text-[20px]">⌂</span>
            <span className="text-[10px] font-semibold">Inicio</span>
          </Link>
          {canViewClientes && (
            <Link href="/clientes" className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg hover:bg-[#f9fbff] transition text-[#5a7299]">
              <span className="text-[20px]">👥</span>
              <span className="text-[10px] font-semibold">Clientes</span>
            </Link>
          )}
          {canViewEquipos && (
            <Link href="/equipos" className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg hover:bg-[#f9fbff] transition text-[#5a7299]">
              <span className="text-[20px]">⚙</span>
              <span className="text-[10px] font-semibold">Equipos</span>
            </Link>
          )}
          {canViewTramites && (
            <Link href="/tramites" className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg hover:bg-[#f9fbff] transition text-[#5a7299]">
              <span className="text-[20px]">📅</span>
              <span className="text-[10px] font-semibold">Trámites</span>
            </Link>
          )}
          <Link href="/clientes" className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg hover:bg-[#f9fbff] transition text-[#5a7299]">
            <span className="text-[20px]">⋮</span>
            <span className="text-[10px] font-semibold">Más</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
