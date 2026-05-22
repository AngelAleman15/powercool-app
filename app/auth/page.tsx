"use client"

import Link from "next/link"
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthSession } from "@/lib/useAuthSession"

const PENDING_NAME_KEY = "powercool.auth.pendingName"
const PENDING_ACCESS_CODE_KEY = "powercool.auth.pendingAccessCode"
const LAST_EMAIL_KEY = "powercool.auth.lastEmail"
const MAGIC_LINK_COOLDOWN_SECONDS = 60
const SERVER_RATE_LIMIT_COOLDOWN_SECONDS = 60 * 60
const MIN_ACCESS_CODE_LENGTH = 6

function getCooldownStorageKey(email: string) {
  const normalizedEmail = String(email || "").trim().toLowerCase()
  return `powercool.auth.lastMagicLinkAt:${normalizedEmail || "anon"}`
}

function getRateLimitUntilStorageKey(email: string) {
  const normalizedEmail = String(email || "").trim().toLowerCase()
  return `powercool.auth.rateLimitUntil:${normalizedEmail || "anon"}`
}

function getEmailScopedKey(baseKey: string, email: string) {
  const normalizedEmail = String(email || "").trim().toLowerCase()
  return normalizedEmail ? `${baseKey}:${normalizedEmail}` : baseKey
}

