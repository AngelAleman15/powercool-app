"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { useDemoMode } from "@/lib/useDemoMode"
import { DEMO_EQUIPOS } from "@/lib/demoData"
import UruguayMap from "@/components/UruguayMap"

const DEMO_MOVIMIENTOS = [
  { id: 1, tipo: "Ingreso", cantidad: 10, unidad: "Unidades", modelo: "Sin: 3008TU", color: "green" },
  { id: 2, tipo: "Salida", cantidad: 5, unidad: "Unidades", modelo: "Frio Techo", color: "red" },
  { id: 3, tipo: "Ingreso", cantidad: 8, unidad: "Unidades", modelo: "Consola 2400BTU", color: "green" },
]

const DEMO_ESTADO_MAQUINAS = [
  { estado: "Perfecto", cantidad: 95, color: "bg-green-500" },
  { estado: "Mantenimiento", cantidad: 18, color: "bg-yellow-500" },
  { estado: "Reparacion", cantidad: 5, color: "bg-red-500" },
]

const DEMO_PROXIMOS = [
  { id: 1, servicio: "Mantenimiento", cliente: "Hotel Oasis", fecha: "25 Sep" },
  { id: 2, servicio: "Revision", cliente: "Clinica Medica", fecha: "28 Sep" },
  { id: 3, servicio: "Service", cliente: "Oficina TecoCorp", fecha: "30 Sep" },
]

