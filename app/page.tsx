"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import NotificationSettings from "@/components/NotificationSettings"
import DashboardCharts from "@/components/DashboardCharts"

type ActivityItem = {
  id: number
  type: string
  description: string
  date: string
  status: string
}

type Tramite = {
  id: number
  tipo: string
  estado: string
  created_at: string
  [key: string]: any
}

const DEMO_TRAMITES: Tramite[] = [
  { id: 9001, tipo: "mantenimiento", estado: "completado", created_at: "2026-01-08T10:00:00.000Z" },
  { id: 9002, tipo: "mantenimiento", estado: "pendiente", created_at: "2026-01-16T15:20:00.000Z" },
  { id: 9003, tipo: "abono", estado: "completado", created_at: "2026-01-22T12:40:00.000Z" },
  { id: 9004, tipo: "mantenimiento", estado: "en_proceso", created_at: "2026-02-03T09:10:00.000Z" },
  { id: 9005, tipo: "abono", estado: "pendiente", created_at: "2026-02-10T18:05:00.000Z" },
  { id: 9006, tipo: "mantenimiento", estado: "completado", created_at: "2026-02-19T14:30:00.000Z" },
  { id: 9007, tipo: "abono", estado: "completado", created_at: "2026-02-26T11:00:00.000Z" },
  { id: 9008, tipo: "mantenimiento", estado: "pendiente", created_at: "2026-03-02T16:10:00.000Z" },
  { id: 9009, tipo: "abono", estado: "en_proceso", created_at: "2026-03-06T13:15:00.000Z" },
  { id: 9010, tipo: "mantenimiento", estado: "pendiente", created_at: "2026-03-09T10:25:00.000Z" },
  { id: 9011, tipo: "abono", estado: "cancelado", created_at: "2026-03-10T19:30:00.000Z" },
  { id: 9012, tipo: "mantenimiento", estado: "completado", created_at: "2026-03-12T08:45:00.000Z" }
]

const DEMO_ACTIVITY: ActivityItem[] = [
  { id: 9012, type: "mantenimiento", description: "🔧 Daikin Inverter 12000 - Hotel Central", date: "12/03/2026", status: "completado" },
  { id: 9010, type: "mantenimiento", description: "🔧 Samsung Windfree - Clínica Norte", date: "09/03/2026", status: "pendiente" },
  { id: 9009, type: "abono", description: "💰 Pago mensual - Residencial Atlántida", date: "06/03/2026", status: "en_proceso" },
  { id: 9008, type: "mantenimiento", description: "🔧 Midea Xtreme Save - Oficina Delta", date: "02/03/2026", status: "pendiente" },
  { id: 9007, type: "abono", description: "💰 Abono acordado - Edificio Arena", date: "26/02/2026", status: "completado" }
]

const DEMO_STATS = {
  equipos: 32,
  mantenimientos: 18,
  clientes: 21,
  pendientes: 6
}

