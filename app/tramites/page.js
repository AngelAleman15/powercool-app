"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function Tramites() {
  const [tramites, setTramites] = useState([])
  const [equipos, setEquipos] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showEquipoModal, setShowEquipoModal] = useState(false)
  const [tipoTramite, setTipoTramite] = useState("mantenimiento")
  const [editingTramite, setEditingTramite] = useState(null)
  
  const [formData, setFormData] = useState({
    tipo: "mantenimiento",
    equipo_id: "",
    cliente_id: "",
    descripcion: "",
    monto: "",
    moneda: "USD",
    fecha_programada: "",
    estado: "pendiente"
  })

  const [nuevoEquipo, setNuevoEquipo] = useState({
    marca: "",
    modelo: "",
    ubicacion: "",
    tipo: "split",
    capacidad: ""
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)
    
    const [{ data: tramitesData }, { data: equiposData }, { data: clientesData }] = await Promise.all([
      supabase.from("tramites").select("*, equipos(marca, modelo), clientes(nombre)").order("created_at", { ascending: false }),
      supabase.from("equipos").select("id, marca, modelo, cliente_id"),
      supabase.from("clientes").select("*")
    ])

    setTramites(tramitesData || [])
    setEquipos(equiposData || [])
    setClientes(clientesData || [])
    setLoading(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    
    // Limpiar equipo seleccionado si se cambia el cliente
    if (name === "cliente_id") {
      setFormData(prev => ({ ...prev, equipo_id: "" }))
    }
  }

  const handleEquipoChange = (name, value) => {
    setNuevoEquipo(prev => ({ ...prev, [name]: value }))
  }

  const crearEquipoRapido = async () => {
    
    const { data, error } = await supabase
      .from("equipos")
      .insert([{ ...nuevoEquipo, cliente_id: formData.cliente_id }])
      .select()
      .single()

    if (!error && data) {
      setFormData({ ...formData, equipo_id: data.id })
      setNuevoEquipo({ marca: "", modelo: "", ubicacion: "", tipo: "split", capacidad: "" })
      setShowEquipoModal(false)
      cargarDatos()
    }
  }

  const cambiarEstado = async (tramiteId, nuevoEstado) => {
    const { error } = await supabase
      .from("tramites")
      .update({ estado: nuevoEstado })
      .eq("id", tramiteId)

    if (!error) {
      cargarDatos()
    }
  }

  const equiposFiltrados = formData.cliente_id 
    ? equipos.filter(e => e.cliente_id === formData.cliente_id)
    : []

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    let error
    if (editingTramite) {
      // Actualizar trámite existente
      const result = await supabase
        .from("tramites")
        .update({ ...formData, tipo: tipoTramite })
        .eq("id", editingTramite)
      error = result.error
    } else {
      // Insertar nuevo trámite
      const result = await supabase
        .from("tramites")
        .insert([{ ...formData, tipo: tipoTramite }])
      error = result.error
    }

    if (!error) {
      setShowModal(false)
      setEditingTramite(null)
      setFormData({
        tipo: "mantenimiento",
        equipo_id: "",
        cliente_id: "",
        descripcion: "",
        monto: "",
        moneda: "USD",
        fecha_programada: "",
        estado: "pendiente"
      })
      cargarDatos()
    }
  }

  const handleEditTramite = (tramite) => {
    setEditingTramite(tramite.id)
    setTipoTramite(tramite.tipo)
    setFormData({
      tipo: tramite.tipo,
      equipo_id: tramite.equipo_id || "",
      cliente_id: tramite.cliente_id || "",
      descripcion: tramite.descripcion || "",
      monto: tramite.monto || "",
      moneda: tramite.moneda || "USD",
      fecha_programada: tramite.fecha_programada || "",
      estado: tramite.estado || "pendiente"
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingTramite(null)
    setFormData({
      tipo: "mantenimiento",
      equipo_id: "",
      cliente_id: "",
      descripcion: "",
      monto: "",
      moneda: "USD",
      fecha_programada: "",
      estado: "pendiente"
    })
  }

  const getEstadoBadge = (estado) => {
    const estilos = {
      pendiente: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
      en_proceso: "bg-blue-500/20 text-blue-500 border-blue-500/30",
      completado: "bg-green-500/20 text-green-500 border-green-500/30",
      cancelado: "bg-red-500/20 text-red-500 border-red-500/30"
    }
    
    const textos = {
      pendiente: "Pendiente",
      en_proceso: "En Proceso",
      completado: "Completado",
      cancelado: "Cancelado"
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${estilos[estado]}`}>
        {textos[estado]}
      </span>
    )
  }

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            Trámites
          </h1>
          <p className="text-xs text-gray-400">
            Gestión de mantenimientos y abonos
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all w-full sm:w-auto justify-center"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Trámite
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10 overflow-x-auto">
        <button
          onClick={() => setTipoTramite("mantenimiento")}
          className={`px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${
            tipoTramite === "mantenimiento"
              ? "text-white border-b-2 border-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Mantenimientos
        </button>
        <button
          onClick={() => setTipoTramite("abono")}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            tipoTramite === "abono"
              ? "text-white border-b-2 border-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Abonos
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : (
        <>
          {/* Tramites List */}
          {tramites.filter(t => t.tipo === tipoTramite).length === 0 ? (
            <div className="text-center py-12 bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl border border-white/10">
              <svg className="mx-auto h-8 w-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-xs font-medium text-white">
                No hay {tipoTramite === "mantenimiento" ? "mantenimientos" : "abonos"} registrados
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Crea uno nuevo para comenzar
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tramites.filter(t => t.tipo === tipoTramite).map(tramite => (
                <div
                  key={tramite.id}
                  className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-lg border border-white/10 p-4 hover:border-white/30 transition-all"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-3">
                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-base font-bold text-white">
                          {tramite.equipos ? `${tramite.equipos.marca} ${tramite.equipos.modelo}` : 'Equipo no especificado'}
                        </h3>
                        {getEstadoBadge(tramite.estado)}
                      </div>
                      {tramite.clientes && (
                        <p className="text-xs text-gray-400 mb-2">
                          Cliente: {tramite.clientes.nombre}
                        </p>
                      )}
                      {tramite.descripcion && (
                        <p className="text-sm text-gray-300 mb-2">{tramite.descripcion}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
                        {tramite.fecha_programada && (
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(tramite.fecha_programada).toLocaleDateString()}
                          </div>
                        )}
                        {tramite.monto && (
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            ${parseFloat(tramite.monto).toLocaleString()} {tramite.moneda || 'USD'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Selector de Estado */}
                  <div className="border-t border-white/10 pt-3">
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={() => handleEditTramite(tramite)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-black rounded-lg text-xs font-semibold hover:bg-gray-200 transition-all"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                      </button>
                    </div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">
                      Cambiar estado:
                    </label>
                    <select
                      value={tramite.estado}
                      onChange={(e) => cambiarEstado(tramite.id, e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="en_proceso">En Proceso</option>
                      <option value="completado">Completado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal Crear Trámite */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                {editingTramite ? "Editar" : "Nuevo"} {tipoTramite === "mantenimiento" ? "Mantenimiento" : "Abono"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Cliente primero */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Cliente *
                </label>
                <select
                  name="cliente_id"
                  value={formData.cliente_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Equipo con filtro y creación rápida */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Equipo *
                </label>
                <div className="flex gap-2">
                  <select
                    name="equipo_id"
                    value={formData.equipo_id}
                    onChange={handleChange}
                    required
                    disabled={!formData.cliente_id}
                    className="flex-1 px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {formData.cliente_id ? "Seleccionar equipo..." : "Primero seleccione un cliente"}
                    </option>
                    {equiposFiltrados.map(equipo => (
                      <option key={equipo.id} value={equipo.id}>
                        {equipo.marca} {equipo.modelo}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowEquipoModal(true)}
                    disabled={!formData.cliente_id}
                    className="px-3 py-2 bg-white/5 border border-white/10 text-white text-sm rounded-lg hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    title="Crear equipo rápido"
                  >
                    + Equipo
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  rows={3}
                  placeholder={tipoTramite === "mantenimiento" ? "Ej: Limpieza de filtros, revisión general..." : "Ej: Pago mensual, anticipo..."}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                />
              </div>

              {/* Selector de moneda */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Moneda *
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="moneda"
                      value="USD"
                      checked={formData.moneda === "USD"}
                      onChange={handleChange}
                      className="w-4 h-4 text-white bg-black border-white/20 focus:ring-white/20"
                    />
                    <span className="text-sm text-white">USD (Dólares)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="moneda"
                      value="UYU"
                      checked={formData.moneda === "UYU"}
                      onChange={handleChange}
                      className="w-4 h-4 text-white bg-black border-white/20 focus:ring-white/20"
                    />
                    <span className="text-sm text-white">UYU (Pesos)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Monto ({formData.moneda}) {tipoTramite === "abono" && "*"}
                </label>
                <input
                  type="number"
                  name="monto"
                  value={formData.monto}
                  onChange={handleChange}
                  required={tipoTramite === "abono"}
                  placeholder="0.00"
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
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-sm font-semibold hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all"
                >
                  {editingTramite ? "Actualizar" : "Crear Trámite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear Equipo Rápido */}
      {showEquipoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-[#111] border border-white/10 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Crear Equipo Rápido</h2>
              <button
                onClick={() => setShowEquipoModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); crearEquipoRapido(); }} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Marca *
                </label>
                <input
                  type="text"
                  value={nuevoEquipo.marca}
                  onChange={(e) => handleEquipoChange('marca', e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                  placeholder="Ej: LG, Samsung, Carrier..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Modelo *
                </label>
                <input
                  type="text"
                  value={nuevoEquipo.modelo}
                  onChange={(e) => handleEquipoChange('modelo', e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                  placeholder="Ej: ABC-123"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Tipo
                </label>
                <select
                  value={nuevoEquipo.tipo}
                  onChange={(e) => handleEquipoChange('tipo', e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                >
                  <option value="split">Split</option>
                  <option value="ventana">Ventana</option>
                  <option value="central">Central</option>
                  <option value="portatil">Portátil</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={nuevoEquipo.ubicacion}
                  onChange={(e) => handleEquipoChange('ubicacion', e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                  placeholder="Ej: Sala, Dormitorio principal..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Capacidad
                </label>
                <input
                  type="text"
                  value={nuevoEquipo.capacidad}
                  onChange={(e) => handleEquipoChange('capacidad', e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                  placeholder="Ej: 12000 BTU, 3000 frigorías..."
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
                  className="flex-1 px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all"
                >
                  Crear Equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
