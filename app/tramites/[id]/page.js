"use client"

import { useCallback, useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function TramiteDetalle() {
  const params = useParams()
  const router = useRouter()
  const [tramite, setTramite] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [formData, setFormData] = useState({
    descripcion: "",
    monto: "",
    moneda: "USD",
    fecha_programada: "",
    estado: "pendiente"
  })
  const [saving, setSaving] = useState(false)

  const cargarTramite = useCallback(async () => {
    setLoading(true)
    try {
      const { data: tramiteData } = await supabase
        .from("tramites")
        .select("*, equipos(id, marca, modelo, tipo, capacidad, ubicacion), clientes(id, nombre, email, telefono)")
        .eq("id", params.id)
        .single()

      if (!tramiteData) {
        router.push("/tramites")
        return
      }

      setTramite(tramiteData)
      setFormData({
        descripcion: tramiteData.descripcion || "",
        monto: tramiteData.monto || "",
        moneda: tramiteData.moneda || "USD",
        fecha_programada: tramiteData.fecha_programada || "",
        estado: tramiteData.estado || "pendiente"
      })
    } catch (error) {
      console.error("Error cargando trámite:", error)
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    if (params.id) {
      cargarTramite()
    }
  }, [params.id, cargarTramite])

  const handleEdit = async (e) => {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from("tramites")
      .update(formData)
      .eq("id", params.id)

    if (!error) {
      setShowEditModal(false)
      cargarTramite()
    }
    setSaving(false)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const estadoConfig = {
    pendiente: {
      bg: "bg-yellow-500/20",
      text: "text-yellow-500",
      border: "border-yellow-500/30",
      label: "Pendiente",
      icon: "⏳"
    },
    en_proceso: {
      bg: "bg-blue-500/20",
      text: "text-blue-500",
      border: "border-blue-500/30",
      label: "En Proceso",
      icon: "🔄"
    },
    completado: {
      bg: "bg-green-500/20",
      text: "text-green-500",
      border: "border-green-500/30",
      label: "Completado",
      icon: "✅"
    },
    cancelado: {
      bg: "bg-red-500/20",
      text: "text-red-500",
      border: "border-red-500/30",
      label: "Cancelado",
      icon: "❌"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!tramite) return null

  const config = estadoConfig[tramite.estado]

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/tramites"
          className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Detalle del Trámite</h1>
          <p className="text-xs text-gray-400">
            {tramite.tipo === "mantenimiento" ? "Mantenimiento" : "Abono"}
          </p>
        </div>
        <button
          onClick={() => setShowEditModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Editar
        </button>
      </div>

      {/* Estado Card */}
      <div className={`${config.bg} rounded-xl p-6 border ${config.border} mb-6`}>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{config.icon}</span>
          <div>
            <p className="text-xs text-gray-400 mb-1">Estado actual</p>
            <p className={`text-2xl font-bold ${config.text}`}>{config.label}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Info del Trámite */}
        <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-6 border border-white/10">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">{tramite.tipo === "mantenimiento" ? "🔧" : "💰"}</span>
            Información del Trámite
          </h2>

          <div className="space-y-3">
            {tramite.descripcion && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Descripción</p>
                <p className="text-sm text-white">{tramite.descripcion}</p>
              </div>
            )}

            {tramite.monto && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Monto</p>
                <p className="text-2xl font-bold text-white">
                  {tramite.moneda === "USD" ? "$" : "$U"} {parseFloat(tramite.monto).toLocaleString()}
                  <span className="text-sm text-gray-400 ml-2">{tramite.moneda}</span>
                </p>
              </div>
            )}

            {tramite.fecha_programada && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Fecha Programada</p>
                <p className="text-sm text-white flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(tramite.fecha_programada).toLocaleDateString("es-UY", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-400 mb-1">ID del Trámite</p>
              <p className="text-xs font-mono text-gray-500">{tramite.id}</p>
            </div>
          </div>
        </div>

        {/* Info del Cliente y Equipo */}
        <div className="space-y-4">
          {/* Cliente */}
          {tramite.clientes && (
            <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Cliente
              </h2>
              <div className="space-y-2">
                <Link
                  href={`/clientes/${tramite.clientes.id}`}
                  className="text-base font-semibold text-white hover:text-gray-300 transition-colors"
                >
                  {tramite.clientes.nombre}
                </Link>
                {tramite.clientes.email && (
                  <p className="text-xs text-gray-400 flex items-center gap-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {tramite.clientes.email}
                  </p>
                )}
                {tramite.clientes.telefono && (
                  <p className="text-xs text-gray-400 flex items-center gap-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {tramite.clientes.telefono}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Equipo */}
          {tramite.equipos && (
            <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                Equipo
              </h2>
              <div className="space-y-2">
                <Link
                  href={`/equipos/${tramite.equipos.id}`}
                  className="text-base font-semibold text-white hover:text-gray-300 transition-colors"
                >
                  {tramite.equipos.marca} {tramite.equipos.modelo}
                </Link>
                {tramite.equipos.tipo && (
                  <p className="text-xs text-gray-400">
                    Tipo: {tramite.equipos.tipo.charAt(0).toUpperCase() + tramite.equipos.tipo.slice(1)}
                  </p>
                )}
                {tramite.equipos.capacidad && (
                  <p className="text-xs text-gray-400">
                    Capacidad: {tramite.equipos.capacidad}
                  </p>
                )}
                {tramite.equipos.ubicacion && (
                  <p className="text-xs text-gray-400 flex items-center gap-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {tramite.equipos.ubicacion}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Editar Trámite</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Moneda
                </label>
                <div className="flex gap-3 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="moneda"
                      value="USD"
                      checked={formData.moneda === "USD"}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-white">USD</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="moneda"
                      value="UYU"
                      checked={formData.moneda === "UYU"}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-white">UYU</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Monto
                </label>
                <input
                  type="number"
                  name="monto"
                  value={formData.monto}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Fecha Programada
                </label>
                <input
                  type="date"
                  name="fecha_programada"
                  value={formData.fecha_programada}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Estado
                </label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="completado">Completado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-sm font-semibold hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
