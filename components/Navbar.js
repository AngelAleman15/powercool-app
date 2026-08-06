"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuthSession } from "@/lib/useAuthSession"
import { isPublicPath } from "@/lib/roleAccess"

const icons = {
  panel: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z" />,
  clientes: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m16-10a4 4 0 1 0 0-8m-8 8a4 4 0 1 0 0-8m8 10a4 4 0 0 1 4 4v2" />,
  equipos: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 5h14v4H5V5Zm2 4v10m10-10v10M9 13h6m-3-4v8" />,
  inventario: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m12 3 7 4v8l-7 4-7-4V7l7-4Zm-7 4 7 4 7-4M12 11v8" />,
  tramites: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2m-6 0a3 3 0 0 0 6 0m-6 0a3 3 0 0 1 6 0m-6 7h6m-6 4h4" />,
  admin: <><circle cx="12" cy="12" r="3" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.1 2.1-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-3v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-2.1-2.1.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H5.3v-3h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2.1-2.1.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2h3v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.1 2.1-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2v3h-.2a1.7 1.7 0 0 0-1.5 1Z" /></>,
}

function NavIcon({ name }) {
  return <svg aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">{icons[name]}</svg>
}

function Brand({ compact = false }) {
  return (
    <div className="flex items-center gap-3 px-3">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-[#2784ff] to-[#0958c9] shadow-[0_10px_22px_rgba(8,94,205,.32)]">
        <svg aria-hidden="true" className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 2v20M4.1 6l15.8 12M4.1 18 19.9 6M2 12h20M7 3.3l10 17.4M17 3.3 7 20.7" /></svg>
      </div>
      <div>
        <p className={`text-lg font-bold tracking-[-0.03em] ${compact ? "text-slate-900" : "text-white"}`}>ClimaControl</p>
        <p className={`text-sm ${compact ? "text-slate-500" : "text-slate-400"}`}>Gestión técnica</p>
      </div>
    </div>
  )
}

export default function Navbar() {
  const pathname = usePathname()
  const { loading, user, displayName, role, signOut } = useAuthSession()
  const shouldShowNav = !isPublicPath(pathname || "/")

  if (!shouldShowNav) return null

  const isActive = (path) => path === "/" ? pathname === "/" : pathname.startsWith(path)
  const navItems = [
    { href: "/", label: "Panel", icon: "panel" },
    { href: "/clientes", label: "Clientes", icon: "clientes" },
    { href: "/equipos", label: "Equipos", icon: "equipos" },
    { href: "/tramites", label: "Mantenimientos", icon: "tramites" },
    { href: "/inventario", label: "Inventario", icon: "inventario" },
    { href: "/configuracion", label: "Configuración", icon: "admin" },
  ]

  return (
    <>
      <aside
        className="fixed inset-y-0 left-0 z-50 hidden w-[280px] flex-col overflow-hidden border-r border-white/10 bg-[#061426] px-4 py-7 md:flex"
        style={{ backgroundImage: "linear-gradient(180deg,rgba(3,16,32,.78) 0%,rgba(3,17,34,.64) 48%,rgba(3,17,34,.9) 100%),url('/sidebar-mountains.png')", backgroundPosition: "center", backgroundSize: "cover" }}
      >
        <Link href="/" aria-label="Ir al panel" className="mb-9"><Brand /></Link>
        <nav aria-label="Navegación principal" className="space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={`flex items-center gap-4 rounded-xl px-4 py-3 text-[15px] font-semibold transition-all ${isActive(item.href) ? "bg-gradient-to-r from-[#1976e9] to-[#1758aa] text-white shadow-[0_10px_24px_rgba(18,106,220,.3)]" : "text-slate-300 hover:bg-white/8 hover:text-white"}`}>
              <NavIcon name={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-white/10 px-3 pt-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-[#738bdc] to-[#293d71] text-sm font-bold text-white">{(displayName || "U").slice(0, 2).toUpperCase()}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{loading ? "Cargando..." : displayName}</p>
              <p className="truncate text-xs capitalize text-slate-400">{role || "Usuario"}</p>
            </div>
            {!loading && user && <button type="button" onClick={signOut} aria-label="Cerrar sesión" className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4m-5-4 4-5-4-5m4 5H3" /></svg></button>}
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/" aria-label="Ir al panel"><Brand compact /></Link>
        {!loading && user && <button type="button" onClick={signOut} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Salir</button>}
      </header>
      <nav aria-label="Navegación móvil" className="fixed inset-x-0 bottom-0 z-50 flex border-t border-slate-200 bg-white/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,.08)] md:hidden">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-semibold ${isActive(item.href) ? "text-[#1264d5]" : "text-slate-500"}`}>
            <NavIcon name={item.icon} />
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}
