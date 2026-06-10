"use client"

import { useEffect } from "react"

const DEMO_KEY = "powercool_demo_mode"
const PREVIEW_KEY = "powercool_preview_mode"

function readPreviewMode() {
  if (typeof window === "undefined") return false
  const params = new URLSearchParams(window.location.search)
  if (params.get("preview") === "1") {
    window.localStorage.setItem(PREVIEW_KEY, "1")
    return true
  }
  return window.localStorage.getItem(PREVIEW_KEY) === "1"
}

export function useDemoMode() {
  const demoMode = readPreviewMode()

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.removeItem(DEMO_KEY)
  }, [])

  const setDemoModePersistent = () => {
    // El modo demo esta deshabilitado de forma permanente.
    return
  }

  return { demoMode, setDemoModePersistent }
}
