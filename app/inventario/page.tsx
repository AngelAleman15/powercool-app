"use client"

import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"

type Part = { id: string; nombre: string; codigo: string | null; categoria: string | null; stock_actual: number; stock_minimo: number; unidad: string | null }
type Movement = { id: string; repuesto_id: string; tipo: "ingreso" | "salida" | "ajuste"; cantidad: number; motivo: string | null; fecha_movimiento: string | null; created_at: string | null }
type PartForm = { nombre: string; codigo: string; categoria: string; stockActual: string; stockMinimo: string; unidad: string }

const emptyPartForm: PartForm = { nombre: "", codigo: "", categoria: "", stockActual: "0", stockMinimo: "1", unidad: "unidades" }
const isLowStock = (part: Part) => Number(part.stock_actual) <= Number(part.stock_minimo)

export default function InventarioPage() {
  const [parts, setParts] = useState<Part[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("todos")
  const [form, setForm] = useState({ repuestoId: "", tipo: "ingreso", cantidad: "1", motivo: "" })
  const [partForm, setPartForm] = useState<PartForm>(emptyPartForm)
  const [saving, setSaving] = useState(false)
  const [savingPart, setSavingPart] = useState(false)
  const [showPartForm, setShowPartForm] = useState(false)

  const loadInventory = useCallback(async () => {
    setLoading(true)
    const [partsResult, movementsResult] = await Promise.all([
      supabase.from("repuestos").select("id, nombre, codigo, categoria, stock_actual, stock_minimo, unidad").eq("activo", true).order("nombre"),
      supabase.from("movimientos_repuestos").select("id, repuesto_id, tipo, cantidad, motivo, fecha_movimiento, created_at").order("created_at", { ascending: false }).limit(12),
    ])
    if (partsResult.error) {
      setError("No se pudo cargar el inventario. Intenta actualizar nuevamente.")
      setParts([])
      setMovements([])
    } else {
      setError(movementsResult.error ? "Se cargó el stock, pero no el historial de movimientos." : "")
      setParts((partsResult.data || []) as Part[])
      setMovements((movementsResult.data || []) as Movement[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => { void loadInventory() })
    return () => window.cancelAnimationFrame(frame)
  }, [loadInventory])

  const lowStock = useMemo(() => parts.filter(isLowStock), [parts])
  const visibleParts = useMemo(() => parts.filter((part) => filter === "todos" || (filter === "bajo" ? isLowStock(part) : !isLowStock(part))), [parts, filter])
  const partById = useMemo(() => new Map(parts.map((part) => [part.id, part])), [parts])

  async function registerMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    const quantity = Number(form.cantidad)
    if (!form.repuestoId || !Number.isFinite(quantity) || quantity <= 0) {
      setError("Selecciona un repuesto e ingresa una cantidad válida.")
      return
    }
    const part = partById.get(form.repuestoId)
    if (form.tipo === "salida" && part && quantity > Number(part.stock_actual)) {
      setError(`Stock insuficiente. Hay ${part.stock_actual} ${part.unidad || "unidades"} disponibles.`)
      return
    }
    setSaving(true)
    const { error: rpcError } = await supabase.rpc("registrar_movimiento_repuesto", {
      p_repuesto_id: form.repuestoId,
      p_tipo: form.tipo,
      p_cantidad: quantity,
      p_motivo: form.motivo.trim() || (form.tipo === "ingreso" ? "Ingreso de inventario" : form.tipo === "salida" ? "Consumo de inventario" : "Ajuste de inventario"),
      p_referencia_tipo: form.tipo === "ingreso" ? "compra" : "manual",
      p_referencia_id: null,
      p_equipo_id: null,
      p_cliente_id: null,
      p_usuario: "Operador",
    })
    setSaving(false)
    if (rpcError) {
      setError(rpcError.message || "No se pudo registrar el movimiento.")
      return
    }
    setForm({ repuestoId: form.repuestoId, tipo: "ingreso", cantidad: "1", motivo: "" })
    await loadInventory()
  }

  async function createPart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    const stockActual = Number(partForm.stockActual)
    const stockMinimo = Number(partForm.stockMinimo)
    if (!partForm.nombre.trim() || !Number.isFinite(stockActual) || stockActual < 0 || !Number.isFinite(stockMinimo) || stockMinimo < 0) {
      setError("Ingresa un nombre y valores de stock válidos (iguales o mayores a cero).")
      return
    }
    setSavingPart(true)
    const { error: insertError } = await supabase.from("repuestos").insert({
      nombre: partForm.nombre.trim(),
      codigo: partForm.codigo.trim() || null,
      categoria: partForm.categoria.trim() || null,
      stock_actual: stockActual,
      stock_minimo: stockMinimo,
      unidad: partForm.unidad.trim() || "unidades",
      activo: true,
    })
    setSavingPart(false)
    if (insertError) {
      setError(insertError.message || "No se pudo crear el repuesto.")
      return
    }
    setPartForm(emptyPartForm)
    setShowPartForm(false)
    await loadInventory()
  }

  return <main className="mx-auto max-w-[1240px] px-5 py-7 text-slate-900 sm:px-8 lg:py-10">
    <header className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div><p className="mb-2 text-sm font-semibold text-blue-600">Gestión de repuestos</p><h1 className="text-3xl font-bold tracking-[-.045em]">Inventario</h1><p className="mt-2 text-[15px] text-slate-500">Stock, movimientos y alertas de los componentes de servicio.</p></div><div className="flex flex-wrap gap-3"><button type="button" onClick={() => setShowPartForm((current) => !current)} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">{showPartForm ? "Cancelar alta" : "+ Nuevo repuesto"}</button><button type="button" onClick={() => void loadInventory()} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Actualizar datos</button></div></header>
    <section className="mb-6 grid gap-4 sm:grid-cols-3"><Metric title="Repuestos activos" value={parts.length} tone="blue" /><Metric title="Stock bajo" value={lowStock.length} tone="amber" /><Metric title="Movimientos recientes" value={movements.length} tone="emerald" /></section>
    {error && <p role="alert" className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    {showPartForm && <section className="mb-6 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,.05)]"><div><h2 className="font-bold">Dar de alta un repuesto</h2><p className="mt-1 text-sm text-slate-500">El stock inicial quedará disponible de inmediato y será evaluado contra su mínimo.</p></div><form onSubmit={createPart} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Field label="Nombre *"><input required value={partForm.nombre} onChange={(event) => setPartForm({ ...partForm, nombre: event.target.value })} className={inputClass} placeholder="Ej. Filtro de aire" /></Field><Field label="Código"><input value={partForm.codigo} onChange={(event) => setPartForm({ ...partForm, codigo: event.target.value })} className={inputClass} placeholder="FIL-001" /></Field><Field label="Categoría"><input value={partForm.categoria} onChange={(event) => setPartForm({ ...partForm, categoria: event.target.value })} className={inputClass} placeholder="Filtros" /></Field><Field label="Stock inicial *"><input min="0" required type="number" value={partForm.stockActual} onChange={(event) => setPartForm({ ...partForm, stockActual: event.target.value })} className={inputClass} /></Field><Field label="Stock mínimo *"><input min="0" required type="number" value={partForm.stockMinimo} onChange={(event) => setPartForm({ ...partForm, stockMinimo: event.target.value })} className={inputClass} /></Field><Field label="Unidad"><input value={partForm.unidad} onChange={(event) => setPartForm({ ...partForm, unidad: event.target.value })} className={inputClass} placeholder="unidades" /></Field><div className="sm:col-span-2 lg:col-span-3"><button disabled={savingPart} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">{savingPart ? "Guardando…" : "Crear repuesto"}</button></div></form></section>}
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,.6fr)]">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,.05)]"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4"><div><h2 className="font-bold">Stock de repuestos</h2><p className="mt-1 text-sm text-slate-500">Existencias sincronizadas con Supabase.</p></div><select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option value="todos">Todo el stock</option><option value="bajo">Stock bajo</option><option value="disponible">Disponible</option></select></div>
      {loading ? <p className="py-16 text-center text-sm text-slate-500">Cargando inventario…</p> : visibleParts.length === 0 ? <div className="px-6 py-16 text-center text-sm text-slate-500"><p>No hay repuestos para este filtro.</p>{parts.length === 0 && <button type="button" onClick={() => setShowPartForm(true)} className="mt-4 font-semibold text-blue-700 hover:text-blue-800">Crear el primer repuesto</button>}</div> : <div className="divide-y divide-slate-100">{visibleParts.map((part) => { const critical = isLowStock(part); return <article key={part.id} className="flex items-center gap-4 p-5"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">▦</span><div className="min-w-0 flex-1"><p className="truncate font-bold">{part.nombre}</p><p className="mt-1 text-xs text-slate-500">{part.codigo || "Sin código"} · {part.categoria || "Sin categoría"}</p></div><div className="text-right"><p className="font-bold text-slate-800">{part.stock_actual} <span className="text-xs font-medium text-slate-500">{part.unidad || "u."}</span></p><p className="mt-1 text-xs text-slate-400">Mínimo: {part.stock_minimo}</p></div><span className={`hidden rounded-full px-2.5 py-1 text-xs font-bold sm:block ${critical ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{critical ? "Reponer" : "Disponible"}</span></article> })}</div>}</section>
      <aside className="space-y-6"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,.05)]"><h2 className="font-bold">Registrar movimiento</h2><p className="mt-1 text-sm text-slate-500">Actualiza el stock de forma trazable.</p><form onSubmit={registerMovement} className="mt-5 space-y-3"><Field label="Repuesto"><select value={form.repuestoId} onChange={(event) => setForm({ ...form, repuestoId: event.target.value })} className={inputClass}><option value="">Seleccionar repuesto</option>{parts.map((part) => <option key={part.id} value={part.id}>{part.nombre}</option>)}</select></Field><div className="grid grid-cols-2 gap-3"><Field label="Tipo"><select value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value })} className={inputClass}><option value="ingreso">Ingreso</option><option value="salida">Salida</option><option value="ajuste">Ajuste</option></select></Field><Field label="Cantidad"><input min="1" type="number" value={form.cantidad} onChange={(event) => setForm({ ...form, cantidad: event.target.value })} className={inputClass} /></Field></div><Field label="Motivo"><input value={form.motivo} onChange={(event) => setForm({ ...form, motivo: event.target.value })} placeholder="Compra, ajuste o consumo" className={inputClass} /></Field><button disabled={saving || !parts.length} className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Guardando…" : "Registrar movimiento"}</button></form></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,.05)]"><h2 className="font-bold">Últimos movimientos</h2><div className="mt-4 space-y-3">{movements.length === 0 ? <p className="text-sm text-slate-500">Aún no hay movimientos.</p> : movements.map((movement) => <div key={movement.id} className="flex gap-3"><span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${movement.tipo === "salida" ? "bg-rose-500" : movement.tipo === "ingreso" ? "bg-emerald-500" : "bg-amber-500"}`} /><div className="min-w-0"><p className="truncate text-sm font-semibold">{partById.get(movement.repuesto_id)?.nombre || "Repuesto"}</p><p className="mt-0.5 text-xs text-slate-500">{movement.tipo} · {movement.cantidad} · {movement.motivo || "Sin detalle"}</p></div></div>)}</div></section></aside>
    </div>
  </main>
}

const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block text-sm font-medium text-slate-700">{label}{children}</label> }
function Metric({ title, value, tone }: { title: string; value: number; tone: "blue" | "amber" | "emerald" }) { const tones = { blue: "bg-blue-50 text-blue-700", amber: "bg-amber-50 text-amber-700", emerald: "bg-emerald-50 text-emerald-700" }; return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,.04)]"><span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl font-bold ${tones[tone]}`}>⌁</span><p className="mt-4 text-2xl font-bold">{value}</p><p className="mt-1 text-sm text-slate-500">{title}</p></article> }
