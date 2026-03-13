"use client"

import { useEffect, useState } from "react"

const DEMO_KEY = "powercool_demo_mode"
const DEMO_EVENT = "powercool-demo-mode-changed"

const getInitialDemoMode = () => {
  if (typeof window === "undefined") return false
  return window.localStorage.getItem(DEMO_KEY) === "true"
}

export function useDemoMode() {
  const [demoMode, setDemoMode] = useState(getInitialDemoMode)

  useEffect(() => {
    if (typeof window === "undefined") return

    const syncDemoMode = () => {
      const current = window.localStorage.getItem(DEMO_KEY) === "true"
      setDemoMode(current)
    }

    // Re-sync in case localStorage changed outside current tab lifecycle.
    syncDemoMode()

    window.addEventListener(DEMO_EVENT, syncDemoMode)
    window.addEventListener("storage", syncDemoMode)

    return () => {
      window.removeEventListener(DEMO_EVENT, syncDemoMode)
      window.removeEventListener("storage", syncDemoMode)
    }
  }, [])

  const setDemoModePersistent = (value) => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(DEMO_KEY, value ? "true" : "false")
    window.dispatchEvent(new Event(DEMO_EVENT))
    setDemoMode(value)
  }

  return { demoMode, setDemoModePersistent }
}
