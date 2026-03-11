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
    <nav className="border-b border-white/10 backdrop-blur-lg bg-black/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="p-1.5 bg-white rounded-lg group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <span className="text-base font-bold text-white hidden sm:inline">
              PowerCool
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 justify-end">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isActive("/") && pathname === "/"
                  ? "bg-white text-black"
                  : "text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              Inicio
            </Link>

            <Link
              href="/equipos"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isActive("/equipos")
                  ? "bg-white text-black"
                  : "text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              Equipos
            </Link>

            <Link
              href="/clientes"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isActive("/clientes")
                  ? "bg-white text-black"
                  : "text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              Clientes
            </Link>

            <Link
              href="/tramites"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isActive("/tramites")
                  ? "bg-white text-black"
                  : "text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              Trámites
            </Link>

            <Link
              href="/stock"
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 cursor-not-allowed flex items-center gap-1 whitespace-nowrap"
            >
              Stock
              <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded-full">WIP</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}