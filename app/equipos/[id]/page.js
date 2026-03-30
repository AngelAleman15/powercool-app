"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import QRCodeComponent from "@/components/QRCodeComponent"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useDemoMode } from "@/lib/useDemoMode"
import { DEMO_CLIENTES, DEMO_EQUIPOS, DEMO_TRAMITES } from "@/lib/demoData"

export default function EquipoPage({ params }) {

  const [equipo, setEquipo] = useState(null)
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)
  const [showExportModal, setShowExportModal] = useState(false)
  const [incluirHistorial, setIncluirHistorial] = useState(true)
  const { demoMode } = useDemoMode()
  const searchParams = useSearchParams()

  const fichaRef = useRef()
  const historialRef = useRef()

  const clienteIdFromQuery = searchParams.get("clienteId")
  const fromCliente = searchParams.get("from") === "cliente"
  const clienteIdBack = clienteIdFromQuery || equipo?.cliente_id
  const backHref = fromCliente && clienteIdBack ? `/clientes/${clienteIdBack}` : "/equipos"
  const backLabel = fromCliente && clienteIdBack ? "Volver al cliente" : "Volver a equipos"

  async function cargarEquipo() {
    setLoading(true)
    const { id } = await params

    const isDemoId = String(id).startsWith("DEMO-EQ-")
    if (demoMode || isDemoId) {
      const demoEquipo = DEMO_EQUIPOS.find((e) => String(e.id) === String(id))
      if (demoEquipo) {
        const demoCliente = DEMO_CLIENTES.find((c) => c.id === demoEquipo.cliente_id)
        const demoHistorial = DEMO_TRAMITES
          .filter((t) => t.equipo_id === demoEquipo.id)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

        setEquipo({
          ...demoEquipo,
          clientes: demoCliente || null,
        })
        setHistorial(demoHistorial)
        setLoading(false)
        return
      }
    }

    const { data } = await supabase
      .from("equipos")
      .select("*, clientes(*)")
      .eq("id", id)
      .single()

    setEquipo(data)

    if (data?.id) {
      const { data: historialData } = await supabase
        .from("tramites")
        .select("id, tipo, estado, created_at, fecha_programada")
        .eq("equipo_id", data.id)
        .order("created_at", { ascending: false })

      setHistorial(historialData || [])
    } else {
      setHistorial([])
    }

    setLoading(false)
  }

  useEffect(() => {
    const initTimer = setTimeout(() => {
      cargarEquipo()
    }, 0)

    return () => clearTimeout(initTimer)
  }, [demoMode])

  const exportarPDF = async (conHistorial) => {
    const elementosACapturar = [fichaRef.current]
    
    if (conHistorial && historialRef.current) {
      elementosACapturar.push(historialRef.current)
    }

    const pdf = new jsPDF()
    let yOffset = 10

    for (let i = 0; i < elementosACapturar.length; i++) {
      const elemento = elementosACapturar[i]
      
      const canvas = await html2canvas(elemento, {
        backgroundColor: '#f8fbff',
        scale: 2
      })

      const imgData = canvas.toDataURL("image/png")
      const imgWidth = 190
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      if (i > 0 && yOffset + imgHeight > 280) {
        pdf.addPage()
        yOffset = 10
      }

      pdf.addImage(imgData, "PNG", 10, yOffset, imgWidth, imgHeight)
      yOffset += imgHeight + 10
    }

    const nombreArchivo = `equipo-${equipo.marca}-${equipo.modelo}${conHistorial ? '-completo' : ''}.pdf`
    pdf.save(nombreArchivo)
    setShowExportModal(false)
  }

  const getEstadoVisual = (estado) => {
    if (estado === "completado") {
      return {
        badge: "bg-[#eaf7ef] text-[#2f7d4a]",
        dot: "bg-[#2f7d4a]",
      }
    }

    if (estado === "cancelado") {
      return {
        badge: "bg-[#fdeeee] text-[#b44a4a]",
        dot: "bg-[#b44a4a]",
      }
    }

    if (estado === "en_proceso") {
      return {
        badge: "bg-[#e9f1ff] text-[#2f69b0]",
        dot: "bg-[#2f69b0]",
      }
    }

    return {
      badge: "bg-[#fff8e8] text-[#a97717]",
      dot: "bg-[#a97717]",
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-[#3f5f87]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#d8e4f3] border-b-[#2d72c4] mx-auto mb-3"></div>
          <p className="text-sm text-[#6f87a8]">Cargando equipo...</p>
        </div>
      </div>
    )
  }

  if (!equipo) {
    return (
      <div className="flex items-center justify-center min-h-screen text-[#3f5f87]">
        <div className="text-center">
          <svg className="mx-auto h-10 w-10 text-[#87a1c0] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-base font-semibold text-[#2a4d7a] mb-2">Equipo no encontrado</h3>
          <Link href="/equipos" className="text-sm text-[#4b6f98] hover:text-[#1f6bc1] transition-colors">
            Volver a equipos
          </Link>
        </div>
      </div>
    )
  }

  return (

    <div className="px-4 sm:px-6 py-4 sm:py-6 text-[#314d72]">

      {/* Back Button */}
      <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-[#4f6f98] hover:text-[#1f6bc1] mb-4 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {backLabel}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Main Info Card */}
        <div className="lg:col-span-2">
          <div
            ref={fichaRef}
            className="bg-[#f9fbff] rounded-xl p-6 border border-[#d3dfef] shadow-[0_6px_16px_rgba(50,89,141,.1)]"
          >

            {/* Header */}
            <div className="mb-6 rounded-xl border border-[#dbe6f4] bg-white p-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#edf4ff] rounded-lg border border-[#dbe6f4]">
                    <svg className="w-6 h-6 text-[#1f6bc1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-[#1f4371]">{equipo.marca} {equipo.modelo}</h1>
                    <p className="text-[#6f87a8] font-mono text-xs mt-1">ID: {equipo.id}</p>
                  </div>
                </div>

                <div className="flex flex-col items-start md:items-end gap-2">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#eaf2ff] text-[#2e67ac] font-semibold border border-[#d6e5f7]">
                      Tipo: {equipo.tipo || "Split"}
                    </span>
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#eaf2ff] text-[#2e67ac] font-semibold border border-[#d6e5f7]">
                      Capacidad: {equipo.capacidad || "Sin capacidad"}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1f6bc1] hover:bg-[#19599f] text-white text-xs font-semibold rounded-md transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Exportar PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-6">
              <div className="bg-white rounded-xl p-3 border border-[#dbe6f4] shadow-[inset_0_1px_0_rgba(255,255,255,.8)]">
                <p className="text-[#6f87a8] text-xs mb-1">Modelo</p>
                <p className="text-[#2a4d7a] text-base font-semibold">{equipo.modelo || 'No especificado'}</p>
              </div>

              <div className="bg-white rounded-xl p-3 border border-[#dbe6f4] shadow-[inset_0_1px_0_rgba(255,255,255,.8)]">
                <p className="text-[#6f87a8] text-xs mb-1">Marca</p>
                <p className="text-[#2a4d7a] text-base font-semibold">{equipo.marca || 'No especificada'}</p>
              </div>

              <div className="bg-white rounded-xl p-3 border border-[#dbe6f4] shadow-[inset_0_1px_0_rgba(255,255,255,.8)]">
                <p className="text-[#6f87a8] text-xs mb-1">Ubicación</p>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#6f87a8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-[#2a4d7a] text-base font-semibold">{equipo.ubicacion || 'No especificada'}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-3 border border-[#dbe6f4] shadow-[inset_0_1px_0_rgba(255,255,255,.8)]">
                <p className="text-[#6f87a8] text-xs mb-1">Tipo</p>
                <p className="text-[#2a4d7a] text-base font-semibold">{equipo.tipo || 'Split'}</p>
              </div>

              <div className="bg-white rounded-xl p-3 border border-[#dbe6f4] shadow-[inset_0_1px_0_rgba(255,255,255,.8)] sm:col-span-2 xl:col-span-1">
                <p className="text-[#6f87a8] text-xs mb-1">Capacidad</p>
                <p className="text-[#2a4d7a] text-base font-semibold">{equipo.capacidad || 'No especificada'}</p>
              </div>
            </div>

            {/* Client Info */}
            {equipo.clientes && (
              <div className="bg-white rounded-xl p-4 border border-[#dbe6f4] mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-[#1f6bc1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <h3 className="text-lg font-bold text-[#2a4d7a]">Cliente</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-[#2a4d7a] text-base font-semibold">{equipo.clientes.nombre}</p>
                  {equipo.clientes.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-[#6f87a8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-[#607b9f]">{equipo.clientes.email}</span>
                    </div>
                  )}
                  {equipo.clientes.telefono && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-[#6f87a8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-[#607b9f]">{equipo.clientes.telefono}</span>
                    </div>
                  )}
                  {equipo.clientes.ciudad && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-[#6f87a8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-[#607b9f]">{equipo.clientes.ciudad}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Maintenance History */}
            <div 
              ref={historialRef}
              className="bg-white rounded-xl p-4 border border-[#dbe6f4]"
            >
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-[#1f6bc1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <h3 className="text-lg font-bold text-[#2a4d7a]">Historial de Mantenimiento</h3>
              </div>
              {historial.length === 0 ? (
                <p className="text-sm text-[#8ca0bc]">Sin historial registrado</p>
              ) : (
                <div className="mt-3 space-y-0">
                  {historial.slice(0, 8).map((item, idx, arr) => {
                    const estadoVisual = getEstadoVisual(item.estado)

                    return (
                      <div key={item.id} className="relative pl-6 pb-4 last:pb-0">
                        <span className={`absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-white ${estadoVisual.dot}`}></span>
                        {idx !== arr.length - 1 && (
                          <span className="absolute left-[5px] top-5 bottom-0 w-[2px] bg-[#d8e4f3]"></span>
                        )}

                        <div className="rounded-md border border-[#dbe6f4] bg-[#f8fbff] px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs text-[#2a4d7a] uppercase tracking-wide">{item.tipo}</p>
                            <span className="text-[10px] text-[#6f87a8]">{new Date(item.created_at).toLocaleDateString("es-UY")}</span>
                          </div>
                          <p className="text-xs mt-1">
                            <span className={`inline-flex px-2 py-0.5 rounded-full font-semibold ${estadoVisual.badge}`}>
                              {String(item.estado).replaceAll("_", " ")}
                            </span>
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Sidebar - QR Code */}
        <div className="lg:col-span-1">
          <div className="bg-[#f9fbff] rounded-xl p-4 border border-[#d3dfef] shadow-[0_6px_16px_rgba(50,89,141,.1)] sticky top-16 overflow-hidden">
            <div className="rounded-lg border border-[#d8e5f5] bg-white px-3 py-2 mb-3">
              <h3 className="text-base font-bold text-[#2a4d7a]">Tarjeta de Acceso QR</h3>
              <p className="text-[11px] text-[#6f87a8]">Escanea para abrir la ficha del equipo</p>
            </div>

            <QRCodeComponent id={equipo.id} />
          </div>
        </div>

      </div>

      {/* Export Options Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-[#142947]/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#cfdced] rounded-xl p-6 max-w-md w-full shadow-[0_14px_24px_rgba(29,66,116,.25)]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#224a78]">Opciones de Exportación</h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-[#6f87a8] hover:text-[#224a78] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-[#607b9f] mb-4">
              Selecciona qué información deseas incluir en el PDF
            </p>

            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 p-3 rounded-lg bg-[#f8fbff] border border-[#dbe6f4] cursor-pointer hover:bg-[#f2f7ff] transition-all">
                <input
                  type="checkbox"
                  checked={incluirHistorial}
                  onChange={(e) => setIncluirHistorial(e.target.checked)}
                  className="w-4 h-4 rounded border-[#c6d8ef] text-[#1f6bc1] focus:ring-2 focus:ring-[#8ba9cf]"
                />
                <div>
                  <p className="text-sm font-medium text-[#2a4d7a]">Incluir Historial de Mantenimiento</p>
                  <p className="text-xs text-[#6f87a8]">Agrega el historial completo al PDF</p>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-2 bg-white border border-[#cad8ea] text-[#48688f] rounded-lg text-sm font-semibold hover:bg-[#f2f7ff] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => exportarPDF(incluirHistorial)}
                className="flex-1 px-4 py-2 bg-[#1f6bc1] text-white rounded-lg text-sm font-semibold hover:bg-[#19599f] transition-all"
              >
                Exportar PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}