"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthSession } from "@/lib/useAuthSession"
import { useDemoMode } from "@/lib/useDemoMode"
import { DEMO_CLIENTES, DEMO_EQUIPOS, DEMO_STATS, DEMO_TRAMITES } from "@/lib/demoData"
import PageHeader from "@/components/PageHeader"

type Service = {
  id: string | number
  tipo?: string
  estado?: string
  created_at?: string
  fecha_programada?: string
  cliente_id?: string
  equipo_id?: string
  clientes?: { nombre?: string } | Array<{ nombre?: string }>
  equipos?: { marca?: string; modelo?: string } | Array<{ marca?: string; modelo?: string }>
}

type Equipment = { id: string | number; marca?: string; modelo?: string; cliente_id?: string; created_at?: string }
type Client = { id: string | number; nombre?: string; created_at?: string }
type Part = { id: string | number; stock_actual?: number; created_at?: string }

const iconPaths = {
  equipment: <><path d="M5 5h14v4H5z" /><path d="M7 9v10m10-10v10M9 13h6m-3-4v8" /></>,
  users: <><path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20" /><circle cx="9.5" cy="7" r="3" /><path d="M16 4.5a3 3 0 0 1 0 5.8m2 10V19a4 4 0 0 0-2.4-3.7" /></>,
  alert: <><path d="m12 3 9 17H3L12 3Z" /><path d="M12 9v4m0 3h.01" /></>,
  boxes: <><path d="m12 2 7 4v8l-7 4-7-4V6l7-4Z" /><path d="m5 6 7 4 7-4M12 10v8" /><path d="m19 11 3 1.7v5.6L17 21l-3-1.7" /></>,
  bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  qr: <><path d="M4 4h5v5H4zM15 4h5v5h-5zM4 15h5v5H4zM15 15h2m3 0v2m-5 3h2m1-3h2v3" /></>,
  wrench: <><path d="M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.7 2.1-2.1-2.1 1.8-3Z" /></>,
  chart: <><path d="M4 19h16" /><path d="M7 16v-4m5 4V7m5 9v-7" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
}

function Icon({ name, className = "" }: { name: keyof typeof iconPaths; className?: string }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>{iconPaths[name]}</svg>
}

function clientName(service: Service, clients: Client[]) {
  const joined = Array.isArray(service.clientes) ? service.clientes[0] : service.clientes
  return joined?.nombre || clients.find((client) => String(client.id) === String(service.cliente_id))?.nombre || "Cliente sin asignar"
}

function equipmentName(service: Service, equipment: Equipment[]) {
  const joined = Array.isArray(service.equipos) ? service.equipos[0] : service.equipos
  if (joined?.marca || joined?.modelo) return `${joined.marca || "Equipo"} ${joined.modelo || ""}`.trim()
  const found = equipment.find((item) => String(item.id) === String(service.equipo_id))
  return found ? `${found.marca || "Equipo"} ${found.modelo || ""}`.trim() : "Equipo sin identificar"
}

function relativeDate(value?: string) {
  if (!value) return "Recientemente"
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000))
  if (days === 0) return "Hoy"
  if (days === 1) return "Ayer"
  if (days < 7) return `Hace ${days} días`
  if (days < 14) return "Hace 1 semana"
  return `Hace ${Math.floor(days / 7)} semanas`
}

function statusMeta(status?: string) {
  if (status === "completado") return { label: "Operativo", dot: "bg-emerald-500", chip: "bg-emerald-100 text-emerald-700" }
  if (status === "en_proceso") return { label: "Requiere mantenimiento", dot: "bg-orange-500", chip: "bg-orange-100 text-orange-700" }
  if (status === "cancelado") return { label: "Fuera de servicio", dot: "bg-red-600", chip: "bg-red-100 text-red-700" }
  return { label: "Requiere mantenimiento", dot: "bg-orange-500", chip: "bg-orange-100 text-orange-700" }
}

function monthlyCounts<T>(items: T[], getDate: (item: T) => string | undefined, months: number) {
  const now = new Date()
  return Array.from({ length: months }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - months + 1 + index, 1)
    const count = items.filter((item) => {
      const value = getDate(item)
      if (!value) return false
      const itemDate = new Date(value)
      return itemDate.getMonth() === date.getMonth() && itemDate.getFullYear() === date.getFullYear()
    }).length
    return { label: date.toLocaleDateString("es-UY", { month: "short" }).replace(".", ""), count }
  })
}

