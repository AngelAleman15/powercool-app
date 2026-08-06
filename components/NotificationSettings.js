"use client"

import { useState } from "react"
import { useNotifications } from "@/lib/useNotifications"

export default function NotificationSettings() {
  const { permission, requestPermission, scheduleNotification, isSupported } = useNotifications()
  const [sending, setSending] = useState(false)

  const testNotification = async () => {
    setSending(true)
    await scheduleNotification("PowerCool", "Las notificaciones están configuradas correctamente.")
    window.setTimeout(() => setSending(false), 900)
  }

  if (!isSupported) return <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">Este navegador no admite notificaciones.</p>

  const status = permission === "granted" ? "Activadas" : permission === "denied" ? "Bloqueadas" : "Sin activar"
  const statusClass = permission === "granted" ? "bg-emerald-100 text-emerald-700" : permission === "denied" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
      <div>
        <p className="font-semibold text-slate-900">Alertas del navegador <span className={`ml-2 rounded-full px-2 py-1 text-xs ${statusClass}`}>{status}</span></p>
        <p className="mt-1 text-sm leading-6 text-slate-500">Cuando se activen, se revisarán equipos críticos, mantenimientos próximos y repuestos por debajo de su stock mínimo.</p>
      </div>
      <div className="flex gap-2">
        {permission === "default" && <button type="button" onClick={requestPermission} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">Activar alertas</button>}
        {permission === "granted" && <button type="button" disabled={sending} onClick={testNotification} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{sending ? "Enviando…" : "Enviar prueba"}</button>}
      </div>
    </div>
  )
}