export default function Home() {
  const [stats, setStats] = useState({ equipos: 0, mantenimientos: 0, clientes: 0, pendientes: 0 })
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [allTramites, setAllTramites] = useState<Tramite[]>([])
  const [showMobileAnalytics, setShowMobileAnalytics] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [demoMode, setDemoMode] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      const [equiposRes, clientesRes, tramitesRes] = await Promise.all([
        supabase.from("equipos").select("*", { count: "exact" }),
        supabase.from("clientes").select("*", { count: "exact" }),
        supabase.from("tramites").select("*, equipos(modelo, marca), clientes(nombre)").order("created_at", { ascending: false })
      ])

      // Stats
      const totalEquipos = equiposRes.count || 0
      const totalClientes = clientesRes.count || 0
      const tramitesData = tramitesRes.data || []
      const mantenimientos = tramitesData.filter(t => t.tipo === "mantenimiento").length
      const pendientes = tramitesData.filter(t => t.estado === "pendiente").length

      setStats({
        equipos: totalEquipos,
        mantenimientos,
        clientes: totalClientes,
        pendientes
      })

      setAllTramites(tramitesData)

      // Recent Activity (últimos 5 items)
      const activity = tramitesData.slice(0, 5).map(t => ({
        id: t.id,
        type: t.tipo,
        description: `${t.tipo === "mantenimiento" ? "🔧" : "💰"} ${t.equipos?.marca || ""} ${t.equipos?.modelo || ""} - ${t.clientes?.nombre || "Sin cliente"}`,
        date: new Date(t.created_at).toLocaleDateString("es-UY"),
        status: t.estado
      }))
      setRecentActivity(activity)
    } catch (error) {
      console.error("Error cargando dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const visibleStats = demoMode ? DEMO_STATS : stats
  const visibleActivity = demoMode ? DEMO_ACTIVITY : recentActivity
  const visibleTramites = demoMode ? DEMO_TRAMITES : allTramites

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Hero Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl">
              <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              <p className="text-sm text-gray-400">Resumen general del sistema</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDemoMode((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                demoMode
                  ? "bg-green-500/20 text-green-300 border-green-500/40"
                  : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
              }`}
            >
              {demoMode ? "Modo Demo ON" : "Activar Modo Demo"}
            </button>
            <div className="text-sm text-gray-500">
              {mounted ? new Date().toLocaleDateString("es-UY", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "Cargando..."}
            </div>
          </div>
        </div>

        {/* Menú de analíticas en móvil */}
        <div className="md:hidden mb-6">
          <button
            onClick={() => setShowMobileAnalytics(!showMobileAnalytics)}
            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-gradient-to-br from-[#111] to-[#1a1a1a] text-left flex items-center justify-between"
          >
            <span className="text-sm font-semibold text-white">Menú de estadísticas</span>
            <span className="text-xs text-gray-400">{showMobileAnalytics ? "Ocultar" : "Ver"}</span>
          </button>

          {showMobileAnalytics && (
            <div className="mt-3 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-blue-500/10 via-[#111] to-[#1a1a1a] rounded-xl p-4 border border-blue-500/20">
                  <p className="text-xs text-blue-300/80">Equipos</p>
                  <p className="text-2xl font-bold text-white">{loading && !demoMode ? "..." : visibleStats.equipos}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/10 via-[#111] to-[#1a1a1a] rounded-xl p-4 border border-purple-500/20">
                  <p className="text-xs text-purple-300/80">Clientes</p>
                  <p className="text-2xl font-bold text-white">{loading && !demoMode ? "..." : visibleStats.clientes}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500/10 via-[#111] to-[#1a1a1a] rounded-xl p-4 border border-green-500/20">
                  <p className="text-xs text-green-300/80">Mantenimientos</p>
                  <p className="text-2xl font-bold text-white">{loading && !demoMode ? "..." : visibleStats.mantenimientos}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500/10 via-[#111] to-[#1a1a1a] rounded-xl p-4 border border-amber-500/30">
                  <p className="text-xs text-amber-300/80">Pendientes</p>
                  <p className="text-2xl font-bold text-amber-400">{loading && !demoMode ? "..." : visibleStats.pendientes}</p>
                </div>
              </div>
              <DashboardCharts tramites={visibleTramites} />
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500/10 via-[#111] to-[#1a1a1a] rounded-2xl p-5 border border-blue-500/20">
            <p className="text-sm text-blue-300/80 font-medium mb-1">Total Equipos</p>
            <p className="text-4xl font-bold text-white">{loading && !demoMode ? "..." : visibleStats.equipos}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 via-[#111] to-[#1a1a1a] rounded-2xl p-5 border border-purple-500/20">
            <p className="text-sm text-purple-300/80 font-medium mb-1">Clientes Activos</p>
            <p className="text-4xl font-bold text-white">{loading && !demoMode ? "..." : visibleStats.clientes}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500/10 via-[#111] to-[#1a1a1a] rounded-2xl p-5 border border-green-500/20">
            <p className="text-sm text-green-300/80 font-medium mb-1">Mantenimientos</p>
            <p className="text-4xl font-bold text-white">{loading && !demoMode ? "..." : visibleStats.mantenimientos}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500/10 via-[#111] to-[#1a1a1a] rounded-2xl p-5 border border-amber-500/30">
            <p className="text-sm text-amber-300/80 font-medium mb-1">Trámites Pendientes</p>
            <p className="text-4xl font-bold text-amber-400">{loading && !demoMode ? "..." : visibleStats.pendientes}</p>
          </div>
        </div>

        <div className="hidden md:block mb-8">
          <DashboardCharts tramites={visibleTramites} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Left Column - Activity */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Recent Activity */}
            <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-5 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Actividad Reciente
                </h2>
                <a href="/tramites" className="text-xs text-gray-400 hover:text-white transition-colors">Ver todo →</a>
              </div>
              
              {loading && !demoMode ? (
                <div className="text-center py-8 text-gray-500">Cargando...</div>
              ) : visibleActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No hay actividad reciente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        activity.status === "completado" ? "bg-green-500" :
                        activity.status === "en_proceso" ? "bg-blue-500" :
                        activity.status === "pendiente" ? "bg-yellow-500" :
                        "bg-red-500"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{activity.description}</p>
                        <p className="text-xs text-gray-500">{activity.date}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                        activity.status === "completado" ? "bg-green-500/20 text-green-400" :
                        activity.status === "en_proceso" ? "bg-blue-500/20 text-blue-400" :
                        activity.status === "pendiente" ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-red-500/20 text-red-400"
                      }`}>
                        {activity.status === "completado" ? "Completado" :
                         activity.status === "en_proceso" ? "En Proceso" :
                         activity.status === "pendiente" ? "Pendiente" :
                         "Cancelado"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column - Quick Actions + Notifications */}
          <div className="space-y-6">
            
            {/* Notification Settings */}
            <NotificationSettings />

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-5 border border-white/10">
              <h2 className="text-lg font-bold text-white mb-4">Acciones Rápidas</h2>
              <div className="space-y-3">
                <a href="/equipos/nuevo" className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                  <div className="p-2 bg-white rounded-lg group-hover:scale-110 transition-transform">
                    <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="font-semibold text-white text-sm">Nuevo Equipo</span>
                </a>

                <a href="/tramites" className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                  <div className="p-2 bg-white rounded-lg group-hover:scale-110 transition-transform">
                    <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <span className="font-semibold text-white text-sm">Gestionar Trámites</span>
                </a>

                <a href="/equipos" className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                  <div className="p-2 bg-white rounded-lg group-hover:scale-110 transition-transform">
                    <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-white text-sm">Ver Equipos</span>
                </a>

                <a href="/clientes" className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                  <div className="p-2 bg-white rounded-lg group-hover:scale-110 transition-transform">
                    <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-white text-sm">Base de Clientes</span>
                </a>
              </div>
            </div>

            {/* Stock Preview */}
            <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-5 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Stock Rápido
                </h2>
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">WIP</span>
              </div>
              <div className="space-y-3 opacity-50">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-sm text-gray-400">Filtros</span>
                  <span className="text-sm font-semibold text-gray-400">-</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-sm text-gray-400">Gas Refrigerante</span>
                  <span className="text-sm font-semibold text-gray-400">-</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-sm text-gray-400">Repuestos</span>
                  <span className="text-sm font-semibold text-gray-400">-</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">Módulo en desarrollo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
