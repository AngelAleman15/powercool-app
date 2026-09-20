"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getDefaultPermissions } from "@/lib/roleAccess"
import { useAuthSession } from "@/lib/useAuthSession"

type RoleKey = "admin" | "owner" | "tecnico" | "visor"
type ModuleKey = "dashboard" | "clientes" | "equipos" | "tramites" | "repuestos" | "admin"

type ProfileRow = {
  id: string
  email: string | null
  full_name: string | null
  role: RoleKey
}

type PermissionRow = {
  role: RoleKey
  module: ModuleKey
  can_access: boolean
}

const ROLE_OPTIONS: Array<{ value: RoleKey; label: string }> = [
  { value: "admin", label: "Admin" },
  { value: "owner", label: "Owner" },
  { value: "tecnico", label: "Técnico" },
  { value: "visor", label: "Visor" },
]

const MODULES: Array<{ key: ModuleKey; label: string; description: string }> = [
  { key: "dashboard", label: "Dashboard", description: "Inicio y resumen" },
  { key: "clientes", label: "Clientes", description: "Listado y detalle" },
  { key: "equipos", label: "Equipos", description: "Inventario y detalle" },
  { key: "tramites", label: "Trámites", description: "Mantenimientos y abonos" },
  { key: "repuestos", label: "Repuestos", description: "Stock y movimientos" },
  { key: "admin", label: "Admin", description: "Panel de roles" },
]

function buildPermissionMap(rows: PermissionRow[], role: RoleKey) {
  const defaults = getDefaultPermissions(role) as Record<ModuleKey, boolean>
  const next = { ...defaults }

  rows.forEach((row) => {
    if (row.role === role) {
      next[row.module] = !!row.can_access
    }
  })

  return next
}

