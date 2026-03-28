"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { useDemoMode } from "@/lib/useDemoMode"
import { DEMO_CLIENTES, DEMO_EQUIPOS, DEMO_TRAMITES } from "@/lib/demoData"
import QRCodeComponent from "@/components/QRCodeComponent"

const CIUDADES_URUGUAY = [
  "Montevideo",
  "Las Piedras",
  "La Paz",
  "Pando",
  "Ciudad de la Costa",
  "Barros Blancos",
  "Toledo",
  "Santa Lucía",
  "Canelones",
  "Maldonado",
  "Punta del Este",
  "San Carlos",
  "Pan de Azúcar",
  "Piriápolis",
  "Aiguá",
  "Rocha",
  "Chuy",
  "Castillos",
  "La Paloma",
  "Lascano",
  "Velázquez",
  "Salto",
  "Bella Unión",
  "Constitución",
  "San Antonio",
  "Paysandú",
  "Quebracho",
  "Porvenir",
  "Mercedes",
  "Dolores",
  "Cardona",
  "Palmitas",
  "Guichón",
  "Tacuarembó",
  "Paso de los Toros",
  "San Gregorio de Polanco",
  "Ansina",
  "Rivera",
  "Tranqueras",
  "Vichadero",
  "Minas de Corrales",
  "Melo",
  "Río Branco",
  "Fraile Muerto",
  "Tupambaé",
  "Artigas",
  "Tomás Gomensoro",
  "Baltasar Brum",
  "Bella Unión",
  "Durazno",
  "Sarandí del Yí",
  "Carmen",
  "Blanquillo",
  "Florida",
  "Sarandí Grande",
  "Fray Marcos",
  "Casupá",
  "San José de Mayo",
  "Ciudad del Plata",
  "Libertad",
  "Ecilda Paullier",
  "Rodríguez",
  "Young",
  "Fray Bentos",
  "Nueva Palmira",
  "Colonia del Sacramento",
  "Rosario",
  "Juan Lacaze",
  "Carmelo",
  "Ombúes de Lavalle",
  "Nueva Helvecia",
  "Colonia Suiza",
  "Trinidad",
  "Ismael Cortinas",
  "Cardona",
  "Minas",
  "José Pedro Varela",
  "Mariscala",
  "Solís de Mataojo",
  "Treinta y Tres",
  "Vergara",
  "Santa Clara de Olimar",
  "Rincón",
  "Tarariras",
  "Sauce",
  "Santa Rosa",
  "Progreso",
  "Atenas",
  "Cebollatí",
  "Cebollatí",
  "Bañado de Medina"
]

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [equiposByCliente, setEquiposByCliente] = useState({})
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("todo")
  const [selectedClientId, setSelectedClientId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showEquiposModal, setShowEquiposModal] = useState(false)
  const [showMantenimientosModal, setShowMantenimientosModal] = useState(false)
  const [equiposDetalle, setEquiposDetalle] = useState([])
  const [tramitesDetalle, setTramitesDetalle] = useState([])
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    ciudad: ""
  })
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const { demoMode } = useDemoMode()
  const rowsPerPage = 5

  const demoStatusById = {
    "demo-c-1": "activo",
    "demo-c-2": "activo",
    "demo-c-3": "inactivo",
    "demo-c-4": "activo",
    "demo-c-5": "activo",
  }

  const getInitials = (name) => {
    if (!name) return "CL"
    const parts = name.trim().split(" ").filter(Boolean)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase()
  }

  const avatarPalette = ["#5ca7d6", "#6e9ad1", "#7fb8a4", "#92a7cb", "#8dbdcf", "#9bb0d8"]
  const getAvatarColor = (value) => {
    const key = String(value || "").split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    return avatarPalette[key % avatarPalette.length]
  }

  const normalizeClient = (client, idx = 0) => ({
    ...client,
    contacto: client.contacto || client.responsable || client.referente || client.nombre,
    status: client.estado || demoStatusById[client.id] || (idx % 7 === 3 ? "inactivo" : "activo"),
  })

  const cargarClientes = async () => {
    try {
      if (demoMode) {
        const equiposMapDemo = DEMO_EQUIPOS.reduce((acc, equipo) => {
          const key = String(equipo.cliente_id || "")
          acc[key] = (acc[key] || 0) + 1
          return acc
        }, {})
        setEquiposByCliente(equiposMapDemo)
        setClientes((DEMO_CLIENTES || []).map((c, idx) => normalizeClient(c, idx)))
        setLoading(false)
        return
      }

      setLoading(true)
      const [clientesRes, equiposRes] = await Promise.all([
        supabase.from("clientes").select("*").order("created_at", { ascending: false }),
        supabase.from("equipos").select("id, cliente_id"),
      ])

      if (clientesRes.error || equiposRes.error) {
        const equiposMapDemo = DEMO_EQUIPOS.reduce((acc, equipo) => {
          const key = String(equipo.cliente_id || "")
          acc[key] = (acc[key] || 0) + 1
          return acc
        }, {})
        setEquiposByCliente(equiposMapDemo)
        setClientes((DEMO_CLIENTES || []).map((c, idx) => normalizeClient(c, idx)))
        return
      }

      const equiposMap = (equiposRes.data || []).reduce((acc, equipo) => {
        const key = String(equipo.cliente_id || "")
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {})

      setEquiposByCliente(equiposMap)
      setClientes((clientesRes.data || []).map((c, idx) => normalizeClient(c, idx)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarClientes()
  }, [demoMode])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])

  const filtrados = clientes.filter((c) => {
    const matchesSearch =
      c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      c.contacto?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.telefono?.includes(search) ||
      c.ciudad?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === "todo"
        ? true
        : statusFilter === "activos"
          ? c.status === "activo"
          : c.status === "inactivo"

    return matchesSearch && matchesStatus
  })

  const totalPages = Math.max(1, Math.ceil(filtrados.length / rowsPerPage))
  const currentPageSafe = Math.min(currentPage, totalPages)
  const startIndex = (currentPageSafe - 1) * rowsPerPage
  const endIndex = Math.min(startIndex + rowsPerPage, filtrados.length)
  const pageRows = filtrados.slice(startIndex, endIndex)

  useEffect(() => {
    if (filtrados.length === 0) {
      setSelectedClientId(null)
      return
    }

    const exists = filtrados.some((c) => String(c.id) === String(selectedClientId))
    if (!exists) {
      const first = filtrados[0]
      setSelectedClientId(first?.id || null)
    }
  }, [filtrados, selectedClientId])

  const selectedClient = filtrados.find((c) => String(c.id) === String(selectedClientId)) || null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (demoMode) {
      setShowModal(false)
      setEditingId(null)
      return
    }

    setSaving(true)

    let error
    if (editingId) {
      // Update existing cliente
      const result = await supabase
        .from("clientes")
        .update(formData)
        .eq("id", editingId)
      error = result.error
    } else {
      // Insert new cliente
      const result = await supabase
        .from("clientes")
        .insert([formData])
      error = result.error
    }

    if (!error) {
      setShowModal(false)
      setEditingId(null)
      setFormData({ nombre: "", email: "", telefono: "", direccion: "", ciudad: "" })
      cargarClientes()
    }
    setSaving(false)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const filteredCities = CIUDADES_URUGUAY
    .filter((city, index, arr) => arr.indexOf(city) === index)
    .filter((city) => city.toLowerCase().includes((formData.ciudad || "").toLowerCase().trim()))
    .slice(0, 8)

  const handleSelectCity = (city) => {
    setFormData((prev) => ({ ...prev, ciudad: city }))
    setShowCitySuggestions(false)
  }

  const handleEdit = (cliente) => {
    if (demoMode) return
    setEditingId(cliente.id)
    setFormData({
      nombre: cliente.nombre || "",
      email: cliente.email || "",
      telefono: cliente.telefono || "",
      direccion: cliente.direccion || "",
      ciudad: cliente.ciudad || ""
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingId(null)
    setFormData({ nombre: "", email: "", telefono: "", direccion: "", ciudad: "" })
  }

  const cargarEquipos = async (clienteId) => {
    try {
      if (demoMode) {
        const equiposFiltrados = DEMO_EQUIPOS.filter(e => String(e.cliente_id) === String(clienteId))
        setEquiposDetalle(equiposFiltrados)
        return
      }

      let { data, error } = await supabase
        .from("equipos")
        .select("*")
        .eq("cliente_id", clienteId)
        .order("created_at", { ascending: false })

      if (error) {
        // Compatibilidad con esquemas antiguos sin created_at.
        const fallbackRes = await supabase
          .from("equipos")
          .select("*")
          .eq("cliente_id", clienteId)

        data = fallbackRes.data
      }

      setEquiposDetalle(data || [])
    } catch (error) {
      console.error("Error cargando equipos:", error)
    }
  }

  const cargarTramites = async (clienteId) => {
    try {
      if (demoMode) {
        const tramitesFiltrados = DEMO_TRAMITES.filter(t => String(t.cliente_id) === String(clienteId))
        setTramitesDetalle(tramitesFiltrados)
        return
      }

      let { data, error } = await supabase
        .from("tramites")
        .select("*, equipos(marca, modelo)")
        .eq("cliente_id", clienteId)
        .order("created_at", { ascending: false })

      if (error) {
        // Compatibilidad con esquemas antiguos sin created_at.
        const fallbackRes = await supabase
          .from("tramites")
          .select("*, equipos(marca, modelo)")
          .eq("cliente_id", clienteId)

        data = fallbackRes.data
      }

      setTramitesDetalle(data || [])
    } catch (error) {
      console.error("Error cargando trámites:", error)
    }
  }

  const handleVerInstalaciones = async (clienteId) => {
    await cargarEquipos(clienteId)
    setShowEquiposModal(true)
  }

  const handleVerMantenimientos = async (clienteId) => {
    await cargarTramites(clienteId)
    setShowMantenimientosModal(true)
  }

  return (
    <div className="px-2 sm:px-3 py-4 sm:py-6 text-[#314d72]">
      <div className="border-b border-[#d4dfec] pb-4 mb-4">
        <div>
          <h1 className="text-5xl font-bold text-[#1f4371] tracking-tight">Clientes</h1>
          <p className="text-3xl font-semibold text-[#607b9f] mt-1">Listado de clientes y detalles de sus instalaciones.</p>
          {demoMode && (
            <p className="mt-1 text-xs text-[#4c6d99]">Modo Demo activo</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={() => !demoMode && setShowModal(true)}
          disabled={demoMode}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold shadow-[0_3px_8px_rgba(43,102,176,.2)] transition-all ${
            demoMode
              ? "bg-[#c4d1e4] text-[#7a8fae] cursor-not-allowed"
              : "bg-[#1f6bc1] text-white hover:bg-[#1b5ca6]"
          }`}
        >
          <span className="text-base leading-none">+</span>
          Añadir Cliente
        </button>
        <button
          disabled
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold bg-[#eef3fb] border border-[#cad7e9] text-[#516b90] cursor-not-allowed"
          title="Work in progress"
        >
          Importar
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#d8e2f1] text-[#5d769a]">WIP</span>
        </button>
        <button
          disabled
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold bg-[#eef3fb] border border-[#cad7e9] text-[#516b90] cursor-not-allowed"
          title="Work in progress"
        >
          Exportar
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#d8e2f1] text-[#5d769a]">WIP</span>
        </button>
      </div>

      <div className="mb-3">
        <div className="relative max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-[#8ea3be]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-[#cbd8ea] rounded-md bg-white text-sm text-[#3e5f87] placeholder-[#9dafc6] focus:outline-none focus:ring-2 focus:ring-[#8ba9cf]"
          />
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2 text-[28px] font-semibold text-[#4f6990]">
        <span>Filtro:</span>
        <button
          onClick={() => setStatusFilter("todo")}
          className={statusFilter === "todo" ? "text-[#1f6bc1]" : "text-[#6983a7] hover:text-[#1f6bc1]"}
        >
          Todo
        </button>
        <span className="text-[#9fb1c8]">|</span>
        <button
          onClick={() => setStatusFilter("activos")}
          className={statusFilter === "activos" ? "text-[#1f6bc1]" : "text-[#6983a7] hover:text-[#1f6bc1]"}
        >
          Activos
        </button>
        <span className="text-[#9fb1c8]">|</span>
        <button
          onClick={() => setStatusFilter("inactivos")}
          className={statusFilter === "inactivos" ? "text-[#1f6bc1]" : "text-[#6983a7] hover:text-[#1f6bc1]"}
        >
          Inactivos
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#d8e4f3] border-b-[#2d72c4]"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
          <div className="xl:col-span-9 rounded-md border border-[#d3dfef] bg-[#f9fbff] overflow-hidden shadow-[0_6px_16px_rgba(50,89,141,.1)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f1f5fb] text-[#3f5f87] border-b border-[#d7e3f1]">
                  <th className="text-left py-3 px-3">Cliente</th>
                  <th className="text-left py-3 px-3">Contacto</th>
                  <th className="text-left py-3 px-3">Ubicación</th>
                  <th className="text-left py-3 px-3">Equipos</th>
                  <th className="text-left py-3 px-3">Estado</th>
                  <th className="text-left py-3 px-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((cliente) => {
                  const selected = String(selectedClientId) === String(cliente.id)
                  const equiposCount = equiposByCliente[String(cliente.id)] || 0
                  return (
                    <tr
                      key={cliente.id}
                      onClick={() => setSelectedClientId(cliente.id)}
                      className={`border-b border-[#e3ebf7] cursor-pointer ${selected ? "bg-[#edf4ff]" : "bg-white hover:bg-[#f7faff]"}`}
                    >
                      <td className="py-3 px-3 font-semibold text-[#2462ad]">{cliente.nombre}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2 text-[#3f5f87]">
                          <span
                            className="h-7 w-7 rounded-full inline-flex items-center justify-center text-white text-[11px] font-bold"
                            style={{ backgroundColor: getAvatarColor(cliente.nombre) }}
                          >
                            {getInitials(cliente.contacto || cliente.nombre)}
                          </span>
                          <span className="font-medium">{cliente.contacto || cliente.nombre}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[#425f86]">{cliente.ciudad || "Sin ciudad"}</td>
                      <td className="py-3 px-3 font-semibold text-[#425f86]">{equiposCount}</td>
                      <td className="py-3 px-3">
                        <span className={`text-xs px-3 py-1 rounded font-semibold ${cliente.status === "activo" ? "bg-[#2fa04a] text-white" : "bg-[#d94a4a] text-white"}`}>
                          {cliente.status === "activo" ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/clientes/${cliente.id}`}
                            className="px-3 py-1 rounded-md bg-[#1f6bc1] text-white text-xs font-semibold hover:bg-[#19599f]"
                          >
                            Ver Detalles
                          </Link>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(cliente)
                            }}
                            disabled={demoMode}
                            className={`p-1.5 rounded border ${demoMode ? "border-[#d2dbea] text-[#9caec6]" : "border-[#cad7e9] text-[#4272aa] hover:bg-[#edf4ff]"}`}
                            title="Editar"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {pageRows.length === 0 && (
              <p className="text-center py-10 text-[#b9c7d9]">no se encuentra el cliente</p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between px-3 py-3 text-[#5d7799] text-sm border-t border-[#dbe6f4] bg-[#f8fbff]">
              <span>
                Mostrando {filtrados.length === 0 ? 0 : startIndex + 1} - {endIndex} de {filtrados.length} clientes
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPageSafe === 1}
                  className="px-2 py-1 rounded border border-[#cad8ea] bg-white disabled:opacity-40"
                >
                  &lt;
                </button>
                {Array.from({ length: totalPages }).slice(0, 5).map((_, idx) => {
                  const pageNum = idx + 1
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-2.5 py-1 rounded border ${currentPageSafe === pageNum ? "bg-[#1f6bc1] text-white border-[#1f6bc1]" : "bg-white border-[#cad8ea] text-[#4d6f97]"}`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                {totalPages > 5 && <span className="px-1 text-[#6f87a7]">...</span>}
                {totalPages > 5 && (
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className={`px-2.5 py-1 rounded border ${currentPageSafe === totalPages ? "bg-[#1f6bc1] text-white border-[#1f6bc1]" : "bg-white border-[#cad8ea] text-[#4d6f97]"}`}
                  >
                    {totalPages}
                  </button>
                )}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPageSafe === totalPages}
                  className="px-2 py-1 rounded border border-[#cad8ea] bg-white disabled:opacity-40"
                >
                  &gt;
                </button>
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="text-[#1f6bc1] font-semibold"
                disabled={currentPageSafe === totalPages}
              >
                Siguiente &gt;
              </button>
            </div>
          </div>

          <aside className="xl:col-span-3 rounded-md border border-[#d3dfef] bg-[#f9fbff] shadow-[0_6px_16px_rgba(50,89,141,.1)]">
            <div className="px-4 py-3 border-b border-[#dbe6f4]">
              <h3 className="text-[28px] font-bold text-[#2a4d7a]">Información del Cliente</h3>
            </div>
            <div className="px-4 py-3 space-y-2 text-[#47658d]">
              {selectedClient ? (
                <>
                  <p className="py-1 border-b border-[#dbe6f4]"><span className="font-semibold">Contacto:</span> {selectedClient.contacto || "No definido"}</p>
                  <p className="py-1 border-b border-[#dbe6f4]"><span className="font-semibold">Teléfono:</span> {selectedClient.telefono || "No definido"}</p>
                  <p className="py-1 border-b border-[#dbe6f4]"><span className="font-semibold">Correo:</span> {selectedClient.email || "No definido"}</p>
                  <p className="py-1 border-b border-[#dbe6f4]"><span className="font-semibold">Ubicación:</span> {selectedClient.ciudad || "No definida"}</p>
                  <p className="py-1 border-b border-[#dbe6f4]"><span className="font-semibold">Total de Equipos:</span> {equiposByCliente[String(selectedClient.id)] || 0}</p>
                  <div className="pt-2 space-y-2">
                    <button
                      onClick={() => handleVerInstalaciones(selectedClient.id)}
                      className="w-full inline-flex justify-center items-center px-3 py-2 rounded-md bg-[#1f6bc1] text-white text-sm font-semibold hover:bg-[#19599f]"
                    >
                      Ver Instalaciones
                    </button>
                    <button
                      onClick={() => handleVerMantenimientos(selectedClient.id)}
                      className="w-full inline-flex justify-center items-center px-3 py-2 rounded-md bg-[#1f6bc1] text-white text-sm font-semibold hover:bg-[#19599f]"
                    >
                      Historial de Mantenimientos
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-[#b9c7d9] py-10 text-center">Selecciona un cliente para ver su información</p>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#142947]/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#cfdced] rounded-md p-6 max-w-md w-full shadow-[0_14px_24px_rgba(29,66,116,.25)]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#224a78]">
                {editingId ? "Editar Cliente" : "Nuevo Cliente"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-[#6f87a8] hover:text-[#224a78] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#5e7da3] mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-white border border-[#cad8ea] rounded-md text-[#2a4f7d] text-sm focus:outline-none focus:ring-2 focus:ring-[#8caad0]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5e7da3] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-[#cad8ea] rounded-md text-[#2a4f7d] text-sm focus:outline-none focus:ring-2 focus:ring-[#8caad0]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5e7da3] mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-[#cad8ea] rounded-md text-[#2a4f7d] text-sm focus:outline-none focus:ring-2 focus:ring-[#8caad0]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5e7da3] mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-[#cad8ea] rounded-md text-[#2a4f7d] text-sm focus:outline-none focus:ring-2 focus:ring-[#8caad0]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5e7da3] mb-1">
                  Ciudad
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="ciudad"
                    value={formData.ciudad}
                    onFocus={() => setShowCitySuggestions(true)}
                    onBlur={() => setTimeout(() => setShowCitySuggestions(false), 120)}
                    onChange={(e) => {
                      handleChange(e)
                      setShowCitySuggestions(true)
                    }}
                    placeholder="Escribe una ciudad de Uruguay..."
                    className="w-full px-3 py-2 bg-white border border-[#cad8ea] rounded-md text-[#2a4f7d] text-sm focus:outline-none focus:ring-2 focus:ring-[#8caad0]"
                    autoComplete="off"
                  />

                  {showCitySuggestions && filteredCities.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-[#f8fbff] border border-[#cad8ea] rounded-md shadow-[0_8px_18px_rgba(31,107,193,.18)] max-h-44 overflow-y-auto">
                      {filteredCities.map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => handleSelectCity(city)}
                          className="w-full text-left px-3 py-2 text-sm text-[#2a4f7d] hover:bg-[#eaf2ff] hover:text-[#1f6bc1] transition-colors"
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-white border border-[#cad8ea] text-[#48688f] rounded-md text-sm font-semibold hover:bg-[#f2f7ff] transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-[#1f6bc1] text-white rounded-md text-sm font-semibold hover:bg-[#19599f] transition-all disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : (editingId ? 'Actualizar' : 'Guardar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Instalaciones */}
      {showEquiposModal && (
        <div className="fixed inset-0 bg-[#142947]/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white border border-[#cfdced] rounded-md p-6 max-w-2xl w-full my-8 shadow-[0_14px_24px_rgba(29,66,116,.25)]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#224a78]">
                Instalaciones del Cliente
              </h2>
              <button
                onClick={() => setShowEquiposModal(false)}
                className="text-[#6f87a8] hover:text-[#224a78] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {equiposDetalle.length === 0 ? (
                <p className="text-center py-8 text-[#b9c7d9]">No hay equipos registrados para este cliente</p>
              ) : (
                <div className="space-y-4">
                  {equiposDetalle.map((equipo) => (
                    <div key={equipo.id} className="border border-[#dbe6f4] rounded-md p-4 bg-[#f9fbff]">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-[#2462ad]">{equipo.marca} {equipo.modelo}</h3>
                          <p className="text-sm text-[#425f86] mt-1">
                            <span className="font-medium">Tipo:</span> {equipo.tipo || "No especificado"}
                          </p>
                          {equipo.capacidad && (
                            <p className="text-sm text-[#425f86]">
                              <span className="font-medium">Capacidad:</span> {equipo.capacidad}
                            </p>
                          )}
                          {equipo.ubicacion && (
                            <p className="text-sm text-[#425f86]">
                              <span className="font-medium">Ubicación:</span> {equipo.ubicacion}
                            </p>
                          )}
                          <Link
                            href={`/equipos/${equipo.id}`}
                            className="inline-block mt-2 text-xs text-[#1f6bc1] hover:text-[#19599f] font-semibold"
                          >
                            Ver detalles del equipo →
                          </Link>
                        </div>
                        <div className="flex-shrink-0">
                          <QRCodeComponent id={equipo.id} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-[#dbe6f4]">
              <button
                onClick={() => setShowEquiposModal(false)}
                className="flex-1 px-4 py-2 bg-white border border-[#cad8ea] text-[#48688f] rounded-md text-sm font-semibold hover:bg-[#f2f7ff] transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Mantenimientos */}
      {showMantenimientosModal && (
        <div className="fixed inset-0 bg-[#142947]/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white border border-[#cfdced] rounded-md p-6 max-w-2xl w-full my-8 shadow-[0_14px_24px_rgba(29,66,116,.25)]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#224a78]">
                Historial de Mantenimientos
              </h2>
              <button
                onClick={() => setShowMantenimientosModal(false)}
                className="text-[#6f87a8] hover:text-[#224a78] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {tramitesDetalle.length === 0 ? (
                <p className="text-center py-8 text-[#b9c7d9]">No hay mantenimientos registrados para este cliente</p>
              ) : (
                <div className="space-y-3">
                  {tramitesDetalle.map((tramite) => {
                    const estadoConfig = {
                      pendiente: { bg: "bg-yellow-50", border: "border-yellow-300", text: "text-yellow-700", label: "Pendiente" },
                      en_proceso: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", label: "En Proceso" },
                      completado: { bg: "bg-green-50", border: "border-green-300", text: "text-green-700", label: "Completado" },
                      cancelado: { bg: "bg-red-50", border: "border-red-300", text: "text-red-700", label: "Cancelado" }
                    }
                    const config = estadoConfig[tramite.estado] || estadoConfig.pendiente

                    return (
                      <div key={tramite.id} className={`border-2 ${config.border} rounded-md p-3 ${config.bg}`}>
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-[#2462ad]">
                                {tramite.tipo === "mantenimiento" ? "🔧 Mantenimiento" : "💰 Abono"}
                              </p>
                              <span className={`text-xs px-2 py-0.5 rounded font-semibold ${config.text}`}>
                                {config.label}
                              </span>
                            </div>
                            {tramite.equipos && (
                              <p className="text-sm text-[#425f86]">
                                <span className="font-medium">Equipo:</span> {tramite.equipos.marca} {tramite.equipos.modelo}
                              </p>
                            )}
                            {tramite.descripcion && (
                              <p className="text-sm text-[#425f86] mt-1">
                                <span className="font-medium">Descripción:</span> {tramite.descripcion}
                              </p>
                            )}
                            <div className="flex gap-4 mt-2 text-xs text-[#6f87a8]">
                              {tramite.fecha_programada && (
                                <span>📅 {new Date(tramite.fecha_programada).toLocaleDateString("es-UY")}</span>
                              )}
                              {tramite.monto && (
                                <span>💵 {tramite.moneda || "USD"} {tramite.monto}</span>
                              )}
                            </div>
                            {tramite.id && (
                              <Link
                                href={`/tramites/${tramite.id}`}
                                className="inline-block mt-2 text-xs text-[#1f6bc1] hover:text-[#19599f] font-semibold"
                              >
                                Ver detalle del trámite →
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-[#dbe6f4]">
              <button
                onClick={() => setShowMantenimientosModal(false)}
                className="flex-1 px-4 py-2 bg-white border border-[#cad8ea] text-[#48688f] rounded-md text-sm font-semibold hover:bg-[#f2f7ff] transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
