"use client"

import { useCallback, useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function Tramites() {
  const [tramites, setTramites] = useState([])
  const [equipos, setEquipos] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [showEquipoModal, setShowEquipoModal] = useState(false)
  const [tipoTramite, setTipoTramite] = useState("mantenimiento")
  const [editingTramite, setEditingTramite] = useState(null)
  const [estadoMenuAbierto, setEstadoMenuAbierto] = useState(null)
  const closeEstadoMenuRef = useRef(null)
  
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

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    setError("")
    
    const [{ data: tramitesData, error: tramitesError }, { data: equiposData, error: equiposError }, { data: clientesData, error: clientesError }] = await Promise.all([
      supabase.from("tramites").select("*, equipos(marca, modelo), clientes(nombre)").order("created_at", { ascending: false }),
      supabase.from("equipos").select("id, marca, modelo, cliente_id"),
      supabase.from("clientes").select("*")
    ])

    if (tramitesError || equiposError || clientesError) {
      setError("No se pudieron cargar todos los datos. Reintenta en unos segundos.")
    }
    setTramites(tramitesData || [])
    setEquipos(equiposData || [])
    setClientes(clientesData || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const initTimer = setTimeout(() => {
      cargarDatos()
    }, 0)

    return () => clearTimeout(initTimer)
  }, [cargarDatos])

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
    } else {
      setError("No se pudo actualizar el estado. Verifica tu conexión e inténtalo nuevamente.")
    }
  }

  const equiposFiltrados = formData.cliente_id 
    ? equipos.filter(e => e.cliente_id === formData.cliente_id)
    : []

  const handleSubmit = async (e) => {
    e.preventDefault()

    const parsedAmount = Number(formData.monto)
    const payload = {
      ...formData,
      tipo: tipoTramite,
      monto: formData.monto.trim() === "" ? null : Number.isFinite(parsedAmount) ? parsedAmount : null,
      fecha_programada: formData.fecha_programada || null,
    }

    let error
    if (editingTramite) {
      // Actualizar trámite existente
      const result = await supabase
        .from("tramites")
        .update(payload)
        .eq("id", editingTramite)
      error = result.error
    } else {
      // Insertar nuevo trámite
      const result = await supabase
        .from("tramites")
        .insert([payload])
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
    } else {
      setError("No se pudo guardar el trámite. Verifica los datos e inténtalo nuevamente.")
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
      pendiente: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
      en_proceso: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
      completado: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
      cancelado: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200"
    }
    
    const textos = {
      pendiente: "Pendiente",
      en_proceso: "En Proceso",
      completado: "Completado",
      cancelado: "Cancelado"
    }
    
    if (!canChange) {
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${estilos[estado]}`}>
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
          className={`min-h-8 px-2.5 py-1 rounded-full text-xs font-semibold ${estilos[estado]} hover:brightness-95 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          title="Haz clic para cambiar estado"
        >
          {textos[estado]}
        </button>

        {estadoMenuAbierto === tramiteId && (
          <div
            className="absolute left-0 top-full mt-1 z-30 min-w-[160px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10"
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
                    ? "bg-slate-50 text-slate-400 cursor-default"
                    : "text-slate-700 hover:bg-slate-50"
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
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-7 flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Operación técnica</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">Trámites</h1>
            <p className="mt-1.5 text-sm text-slate-500">Programa, supervisa y documenta mantenimientos y abonos.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Trámite
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          {error}
        </div>
      )}

      {/* Tabs con nuevo estilo */}
      <div className="mb-6 overflow-x-auto pb-1">
        <div className="inline-flex min-w-max rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            onClick={() => setTipoTramite("mantenimiento")}
            className={`px-4 py-2 text-sm font-semibold transition-all ${
              tipoTramite === "mantenimiento" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Mantenimientos
          </button>
          <button
            onClick={() => setTipoTramite("abono")}
            className={`px-4 py-2 text-sm font-semibold transition-all ${
              tipoTramite === "abono" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Abonos
          </button>
          <button
            onClick={() => setTipoTramite("historial")}
            className={`px-4 py-2 text-sm font-semibold transition-all ${
              tipoTramite === "historial" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Historial
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
        </div>
      ) : (
        <>
          {/* Historial */}
          {tipoTramite === "historial" ? (
            tramitesHistorial.length === 0 ? (
              <div>
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
                  <svg className="mx-auto h-9 w-9 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-3 text-base font-semibold text-slate-900">Aún no hay trámites en el historial</h3>
                </div>
              </div>
            ) : (
              <div>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="text-base font-semibold text-slate-950">Historial de trámites</h2>
                    <p className="mt-1 text-sm text-slate-500">Servicios completados, cancelados y sus actualizaciones.</p>
                  </div>
                  <div className="max-h-[68vh] space-y-2 overflow-y-auto p-3 sm:p-4">
                    {tramitesHistorial.map((tramite) => (
                      <div key={tramite.id} className="rounded-xl border border-slate-200 bg-white p-3.5 transition hover:border-slate-300 hover:shadow-sm">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {tramite.equipos ? `${tramite.equipos.marca} ${tramite.equipos.modelo}` : "Equipo no especificado"}
                              </p>
                              {getEstadoBadge(tramite.estado, tramite.id)}
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                                {tramite.tipo}
                              </span>
                            </div>
                            {tramite.clientes && <p className="text-xs text-slate-500">{tramite.clientes.nombre}</p>}
                            <p className="mt-1 text-[11px] text-slate-400">
                              Creado: {new Date(tramite.created_at).toLocaleDateString("es-UY")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Link
                              href={`/tramites/${tramite.id}`}
                              className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                            >
                              Ver
                            </Link>
                            <button
                              onClick={() => handleEditTramite(tramite)}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
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
            <div>
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
                <svg className="mx-auto h-9 w-9 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-3 text-base font-semibold text-slate-900">
                  No hay {tipoTramite === "mantenimiento" ? "mantenimientos" : "abonos"} activos
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Los completados y cancelados están en Historial
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {tramitesActivos.map(tramite => (
                  <article
                    key={tramite.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                  >
                    {/* Header con tipo y estado */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                            {tramite.tipo === "mantenimiento" ? "Mantenimiento" : "Abono"}
                          </span>
                          {getEstadoBadge(tramite.estado, tramite.id)}
                        </div>
                        <h3 className="text-base font-semibold text-slate-950 truncate">
                          {tramite.equipos ? `${tramite.equipos.marca} ${tramite.equipos.modelo}` : 'Equipo no especificado'}
                        </h3>
                        {tramite.clientes && (
                          <p className="mt-1 text-xs text-slate-500">
                            {tramite.clientes.nombre}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Descripción */}
                    {tramite.descripcion && (
                      <p className="mb-4 line-clamp-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-600">
                        {tramite.descripcion}
                      </p>
                    )}

                    {/* Información de fecha y monto */}
                    <div className="mb-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                      {tramite.fecha_programada && (
                        <div className="flex flex-col rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                          <p className="text-[11px] text-slate-500">Fecha programada</p>
                          <span className="mt-1 text-xs font-semibold text-slate-800">
                            {new Date(tramite.fecha_programada).toLocaleDateString("es-UY")}
                          </span>
                        </div>
                      )}
                      {tramite.monto && (
                        <div className="flex flex-col rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                          <p className="text-[11px] text-slate-500">Importe</p>
                          <span className="mt-1 text-xs font-semibold text-slate-800">
                            ${parseFloat(tramite.monto).toLocaleString()} {tramite.moneda || 'USD'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/tramites/${tramite.id}`}
                        className="inline-flex min-h-9 items-center justify-center rounded-lg bg-slate-100 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                      >
                        Ver detalles
                      </Link>
                      <button
                        onClick={() => handleEditTramite(tramite)}
                        className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4">
          <div role="dialog" aria-modal="true" aria-label="Trámite" className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-950">
                {editingTramite ? "Editar" : "Nuevo"} {tipoTramite === "mantenimiento" ? "Mantenimiento" : "Abono"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
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
                    className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                  className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-11 flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700"
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
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4">
          <div role="dialog" aria-modal="true" aria-label="Crear equipo rápido" className="w-full max-w-md rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6">
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
    </main>
  )
}
