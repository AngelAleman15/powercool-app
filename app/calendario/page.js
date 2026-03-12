"use client"

import { useState, useEffect } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = {
  'es': es,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

export default function CalendarioPage() {
  const [tramites, setTramites] = useState([])
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('month')

  useEffect(() => {
    cargarTramites()
  }, [])

  async function cargarTramites() {
    setLoading(true)
    const { data } = await supabase
      .from('tramites')
      .select('*, equipos(marca, modelo), clientes(nombre)')
      .order('fecha_programada', { ascending: true })

    if (data) {
      setTramites(data)
      
      // Convertir trámites a eventos del calendario
      const eventos = data
        .filter(t => t.fecha_programada && t.estado !== 'cancelado')
        .map(t => ({
          id: t.id,
          title: `${t.tipo === 'mantenimiento' ? '🔧' : '💰'} ${t.equipos?.marca || ''} ${t.equipos?.modelo || ''} - ${t.clientes?.nombre || 'Sin cliente'}`,
          start: new Date(t.fecha_programada),
          end: new Date(t.fecha_programada),
          resource: t,
          estado: t.estado,
          tipo: t.tipo
        }))
      
      setEvents(eventos)
    }
    setLoading(false)
  }

  const eventStyleGetter = (event) => {
    let backgroundColor = '#3b82f6' // azul default
    
    if (event.estado === 'completado') {
      backgroundColor = '#10b981' // verde
    } else if (event.estado === 'pendiente') {
      backgroundColor = '#eab308' // amarillo
    } else if (event.estado === 'en_proceso') {
      backgroundColor = '#6366f1' // índigo
    }
    
    if (event.tipo === 'abono') {
      backgroundColor = '#14b8a6' // teal
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '12px',
        padding: '2px 5px'
      }
    }
  }

  const handleSelectEvent = (event) => {
    setSelectedEvent(event.resource)
  }

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl">
              <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Calendario</h1>
              <p className="text-sm text-gray-400">Visualiza todos tus trámites programados</p>
            </div>
          </div>
          
          <Link
            href="/tramites"
            className="px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all"
          >
            + Nuevo Trámite
          </Link>
        </div>

        {/* Leyenda */}
        <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-4 border border-white/10 mb-6">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#8b5cf6]"></div>
              <span className="text-gray-300">Mantenimiento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#14b8a6]"></div>
              <span className="text-gray-300">Abono</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#eab308]"></div>
              <span className="text-gray-300">Pendiente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#6366f1]"></div>
              <span className="text-gray-300">En Proceso</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#10b981]"></div>
              <span className="text-gray-300">Completado</span>
            </div>
          </div>
        </div>

        {/* Calendario */}
        <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-6 border border-white/10">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Cargando calendario...</p>
            </div>
          ) : (
            <div style={{ height: '700px' }}>
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={handleSelectEvent}
                messages={{
                  next: "Sig",
                  previous: "Ant",
                  today: "Hoy",
                  month: "Mes",
                  week: "Semana",
                  day: "Día",
                  agenda: "Agenda",
                  date: "Fecha",
                  time: "Hora",
                  event: "Trámite",
                  noEventsInRange: "No hay trámites en este rango",
                  showMore: (total) => `+ Ver más (${total})`
                }}
                culture="es"
              />
            </div>
          )}
        </div>

        {/* Stats Rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-4 border border-white/10">
            <p className="text-gray-400 text-xs mb-1">Total Programados</p>
            <p className="text-2xl font-bold text-white">{events.length}</p>
          </div>
          <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-4 border border-amber-500/30">
            <p className="text-gray-400 text-xs mb-1">Pendientes</p>
            <p className="text-2xl font-bold text-amber-400">{events.filter(e => e.estado === 'pendiente').length}</p>
          </div>
          <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-4 border border-blue-500/30">
            <p className="text-gray-400 text-xs mb-1">En Proceso</p>
            <p className="text-2xl font-bold text-blue-400">{events.filter(e => e.estado === 'en_proceso').length}</p>
          </div>
          <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-4 border border-green-500/30">
            <p className="text-gray-400 text-xs mb-1">Completados Este Mes</p>
            <p className="text-2xl font-bold text-green-400">
              {tramites.filter(t => {
                const fecha = new Date(t.fecha_programada || t.created_at)
                const ahora = new Date()
                return fecha.getMonth() === ahora.getMonth() && 
                       fecha.getFullYear() === ahora.getFullYear() &&
                       t.estado === 'completado'
              }).length}
            </p>
          </div>
        </div>

        {/* Modal de Evento Seleccionado */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedEvent(null)}>
            <div className="bg-[#111] border border-white/10 rounded-xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Detalle del Trámite</h3>
                <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400">Tipo</p>
                  <p className="text-white font-semibold">{selectedEvent.tipo === 'mantenimiento' ? '🔧 Mantenimiento' : '💰 Abono'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Cliente</p>
                  <p className="text-white">{selectedEvent.clientes?.nombre || 'Sin cliente'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Equipo</p>
                  <p className="text-white">{selectedEvent.equipos?.marca} {selectedEvent.equipos?.modelo}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Fecha</p>
                  <p className="text-white">{new Date(selectedEvent.fecha_programada).toLocaleDateString('es-UY', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Estado</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedEvent.estado === 'completado' ? 'bg-green-500/20 text-green-500' :
                    selectedEvent.estado === 'en_proceso' ? 'bg-blue-500/20 text-blue-500' :
                    selectedEvent.estado === 'pendiente' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {selectedEvent.estado.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                {selectedEvent.descripcion && (
                  <div>
                    <p className="text-xs text-gray-400">Descripción</p>
                    <p className="text-white text-sm">{selectedEvent.descripcion}</p>
                  </div>
                )}
              </div>

              <Link
                href={`/tramites/${selectedEvent.id}`}
                className="block mt-6 w-full px-4 py-2 bg-white text-black text-center rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all"
              >
                Ver Detalles Completos
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
