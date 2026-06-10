"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"

const PREVIEW_KEY = "powercool_preview_mode"
const PREVIEW_SESSION = {
  user: {
    id: "preview-user",
    email: "preview@powercool.local",
    user_metadata: { full_name: "Vista previa" },
  },
}
const PREVIEW_PROFILE = {
  id: "preview-user",
  full_name: "Vista previa",
  role: "admin",
}

function readPreviewMode() {
  if (typeof window === "undefined") return false
  const params = new URLSearchParams(window.location.search)
  if (params.get("preview") === "1") {
    window.localStorage.setItem(PREVIEW_KEY, "1")
    return true
  }
  return window.localStorage.getItem(PREVIEW_KEY) === "1"
}

function resolveDisplayName(user, profile) {
  if (profile?.full_name) return profile.full_name
  if (user?.user_metadata?.full_name) return user.user_metadata.full_name
  if (user?.user_metadata?.name) return user.user_metadata.name
  return "Usuario"
}

function withTimeout(promise, timeoutMs, fallbackValue) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      window.setTimeout(() => resolve(fallbackValue), timeoutMs)
    }),
  ])
}

export function useAuthSession() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (user) => {
    try {
      if (!user?.id) {
        setProfile(null)
        return
      }

      const inferredName =
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        null

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", user.id)
        .maybeSingle()

      if (error && error.code !== "PGRST116") {
        setProfile(null)
        return
      }

      if (!data) {
        await supabase.from("profiles").insert({
          id: user.id,
          email: user.email || null,
          full_name: inferredName || null,
        })
      } else if (!data.full_name && inferredName) {
        await supabase
          .from("profiles")
          .update({ full_name: inferredName })
          .eq("id", user.id)
      }

      const { data: freshProfile } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", user.id)
        .maybeSingle()

      setProfile(freshProfile || data || null)
    } catch (error) {
      console.error("No se pudo cargar el perfil de usuario", error)
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    let active = true

    const bootstrap = async () => {
      try {
        if (readPreviewMode()) {
          setSession(PREVIEW_SESSION)
          setProfile(PREVIEW_PROFILE)
          setLoading(false)
          return
        }

        const { data } = await withTimeout(
          supabase.auth.getSession(),
          5000,
          { data: { session: null } }
        )
        if (!active) return

        const nextSession = data?.session || null
        setSession(nextSession)
        setLoading(false)
        void loadProfile(nextSession?.user)
      } catch (error) {
        console.error("No se pudo validar la sesión", error)
        if (!active) return
        setSession(null)
        setProfile(null)
        setLoading(false)
      }
    }

    bootstrap()

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!active) return
      if (readPreviewMode()) {
        setSession(PREVIEW_SESSION)
        setProfile(PREVIEW_PROFILE)
        setLoading(false)
        return
      }
      setSession(nextSession)
      setLoading(false)
      void loadProfile(nextSession?.user)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [loadProfile])

  const signOut = useCallback(async () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(PREVIEW_KEY)
    }
    await supabase.auth.signOut()
  }, [])

  const user = session?.user || null

  const displayName = useMemo(() => resolveDisplayName(user, profile), [user, profile])
  const role = profile?.role || "visor"

  return {
    loading,
    session,
    user,
    profile,
    displayName,
    role,
    signOut,
  }
}
