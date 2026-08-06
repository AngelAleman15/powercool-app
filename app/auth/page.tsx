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

function Snowflake({ className = "" }: { className?: string }) {
  return <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 2v20M4.1 6l15.8 12M4.1 18 19.9 6M2 12h20M7 3.3l10 17.4M17 3.3 7 20.7" /></svg>
}

function FieldIcon({ name, className = "" }: { name: "email" | "key"; className?: string }) {
  const path = name === "email"
    ? <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>
    : <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>
  return <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">{path}</svg>
}

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
  const [activationMode, setActivationMode] = useState(false)
  const [showAccessCode, setShowAccessCode] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const pendingNameStorageKey = useMemo(() => getEmailScopedKey(PENDING_NAME_KEY, email), [email])
  const pendingAccessCodeStorageKey = useMemo(() => getEmailScopedKey(PENDING_ACCESS_CODE_KEY, email), [email])

  const syncPendingIdentity = useCallback(async (activeUser: { id: string; email?: string } | null | undefined) => {
    if (!activeUser?.id || !activeUser?.email || typeof window === "undefined") return { codeActivated: false }

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
      if (updateUserError) return { codeActivated: false, error: updateUserError.message || "No se pudo activar el código de acceso." }
    }

    if (preferredName) {
      const { error: profileError } = await supabase.from("profiles").update({ full_name: preferredName }).eq("id", activeUser.id)
      if (profileError) return { codeActivated: Boolean(authUpdate.password), error: profileError.message || "El código se activó, pero no se pudo guardar el nombre." }
    }

    window.localStorage.setItem(LAST_EMAIL_KEY, normalizedEmail)
    window.localStorage.removeItem(nameKey)
    window.localStorage.removeItem(codeKey)
    return { codeActivated: Boolean(authUpdate.password) }
  }, [])

  useEffect(() => {
    const savedEmail = window.localStorage.getItem(LAST_EMAIL_KEY)
    if (savedEmail) setEmail(savedEmail)
  }, [])

  useEffect(() => {
    const syncCooldown = () => {
      const lastSentAt = Number(window.localStorage.getItem(getCooldownStorageKey(email)) || 0)
      const rateLimitUntil = Number(window.localStorage.getItem(getRateLimitUntilStorageKey(email)) || 0)
      const rateLimitLeft = Math.max(0, Math.ceil((rateLimitUntil - Date.now()) / 1000))
      const magicLinkLeft = Math.max(0, MAGIC_LINK_COOLDOWN_SECONDS - Math.floor((Date.now() - lastSentAt) / 1000))
      setCooldownLeft(Math.max(rateLimitLeft, magicLinkLeft))
    }
    syncCooldown()
    const timer = window.setInterval(syncCooldown, 1000)
    return () => window.clearInterval(timer)
  }, [email])

  useEffect(() => {
    const hydrateSessionFromHash = async () => {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ""))
      const accessToken = params.get("access_token")
      const refreshToken = params.get("refresh_token")
      if (!accessToken || !refreshToken) return

      setProcessingLink(true)
      try {
        const { data, error: setSessionError } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        if (setSessionError) setError(setSessionError.message || "No se pudo validar el enlace de acceso.")
        else {
          const result = await syncPendingIdentity(data.session?.user)
          if (result.error) setError(result.error)
          else setMessage(result.codeActivated ? "Acceso activado: podrás entrar con tu código en adelante." : "Acceso confirmado.")
          window.history.replaceState({}, document.title, "/auth")
        }
      } finally { setProcessingLink(false) }
    }
    void hydrateSessionFromHash()
  }, [syncPendingIdentity])

  useEffect(() => {
    void syncPendingIdentity(user).then((result) => {
      if (result.error) setError(result.error)
    })
  }, [syncPendingIdentity, user])

  const handleMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedName = fullName.trim()
    const normalizedCode = accessCode.trim()
    if (!normalizedName || !normalizedEmail || normalizedCode.length < MIN_ACCESS_CODE_LENGTH) {
      setError(`Completa tu nombre, correo y un código de al menos ${MIN_ACCESS_CODE_LENGTH} caracteres.`)
      return
    }
    if (cooldownLeft > 0) {
      setError(cooldownLeft > MAGIC_LINK_COOLDOWN_SECONDS ? "Supabase limitó temporalmente los correos. Intenta nuevamente más tarde." : `Espera ${cooldownLeft}s antes de pedir otro enlace.`)
      return
    }

    setError(""); setMessage(""); setSending(true)
    try {
      const configuredAppUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim()
      const baseUrl = configuredAppUrl || window.location.origin
      const { error: authError } = await supabase.auth.signInWithOtp({ email: normalizedEmail, options: { emailRedirectTo: `${baseUrl.replace(/\/$/, "")}/auth`, data: { full_name: normalizedName } } })
      if (authError) {
        if (authError.status === 429 || /rate limit|too many/i.test(String(authError.message || ""))) {
          window.localStorage.setItem(getRateLimitUntilStorageKey(normalizedEmail), String(Date.now() + SERVER_RATE_LIMIT_COOLDOWN_SECONDS * 1000))
          setCooldownLeft(SERVER_RATE_LIMIT_COOLDOWN_SECONDS)
          setError("Supabase bloqueó temporalmente el envío de emails. Intenta nuevamente dentro de una hora.")
        } else setError(authError.message)
        return
      }
      window.localStorage.setItem(pendingNameStorageKey, normalizedName)
      window.localStorage.setItem(pendingAccessCodeStorageKey, normalizedCode)
      window.localStorage.setItem(LAST_EMAIL_KEY, normalizedEmail)
      window.localStorage.setItem(getCooldownStorageKey(normalizedEmail), String(Date.now()))
      setCooldownLeft(MAGIC_LINK_COOLDOWN_SECONDS)
      setMessage("Revisa tu correo y abre el enlace una vez. Después podrás usar solamente tu email y código.")
    } finally { setSending(false) }
  }

  const handleCodeSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedCode = accessCode.trim()
    if (!normalizedEmail || normalizedCode.length < MIN_ACCESS_CODE_LENGTH) {
      setError(`Ingresa tu email y un código de al menos ${MIN_ACCESS_CODE_LENGTH} caracteres.`)
      return
    }
    setError(""); setMessage(""); setSigningInWithCode(true)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password: normalizedCode })
      if (authError) {
        setError("No se pudo entrar con ese código. Si es tu primer acceso, actívalo por email.")
        return
      }
      window.localStorage.setItem(LAST_EMAIL_KEY, normalizedEmail)
      setMessage("Acceso confirmado.")
    } finally { setSigningInWithCode(false) }
  }

  const emailInput = <div><label htmlFor="email" className="text-[13px] font-semibold text-slate-800">Correo electrónico</label><div className="relative mt-2"><FieldIcon name="email" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="tu@empresa.com" className="w-full rounded-lg border border-slate-300 py-2.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></div></div>
  const codeInput = <div><div className="flex items-center justify-between gap-3"><label htmlFor="accessCode" className="text-[13px] font-semibold text-slate-800">Código de acceso</label><button type="button" onClick={() => setShowAccessCode((visible) => !visible)} className="text-[11px] font-semibold text-blue-700 hover:text-blue-800">{showAccessCode ? "Ocultar" : "Mostrar"}</button></div><div className="relative mt-2"><FieldIcon name="key" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id="accessCode" type={showAccessCode ? "text" : "password"} value={accessCode} onChange={(event) => setAccessCode(event.target.value)} required minLength={MIN_ACCESS_CODE_LENGTH} autoComplete="current-password" placeholder="Tu código personal" className="w-full rounded-lg border border-slate-300 py-2.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></div></div>

  return <div className="min-h-screen w-full bg-[radial-gradient(circle_at_1px_1px,#d8e4f4_1px,transparent_1px)] bg-[size:16px_16px] md:ml-[-280px] md:w-[calc(100%+280px)] lg:grid lg:grid-cols-[minmax(420px,37%)_1fr]">
    <aside className="relative hidden min-h-screen overflow-hidden bg-[#061426] px-[72px] py-14 text-white lg:flex lg:flex-col" style={{ backgroundImage: "linear-gradient(180deg,rgba(3,16,32,.54),rgba(4,24,49,.28),rgba(3,17,34,.72)),url('/sidebar-mountains.png')", backgroundPosition: "center", backgroundSize: "cover" }}>
      <div className="flex items-center gap-5"><div className="grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br from-[#2784ff] to-[#0958c9] shadow-[0_10px_22px_rgba(8,94,205,.32)]"><Snowflake className="h-8 w-8" /></div><div><p className="text-[25px] font-bold tracking-[-.04em]">ClimaControl</p><p className="mt-0.5 text-sm text-slate-200">Gestión técnica</p></div></div>
      <div className="relative z-10 mt-20 max-w-[22rem]"><h1 className="text-[27px] font-bold leading-[1.42] tracking-[-.04em]">Gestiona tus equipos, clientes y mantenimientos de forma <span className="text-blue-300">simple y eficiente.</span></h1><div className="mt-10 space-y-6 text-slate-100"><div className="flex gap-5"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-500/25 text-lg text-blue-100">▧</span><div><p className="font-semibold">Control total</p><p className="mt-1.5 text-sm leading-6 text-slate-100">Monitorea todos tus equipos y servicios en tiempo real.</p></div></div><div className="flex gap-5"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-400/20 text-lg text-emerald-200">⌕</span><div><p className="font-semibold">Mantenimientos al día</p><p className="mt-1.5 text-sm leading-6 text-slate-100">Recibe alertas y evita fallos inesperados.</p></div></div><div className="flex gap-5"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-violet-400/20 text-lg text-violet-200">▥</span><div><p className="font-semibold">Reportes inteligentes</p><p className="mt-1.5 text-sm leading-6 text-slate-100">Toma mejores decisiones con datos claros y precisos.</p></div></div></div></div>
      <p className="mt-auto flex items-center gap-3 text-sm text-slate-200"><span className="grid h-8 w-8 place-items-center rounded-full border border-blue-400/60 text-blue-300">♢</span>Tus datos están protegidos</p>
    </aside>

    <main className="flex min-h-screen items-center justify-center p-6 sm:p-10 lg:items-start xl:p-14"><div className="min-h-[565px] w-full max-w-[510px] rounded-2xl border border-slate-200 bg-white px-7 py-11 shadow-[0_20px_55px_rgba(15,42,82,.10)] sm:px-10 sm:py-11"><div className="mx-auto grid h-17 w-17 place-items-center rounded-2xl bg-gradient-to-br from-[#2784ff] to-[#0958c9] text-white shadow-[0_12px_26px_rgba(8,94,205,.28)]"><Snowflake className="h-10 w-10" /></div><div className="mt-7 text-center"><h2 className="text-[28px] font-bold tracking-[-.045em] text-slate-900">{activationMode ? "Activa tu acceso" : "Bienvenido de nuevo"}</h2><p className="mt-2 text-[15px] text-slate-500">{activationMode ? "Configura tu código una sola vez" : "Ingresa con tu email y código personal"}</p></div>
      {loading || processingLink ? <p className="mt-11 text-center text-sm text-slate-500">Validando sesión…</p> : user ? <div className="mt-11 space-y-5"><div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4"><p className="text-sm text-slate-600">Sesión activa como</p><p className="mt-1 font-bold text-slate-900">{displayName}</p><p className="text-sm text-slate-500">{user.email}</p></div><div className="flex flex-wrap gap-3"><button type="button" onClick={signOut} className="rounded-lg bg-blue-600 px-5 py-3 text-[13px] font-semibold text-white hover:bg-blue-700">Cerrar sesión</button><Link href="/" className="rounded-lg border border-slate-200 px-5 py-3 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">Ir al Panel</Link></div></div> : activationMode ? <form onSubmit={handleMagicLink} className="mt-11 space-y-8"><div><label htmlFor="fullName" className="text-[13px] font-semibold text-slate-800">Nombre para mostrar</label><input id="fullName" type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Ej: Ángel" autoComplete="name" className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></div>{emailInput}{codeInput}<Status message={message} error={error} /><button type="submit" disabled={sending || cooldownLeft > 0} className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(37,99,235,.18)] transition hover:from-blue-700 hover:to-blue-800 disabled:opacity-70">{sending ? "Enviando…" : cooldownLeft > 0 ? `Reenviar en ${cooldownLeft}s` : "Recibir enlace de activación"}</button><button type="button" onClick={() => { setActivationMode(false); setError(""); setMessage("") }} className="w-full text-[13px] font-semibold text-slate-500 hover:text-blue-700">Ya tengo un código</button></form> : <form onSubmit={handleCodeSignIn} className="mt-11 space-y-8">{emailInput}{codeInput}<Status message={message} error={error} /><button type="submit" disabled={signingInWithCode} className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(37,99,235,.18)] transition hover:from-blue-700 hover:to-blue-800 disabled:opacity-70">{signingInWithCode ? "Ingresando…" : "Iniciar sesión"}</button><div className="flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200" />¿Primera vez? <span className="h-px flex-1 bg-slate-200" /></div><button type="button" onClick={() => { setActivationMode(true); setError(""); setMessage("") }} className="w-full rounded-lg border border-slate-200 px-5 py-2.5 text-[13px] font-semibold text-blue-700 transition hover:bg-blue-50">Activar mi acceso por email</button></form>}</div></main>
  </div>
}

function Status({ message, error }: { message: string; error: string }) {
  if (message) return <p role="status" className="rounded-lg bg-emerald-50 px-4 py-2.5 text-[13px] text-emerald-700">{message}</p>
  if (error) return <p role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-[13px] text-red-700">{error}</p>
  return null
}
