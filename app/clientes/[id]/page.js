"use client"

import { useMemo, useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useDemoMode } from "@/lib/useDemoMode"
import { DEMO_CLIENTES, DEMO_EQUIPOS, DEMO_TRAMITES } from "@/lib/demoData"
import QRCodeComponent from "@/components/QRCodeComponent"

const CIUDADES_URUGUAY = [
  "Montevideo",
  "Canelones",
  "Maldonado",
  "Punta del Este",
  "Piriápolis",
  "Rocha",
  "Chuy",
  "La Paloma",
  "Salto",
  "Paysandú",
  "Mercedes",
  "Tacuarembó",
  "Rivera",
  "Melo",
  "Artigas",
  "Durazno",
  "Florida",
  "San José de Mayo",
  "Colonia del Sacramento",
  "Fray Bentos",
  "Minas",
  "Treinta y Tres",
  "Trinidad",
]

export default function ClienteDetallePage() {
  const params = useParams()
  const router = useRouter()
  const { demoMode } = useDemoMode()

  const clienteId = Array.isArray(params.id) ? params.id[0] : params.id

  const [loading, setLoading] = useState(true)
  const [cliente, setCliente] = useState(null)
  const [equipos, setEquipos] = useState([])
  const [tramites, setTramites] = useState([])

  const [showEditModal, setShowEditModal] = useState(false)
  const [showEquipoModal, setShowEquipoModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingEquipo, setSavingEquipo] = useState(false)
  const [searchText, setSearchText] = useState("")
  const [equipoTipoFilter, setEquipoTipoFilter] = useState("todos")
  const [tramiteTipoFilter, setTramiteTipoFilter] = useState("todos")
  const [estadoActivoFilter, setEstadoActivoFilter] = useState("todos")
  const [estadoHistorialFilter, setEstadoHistorialFilter] = useState("todos")
  const [copiedEquipoId, setCopiedEquipoId] = useState(null)
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    ciudad: "",
  })
  const [equipoFormData, setEquipoFormData] = useState({
    marca: "",
    modelo: "",
    tipo: "split",
    capacidad: "",
    ubicacion: "",
  })

  const locationText = useMemo(() => {
    if (!cliente) return ""
    return [cliente.direccion, cliente.ciudad, "Uruguay"].filter(Boolean).join(", ")
  }, [cliente])

  const mapEmbedUrl = useMemo(() => {
    if (!cliente) return ""

    const lat = Number(cliente.latitud ?? cliente.latitude)
    const lng = Number(cliente.longitud ?? cliente.longitude)

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return `https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed`
    }

    if (!locationText) return ""
    return `https://www.google.com/maps?q=${encodeURIComponent(locationText)}&output=embed`
  }, [cliente, locationText])

  const mapExternalUrl = useMemo(() => {
    if (!cliente) return ""

    const lat = Number(cliente.latitud ?? cliente.latitude)
    const lng = Number(cliente.longitud ?? cliente.longitude)

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    }

    if (!locationText) return ""
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationText)}`
  }, [cliente, locationText])

  const tramitesActivos = useMemo(
    () => tramites.filter((t) => t.estado === "pendiente" || t.estado === "en_proceso"),
    [tramites]
  )

  const tramitesHistorial = useMemo(
    () => tramites.filter((t) => t.estado === "completado" || t.estado === "cancelado"),
    [tramites]
  )

  const matchText = (value) => String(value || "").toLowerCase().includes(searchText.trim().toLowerCase())

  const equiposFiltrados = useMemo(() => {
    return equipos.filter((equipo) => {
      const byTipo = equipoTipoFilter === "todos" ? true : String(equipo.tipo || "split") === equipoTipoFilter

      const bySearch =
        !searchText.trim() ||
        matchText(`${equipo.marca} ${equipo.modelo} ${equipo.tipo} ${equipo.capacidad} ${equipo.ubicacion} ${equipo.id}`)

      return byTipo && bySearch
    })
  }, [equipos, equipoTipoFilter, searchText])

  const tramitesActivosFiltrados = useMemo(() => {
    return tramitesActivos.filter((tramite) => {
      const byTipo = tramiteTipoFilter === "todos" ? true : tramite.tipo === tramiteTipoFilter
      const byEstado = estadoActivoFilter === "todos" ? true : tramite.estado === estadoActivoFilter

      const bySearch =
        !searchText.trim() ||
        matchText(`${tramite.tipo} ${tramite.estado} ${tramite.descripcion} ${tramite.equipos?.marca || ""} ${tramite.equipos?.modelo || ""}`)

      return byTipo && byEstado && bySearch
    })
  }, [tramitesActivos, tramiteTipoFilter, estadoActivoFilter, searchText])

  const tramitesHistorialFiltrados = useMemo(() => {
    return tramitesHistorial.filter((tramite) => {
      const byTipo = tramiteTipoFilter === "todos" ? true : tramite.tipo === tramiteTipoFilter
      const byEstado = estadoHistorialFilter === "todos" ? true : tramite.estado === estadoHistorialFilter

      const bySearch =
        !searchText.trim() ||
        matchText(`${tramite.tipo} ${tramite.estado} ${tramite.descripcion} ${tramite.equipos?.marca || ""} ${tramite.equipos?.modelo || ""}`)

      return byTipo && byEstado && bySearch
    })
  }, [tramitesHistorial, tramiteTipoFilter, estadoHistorialFilter, searchText])

  const ciudadesFiltradas = useMemo(() => {
    return CIUDADES_URUGUAY
      .filter((city, index, arr) => arr.indexOf(city) === index)
      .filter((city) => city.toLowerCase().includes((formData.ciudad || "").toLowerCase().trim()))
      .slice(0, 8)
  }, [formData.ciudad])

  useEffect(() => {
    if (!clienteId) return
    cargarDatos()
  }, [clienteId, demoMode])

  async function cargarDatos() {
    setLoading(true)

    try {
      if (demoMode) {
        const clienteDemo = DEMO_CLIENTES.find((c) => String(c.id) === String(clienteId))

        if (!clienteDemo) {
          router.push("/clientes")
          return
        }

        setCliente(clienteDemo)
        setFormData({
          nombre: clienteDemo.nombre || "",
          email: clienteDemo.email || "",
          telefono: clienteDemo.telefono || "",
          direccion: clienteDemo.direccion || "",
          ciudad: clienteDemo.ciudad || "",
        })

        setEquipos(DEMO_EQUIPOS.filter((e) => String(e.cliente_id) === String(clienteId)))
        setTramites(DEMO_TRAMITES.filter((t) => String(t.cliente_id) === String(clienteId)))
        return
      }

      const [clienteRes, equiposResOrdered, tramitesResOrdered] = await Promise.all([
        supabase.from("clientes").select("*").eq("id", clienteId).single(),
        supabase.from("equipos").select("*").eq("cliente_id", clienteId).order("created_at", { ascending: false }),
        supabase
          .from("tramites")
          .select("*, equipos(marca, modelo)")
          .eq("cliente_id", clienteId)
          .order("created_at", { ascending: false }),
      ])

      if (!clienteRes.data) {
        router.push("/clientes")
        return
      }

      let equiposRes = equiposResOrdered
      if (equiposResOrdered.error) {
        // Compatibilidad con esquemas viejos sin created_at en equipos.
        equiposRes = await supabase.from("equipos").select("*").eq("cliente_id", clienteId)
      }

      let tramitesRes = tramitesResOrdered
      if (tramitesResOrdered.error) {
        // Compatibilidad con esquemas viejos sin created_at en tramites.
        tramitesRes = await supabase
          .from("tramites")
          .select("*, equipos(marca, modelo)")
          .eq("cliente_id", clienteId)
      }

      setCliente(clienteRes.data)
      setEquipos(equiposRes.data || [])
      setTramites(tramitesRes.data || [])

      setFormData({
        nombre: clienteRes.data.nombre || "",
        email: clienteRes.data.email || "",
        telefono: clienteRes.data.telefono || "",
        direccion: clienteRes.data.direccion || "",
        ciudad: clienteRes.data.ciudad || "",
      })
    } catch (error) {
      console.error("Error cargando detalle del cliente:", error)
      router.push("/clientes")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSelectCity = (city) => {
    setFormData((prev) => ({ ...prev, ciudad: city }))
    setShowCitySuggestions(false)
  }

  const handleEquipoChange = (e) => {
    setEquipoFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const resetEquipoForm = () => {
    setEquipoFormData({
      marca: "",
      modelo: "",
      tipo: "split",
      capacidad: "",
      ubicacion: "",
    })
  }

  const getEstadoLabel = (estado) => {
    if (estado === "en_proceso") return "En proceso"
    if (estado === "completado") return "Completado"
    if (estado === "cancelado") return "Cancelado"
    return "Pendiente"
  }

  const getEstadoBadgeClass = (estado) => {
    if (estado === "completado") {
      return "bg-[#eaf7ef] text-[#2f7d4a]"
    }

    if (estado === "cancelado") {
      return "bg-[#fdeeee] text-[#b44a4a]"
    }

    if (estado === "en_proceso") {
      return "bg-[#e9f1ff] text-[#2f69b0]"
    }

    return "bg-[#fff8e8] text-[#a97717]"
  }

  const getHistorialCardClass = (estado) => {
    if (estado === "completado") {
      return "border-[#d8ebdf] bg-[#f8fdf9]"
    }

    if (estado === "cancelado") {
      return "border-[#f3dddd] bg-[#fff8f8]"
    }

    return "border-[#dbe6f4] bg-white"
  }

  const formatDate = (value) => {
    if (!value) return "Sin fecha"
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return "Sin fecha"
    return parsed.toLocaleDateString("es-UY")
  }

  const getEquipoMaintStats = (equipoId) => {
    const equipoTramites = tramites.filter((t) => String(t.equipo_id) === String(equipoId))

    const ultimo = [...equipoTramites]
      .filter((t) => t.estado === "completado")
      .sort((a, b) => new Date(b.fecha_programada || b.created_at || 0) - new Date(a.fecha_programada || a.created_at || 0))[0]

    const proximo = [...equipoTramites]
      .filter((t) => t.estado === "pendiente" || t.estado === "en_proceso")
      .sort((a, b) => new Date(a.fecha_programada || a.created_at || 0) - new Date(b.fecha_programada || b.created_at || 0))[0]

    return {
      ultimoLabel: ultimo ? formatDate(ultimo.fecha_programada || ultimo.created_at) : "Sin registro",
      proximoLabel: proximo ? formatDate(proximo.fecha_programada || proximo.created_at) : "Sin programar",
    }
  }

  const copyEquipoLink = async (equipoId) => {
    if (typeof window === "undefined" || !navigator?.clipboard) return

    try {
      const url = `${window.location.origin}/equipos/${equipoId}`
      await navigator.clipboard.writeText(url)

      setCopiedEquipoId(String(equipoId))
      window.setTimeout(() => {
        setCopiedEquipoId((currentId) => (currentId === String(equipoId) ? null : currentId))
      }, 1800)
    } catch (error) {
      console.error("No se pudo copiar el enlace del equipo", error)
    }
  }

  const handleCreateEquipo = async (e) => {
    e.preventDefault()

    if (!equipoFormData.marca.trim() || !equipoFormData.modelo.trim()) {
      return
    }

    if (demoMode) {
      const fakeId = `demo-eq-${Date.now()}`
      setEquipos((prev) => [
        {
          id: fakeId,
          cliente_id: clienteId,
          marca: equipoFormData.marca,
          modelo: equipoFormData.modelo,
          tipo: equipoFormData.tipo,
          capacidad: equipoFormData.capacidad,
          ubicacion: equipoFormData.ubicacion,
        },
        ...prev,
      ])
      setShowEquipoModal(false)
      resetEquipoForm()
      return
    }

    setSavingEquipo(true)

    const { error } = await supabase.from("equipos").insert([
      {
        cliente_id: clienteId,
        marca: equipoFormData.marca,
        modelo: equipoFormData.modelo,
        tipo: equipoFormData.tipo,
        capacidad: equipoFormData.capacidad || null,
        ubicacion: equipoFormData.ubicacion || null,
      },
    ])

    setSavingEquipo(false)

    if (!error) {
      setShowEquipoModal(false)
      resetEquipoForm()
      await cargarDatos()
    }
  }

  const handleUpdateClient = async (e) => {
    e.preventDefault()

    if (demoMode) {
      setShowEditModal(false)
      return
    }

    setSaving(true)

    const { error } = await supabase
      .from("clientes")
      .update({
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono,
        direccion: formData.direccion,
        ciudad: formData.ciudad,
      })
      .eq("id", clienteId)

    setSaving(false)

    if (!error) {
      setShowEditModal(false)
      await cargarDatos()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#d8e4f3] border-b-[#2d72c4]"></div>
      </div>
    )
  }

  if (!cliente) return null

  return (
    <div className="px-2 sm:px-3 py-4 sm:py-6 text-[#314d72]">
      <div className="flex items-start sm:items-center gap-3 justify-between flex-col sm:flex-row border-b border-[#d4dfec] pb-4 mb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/clientes"
            className="p-2 rounded-md border border-[#cad8ea] text-[#48688f] hover:bg-[#edf4ff]"
            aria-label="Volver a clientes"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-[#1f4371] tracking-tight">Detalle del Cliente</h1>
            <p className="text-sm text-[#607b9f] mt-1">Información real, ubicación y equipos asociados.</p>
          </div>
        </div>

        <button
          onClick={() => setShowEditModal(true)}
          className="px-4 py-2 rounded-md bg-[#1f6bc1] text-white text-sm font-semibold hover:bg-[#19599f]"
        >
          Editar Cliente
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 mb-4">
        <section className="xl:col-span-5 rounded-md border border-[#d3dfef] bg-[#f9fbff] p-4 shadow-[0_6px_16px_rgba(50,89,141,.1)]">
          <h2 className="text-xl font-bold text-[#2a4d7a] mb-3">Datos del Cliente</h2>
          <div className="space-y-2 text-[#47658d]">
            <p className="py-1 border-b border-[#dbe6f4]"><span className="font-semibold">Nombre:</span> {cliente.nombre || "No definido"}</p>
            <p className="py-1 border-b border-[#dbe6f4]"><span className="font-semibold">Correo:</span> {cliente.email || "No definido"}</p>
            <p className="py-1 border-b border-[#dbe6f4]"><span className="font-semibold">Teléfono:</span> {cliente.telefono || "No definido"}</p>
            <p className="py-1 border-b border-[#dbe6f4]"><span className="font-semibold">Dirección:</span> {cliente.direccion || "No definida"}</p>
            <p className="py-1 border-b border-[#dbe6f4]"><span className="font-semibold">Ciudad:</span> {cliente.ciudad || "No definida"}</p>
            <p className="py-1 border-b border-[#dbe6f4]"><span className="font-semibold">Equipos:</span> {equipos.length}</p>
            <p className="py-1 border-b border-[#dbe6f4]"><span className="font-semibold">Trámites activos:</span> {tramitesActivos.length}</p>
            <p className="py-1"><span className="font-semibold">Trámites en historial:</span> {tramitesHistorial.length}</p>
          </div>
        </section>

        <section className="xl:col-span-7 rounded-md border border-[#d3dfef] bg-[#f9fbff] p-4 shadow-[0_6px_16px_rgba(50,89,141,.1)]">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-xl font-bold text-[#2a4d7a]">Ubicación en Mapa</h2>
            {mapExternalUrl && (
              <a
                href={mapExternalUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-[#1f6bc1] hover:text-[#19599f]"
              >
                Abrir en Google Maps
              </a>
            )}
          </div>

          {mapEmbedUrl ? (
            <div className="rounded-md overflow-hidden border border-[#cad8ea] bg-white">
              <iframe
                title="Mapa de ubicación del cliente"
                src={mapEmbedUrl}
                className="w-full h-[320px]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : (
            <div className="h-[320px] rounded-md border border-dashed border-[#c6d4e9] bg-white flex items-center justify-center text-[#7f96b8] text-sm">
              Este cliente no tiene dirección suficiente para mostrar un mapa.
            </div>
          )}
        </section>
      </div>

      <section className="rounded-md border border-[#d3dfef] bg-[#f9fbff] p-4 shadow-[0_6px_16px_rgba(50,89,141,.1)] mb-4">
        <h2 className="text-lg font-bold text-[#2a4d7a] mb-3">Búsqueda y Filtros</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="lg:col-span-2">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Buscar por marca, modelo, descripción, estado o ID..."
              className="w-full px-3 py-2 bg-white border border-[#cad8ea] rounded-md text-[#2a4f7d] text-sm focus:outline-none focus:ring-2 focus:ring-[#8caad0]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5e7da3] mb-1">Tipo de equipo</label>
            <select
              value={equipoTipoFilter}
              onChange={(e) => setEquipoTipoFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#cad8ea] rounded-md text-[#2a4f7d] text-sm focus:outline-none focus:ring-2 focus:ring-[#8caad0]"
            >
              <option value="todos">Todos</option>
              <option value="split">Split</option>
              <option value="cassette">Cassette</option>
              <option value="piso-techo">Piso-Techo</option>
              <option value="multi-split">Multi-Split</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5e7da3] mb-1">Tipo de trámite</label>
            <select
              value={tramiteTipoFilter}
              onChange={(e) => setTramiteTipoFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#cad8ea] rounded-md text-[#2a4f7d] text-sm focus:outline-none focus:ring-2 focus:ring-[#8caad0]"
            >
              <option value="todos">Todos</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="abono">Abono</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5e7da3] mb-1">Estado (Activos)</label>
            <select
              value={estadoActivoFilter}
              onChange={(e) => setEstadoActivoFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#cad8ea] rounded-md text-[#2a4f7d] text-sm focus:outline-none focus:ring-2 focus:ring-[#8caad0]"
            >
              <option value="todos">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_proceso">En proceso</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5e7da3] mb-1">Estado (Historial)</label>
            <select
              value={estadoHistorialFilter}
              onChange={(e) => setEstadoHistorialFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#cad8ea] rounded-md text-[#2a4f7d] text-sm focus:outline-none focus:ring-2 focus:ring-[#8caad0]"
            >
              <option value="todos">Todos</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-[#d3dfef] bg-[#f9fbff] p-4 shadow-[0_6px_16px_rgba(50,89,141,.1)] mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-[#2a4d7a]">Equipos del Cliente ({equiposFiltrados.length}/{equipos.length})</h2>
          <button
            onClick={() => {
              resetEquipoForm()
              setShowEquipoModal(true)
            }}
            className="px-3 py-1 rounded-md bg-[#1f6bc1] text-white text-xs font-semibold hover:bg-[#19599f]"
          >
            Agregar Equipo
          </button>
        </div>

        {equiposFiltrados.length === 0 ? (
          <p className="text-[#8ca0bc] py-6 text-center">Este cliente no tiene equipos registrados.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {equiposFiltrados.map((equipo) => (
              <article
                key={equipo.id}
                className="rounded-xl border border-[#cfe0f3] bg-gradient-to-b from-white to-[#f7fbff] p-4 shadow-[0_10px_22px_rgba(48,94,152,.08)] hover:shadow-[0_14px_28px_rgba(40,90,150,.14)] transition-shadow"
              >
                {(() => {
                  const maintStats = getEquipoMaintStats(equipo.id)
                  return (
                    <>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-[#1e5ca7] font-bold text-lg leading-tight truncate">
                      {equipo.marca || "Sin marca"} {equipo.modelo || ""}
                    </p>
                    <p className="text-sm text-[#4a678f] mt-0.5">ID: {equipo.id}</p>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#eaf2ff] text-[#2e67ac] font-semibold whitespace-nowrap">
                    {equipo.tipo || "Tipo no definido"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-xs px-2.5 py-1 rounded-md bg-[#f0f5fd] text-[#55759c] border border-[#d7e4f4]">
                    Capacidad: {equipo.capacidad || "N/A"}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-md bg-[#f0f5fd] text-[#55759c] border border-[#d7e4f4]">
                    Ubicación: {equipo.ubicacion || "No definida"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_170px] gap-3 items-start">
                  <div className="rounded-lg border border-[#d8e5f4] bg-white p-3">
                    <p className="text-xs text-[#607b9f] mb-2">Acciones</p>
                    <div className="space-y-2">
                      <Link
                        href={`/equipos/${equipo.id}`}
                        className="w-full inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-[#1f6bc1] text-white text-xs font-semibold hover:bg-[#19599f]"
                      >
                        Ver detalle del equipo
                      </Link>
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          href="/tramites"
                          className="inline-flex items-center justify-center px-2 py-1.5 rounded-md bg-[#edf4ff] text-[#1f6bc1] text-[11px] font-semibold hover:bg-[#dfebff]"
                        >
                          Nuevo trámite
                        </Link>
                        <button
                          type="button"
                          onClick={() => copyEquipoLink(equipo.id)}
                          className={`inline-flex items-center justify-center px-2 py-1.5 rounded-md text-[11px] font-semibold transition-colors ${
                            copiedEquipoId === String(equipo.id)
                              ? "bg-[#eaf7ef] text-[#2f7d4a]"
                              : "bg-[#edf4ff] text-[#1f6bc1] hover:bg-[#dfebff]"
                          }`}
                        >
                          {copiedEquipoId === String(equipo.id) ? "Link copiado" : "Copiar link"}
                        </button>
                      </div>

                      <div className="rounded-md border border-[#e3edf8] bg-[#f8fbff] px-2.5 py-2">
                        <p className="text-[11px] text-[#5f7fa6]">
                          <span className="font-semibold">Próximo mantenimiento/trámite:</span> {maintStats.proximoLabel}
                        </p>
                        <p className="text-[11px] text-[#5f7fa6] mt-1">
                          <span className="font-semibold">Última revisión/mantenimiento:</span> {maintStats.ultimoLabel}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#d8e5f4] bg-white p-2">
                    <QRCodeComponent id={equipo.id} />
                  </div>
                </div>
                    </>
                  )
                })()}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <div className="rounded-md border border-[#d3dfef] bg-[#f9fbff] p-4 shadow-[0_6px_16px_rgba(50,89,141,.1)]">
          <h2 className="text-lg font-bold text-[#2a4d7a] mb-3">Trámites Activos ({tramitesActivosFiltrados.length}/{tramitesActivos.length})</h2>
          {tramitesActivosFiltrados.length === 0 ? (
            <p className="text-[#8ca0bc]">No hay trámites activos.</p>
          ) : (
            <div className="space-y-2">
              {tramitesActivosFiltrados.map((tramite) => (
                <div key={tramite.id} className="rounded-md border border-[#dbe6f4] bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#2e5e96]">{tramite.tipo === "abono" ? "Abono" : "Mantenimiento"}</p>
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${getEstadoBadgeClass(tramite.estado)}`}>
                      {getEstadoLabel(tramite.estado)}
                    </span>
                  </div>
                  <p className="text-xs text-[#59779f] mt-1">{tramite.descripcion || "Sin descripción"}</p>
                  <p className="text-xs text-[#6f87a8] mt-1">Equipo: {tramite.equipos?.marca || "-"} {tramite.equipos?.modelo || ""}</p>
                  <Link href={`/tramites/${tramite.id}`} className="inline-block mt-2 text-xs font-semibold text-[#1f6bc1] hover:text-[#19599f]">
                    Ver trámite
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-md border border-[#d3dfef] bg-[#f9fbff] p-4 shadow-[0_6px_16px_rgba(50,89,141,.1)]">
          <h2 className="text-lg font-bold text-[#2a4d7a] mb-3">Historial ({tramitesHistorialFiltrados.length}/{tramitesHistorial.length})</h2>
          {tramitesHistorialFiltrados.length === 0 ? (
            <p className="text-[#8ca0bc]">No hay trámites en historial.</p>
          ) : (
            <div className="space-y-2">
              {tramitesHistorialFiltrados.map((tramite) => (
                <div key={tramite.id} className={`rounded-md border p-3 ${getHistorialCardClass(tramite.estado)}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#2e5e96]">{tramite.tipo === "abono" ? "Abono" : "Mantenimiento"}</p>
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${getEstadoBadgeClass(tramite.estado)}`}>
                      {getEstadoLabel(tramite.estado)}
                    </span>
                  </div>
                  <p className="text-xs text-[#59779f] mt-1">{tramite.descripcion || "Sin descripción"}</p>
                  <p className="text-xs text-[#6f87a8] mt-1">Equipo: {tramite.equipos?.marca || "-"} {tramite.equipos?.modelo || ""}</p>
                  <Link href={`/tramites/${tramite.id}`} className="inline-block mt-2 text-xs font-semibold text-[#1f6bc1] hover:text-[#19599f]">
                    Ver trámite
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {showEditModal && (
        <div className="fixed inset-0 bg-[#142947]/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#cfdced] rounded-md p-6 max-w-2xl w-full shadow-[0_14px_24px_rgba(29,66,116,.25)]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#224a78]">Editar Cliente</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-[#6f87a8] hover:text-[#224a78] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-[#607b9f] mb-4">
              Actualiza los datos principales del cliente. La ciudad sugerida mantiene el mismo formato visual del sistema.
            </p>

            <form onSubmit={handleUpdateClient} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#5e7da3] mb-1">Nombre *</label>
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
                  <label className="block text-xs font-medium text-[#5e7da3] mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-[#cad8ea] rounded-md text-[#2a4f7d] text-sm focus:outline-none focus:ring-2 focus:ring-[#8caad0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5e7da3] mb-1">Teléfono</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-[#cad8ea] rounded-md text-[#2a4f7d] text-sm focus:outline-none focus:ring-2 focus:ring-[#8caad0]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#5e7da3] mb-1">Dirección</label>
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-[#cad8ea] rounded-md text-[#2a4f7d] text-sm focus:outline-none focus:ring-2 focus:ring-[#8caad0]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#5e7da3] mb-1">Ciudad</label>
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

                    {showCitySuggestions && ciudadesFiltradas.length > 0 && (
                      <div className="absolute z-20 mt-1 w-full bg-[#f8fbff] border border-[#cad8ea] rounded-md shadow-[0_8px_18px_rgba(31,107,193,.18)] max-h-44 overflow-y-auto">
                        {ciudadesFiltradas.map((city) => (
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
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 bg-white border border-[#cad8ea] text-[#48688f] rounded-md text-sm font-semibold hover:bg-[#f2f7ff] transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-[#1f6bc1] text-white rounded-md text-sm font-semibold hover:bg-[#19599f] transition-all disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEquipoModal && (
        <div className="fixed inset-0 bg-[#142947]/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#cfdced] rounded-md p-6 max-w-md w-full shadow-[0_14px_24px_rgba(29,66,116,.25)]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#224a78]">Añadir Equipo</h2>
              <button
                onClick={() => setShowEquipoModal(false)}
                className="text-[#6f87a8] hover:text-[#224a78] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-[#607b9f] mb-4">Este equipo quedará asociado automáticamente a {cliente.nombre || "este cliente"}.</p>

            <form onSubmit={handleCreateEquipo} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#5e7da3] mb-1">Marca *</label>
                <input
                  type="text"
                  name="marca"
                  value={equipoFormData.marca}
                  onChange={handleEquipoChange}
                  required
                  className="w-full px-3 py-2 bg-white border border-[#cad8ea] rounded-md text-[#2a4f7d] text-sm focus:outline-none focus:ring-2 focus:ring-[#8caad0]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5e7da3] mb-1">Modelo *</label>
                <input
                  type="text"
                  name="modelo"
                  value={equipoFormData.modelo}
                  onChange={handleEquipoChange}
                  required
                  className="w-full px-3 py-2 bg-white border border-[#cad8ea] rounded-md text-[#2a4f7d] text-sm focus:outline-none focus:ring-2 focus:ring-[#8caad0]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5e7da3] mb-1">Tipo</label>
                <select
                  name="tipo"
                  value={equipoFormData.tipo}
                  onChange={handleEquipoChange}
                  className="w-full px-3 py-2 bg-white border border-[#cad8ea] rounded-md text-[#2a4f7d] text-sm focus:outline-none focus:ring-2 focus:ring-[#8caad0]"
                >
                  <option value="split">Split</option>
                  <option value="cassette">Cassette</option>
                  <option value="piso-techo">Piso-Techo</option>
                  <option value="multi-split">Multi-Split</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5e7da3] mb-1">Capacidad</label>
                <input
                  type="text"
                  name="capacidad"
                  value={equipoFormData.capacidad}
                  onChange={handleEquipoChange}
                  placeholder="Ej: 12000 BTU"
                  className="w-full px-3 py-2 bg-white border border-[#cad8ea] rounded-md text-[#2a4f7d] text-sm focus:outline-none focus:ring-2 focus:ring-[#8caad0]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5e7da3] mb-1">Ubicación interna</label>
                <input
                  type="text"
                  name="ubicacion"
                  value={equipoFormData.ubicacion}
                  onChange={handleEquipoChange}
                  placeholder="Ej: Sala principal"
                  className="w-full px-3 py-2 bg-white border border-[#cad8ea] rounded-md text-[#2a4f7d] text-sm focus:outline-none focus:ring-2 focus:ring-[#8caad0]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEquipoModal(false)}
                  className="flex-1 px-4 py-2 bg-white border border-[#cad8ea] text-[#48688f] rounded-md text-sm font-semibold hover:bg-[#f2f7ff] transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEquipo}
                  className="flex-1 px-4 py-2 bg-[#1f6bc1] text-white rounded-md text-sm font-semibold hover:bg-[#19599f] transition-all disabled:opacity-50"
                >
                  {savingEquipo ? "Guardando..." : "Guardar Equipo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
