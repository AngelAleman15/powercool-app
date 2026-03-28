"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { useDemoMode } from "@/lib/useDemoMode"
import { DEMO_CLIENTES, DEMO_EQUIPOS, DEMO_STATS, DEMO_TRAMITES } from "@/lib/demoData"
import UruguayMap from "@/components/UruguayMap"

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
  [key: string]: any
}

type InventoryMovement = {
  id: string
  tipo: "ingreso" | "salida"
  detalle: string
  whenLabel: string
}

type UpcomingMaintenance = {
  id: number
  title: string
  dateLabel: string
}

type MachineStatus = {
  ok: number
  warning: number
  critical: number
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
  const [tramites, setTramites] = useState<Tramite[]>([])
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([])
  const [upcomingMaintenances, setUpcomingMaintenances] = useState<UpcomingMaintenance[]>([])
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([])
  const [machineStatus, setMachineStatus] = useState<MachineStatus>({ ok: 0, warning: 0, critical: 0 })
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const { demoMode } = useDemoMode()

  const getClienteNombre = (clientes: Tramite["clientes"]) => {
    if (!clientes) return "Cliente"
    if (Array.isArray(clientes)) return clientes[0]?.nombre || "Cliente"
    return clientes.nombre || "Cliente"
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [demoMode])

  const normalizeCityKey = (city: string) =>
    String(city || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")

  async function loadDashboardData() {
    try {
      if (demoMode) {
        loadDemoDashboard()
        return
      }

      const [clientesRes, equiposRes, tramitesRes] = await Promise.all([
        supabase.from("clientes").select("id, nombre, ciudad").order("created_at", { ascending: false }),
        supabase.from("equipos").select("id, cliente_id, marca, modelo, created_at"),
        supabase.from("tramites").select("id, tipo, estado, created_at, fecha_programada, cliente_id, clientes(nombre)").order("created_at", { ascending: false }),
      ])

      const clientesData = clientesRes.data || []
      const equiposData = equiposRes.data || []
      const tramitesData = tramitesRes.data || []

      if (clientesRes.error || equiposRes.error || tramitesRes.error) {
        console.warn("Supabase no disponible, usando datos demo", {
          clientesError: clientesRes.error,
          equiposError: equiposRes.error,
          tramitesError: tramitesRes.error,
        })
        loadDemoDashboard()
        return
      }

      const clientes = clientesData || []
      const equipos = equiposData || []
      const tramitesRaw = tramitesData || []
      setTramites(tramitesRaw)

      const points = clientes
        .map((c) => {
          const cityKey = normalizeCityKey(c.ciudad || "")
          const coords = CITY_COORDS_UY[cityKey]
          if (!coords) return null

          return {
            id: String(c.id),
            label: `${c.nombre || "Cliente"} (${c.ciudad || "Sin ciudad"})`,
            lat: coords.lat,
            lng: coords.lng,
            color: "#1e6bc1",
          }
        })
        .filter(Boolean) as MapPoint[]

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

      setStats({
        clientesActivos: clientes.length,
        maquinasInstaladas: equipos.length,
        unidadesStock: Math.max(8, Math.round(equipos.length * 0.35)),
        mantenimientosPendientes,
      })

      setMachineStatus({
        ok: tramitesRaw.filter((t) => t.estado === "completado").length,
        warning: tramitesRaw.filter((t) => ["pendiente", "en_proceso"].includes(t.estado)).length,
        critical: tramitesRaw.filter((t) => t.estado === "cancelado").length,
      })

      const movements = [...equipos]
        .filter((e) => !!e.created_at)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map((e) => {
          const created = new Date(e.created_at)
          return {
            id: String(e.id),
            tipo: "ingreso" as const,
            detalle: `Alta de equipo: ${e.marca || "Marca"} ${e.modelo || "Modelo"}`,
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
      setInventoryMovements([])
      setUpcomingMaintenances([])
    } finally {
      setLoading(false)
    }
  }

  const loadDemoDashboard = () => {
    setTramites(DEMO_TRAMITES)

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
      unidadesStock: 45,
      mantenimientosPendientes: DEMO_STATS.pendientes,
    })

    setMapPoints(
      DEMO_CLIENTES.map((c) => {
        const cityKey = normalizeCityKey(c.ciudad || "")
        const coords = CITY_COORDS_UY[cityKey]
        if (!coords) return null

        return {
          id: String(c.id),
          label: `${c.nombre} (${c.ciudad})`,
          lat: coords.lat,
          lng: coords.lng,
          color: "#1e6bc1",
        }
      }).filter(Boolean) as MapPoint[]
    )

    setMachineStatus({ ok: 95, warning: 18, critical: 5 })

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
      { id: 2, title: "Revision - Clinica Medica", dateLabel: "28 Sep" },
      { id: 3, title: "Servicio - Oficinas TechCorp", dateLabel: "30 Sep" },
    ])

    setLoading(false)
  }

  const visibleStats = stats
  const filteredClients = clientRows.filter((c) => c.cliente.toLowerCase().includes(search.toLowerCase()))

  const totalMachine = Math.max(1, machineStatus.ok + machineStatus.warning + machineStatus.critical)
  const percent = (value: number) => Math.round((value / totalMachine) * 100)

  return (
    <div className="px-6 sm:px-10 lg:px-12 py-6 sm:py-8 text-[#223f66]">
      <div className="space-y-6">
        <section className="pb-3 border-b border-[#cad7e8]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-4xl font-bold text-[#234876] leading-tight">Bienvenido, Carlos</h1>
              <p className="text-2xl font-semibold text-[#5a7194] mt-1">Resumen General de Clientes y Equipos</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm font-semibold text-[#5e7697]">
                {mounted ? new Date().toLocaleDateString("es-UY", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "Cargando..."}
              </span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-stretch">
          <div className="h-[84px] rounded-md border border-[#d7e0ed] bg-[#f9fbff] px-4 py-3 shadow-[0_2px_7px_rgba(36,84,145,.08)] flex items-center">
            <div className="flex items-center gap-2.5 w-full">
              <div className="h-9 w-9 min-h-9 min-w-9 shrink-0 rounded-full bg-[#2459a8] flex items-center justify-center p-1">
                <img src="/logos/clientes.png" alt="Clientes" width={UNIFIED_LOGO_SIZE} height={UNIFIED_LOGO_SIZE} className="object-contain" />
              </div>
              <div className="leading-tight">
                <p className="text-[15px] font-bold text-[#2b578d] whitespace-nowrap">Clientes Activos</p>
                <p className="text-[32px] leading-none font-extrabold text-[#1d3f6d] tracking-[-0.01em]">{loading ? "..." : visibleStats.clientesActivos} <span className="text-[11px] font-semibold text-[#6f86a8] ml-1">Empresas Registradas</span></p>
              </div>
            </div>
          </div>
          <div className="h-[84px] rounded-md border border-[#d7e0ed] bg-[#f9fbff] px-4 py-3 shadow-[0_2px_7px_rgba(36,84,145,.08)] flex items-center">
            <div className="flex items-center gap-2.5 w-full">
              <div className="h-9 w-9 min-h-9 min-w-9 shrink-0 rounded-full bg-[#3f79d6] flex items-center justify-center p-1">
                <img src="/logos/equipos.png" alt="Máquinas instaladas" width={UNIFIED_LOGO_SIZE} height={UNIFIED_LOGO_SIZE} className="object-contain" />
              </div>
              <div className="leading-tight">
                <p className="text-[15px] font-bold text-[#2b578d] whitespace-nowrap">Máquinas Instaladas</p>
                <p className="text-[32px] leading-none font-extrabold text-[#1d3f6d] tracking-[-0.01em]">{loading ? "..." : visibleStats.maquinasInstaladas} <span className="text-[11px] font-semibold text-[#6f86a8] ml-1">Equipos en Operación</span></p>
              </div>
            </div>
          </div>
          <div className="h-[84px] rounded-md border border-[#d7e0ed] bg-[#f9fbff] px-4 py-3 shadow-[0_2px_7px_rgba(36,84,145,.08)] flex items-center">
            <div className="flex items-center gap-2.5 w-full">
              <div className="h-9 w-9 min-h-9 min-w-9 shrink-0 rounded-full bg-[#35a66b] flex items-center justify-center p-1">
                <img src="/logos/unidadesstock.png" alt="Unidades en stock" width={UNIFIED_LOGO_SIZE} height={UNIFIED_LOGO_SIZE} className="object-contain" />
              </div>
              <div className="leading-tight">
                <p className="text-[15px] font-bold text-[#2b578d] whitespace-nowrap">Unidades en Stock</p>
                <p className="text-[32px] leading-none font-extrabold text-[#1d3f6d] tracking-[-0.01em]">{loading ? "..." : visibleStats.unidadesStock} <span className="text-[11px] font-semibold text-[#6f86a8] ml-1">En Almacén</span></p>
              </div>
            </div>
          </div>
          <div className="h-[84px] rounded-md border border-[#d7e0ed] bg-[#f9fbff] px-4 py-3 shadow-[0_2px_7px_rgba(36,84,145,.08)] flex items-center">
            <div className="flex items-center gap-2.5 w-full">
              <div className="h-9 w-9 min-h-9 min-w-9 shrink-0 rounded-full bg-[#e76868] flex items-center justify-center p-1">
                <img src="/logos/mantenimiento.png" alt="Mantenimientos pendientes" width={UNIFIED_LOGO_SIZE} height={UNIFIED_LOGO_SIZE} className="object-contain" />
              </div>
              <div className="leading-tight min-w-0">
                <p className="text-[13px] font-bold text-[#2b578d] leading-[1.05]">Mantenimientos Pendientes</p>
                <p className="text-[30px] leading-none font-extrabold text-[#c03838] tracking-[-0.01em]">{loading ? "..." : visibleStats.mantenimientosPendientes} <span className="text-[10px] font-semibold text-[#6f86a8] ml-1">Servicios Programados</span></p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          <div className="rounded-md border border-[#d1dcec] bg-[#f7faff] overflow-hidden shadow-[0_6px_16px_rgba(36,84,145,.11)]">
            <div className="px-4 py-2.5 border-b border-[#dbe4f3]">
              <h2 className="text-base font-bold text-[#284a76]">Listado de Clientes</h2>
            </div>
            <div className="px-4 pt-2.5">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-full px-2.5 py-1.5 rounded-md border border-[#cad8eb] bg-white text-xs text-[#304f76] placeholder:text-[#8fa4c0] focus:outline-none focus:ring-2 focus:ring-[#7fa4d6]"
              />
            </div>
            <div className="px-4 pb-3 pt-2 overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[#5f789b] border-y border-[#dbe4f3] bg-[#f1f6fd]">
                    <th className="text-left py-1.5">Cliente</th>
                    <th className="text-left py-1.5">Ubicación</th>
                    <th className="text-left py-1.5">Equipos</th>
                    <th className="text-left py-1.5">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.slice(0, 6).map((row) => (
                    <tr key={row.id} className="border-b border-[#e6eef9]">
                      <td className="py-1.5 text-[#24476f] font-semibold">{row.cliente}</td>
                      <td className="py-1.5 text-[#5d7799]">{row.ubicacion}</td>
                      <td className="py-1.5 text-[#2d8857] font-bold">{row.equipos} Activos</td>
                      <td className="py-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${row.estado === "activo" ? "bg-[#3ea54f] text-white" : "bg-[#f1a937] text-white"}`}>
                          {row.estado === "activo" ? "Activo" : "En Mantenimiento"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredClients.length === 0 && (
                <p className="text-center py-6 text-sm text-[#bcc8d7]">no se encuentra el cliente</p>
              )}
              <div className="pt-2 text-center">
                <Link href="/clientes" className="inline-flex items-center px-4 py-1 rounded-md bg-[#2a6dc1] text-white text-xs font-semibold hover:bg-[#245aa5]">
                  Ver Detalles
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-[#d1dcec] bg-[#f7faff] overflow-hidden shadow-[0_6px_16px_rgba(36,84,145,.11)]">
            <div className="px-4 py-2.5 border-b border-[#dbe4f3]">
              <h2 className="text-base font-bold text-[#284a76]">Mapa de Clientes</h2>
            </div>
            <div className="p-4">
              <div className="relative z-0 h-[280px] rounded-md overflow-hidden border border-[#bfd1e8] bg-[#8ec4e7]">
                <UruguayMap points={mapPoints} />
                <div className="absolute left-2 bottom-2 rounded bg-white/85 px-1.5 py-0.5 text-[10px] font-semibold text-[#54749a]">
                  Mapa interactivo: arrastra y haz zoom
                </div>
              </div>
              {!loading && mapPoints.length === 0 && (
                <p className="mt-2 text-xs text-[#6f87a8]">No hay clientes con ubicación válida para mostrar en el mapa.</p>
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
          <div className="rounded-md border border-[#d1dcec] bg-[#f7faff] overflow-hidden shadow-[0_6px_16px_rgba(36,84,145,.11)]">
            <div className="px-6 py-4 border-b border-[#dbe4f3]">
              <h2 className="text-2xl font-bold text-[#284a76]">Últimos Movimientos de Inventario</h2>
            </div>
            <div className="p-5 space-y-3">
              {inventoryMovements.length === 0 ? (
                <p className="text-sm text-[#6d84a5]">No hay movimientos de inventario reales para mostrar.</p>
              ) : (
                inventoryMovements.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-md border border-[#d7e3f4] bg-white px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={m.tipo === "ingreso" ? "/logos/entrada.png" : "/logos/salida.png"}
                        alt={m.tipo === "ingreso" ? "Entrada de stock" : "Salida de stock"}
                        width={UNIFIED_LOGO_SIZE}
                        height={UNIFIED_LOGO_SIZE}
                        className="shrink-0 object-contain"
                      />
                      <p className="text-sm text-[#36557b] truncate">
                        <span className={m.tipo === "ingreso" ? "text-[#2b9058] font-bold" : "text-[#c44343] font-bold"}>{m.tipo === "ingreso" ? "Ingreso" : "Salida"}</span>: {m.detalle.replace(/^Ingreso: |^Salida: /, "")}
                      </p>
                    </div>
                    <span className="text-xs text-[#4f6f95] bg-[#e8eff9] px-2 py-1 rounded">{m.whenLabel}</span>
                  </div>
                ))
              )}
              <Link href="/equipos" className="inline-flex mt-2 items-center px-5 py-1.5 rounded-md bg-[#2a6dc1] text-white text-sm font-semibold hover:bg-[#245aa5]">
                Ver Inventario
              </Link>
            </div>
          </div>

          <div className="rounded-md border border-[#d1dcec] bg-[#f7faff] overflow-hidden shadow-[0_6px_16px_rgba(36,84,145,.11)]">
            <div className="px-6 py-4 border-b border-[#dbe4f3]">
              <h2 className="text-2xl font-bold text-[#284a76]">Próximos Mantenimientos</h2>
            </div>
            <div className="p-5 space-y-3">
              {upcomingMaintenances.length === 0 ? (
                <p className="text-sm text-[#6d84a5]">No hay mantenimientos programados</p>
              ) : (
                upcomingMaintenances.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-md border border-[#d7e3f4] bg-white px-3 py-2">
                    <p className="text-sm font-semibold text-[#36557b]">{item.title}</p>
                    <span className="text-xs text-[#4f6f95] font-semibold">{item.dateLabel}</span>
                  </div>
                ))
              )}
              <Link href="/tramites" className="inline-flex mt-2 items-center px-5 py-1.5 rounded-md bg-[#2a6dc1] text-white text-sm font-semibold hover:bg-[#245aa5]">
                Ver Calendario
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
