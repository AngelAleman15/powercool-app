"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Calendar, dateFnsLocalizer } from "react-big-calendar"
import { format, getDay, parse, startOfWeek } from "date-fns"
import { es } from "date-fns/locale"
import { supabase } from "@/lib/supabase"
import "react-big-calendar/lib/css/react-big-calendar.css"

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales: { es } })
const styles = { pendiente: "#f59e0b", en_proceso: "#2563eb", completado: "#059669", cancelado: "#e11d48" }
const names = { pendiente: "Pendiente", en_proceso: "En proceso", completado: "Completado", cancelado: "Cancelado" }

function toLocalDate(value) {
  if (!value) return null
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number)
  return year && month && day ? new Date(year, month - 1, day) : null
}

export default function CalendarioPage() {
  const [tramites, setTramites] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true); setError("")
    const { data, error: queryError } = await supabase.from("tramites").select("*, equipos(marca, modelo), clientes(nombre)").order("fecha_programada", { ascending: true })
    if (queryError) setError("No se pudo cargar el calendario. Intenta nuevamente.")
    setTramites(data || []); setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(load, 0)
    return () => window.clearTimeout(timer)
  }, [load])
  const events = useMemo(() => tramites.filter((t) => t.fecha_programada && t.estado !== "cancelado").map((t) => {
    const start = toLocalDate(t.fecha_programada); const end = new Date(start); end.setHours(23, 59, 59, 999)
    return { id: t.id, title: `${t.equipos ? `${t.equipos.marca} ${t.equipos.modelo}` : "Equipo sin asignar"} · ${t.clientes?.nombre || "Sin cliente"}`, start, end, allDay: true, resource: t }
  }), [tramites])
  const stats = { total: events.length, pending: events.filter((event) => event.resource.estado === "pendiente").length, progress: events.filter((event) => event.resource.estado === "en_proceso").length, done: events.filter((event) => event.resource.estado === "completado").length }
  const eventStyleGetter = (event) => ({ style: { backgroundColor: styles[event.resource.estado] || styles.pendiente, color: "#fff", border: 0, borderRadius: 6, fontSize: 12, padding: "3px 6px" } })

  return <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
    <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium text-blue-600">Planificación operativa</p><h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Calendario</h1><p className="mt-1 text-sm text-slate-500">Consulta los mantenimientos y abonos programados.</p></div><Link href="/tramites" className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Gestionar trámites</Link></header>
    <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["Programados", stats.total, "text-slate-950"], ["Pendientes", stats.pending, "text-amber-600"], ["En proceso", stats.progress, "text-blue-600"], ["Completados", stats.done, "text-emerald-600"]].map(([label, value, tone]) => <article key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p></article>)}</section>
    {error && <p role="alert" className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap gap-x-5 gap-y-2 border-b border-slate-100 px-5 py-4 text-sm text-slate-600">{[["Pendiente", "#f59e0b"], ["En proceso", "#2563eb"], ["Completado", "#059669"]].map(([label, color]) => <span className="flex items-center gap-2" key={label}><i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />{label}</span>)}</div><div className="h-[520px] p-3 sm:p-5">{loading ? <div className="grid h-full place-items-center"><span className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div> : <Calendar localizer={localizer} events={events} startAccessor="start" endAccessor="end" eventPropGetter={eventStyleGetter} onSelectEvent={(event) => setSelected(event.resource)} views={["month", "week", "agenda"]} messages={{ next: "Siguiente", previous: "Anterior", today: "Hoy", month: "Mes", week: "Semana", agenda: "Agenda", date: "Fecha", time: "Hora", event: "Trámite", noEventsInRange: "No hay trámites en este rango", showMore: (total) => `+${total} más` }} culture="es" />}</div></section>
    {selected && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4" onMouseDown={() => setSelected(null)}><section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-blue-600">{selected.tipo === "mantenimiento" ? "Mantenimiento" : "Abono"}</p><h2 className="mt-1 text-xl font-bold text-slate-950">{selected.equipos ? `${selected.equipos.marca} ${selected.equipos.modelo}` : "Equipo sin asignar"}</h2></div><button className="text-xl text-slate-400 hover:text-slate-700" onClick={() => setSelected(null)} aria-label="Cerrar">×</button></div><dl className="mt-5 space-y-4 text-sm"><div><dt className="text-slate-500">Cliente</dt><dd className="mt-1 font-medium text-slate-900">{selected.clientes?.nombre || "Sin cliente"}</dd></div><div><dt className="text-slate-500">Fecha</dt><dd className="mt-1 font-medium capitalize text-slate-900">{toLocalDate(selected.fecha_programada)?.toLocaleDateString("es-UY", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</dd></div><div><dt className="text-slate-500">Estado</dt><dd className="mt-1 font-medium text-slate-900">{names[selected.estado] || "Pendiente"}</dd></div></dl><Link href={`/tramites/${selected.id}`} className="mt-6 block rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-700">Ver detalle</Link></section></div>}
  </main>
}
