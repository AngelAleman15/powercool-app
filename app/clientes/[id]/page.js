"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function ClienteDetalle() {
  const params = useParams()
  const router = useRouter()
  const [cliente, setCliente] = useState(null)
  const [equipos, setEquipos] = useState([])
  const [tramitesPendientes, setTramitesPendientes] = useState([])
  const [tramitesHistorial, setTramitesHistorial] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    ciudad: ""
  })
  const [saving, setSaving] = useState(false)

  // Estados para modales de equipos
  const [showEquipoModal, setShowEquipoModal] = useState(false)
  const [editingEquipo, setEditingEquipo] = useState(null)
  const [equipoFormData, setEquipoFormData] = useState({
    marca: "",
    modelo: "",
    tipo: "split",
    capacidad: "",
    ubicacion: ""
  })

  // Estados para modales de trámites
  const [showTramiteModal, setShowTramiteModal] = useState(false)
  const [editingTramite, setEditingTramite] = useState(null)
  const [tramiteFormData, setTramiteFormData] = useState({
    tipo: "mantenimiento",
    equipo_id: "",
    descripcion: "",
    monto: "",
    moneda: "USD",
    fecha_programada: "",
    estado: "pendiente"
  })

  useEffect(() => {
    if (params.id) {
      cargarDatos()
    }
  }, [params.id])

  async function cargarDatos() {
    setLoading(true)
    try {
      // Cargar cliente
      const { data: clienteData } = await supabase
        .from("clientes")
        .select("*")
        .eq("id", params.id)
        .single()

      if (!clienteData) {
        router.push("/clientes")
        return
      }

      setCliente(clienteData)
      setFormData({
        nombre: clienteData.nombre || "",
        email: clienteData.email || "",
        telefono: clienteData.telefono || "",
        direccion: clienteData.direccion || "",
        ciudad: clienteData.ciudad || ""
      })

      // Cargar equipos del cliente
      const { data: equiposData } = await supabase
        .from("equipos")
        .select("*")
        .eq("cliente_id", params.id)
        .order("created_at", { ascending: false })

      setEquipos(equiposData || [])

      // Cargar trámites del cliente
      const { data: tramitesData } = await supabase
        .from("tramites")
        .select("*, equipos(marca, modelo)")
        .eq("cliente_id", params.id)
        .order("created_at", { ascending: false })

      // Separar pendientes y completados
      const pendientes = (tramitesData || []).filter(t => 
        t.estado === "pendiente" || t.estado === "en_proceso"
      )
      const historial = (tramitesData || []).filter(t => 
        t.estado === "completado" || t.estado === "cancelado"
      )

      setTramitesPendientes(pendientes)
      setTramitesHistorial(historial)
    } catch (error) {
      console.error("Error cargando datos:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from("clientes")
      .update(formData)
      .eq("id", params.id)

    if (!error) {
      setShowEditModal(false)
      cargarDatos()
    }
    setSaving(false)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Funciones para Equipos
  const handleEquipoChange = (e) => {
    setEquipoFormData({ ...equipoFormData, [e.target.name]: e.target.value })
  }

  const handleAddEquipo = () => {
    setEditingEquipo(null)
    setEquipoFormData({
      marca: "",
      modelo: "",
      tipo: "split",
      capacidad: "",
      ubicacion: ""
    })
    setShowEquipoModal(true)
  }

  const handleEditEquipo = (equipo) => {
    setEditingEquipo(equipo)
    setEquipoFormData({
      marca: equipo.marca || "",
      modelo: equipo.modelo || "",
      tipo: equipo.tipo || "split",
      capacidad: equipo.capacidad || "",
      ubicacion: equipo.ubicacion || ""
    })
    setShowEquipoModal(true)
  }

  const handleSubmitEquipo = async (e) => {
    e.preventDefault()
    setSaving(true)

    let error
    if (editingEquipo) {
      const result = await supabase
        .from("equipos")
        .update(equipoFormData)
        .eq("id", editingEquipo.id)
      error = result.error
    } else {
      const result = await supabase
        .from("equipos")
        .insert([{ ...equipoFormData, cliente_id: params.id }])
      error = result.error
    }

    if (!error) {
      setShowEquipoModal(false)
      setEditingEquipo(null)
      cargarDatos()
    }
    setSaving(false)
  }

  // Funciones para Trámites
  const handleTramiteChange = (e) => {
    setTramiteFormData({ ...tramiteFormData, [e.target.name]: e.target.value })
  }

  const handleAddTramite = () => {
    setEditingTramite(null)
    setTramiteFormData({
      tipo: "mantenimiento",
      equipo_id: "",
      descripcion: "",
      monto: "",
      moneda: "USD",
      fecha_programada: "",
      estado: "pendiente"
    })
    setShowTramiteModal(true)
  }

  const handleEditTramite = (tramite) => {
    setEditingTramite(tramite)
    setTramiteFormData({
      tipo: tramite.tipo || "mantenimiento",
      equipo_id: tramite.equipo_id || "",
      descripcion: tramite.descripcion || "",
      monto: tramite.monto || "",
      moneda: tramite.moneda || "USD",
      fecha_programada: tramite.fecha_programada || "",
      estado: tramite.estado || "pendiente"
    })
    setShowTramiteModal(true)
  }

  const handleSubmitTramite = async (e) => {
    e.preventDefault()
    setSaving(true)

    let error
    if (editingTramite) {
      const result = await supabase
        .from("tramites")
        .update(tramiteFormData)
        .eq("id", editingTramite.id)
      error = result.error
    } else {
      const result = await supabase
        .from("tramites")
        .insert([{ ...tramiteFormData, cliente_id: params.id }])
      error = result.error
    }

    if (!error) {
      setShowTramiteModal(false)
      setEditingTramite(null)
      cargarDatos()
    }
    setSaving(false)
  }

  const estadoConfig = {
    pendiente: {
      bg: "bg-yellow-500/20",
      text: "text-yellow-500",
      border: "border-yellow-500/30",
      label: "Pendiente"
    },
    en_proceso: {
      bg: "bg-blue-500/20",
      text: "text-blue-500",
      border: "border-blue-500/30",
      label: "En Proceso"
    },
    completado: {
      bg: "bg-green-500/20",
      text: "text-green-500",
      border: "border-green-500/30",
      label: "Completado"
    },
    cancelado: {
      bg: "bg-red-500/20",
      text: "text-red-500",
      border: "border-red-500/30",
      label: "Cancelado"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!cliente) return null

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/clientes"
          className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Perfil de Cliente</h1>
          <p className="text-xs text-gray-400">Información detallada y actividad</p>
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

      {/* Cliente Info Card */}
      <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-6 border border-white/10 mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-xl">
            <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-3">{cliente.nombre}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cliente.email && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-300">{cliente.email}</span>
                </div>
              )}
              {cliente.telefono && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-sm text-gray-300">{cliente.telefono}</span>
                </div>
              )}
              {cliente.direccion && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="text-sm text-gray-300">{cliente.direccion}</span>
                </div>
              )}
              {cliente.ciudad && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm text-gray-300">{cliente.ciudad}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-4 border border-white/10">
          <p className="text-xs text-gray-400 mb-1">Equipos</p>
          <p className="text-3xl font-bold text-white">{equipos.length}</p>
        </div>
        <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-4 border border-yellow-500/30">
          <p className="text-xs text-gray-400 mb-1">Pendientes</p>
          <p className="text-3xl font-bold text-yellow-400">{tramitesPendientes.length}</p>
        </div>
        <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-4 border border-white/10">
          <p className="text-xs text-gray-400 mb-1">Completados</p>
          <p className="text-3xl font-bold text-gray-400">{tramitesHistorial.filter(t => t.estado === "completado").length}</p>
        </div>
      </div>

      {/* Equipos Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Equipos Asignados</h2>
          <button
            onClick={handleAddEquipo}
            className="flex items-center gap-1 px-3 py-1.5 bg-white text-black rounded-lg text-xs font-semibold hover:bg-gray-200 transition-all"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar equipo
          </button>
        </div>

        {equipos.length === 0 ? (
          <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-8 border border-white/10 text-center">
            <p className="text-sm text-gray-400">No hay equipos asignados a este cliente</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {equipos.map(equipo => (
              <div
                key={equipo.id}
                className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-4 border border-white/10 hover:border-white/30 transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-white rounded-lg">
                    <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-white">{equipo.marca} {equipo.modelo}</h3>
                    <p className="text-xs text-gray-400">{equipo.tipo || "Split"} • {equipo.capacidad || "N/A"}</p>
                    {equipo.ubicacion && <p className="text-xs text-gray-500 mt-1">{equipo.ubicacion}</p>}
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-white/10">
                  <Link
                    href={`/equipos/${equipo.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-white rounded-lg text-xs font-semibold hover:bg-white/10 transition-all"
                  >
                    Ver
                  </Link>
                  <button
                    onClick={() => handleEditEquipo(equipo)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-lg text-xs font-semibold hover:bg-gray-200 transition-all"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trámites Pendientes */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Trámites Activos</h2>
          <button
            onClick={handleAddTramite}
            className="flex items-center gap-1 px-3 py-1.5 bg-white text-black rounded-lg text-xs font-semibold hover:bg-gray-200 transition-all"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo trámite
          </button>
        </div>
        {tramitesPendientes.length === 0 ? (
          <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-8 border border-white/10 text-center">
            <p className="text-sm text-gray-400">No hay trámites pendientes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tramitesPendientes.map(tramite => {
              const config = estadoConfig[tramite.estado]
              return (
                <div
                  key={tramite.id}
                  className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">
                          {tramite.tipo === "mantenimiento" ? "🔧" : "💰"}
                        </span>
                        <h3 className="text-sm font-bold text-white">
                          {tramite.equipos?.marca} {tramite.equipos?.modelo}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-400 mb-2">{tramite.descripcion || "Sin descripción"}</p>
                      <div className="flex items-center gap-3 text-xs">
                        {tramite.fecha_programada && (
                          <span className="text-gray-500">
                            📅 {new Date(tramite.fecha_programada).toLocaleDateString("es-UY")}
                          </span>
                        )}
                        {tramite.monto && (
                          <span className="text-gray-500">
                            💵 {tramite.moneda || "USD"} {tramite.monto}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} border ${config.border} whitespace-nowrap`}>
                      {config.label}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-white/10">
                    <Link
                      href={`/tramites/${tramite.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-white rounded-lg text-xs font-semibold hover:bg-white/10 transition-all"
                    >
                      Ver
                    </Link>
                    <button
                      onClick={() => handleEditTramite(tramite)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-lg text-xs font-semibold hover:bg-gray-200 transition-all"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Historial */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Historial</h2>
        {tramitesHistorial.length === 0 ? (
          <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-8 border border-white/10 text-center">
            <p className="text-sm text-gray-400">Sin historial de trámites</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tramitesHistorial.map(tramite => {
              const config = estadoConfig[tramite.estado]
              return (
                <div
                  key={tramite.id}
                  className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-4 border border-white/10 opacity-75 hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">
                          {tramite.tipo === "mantenimiento" ? "🔧" : "💰"}
                        </span>
                        <h3 className="text-sm font-bold text-white">
                          {tramite.equipos?.marca} {tramite.equipos?.modelo}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-400 mb-2">{tramite.descripcion || "Sin descripción"}</p>
                      <div className="flex items-center gap-3 text-xs">
                        {tramite.fecha_programada && (
                          <span className="text-gray-500">
                            📅 {new Date(tramite.fecha_programada).toLocaleDateString("es-UY")}
                          </span>
                        )}
                        {tramite.monto && (
                          <span className="text-gray-500">
                            💵 {tramite.moneda || "USD"} {tramite.monto}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} border ${config.border} whitespace-nowrap`}>
                      {config.label}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-white/10">
                    <Link
                      href={`/tramites/${tramite.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-white rounded-lg text-xs font-semibold hover:bg-white/10 transition-all"
                    >
                      Ver
                    </Link>
                    <button
                      onClick={() => handleEditTramite(tramite)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/10 text-white rounded-lg text-xs font-semibold hover:bg-white/20 transition-all"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Editar Cliente</h2>
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
                  Nombre *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Ciudad
                </label>
                <input
                  type="text"
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                />
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

      {/* Modal Equipo */}
      {showEquipoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                {editingEquipo ? "Editar Equipo" : "Nuevo Equipo"}
              </h2>
              <button
                onClick={() => setShowEquipoModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitEquipo} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Marca *
                </label>
                <input
                  type="text"
                  name="marca"
                  value={equipoFormData.marca}
                  onChange={handleEquipoChange}
                  required
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Modelo *
                </label>
                <input
                  type="text"
                  name="modelo"
                  value={equipoFormData.modelo}
                  onChange={handleEquipoChange}
                  required
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Tipo
                </label>
                <select
                  name="tipo"
                  value={equipoFormData.tipo}
                  onChange={handleEquipoChange}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                >
                  <option value="split">Split</option>
                  <option value="cassette">Cassette</option>
                  <option value="piso-techo">Piso-Techo</option>
                  <option value="multi-split">Multi-Split</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Capacidad
                </label>
                <input
                  type="text"
                  name="capacidad"
                  value={equipoFormData.capacidad}
                  onChange={handleEquipoChange}
                  placeholder="Ej: 12000 BTU, 3500 Frigorías"
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Ubicación
                </label>
                <input
                  type="text"
                  name="ubicacion"
                  value={equipoFormData.ubicacion}
                  onChange={handleEquipoChange}
                  placeholder="Ej: Sala principal, Oficina 2"
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEquipoModal(false)}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-sm font-semibold hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : (editingEquipo ? 'Actualizar' : 'Guardar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Trámite */}
      {showTramiteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                {editingTramite ? "Editar Trámite" : "Nuevo Trámite"}
              </h2>
              <button
                onClick={() => setShowTramiteModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitTramite} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Tipo de Trámite *
                </label>
                <select
                  name="tipo"
                  value={tramiteFormData.tipo}
                  onChange={handleTramiteChange}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                >
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="abono">Abono</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Equipo *
                </label>
                <select
                  name="equipo_id"
                  value={tramiteFormData.equipo_id}
                  onChange={handleTramiteChange}
                  required
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                >
                  <option value="">Seleccionar equipo...</option>
                  {equipos.map(equipo => (
                    <option key={equipo.id} value={equipo.id}>
                      {equipo.marca} {equipo.modelo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={tramiteFormData.descripcion}
                  onChange={handleTramiteChange}
                  rows={3}
                  placeholder="Describe el trabajo a realizar..."
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
                      checked={tramiteFormData.moneda === "USD"}
                      onChange={handleTramiteChange}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-white">USD</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="moneda"
                      value="UYU"
                      checked={tramiteFormData.moneda === "UYU"}
                      onChange={handleTramiteChange}
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
                  value={tramiteFormData.monto}
                  onChange={handleTramiteChange}
                  step="0.01"
                  placeholder="0.00"
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
                  value={tramiteFormData.fecha_programada}
                  onChange={handleTramiteChange}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Estado
                </label>
                <select
                  name="estado"
                  value={tramiteFormData.estado}
                  onChange={handleTramiteChange}
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
                  onClick={() => setShowTramiteModal(false)}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-sm font-semibold hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : (editingTramite ? 'Actualizar' : 'Guardar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
