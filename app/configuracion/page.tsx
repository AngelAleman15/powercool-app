"use client"

import Link from "next/link"
import { useState } from "react"
import NotificationSettings from "@/components/NotificationSettings"
import PageHeader from "@/components/PageHeader"

type Setting = {
  title: string
  description: string
  icon: string
  tone: string
  available?: boolean
}

const settings: Setting[] = [
  { title: "Mi cuenta", description: "Gestiona tu perfil, datos personales y preferencias de acceso.", icon: "◯", tone: "text-blue-600 bg-blue-50" },
  { title: "Empresa", description: "Información general de tu empresa y datos de contacto.", icon: "⌂", tone: "text-emerald-600 bg-emerald-50" },
  { title: "Usuarios y permisos", description: "Administra usuarios, roles y permisos de acceso al sistema.", icon: "♧", tone: "text-violet-600 bg-violet-50", available: true },
  { title: "Equipos", description: "Configura categorías, marcas, modelos y estados de los equipos.", icon: "▣", tone: "text-blue-600 bg-blue-50" },
  { title: "Inventario", description: "Gestiona repuestos, categorías, stock mínimo y proveedores.", icon: "◇", tone: "text-amber-600 bg-amber-50" },
  { title: "Mantenimiento", description: "Intervalos de servicio, prioridades y reglas de mantenimiento.", icon: "⌕", tone: "text-orange-600 bg-orange-50" },
  { title: "Notificaciones", description: "Configura alertas, canales de comunicación y recordatorios.", icon: "♧", tone: "text-emerald-600 bg-emerald-50", available: true },
  { title: "Integraciones", description: "Conecta ClimaControl con otras herramientas y servicios.", icon: "⌁", tone: "text-violet-600 bg-violet-50" },
  { title: "Documentos", description: "Plantillas, informes, certificados y documentos del sistema.", icon: "□", tone: "text-red-500 bg-red-50" },
  { title: "Datos", description: "Importa, exporta y realiza copias de seguridad de tu información.", icon: "◴", tone: "text-blue-600 bg-blue-50" },
  { title: "Seguridad", description: "Configuración de acceso, autenticación y políticas de seguridad.", icon: "⬡", tone: "text-violet-600 bg-violet-50" },
  { title: "Auditoría", description: "Consulta el historial de actividades realizadas en el sistema.", icon: "▤", tone: "text-amber-700 bg-amber-50" },
  { title: "Plan y facturación", description: "Información de tu plan, facturación y métodos de pago.", icon: "▰", tone: "text-blue-600 bg-blue-50" },
  { title: "Acerca de", description: "Versión del sistema, términos de uso y política de privacidad.", icon: "ⓘ", tone: "text-slate-600 bg-slate-100" },
]

export default function ConfiguracionPage() {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-8 text-slate-900 sm:px-8 lg:px-9 lg:py-10">
      <PageHeader
        title="Configuración"
        description="Administra los ajustes generales del sistema y de tu empresa."
        actions={<><button type="button" aria-label="Notificaciones en preparación" onClick={() => setSelected("Notificaciones")} className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:bg-slate-50">♧</button><Link href="/escanear-qr" className="hidden h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold shadow-sm transition hover:bg-slate-50 sm:flex">⌗ Escanear QR</Link></>}
      />

      {selected === "Notificaciones" && (
        <section className="mb-6 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,.06)]">
          <div className="mb-4 flex items-center justify-between gap-4"><div><h2 className="text-lg font-bold">Notificaciones <span className="ml-2 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">WIP</span></h2><p className="mt-1 text-sm text-slate-500">Preparado para alertas de equipos fuera de servicio, mantenimientos próximos y stock bajo.</p></div><button type="button" onClick={() => setSelected(null)} className="text-sm font-semibold text-slate-500 hover:text-slate-900">Cerrar</button></div>
          <NotificationSettings />
        </section>
      )}

      {selected === "Usuarios y permisos" && (
        <section className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-900">
          <span>La administración de usuarios y permisos está disponible para administradores.</span><Link href="/admin" className="rounded-lg bg-blue-600 px-3 py-2 font-semibold text-white">Abrir panel</Link>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settings.map((setting) => (
          <button key={setting.title} type="button" onClick={() => setting.available && setSelected(setting.title)} className="group min-h-[220px] rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-[0_6px_18px_rgba(15,23,42,.025)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_14px_30px_rgba(15,23,42,.07)]">
            <span className={`grid h-15 w-15 place-items-center rounded-xl text-[30px] font-medium ${setting.tone}`}>{setting.icon}</span>
            <div className="mt-4 flex items-center justify-between gap-3"><h2 className="text-[19px] font-bold tracking-[-.03em]">{setting.title}</h2><span className="text-xl text-slate-500 transition group-hover:translate-x-0.5">›</span></div>
            <p className="mt-2 max-w-[28ch] text-[15px] leading-6 text-slate-500">{setting.description}</p>
          </button>
        ))}
      </section>
    </div>
  )
}
