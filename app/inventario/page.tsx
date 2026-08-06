"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"

type Part = { id: string; nombre: string; codigo: string | null; categoria: string | null; stock_actual: number; stock_minimo: number; unidad: string | null }

export default function InventarioPage() {
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadParts = useCallback(async () => {
    setLoading(true)
    const { data, error: queryError } = await supabase.from("repuestos").select("id, nombre, codigo, categoria, stock_actual, stock_minimo, unidad").eq("activo", true).order("nombre")
    if (queryError) { setError("No se pudo cargar el inventario."); setParts([]) } else { setError(""); setParts((data || []) as Part[]) }
    setLoading(false)
  }, [])

  useEffect(() => { void loadParts() }, [loadParts])
  const lowStock = useMemo(() => parts.filter((part) => Number(part.stock_actual) <= Number(part.stock_minimo)).length, [parts])

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-8 text-slate-900 sm:px-8 lg:px-9 lg:py-10">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-[30px] font-bold tracking-[-.045em]">Inventario</h1><p className="mt-1 text-[15px] text-slate-500">Repuestos y componentes disponibles para tus servicios.</p></div><div className="flex gap-3"><span className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">{lowStock} con stock bajo</span><button type="button" onClick={loadParts} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Actualizar</button></div></header>
      {error && <p className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,.05)]">
        <div className="grid grid-cols-[1.5fr_.7fr_.6fr_.7fr] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"><span>Repuesto</span><span>Categoría</span><span>Disponible</span><span>Estado</span></div>
        {loading ? <p className="px-5 py-10 text-center text-sm text-slate-500">Cargando inventario…</p> : parts.length === 0 ? <div className="px-5 py-12 text-center"><p className="font-semibold text-slate-700">Todavía no hay repuestos registrados.</p><p className="mt-1 text-sm text-slate-500">Cuando agregues existencias, aparecerán aquí con sus alertas de stock.</p></div> : parts.map((part) => { const critical = Number(part.stock_actual) <= Number(part.stock_minimo); return <Link key={part.id} href="/equipos" className="grid grid-cols-[1.5fr_.7fr_.6fr_.7fr] gap-4 border-b border-slate-100 px-5 py-4 text-sm last:border-0 hover:bg-slate-50"><div><p className="font-bold">{part.nombre}</p><p className="mt-1 text-xs text-slate-500">{part.codigo || "Sin código"}</p></div><span className="text-slate-600">{part.categoria || "Sin categoría"}</span><span className="font-semibold">{part.stock_actual} {part.unidad || "u."}</span><span className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold ${critical ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{critical ? "Reponer" : "Disponible"}</span></Link> })}
      </section>
    </div>
  )
}
