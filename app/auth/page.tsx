"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthSession } from "@/lib/useAuthSession"

export default function AuthPage() {
  const { loading, user, displayName, signOut } = useAuthSession()
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const handleMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setMessage("")
    setSending(true)

    try {
      const configuredAppUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim()
      const runtimeOrigin = typeof window !== "undefined" ? window.location.origin : ""
      const baseUrl = configuredAppUrl || runtimeOrigin
      const redirectTo = baseUrl ? `${baseUrl.replace(/\/$/, "")}/auth` : undefined

      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
          data: fullName.trim() ? { full_name: fullName.trim() } : undefined,
        },
      })

      if (authError) {
        setError(authError.message)
        return
      }

      setMessage("Te enviamos un enlace de acceso por email. Si ya iniciaste sesión antes, quedará persistida hasta que cierres sesión.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-[#d8e4f4] bg-white shadow-[0_8px_30px_rgba(25,79,145,.12)] p-6 sm:p-7">
        <h1 className="text-2xl font-bold text-[#214a79]">Acceso</h1>
        <p className="text-sm text-[#5c7699] mt-1">Ingresar con enlace magico de Supabase Auth.</p>

        {loading ? (
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
              <label htmlFor="fullName" className="text-sm font-semibold text-[#3a5f8f]">Nombre (opcional)</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej: Angela Aleman"
                className="mt-1 w-full rounded-lg border border-[#cddcf0] px-3 py-2 text-sm text-[#234876] outline-none focus:ring-2 focus:ring-[#77a6e0]"
              />
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-semibold text-[#3a5f8f]">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@empresa.com"
                className="mt-1 w-full rounded-lg border border-[#cddcf0] px-3 py-2 text-sm text-[#234876] outline-none focus:ring-2 focus:ring-[#77a6e0]"
              />
            </div>

            {message && <p className="text-sm text-[#1f7f48]">{message}</p>}
            {error && <p className="text-sm text-[#b84a4a]">{error}</p>}

            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-lg bg-[#1f67bf] text-white py-2.5 text-sm font-semibold hover:bg-[#1756a4] transition-colors disabled:opacity-70"
            >
              {sending ? "Enviando..." : "Enviar enlace de acceso"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
