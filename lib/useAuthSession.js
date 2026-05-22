"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"

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
