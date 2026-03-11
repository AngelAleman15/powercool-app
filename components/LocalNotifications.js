"use client"

import { useState, useEffect } from "react"

export default function LocalNotifications() {
  const [pendingReminders, setPendingReminders] = useState([])
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    checkPendingReminders()
    // Revisar cada minuto
    const interval = setInterval(checkPendingReminders, 60000)
    return () => clearInterval(interval)
  }, [])

  function checkPendingReminders() {
    try {
      const reminders = JSON.parse(localStorage.getItem('powercool_reminders') || '[]')
      const now = new Date().getTime()
      
      // Filtrar recordatorios que deben mostrarse ahora
      const pending = reminders.filter(r => {
        const reminderTime = new Date(r.dueDate).getTime()
        return reminderTime <= now && !r.shown
      })

      if (pending.length > 0) {
        setPendingReminders(pending)
        setShowBanner(true)
        
        // Marcar como mostrados
        const updated = reminders.map(r => {
          if (pending.some(p => p.id === r.id)) {
            return { ...r, shown: true }
          }
          return r
        })
        localStorage.setItem('powercool_reminders', JSON.stringify(updated))

        // Mostrar alerta del navegador si están permitidas
        if ('Notification' in window && Notification.permission === 'granted') {
          pending.forEach(r => {
            new Notification('PowerCool - Recordatorio', {
              body: r.message,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              tag: r.id
            })
          })
        }
      }
    } catch (error) {
      console.error('Error checking reminders:', error)
    }
  }

  function dismissBanner() {
    setShowBanner(false)
    setPendingReminders([])
  }

  function dismissReminder(id) {
    setPendingReminders(prev => prev.filter(r => r.id !== id))
    if (pendingReminders.length <= 1) {
      setShowBanner(false)
    }
  }

  if (!showBanner || pendingReminders.length === 0) return null

  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-slide-down md:max-w-md md:left-auto">
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-2xl p-4 border border-blue-400">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Recordatorios Pendientes</h3>
              <p className="text-blue-100 text-xs">{pendingReminders.length} nuevo(s)</p>
            </div>
          </div>
          <button
            onClick={dismissBanner}
            className="text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {pendingReminders.map(reminder => (
            <div key={reminder.id} className="bg-white/10 backdrop-blur rounded-lg p-3 flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{reminder.title}</p>
                <p className="text-blue-100 text-xs mt-1">{reminder.message}</p>
                {reminder.equipoInfo && (
                  <p className="text-blue-200 text-xs mt-1">
                    🔧 {reminder.equipoInfo}
                  </p>
                )}
              </div>
              <button
                onClick={() => dismissReminder(reminder.id)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Función helper para crear recordatorios
export function createReminder(title, message, dueDate, equipoInfo = null) {
  try {
    const reminders = JSON.parse(localStorage.getItem('powercool_reminders') || '[]')
    const newReminder = {
      id: Date.now().toString(),
      title,
      message,
      dueDate,
      equipoInfo,
      shown: false,
      createdAt: new Date().toISOString()
    }
    reminders.push(newReminder)
    localStorage.setItem('powercool_reminders', JSON.stringify(reminders))
    return newReminder.id
  } catch (error) {
    console.error('Error creating reminder:', error)
    return null
  }
}
