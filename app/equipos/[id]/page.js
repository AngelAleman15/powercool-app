"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import QRCodeComponent from "@/components/QRCodeComponent"
import Link from "next/link"

export default function EquipoPage({ params }) {

  const [equipo, setEquipo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showExportModal, setShowExportModal] = useState(false)
  const [incluirHistorial, setIncluirHistorial] = useState(true)

  const fichaRef = useRef()
  const historialRef = useRef()

  useEffect(() => {
    cargarEquipo()
  }, [])

  const cargarEquipo = async () => {
    setLoading(true)
    const { id } = await params

    const { data } = await supabase
      .from("equipos")
      .select("*, clientes(*)")
      .eq("id", id)
      .single()

    setEquipo(data)
    setLoading(false)
  }

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
        backgroundColor: '#111',
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Cargando equipo...</p>
        </div>
      </div>
    )
  }

  if (!equipo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg className="mx-auto h-10 w-10 text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-base font-medium text-white mb-2">Equipo no encontrado</h3>
          <Link href="/equipos" className="text-sm text-gray-400 hover:text-white transition-colors">
            Volver a equipos
          </Link>
        </div>
      </div>
    )
  }

  return (

    <div className="px-4 sm:px-6 py-4 sm:py-6">

      {/* Back Button */}
      <Link href="/equipos" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver a equipos
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Main Info Card */}
        <div className="lg:col-span-2">
          <div
            ref={fichaRef}
            className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-6 border border-white/10"
          >

            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white rounded-lg">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{equipo.marca} {equipo.modelo}</h1>
                  <p className="text-gray-500 font-mono text-xs mt-1">ID: {equipo.id}</p>
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                <p className="text-gray-500 text-xs mb-1">Modelo</p>
                <p className="text-white text-base font-semibold">{equipo.modelo || 'No especificado'}</p>
              </div>

              <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                <p className="text-gray-500 text-xs mb-1">Marca</p>
                <p className="text-white text-base font-semibold">{equipo.marca || 'No especificada'}</p>
              </div>

              <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                <p className="text-gray-500 text-xs mb-1">Ubicación</p>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-white text-base font-semibold">{equipo.ubicacion || 'No especificada'}</p>
                </div>
              </div>

              <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                <p className="text-gray-500 text-xs mb-1">Tipo</p>
                <p className="text-white text-base font-semibold">{equipo.tipo || 'Split'}</p>
              </div>

              <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                <p className="text-gray-500 text-xs mb-1">Capacidad</p>
                <p className="text-white text-base font-semibold">{equipo.capacidad || 'No especificada'}</p>
              </div>
            </div>

            {/* Client Info */}
            {equipo.clientes && (
              <div className="bg-black/30 rounded-lg p-4 border border-white/5 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <h3 className="text-lg font-bold text-white">Cliente</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-white text-base font-semibold">{equipo.clientes.nombre}</p>
                  {equipo.clientes.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-400">{equipo.clientes.email}</span>
                    </div>
                  )}
                  {equipo.clientes.telefono && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-gray-400">{equipo.clientes.telefono}</span>
                    </div>
                  )}
                  {equipo.clientes.ciudad && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-gray-400">{equipo.clientes.ciudad}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Maintenance History */}
            <div 
              ref={historialRef}
              className="bg-black/30 rounded-lg p-4 border border-white/5"
            >
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <h3 className="text-lg font-bold text-white">Historial de Mantenimiento</h3>
              </div>
              <p className="text-sm text-gray-500">Esta funcionalidad estará disponible próximamente</p>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-200 text-black text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar a PDF
            </button>
          </div>
        </div>

        {/* Sidebar - QR Code */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-4 border border-white/10 sticky top-16">
            <h3 className="text-base font-bold text-white mb-3">Código QR</h3>
            <QRCodeComponent id={equipo.id} />
          </div>
        </div>

      </div>

      {/* Export Options Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Opciones de Exportación</h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-4">
              Selecciona qué información deseas incluir en el PDF
            </p>

            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all">
                <input
                  type="checkbox"
                  checked={incluirHistorial}
                  onChange={(e) => setIncluirHistorial(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-black text-white focus:ring-2 focus:ring-white/20"
                />
                <div>
                  <p className="text-sm font-medium text-white">Incluir Historial de Mantenimiento</p>
                  <p className="text-xs text-gray-500">Agrega el historial completo al PDF</p>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-sm font-semibold hover:bg-white/10 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => exportarPDF(incluirHistorial)}
                className="flex-1 px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all"
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