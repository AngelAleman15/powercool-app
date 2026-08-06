"use client"

import { useCallback, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useNotifications } from "@/lib/useNotifications"

const NOTIFICATION_COOLDOWN_MS = 12 * 60 * 60 * 1000

export default function NotificationManager() {
  const { permission, registerServiceWorker, scheduleNotification } = useNotifications()

  const canNotifyNow = useCallback((key) => {
    try {
      const history = JSON.parse(localStorage.getItem("powercool_notification_history") || "{}")
      return !history[key] || Date.now() - history[key] >= NOTIFICATION_COOLDOWN_MS
    } catch {
      return true
    }
  }, [])

  const markNotified = useCallback((key) => {
    try {
      const history = JSON.parse(localStorage.getItem("powercool_notification_history") || "{}")
      history[key] = Date.now()
      localStorage.setItem("powercool_notification_history", JSON.stringify(history))
    } catch {
      // Si el almacenamiento local no está disponible, no bloqueamos las alertas.
    }
  }, [])

  useEffect(() => { registerServiceWorker() }, [registerServiceWorker])

  useEffect(() => {
    if (permission !== "granted") return

    const sendAlert = (key, title, body, url) => {
      if (!canNotifyNow(key)) return
      scheduleNotification(title, body, 0, url)
      markNotified(key)
    }

    const checkAlerts = async () => {
      const [maintenanceRes, equipmentRes, partsRes] = await Promise.all([
        supabase.from("tramites").select("id, fecha_programada, equipos(marca, modelo)").eq("tipo", "mantenimiento").eq("estado", "pendiente"),
        supabase.from("equipos").select("id, marca, modelo, estado_operativo").in("estado_operativo", ["critico", "mantenimiento"]),
        supabase.from("repuestos").select("id, nombre, stock_actual, stock_minimo").eq("activo", true),
      ])

      const now = new Date()
      const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
      ;(maintenanceRes.data || []).forEach((item) => {
        if (!item.fecha_programada) return
        const scheduled = new Date(item.fecha_programada)
        if (scheduled > twoDaysFromNow) return
        const equipment = Array.isArray(item.equipos) ? item.equipos[0] : item.equipos
        const name = equipment ? `${equipment.marca || "Equipo"} ${equipment.modelo || ""}`.trim() : "Equipo"
        const days = Math.max(0, Math.ceil((scheduled.getTime() - now.getTime()) / 86400000))
        sendAlert(`maintenance:${item.id}:${item.fecha_programada}`, "Mantenimiento próximo", `${name} requiere servicio ${days ? `en ${days} día${days === 1 ? "" : "s"}` : "hoy"}.`, "/tramites")
      })
      ;(equipmentRes.data || []).forEach((item) => {
        const name = `${item.marca || "Equipo"} ${item.modelo || ""}`.trim()
        sendAlert(`equipment:${item.id}:${item.estado_operativo}`, "Equipo fuera de servicio", `${name} está marcado como ${item.estado_operativo === "critico" ? "crítico" : "en mantenimiento"}.`, `/equipos/${item.id}`)
      })
      ;(partsRes.data || []).filter((item) => Number(item.stock_actual) <= Number(item.stock_minimo)).forEach((item) => {
        sendAlert(`stock:${item.id}:${item.stock_actual}`, "Stock bajo", `${item.nombre}: quedan ${item.stock_actual} unidades (mínimo ${item.stock_minimo}).`, "/equipos")
      })
    }

    void checkAlerts()
    const interval = window.setInterval(checkAlerts, 60 * 60 * 1000)
    window.addEventListener("focus", checkAlerts)
    return () => { window.clearInterval(interval); window.removeEventListener("focus", checkAlerts) }
  }, [permission, scheduleNotification, canNotifyNow, markNotified])

  return null
}
