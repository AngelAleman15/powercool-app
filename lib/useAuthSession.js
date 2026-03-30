"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"

function deriveNameFromEmail(email) {
  if (!email) return "Invitado"
  const local = String(email).split("@")[0] || ""
  const normalized = local.replace(/[._-]+/g, " ").trim()
  if (!normalized) return email
  return normalized
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function resolveDisplayName(user, profile) {
  if (profile?.full_name) return profile.full_name
  if (user?.user_metadata?.full_name) return user.user_metadata.full_name
  if (user?.user_metadata?.name) return user.user_metadata.name
  if (user?.email) return deriveNameFromEmail(user.email)
  return "Invitado"
}

export function useAuthSession() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (user) => {
    if (!user?.id) {
      setProfile(null)
      return
    }

    const inferredName =
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      deriveNameFromEmail(user?.email)

    // Crea o completa el perfil una sola vez para que quede persistido en DB.
    await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email || null,
        full_name: inferredName || null,
      },
      {
        onConflict: "id",
        ignoreDuplicates: false,
      }
    )

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", user.id)
      .maybeSingle()

    if (error) {
      setProfile(null)
      return
    }

    setProfile(data || null)
  }, [])

  useEffect(() => {
    let active = true

    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession()
      if (!active) return
      const nextSession = data?.session || null
      setSession(nextSession)
      await loadProfile(nextSession?.user)
      if (active) setLoading(false)
    }

    bootstrap()

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      await loadProfile(nextSession?.user)
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
