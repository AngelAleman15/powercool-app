"use client"

import { useEffect } from 'react'
import { useNotifications } from '@/lib/useNotifications'
import { supabase } from '@/lib/supabase'

export default function NotificationManager() {
  const { permission, requestPermission, registerServiceWorker, scheduleNotification } = useNotifications()

  useEffect(() => {
    // Registrar service worker al cargar
    registerServiceWorker()
  }, [])

  useEffect(() => {
    // Pedir permisos de notificación después de 3 segundos
    const timer = setTimeout(() => {
      if (permission === 'default') {
        requestPermission()
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [permission])

  useEffect(() => {
    if (permission !== 'granted') return

    // Verificar mantenimientos próximos cada 1 hora
    const checkMaintenances = async () => {
      const { data: tramites } = await supabase
        .from('tramites')
        .select('*, equipos(marca, modelo), clientes(nombre)')
        .eq('tipo', 'mantenimiento')
        .eq('estado', 'pendiente')

      if (!tramites) return

      const now = new Date()
      const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)

      tramites.forEach((tramite) => {
        if (!tramite.fecha_programada) return

        const fechaProgramada = new Date(tramite.fecha_programada)
        
        // Notificar si el mantenimiento es en 2 días
        if (fechaProgramada <= twoDaysFromNow && fechaProgramada > now) {
          const diasRestantes = Math.ceil((fechaProgramada - now) / (1000 * 60 * 60 * 24))
          const equipo = tramite.equipos ? `${tramite.equipos.marca} ${tramite.equipos.modelo}` : 'Equipo'
          
          scheduleNotification(
            '⚠️ Mantenimiento Próximo',
            `${equipo} - Mantenimiento en ${diasRestantes} día${diasRestantes > 1 ? 's' : ''}`,
            0,
            '/tramites'
          )
        }
      })
    }

    // Ejecutar inmediatamente y luego cada hora
    checkMaintenances()
    const interval = setInterval(checkMaintenances, 60 * 60 * 1000) // 1 hora

    return () => clearInterval(interval)
  }, [permission, scheduleNotification])

  return null // Este componente no renderiza nada
}
