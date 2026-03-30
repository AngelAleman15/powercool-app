"use client"

import { useEffect, useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuthSession } from "@/lib/useAuthSession"
import { canAccessPath, isPublicPath } from "@/lib/roleAccess"

export default function AuthGate({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const { loading, user, role } = useAuthSession()

  const currentPath = useMemo(() => pathname || "/", [pathname])
  const publicPath = useMemo(() => isPublicPath(currentPath), [currentPath])
  const hasAccess = useMemo(() => canAccessPath(currentPath, role), [currentPath, role])

  useEffect(() => {
    if (loading) return

    if (!user && !publicPath) {
      router.replace("/auth")
      return
    }

    if (user && !hasAccess) {
      router.replace("/sin-acceso")
    }
  }, [loading, user, publicPath, hasAccess, router])

  if (loading && !publicPath) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center">
        <div className="rounded-xl border border-[#d6e2f2] bg-white px-5 py-4 text-[#355b8a] shadow-[0_8px_28px_rgba(36,84,145,.10)]">
          Validando sesión...
        </div>
      </div>
    )
  }

  if (!user && !publicPath) {
    return null
  }

  if (user && !hasAccess) {
    return null
  }

  return children
}
