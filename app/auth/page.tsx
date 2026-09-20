"use client"

import { useRouter } from "next/navigation"
import { FormEvent, useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthSession } from "@/lib/useAuthSession"

const LAST_EMAIL_KEY = "powercool.auth.lastEmail"
const MAGIC_LINK_COOLDOWN_SECONDS = 60
const SERVER_RATE_LIMIT_COOLDOWN_SECONDS = 60 * 60
const MIN_ACCESS_CODE_LENGTH = 8

function Snowflake({ className = "" }: { className?: string }) {
  return <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 2v20M4.1 6l15.8 12M4.1 18 19.9 6M2 12h20M7 3.3l10 17.4M17 3.3 7 20.7" /></svg>
}

function FieldIcon({ name, className = "" }: { name: "email" | "key"; className?: string }) {
  const path = name === "email"
    ? <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>
    : <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>
  return <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">{path}</svg>
}

function ShieldIcon({ className = "" }: { className?: string }) {
  return <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3 5 6v5c0 4.5 2.8 8 7 10 4.2-2 7-5.5 7-10V6l-7-3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="m9.5 12 1.7 1.7 3.4-3.4" /></svg>
}

function getCooldownStorageKey(email: string) {
  const normalizedEmail = String(email || "").trim().toLowerCase()
  return `powercool.auth.lastMagicLinkAt:${normalizedEmail || "anon"}`
}

function getRateLimitUntilStorageKey(email: string) {
  const normalizedEmail = String(email || "").trim().toLowerCase()
  return `powercool.auth.rateLimitUntil:${normalizedEmail || "anon"}`
}

