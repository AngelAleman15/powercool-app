"use client"

import { useState, useEffect } from 'react'
import { useNotifications } from '@/lib/useNotifications'

export default function NotificationSettings() {
  const { permission, requestPermission, scheduleNotification, isSupported } = useNotifications()
  const [sending, setSending] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isInsecureContext, setIsInsecureContext] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Detectar si estamos en HTTP no-localhost
    if (typeof window !== 'undefined') {
      const isHTTP = window.location.protocol === 'http:'
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      setIsInsecureContext(isHTTP && !isLocalhost)
    }
  }, [])

  const handleTestNotification = async () => {
    setSending(true)
    await scheduleNotification(
      '🔔 PowerCool',
      'Sistema de notificaciones funcionando correctamente',
      0,
      '/'
    )
    setTimeout(() => setSending(false), 1000)
  }

  // Durante SSR y primer render del cliente, mostrar estado de carga consistente
  if (!mounted) {
    return (
      <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-4 border border-white/10">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <h3 className="text-sm font-bold text-white">Notificaciones PWA</h3>
        </div>
      </div>
    )
  }

  if (!isSupported) {
    return (
      <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-4 border border-white/10">
        <p className="text-sm text-gray-400">
          ⚠️ Las notificaciones no están disponibles en este entorno
        </p>
      </div>
    )
  }

  // Mostrar advertencia si estamos en HTTP no-localhost
  if (isInsecureContext) {
    return (
      <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-4 border border-yellow-500/30">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-sm font-bold text-yellow-400">Notificaciones Bloqueadas</h3>
        </div>
        <p className="text-xs text-gray-300 mb-3">
          🔒 Las notificaciones requieren <strong>HTTPS</strong> (conexión segura) para funcionar. Actualmente estás usando HTTP.
        </p>
        <div className="bg-black/30 rounded-lg p-3 border border-yellow-500/20">
          <p className="text-xs text-gray-400 mb-2 font-semibold">💡 Soluciones:</p>
          <ul className="text-xs text-gray-400 space-y-1.5 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 mt-0.5">•</span>
              <span><strong>Opción 1</strong>: Accede desde <code className="bg-white/10 px-1.5 py-0.5 rounded text-yellow-300">localhost:3000</code> en este equipo</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 mt-0.5">•</span>
              <span><strong>Opción 2</strong>: Despliega la app con HTTPS (Vercel, Netlify, etc.)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 mt-0.5">•</span>
              <span><strong>Opción 3</strong>: Usa un túnel HTTPS (ngrok, cloudflared)</span>
            </li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-4 border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <h3 className="text-sm font-bold text-white">Notificaciones PWA</h3>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          permission === 'granted' 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : permission === 'denied'
            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
        }`}>
          {permission === 'granted' ? 'Activadas' : permission === 'denied' ? 'Bloqueadas' : 'Pendiente'}
        </span>
      </div>

      <p className="text-xs text-gray-400 mb-3">
        {permission === 'granted' 
          ? '✅ Recibirás notificaciones de mantenimientos próximos y alertas de stock'
          : permission === 'denied'
          ? '❌ Las notificaciones están bloqueadas. Habilítalas desde la configuración del navegador'
          : '⏳ Activa las notificaciones para recibir recordatorios automáticos'
        }
      </p>

      <div className="flex gap-2">
        {permission !== 'granted' && permission !== 'denied' && (
          <button
            onClick={requestPermission}
            className="flex-1 px-3 py-2 bg-white text-black rounded-lg text-xs font-semibold hover:bg-gray-200 transition-all"
          >
            Activar Notificaciones
          </button>
        )}
        
        {permission === 'granted' && (
          <button
            onClick={handleTestNotification}
            disabled={sending}
            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-xs font-semibold hover:bg-white/20 transition-all disabled:opacity-50"
          >
            {sending ? 'Enviando...' : 'Probar Notificación'}
          </button>
        )}
      </div>
    </div>
  )
}