function Sparkline({ values, labels, id }: { values: number[]; labels: string[]; id: string }) {
  const max = Math.max(1, ...values)
  const width = 170
  const graphBottom = 35
  const points = values.map((value, index) => {
    const x = (index / Math.max(1, values.length - 1)) * (width - 8) + 4
    const y = graphBottom - (value / max) * 30
    return { x, y, value }
  })
  const path = points.map(({ x, y }, index) => {
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(" ")
  const areaPath = `${path} L${points.at(-1)?.x ?? width - 4} ${graphBottom} L${points[0]?.x ?? 4} ${graphBottom} Z`
  const gradientId = `metric-gradient-${id}`
  return <div className="mt-4 max-w-[170px] text-current"><svg role="img" aria-label={`Registros mensuales: ${values.join(", ")}`} className="h-11 w-full overflow-visible" viewBox={`0 0 ${width} 44`} fill="none"><defs><linearGradient id={gradientId} x1="0" x2="0" y1="5" y2={graphBottom} gradientUnits="userSpaceOnUse"><stop stopColor="currentColor" stopOpacity=".24" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs><path d={`M4 ${graphBottom}H${width - 4}`} stroke="currentColor" strokeOpacity=".15" strokeDasharray="3 4" /><path d={areaPath} fill={`url(#${gradientId})`} /><path d={path} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />{points.map(({ x, y, value }, index) => <circle key={`${labels[index]}-${index}`} cx={x} cy={y} r="2.8" fill="white" stroke="currentColor" strokeWidth="1.8"><title>{`${labels[index]}: ${value}`}</title></circle>)}</svg><div className="mt-0.5 grid grid-flow-col auto-cols-fr text-[10px] font-medium text-slate-400">{labels.map((label) => <span className="text-center" key={label}>{label}</span>)}</div></div>
}

export default function Home() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [stats, setStats] = useState({ equipment: 0, clients: 0, pending: 0, components: 0 })
  const [services, setServices] = useState<Service[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [parts, setParts] = useState<Part[]>([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [chartRange, setChartRange] = useState(6)
  const [chartRenderKey, setChartRenderKey] = useState(0)
  const { displayName, permissions } = useAuthSession()
  const { demoMode } = useDemoMode()

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      if (demoMode) {
        setEquipment(DEMO_EQUIPOS)
        setClients(DEMO_CLIENTES)
        setServices(DEMO_TRAMITES)
        setParts([])
        setStats({ equipment: DEMO_STATS.equipos, clients: DEMO_STATS.clientes, pending: DEMO_STATS.pendientes, components: Math.max(3, Math.round(DEMO_STATS.equipos * 0.1)) })
        return
      }

      const empty = { data: [], error: null }
      const canEquipos = permissions?.equipos !== false
      const canClientes = permissions?.clientes !== false
      const canTramites = permissions?.tramites !== false
      const canRepuestos = permissions?.repuestos !== false
      const [equipmentRes, clientsRes, servicesRes, partsRes] = await Promise.all([
        canEquipos ? supabase.from("equipos").select("id, marca, modelo, cliente_id, created_at") : Promise.resolve(empty),
        canClientes ? supabase.from("clientes").select("id, nombre, created_at") : Promise.resolve(empty),
        canTramites ? supabase.from("tramites").select("id, tipo, estado, created_at, fecha_programada, cliente_id, equipo_id, clientes(nombre), equipos(marca, modelo)").order("created_at", { ascending: false }) : Promise.resolve(empty),
        canRepuestos ? supabase.from("repuestos").select("id, stock_actual, created_at") : Promise.resolve(empty),
      ])
      if (equipmentRes.error || clientsRes.error || servicesRes.error || partsRes.error) throw new Error("sync")

      const realEquipment = (equipmentRes.data || []) as Equipment[]
      const realClients = (clientsRes.data || []) as Client[]
      const realServices = (servicesRes.data || []) as Service[]
      const realParts = (partsRes.data || []) as Part[]
      const components = realParts.filter((part) => Number(part.stock_actual || 0) <= 3).length
      setEquipment(realEquipment)
      setClients(realClients)
      setServices(realServices)
      setParts(realParts)
      setStats({
        equipment: realEquipment.length,
        clients: realClients.length,
        pending: realServices.filter((service) => service.tipo === "mantenimiento" && ["pendiente", "en_proceso"].includes(service.estado || "")).length,
        components,
      })
    } catch {
      setError("No se pudo sincronizar el resumen. Revisa la conexión con Supabase.")
      setEquipment([]); setClients([]); setServices([]); setParts([]); setStats({ equipment: 0, clients: 0, pending: 0, components: 0 })
    } finally { setLoading(false) }
  }, [demoMode, permissions])

  useEffect(() => { loadDashboard() }, [loadDashboard])

  useEffect(() => {
    if (pathname !== "/") return

    const refreshChart = () => setChartRenderKey((current) => current + 1)
    const frame = window.requestAnimationFrame(refreshChart)
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshChart()
    }

    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [pathname, chartRange, services.length])

  const maintenance = useMemo(() => services.filter((service) => service.tipo === "mantenimiento" && ["pendiente", "en_proceso"].includes(service.estado || "")).sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 3), [services])
  const activity = useMemo(() => services.slice(0, 5), [services])
  const chart = useMemo(() => monthlyCounts(services.filter((service) => service.estado === "completado"), (service) => service.fecha_programada || service.created_at, chartRange), [chartRange, services])
  const maxChart = Math.max(1, ...chart.map((item) => item.count))
  const trends = useMemo(() => ({
    equipment: monthlyCounts(equipment, (item) => item.created_at, 6).map((item) => item.count),
    clients: monthlyCounts(clients, (item) => item.created_at, 6).map((item) => item.count),
    maintenance: monthlyCounts(services.filter((item) => item.tipo === "mantenimiento" && ["pendiente", "en_proceso"].includes(item.estado || "")), (item) => item.created_at, 6).map((item) => item.count),
    components: monthlyCounts(parts.filter((item) => Number(item.stock_actual || 0) <= 3), (item) => item.created_at, 6).map((item) => item.count),
  }), [clients, equipment, parts, services])
  const trendLabels = useMemo(() => monthlyCounts([], () => undefined, 6).map((item) => item.label), [])

  const metrics = [
    { label: "Equipos registrados", value: stats.equipment, icon: "equipment" as const, tone: "text-blue-600 border-blue-600", note: "Equipos en operación", noteTone: "text-blue-600", trend: trends.equipment },
    { label: "Clientes activos", value: stats.clients, icon: "users" as const, tone: "text-blue-500 border-blue-300", note: "Sin cambios", noteTone: "text-slate-500", trend: trends.clients },
    { label: "Mantenimientos pendientes", value: stats.pending, icon: "alert" as const, tone: "text-orange-500 border-orange-300", note: "Requieren atención", noteTone: "text-orange-600", trend: trends.maintenance },
    { label: "Componentes críticos", value: stats.components, icon: "boxes" as const, tone: "text-red-600 border-red-600", note: "Requieren reposición", noteTone: "text-red-600", trend: trends.components },
  ]

  return (
    <div className="mx-auto max-w-[1380px] px-5 py-6 text-slate-900 sm:px-7 lg:px-8 lg:py-8">
      <PageHeader
        title={<>¡Bienvenido, {displayName || "usuario"}!</>}
        description="Aquí tienes un resumen actualizado de tu operación."
        actions={<><button type="button" aria-label="Notificaciones en preparación" onClick={() => setNotificationsOpen(true)} className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm transition hover:bg-slate-50"><Icon name="bell" className="h-5 w-5" /></button><Link href="/escanear-qr" className="hidden h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold shadow-sm transition hover:bg-slate-50 sm:flex"><Icon name="qr" className="h-5 w-5" />Escanear QR</Link></>}
      />

      {notificationsOpen && <div className="mb-7 flex items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-900"><div><p className="font-bold">Centro de notificaciones <span className="ml-2 rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">WIP</span></p><p className="mt-1 text-blue-700">Preparado para alertas de equipos fuera de servicio, mantenimientos próximos y falta de stock.</p></div><button type="button" onClick={() => setNotificationsOpen(false)} className="font-semibold text-blue-700">Cerrar</button></div>}

      {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <section className="grid gap-5 border-b border-slate-200 pb-7 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article key={metric.label} className="min-w-0">
            <div className="flex items-center gap-4">
              <div className={`grid h-[76px] w-[76px] shrink-0 place-items-center rounded-full border-[3px] bg-white shadow-[inset_0_0_0_7px_rgba(248,250,252,.95),0_8px_18px_rgba(15,23,42,.04)] ${metric.tone}`}><Icon name={metric.icon} className="h-7 w-7" /></div>
              <div className="min-w-0">
                <p className="text-[34px] font-bold leading-none tracking-[-.05em]">{loading ? "–" : metric.value}</p>
                <p className="mt-1.5 text-[13px] font-semibold text-slate-600">{metric.label}</p>
                <p className={`mt-3 text-xs font-semibold ${metric.noteTone}`}>{metric.note}</p>
              </div>
            </div>
            <div className={metric.tone.split(" ")[0]}><Sparkline values={metric.trend} labels={trendLabels} id={metric.icon} /></div>
          </article>
        ))}
      </section>

      <div className="grid xl:grid-cols-[1.16fr_.94fr]">
        <div className="py-6 pr-0 xl:pr-6">
          <section>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="flex gap-3"><Icon name="alert" className="mt-0.5 h-5 w-5 text-orange-500" /><div><h2 className="text-xl font-bold tracking-[-.03em]">Mantenimientos pendientes</h2><p className="mt-1 text-sm font-medium text-slate-500">Equipos que superaron su intervalo de servicio.</p></div></div>
              <Link href="/tramites" className="whitespace-nowrap text-sm font-bold text-blue-600">Ver todos <span className="text-xl leading-none">›</span></Link>
            </div>
            <div className="space-y-2.5">
              {maintenance.length ? maintenance.map((service) => {
                const waitingDays = service.fecha_programada ? Math.max(1, Math.floor((Date.now() - new Date(service.fecha_programada).getTime()) / 86400000)) : 0
                return <Link href={`/tramites/${service.id}`} key={service.id} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_5px_16px_rgba(15,23,42,.025)] transition hover:border-blue-200">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500"><Icon name="equipment" className="h-7 w-7" /></div>
                  <div className="min-w-0 flex-1"><p className="truncate font-bold">{equipmentName(service, equipment)}</p><p className="mt-1 truncate text-sm text-slate-500">{clientName(service, clients)} · {service.equipo_id || "Equipo"}</p></div>
                  <div className="hidden text-right sm:block"><p className="font-bold text-orange-600">{waitingDays} días</p><p className="mt-1 text-xs text-slate-500">sin mantenimiento</p></div>
                  <span className={`hidden rounded-full px-3 py-1 text-xs font-bold md:inline ${service.estado === "en_proceso" ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"}`}>{service.estado === "en_proceso" ? "Media" : "Alta"}</span><Icon name="chevron" className="h-5 w-5 text-slate-500" />
                </Link>
              }) : <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">No hay mantenimientos pendientes.</div>}
            </div>
          </section>

          <section className="mt-6 border-t border-slate-200 pt-6">
            <div className="mb-6 flex items-start justify-between gap-3"><div className="flex gap-3"><Icon name="chart" className="mt-0.5 h-5 w-5 text-blue-600" /><div><h2 className="text-xl font-bold tracking-[-.03em]">Servicios completados</h2><p className="mt-1 text-sm font-medium text-slate-500">Cantidad de servicios realizados por mes.</p></div></div><select aria-label="Periodo del gráfico" value={chartRange} onChange={(event) => setChartRange(Number(event.target.value))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 outline-none focus:border-blue-500"><option value={6}>Últimos 6 meses</option><option value={12}>Últimos 12 meses</option></select></div>
            <div key={chartRenderKey} className="flex h-36 items-end gap-3 border-b border-slate-200 px-4 pt-3 sm:gap-6">
              {chart.map((item) => <div key={item.label} className="flex h-full flex-1 flex-col justify-end gap-2 text-center"><div className="mx-auto w-full max-w-10 rounded-t-md bg-gradient-to-t from-blue-300 to-blue-400" style={{ height: `${Math.max(item.count ? 20 : 6, (item.count / maxChart) * 110)}px` }} title={`${item.count} servicios`} /><span className="pb-2 text-xs text-slate-500">{item.label}</span></div>)}
            </div>
          </section>
        </div>

        <section className="border-t border-slate-200 py-6 xl:border-l xl:border-t-0 xl:pl-7">
          <div className="mb-7 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><Icon name="wrench" className="h-6 w-6 text-blue-600" /><h2 className="text-xl font-bold tracking-[-.03em]">Actividad reciente</h2></div><Link href="/tramites" className="text-sm font-bold text-blue-600">Ver todo el historial</Link></div>
          <div className="relative space-y-0 before:absolute before:bottom-5 before:left-[5px] before:top-5 before:w-px before:bg-slate-200">
            {activity.length ? activity.map((service) => { const state = statusMeta(service.estado); return <Link href={`/tramites/${service.id}`} key={service.id} className="relative flex gap-4 border-b border-slate-200 py-5 first:pt-2 last:border-0"><span className={`relative z-10 mt-1.5 h-3 w-3 shrink-0 rounded-full ring-4 ring-white ${state.dot}`} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1"><p className="text-sm font-medium text-slate-500">{relativeDate(service.created_at)}</p><span className={`rounded-full px-3 py-1 text-xs font-bold ${state.chip}`}>{state.label}</span></div><p className="mt-2 font-bold text-slate-900">{service.equipo_id || "Servicio"}</p><p className="mt-1 text-sm text-slate-500">{service.tipo === "mantenimiento" ? "Mantenimiento" : "Servicio"} · {clientName(service, clients)}</p></div><Icon name="chevron" className="mt-7 h-5 w-5 shrink-0 text-slate-500" /></Link> }) : <p className="py-10 text-center text-sm text-slate-500">Todavía no hay actividad para mostrar.</p>}
          </div>
        </section>
      </div>
    </div>
  )
}
