"use client"

import { useEffect, useState } from 'react'

export function useNotifications() {
  const [permission, setPermission] = useState('default')
  const [registration, setRegistration] = useState(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log('Este navegador no soporta notificaciones')
      return false
    }

    const result = await Notification.requestPermission()
    setPermission(result)
    return result === 'granted'
  }

  const registerServiceWorker = async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null
    }
    
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      setRegistration(reg)
      console.log('Service Worker registrado:', reg)
      return reg
    } catch (error) {
      console.error('Error al registrar Service Worker:', error)
      return null
    }
  }

  const scheduleNotification = async (title, body, delay = 0, url = '/') => {
    if (typeof window === 'undefined') return false
    
    if (permission !== 'granted') {
      const granted = await requestPermission()
      if (!granted) return false
    }

    setTimeout(() => {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator && registration) {
        registration.showNotification(title, {
          body,
          icon: '/icon-512.png',
          badge: '/icon-192.png',
          vibrate: [200, 100, 200],
          tag: `notification-${Date.now()}`,
          requireInteraction: false,
          renotify: false,
          data: { url }
        })
      } else if (typeof window !== 'undefined' && 'Notification' in window) {
        // Fallback a notificación nativa
        new Notification(title, {
          body,
          icon: '/icon-512.png',
          tag: `notification-${Date.now()}`
        })
      }
    }, delay)

    return true
  }

  return {
    permission,
    requestPermission,
    registerServiceWorker,
    scheduleNotification,
    isSupported: typeof window !== 'undefined' && 'Notification' in window
  }
}
