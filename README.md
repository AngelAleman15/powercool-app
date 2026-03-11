# 🌡️ PowerCool - Sistema de Gestión de Aires Acondicionados

Sistema completo de gestión y mantenimiento para PowerCool, empresa especializada en aires acondicionados.

## ✨ Características

### 📱 PWA (Progressive Web App)
- ✅ Instalable en cualquier dispositivo (móvil, tablet, desktop)
- ✅ Notificaciones push para recordatorios de mantenimiento
- ✅ Funciona con HTTPS en producción
- ✅ Icono en pantalla de inicio

### 🔧 Gestión Completa
- **Clientes**: CRUD completo con búsqueda, edición y vista detallada
- **Equipos**: Registro detallado de aires acondicionados (marca, modelo, capacidad, ubicación)
- **Trámites**: Mantenimientos y abonos con estados (pendiente, en proceso, completado, cancelado)
- **Dashboard**: Estadísticas en tiempo real, actividad reciente, trámites próximos

### 🎨 Interfaz Moderna
- Diseño oscuro y minimalista
- Totalmente responsivo (mobile-first)
- Animaciones y transiciones fluidas
- Gestión completa desde la vista de cliente (agregar/editar equipos y trámites sin salir)

### 🔐 Seguridad
- Base de datos Supabase (PostgreSQL)
- HTTPS automático en producción
- Variables de entorno protegidas

## 🚀 Deploy en Vercel (GRATIS)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/AngelAleman15/powercool-app)

### Pasos para deployar:

1. **Crear cuenta en Vercel** (gratis): https://vercel.com/signup
2. **Conectar con GitHub**: 
   - Click en "Add New Project"
   - Autoriza Vercel a acceder a tu GitHub
   - Selecciona el repositorio `powercool-app`
3. **Configurar variables de entorno**:
   - Click en "Environment Variables"
   - Agrega:
   ```
   NEXT_PUBLIC_SUPABASE_URL=tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-key-aqui
   ```
4. **Deploy** → ¡Listo en 2 minutos! 
   - Tu app estará en: `https://powercool-app.vercel.app`
   - Con HTTPS automático
   - Notificaciones PWA funcionando

## 💻 Desarrollo Local

### Requisitos
- Node.js 18+
- npm

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/AngelAleman15/powercool-app.git
cd powercool-app

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# Ejecutar en desarrollo
npm run dev
```

Abre http://localhost:3000 en tu navegador.

## 🗄️ Base de Datos

Este proyecto usa **Supabase** (PostgreSQL gratis). 

### Configuración inicial:
1. Crea cuenta en https://supabase.com
2. Crea un nuevo proyecto
3. Ve a "SQL Editor"
4. Ejecuta el contenido de `supabase-setup.sql`
5. Copia tu URL y ANON_KEY desde "Project Settings" → "API"

### Tablas principales:
- `clientes`: Información de clientes (nombre, email, teléfono, dirección)
- `equipos`: Aires acondicionados (marca, modelo, tipo, capacidad, ubicación)
- `tramites`: Mantenimientos y abonos (descripción, monto, fecha, estado)

## 📦 Stack Tecnológico

- **Framework**: Next.js 15 (App Router)
- **Base de datos**: Supabase (PostgreSQL)
- **Estilos**: Tailwind CSS
- **PWA**: Service Worker + Web Manifest
- **Hosting**: Vercel (gratis)
- **Lenguaje**: JavaScript + JSX

## 📱 Instalación como App

### Android / Windows
1. Abre la app en Chrome
2. Click en el menú (⋮)
3. "Instalar aplicación" o "Add to Home Screen"

### iOS / macOS
1. Abre en Safari
2. Click en compartir (⬆️)
3. "Agregar a pantalla de inicio"

## 📝 Documentación Adicional

- [INSTALAR-PWA.md](./INSTALAR-PWA.md) - Guía completa de instalación de la PWA
- [HTTPS-DEVELOPMENT.md](./HTTPS-DEVELOPMENT.md) - Configurar HTTPS localmente (ngrok/cloudflared)
- [NUEVAS-FUNCIONALIDADES.md](./NUEVAS-FUNCIONALIDADES.md) - Changelog detallado del proyecto

## 🎯 Funcionalidades Principales

### Dashboard
- 4 cards con estadísticas (equipos, mantenimientos, clientes, pendientes)
- Feed de actividad reciente (últimos 5 trámites)
- Vista de próximos trámites (próximos 7 días)
- Configuración de notificaciones PWA

### Clientes
- Lista con búsqueda por nombre, email, teléfono o ciudad
- Crear, editar y ver detalle de clientes
- Vista detallada muestra:
  - Todos los equipos del cliente (con edición inline)
  - Trámites activos (pendientes/en proceso)
  - Historial de trámites (completados/cancelados)
  - Agregar equipos y trámites sin salir de la vista

### Equipos
- Lista con búsqueda por modelo, marca, ubicación o ID
- Tipos: Split, Cassette, Piso-Techo, Multi-Split
- Información: marca, modelo, capacidad, ubicación

### Trámites
- Separados por tabs: Mantenimientos / Abonos
- Estados: Pendiente, En Proceso, Completado, Cancelado
- Campos: cliente, equipo, descripción, monto (USD/UYU), fecha programada
- Cambio rápido de estado desde la lista
- Vista detallada con toda la información del trámite, cliente y equipo

## 🐛 Limitaciones Conocidas

- Las notificaciones PWA solo funcionan con HTTPS (funciona en localhost o en Vercel)
- Requiere conexión a internet (offline mode en desarrollo futuro)

## 📄 Licencia

MIT

## 👨‍💻 Autor

Desarrollado para **PowerCool** - Gestión profesional de aires acondicionados

---

⭐ Si te gusta el proyecto, deja una estrella en GitHub!
