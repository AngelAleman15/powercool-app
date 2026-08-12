"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"

type AlertTone = "critical" | "warning" | "info"
type Alert = { id: string; title: string; description: string; href: string; tone: AlertTone }

const toneClasses: Record<AlertTone, string> = {
  critical: "border-rose-100 bg-rose-50 text-rose-700",
  warning: "border-amber-100 bg-amber-50 text-amber-700",
  info: "border-blue-100 bg-blue-50 text-blue-700",
}

function formatDate(value: string | null) {
  if (!value) return "sin fecha programada"
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return "sin fecha programada"
  return date.toLocaleDateString("es-UY", { day: "numeric", month: "short" })
}

export default function InternalNotificationCenter() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  const loadAlerts = useCallback(async () => {
    setLoading(true)
    const [equipmentRes, maintenanceRes, partsRes] = await Promise.all([
      supabase.from("equipos").select("id, marca, modelo, estado_operativo").in("estado_operativo", ["critico", "mantenimiento"]),
      supabase.from("tramites").select("id, fecha_programada, estado, equipos(marca, modelo)").in("estado", ["pendiente", "en_proceso"]).order("fecha_programada", { ascending: true }),
      supabase.from("repuestos").select("id, nombre, stock_actual, stock_minimo").eq("activo", true),
    ])
    const now = new Date(); now.setHours(0, 0, 0, 0)
    const horizon = new Date(now); horizon.setDate(now.getDate() + 14)
    const nextAlerts: Alert[] = []
    ;(equipmentRes.data || []).forEach((item) => {
      const name = `${item.marca || "Equipo"} ${item.modelo || ""}`.trim()
      nextAlerts.push({ id: `equipment-${item.id}`, title: item.estado_operativo === "critico" ? "Equipo crítico" : "Equipo fuera de servicio", description: `${name} requiere atención técnica.`, href: `/equipos/${item.id}`, tone: "critical" })
    })
    ;(maintenanceRes.data || []).forEach((item) => {
      const date = item.fecha_programada ? new Date(`${item.fecha_programada}T12:00:00`) : null
      if (!date || Number.isNaN(date.getTime()) || date > horizon) return
      const equipment = Array.isArray(item.equipos) ? item.equipos[0] : item.equipos
      const name = `${equipment?.marca || "Equipo"} ${equipment?.modelo || ""}`.trim()
      const overdue = date < now
      nextAlerts.push({ id: `maintenance-${item.id}`, title: overdue ? "Mantenimiento vencido" : "Mantenimiento próximo", description: `${name}: ${overdue ? "programado para" : "programado el"} ${formatDate(item.fecha_programada)}.`, href: `/tramites/${item.id}`, tone: overdue ? "critical" : "warning" })
    })
    ;(partsRes.data || []).filter((item) => Number(item.stock_actual) <= Number(item.stock_minimo)).forEach((item) => nextAlerts.push({ id: `stock-${item.id}`, title: "Stock bajo", description: `${item.nombre}: ${item.stock_actual} disponibles; mínimo ${item.stock_minimo}.`, href: "/inventario", tone: "warning" }))
    setAlerts(nextAlerts)
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadAlerts() }, 0)
    return () => window.clearTimeout(timer)
  }, [loadAlerts])
  const summary = useMemo(() => alerts.length === 1 ? "1 alerta requiere atención" : `${alerts.length} alertas requieren atención`, [alerts.length])
  if (loading) return <div className="py-7 text-center text-sm text-slate-500">Actualizando alertas…</div>
  if (!alerts.length) return <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-5 text-sm text-emerald-800"><p className="font-semibold">Todo está al día</p><p className="mt-1 text-emerald-700">No hay alertas operativas con los datos actuales.</p></div>
  return <div><div className="mb-3 flex items-center justify-between gap-4"><p className="text-sm font-semibold text-slate-700">{summary}</p><button type="button" onClick={() => void loadAlerts()} className="text-sm font-semibold text-blue-700 hover:text-blue-800">Actualizar</button></div><div className="space-y-2">{alerts.map((alert) => <Link key={alert.id} href={alert.href} className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 transition hover:brightness-[.98] ${toneClasses[alert.tone]}`}><div><p className="text-sm font-bold">{alert.title}</p><p className="mt-0.5 text-sm opacity-90">{alert.description}</p></div><span aria-hidden="true" className="text-lg">›</span></Link>)}</div></div>
}
