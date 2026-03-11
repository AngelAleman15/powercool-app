"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function NuevoEquipo() {
  const router = useRouter()
  const [clientes, setClientes] = useState([])
  const [showClienteModal, setShowClienteModal] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    marca: "",
    modelo: "",
    ubicacion: "",
    capacidad: "",
    tipo: "split",
    cliente_id: ""
  })

  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    ciudad: ""
  })

  useEffect(() => {
    cargarClientes()
  }, [])

  const cargarClientes = async () => {
    const { data } = await supabase
      .from("clientes")
      .select("*")
      .order("nombre")
    setClientes(data || [])
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleClienteChange = (e) => {
    setNuevoCliente({ ...nuevoCliente, [e.target.name]: e.target.value })
  }

  const crearClienteRapido = async (e) => {
    e.preventDefault()
    const { data, error } = await supabase
      .from("clientes")
      .insert([nuevoCliente])
      .select()
      .single()

    if (!error && data) {
      setFormData({ ...formData, cliente_id: data.id })
      setNuevoCliente({ nombre: "", email: "", telefono: "", direccion: "", ciudad: "" })
      setShowClienteModal(false)
      cargarClientes()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    const { data, error } = await supabase
      .from("equipos")
      .insert([formData])
      .select()
      .single()

    if (!error && data) {
      router.push(`/equipos/${data.id}`)
    }
    setSaving(false)
  }

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">
          Nuevo Equipo
        </h1>
        <p className="text-xs text-gray-400">
          Registrar un nuevo equipo de climatización
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl border border-white/10 p-6">
        
        {/* Cliente Selection */}
        <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
          <label className="block text-sm font-medium text-white mb-2">
            Cliente *
          </label>
          
          <div className="flex gap-2">
            <select
              value={formData.cliente_id}
              onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
              required
              className="flex-1 px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre} {cliente.email && `- ${cliente.email}`}
                </option>
              ))}
            </select>
            
            <button
              type="button"
              onClick={() => setShowClienteModal(true)}
              className="px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all whitespace-nowrap"
            >
              + Crear Cliente
            </button>
          </div>
        </div>

        {/* Equipment Info */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Marca *
            </label>
            <input
              type="text"
              name="marca"
              value={formData.marca}
              onChange={handleChange}
              required
              placeholder="Ej: Samsung, LG, Carrier..."
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
              value={formData.modelo}
              onChange={handleChange}
              required
              placeholder="Ej: AR12TXHQASINEU"
              className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Tipo
            </label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
            >
              <option value="split">Split</option>
              <option value="central">Central</option>
              <option value="ventana">Ventana</option>
              <option value="portatil">Portátil</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Capacidad
            </label>
            <input
              type="text"
              name="capacidad"
              value={formData.capacidad}
              onChange={handleChange}
              placeholder="Ej: 12000 BTU, 3500 frigorías..."
              className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Ubicación
            </label>
            <input
              type="text"
              name="ubicacion"
              value={formData.ubicacion}
              onChange={handleChange}
              placeholder="Ej: Oficina principal, Sala de juntas..."
              className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-sm font-semibold hover:bg-white/10 transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Equipo'}
          </button>
        </div>
      </form>

      {/* Modal Crear Cliente Rápido */}
      {showClienteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Crear Cliente Rápido</h2>
              <button
                onClick={() => setShowClienteModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={crearClienteRapido} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={nuevoCliente.nombre}
                  onChange={handleClienteChange}
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
                  value={nuevoCliente.email}
                  onChange={handleClienteChange}
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
                  value={nuevoCliente.telefono}
                  onChange={handleClienteChange}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                />
              </div>

              <p className="text-xs text-gray-500 italic">
                Puedes editar el resto de los datos del cliente más tarde desde la sección de Clientes.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClienteModal(false)}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-sm font-semibold hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all"
                >
                  Crear y Seleccionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
