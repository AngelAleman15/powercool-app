"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

const inputClass = "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"

function Field({ label, children }) {
  return <label className="block text-sm font-medium text-slate-800"><span>{label}</span>{children}</label>
}

export default function NuevoEquipo() {
  const router = useRouter()
  const [clientes, setClientes] = useState([])
  const [showClienteModal, setShowClienteModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ marca: "", modelo: "", ubicacion: "", capacidad: "", tipo: "split", cliente_id: "" })
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: "", email: "", telefono: "", direccion: "", ciudad: "" })

  const cargarClientes = useCallback(async () => {
    const { data } = await supabase.from("clientes").select("*").order("nombre")
    setClientes(data || [])
  }, [])

  useEffect(() => {
    const initTimer = setTimeout(() => { cargarClientes() }, 0)
    return () => clearTimeout(initTimer)
  }, [cargarClientes])

  const handleChange = (event) => setFormData({ ...formData, [event.target.name]: event.target.value })
  const handleClienteChange = (event) => setNuevoCliente({ ...nuevoCliente, [event.target.name]: event.target.value })

  const crearClienteRapido = async (event) => {
    event.preventDefault()
    const { data, error } = await supabase.from("clientes").insert([nuevoCliente]).select().single()
    if (!error && data) {
      setFormData({ ...formData, cliente_id: data.id })
      setNuevoCliente({ nombre: "", email: "", telefono: "", direccion: "", ciudad: "" })
      setShowClienteModal(false)
      cargarClientes()
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    const { data, error } = await supabase.from("equipos").insert([formData]).select().single()
    if (!error && data) router.push(`/equipos/${data.id}`)
    setSaving(false)
  }

  return <main className="mx-auto max-w-3xl px-5 py-7 text-slate-900 sm:px-8 lg:py-10">
    <header className="mb-7 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Activos instalados</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] text-slate-950">Nuevo equipo</h1><p className="mt-2 text-sm leading-6 text-slate-500">Registra el activo y asígnalo al cliente correspondiente.</p></div>
      <button type="button" onClick={() => router.back()} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">Cancelar</button>
    </header>

    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white">
      <section className="p-5 sm:p-7"><div className="flex items-start justify-between gap-4"><div><h2 className="text-base font-semibold text-slate-950">Asignación</h2><p className="mt-1 text-sm text-slate-500">Selecciona el cliente propietario del equipo.</p></div><button type="button" onClick={() => setShowClienteModal(true)} className="shrink-0 text-sm font-medium text-blue-700 underline-offset-4 hover:text-blue-800 hover:underline">Crear cliente</button></div>
        <Field label="Cliente *"><select value={formData.cliente_id} onChange={(event) => setFormData({ ...formData, cliente_id: event.target.value })} required className={inputClass}><option value="">Seleccionar cliente</option>{clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nombre}{cliente.email ? ` · ${cliente.email}` : ""}</option>)}</select></Field>
      </section>
      <section className="border-t border-slate-200 p-5 sm:p-7"><div><h2 className="text-base font-semibold text-slate-950">Información técnica</h2><p className="mt-1 text-sm text-slate-500">Los campos marcados con * son necesarios para identificar el activo.</p></div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2"><Field label="Marca *"><input type="text" name="marca" value={formData.marca} onChange={handleChange} required placeholder="Ej.: Daikin, LG, Carrier" className={inputClass} /></Field><Field label="Modelo *"><input type="text" name="modelo" value={formData.modelo} onChange={handleChange} required placeholder="Ej.: RXQG100" className={inputClass} /></Field><Field label="Tipo"><select name="tipo" value={formData.tipo} onChange={handleChange} className={inputClass}><option value="split">Split</option><option value="central">Central</option><option value="ventana">Ventana</option><option value="portatil">Portátil</option></select></Field><Field label="Capacidad"><input type="text" name="capacidad" value={formData.capacidad} onChange={handleChange} placeholder="Ej.: 12.000 BTU" className={inputClass} /></Field><div className="sm:col-span-2"><Field label="Ubicación"><input type="text" name="ubicacion" value={formData.ubicacion} onChange={handleChange} placeholder="Ej.: Oficina principal, sala de reuniones" className={inputClass} /></Field></div></div>
      </section>
      <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:flex-row sm:justify-end sm:px-7"><button type="button" onClick={() => router.back()} className="min-h-11 rounded-lg px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200">Cancelar</button><button type="submit" disabled={saving} className="min-h-11 rounded-lg bg-[#1463d8] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0f56bd] disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Guardando…" : "Guardar equipo"}</button></footer>
    </form>

    {showClienteModal && <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/35 p-0 sm:place-items-center sm:p-5" onMouseDown={() => setShowClienteModal(false)}><section role="dialog" aria-modal="true" aria-label="Crear cliente rápido" className="w-full max-w-md rounded-t-xl bg-white shadow-[var(--pc-shadow-float)] sm:rounded-xl" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-start justify-between border-b border-slate-200 px-5 py-4"><div><h2 className="text-lg font-semibold text-slate-950">Crear cliente</h2><p className="mt-1 text-sm text-slate-500">Podrás completar los demás datos desde Clientes.</p></div><button type="button" onClick={() => setShowClienteModal(false)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800" aria-label="Cerrar"><svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg></button></div>
      <form onSubmit={crearClienteRapido} className="space-y-4 p-5"><Field label="Nombre *"><input type="text" name="nombre" value={nuevoCliente.nombre} onChange={handleClienteChange} required className={inputClass} /></Field><Field label="Correo electrónico"><input type="email" name="email" value={nuevoCliente.email} onChange={handleClienteChange} className={inputClass} /></Field><Field label="Teléfono"><input type="tel" name="telefono" value={nuevoCliente.telefono} onChange={handleClienteChange} className={inputClass} /></Field><div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={() => setShowClienteModal(false)} className="min-h-11 rounded-lg px-4 text-sm font-medium text-slate-700 hover:bg-slate-100">Cancelar</button><button type="submit" className="min-h-11 rounded-lg bg-[#1463d8] px-4 text-sm font-semibold text-white hover:bg-[#0f56bd]">Crear y seleccionar</button></div></form>
    </section></div>}
  </main>
}
