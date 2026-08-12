"use client"

import { useCallback, useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import QRCodeComponent from "@/components/QRCodeComponent"
import { CIUDADES_URUGUAY } from "@/lib/uruguayCities"

const CSV_HEADERS = ["nombre", "email", "telefono", "direccion", "ciudad", "latitud", "longitud"]

function escapeCsvValue(value) {
  const text = String(value ?? "")
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function parseCsv(text) {
  const rows = []
  let row = []
  let value = ""
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const next = text[i + 1]

    if (char === '"' && inQuotes && next === '"') {
      value += '"'
      i += 1
      continue
    }

    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (!inQuotes && (char === "," || char === ";")) {
      row.push(value.trim())
      value = ""
      continue
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") i += 1
      row.push(value.trim())
      if (row.some(Boolean)) rows.push(row)
      row = []
      value = ""
      continue
    }

    value += char
  }

  row.push(value.trim())
  if (row.some(Boolean)) rows.push(row)
  return rows
}

function normalizeHeader(header) {
  return String(header || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export default function Clientes() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const [clientes, setClientes] = useState([])
  const [equiposByCliente, setEquiposByCliente] = useState({})
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("todo")
  const [cityFilter, setCityFilter] = useState("todas")
  const [actionMenuId, setActionMenuId] = useState(null)
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
    ciudad: "",
    latitud: "",
    longitud: "",
  })
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [bulkMessage, setBulkMessage] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const rowsPerPage = 5

  const toNullableNumber = (value) => {
    const normalized = String(value || "").replace(",", ".").trim()
    if (!normalized) return null
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
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

  const normalizeClient = useCallback((client) => ({
    ...client,
    contacto: client.contacto || client.responsable || client.referente || client.nombre,
    status: client.estado || "activo",
  }), [])

  const cargarClientes = useCallback(async () => {
    try {
      setLoading(true)
      const [clientesRes, equiposRes] = await Promise.all([
        supabase.from("clientes").select("*").order("created_at", { ascending: false }),
        supabase.from("equipos").select("id, cliente_id"),
      ])

      if (clientesRes.error || equiposRes.error) {
        setEquiposByCliente({})
        setClientes([])
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
  }, [normalizeClient])

  useEffect(() => {
    cargarClientes()
  }, [cargarClientes])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, cityFilter])

  const filtrados = clientes.filter((c) => {
    const matchesSearch =
      c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      c.contacto?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.telefono?.includes(search) ||
      c.ciudad?.toLowerCase().includes(search.toLowerCase()) ||
      c.rut?.toLowerCase().includes(search.toLowerCase()) ||
      c.identificador_fiscal?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === "todo"
        ? true
        : statusFilter === "activos"
          ? c.status === "activo"
          : statusFilter === "inactivos"
            ? c.status === "inactivo"
            : c.status === "suspendido"

    const matchesCity = cityFilter === "todas" || (c.ciudad || "").toLowerCase() === cityFilter

    return matchesSearch && matchesStatus && matchesCity
  })

  const clientMetrics = {
    total: clientes.length,
    active: clientes.filter((client) => client.status === "activo").length,
    inactive: clientes.filter((client) => client.status === "inactivo").length,
    suspended: clientes.filter((client) => client.status === "suspendido").length,
  }
  const cityOptions = [...new Set(clientes.map((client) => client.ciudad).filter(Boolean))].sort()

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

  const handleExport = () => {
    const csvRows = [
      CSV_HEADERS.join(","),
      ...filtrados.map((cliente) =>
        CSV_HEADERS.map((key) => escapeCsvValue(cliente[key])).join(",")
      ),
    ]
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `clientes-powercool-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setBulkMessage(`Exportaste ${filtrados.length} cliente${filtrados.length === 1 ? "" : "s"}.`)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    setBulkMessage("")
    setImporting(true)

    try {
      const text = await file.text()
      const rows = parseCsv(text)
      if (rows.length < 2) {
        setBulkMessage("El archivo no tiene filas para importar.")
        return
      }

      const headers = rows[0].map(normalizeHeader)
      const payload = rows.slice(1).map((row) => {
        const record = {}
        CSV_HEADERS.forEach((key) => {
          const index = headers.indexOf(normalizeHeader(key))
          record[key] = index >= 0 ? row[index] || "" : ""
        })
        return {
          ...record,
          latitud: toNullableNumber(record.latitud),
          longitud: toNullableNumber(record.longitud),
        }
      }).filter((record) => record.nombre)

      if (payload.length === 0) {
        setBulkMessage("No encontré clientes válidos. El CSV debe tener al menos la columna nombre.")
        return
      }

      const { error } = await supabase.from("clientes").insert(payload)
      if (error) {
        setBulkMessage(`No se pudo importar: ${error.message}`)
        return
      }

      setBulkMessage(`Importaste ${payload.length} cliente${payload.length === 1 ? "" : "s"} correctamente.`)
      await cargarClientes()
    } catch {
      setBulkMessage("No se pudo leer el archivo CSV.")
    } finally {
      setImporting(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    let error
    const payload = {
      ...formData,
      latitud: toNullableNumber(formData.latitud),
      longitud: toNullableNumber(formData.longitud),
    }

    if (editingId) {
      // Update existing cliente
      const result = await supabase
        .from("clientes")
        .update(payload)
        .eq("id", editingId)
      error = result.error
    } else {
      // Insert new cliente
      const result = await supabase
        .from("clientes")
        .insert([payload])
      error = result.error
    }

    if (!error) {
      setShowModal(false)
      setEditingId(null)
      setFormData({ nombre: "", email: "", telefono: "", direccion: "", ciudad: "", latitud: "", longitud: "" })
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
    setEditingId(cliente.id)
    setFormData({
      nombre: cliente.nombre || "",
      email: cliente.email || "",
      telefono: cliente.telefono || "",
      direccion: cliente.direccion || "",
      ciudad: cliente.ciudad || "",
      latitud: cliente.latitud ?? "",
      longitud: cliente.longitud ?? "",
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingId(null)
    setFormData({ nombre: "", email: "", telefono: "", direccion: "", ciudad: "", latitud: "", longitud: "" })
  }

  const cargarEquipos = async (clienteId) => {
    try {
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
    <div className="px-4 py-7 text-slate-900 sm:px-6 lg:px-7">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-[-.04em] text-slate-950">Clientes</h1>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">Administra todos tus clientes y su información.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={handleExport} className="inline-flex h-11 items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-50" title="Exportar clientes filtrados a CSV">
            <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Exportar
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button onClick={() => setShowModal(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
            <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
            Nuevo cliente
          </button>
        </div>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total clientes", value: clientMetrics.total, detail: `Mostrando ${filtrados.length}`, tone: "text-blue-600 bg-blue-50", icon: "users" },
          { label: "Activos", value: clientMetrics.active, detail: clientMetrics.total ? `${Math.round((clientMetrics.active / clientMetrics.total) * 100)}% del total` : "Sin registros", tone: "text-emerald-600 bg-emerald-50", icon: "check" },
          { label: "Inactivos", value: clientMetrics.inactive, detail: clientMetrics.total ? `${Math.round((clientMetrics.inactive / clientMetrics.total) * 100)}% del total` : "Sin registros", tone: "text-amber-600 bg-amber-50", icon: "clock" },
          { label: "Suspendidos", value: clientMetrics.suspended, detail: clientMetrics.total ? `${Math.round((clientMetrics.suspended / clientMetrics.total) * 100)}% del total` : "Sin registros", tone: "text-rose-600 bg-rose-50", icon: "close" },
        ].map((metric) => <div key={metric.label} className="flex min-h-32 items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4"><span className={`grid h-14 w-14 place-items-center rounded-full ${metric.tone}`}><svg aria-hidden="true" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">{metric.icon === "users" && <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2m15-9a4 4 0 1 0-3-6.65M21 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round" />}{metric.icon === "check" && <path d="m8 12 2.5 2.5L16 9m5 3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" strokeLinecap="round" strokeLinejoin="round" />}{metric.icon === "clock" && <path d="M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" strokeLinecap="round" strokeLinejoin="round" />}{metric.icon === "close" && <path d="m9 9 6 6m0-6-6 6m12-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" strokeLinecap="round" strokeLinejoin="round" />}</svg></span><div><p className="text-3xl font-bold tracking-[-.04em] text-slate-950">{metric.value}</p><p className="mt-1 text-sm font-semibold text-slate-700">{metric.label}</p><p className="mt-2 text-xs text-slate-500">{metric.detail}</p></div></div>)}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleImportFile}
        />
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-5 py-4">
          <div className="relative min-w-[240px] flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-[#8ea3be]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar cliente, contacto o empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block h-11 w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"><option value="todo">Estado: Todos</option><option value="activos">Estado: Activos</option><option value="inactivos">Estado: Inactivos</option><option value="suspendidos">Estado: Suspendidos</option></select>
          <select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"><option value="todas">Ciudad: Todas</option>{cityOptions.map((city) => <option key={city} value={city.toLowerCase()}>{city}</option>)}</select>
          <button type="button" onClick={handleImportClick} disabled={importing} className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">{importing ? "Importando..." : "Importar CSV"}</button>
        </div>

        {bulkMessage && <div className="mx-5 mt-4 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">{bulkMessage}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#d8e4f3] border-b-[#2d72c4]"></div>
        </div>
      ) : (
        <div>
          <div className="overflow-hidden">
            <div className="px-3 py-3 space-y-3 lg:hidden">
              {pageRows.map((cliente) => {
                const selected = String(selectedClientId) === String(cliente.id)
                const equiposCount = equiposByCliente[String(cliente.id)] || 0
                return (
                  <article
                    key={cliente.id}
                    onClick={() => setSelectedClientId(cliente.id)}
                    className={`rounded-lg border px-4 py-3 cursor-pointer ${selected ? "border-[#9dc0ea] bg-[#edf4ff]" : "border-[#dfe8f4] bg-white"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#2462ad] truncate">{cliente.nombre}</p>
                        <p className="text-xs text-[#425f86] mt-0.5">{cliente.ciudad || "Sin ciudad"}</p>
                      </div>
                      <span className={`text-[11px] px-2 py-1 rounded font-semibold ${cliente.status === "activo" ? "bg-[#2fa04a] text-white" : "bg-[#d94a4a] text-white"}`}>
                        {cliente.status === "activo" ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-md bg-[#f8fbff] px-2 py-2 border border-[#e3ebf7]">
                        <p className="text-[#6a84a6]">Contacto</p>
                        <p className="font-medium text-[#3f5f87] mt-1 truncate">{cliente.contacto || cliente.nombre}</p>
                      </div>
                      <div className="rounded-md bg-[#f8fbff] px-2 py-2 border border-[#e3ebf7]">
                        <p className="text-[#6a84a6]">Equipos</p>
                        <p className="font-semibold text-[#425f86] mt-1">{equiposCount}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <Link
                        href={`/clientes/${cliente.id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-md bg-[#1f6bc1] text-white text-xs font-semibold hover:bg-[#19599f]"
                      >
                        Ver detalles
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(cliente)
                        }}
                        className="rounded-md border border-[#cad7e9] px-3 py-1.5 text-xs font-semibold text-[#4272aa] hover:bg-[#edf4ff]"
                      >
                        Editar
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="hidden lg:block overflow-x-auto">
            <table className="w-full min-w-[940px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                  <th className="px-5 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Contacto</th>
                  <th className="px-4 py-3 text-left">Teléfono</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Último servicio</th>
                  <th className="px-4 py-3 text-center">Equipos</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((cliente) => {
                  const selected = String(selectedClientId) === String(cliente.id)
                  const equiposCount = equiposByCliente[String(cliente.id)] || 0
                  return (
                    <tr
                      key={cliente.id}
                      onClick={() => router.push(`/clientes/${cliente.id}`)}
                      className={`border-b border-slate-100 cursor-pointer transition-colors ${selected ? "bg-blue-50/60" : "bg-white hover:bg-slate-50"}`}
                    >
                      <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">{getInitials(cliente.nombre)}</span><div><Link onClick={(event) => event.stopPropagation()} href={`/clientes/${cliente.id}`} className="font-semibold text-slate-900 hover:text-blue-700">{cliente.nombre}</Link><p className="mt-1 text-xs text-slate-500">{cliente.rut || cliente.identificador_fiscal || "Sin identificador fiscal"}</p></div></div></td>
                      <td className="px-4 py-4">
                        <div className="text-slate-700">
                          <span
                            className="hidden h-7 w-7 rounded-full sm:inline-flex items-center justify-center text-white text-[11px] font-bold"
                            style={{ backgroundColor: getAvatarColor(cliente.nombre) }}
                          >
                            {getInitials(cliente.contacto || cliente.nombre)}
                          </span>
                          <div><p className="font-medium">{cliente.contacto || cliente.nombre}</p><p className="mt-1 text-xs text-slate-500">{cliente.email || "Sin correo"}</p></div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-700">{cliente.telefono || "Sin teléfono"}</td>
                      <td className="px-4 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${cliente.status === "activo" ? "bg-emerald-100 text-emerald-700" : cliente.status === "suspendido" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                          {cliente.status === "activo" ? "Activo" : cliente.status === "suspendido" ? "Suspendido" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-4"><p className="font-medium text-slate-700">{cliente.updated_at ? new Date(cliente.updated_at).toLocaleDateString("es-UY", { day: "2-digit", month: "short", year: "numeric" }) : "Sin servicios"}</p><p className="mt-1 text-xs text-slate-500">{cliente.updated_at ? "Servicio registrado" : "—"}</p></td>
                      <td className="px-4 py-4 text-center font-semibold text-slate-700">{equiposCount}</td>
                      <td className="relative px-5 py-4 text-right">
                        <button onClick={(event) => { event.stopPropagation(); setActionMenuId(actionMenuId === cliente.id ? null : cliente.id) }} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800" aria-label={`Acciones para ${cliente.nombre}`}>•••</button>
                        {actionMenuId === cliente.id && <div onClick={(event) => event.stopPropagation()} className="absolute right-5 top-12 z-10 w-44 rounded-xl border border-slate-200 bg-white p-1 text-left shadow-lg"><Link href={`/clientes/${cliente.id}`} className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Ver cliente</Link><button onClick={() => { setActionMenuId(null); handleEdit(cliente) }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">Editar</button><button onClick={() => { setActionMenuId(null); handleVerInstalaciones(cliente.id) }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">Ver equipos</button><button onClick={() => { setActionMenuId(null); handleVerMantenimientos(cliente.id) }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">Historial de servicios</button></div>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>

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

          <aside className="hidden">
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
      </div>

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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#5e7da3] mb-1">
                    Latitud
                  </label>
                  <input
                    type="text"
                    name="latitud"
                    value={formData.latitud}
                    onChange={handleChange}
                    placeholder="-34.9011"
                    className="w-full px-3 py-2 bg-white border border-[#cad8ea] rounded-md text-[#2a4f7d] text-sm focus:outline-none focus:ring-2 focus:ring-[#8caad0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5e7da3] mb-1">
                    Longitud
                  </label>
                  <input
                    type="text"
                    name="longitud"
                    value={formData.longitud}
                    onChange={handleChange}
                    placeholder="-56.1645"
                    className="w-full px-3 py-2 bg-white border border-[#cad8ea] rounded-md text-[#2a4f7d] text-sm focus:outline-none focus:ring-2 focus:ring-[#8caad0]"
                  />
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
