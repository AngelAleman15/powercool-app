const PUBLIC_PATHS = ["/auth", "/sin-acceso"]

const STAFF_ROUTES = [
  /^\/equipos\/nuevo(?:\/|$)/,
  /^\/equipos\/[^/]+(?:\/|$)/,
  /^\/clientes\/[^/]+(?:\/|$)/,
  /^\/tramites\/[^/]+(?:\/|$)/,
  /^\/debug-env(?:\/|$)/,
]

function normalizePath(pathname) {
  if (!pathname) return "/"
  const next = pathname.trim()
  if (!next) return "/"
  return next.startsWith("/") ? next : `/${next}`
}

export function isPublicPath(pathname) {
  const next = normalizePath(pathname)
  return PUBLIC_PATHS.some((base) => next === base || next.startsWith(`${base}/`))
}

export function isStaffOnlyPath(pathname) {
  const next = normalizePath(pathname)
  return STAFF_ROUTES.some((pattern) => pattern.test(next))
}

export function canAccessPath(pathname, role) {
  const nextRole = role || "visor"
  const nextPath = normalizePath(pathname)

  if (isPublicPath(nextPath)) return true
  if (!isStaffOnlyPath(nextPath)) return true

  return nextRole === "admin" || nextRole === "tecnico"
}
