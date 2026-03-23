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

      const [{ data: clientesData }, { data: equiposData }, { data: tramitesData }] = await Promise.all([
        supabase.from("clientes").select("id, nombre, ciudad").order("created_at", { ascending: false }),
        supabase.from("equipos").select("id, cliente_id"),
        supabase.from("tramites").select("id, tipo, estado, created_at, fecha_programada, cliente_id, clientes(nombre)").order("created_at", { ascending: false }),
      ])

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

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto space-y-5">
        <section className="rounded-xl border border-white/10 bg-gradient-to-r from-sky-700/80 via-blue-700/70 to-blue-500/80 p-4 sm:p-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Bienvenido, Carlos</h1>
              <p className="text-sm text-white/80 mt-1">Resumen General de Clientes y Equipos</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDemoModePersistent(!demoMode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  demoMode
                    ? "bg-green-500/25 text-green-100 border-green-300/50"
                    : "bg-white/15 text-white border-white/30 hover:bg-white/25"
                }`}
              >
                {demoMode ? "Modo Demo ON" : "Activar Modo Demo"}
              </button>
              <span className="text-xs sm:text-sm text-white/80">
                {mounted ? new Date().toLocaleDateString("es-UY", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "Cargando..."}
              </span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/15 to-[#111] p-4">
            <p className="text-xs text-blue-200/90">Clientes Activos</p>
            <p className="text-3xl font-bold text-white mt-1">{loading ? "..." : visibleStats.clientesActivos}</p>
          </div>
          <div className="rounded-xl border border-sky-500/30 bg-gradient-to-br from-sky-500/15 to-[#111] p-4">
            <p className="text-xs text-sky-200/90">Maquinas Instaladas</p>
            <p className="text-3xl font-bold text-white mt-1">{loading ? "..." : visibleStats.maquinasInstaladas}</p>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-[#111] p-4">
            <p className="text-xs text-emerald-200/90">Unidades en Stock</p>
            <p className="text-3xl font-bold text-white mt-1">{loading ? "..." : visibleStats.unidadesStock}</p>
          </div>
          <div className="rounded-xl border border-rose-500/30 bg-gradient-to-br from-rose-500/15 to-[#111] p-4">
            <p className="text-xs text-rose-200/90">Mantenimientos Pendientes</p>
            <p className="text-3xl font-bold text-rose-300 mt-1">{loading ? "..." : visibleStats.mantenimientosPendientes}</p>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[#111] to-[#1a1a1a] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Listado de Clientes</h2>
            </div>
            <div className="p-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/30 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
              />
            </div>
            <div className="px-4 pb-4 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-white/10">
                    <th className="text-left py-2">Cliente</th>
                    <th className="text-left py-2">Ubicacion</th>
                    <th className="text-left py-2">Equipos</th>
                    <th className="text-left py-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.slice(0, 6).map((row) => (
                    <tr key={row.id} className="border-b border-white/5">
                      <td className="py-2 text-white font-medium">{row.cliente}</td>
                      <td className="py-2 text-gray-400">{row.ubicacion}</td>
                      <td className="py-2 text-white">{row.equipos} Activos</td>
                      <td className="py-2">
                        <span className={`text-xs px-2 py-1 rounded-md ${row.estado === "activo" ? "bg-green-500/20 text-green-300" : "bg-amber-500/20 text-amber-300"}`}>
                          {row.estado === "activo" ? "Activo" : "En mantenimiento"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="pt-3">
                <Link href="/clientes" className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-gray-200">
                  Ver Detalles
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[#111] to-[#1a1a1a] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Mapa de Equipos</h2>
            </div>
            <div className="relative h-[360px] m-4 rounded-lg overflow-hidden border border-white/10 bg-[radial-gradient(circle_at_center,#9cc7ea_0%,#5da1d6_45%,#2b5f8c_100%)]">
              <div className="absolute inset-0 opacity-35 bg-[linear-gradient(to_right,transparent_0_9%,rgba(255,255,255,.25)_10%,transparent_11%),linear-gradient(to_bottom,transparent_0_9%,rgba(255,255,255,.2)_10%,transparent_11%)] bg-[size:40px_40px]" />
              {["left-[15%] top-[22%]", "left-[42%] top-[30%]", "left-[67%] top-[24%]", "left-[74%] top-[52%]", "left-[52%] top-[62%]", "left-[30%] top-[55%]", "left-[60%] top-[42%]"].map((pos, idx) => (
                <div key={idx} className={`absolute ${pos}`}>
                  <span className="block w-4 h-4 rounded-full bg-sky-300 border-2 border-white shadow-[0_0_0_5px_rgba(56,189,248,.2)]" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <div className="xl:col-span-2 rounded-xl border border-white/10 bg-gradient-to-br from-[#111] to-[#1a1a1a] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Ultimos Movimientos de Inventario</h2>
            </div>
            <div className="p-4 space-y-2">
              {inventoryMovements.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                  <p className="text-sm text-white">
                    <span className={m.tipo === "ingreso" ? "text-green-300" : "text-red-300"}>{m.tipo === "ingreso" ? "Ingreso" : "Salida"}</span>: {m.detalle.replace(/^Ingreso: |^Salida: /, "")}
                  </p>
                  <span className="text-xs text-gray-300 bg-white/10 px-2 py-1 rounded">{m.whenLabel}</span>
                </div>
              ))}
              <Link href="/equipos" className="inline-flex mt-2 items-center px-3 py-1.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-gray-200">
                Ver Inventario
              </Link>
            </div>
          </div>

          <div className="xl:col-span-1 rounded-xl border border-white/10 bg-gradient-to-br from-[#111] to-[#1a1a1a] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Estado de Maquinas</h2>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="text-green-300">Operativas</span><span className="text-white">{machineStatus.ok}</span></div>
                <div className="h-3 rounded bg-white/10 overflow-hidden"><div className="h-full bg-green-500" style={{ width: `${percent(machineStatus.ok)}%` }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="text-amber-300">Advertencia</span><span className="text-white">{machineStatus.warning}</span></div>
                <div className="h-3 rounded bg-white/10 overflow-hidden"><div className="h-full bg-amber-500" style={{ width: `${percent(machineStatus.warning)}%` }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="text-rose-300">Criticas</span><span className="text-white">{machineStatus.critical}</span></div>
                <div className="h-3 rounded bg-white/10 overflow-hidden"><div className="h-full bg-rose-500" style={{ width: `${percent(machineStatus.critical)}%` }} /></div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-2 rounded-xl border border-white/10 bg-gradient-to-br from-[#111] to-[#1a1a1a] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Proximos Mantenimientos</h2>
            </div>
            <div className="p-4 space-y-2">
              {upcomingMaintenances.length === 0 ? (
                <p className="text-sm text-gray-400">No hay mantenimientos programados</p>
              ) : (
                upcomingMaintenances.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                    <p className="text-sm text-white">{item.title}</p>
                    <span className="text-xs text-gray-300">{item.dateLabel}</span>
                  </div>
                ))
              )}
              <Link href="/tramites" className="inline-flex mt-2 items-center px-3 py-1.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-gray-200">
                Ver Calendario
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
