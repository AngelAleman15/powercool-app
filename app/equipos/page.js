"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function Equipos() {

  const [equipos,setEquipos] = useState([])
  const [search,setSearch] = useState("")
  const [loading,setLoading] = useState(true)

  const cargarEquipos = async () => {
    setLoading(true)
    const { data } = await supabase
      .from("equipos")
      .select("*")

    setEquipos(data || [])
    setLoading(false)
  }

  useEffect(()=>{
    cargarEquipos()
  },[])

  const filtrados = equipos.filter(e =>
    e.modelo?.toLowerCase().includes(search.toLowerCase()) ||
    e.marca?.toLowerCase().includes(search.toLowerCase()) ||
    e.ubicacion?.toLowerCase().includes(search.toLowerCase()) ||
    e.id?.includes(search)
  )

  return (

    <div className="px-4 sm:px-6 py-4 sm:py-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            Equipos
          </h1>
          <p className="text-xs text-gray-400">
            Gestión y control de equipos de climatización
          </p>
        </div>
        <Link
          href="/equipos/nuevo"
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all w-full sm:w-auto justify-center"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Equipo
        </Link>
      </div>

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

  )
}