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
    <div className="px-3 sm:px-6 lg:px-12 py-6 sm:py-8 text-[#223f66]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-[#d1dcec] bg-[linear-gradient(135deg,#f8fbff_0%,#eef5ff_100%)] p-5 sm:p-6 shadow-[0_8px_26px_rgba(36,84,145,.10)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6280a5]">Panel de administración</p>
              <h1 className="mt-1 text-2xl sm:text-4xl font-bold text-[#214a79]">Roles y permisos por módulo</h1>
              <p className="mt-2 text-sm sm:text-base text-[#5c7699] max-w-3xl">
                Admin y owner pueden cambiar roles y activar o desactivar módulos por usuario. El rol visor queda con acceso base al dashboard y equipos.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-full border border-[#d8e4f4] bg-white px-3 py-1 text-[#2d5c91]">Admin: {roleSummary.admin}</span>
              <span className="rounded-full border border-[#d8e4f4] bg-white px-3 py-1 text-[#2d5c91]">Owner: {roleSummary.owner}</span>
              <span className="rounded-full border border-[#d8e4f4] bg-white px-3 py-1 text-[#2d5c91]">Técnico: {roleSummary.tecnico}</span>
              <span className="rounded-full border border-[#d8e4f4] bg-white px-3 py-1 text-[#2d5c91]">Visor: {roleSummary.visor}</span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/" className="rounded-lg bg-[#1f67bf] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1756a4] transition-colors">
              Volver al inicio
            </Link>
            <Link href="/auth" className="rounded-lg border border-[#cddcf0] px-4 py-2 text-sm font-semibold text-[#285887] hover:bg-[#f6f9ff] transition-colors">
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
          <section className="rounded-xl border border-[#d1dcec] bg-white px-5 py-8 text-center text-[#5c7699] shadow-[0_8px_26px_rgba(36,84,145,.08)]">
            Cargando panel de administración...
          </section>
        ) : profiles.length === 0 ? (
          <section className="rounded-xl border border-[#d1dcec] bg-white px-5 py-8 text-center text-[#5c7699] shadow-[0_8px_26px_rgba(36,84,145,.08)]">
            No hay usuarios para mostrar.
          </section>
        ) : (
          <section className="space-y-4">
            {profiles.map((profile) => {
              const permissionMap = buildPermissionMap(permissionsRows, profile.role)
              const canEditAdminRow = canEditAdminRole || profile.role !== "admin"
              const isLockedForOwner = currentRole === "owner" && profile.role === "admin"

              return (
                <article key={profile.id} className="rounded-2xl border border-[#d1dcec] bg-white p-4 sm:p-5 shadow-[0_8px_26px_rgba(36,84,145,.08)]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-[#284a76] truncate">{profile.full_name || "Sin nombre"}</h2>
                        <span className="rounded-full bg-[#edf4ff] px-2.5 py-1 text-xs font-semibold text-[#1f6bc1]">{profile.role}</span>
                      </div>
                      <p className="mt-1 text-sm text-[#6b84a5] break-all">{profile.email || "Sin email"}</p>
                      <p className="mt-2 text-xs text-[#7a90ad]">{profile.id}</p>
                    </div>

                    <div className="w-full max-w-xs">
                      <label className="text-xs font-semibold uppercase tracking-wide text-[#6280a5]">Rol</label>
                      <select
                        value={profile.role}
                        onChange={(event) => updateRole(profile.id, event.target.value as RoleKey)}
                        disabled={!canManageRoles || (currentRole === "owner" && profile.role === "admin")}
                        className="mt-1 w-full rounded-lg border border-[#cad8ea] bg-white px-3 py-2 text-sm text-[#214a79] disabled:opacity-60"
                      >
                        {ROLE_OPTIONS.filter((option) => canEditAdminRole || option.value !== "admin").map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {MODULES.map((module) => {
                      const enabled = !!permissionMap[module.key]
                      const disabled = !canManageRoles || isLockedForOwner || (module.key === "admin" && !canEditAdminRow)

                      return (
                        <button
                          key={module.key}
                          type="button"
                          onClick={() => updatePermission(profile.role, module.key, !enabled)}
                          disabled={disabled || savingId === profile.role}
                          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${enabled ? "border-[#b9d2f2] bg-[#f6fbff]" : "border-[#e1e9f3] bg-[#fbfdff]"} ${disabled ? "opacity-60 cursor-not-allowed" : "hover:border-[#8fb3e5] hover:bg-[#eef6ff]"}`}
                        >
                          <div>
                            <p className="text-sm font-semibold text-[#2b527f]">{module.label}</p>
                            <p className="text-xs text-[#6f87a7]">{module.description}</p>
                          </div>
                          <span
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? "bg-[#1f67bf]" : "bg-[#c7d6e8]"}`}
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
