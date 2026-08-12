"use client"

import Link from "next/link"
import { useState } from "react"
import type { ReactNode } from "react"
import InternalNotificationCenter from "@/components/InternalNotificationCenter"
import NotificationSettings from "@/components/NotificationSettings"
import PageHeader from "@/components/PageHeader"

type IconName = "user" | "building" | "users" | "equipment" | "inventory" | "wrench" | "bell" | "link" | "file" | "database" | "shield" | "history" | "card" | "info"
type Setting = { title: string; description: string; icon: IconName; tone: string; action?: "notifications" | "permissions" }

const settings: Setting[] = [
  { title: "Mi cuenta", description: "Tu perfil, datos personales y preferencias de acceso.", icon: "user", tone: "text-blue-600 bg-blue-50" },
  { title: "Empresa", description: "Información general y datos de contacto de tu empresa.", icon: "building", tone: "text-emerald-600 bg-emerald-50" },
  { title: "Usuarios y permisos", description: "Administra usuarios, roles y permisos de acceso.", icon: "users", tone: "text-violet-600 bg-violet-50", action: "permissions" },
  { title: "Equipos", description: "Categorías, marcas, modelos y estados de los equipos.", icon: "equipment", tone: "text-blue-600 bg-blue-50" },
  { title: "Inventario", description: "Repuestos, categorías, stock mínimo y proveedores.", icon: "inventory", tone: "text-amber-600 bg-amber-50" },
  { title: "Mantenimiento", description: "Intervalos, prioridades y reglas de mantenimiento.", icon: "wrench", tone: "text-orange-600 bg-orange-50" },
  { title: "Notificaciones", description: "Alertas internas, canales de comunicación y recordatorios.", icon: "bell", tone: "text-emerald-600 bg-emerald-50", action: "notifications" },
  { title: "Integraciones", description: "Conecta ClimaControl con otras herramientas y servicios.", icon: "link", tone: "text-violet-600 bg-violet-50" },
  { title: "Documentos", description: "Plantillas, informes, certificados y documentos del sistema.", icon: "file", tone: "text-rose-600 bg-rose-50" },
  { title: "Datos", description: "Importa, exporta y realiza copias de seguridad.", icon: "database", tone: "text-blue-600 bg-blue-50" },
  { title: "Seguridad", description: "Autenticación y políticas de seguridad.", icon: "shield", tone: "text-violet-600 bg-violet-50" },
  { title: "Auditoría", description: "Consulta el historial de actividad del sistema.", icon: "history", tone: "text-amber-700 bg-amber-50" },
  { title: "Plan y facturación", description: "Información de plan, facturación y métodos de pago.", icon: "card", tone: "text-blue-600 bg-blue-50" },
  { title: "Acerca de", description: "Versión del sistema, términos de uso y privacidad.", icon: "info", tone: "text-slate-600 bg-slate-100" },
]

function SettingIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>, building: <><path d="M4 21V5l8-3 8 3v16M9 21v-5h6v5" /><path d="M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01" /></>, users: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-1a6 6 0 0 1 12 0v1M16 4a3 3 0 0 1 0 6m2 11v-1a6 6 0 0 0-3-5.2" /></>, equipment: <><path d="M5 5h14v4H5zM7 9v10m10-10v10M9 14h6m-3-5v10" /></>, inventory: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></>, wrench: <path d="M14.7 6.3a4.5 4.5 0 0 0-5.8 5.8L3.5 17.5a2 2 0 0 0 2.8 2.8l5.4-5.4a4.5 4.5 0 0 0 5.8-5.8l-2.8 2.1-2.1-2.1 2.1-2.8Z" />, bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>, link: <><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" /><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" /></>, file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></>, database: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7" /></>, shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />, history: <><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 2" /></>, card: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></>, info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>,
  }
  return <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">{paths[name]}</svg>
}

export default function ConfiguracionPage() {
  const [selected, setSelected] = useState<Setting["action"] | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  return <div className="mx-auto max-w-[1260px] px-5 py-7 text-slate-900 sm:px-7 lg:px-9">
    <PageHeader title="Configuración" description="Administra los ajustes generales del sistema y de tu empresa." actions={<><button type="button" aria-label="Abrir notificaciones" onClick={() => setSelected("notifications")} className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"><SettingIcon name="bell" /></button><Link href="/escanear-qr" className="hidden h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 sm:inline-flex"><SettingIcon name="equipment" />Escanear QR</Link></>} />
    {selected === "notifications" && <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,.06)]"><div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-lg font-bold text-slate-950">Centro de notificaciones</p><p className="mt-1 text-sm text-slate-500">Alertas calculadas con la información actual de PowerCool.</p></div><button onClick={() => setSelected(null)} className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900">Cerrar</button></div><InternalNotificationCenter /><div className="mt-5 border-t border-slate-100 pt-5"><NotificationSettings /></div></section>}
    {selected === "permissions" && <section className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-900"><span>La administración de usuarios y permisos está disponible para administradores.</span><Link href="/admin" className="rounded-lg bg-blue-600 px-3 py-2 font-semibold text-white hover:bg-blue-700">Abrir panel</Link></section>}
    {notice && <div role="status" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{notice}</div>}
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{settings.map((setting) => <button key={setting.title} type="button" onClick={() => setting.action ? setSelected(setting.action) : setNotice(`${setting.title}: próximamente.`)} className="group min-h-[176px] rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-[0_5px_18px_rgba(15,23,42,.025)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_14px_30px_rgba(15,23,42,.07)]"><span className={`grid h-12 w-12 place-items-center rounded-xl ${setting.tone}`}><SettingIcon name={setting.icon} /></span><div className="mt-4 flex items-center justify-between gap-3"><h2 className="text-base font-bold tracking-[-.02em] text-slate-900">{setting.title}</h2><span className="text-lg text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600">›</span></div><p className="mt-1.5 max-w-[30ch] text-sm leading-5 text-slate-500">{setting.description}</p>{!setting.action && <span className="mt-3 inline-block text-xs font-semibold text-slate-400">Próximamente</span>}</button>)}</section>
  </div>
}
