"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Navbar() {
  const pathname = usePathname()

  const isActive = (path) => {
    if (path === "/") return pathname === "/"
    return pathname.startsWith(path)
  }

  return (
    <>
      {/* Desktop Top Navigation */}
      <nav className="hidden md:block sticky top-0 z-[1000] border-b border-[#2e5f9f] bg-[linear-gradient(90deg,#0f4f9f_0%,#1f6cca_56%,#2c7fe0_100%)] shadow-[0_4px_14px_rgba(17,70,130,.35)]">
        <div className="max-w-6xl mx-auto px-7 lg:px-10">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
              <div className="p-1.5 bg-[#f2f5fa] rounded-md group-hover:scale-105 transition-transform shadow-inner border border-[#cad8eb]">
                <svg className="w-5 h-5 text-[#0f4f9f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 9h14M3 13h18M5 17h14M7 5h10" />
                </svg>
              </div>
              <span className="text-lg font-bold text-[#e9f2ff] tracking-wide">GESTION DE AIRES ACONDICIONADOS</span>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className={`px-3 py-2 text-sm font-semibold transition-all border-b-2 ${
                  isActive("/") && pathname === "/"
                    ? "text-white border-white"
                    : "text-[#d5e8ff] border-transparent hover:text-white"
                }`}
              >
                Inicio
              </Link>

              <Link
                href="/clientes"
                className={`px-3 py-2 text-sm font-semibold transition-all border-b-2 ${
                  isActive("/clientes")
                    ? "text-white border-white"
                    : "text-[#d5e8ff] border-transparent hover:text-white"
                }`}
              >
                Clientes
              </Link>

              <Link
                href="/equipos"
                className={`px-3 py-2 text-sm font-semibold transition-all border-b-2 ${
                  isActive("/equipos")
                    ? "text-white border-white"
                    : "text-[#d5e8ff] border-transparent hover:text-white"
                }`}
              >
                Inventario
              </Link>

              <Link
                href="/tramites"
                className={`px-3 py-2 text-sm font-semibold transition-all border-b-2 ${
                  isActive("/tramites")
                    ? "text-white border-white"
                    : "text-[#d5e8ff] border-transparent hover:text-white"
                }`}
              >
                Trámites
              </Link>

              <span className="px-3 py-2 text-sm font-semibold text-[#d5e8ff]">Soporte</span>
            </div>

            <div className="flex items-center gap-2 text-[#eaf3ff]">
              <span className="text-sm font-semibold">Hola, Carlos Perez</span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f3cf9b] to-[#c98953] border-2 border-[#dce9fa]" />
              <svg className="w-4 h-4 text-[#dce9fa]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[#2e5f9f] bg-[linear-gradient(90deg,#0f4f9f_0%,#1f6cca_56%,#2c7fe0_100%)] safe-area-inset-bottom">
        <div className="grid grid-cols-4 h-16">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              pathname === "/"
                ? "text-white"
                : "text-[#d5e8ff] active:bg-white/10"
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-medium">Inicio</span>
          </Link>

          <Link
            href="/equipos"
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              isActive("/equipos")
                ? "text-white"
                : "text-[#d5e8ff] active:bg-white/10"
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <span className="text-xs font-medium">Equipos</span>
          </Link>

          <Link
            href="/clientes"
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              isActive("/clientes")
                ? "text-white"
                : "text-[#d5e8ff] active:bg-white/10"
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xs font-medium">Clientes</span>
          </Link>

          <Link
            href="/tramites"
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              isActive("/tramites")
                ? "text-white"
                : "text-[#d5e8ff] active:bg-white/10"
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span className="text-xs font-medium">Trámites</span>
          </Link>

        </div>
      </nav>
    </>
  )
}