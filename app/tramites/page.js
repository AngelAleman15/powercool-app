"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { useDemoMode } from "@/lib/useDemoMode"
import { DEMO_CLIENTES, DEMO_EQUIPOS, DEMO_TRAMITES } from "@/lib/demoData"

export default function Tramites() {
  const [tramites, setTramites] = useState([])
  const [equipos, setEquipos] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showEquipoModal, setShowEquipoModal] = useState(false)
  const [tipoTramite, setTipoTramite] = useState("mantenimiento")
  const [editingTramite, setEditingTramite] = useState(null)
  const [estadoMenuAbierto, setEstadoMenuAbierto] = useState(null)
  const closeEstadoMenuRef = useRef(null)
  const { demoMode } = useDemoMode()
  
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
  }, [demoMode])

  useEffect(() => {
    const cerrarMenuEstado = (event) => {
      if (!event.target.closest(".estado-menu-wrapper")) {
        setEstadoMenuAbierto(null)
      }
    }

    document.addEventListener("pointerdown", cerrarMenuEstado)
    return () => document.removeEventListener("pointerdown", cerrarMenuEstado)
  }, [])

  useEffect(() => {
    return () => {
      if (closeEstadoMenuRef.current) {
        clearTimeout(closeEstadoMenuRef.current)
      }
    }
  }, [])

  const cargarDatos = async () => {
    if (demoMode) {
      setTramites(DEMO_TRAMITES)
      setEquipos(DEMO_EQUIPOS.map((e) => ({ id: e.id, marca: e.marca, modelo: e.modelo, cliente_id: e.cliente_id })))
      setClientes(DEMO_CLIENTES)
      setLoading(false)
      return
    }

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
    if (demoMode) return
    
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
    if (demoMode) {
      setTramites((prev) => prev.map((t) => (t.id === tramiteId ? { ...t, estado: nuevoEstado } : t)))
      return
    }

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

    if (demoMode) {
      setShowModal(false)
      setEditingTramite(null)
      return
    }
    
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

  const openEstadoMenu = (tramiteId) => {
    if (closeEstadoMenuRef.current) {
      clearTimeout(closeEstadoMenuRef.current)
    }
    setEstadoMenuAbierto(tramiteId)
  }

  const scheduleCloseEstadoMenu = (tramiteId) => {
    if (closeEstadoMenuRef.current) {
      clearTimeout(closeEstadoMenuRef.current)
    }
    closeEstadoMenuRef.current = setTimeout(() => {
      setEstadoMenuAbierto((prev) => (prev === tramiteId ? null : prev))
    }, 160)
  }

  const getEstadoBadge = (estado, tramiteId, canChange = true) => {
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
    
    if (!canChange) {
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${estilos[estado]}`}>
          {textos[estado]}
        </span>
      )
    }

    return (
      <div
        className="relative estado-menu-wrapper"
        onMouseEnter={() => openEstadoMenu(tramiteId)}
        onMouseLeave={() => scheduleCloseEstadoMenu(tramiteId)}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            if (closeEstadoMenuRef.current) {
              clearTimeout(closeEstadoMenuRef.current)
            }
            setEstadoMenuAbierto((prev) => (prev === tramiteId ? null : tramiteId))
          }}
          className={`px-2 py-1 rounded-full text-xs font-semibold border ${estilos[estado]} hover:brightness-110 transition-all`}
          title="Hover o toque para cambiar estado"
        >
          {textos[estado]}
        </button>

        {estadoMenuAbierto === tramiteId && (
          <div
            className="absolute left-0 top-full mt-1 z-30 min-w-[150px] rounded-lg border border-white/15 bg-[#0c0d10] p-1.5 shadow-xl"
            onMouseEnter={() => openEstadoMenu(tramiteId)}
            onMouseLeave={() => scheduleCloseEstadoMenu(tramiteId)}
          >
            {Object.entries(textos).map(([estadoKey, estadoLabel]) => (
              <button
                key={estadoKey}
                type="button"
                disabled={estadoKey === estado}
                onClick={() => {
                  cambiarEstado(tramiteId, estadoKey)
                  setEstadoMenuAbierto(null)
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-all ${
                  estadoKey === estado
                    ? "bg-white/10 text-gray-500 cursor-default"
                    : "text-white hover:bg-white/10"
                }`}
              >
                {estadoLabel}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  const tramitesActivos = tramites.filter(
    (t) => t.tipo === tipoTramite && t.estado !== "completado" && t.estado !== "cancelado"
  )

  const tramitesHistorial = tramites
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return (
    <div className="py-4 sm:py-6">
      {/* Header */}
      <div className="px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Trámites</h1>
          <p className="text-xs text-gray-400">Gestión integral de mantenimientos y abonos</p>
        </div>
        <button
          onClick={() => !demoMode && setShowModal(true)}
          disabled={demoMode}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all w-full sm:w-auto justify-center ${
            demoMode
              ? "bg-[#e8eff9] text-[#7f96b8] cursor-not-allowed"
              : "bg-white text-black hover:bg-gray-200"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Trámite
        </button>
      </div>

      {/* Tabs con nuevo estilo */}
      <div className="px-4 sm:px-6 mb-6">
        <div className="inline-flex rounded-lg border border-[#cad8ea] bg-white overflow-hidden">
          <button
            onClick={() => setTipoTramite("mantenimiento")}
            className={`px-4 py-2 text-sm font-semibold transition-all ${
              tipoTramite === "mantenimiento"
                ? "bg-[#1f6bc1] text-white"
                : "text-[#1f6bc1] hover:bg-[#f7faff]"
            }`}
          >
            Mantenimientos
          </button>
          <div className="w-px bg-[#e8eff9]" />
          <button
            onClick={() => setTipoTramite("abono")}
            className={`px-4 py-2 text-sm font-semibold transition-all ${
              tipoTramite === "abono"
                ? "bg-[#1f6bc1] text-white"
                : "text-[#1f6bc1] hover:bg-[#f7faff]"
            }`}
          >
            Abonos
          </button>
          <div className="w-px bg-[#e8eff9]" />
          <button
            onClick={() => setTipoTramite("historial")}
            className={`px-4 py-2 text-sm font-semibold transition-all ${
              tipoTramite === "historial"
                ? "bg-[#1f6bc1] text-white"
                : "text-[#1f6bc1] hover:bg-[#f7faff]"
            }`}
          >
            Historial
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="px-4 sm:px-6 flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#d8e4f3] border-b-[#2d72c4]" />
        </div>
      ) : (
        <>
          {/* Historial */}
          {tipoTramite === "historial" ? (
            tramitesHistorial.length === 0 ? (
              <div className="px-4 sm:px-6">
                <div className="text-center py-12 bg-[#f7faff] rounded-xl border border-[#d1dcec]">
                  <svg className="mx-auto h-8 w-8 text-[#a2bbe0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-semibold text-[#2a4d7a]">No hay trámites completados</h3>
                </div>
              </div>
            ) : (
              <div className="px-4 sm:px-6">
                <div className="rounded-xl border border-[#d1dcec] bg-[#f7faff] overflow-hidden shadow-[0_6px_16px_rgba(36,84,145,.11)]">
                  <div className="px-4 py-3 border-b border-[#dbe4f3]">
                    <h2 className="text-lg font-bold text-[#284a76]">Historial de Trámites</h2>
                    <p className="text-xs text-[#6f87a8] mt-1">Trámites completados y cancelados.</p>
                  </div>
                  <div className="p-4 space-y-2 max-h-[68vh] overflow-y-auto">
                    {tramitesHistorial.map((tramite) => (
                      <div key={tramite.id} className="rounded-md border border-[#dbe6f4] bg-white p-3">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <p className="text-sm font-semibold text-[#2a4d7a] truncate">
                                {tramite.equipos ? `${tramite.equipos.marca} ${tramite.equipos.modelo}` : "Equipo no especificado"}
                              </p>
                              {getEstadoBadge(tramite.estado, tramite.id)}
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#e8eff9] text-[#2f69b0] font-semibold uppercase tracking-wide">
                                {tramite.tipo}
                              </span>
                            </div>
                            {tramite.clientes && <p className="text-xs text-[#607b9f]">Cliente: {tramite.clientes.nombre}</p>}
                            <p className="text-[11px] text-[#6d84a5] mt-1">
                              Creado: {new Date(tramite.created_at).toLocaleDateString("es-UY")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Link
                              href={`/tramites/${tramite.id}`}
                              className="px-2.5 py-1.5 rounded-md bg-[#edf4ff] text-[#1f6bc1] text-xs font-semibold hover:bg-[#dfebff]"
                            >
                              Ver
                            </Link>
                            <button
                              onClick={() => handleEditTramite(tramite)}
                              className="px-2.5 py-1.5 rounded-md bg-white text-black text-xs font-semibold hover:bg-gray-200 border border-[#cad8ea]"
                            >
                              Editar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          ) :
          /* Tramites Activos por categoria */
          tramitesActivos.length === 0 ? (
            <div className="px-4 sm:px-6">
              <div className="text-center py-12 bg-[#f7faff] rounded-xl border border-[#d1dcec]">
                <svg className="mx-auto h-8 w-8 text-[#a2bbe0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-semibold text-[#2a4d7a]">
                  No hay {tipoTramite === "mantenimiento" ? "mantenimientos" : "abonos"} activos
                </h3>
                <p className="mt-1 text-xs text-[#6f87a8]">
                  Los completados y cancelados están en Historial
                </p>
              </div>
            </div>
          ) : (
            <div className="px-4 sm:px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {tramitesActivos.map(tramite => (
                  <article
                    key={tramite.id}
                    className="rounded-xl border border-[#d4e0f1] bg-white p-4 shadow-[0_4px_12px_rgba(36,84,145,.08)] hover:shadow-[0_6px_16px_rgba(36,84,145,.12)] transition-all"
                  >
                    {/* Header con tipo y estado */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#e8eff9] text-[#2f69b0]">
                            {tramite.tipo === "mantenimiento" ? "Mantenimiento" : "Abono"}
                          </span>
                          {getEstadoBadge(tramite.estado, tramite.id)}
                        </div>
                        <h3 className="text-base font-bold text-[#294f7d] truncate">
                          {tramite.equipos ? `${tramite.equipos.marca} ${tramite.equipos.modelo}` : 'Equipo no especificado'}
                        </h3>
                        {tramite.clientes && (
                          <p className="text-xs text-[#607b9f] mt-1">
                            Cliente: {tramite.clientes.nombre}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Descripción */}
                    {tramite.descripcion && (
                      <p className="text-xs text-[#5f7ea4] bg-[#f8fbff] px-2.5 py-2 rounded-md mb-3">
                        {tramite.descripcion}
                      </p>
                    )}

                    {/* Información de fecha y monto */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {tramite.fecha_programada && (
                        <div className="rounded-md border border-[#dbe6f4] bg-[#f8fbff] px-2.5 py-2 flex flex-col">
                          <p className="text-[11px] text-[#5f7ea4]">Fecha programada</p>
                          <span className="text-xs text-[#355985] font-bold mt-1">
                            {new Date(tramite.fecha_programada).toLocaleDateString("es-UY")}
                          </span>
                        </div>
                      )}
                      {tramite.monto && (
                        <div className="rounded-md border border-[#dbe6f4] bg-[#f8fbff] px-2.5 py-2 flex flex-col">
                          <p className="text-[11px] text-[#5f7ea4]">Monto</p>
                          <span className="text-xs text-[#355985] font-bold mt-1">
                            ${parseFloat(tramite.monto).toLocaleString()} {tramite.moneda || 'USD'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/tramites/${tramite.id}`}
                        className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-[#edf4ff] text-[#1f6bc1] text-[11px] font-semibold hover:bg-[#dfebff]"
                      >
                        Ver detalles
                      </Link>
                      <button
                        onClick={() => handleEditTramite(tramite)}
                        className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-white text-black text-[11px] font-semibold hover:bg-gray-200 border border-[#cad8ea]"
                      >
                        Editar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Crear Trámite */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#d1dcec] rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#2a4d7a]">
                {editingTramite ? "Editar" : "Nuevo"} {tipoTramite === "mantenimiento" ? "Mantenimiento" : "Abono"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-[#a2bbe0] hover:text-[#2a4d7a] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Cliente primero */}
              <div>
                <label className="block text-xs font-medium text-[#607b9f] mb-1">
                  Cliente *
                </label>
                <select
                  name="cliente_id"
                  value={formData.cliente_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-white border border-[#cad8ea] rounded-lg text-[#1f4371] text-sm focus:outline-none focus:ring-2 focus:ring-[#a2bbe0]"
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
                <label className="block text-xs font-medium text-[#607b9f] mb-1">
                  Equipo *
                </label>
                <div className="flex gap-2">
                  <select
                    name="equipo_id"
                    value={formData.equipo_id}
                    onChange={handleChange}
                    required
                    disabled={!formData.cliente_id}
                    className="flex-1 px-3 py-2 bg-white border border-[#cad8ea] rounded-lg text-[#1f4371] text-sm focus:outline-none focus:ring-2 focus:ring-[#a2bbe0] disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="px-3 py-2 bg-[#edf4ff] border border-[#cad8ea] text-[#1f6bc1] text-sm rounded-lg hover:bg-[#dfeeff] transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap font-semibold"
                    title="Crear equipo rápido"
                  >
                    + Equipo
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#607b9f] mb-1">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  rows={3}
                  placeholder={tipoTramite === "mantenimiento" ? "Ej: Limpieza de filtros, revisión general..." : "Ej: Pago mensual, anticipo..."}
                  className="w-full px-3 py-2 bg-white border border-[#cad8ea] rounded-lg text-[#1f4371] text-sm focus:outline-none focus:ring-2 focus:ring-[#a2bbe0]"
                />
              </div>

              {/* Selector de moneda */}
              <div>
                <label className="block text-xs font-medium text-[#607b9f] mb-1">
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
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-[#1f4371]">USD (Dólares)</span>
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
                    <span className="text-sm text-[#1f4371]">UYU (Pesos)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#607b9f] mb-1">
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
                  className="w-full px-3 py-2 bg-white border border-[#cad8ea] rounded-lg text-[#1f4371] text-sm focus:outline-none focus:ring-2 focus:ring-[#a2bbe0]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#607b9f] mb-1">
                  Fecha Programada
                </label>
                <input
                  type="date"
                  name="fecha_programada"
                  value={formData.fecha_programada}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-[#cad8ea] rounded-lg text-[#1f4371] text-sm focus:outline-none focus:ring-2 focus:ring-[#a2bbe0]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#607b9f] mb-1">
                  Estado
                </label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-[#cad8ea] rounded-lg text-[#1f4371] text-sm focus:outline-none focus:ring-2 focus:ring-[#a2bbe0]"
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
                  className="flex-1 px-4 py-2 bg-[#edf4ff] border border-[#cad8ea] text-[#1f6bc1] rounded-lg text-sm font-semibold hover:bg-[#dfeeff] transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 border border-[#cad8ea] transition-all"
                >
                  {editingTramite ? "Actualizar" : "Crear Trámite"}
                </button>
              </div>
            </form>
          </div>
      {/* Modal Crear Equipo Rápido */}
      {showEquipoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white border border-[#d1dcec] rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#2a4d7a]">Crear Equipo Rápido</h2>
              <button
                onClick={() => setShowEquipoModal(false)}
                className="text-[#a2bbe0] hover:text-[#2a4d7a] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); crearEquipoRapido(); }} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#607b9f] mb-1">
                  Marca *
                </label>
                <input
                  type="text"
                  value={nuevoEquipo.marca}
                  onChange={(e) => handleEquipoChange('marca', e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-[#cad8ea] rounded-lg text-[#1f4371] text-sm focus:outline-none focus:ring-2 focus:ring-[#a2bbe0]"
                  placeholder="Ej: LG, Samsung, Carrier..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#607b9f] mb-1">
                  Modelo *
                </label>
                <input
                  type="text"
                  value={nuevoEquipo.modelo}
                  onChange={(e) => handleEquipoChange('modelo', e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-[#cad8ea] rounded-lg text-[#1f4371] text-sm focus:outline-none focus:ring-2 focus:ring-[#a2bbe0]"
                  placeholder="Ej: ABC-123"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#607b9f] mb-1">
                  Tipo
                </label>
                <select
                  value={nuevoEquipo.tipo}
                  onChange={(e) => handleEquipoChange('tipo', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#cad8ea] rounded-lg text-[#1f4371] text-sm focus:outline-none focus:ring-2 focus:ring-[#a2bbe0]"
                >
                  <option value="split">Split</option>
                  <option value="ventana">Ventana</option>
                  <option value="central">Central</option>
                  <option value="portatil">Portátil</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#607b9f] mb-1">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={nuevoEquipo.ubicacion}
                  onChange={(e) => handleEquipoChange('ubicacion', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#cad8ea] rounded-lg text-[#1f4371] text-sm focus:outline-none focus:ring-2 focus:ring-[#a2bbe0]"
                  placeholder="Ej: Sala, Dormitorio principal..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#607b9f] mb-1">
                  Capacidad
                </label>
                <input
                  type="text"
                  value={nuevoEquipo.capacidad}
                  onChange={(e) => handleEquipoChange('capacidad', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#cad8ea] rounded-lg text-[#1f4371] text-sm focus:outline-none focus:ring-2 focus:ring-[#a2bbe0]"
                  placeholder="Ej: 12000 BTU, 3000 frigorías..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEquipoModal(false)}
                  className="flex-1 px-4 py-2 bg-[#edf4ff] border border-[#cad8ea] text-[#1f6bc1] rounded-lg text-sm font-semibold hover:bg-[#dfeeff] transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 border border-[#cad8ea] transition-all"
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
