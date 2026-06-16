const PUBLIC_PATHS = ["/auth", "/sin-acceso"]

const MODULE_ROUTES = [
  { module: "clientes", pattern: /^\/clientes(?:\/|$)/ },
  { module: "equipos", pattern: /^\/equipos(?:\/|$)/ },
  { module: "tramites", pattern: /^\/tramites(?:\/|$)/ },
  { module: "repuestos", pattern: /^\/repuestos(?:\/|$)/ },
  { module: "admin", pattern: /^\/admin(?:\/|$)/ },
]

const STAFF_ROUTES = [
  /^\/equipos\/nuevo(?:\/|$)/,
  /^\/equipos\/[^/]+(?:\/|$)/,
  /^\/clientes\/[^/]+(?:\/|$)/,
  /^\/tramites\/[^/]+(?:\/|$)/,
]

const DEFAULT_MODULE_PERMISSIONS = {
  dashboard: true,
  clientes: false,
  equipos: true,
  tramites: false,
  repuestos: false,
  admin: false,
}

export function getDefaultPermissions(role) {
  if (role === "admin" || role === "owner") {
    return {
      dashboard: true,
      clientes: true,
      equipos: true,
      tramites: true,
      repuestos: true,
      admin: true,
    }
  }

  if (role === "tecnico") {
    return {
      dashboard: true,
      clientes: false,
      equipos: true,
      tramites: true,
      repuestos: false,
      admin: false,
    }
  }

  return DEFAULT_MODULE_PERMISSIONS
}

export function getModuleFromPathname(pathname) {
  const next = normalizePath(pathname)
  return MODULE_ROUTES.find((entry) => entry.pattern.test(next))?.module || null
}

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

export function canAccessPath(pathname, role, permissions = null) {
  const nextRole = role || "visor"
  const nextPath = normalizePath(pathname)
  const nextModule = getModuleFromPathname(nextPath)

  if (isPublicPath(nextPath)) return true
  if (nextModule === "admin") {
    return nextRole === "admin" || nextRole === "owner"
  }

  if (!isStaffOnlyPath(nextPath) && !nextModule) return true

  if (permissions && nextModule && Object.prototype.hasOwnProperty.call(permissions, nextModule)) {
    return !!permissions[nextModule]
  }

  const defaultPermissions = getDefaultPermissions(nextRole)

  if (nextModule && Object.prototype.hasOwnProperty.call(defaultPermissions, nextModule)) {
    return !!defaultPermissions[nextModule]
  }

  return nextRole === "admin" || nextRole === "owner" || nextRole === "tecnico"
}