export default function Equipos() {

  const [equipos,setEquipos] = useState([])
  const [search,setSearch] = useState("")
  const [loading,setLoading] = useState(true)
  const { demoMode } = useDemoMode()

  const cargarEquipos = async () => {
    if (demoMode) {
      setEquipos(DEMO_EQUIPOS)
      setLoading(false)
      return
    }

    setLoading(true)
    const { data } = await supabase
      .from("equipos")
      .select("*")

    setEquipos(data || [])
    setLoading(false)
  }

  useEffect(()=>{
    cargarEquipos()
  },[demoMode])

  const filtrados = equipos.filter(e =>
    e.modelo?.toLowerCase().includes(search.toLowerCase()) ||
    e.marca?.toLowerCase().includes(search.toLowerCase()) ||
    e.ubicacion?.toLowerCase().includes(search.toLowerCase()) ||
    e.id?.includes(search)
  )

  return (

    <div className="py-4 sm:py-6">

      {/* Header */}
      <div className="px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            Equipos
          </h1>
          <p className="text-xs text-gray-400">
            Gestión y control de equipos de climatización
          </p>
          {demoMode && (
            <p className="mt-1 text-[11px] text-green-300">Modo Demo activo: datos de muestra</p>
          )}
        </div>
        {demoMode ? (
          <button
            type="button"
            disabled
            className="flex items-center gap-2 px-4 py-2 bg-white/10 text-gray-400 rounded-lg text-sm font-semibold w-full sm:w-auto justify-center cursor-not-allowed"
            title="Deshabilitado en modo demo"
          >
            Nuevo Equipo
          </button>
        ) : (
          <Link
            href="/equipos/nuevo"
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all w-full sm:w-auto justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Equipo
          </Link>
        )}
      </div>

      {/* Summary Panels and Map */}
      <div className="px-4 sm:px-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          
          {/* Ultimos Movimientos */}
          <div className="rounded-md border border-[#d1dcec] bg-[#f7faff] overflow-hidden h-fit">
            <div className="px-3 py-2 border-b border-[#dbe4f3] bg-gradient-to-r from-[#f7faff] to-[#eef5ff]">
              <h2 className="text-xs font-bold text-[#284a76]">Ultimos Movimientos de Inventario</h2>
            </div>
            <div className="space-y-1.5 p-3">
              {DEMO_MOVIMIENTOS.map((mov) => (
                <div key={mov.id} className="flex items-center gap-2 text-[10px]">
                  <svg className={`w-3 h-3 shrink-0 ${mov.color === 'green' ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16z" clipRule="evenodd" />
                  </svg>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1f6bc1]">{mov.tipo}: {mov.cantidad} {mov.unidad}</p>
                    <p className="text-gray-500 text-[9px]">{mov.modelo}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-3 py-1.5 border-t border-[#dbe4f3] bg-[#f9fbff]">
              <button className="text-[10px] font-semibold text-[#1f6bc1] hover:text-[#1550a0] transition-colors px-2 py-1 bg-white rounded border border-[#d1dcec]">
                Ver inventario
              </button>
            </div>
          </div>

          {/* Estado de Maquinas */}
          <div className="rounded-md border border-[#d1dcec] bg-[#f7faff] overflow-hidden h-fit">
            <div className="px-3 py-2 border-b border-[#dbe4f3] bg-gradient-to-r from-[#f7faff] to-[#eef5ff]">
              <h2 className="text-xs font-bold text-[#284a76]">Estado de Maquinas</h2>
            </div>
            <div className="space-y-2 p-3">
              {DEMO_ESTADO_MAQUINAS.map((estado, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[10px]">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full ${estado.color}`} style={{ width: `${Math.min(estado.cantidad / 100 * 100, 100)}%` }}></div>
                  </div>
                  <span className="text-[9px] font-bold text-[#1f6bc1] min-w-[20px] text-right">{estado.cantidad}</span>
                </div>
              ))}
            </div>
            <div className="px-3 py-1.5 border-t border-[#dbe4f3] bg-[#f9fbff]">
              <button className="text-[10px] font-semibold text-[#1f6bc1] hover:text-[#1550a0] transition-colors px-2 py-1 bg-white rounded border border-[#d1dcec]">
                Detalle
              </button>
            </div>
          </div>

          {/* Proximos Mantenimientos */}
          <div className="rounded-md border border-[#d1dcec] bg-[#f7faff] overflow-hidden h-fit">
            <div className="px-3 py-2 border-b border-[#dbe4f3] bg-gradient-to-r from-[#f7faff] to-[#eef5ff]">
              <h2 className="text-xs font-bold text-[#284a76]">Proximos Mantenimientos</h2>
            </div>
            <div className="space-y-1.5 p-3">
              {DEMO_PROXIMOS.map((mant) => (
                <div key={mant.id} className="flex items-start gap-1.5 text-[10px]">
                  <svg className="w-3.5 h-3.5 text-[#2459a8] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1f6bc1]">{mant.servicio}</p>
                    <p className="text-gray-500 text-[9px]">{mant.cliente}</p>
                    <p className="text-[#2459a8] font-bold text-[9px] mt-0.5">{mant.fecha}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-3 py-1.5 border-t border-[#dbe4f3] bg-[#f9fbff]">
              <button className="text-[10px] font-semibold text-[#1f6bc1] hover:text-[#1550a0] transition-colors px-2 py-1 bg-white rounded border border-[#d1dcec]">
                Cronograma
              </button>
            </div>
          </div>

        </div>

        {/* Mapa */}
        <div className="rounded-md border border-[#d1dcec] bg-[#f7faff] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#dbe4f3] bg-gradient-to-r from-[#f7faff] to-[#eef5ff]">
            <h2 className="text-sm font-bold text-[#284a76]">Mapa de Equipos</h2>
          </div>
          <div className="relative z-0 h-[340px] m-4 rounded-md overflow-hidden border border-[#e0e8f0]">
            <UruguayMap />
          </div>
        </div>
      </div>

      {/* Search and Equipment Grid */}
      <div className="px-4 sm:px-6">

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <svg className="h-3.5 w-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por modelo, marca, ubicación o ID..."
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
              className="block w-full pl-8 pr-3 py-1.5 border border-white/10 rounded-lg bg-[#111] text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all"
            />
          </div>
        </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : (
        <>
          {/* Results Count */}
          <div className="mb-4">
            <p className="text-sm text-gray-400">
              Mostrando <span className="font-semibold text-white">{filtrados.length}</span> de <span className="font-semibold text-white">{equipos.length}</span> equipos
            </p>
          </div>

          {/* Equipment Grid */}
          {filtrados.length === 0 ? (
            <div className="text-center py-8 bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl border border-white/10">
              <svg className="mx-auto h-8 w-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-xs font-medium text-white">No se encontraron equipos</h3>
              <p className="mt-1 text-xs text-gray-500">
                {search ? 'Intenta con otros términos de búsqueda' : 'Aún no hay equipos registrados'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

              {filtrados.map(equipo => (

                <Link
                  key={equipo.id}
                  href={`/equipos/${equipo.id}`}
                  className="group"
                >

                  <div className="h-full bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-lg border border-white/10 p-3 hover:border-white/30 transition-all duration-300 hover:-translate-y-1">

                    {/* Icon */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-1.5 bg-white rounded-md group-hover:scale-110 transition-transform">
                        <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                      </div>
                      <svg className="w-3.5 h-3.5 text-gray-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    {/* Equipment Info */}
                    <h2 className="text-base font-bold text-white mb-1.5 line-clamp-1">
                      {equipo.marca} {equipo.modelo}
                    </h2>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs">
                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-gray-400 text-xs">{equipo.ubicacion || 'Sin ubicación'}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs">
                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className="text-gray-500 font-mono text-xs">{equipo.id}</span>
                      </div>
                    </div>

                  </div>

                </Link>

              ))}

            </div>
          )}
        </>
      )}

      </div>

    </div>

  )
}