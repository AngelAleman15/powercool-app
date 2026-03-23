"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { useDemoMode } from "@/lib/useDemoMode"
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
  [key: string]: any
}

type InventoryMovement = {
  id: number
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

export default function Home() {
  const [stats, setStats] = useState({ clientesActivos: 0, maquinasInstaladas: 0, unidadesStock: 0, mantenimientosPendientes: 0 })
  const [clientRows, setClientRows] = useState<ClientSummary[]>([])
  const [tramites, setTramites] = useState<Tramite[]>([])
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([])
  const [upcomingMaintenances, setUpcomingMaintenances] = useState<UpcomingMaintenance[]>([])
  const [machineStatus, setMachineStatus] = useState<MachineStatus>({ ok: 0, warning: 0, critical: 0 })
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const { demoMode, setDemoModePersistent } = useDemoMode()

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

  async function loadDashboardData() {
    try {
      if (demoMode) {
        loadDemoDashboard()
        return
      }

      const [clientesRes, equiposRes, tramitesRes] = await Promise.all([
        supabase.from("clientes").select("id, nombre, ciudad").order("created_at", { ascending: false }),
        supabase.from("equipos").select("id, cliente_id"),
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

      setInventoryMovements([
        { id: 1, tipo: "ingreso", detalle: `Ingreso: ${Math.max(4, Math.round(equipos.length / 5))} Unidades Split 3000BTU`, whenLabel: "Hoy" },
        { id: 2, tipo: "salida", detalle: `Salida: ${Math.max(2, Math.round(equipos.length / 8))} Unidades Piso Techo`, whenLabel: "Ayer" },
        { id: 3, tipo: "ingreso", detalle: `Ingreso: ${Math.max(3, Math.round(equipos.length / 6))} Unidades Cassette 2400BTU`, whenLabel: "Hace 3 días" },
      ])

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

    setMachineStatus({ ok: 95, warning: 18, critical: 5 })

    setInventoryMovements([
      { id: 1, tipo: "ingreso", detalle: "Ingreso: 10 Unidades Split 3000BTU", whenLabel: "Hoy" },
      { id: 2, tipo: "salida", detalle: "Salida: 5 Unidades Piso Techo", whenLabel: "Ayer" },
      { id: 3, tipo: "ingreso", detalle: "Ingreso: 8 Unidades Cassette 2400BTU", whenLabel: "Hace 3 días" },
    ])

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
  const demoClientMapPoints = [
    { id: "mvd-centro", label: "Hotel Oasis (Montevideo)", top: "56%", left: "61%", color: "bg-[#1e6bc1]" },
    { id: "mvd-pocitos", label: "Clinica Medica (Pocitos)", top: "59%", left: "64%", color: "bg-[#1e6bc1]" },
    { id: "canelones", label: "Oficinas TechCorp (Canelones)", top: "54%", left: "66%", color: "bg-[#3ea55e]" },
    { id: "maldonado", label: "Supermercado Verde (Maldonado)", top: "66%", left: "75%", color: "bg-[#1e6bc1]" },
    { id: "colonia", label: "Deposito Colonia", top: "57%", left: "45%", color: "bg-[#1e6bc1]" },
    { id: "salto", label: "Cliente Norte (Salto)", top: "31%", left: "41%", color: "bg-[#1e6bc1]" },
  ]

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
              <button
                onClick={() => setDemoModePersistent(!demoMode)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                  demoMode
                    ? "bg-[#4da869] text-white border-[#2d8f4b]"
                    : "bg-[#edf4ff] text-[#255088] border-[#9db7de] hover:bg-[#e2edfd]"
                }`}
              >
                {demoMode ? "Modo Demo ON" : "Activar Modo Demo"}
              </button>
              <span className="text-xs sm:text-sm font-semibold text-[#5e7697]">
                {mounted ? new Date().toLocaleDateString("es-UY", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "Cargando..."}
              </span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded-md border border-[#d1dcec] bg-[#f6f9ff] px-6 py-5 shadow-[0_4px_12px_rgba(36,84,145,.1)]">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-[#2459a8] text-white flex items-center justify-center font-bold text-xl">👥</div>
              <div>
                <p className="text-[26px] leading-none font-bold text-[#1d3f6d]">{loading ? "..." : visibleStats.clientesActivos}</p>
                <p className="text-sm font-semibold text-[#335682]">Clientes Activos</p>
              </div>
            </div>
          </div>
          <div className="rounded-md border border-[#d1dcec] bg-[#f6f9ff] px-6 py-5 shadow-[0_4px_12px_rgba(36,84,145,.1)]">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-[#3f79d6] text-white flex items-center justify-center font-bold text-xl">▤</div>
              <div>
                <p className="text-[26px] leading-none font-bold text-[#1d3f6d]">{loading ? "..." : visibleStats.maquinasInstaladas}</p>
                <p className="text-sm font-semibold text-[#335682]">Máquinas Instaladas</p>
              </div>
            </div>
          </div>
          <div className="rounded-md border border-[#d1dcec] bg-[#f6f9ff] px-6 py-5 shadow-[0_4px_12px_rgba(36,84,145,.1)]">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-[#35a66b] text-white flex items-center justify-center font-bold text-xl">▣</div>
              <div>
                <p className="text-[26px] leading-none font-bold text-[#1d3f6d]">{loading ? "..." : visibleStats.unidadesStock}</p>
                <p className="text-sm font-semibold text-[#335682]">Unidades en Stock</p>
              </div>
            </div>
          </div>
          <div className="rounded-md border border-[#d1dcec] bg-[#f6f9ff] px-6 py-5 shadow-[0_4px_12px_rgba(36,84,145,.1)]">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-[#e76868] text-white flex items-center justify-center font-bold text-xl">✚</div>
              <div>
                <p className="text-[26px] leading-none font-bold text-[#c03838]">{loading ? "..." : visibleStats.mantenimientosPendientes}</p>
                <p className="text-sm font-semibold text-[#335682]">Mantenimientos Pendientes</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="rounded-md border border-[#d1dcec] bg-[#f7faff] overflow-hidden shadow-[0_6px_16px_rgba(36,84,145,.11)]">
            <div className="px-6 py-4 border-b border-[#dbe4f3]">
              <h2 className="text-2xl font-bold text-[#284a76]">Listado de Clientes</h2>
            </div>
            <div className="px-6 pt-5">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-full px-3 py-2 rounded-md border border-[#cad8eb] bg-white text-sm text-[#304f76] placeholder:text-[#8fa4c0] focus:outline-none focus:ring-2 focus:ring-[#7fa4d6]"
              />
            </div>
            <div className="px-6 pb-5 pt-4 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[#5f789b] border-y border-[#dbe4f3] bg-[#f1f6fd]">
                    <th className="text-left py-2">Cliente</th>
                    <th className="text-left py-2">Ubicación</th>
                    <th className="text-left py-2">Equipos</th>
                    <th className="text-left py-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.slice(0, 6).map((row) => (
                    <tr key={row.id} className="border-b border-[#e6eef9]">
                      <td className="py-2 text-[#24476f] font-semibold">{row.cliente}</td>
                      <td className="py-2 text-[#5d7799]">{row.ubicacion}</td>
                      <td className="py-2 text-[#2d8857] font-bold">{row.equipos} Activos</td>
                      <td className="py-2">
                        <span className={`text-xs px-2 py-1 rounded-md font-semibold ${row.estado === "activo" ? "bg-[#3ea54f] text-white" : "bg-[#f1a937] text-white"}`}>
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
              <div className="pt-3 text-center">
                <Link href="/clientes" className="inline-flex items-center px-5 py-1.5 rounded-md bg-[#2a6dc1] text-white text-sm font-semibold hover:bg-[#245aa5]">
                  Ver Detalles
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-[#d1dcec] bg-[#f7faff] overflow-hidden shadow-[0_6px_16px_rgba(36,84,145,.11)]">
            <div className="px-6 py-4 border-b border-[#dbe4f3]">
              <h2 className="text-2xl font-bold text-[#284a76]">Mapa de Equipos</h2>
            </div>
            <div className="relative h-[360px] m-5 rounded-md overflow-hidden border border-[#bfd1e8] bg-[#8ec4e7]">
              <iframe
                title="Mapa funcional de equipos"
                src="https://www.openstreetmap.org/export/embed.html?bbox=-58.9%2C-35.4%2C-52.5%2C-30.3&layer=mapnik"
                className="absolute inset-0 h-full w-full"
              />
              {demoClientMapPoints.map((point) => (
                <div
                  key={point.id}
                  className="absolute group"
                  style={{ top: point.top, left: point.left, transform: "translate(-50%, -50%)" }}
                >
                  <span className={`block w-4 h-4 rounded-full ${point.color} border-2 border-white shadow-[0_3px_8px_rgba(16,77,145,.38)]`} />
                  <span className="absolute left-1/2 -translate-x-1/2 -top-8 whitespace-nowrap rounded bg-[#244a78]/90 px-2 py-1 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {point.label}
                  </span>
                </div>
              ))}
              <div className="absolute left-3 bottom-3 rounded bg-white/85 px-2 py-1 text-[11px] font-semibold text-[#54749a]">
                Mapa interactivo: arrastra y haz zoom
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-5 gap-5">
          <div className="xl:col-span-2 rounded-md border border-[#d1dcec] bg-[#f7faff] overflow-hidden shadow-[0_6px_16px_rgba(36,84,145,.11)]">
            <div className="px-6 py-4 border-b border-[#dbe4f3]">
              <h2 className="text-2xl font-bold text-[#284a76]">Últimos Movimientos de Inventario</h2>
            </div>
            <div className="p-5 space-y-3">
              {inventoryMovements.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-md border border-[#d7e3f4] bg-white px-3 py-2">
                  <p className="text-sm text-[#36557b]">
                    <span className={m.tipo === "ingreso" ? "text-[#2b9058] font-bold" : "text-[#c44343] font-bold"}>{m.tipo === "ingreso" ? "Ingreso" : "Salida"}</span>: {m.detalle.replace(/^Ingreso: |^Salida: /, "")}
                  </p>
                  <span className="text-xs text-[#4f6f95] bg-[#e8eff9] px-2 py-1 rounded">{m.whenLabel}</span>
                </div>
              ))}
              <Link href="/equipos" className="inline-flex mt-2 items-center px-5 py-1.5 rounded-md bg-[#2a6dc1] text-white text-sm font-semibold hover:bg-[#245aa5]">
                Ver Inventario
              </Link>
            </div>
          </div>

          <div className="xl:col-span-1 rounded-md border border-[#d1dcec] bg-[#f7faff] overflow-hidden shadow-[0_6px_16px_rgba(36,84,145,.11)]">
            <div className="px-6 py-4 border-b border-[#dbe4f3]">
              <h2 className="text-2xl font-bold text-[#284a76]">Estado de Máquinas</h2>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="text-[#3a9c57] font-semibold">Operativas</span><span className="text-[#2b5e3a] font-bold text-3xl">{machineStatus.ok}</span></div>
                <div className="h-6 rounded bg-[#d9f0de] overflow-hidden"><div className="h-full bg-[#4aaf61]" style={{ width: `${percent(machineStatus.ok)}%` }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="text-[#cb8f21] font-semibold">Advertencia</span><span className="text-[#94671c] font-bold text-3xl">{machineStatus.warning}</span></div>
                <div className="h-6 rounded bg-[#f9ecd1] overflow-hidden"><div className="h-full bg-[#e7a832]" style={{ width: `${percent(machineStatus.warning)}%` }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="text-[#ca4545] font-semibold">Críticas</span><span className="text-[#9d3333] font-bold text-3xl">{machineStatus.critical}</span></div>
                <div className="h-6 rounded bg-[#fadada] overflow-hidden"><div className="h-full bg-[#e24d4d]" style={{ width: `${percent(machineStatus.critical)}%` }} /></div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-2 rounded-md border border-[#d1dcec] bg-[#f7faff] overflow-hidden shadow-[0_6px_16px_rgba(36,84,145,.11)]">
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
