"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { getEstadoBadgeClass, getEstadoLabel, getPrioridadFromEstado } from "@/lib/inventarioHelpers"

export default function Equipos() {
  const [equipos, setEquipos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [estado, setEstado] = useState("todos")
  const [updatingId, setUpdatingId] = useState(null)

  const loadEquipos = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("equipos")
      .select("id, marca, modelo, ubicacion, capacidad, tipo, estado_operativo, prioridad, created_at, clientes(nombre)")
      .order("created_at", { ascending: false })
    if (error) {
      console.error("No se pudieron cargar los equipos", error)
      setEquipos([])
    } else setEquipos(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => { void loadEquipos() })
    return () => window.cancelAnimationFrame(frame)
  }, [loadEquipos])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return equipos.filter((equipo) => {
      const matchesSearch = !term || [equipo.marca, equipo.modelo, equipo.ubicacion, equipo.clientes?.nombre, equipo.tipo]
        .filter(Boolean).some((value) => String(value).toLowerCase().includes(term))
      return matchesSearch && (estado === "todos" || (equipo.estado_operativo || "operativo") === estado)
    })
  }, [equipos, search, estado])

  const setEstadoRapido = async (id, nextEstado) => {
    setUpdatingId(id)
    const prioridad = getPrioridadFromEstado(nextEstado)
    const { error } = await supabase.from("equipos").update({ estado_operativo: nextEstado, prioridad }).eq("id", id)
    if (error) console.error("No se pudo actualizar el estado del equipo", error)
    else setEquipos((current) => current.map((equipo) => equipo.id === id ? { ...equipo, estado_operativo: nextEstado, prioridad } : equipo))
    setUpdatingId(null)
  }

  const operational = equipos.filter((equipo) => (equipo.estado_operativo || "operativo") === "operativo").length
  const requiresAttention = equipos.filter((equipo) => ["atencion", "mantenimiento", "critico"].includes(equipo.estado_operativo)).length

  return <main className="mx-auto max-w-[1240px] px-5 py-7 text-slate-900 sm:px-8 lg:py-10">
    <header className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div><p className="mb-2 text-sm font-semibold text-blue-600">Gestión técnica</p><h1 className="text-3xl font-bold tracking-[-.045em]">Equipos</h1><p className="mt-2 text-[15px] text-slate-500">Controla los activos instalados, su ubicación y estado operativo.</p></div><div className="flex flex-wrap gap-3"><Link href="/inventario" className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Ver inventario</Link><Link href="/equipos/nuevo" className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">+ Nuevo equipo</Link></div></header>
    <section className="mb-6 grid gap-4 sm:grid-cols-3"><Metric label="Equipos registrados" value={equipos.length} tone="blue" /><Metric label="Operativos" value={operational} tone="emerald" /><Metric label="Requieren atención" value={requiresAttention} tone="amber" /></section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,.05)]"><div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><label className="relative block max-w-md flex-1"><span className="sr-only">Buscar equipos</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por equipo, cliente o ubicación…" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" /></label><select value={estado} onChange={(event) => setEstado(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none"><option value="todos">Todos los estados</option><option value="operativo">Operativos</option><option value="atencion">Atención</option><option value="mantenimiento">En mantenimiento</option><option value="critico">Críticos</option></select></div>
      {loading ? <p className="py-16 text-center text-sm text-slate-500">Cargando equipos…</p> : filtered.length === 0 ? <div className="px-6 py-16 text-center"><p className="font-semibold text-slate-800">No hay equipos para mostrar.</p><p className="mt-1 text-sm text-slate-500">Cambia los filtros o registra un nuevo activo.</p></div> : <div className="divide-y divide-slate-100">{filtered.map((equipo) => { const currentEstado = equipo.estado_operativo || "operativo"; return <article key={equipo.id} className="flex flex-col gap-4 p-5 transition hover:bg-slate-50/80 lg:flex-row lg:items-center"><div className="flex min-w-0 flex-1 items-center gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg text-blue-600">♨</div><div className="min-w-0"><Link href={`/equipos/${equipo.id}`} className="block truncate font-bold text-slate-900 hover:text-blue-600">{equipo.marca || "Equipo"} {equipo.modelo || "sin modelo"}</Link><p className="mt-1 truncate text-sm text-slate-500">{equipo.clientes?.nombre || "Sin cliente"} · {equipo.ubicacion || "Sin ubicación"}</p></div></div><div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:flex sm:items-center sm:gap-8"><div><p className="text-xs text-slate-400">Tipo</p><p className="font-medium capitalize text-slate-700">{equipo.tipo || "Split"}</p></div><div><p className="text-xs text-slate-400">Capacidad</p><p className="font-medium text-slate-700">{equipo.capacidad || "—"}</p></div><span className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold ${getEstadoBadgeClass(currentEstado)}`}>{getEstadoLabel(currentEstado)}</span></div><div className="flex items-center gap-2"><select aria-label={`Cambiar estado de ${equipo.marca || "equipo"}`} value={currentEstado} disabled={updatingId === equipo.id} onChange={(event) => void setEstadoRapido(equipo.id, event.target.value)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-600 disabled:opacity-50"><option value="operativo">Operativo</option><option value="atencion">Atención</option><option value="mantenimiento">Mantenimiento</option><option value="critico">Crítico</option></select><Link href={`/equipos/${equipo.id}`} className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600" aria-label="Ver ficha del equipo">→</Link></div></article> })}</div>}
    </section>
  </main>
}

function Metric({ label, value, tone }) { const tones = { blue: "bg-blue-50 text-blue-700", amber: "bg-amber-50 text-amber-700", emerald: "bg-emerald-50 text-emerald-700" }; return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,.04)]"><span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${tones[tone]}`}>⌁</span><p className="mt-4 text-2xl font-bold tracking-tight">{value}</p><p className="mt-1 text-sm text-slate-500">{label}</p></article> }
