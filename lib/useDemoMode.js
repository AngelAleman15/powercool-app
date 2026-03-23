"use client"

import { useEffect } from "react"

const DEMO_KEY = "powercool_demo_mode"

export function useDemoMode() {
  const demoMode = false

  useEffect(() => {
    if (typeof window === "undefined") return
    // Limpia cualquier valor demo antiguo persistido.
    window.localStorage.removeItem(DEMO_KEY)
  }, [])

  const setDemoModePersistent = () => {
    // El modo demo esta deshabilitado de forma permanente.
    return
  }

  return { demoMode, setDemoModePersistent }
}
