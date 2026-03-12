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
      <nav className="hidden md:block border-b border-white/10 backdrop-blur-lg bg-black/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14 gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
              <div className="p-1.5 bg-white rounded-lg group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <span className="text-base font-bold text-white">PowerCool</span>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-1">
              <Link
                href="/"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive("/") && pathname === "/"
                    ? "bg-white text-black"
                    : "text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                Inicio
              </Link>

              <Link
                href="/equipos"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive("/equipos")
                    ? "bg-white text-black"
                    : "text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                Equipos
              </Link>

              <Link
                href="/clientes"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive("/clientes")
                    ? "bg-white text-black"
                    : "text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                Clientes
              </Link>

              <Link
                href="/tramites"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive("/tramites")
                    ? "bg-white text-black"
                    : "text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                Trámites
              </Link>

              <Link
                href="/calendario"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive("/calendario")
                    ? "bg-white text-black"
                    : "text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                Calendario
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 backdrop-blur-lg bg-black/95 safe-area-inset-bottom">
        <div className="grid grid-cols-5 h-16">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              pathname === "/"
                ? "text-white"
                : "text-gray-400 active:bg-white/5"
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
                : "text-gray-400 active:bg-white/5"
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
                : "text-gray-400 active:bg-white/5"
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
                : "text-gray-400 active:bg-white/5"
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span className="text-xs font-medium">Trámites</span>
          </Link>

          <Link
            href="/calendario"
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              isActive("/calendario")
                ? "text-white"
                : "text-gray-400 active:bg-white/5"
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium">Calendario</span>
          </Link>
        </div>
      </nav>
    </>
  )
}