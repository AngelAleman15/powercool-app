# PowerCool - Sistema de Gestion de Aires Acondicionados

Aplicacion web para la gestion operativa de clientes, equipos, tramites de mantenimiento y control de inventario para PowerCool.

## Estado Actual

- Stack actualizado a Next.js 16 + React 19 + TypeScript.
- Lint en estado limpio (sin errores ni warnings al momento de esta actualizacion).
- UI unificada en estilo claro para modulos principales.
- Soporte PWA activo (manifest + service worker).

## Funcionalidades Principales

- Dashboard con metricas, actividad reciente, mapa y proximos mantenimientos.
- Gestion de clientes con CRUD y vista detalle.
- Gestion de equipos por cliente.
- Gestion de tramites con estados (pendiente, en_proceso, completado, cancelado).
- Inventario con repuestos y movimientos de stock.
- Notificaciones locales para mantenimientos.

## Stack Tecnologico Real

- Framework: Next.js 16.1.6 (App Router)
- UI: React 19.2.3 + React DOM 19.2.3
- Lenguaje: TypeScript (con soporte de archivos JS heredados)
- Estilos: Tailwind CSS v4
- Graficos: Recharts
- Calendario: react-big-calendar + date-fns
- Base de datos: Supabase (PostgreSQL)
- Hosting: Vercel

## Requisitos

- Node.js 20+
- npm 10+

## Variables de Entorno

Crea un archivo `.env.local` con:

```bash
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

## Desarrollo Local

```bash
git clone https://github.com/AngelAleman15/powercool-app.git
cd powercool-app
npm install
npm run dev
```

Abre http://localhost:3000.

## Scripts

```bash
npm run dev    # entorno de desarrollo
npm run build  # build de produccion
npm run start  # ejecutar build
npm run lint   # ESLint
```

## Base de Datos

Este proyecto usa Supabase.

1. Crear proyecto en Supabase.
2. Ir a SQL Editor.
3. Ejecutar el contenido de `supabase-setup.sql`.
4. Configurar credenciales en `.env.local`.

Tablas de negocio principales:

- `clientes`
- `equipos`
- `tramites`
- `repuestos`
- `movimientos_repuestos`

## Seguridad y Produccion

- RLS esta habilitado en la base de datos.
- Para entorno productivo multiusuario, se recomienda endurecer politicas RLS por rol/tenant (evitar politicas permisivas globales).
- Integrar autenticacion y permisos de UI end-to-end (evitar identidad hardcodeada).

## Arquitectura (Resumen)

- Frontend: App Router en carpeta `app/`.
- Componentes reutilizables en `components/`.
- Integraciones y hooks de negocio en `lib/`.
- Configuracion PWA en `public/manifest.json` y `public/sw.js`.

## Documentacion Relacionada

- [INSTALAR-PWA.md](./INSTALAR-PWA.md)
- [HTTPS-DEVELOPMENT.md](./HTTPS-DEVELOPMENT.md)
- [DEPLOY-VERCEL.md](./DEPLOY-VERCEL.md)
- [SOLUCION-NOTIFICACIONES.md](./SOLUCION-NOTIFICACIONES.md)
- [VERCEL-TROUBLESHOOTING.md](./VERCEL-TROUBLESHOOTING.md)

## Siguiente Sprint Recomendado

1. Auth real (login/sesion) + roles en UI.
2. Politicas RLS por usuario/rol/tenant.
3. Inventario transaccional unido a tramites (consumo por OT, kardex, auditoria).
4. Auditoria de cambios en entidades criticas.

## Licencia

MIT