export default function AuthPage() {
  const { loading, user, displayName, signOut } = useAuthSession()
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [accessCode, setAccessCode] = useState("")
  const [sending, setSending] = useState(false)
  const [signingInWithCode, setSigningInWithCode] = useState(false)
  const [processingLink, setProcessingLink] = useState(false)
  const [cooldownLeft, setCooldownLeft] = useState(0)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const pendingNameStorageKey = useMemo(() => getEmailScopedKey(PENDING_NAME_KEY, email), [email])
  const pendingAccessCodeStorageKey = useMemo(() => getEmailScopedKey(PENDING_ACCESS_CODE_KEY, email), [email])

  const syncPendingIdentity = useCallback(async (activeUser: { id: string; email?: string } | null | undefined) => {
    if (!activeUser?.id || !activeUser?.email) return { codeActivated: false }
    if (typeof window === "undefined") return

    const normalizedEmail = String(activeUser.email).trim().toLowerCase()
    const nameKey = getEmailScopedKey(PENDING_NAME_KEY, normalizedEmail)
    const codeKey = getEmailScopedKey(PENDING_ACCESS_CODE_KEY, normalizedEmail)
    const preferredName = window.localStorage.getItem(nameKey)?.trim() || ""
    const pendingCode = window.localStorage.getItem(codeKey) || ""

    const authUpdate: { data?: { full_name: string }; password?: string } = {}
    if (preferredName) authUpdate.data = { full_name: preferredName }
    if (pendingCode.length >= MIN_ACCESS_CODE_LENGTH) authUpdate.password = pendingCode

    if (authUpdate.data || authUpdate.password) {
      const { error: updateUserError } = await supabase.auth.updateUser(authUpdate)
      if (updateUserError) {
        return {
          codeActivated: false,
          error: updateUserError.message || "No se pudo activar el codigo de acceso.",
        }
      }
    }

    if (preferredName) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: preferredName })
        .eq("id", activeUser.id)

      if (profileError) {
        return {
          codeActivated: !!authUpdate.password,
          error: profileError.message || "El codigo se activo, pero no se pudo guardar el nombre.",
        }
      }
    }

    window.localStorage.setItem(LAST_EMAIL_KEY, normalizedEmail)
    window.localStorage.removeItem(nameKey)
    window.localStorage.removeItem(codeKey)
    return { codeActivated: !!authUpdate.password }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const savedEmail = window.localStorage.getItem(LAST_EMAIL_KEY)
    if (savedEmail) setEmail(savedEmail)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    const syncCooldown = () => {
      const key = getCooldownStorageKey(email)
      const rateLimitKey = getRateLimitUntilStorageKey(email)
      const raw = window.localStorage.getItem(key)
      const rateLimitUntil = Number(window.localStorage.getItem(rateLimitKey) || 0)
      const lastSentAt = Number(raw || 0)
      const rateLimitLeft = Math.max(0, Math.ceil((rateLimitUntil - Date.now()) / 1000))

      if (rateLimitLeft > 0) {
        setCooldownLeft(rateLimitLeft)
        return
      }

      if (!Number.isFinite(lastSentAt) || lastSentAt <= 0) {
        setCooldownLeft(0)
        return
      }

      const elapsed = Math.floor((Date.now() - lastSentAt) / 1000)
      const left = Math.max(0, MAGIC_LINK_COOLDOWN_SECONDS - elapsed)
      setCooldownLeft(left)
    }

    syncCooldown()
    const timer = window.setInterval(syncCooldown, 1000)
    return () => window.clearInterval(timer)
  }, [email])

  useEffect(() => {
    const hydrateSessionFromHash = async () => {
      if (typeof window === "undefined") return
      const hash = window.location.hash || ""
      if (!hash.includes("access_token=") || !hash.includes("refresh_token=")) return

      const params = new URLSearchParams(hash.replace(/^#/, ""))
      const access_token = params.get("access_token")
      const refresh_token = params.get("refresh_token")
      if (!access_token || !refresh_token) return

      setProcessingLink(true)
      try {
        const { data, error: setSessionError } = await supabase.auth.setSession({ access_token, refresh_token })
        if (setSessionError) {
          setError(setSessionError.message || "No se pudo validar el enlace de acceso.")
        } else {
          const syncResult = await syncPendingIdentity(data.session?.user)
          if (syncResult?.error) {
            setError(syncResult.error)
          } else if (syncResult?.codeActivated) {
            setMessage("Acceso confirmado. Tu codigo ya puede usarse para entrar sin enlace.")
          } else {
            setMessage("Acceso confirmado. No habia un codigo pendiente para activar en este dispositivo.")
          }
          window.history.replaceState({}, document.title, "/auth")
        }
      } finally {
        setProcessingLink(false)
      }
    }

    hydrateSessionFromHash()
  }, [syncPendingIdentity])

  useEffect(() => {
    const syncCurrentUser = async () => {
      const syncResult = await syncPendingIdentity(user)
      if (syncResult?.error) setError(syncResult.error)
    }

    void syncCurrentUser()
  }, [syncPendingIdentity, user])

  const handleMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedName = fullName.trim()
    const normalizedCode = accessCode.trim()

    if (!normalizedName) {
      setError("Ingresa el nombre que queres mostrar antes de pedir el enlace.")
      return
    }

    if (normalizedCode.length < MIN_ACCESS_CODE_LENGTH) {
      setError(`El codigo debe tener al menos ${MIN_ACCESS_CODE_LENGTH} caracteres.`)
      return
    }

    if (cooldownLeft > 0) {
      const minutesLeft = Math.ceil(cooldownLeft / 60)
      setError(
        cooldownLeft > MAGIC_LINK_COOLDOWN_SECONDS
          ? `Supabase esta limitando los emails. Espera aproximadamente ${minutesLeft} min antes de pedir otro enlace.`
          : `Espera ${cooldownLeft}s antes de pedir otro enlace.`
      )
      return
    }

    setError("")
    setMessage("")
    setSending(true)

    try {
      const configuredAppUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim()
      const runtimeOrigin = typeof window !== "undefined" ? window.location.origin : ""
      const baseUrl = configuredAppUrl || runtimeOrigin
      const redirectTo = baseUrl ? `${baseUrl.replace(/\/$/, "")}/auth` : undefined

      const { error: authError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: redirectTo,
          data: { full_name: normalizedName },
        },
      })

      if (authError) {
        const rawMessage = String(authError.message || "")
        if (authError.status === 429 || /rate limit|too many/i.test(rawMessage)) {
          if (typeof window !== "undefined") {
            const rateLimitKey = getRateLimitUntilStorageKey(normalizedEmail)
            window.localStorage.setItem(rateLimitKey, String(Date.now() + SERVER_RATE_LIMIT_COOLDOWN_SECONDS * 1000))
            setCooldownLeft(SERVER_RATE_LIMIT_COOLDOWN_SECONDS)
          }
          setError("Supabase bloqueo temporalmente el envio de emails por limite del proyecto. Espera cerca de 1 hora o activa SMTP propio en Supabase.")
          return
        }
        setError(authError.message)
        return
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem(pendingNameStorageKey, normalizedName)
        window.localStorage.setItem(pendingAccessCodeStorageKey, normalizedCode)
        window.localStorage.setItem(LAST_EMAIL_KEY, normalizedEmail)

        const cooldownKey = getCooldownStorageKey(normalizedEmail)
        window.localStorage.setItem(cooldownKey, String(Date.now()))
        setCooldownLeft(MAGIC_LINK_COOLDOWN_SECONDS)
      }

      setMessage("Te enviamos un enlace por email. Al abrirlo una vez, queda activado este codigo para futuros ingresos.")
    } finally {
      setSending(false)
    }
  }

  const handleCodeSignIn = async () => {
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedCode = accessCode.trim()

    if (!normalizedEmail || normalizedCode.length < MIN_ACCESS_CODE_LENGTH) {
      setError(`Ingresa tu email y un codigo de al menos ${MIN_ACCESS_CODE_LENGTH} caracteres.`)
      return
    }

    setError("")
    setMessage("")
    setSigningInWithCode(true)

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: normalizedCode,
      })

      if (authError) {
        setError("No se pudo entrar con ese codigo. Si todavia no lo activaste, pedi un enlace primero.")
        return
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem(LAST_EMAIL_KEY, normalizedEmail)
      }
      setMessage("Acceso confirmado con codigo.")
    } finally {
      setSigningInWithCode(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-[#d8e4f4] bg-white shadow-[0_8px_30px_rgba(25,79,145,.12)] p-6 sm:p-7">
        <h1 className="text-2xl font-bold text-[#214a79]">Acceso</h1>
        <p className="text-sm text-[#5c7699] mt-1">Ingresa con enlace una vez y despues usa tu codigo.</p>

        {loading || processingLink ? (
          <p className="mt-4 text-sm text-[#5c7699]">Cargando sesion...</p>
        ) : user ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-[#d8e4f4] bg-[#f6f9ff] px-4 py-3">
              <p className="text-sm text-[#3a5f8f]">Sesion activa como</p>
              <p className="text-base font-semibold text-[#214a79]">{displayName}</p>
              <p className="text-xs text-[#6a84a8]">{user.email}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={signOut}
                className="px-4 py-2 rounded-lg bg-[#1f67bf] text-white text-sm font-semibold hover:bg-[#1756a4] transition-colors"
              >
                Cerrar sesion
              </button>
              <Link
                href="/"
                className="px-4 py-2 rounded-lg border border-[#cddcf0] text-[#285887] text-sm font-semibold hover:bg-[#f6f9ff] transition-colors"
              >
                Ir al dashboard
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="mt-5 space-y-4">
            <div>
              <label htmlFor="fullName" className="text-sm font-semibold text-[#3a5f8f]">Nombre para mostrar</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Ej: Angel"
                className="mt-1 w-full rounded-lg border border-[#cddcf0] px-3 py-2 text-sm text-[#234876] outline-none focus:ring-2 focus:ring-[#77a6e0]"
              />
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-semibold text-[#3a5f8f]">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="tu@empresa.com"
                className="mt-1 w-full rounded-lg border border-[#cddcf0] px-3 py-2 text-sm text-[#234876] outline-none focus:ring-2 focus:ring-[#77a6e0]"
              />
            </div>

            <div>
              <label htmlFor="accessCode" className="text-sm font-semibold text-[#3a5f8f]">Codigo de acceso</label>
              <input
                id="accessCode"
                type="password"
                value={accessCode}
                onChange={(event) => setAccessCode(event.target.value)}
                required
                minLength={MIN_ACCESS_CODE_LENGTH}
                placeholder="Minimo 6 caracteres"
                className="mt-1 w-full rounded-lg border border-[#cddcf0] px-3 py-2 text-sm text-[#234876] outline-none focus:ring-2 focus:ring-[#77a6e0]"
              />
            </div>

            {message && <p className="text-sm text-[#1f7f48]">{message}</p>}
            {error && <p className="text-sm text-[#b84a4a]">{error}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCodeSignIn}
                disabled={signingInWithCode}
                className="w-full rounded-lg bg-[#1f67bf] text-white py-2.5 text-sm font-semibold hover:bg-[#1756a4] transition-colors disabled:opacity-70"
              >
                {signingInWithCode ? "Ingresando..." : "Entrar con codigo"}
              </button>
              <button
                type="submit"
                disabled={sending || cooldownLeft > 0}
                className="w-full rounded-lg border border-[#b9cbe4] text-[#285887] py-2.5 text-sm font-semibold hover:bg-[#f6f9ff] transition-colors disabled:opacity-70"
              >
                {sending
                  ? "Enviando..."
                  : cooldownLeft > 0
                    ? `Reenviar en ${cooldownLeft}s`
                    : "Activar por email"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
