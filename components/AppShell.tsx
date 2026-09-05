"use client"

import { usePathname } from "next/navigation"
import AuthGate from "@/components/AuthGate"
import LocalNotifications from "@/components/LocalNotifications"
import Navbar from "@/components/Navbar"
import NotificationManager from "@/components/NotificationManager"
import { isPublicPath } from "@/lib/roleAccess"

type AppShellProps = {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname() || "/"
  const isPublicRoute = isPublicPath(pathname)

  if (isPublicRoute) {
    return (
      <main className="min-h-dvh min-w-0">
        <AuthGate>{children}</AuthGate>
      </main>
    )
  }

  return (
    <>
      <NotificationManager />
      <LocalNotifications />
      <Navbar />
      <main className="min-h-dvh min-w-0 overflow-x-clip pb-20 lg:ml-[280px] lg:pb-0">
        <AuthGate>{children}</AuthGate>
      </main>
    </>
  )
}