function Brand() {
  return <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-[#1463d8] text-white shadow-sm shadow-blue-950/30"><Snowflake className="h-6 w-6" /></span><span><strong className="block text-lg font-semibold tracking-[-.035em] text-white">PowerCool</strong><span className="block text-xs text-slate-300">Gestión técnica</span></span></div>
}

const inputClass = "w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"

export default function AuthPage() {
  const router = useRouter()
  const { loading, user } = useAuthSession()
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
  const [activationFromLink, setActivationFromLink] = useState(false)

  const syncPendingIdentity = useCallback(async (activeUser: { id: string; email?: string; user_metadata?: { full_name?: string; name?: string } } | null | undefined) => {
    if (!activeUser?.id || !activeUser?.email || typeof window === "undefined") return { codeActivated: false }

    const normalizedEmail = String(activeUser.email).trim().toLowerCase()
    const preferredName = activeUser.user_metadata?.full_name?.trim() || activeUser.user_metadata?.name?.trim() || ""

    if (preferredName) {
      const { error: profileError } = await supabase.from("profiles").update({ full_name: preferredName }).eq("id", activeUser.id)
      if (profileError) return { codeActivated: false, error: profileError.message || "No se pudo guardar el nombre del perfil." }
    }

    window.localStorage.setItem(LAST_EMAIL_KEY, normalizedEmail)
    return { codeActivated: false }
  }, [])

  useEffect(() => {
    const savedEmail = window.localStorage.getItem(LAST_EMAIL_KEY)
    if (savedEmail) setEmail(savedEmail)
    setActivationFromLink(new URLSearchParams(window.location.search).get("activation") === "1")
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
          const isActivationLink = new URLSearchParams(window.location.search).get("activation") === "1"
          if (result.error) setError(result.error)
          else if (!isActivationLink) router.replace("/")
          window.history.replaceState({}, document.title, isActivationLink ? "/auth?activation=1" : "/auth")
          setActivationFromLink(isActivationLink)
        }
      } finally { setProcessingLink(false) }
    }
    void hydrateSessionFromHash()
  }, [activationFromLink, router, syncPendingIdentity])

  useEffect(() => {
    void syncPendingIdentity(user).then((result) => {
      if (result.error) setError(result.error)
    })
  }, [syncPendingIdentity, user])

  useEffect(() => {
    if (!loading && user && !processingLink && !activationFromLink) router.replace("/")
  }, [activationFromLink, loading, processingLink, router, user])

  const handleMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedName = fullName.trim()
    if (!normalizedName || !normalizedEmail) {
      setError("Completa tu nombre y correo electrónico.")
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
      const { error: authError } = await supabase.auth.signInWithOtp({ email: normalizedEmail, options: { shouldCreateUser: false, emailRedirectTo: `${baseUrl.replace(/\/$/, "")}/auth?activation=1`, data: { full_name: normalizedName } } })
      if (authError) {
        if (authError.status === 429 || /rate limit|too many/i.test(String(authError.message || ""))) {
          window.localStorage.setItem(getRateLimitUntilStorageKey(normalizedEmail), String(Date.now() + SERVER_RATE_LIMIT_COOLDOWN_SECONDS * 1000))
          setCooldownLeft(SERVER_RATE_LIMIT_COOLDOWN_SECONDS)
          setError("Supabase bloqueó temporalmente el envío de emails. Intenta nuevamente dentro de una hora.")
        } else setError(authError.message)
        return
      }
      window.localStorage.setItem(LAST_EMAIL_KEY, normalizedEmail)
      window.localStorage.setItem(getCooldownStorageKey(normalizedEmail), String(Date.now()))
      setCooldownLeft(MAGIC_LINK_COOLDOWN_SECONDS)
      setMessage("Revisa tu correo y abre el enlace. Allí podrás definir tu código personal.")
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
      router.replace("/")
    } finally { setSigningInWithCode(false) }
  }

  const handleSetAccessCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedCode = accessCode.trim()
    if (normalizedCode.length < MIN_ACCESS_CODE_LENGTH) {
      setError(`El código debe tener al menos ${MIN_ACCESS_CODE_LENGTH} caracteres.`)
      return
    }
    setError(""); setMessage(""); setSigningInWithCode(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: normalizedCode })
      if (updateError) {
        setError(updateError.message || "No se pudo guardar el código de acceso.")
        return
      }
      window.localStorage.setItem(LAST_EMAIL_KEY, user?.email || email.trim().toLowerCase())
      router.replace("/")
    } finally { setSigningInWithCode(false) }
  }

  const emailInput = <div><label htmlFor="email" className="text-sm font-medium text-slate-800">Correo electrónico</label><div className="relative mt-2"><FieldIcon name="email" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="tu@empresa.com" className={inputClass} /></div></div>
  const codeInput = <div><div className="flex items-center justify-between gap-3"><label htmlFor="accessCode" className="text-sm font-medium text-slate-800">Código de acceso</label><button type="button" onClick={() => setShowAccessCode((visible) => !visible)} className="text-xs font-medium text-blue-700 underline-offset-4 hover:text-blue-800 hover:underline">{showAccessCode ? "Ocultar" : "Mostrar"}</button></div><div className="relative mt-2"><FieldIcon name="key" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id="accessCode" type={showAccessCode ? "text" : "password"} value={accessCode} onChange={(event) => setAccessCode(event.target.value)} required minLength={MIN_ACCESS_CODE_LENGTH} autoComplete="current-password" placeholder="Tu código personal" className={inputClass} /></div></div>
  const activationRequestForm = <form onSubmit={handleMagicLink} className="mt-8 space-y-5"><div><label htmlFor="fullName" className="text-sm font-medium text-slate-800">Nombre para mostrar</label><input id="fullName" type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Ej.: Ángel" autoComplete="name" className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100" /></div>{emailInput}<Status message={message} error={error} /><p className="text-xs leading-5 text-slate-500">El acceso debe haber sido creado por un administrador. Te enviaremos un enlace único para elegir tu código.</p><button type="submit" disabled={sending || cooldownLeft > 0} className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#1463d8] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0f56bd] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">{sending ? "Enviando…" : cooldownLeft > 0 ? `Reenviar en ${cooldownLeft}s` : "Recibir enlace de activación"}</button><button type="button" onClick={() => { setActivationMode(false); setError(""); setMessage("") }} className="w-full py-1 text-sm font-medium text-slate-600 underline-offset-4 hover:text-blue-700 hover:underline">Volver al inicio de sesión</button></form>
  const activationCodeForm = <form onSubmit={handleSetAccessCode} className="mt-8 space-y-5">{codeInput}<Status message={message} error={error} /><p className="text-xs leading-5 text-slate-500">Usa al menos {MIN_ACCESS_CODE_LENGTH} caracteres. Este código solo se envía a Supabase al guardarlo.</p><button type="submit" disabled={signingInWithCode} className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#1463d8] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0f56bd] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">{signingInWithCode ? "Guardando…" : "Guardar código y continuar"}</button></form>
  const signInForm = <form onSubmit={handleCodeSignIn} className="mt-8 space-y-5">{emailInput}{codeInput}<Status message={message} error={error} /><button type="submit" disabled={signingInWithCode} className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#1463d8] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0f56bd] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">{signingInWithCode ? "Ingresando…" : "Ingresar"}</button><div className="flex items-center gap-3 pt-1 text-xs text-slate-500"><span className="h-px flex-1 bg-slate-200" />¿Es tu primer acceso?<span className="h-px flex-1 bg-slate-200" /></div><button type="button" onClick={() => { setActivationMode(true); setError(""); setMessage("") }} className="w-full py-1 text-sm font-medium text-blue-700 underline-offset-4 hover:text-blue-800 hover:underline">Activar acceso por email</button></form>
  const formContent = loading || processingLink ? <p className="py-14 text-center text-sm text-slate-500">Validando sesión…</p> : user && activationFromLink ? activationCodeForm : user ? <p className="py-14 text-center text-sm text-slate-500">Redirigiendo al Panel…</p> : activationMode ? activationRequestForm : signInForm

  return <div className="min-h-dvh bg-white lg:grid lg:grid-cols-[minmax(360px,42%)_1fr]">
    <aside className="relative hidden min-h-dvh overflow-hidden bg-[#061426] text-white lg:flex lg:flex-col" style={{ backgroundImage: "linear-gradient(180deg,rgba(3,16,32,.26),rgba(3,17,34,.68)),url('/sidebar-mountains.png')", backgroundPosition: "center", backgroundSize: "cover" }}>
      <div className="relative z-10 p-10 xl:p-14"><Brand /></div>
      <div className="relative z-10 mt-auto border-t border-white/15 px-10 py-7 text-xs text-slate-300 xl:px-14"><span className="inline-flex items-center gap-2"><ShieldIcon className="h-4 w-4 text-blue-300" /> Acceso interno protegido</span></div>
    </aside>
    <main className="flex min-h-dvh flex-col bg-white lg:bg-[var(--pc-canvas)]">
      <div className="relative min-h-40 overflow-hidden bg-[#061426] px-6 py-7 sm:min-h-48 sm:px-10 lg:hidden" style={{ backgroundImage: "linear-gradient(90deg,rgba(3,16,32,.48),rgba(3,17,34,.8)),url('/sidebar-mountains.png')", backgroundPosition: "center 58%", backgroundSize: "cover" }}><Brand /></div>
      <div className="flex flex-1 items-start justify-center px-6 py-10 sm:px-10 sm:py-14 lg:items-center lg:px-12 xl:px-20">
        <section className="w-full max-w-[400px]" aria-labelledby="auth-title">
          <header><p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">PowerCool</p><h1 id="auth-title" className="mt-3 text-2xl font-semibold tracking-[-.035em] text-slate-950 sm:text-[28px]">{activationFromLink ? "Define tu código" : activationMode ? "Activar acceso" : "Iniciar sesión"}</h1><p className="mt-2 text-sm leading-6 text-slate-500">{activationFromLink ? "Elige un código personal para tus próximos accesos." : activationMode ? "Solicita tu enlace de activación si tu cuenta ya fue creada." : "Ingresa con tu correo y código personal."}</p></header>
          {formContent}
          <p className="mt-10 text-center text-xs text-slate-400">Acceso interno · PowerCool</p>
        </section>
      </div>
    </main>
  </div>
}

function Status({ message, error }: { message: string; error: string }) {
  if (message) return <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm leading-5 text-emerald-800">{message}</p>
  if (error) return <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm leading-5 text-red-800">{error}</p>
  return null
}