export default function AdminPage() {
  const { role: currentRole, loading: authLoading } = useAuthSession()
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [permissionsRows, setPermissionsRows] = useState<PermissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const canEditAdminRole = currentRole === "admin"
  const canManageRoles = currentRole === "admin" || currentRole === "owner"

  const loadAdminData = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const [profilesRes, permissionsRes] = await Promise.all([
        supabase.from("profiles").select("id, email, full_name, role").order("full_name", { ascending: true }),
        supabase.from("role_permissions").select("role, module, can_access").order("role", { ascending: true }),
      ])

      if (profilesRes.error) {
        throw profilesRes.error
      }

      if (permissionsRes.error) {
        throw permissionsRes.error
      }

      setProfiles((profilesRes.data || []) as ProfileRow[])
      setPermissionsRows((permissionsRes.data || []) as PermissionRow[])
    } catch (loadError) {
      console.error("No se pudo cargar el panel de admin", loadError)
      setProfiles([])
      setPermissionsRows([])
      setError("No se pudo cargar el panel de administración.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAdminData()
  }, [loadAdminData])

  const roleSummary = useMemo(() => {
    const counts = profiles.reduce<Record<RoleKey, number>>(
      (acc, profile) => {
        acc[profile.role] = (acc[profile.role] || 0) + 1
        return acc
      },
      { admin: 0, owner: 0, tecnico: 0, visor: 0 }
    )

    return counts
  }, [profiles])

  const updateRole = useCallback(
    async (profileId: string, nextRole: RoleKey) => {
      if (!canManageRoles) return
      if (nextRole === "admin" && !canEditAdminRole) {
        setError("Solo un admin puede asignar el rol admin.")
        return
      }

      setSavingId(profileId)
      setError("")
      setMessage("")

      try {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ role: nextRole })
          .eq("id", profileId)

        if (updateError) {
          throw updateError
        }

        setMessage(`Rol actualizado a ${nextRole}.`)
        await loadAdminData()
      } catch (updateError) {
        console.error("No se pudo actualizar el rol", updateError)
        setError("No se pudo actualizar el rol.")
      } finally {
        setSavingId(null)
      }
    },
    [canEditAdminRole, canManageRoles, loadAdminData]
  )

  const updatePermission = useCallback(
    async (role: RoleKey, module: ModuleKey, canAccess: boolean) => {
      if (!canManageRoles) return
      if (role === "admin" && !canEditAdminRole) {
        setError("No puedes cambiar los permisos del rol admin.")
        return
      }

      setSavingId(role)
      setError("")
      setMessage("")

      try {
        const { error: updateError } = await supabase.from("role_permissions").upsert(
          {
            role,
            module,
            can_access: canAccess,
          },
          { onConflict: "role,module" }
        )

        if (updateError) {
          throw updateError
        }

        setMessage(`Permiso actualizado: ${role} / ${module}.`)
        await loadAdminData()
      } catch (updateError) {
        console.error("No se pudo actualizar el permiso", updateError)
        setError("No se pudo actualizar el permiso del módulo.")
      } finally {
        setSavingId(null)
      }
    },
    [canEditAdminRole, canManageRoles, loadAdminData]
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 text-slate-900 sm:px-6 sm:py-8 lg:px-8">
      <div className="space-y-5">
        <section className="border-b border-slate-200 pb-6 sm:pb-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Administración</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-[-.04em] text-slate-950 sm:text-3xl">Roles y permisos por módulo</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Admin y owner pueden cambiar roles y activar o desactivar módulos por usuario. El rol visor queda con acceso base al dashboard y equipos.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">Admin: {roleSummary.admin}</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">Owner: {roleSummary.owner}</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">Técnico: {roleSummary.tecnico}</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">Visor: {roleSummary.visor}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link href="/" className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100">
              Volver al inicio
            </Link>
            <Link href="/auth" className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100">
              Cambiar sesión
            </Link>
          </div>
        </section>

        {(message || error) && (
          <section className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-[#f0c9c9] bg-[#fff4f4] text-[#8c3f3f]" : "border-[#cfe8d6] bg-[#f2fbf5] text-[#2f7d4a]"}`}>
            {error || message}
          </section>
        )}

        {authLoading || loading ? (
          <section className="rounded-xl border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500">
            Cargando panel de administración...
          </section>
        ) : profiles.length === 0 ? (
          <section className="rounded-xl border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500">
            No hay usuarios para mostrar.
          </section>
        ) : (
          <section className="space-y-4">
            {profiles.map((profile) => {
              const permissionMap = buildPermissionMap(permissionsRows, profile.role)
              const canEditAdminRow = canEditAdminRole || profile.role !== "admin"
              const isLockedForOwner = currentRole === "owner" && profile.role === "admin"

              return (
                <article key={profile.id} className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-lg font-semibold text-slate-950">{profile.full_name || "Sin nombre"}</h2>
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{profile.role}</span>
                      </div>
                      <p className="mt-1 break-all text-sm text-slate-500">{profile.email || "Sin email"}</p>
                    </div>

                    <div className="w-full max-w-xs">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rol</label>
                      <select
                        value={profile.role}
                        onChange={(event) => updateRole(profile.id, event.target.value as RoleKey)}
                        disabled={!canManageRoles || (currentRole === "owner" && profile.role === "admin")}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
                      >
                        {ROLE_OPTIONS.filter((option) => canEditAdminRole || option.value !== "admin").map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {MODULES.map((module) => {
                      const enabled = !!permissionMap[module.key]
                      const disabled = !canManageRoles || isLockedForOwner || (module.key === "admin" && !canEditAdminRow)

                      return (
                        <button
                          key={module.key}
                          type="button"
                          onClick={() => updatePermission(profile.role, module.key, !enabled)}
                          disabled={disabled || savingId === profile.role}
                          className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${enabled ? "border-blue-200 bg-blue-50/50" : "border-slate-200 bg-white"} ${disabled ? "cursor-not-allowed opacity-60" : "hover:border-slate-300 hover:bg-slate-50"}`}
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{module.label}</p>
                            <p className="text-xs text-slate-500">{module.description}</p>
                          </div>
                          <span
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? "bg-blue-600" : "bg-slate-300"}`}
                            aria-hidden="true"
                          >
                            <span
                              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-1"}`}
                            />
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </article>
              )
            })}
          </section>
        )}
      </div>
    </div>
  )
}
