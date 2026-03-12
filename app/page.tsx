"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import NotificationSettings from "@/components/NotificationSettings"

type ActivityItem = {
  id: number
  type: string
  description: string
  date: string
  status: string
}

type UpcomingTramite = {
  id: number
  equipo: string
  cliente: string
  fecha: string
  tipo: string
  estado: string
}

export default function Home() {
  const [stats, setStats] = useState({ equipos: 0, mantenimientos: 0, clientes: 0, pendientes: 0 })
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [upcomingTramites, setUpcomingTramites] = useState<UpcomingTramite[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

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
      const allTramites = tramitesRes.data || []
      const mantenimientos = allTramites.filter(t => t.tipo === "mantenimiento").length
      const pendientes = allTramites.filter(t => t.estado === "pendiente").length

      setStats({
        equipos: totalEquipos,
        mantenimientos,
        clientes: totalClientes,
        pendientes
      })

      // Recent Activity (últimos 5 items)
      const activity = allTramites.slice(0, 5).map(t => ({
        id: t.id,
        type: t.tipo,
        description: `${t.tipo === "mantenimiento" ? "🔧" : "💰"} ${t.equipos?.marca || ""} ${t.equipos?.modelo || ""} - ${t.clientes?.nombre || "Sin cliente"}`,
        date: new Date(t.created_at).toLocaleDateString("es-UY"),
        status: t.estado
      }))
      setRecentActivity(activity)

      // Upcoming Tramites (próximos 7 días)
      const today = new Date()
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      
      const upcoming = allTramites
        .filter(t => {
          if (!t.fecha_programada) return false
          const fechaTramite = new Date(t.fecha_programada)
          return fechaTramite >= today && fechaTramite <= nextWeek && t.estado !== "completado" && t.estado !== "cancelado"
        })
        .slice(0, 4)
        .map(t => ({
          id: t.id,
          equipo: `${t.equipos?.marca || ""} ${t.equipos?.modelo || ""}`,
          cliente: t.clientes?.nombre || "Sin cliente",
          fecha: new Date(t.fecha_programada).toLocaleDateString("es-UY"),
          tipo: t.tipo,
          estado: t.estado
        }))

      setUpcomingTramites(upcoming)
    } catch (error) {
      console.error("Error cargando dashboard:", error)
    } finally {
      setLoading(false)
    }
  }
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
          <div className="text-sm text-gray-500">
            {mounted ? new Date().toLocaleDateString("es-UY", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "Cargando..."}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Equipos Card */}
          <div className="relative group cursor-pointer">
            {/* Decorative background shape */}
            <div className="absolute -inset-1 bg-gradient-to-br from-blue-500/30 via-blue-600/20 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            
            <div className="relative bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#1a1a1a] rounded-3xl p-6 border border-white/5 hover:border-blue-500/30 transition-all duration-300 overflow-hidden h-full">
              {/* Animated corner accent */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-transparent rounded-bl-[60px] opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Icon circle */}
              <div className="relative mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/40 group-hover:shadow-blue-500/60 group-hover:scale-110 transition-all duration-300 rotate-3 group-hover:rotate-6">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
              </div>

              {/* Content */}
              <div className="relative">
                <p className="text-5xl font-bold text-white mb-2 tracking-tight group-hover:text-blue-100 transition-colors duration-300">{loading ? "..." : stats.equipos}</p>
                <p className="text-sm text-gray-400 font-medium tracking-wide uppercase">Total Equipos</p>
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-blue-500/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            </div>
          </div>

          {/* Clientes Card */}
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-br from-purple-500/30 via-purple-600/20 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            
            <div className="relative bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#1a1a1a] rounded-3xl p-6 border border-white/5 hover:border-purple-500/30 transition-all duration-300 overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-transparent rounded-bl-[60px] opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/40 group-hover:shadow-purple-500/60 group-hover:scale-110 transition-all duration-300 rotate-3 group-hover:rotate-6">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>

              <div className="relative">
                <p className="text-5xl font-bold text-white mb-2 tracking-tight group-hover:text-purple-100 transition-colors duration-300">{loading ? "..." : stats.clientes}</p>
                <p className="text-sm text-gray-400 font-medium tracking-wide uppercase">Clientes Activos</p>
              </div>

              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-purple-500/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            </div>
          </div>

          {/* Mantenimientos Card */}
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-br from-green-500/30 via-green-600/20 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            
            <div className="relative bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#1a1a1a] rounded-3xl p-6 border border-white/5 hover:border-green-500/30 transition-all duration-300 overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/20 to-transparent rounded-bl-[60px] opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/40 group-hover:shadow-green-500/60 group-hover:scale-110 transition-all duration-300 rotate-3 group-hover:rotate-6">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <div className="relative">
                <p className="text-5xl font-bold text-white mb-2 tracking-tight group-hover:text-green-100 transition-colors duration-300">{loading ? "..." : stats.mantenimientos}</p>
                <p className="text-sm text-gray-400 font-medium tracking-wide uppercase">Mantenimientos</p>
              </div>

              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-500/0 via-green-500/50 to-green-500/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            </div>
          </div>

          {/* Pendientes Card */}
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-br from-amber-500/30 via-amber-600/20 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            
            <div className="relative bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#1a1a1a] rounded-3xl p-6 border border-white/5 hover:border-amber-500/30 transition-all duration-300 overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/20 to-transparent rounded-bl-[60px] opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/40 group-hover:shadow-amber-500/60 group-hover:scale-110 transition-all duration-300 rotate-3 group-hover:rotate-6">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <div className="relative">
                <p className="text-5xl font-bold text-amber-400 mb-2 tracking-tight group-hover:text-amber-300 transition-colors duration-300">{loading ? "..." : stats.pendientes}</p>
                <p className="text-sm text-gray-400 font-medium tracking-wide uppercase">Trámites Pendientes</p>
              </div>

              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500/0 via-amber-500/50 to-amber-500/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Left Column - Activity + Upcoming */}
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
              
              {loading ? (
                <div className="text-center py-8 text-gray-500">Cargando...</div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No hay actividad reciente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
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

            {/* Upcoming Tramites */}
            <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-5 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Próximos 7 Días
                </h2>
              </div>
              
              {loading ? (
                <div className="text-center py-8 text-gray-500">Cargando...</div>
              ) : upcomingTramites.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No hay trámites programados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingTramites.map((tramite) => (
                    <div key={tramite.id} className="p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/20 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">{tramite.equipo}</p>
                          <p className="text-xs text-gray-400">{tramite.cliente}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-semibold text-white">{tramite.fecha}</p>
                          <p className="text-xs text-gray-500">{tramite.tipo === "mantenimiento" ? "🔧 Mant." : "💰 Abono"}</p>
                        </div>
                      </div>
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
