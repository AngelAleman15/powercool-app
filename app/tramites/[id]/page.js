"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const statusStyles = {
  pendiente: "bg-amber-50 text-amber-700 ring-amber-200",
  en_proceso: "bg-blue-50 text-blue-700 ring-blue-200",
  completado: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelado: "bg-rose-50 text-rose-700 ring-rose-200",
}

const statusNames = { pendiente: "Pendiente", en_proceso: "En proceso", completado: "Completado", cancelado: "Cancelado" }
const inputClass = "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

function localDate(value) {
  if (!value) return "Sin programar"
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number)
  return new Date(year, month - 1, day).toLocaleDateString("es-UY", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
}

export default function TramiteDetalle() {
  const { id } = useParams()
  const router = useRouter()
  const [tramite, setTramite] = useState(null)
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true); setError("")
    const { data, error: queryError } = await supabase
      .from("tramites")
      .select("*, equipos(id, marca, modelo, tipo, capacidad, ubicacion), clientes(id, nombre, email, telefono)")
      .eq("id", id).maybeSingle()
    if (queryError) setError("No se pudo cargar este trámite. Intenta nuevamente.")
    if (!data && !queryError) router.replace("/tramites")
    if (data) {
      setTramite(data)
      setForm({ descripcion: data.descripcion || "", monto: data.monto ?? "", moneda: data.moneda || "UYU", fecha_programada: data.fecha_programada || "", estado: data.estado || "pendiente" })
    }
    setLoading(false)
  }, [id, router])

  useEffect(() => {
    if (!id) return undefined
    const timer = window.setTimeout(load, 0)
    return () => window.clearTimeout(timer)
  }, [id, load])

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError("")
    const payload = { ...form, monto: form.monto === "" ? null : Number(form.monto), fecha_programada: form.fecha_programada || null }
    const { data, error: updateError } = await supabase.from("tramites").update(payload).eq("id", id).select("*").single()
    if (updateError) setError("No se pudieron guardar los cambios. Verifica tus permisos e intenta nuevamente.")
    if (data) { setTramite((previous) => ({ ...previous, ...data })); setEditing(false) }
    setSaving(false)
  }

  if (loading) return <div className="grid min-h-[50vh] place-items-center"><span className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>
  if (!tramite || !form) return null

  const isMaintenance = tramite.tipo === "mantenimiento"
  const status = statusStyles[tramite.estado] || statusStyles.pendiente
  const amount = tramite.monto !== null && tramite.monto !== undefined && tramite.monto !== "" ? new Intl.NumberFormat("es-UY", { style: "currency", currency: tramite.moneda || "UYU", maximumFractionDigits: 0 }).format(Number(tramite.monto)) : "Sin importe"

  return <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
    <div className="mb-7 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <Link href="/tramites" aria-label="Volver a trámites" className="mt-1 grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700">←</Link>
        <div><p className="text-sm font-medium text-blue-600">{isMaintenance ? "Mantenimiento" : "Abono"}</p><h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Detalle del trámite</h1><p className="mt-1 text-sm text-slate-500">Gestiona su programación, importe y estado.</p></div>
      </div>
      <button onClick={() => setEditing(true)} className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">Editar trámite</button>
    </div>
    {error && <p role="alert" className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
    <section className="mb-6 grid gap-4 sm:grid-cols-3">
      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Estado actual</p><span className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ${status}`}>{statusNames[tramite.estado] || "Pendiente"}</span></article>
      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Fecha programada</p><p className="mt-2 font-semibold capitalize text-slate-900">{localDate(tramite.fecha_programada)}</p></article>
      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Importe</p><p className="mt-2 text-xl font-bold text-slate-900">{amount}</p></article>
    </section>
    <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-bold text-slate-900">Información del servicio</h2><dl className="mt-5 divide-y divide-slate-100"><div className="py-4 first:pt-0"><dt className="text-sm text-slate-500">Descripción</dt><dd className="mt-1 text-sm leading-6 text-slate-800">{tramite.descripcion || "Sin descripción registrada."}</dd></div><div className="py-4"><dt className="text-sm text-slate-500">Tipo</dt><dd className="mt-1 text-sm font-medium text-slate-900">{isMaintenance ? "Mantenimiento" : "Abono"}</dd></div></dl></section>
      <aside className="space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Cliente</p>{tramite.clientes ? <Link href={`/clientes/${tramite.clientes.id}`} className="mt-1 block font-semibold text-slate-950 hover:text-blue-600">{tramite.clientes.nombre}</Link> : <p className="mt-1 text-sm text-slate-600">Sin cliente asignado</p>}<p className="mt-2 text-sm text-slate-500">{tramite.clientes?.email || tramite.clientes?.telefono || "Sin contacto registrado"}</p></section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Equipo</p>{tramite.equipos ? <><Link href={`/equipos/${tramite.equipos.id}`} className="mt-1 block font-semibold text-slate-950 hover:text-blue-600">{tramite.equipos.marca} {tramite.equipos.modelo}</Link><p className="mt-2 text-sm text-slate-500">{[tramite.equipos.ubicacion, tramite.equipos.capacidad].filter(Boolean).join(" · ") || "Sin datos adicionales"}</p></> : <p className="mt-1 text-sm text-slate-600">Sin equipo asignado</p>}</section>
      </aside>
    </div>
    {editing && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4" role="dialog" aria-modal="true" aria-label="Editar trámite"><form onSubmit={save} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><h2 className="text-xl font-bold text-slate-950">Editar trámite</h2><p className="mt-1 text-sm text-slate-500">Los cambios se guardan en Supabase.</p></div><button type="button" onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-700" aria-label="Cerrar">×</button></div><label className="block text-sm font-medium text-slate-700">Descripción<textarea className={inputClass} name="descripcion" rows="3" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></label><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-slate-700">Importe<input className={inputClass} type="number" min="0" step="0.01" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} /></label><label className="block text-sm font-medium text-slate-700">Moneda<select className={inputClass} value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value })}><option value="UYU">UYU</option><option value="USD">USD</option></select></label></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-slate-700">Fecha programada<input className={inputClass} type="date" value={form.fecha_programada} onChange={(e) => setForm({ ...form, fecha_programada: e.target.value })} /></label><label className="block text-sm font-medium text-slate-700">Estado<select className={inputClass} value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>{Object.entries(statusNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancelar</button><button disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Guardando…" : "Guardar cambios"}</button></div></form></div>}
  </main>
}
