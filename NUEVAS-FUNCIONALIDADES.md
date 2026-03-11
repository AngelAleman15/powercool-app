# Sistema de Gestión PowerCool

## 🚀 Nuevas Funcionalidades Añadidas

### ✅ PWA (Progressive Web App) - NUEVO 🎯
PowerCool ahora es una **aplicación web progresiva** que se puede instalar como app nativa en cualquier dispositivo.

#### **Características PWA:**
- 📱 **Instalable**: Se puede agregar al home screen del celular/tablet/PC
- 🔔 **Notificaciones Push**: Alertas automáticas de mantenimientos próximos
- ⚡ **Funciona Offline**: Cache de páginas visitadas
- 🎨 **Experiencia nativa**: Se ve y funciona como app instalada
- 🔋 **Optimizada**: Carga rápida y bajo consumo de datos

#### **Sistema de Notificaciones Automáticas:**
- ⏰ **Mantenimientos próximos**: Alerta 2 días antes de la fecha programada
- 📊 **Stock bajo**: Aviso cuando repuestos estén por agotarse (futuro)
- 🔄 **Verificación cada hora**: El sistema revisa constantemente
- 🎯 **Notificaciones contextuales**: Con información del equipo y cliente
- 📍 **Click para navegar**: Al hacer click en la notificación, te lleva a la página relevante

#### **Cómo Usar:**
1. **Activar notificaciones**: En el Dashboard verás una tarjeta "Notificaciones PWA"
2. **Permitir permisos**: Click en "Activar Notificaciones" cuando el navegador solicite
3. **Probar**: Botón "Probar Notificación" para verificar que funciona
4. **Instalar como app**:
   - **Android/Chrome**: Menú → "Agregar a pantalla de inicio"
   - **iOS/Safari**: Compartir → "Agregar a pantalla de inicio"
   - **Desktop/Chrome**: Ícono de instalación en la barra de URL

#### **Configuración en Dashboard:**
```
┌─────────────────────────────────────┐
│ 🔔 Notificaciones PWA               │
│ Estado: [Activadas ✓]               │
│                                     │
│ ✅ Recibirás notificaciones de      │
│ mantenimientos próximos y alertas   │
│                                     │
│ [Probar Notificación]               │
└─────────────────────────────────────┘
```

---

### ✅ Gestión de Clientes
- **Página de Clientes** (`/clientes`): Gestiona tu base de datos de clientes
- Crear, buscar y visualizar clientes
- Campos: nombre, email, teléfono, dirección, ciudad
- Interfaz con modal para creación rápida

### ✅ Creación de Equipos
- **Nuevo Equipo** (`/equipos/nuevo`): Formulario completo para registrar equipos
- Selección de cliente existente o creación rápida
- Campos del equipo: marca, modelo, tipo, capacidad, ubicación
- Vinculación automática con clientes

### ✅ Integración Cliente-Equipo
- Los equipos ahora se vinculan a clientes específicos
- Vista de información del cliente en la página de detalle del equipo
- Creación rápida de cliente desde el formulario de equipo

### ✅ Exportación de PDF Mejorada
- Modal de opciones antes de exportar
- Opción para **incluir o excluir historial de mantenimiento**
- Nombre de archivo personalizado según opciones
- Generación multi-página automática

### ✅ Gestión de Trámites (ACTUALIZADO)
- **Página de Trámites** (`/tramites`): Sistema completo de mantenimientos y abonos
- Dos tipos de trámites:
  - **Mantenimientos**: Programar y dar seguimiento a servicios
  - **Abonos**: Gestionar pagos y cuotas
- **Flujo de trabajo mejorado**:
  - Selección de cliente PRIMERO (requerido)
  - Lista de equipos filtrada por cliente seleccionado
  - Creación rápida de equipo desde el modal (sin salir)
  - Selector de moneda: USD (Dólares) o UYU (Pesos Uruguayos)
- **Gestión de estados**: 
  - Cambio dinámico de estado desde cada tarjeta de trámite
  - Dropdown con 4 estados: Pendiente, En Proceso, Completado, Cancelado
  - Actualización en tiempo real
- Sistema de pestañas para filtrar por tipo
- Badges de color según estado
- Visualización de moneda en cada trámite
- **Diseño responsive**: Grid adaptable de 1 columna (móvil) a 2 columnas (desktop)

## Configuración de Base de Datos

Para usar estas funcionalidades, necesitas ejecutar el script SQL en tu panel de Supabase:

1. Ve a tu proyecto en [Supabase](https://app.supabase.com)
2. En el menú lateral, selecciona **SQL Editor**
3. Crea una nueva query
4. Copia y pega el contenido del archivo `supabase-setup.sql`
5. Ejecuta el script (botón "Run")

El script creará:
- Tabla `clientes` con todos los campos necesarios
- Tabla `tramites` para mantenimientos y abonos (con columna `moneda`)
- Columna `cliente_id` en la tabla `equipos`
- Columnas adicionales: `tipo` y `capacidad` en equipos
- Índices para mejorar el rendimiento
- Políticas de seguridad (RLS)

## Navegación

### Navbar Actualizado
- **Dashboard** (`/`): Página principal con estadísticas
- **Equipos** (`/equipos`): Lista de equipos con botón "Nuevo Equipo"
- **Clientes** (`/clientes`): Gestión de clientes (activo)
- **Trámites** (`/tramites`): Gestión de mantenimientos y abonos (NUEVO)
- **Stock**: Próximamente

### Flujo de Trabajo Recomendado

1. **Crear Clientes** primero desde `/clientes`
2. **Crear Equipos** desde `/equipos/nuevo`
3. Seleccionar cliente existente o crear uno rápido
4. **Crear Trámites** desde `/tramites` (flujo mejorado)
   - 1️⃣ Seleccionar CLIENTE primero (requerido)
   - 2️⃣ Seleccionar equipo del cliente o crear uno rápido
   - 3️⃣ Elegir moneda: USD (Dólares) o UYU (Pesos)
   - 4️⃣ Ingresar monto, descripción y fecha
   - 5️⃣ Establecer estado del trámite
5. **Exportar PDF** desde el detalle del equipo
   - Elegir si incluir historial o no
   - Descargar PDF personalizado

## Características Técnicas

- **Estado de carga**: Spinners durante consultas a la base de datos
- **Búsqueda en tiempo real**: Filtra clientes y equipos instantáneamente
- **Validación de formularios**: Campos requeridos marcados con *
- **100% Responsive**: Diseño completamente adaptable a móviles, tablets y desktops
  - Grids adaptables: 1 columna (móvil) → 2+ columnas (desktop)
  - Botones full-width en móviles, auto-width en desktop
  - Headers flexibles con layout columna/fila según tamaño de pantalla
  - Navbar con scroll horizontal en móviles (sin barra visible)
  - Padding responsive: 4px (móvil) → 6px (desktop)
  - Elementos con flex-wrap para prevenir overflow
- **Dark Mode**: Tema negro/blanco coherente
- **Filtrado inteligente**: Equipos filtrados por cliente seleccionado en trámites
- **Creación rápida**: Crear equipos sin salir del modal de trámites
- **Multi-moneda**: Soporte para USD y UYU en trámites
- **Cambio de estado dinámico**: Actualizar estado de trámites directamente desde la lista
- **Badges de estado**: Código de colores para estados de trámites
- **Sistema de pestañas**: Filtrado eficiente entre mantenimientos y abonos

## Detalles de Trámites

### Tipos de Trámites
- **Mantenimiento**: Para servicios técnicos, limpieza, revisiones
- **Abono**: Para pagos, cuotas, anticipos (monto obligatorio)

### Estados Disponibles
- 🟡 **Pendiente**: Trámite programado, aún no iniciado
- 🔵 **En Proceso**: Trámite en ejecución
- 🟢 **Completado**: Trámite finalizado exitosamente
- 🔴 **Cancelado**: Trámite cancelado

### Información de Trámites
Cada trámite muestra:
- Equipo asociado (marca y modelo)
- Cliente responsable
- Descripción del trabajo/pago
- Monto con moneda (USD o UYU)
- Fecha programada
- Estado actual con badge de color

### Monedas Soportadas
- **USD**: Dólares estadounidenses
- **UYU**: Pesos uruguayos
- Cada trámite guarda su moneda independiente
- La moneda se muestra junto al monto en las tarjetas

### Cambio de Estado de Trámites
- Dropdown de estado disponible en cada tarjeta de trámite
- **Estados disponibles**:
  - 🟡 **Pendiente**: Trámite programado, aún no iniciado
  - 🔵 **En Proceso**: Trámite en ejecución
  - 🟢 **Completado**: Trámite finalizado exitosamente
  - 🔴 **Cancelado**: Trámite cancelado
- Actualización instantánea en la base de datos
- Cambios reflejados en tiempo real sin recargar la página
- Visual feedback con badges de colores

## Diseño Responsive

El sistema está completamente optimizado para funcionar en **todos los dispositivos**:

### 📱 Móviles (< 640px)
- **Layouts verticales**: Headers y botones en columnas
- **Botones full-width**: Mejor accesibilidad táctil
- **Grid de 1 columna**: Tarjetas apiladas verticalmente
- **Navbar scrollable**: Menú horizontal con scroll suave (sin barra visible)
- **Logo compacto**: Solo ícono en pantallas muy pequeñas
- **Modales optimizados**: Altura máxima 90vh con scroll interno
- **Padding reducido**: 4px para maximizar espacio útil

### 📊 Tablets (640px - 1024px)
- **Grids de 2 columnas**: Mejor aprovechamiento del espacio
- **Headers flexibles**: Transición suave a layouts horizontales
- **Botones auto-width**: Tamaño óptimo según contenido
- **Padding medio**: 6px para balance entre espacio y contenido

### 🖥️ Desktop (> 1024px)
- **Grids de 2-3 columnas**: Vista completa de múltiples items
- **Layouts horizontales**: Headers y controles en línea
- **Hover effects**: Interacciones mejoradas con mouse
- **Máximo aprovechamiento**: Contenedores hasta 6xl (1280px)

### Elementos Responsive Implementados:
- ✅ Todos los headers de página
- ✅ Botones de acción (Nuevo Equipo, Nuevo Cliente, Nuevo Trámite)
- ✅ Grids de tarjetas (equipos, clientes, trámites)
- ✅ Formularios y modales
- ✅ Navbar principal
- ✅ Dashboard con stats
- ✅ Tabs y filtros
- ✅ Campos de búsqueda

## Próximos Pasos Sugeridos

- Editar información de clientes existentes
- Editar información de equipos
- Editar y actualizar estado de trámites
- Historial real de mantenimiento en equipos
- Módulo de Stock
- Dashboard con estadísticas reales de trámites
- Filtros avanzados por fecha y estado
- Recordatorios de trámites próximos
- Generación de reportes de mantenimientos

## Notas

- Los clientes creados desde "Crear Cliente Rápido" pueden editarse posteriormente
- Los equipos creados desde el modal de trámites se asignan automáticamente al cliente seleccionado
- Todos los datos se sincronizan en tiempo real con Supabase
- El sistema usa UUID para IDs únicos y seguros
- Los trámites se pueden asociar tanto a equipos como a clientes
- La exportación PDF ahora permite personalizar el contenido
- **IMPORTANTE**: Ejecuta el script SQL actualizado para agregar la columna `moneda` a la tabla tramites
- El flujo cliente→equipo mejora la usabilidad al mostrar solo equipos relevantes
