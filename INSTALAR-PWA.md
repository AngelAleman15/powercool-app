# 📱 Instalar PowerCool como Aplicación

PowerCool es una **Progressive Web App (PWA)** que puedes instalar en tu dispositivo como si fuera una aplicación nativa.

## 🌟 Beneficios de Instalar la App

- ✅ Acceso rápido desde el ícono en tu pantalla de inicio
- ✅ Funciona sin barra de navegador (pantalla completa)
- ✅ Notificaciones push automáticas
- ✅ Funciona offline (páginas visitadas)
- ✅ Actualización automática
- ✅ Ocupa menos espacio que una app nativa

---

## 📱 Android (Chrome, Edge, Samsung Internet)

### Método 1: Desde el navegador
1. Abre PowerCool en Chrome: `https://tu-dominio.com`
2. Toca el menú (⋮) en la esquina superior derecha
3. Selecciona **"Agregar a pantalla de inicio"** o **"Instalar app"**
4. En el popup, toca **"Instalar"** o **"Agregar"**
5. ¡Listo! El ícono aparecerá en tu pantalla de inicio

### Método 2: Banner automático
- Cuando visites PowerCool, aparecerá un banner en la parte inferior
- Toca **"Instalar"** en el banner
- Confirma en el popup

---

## 🍎 iPhone / iPad (Safari)

1. Abre PowerCool en Safari
2. Toca el botón **Compartir** (cuadrado con flecha hacia arriba) en la barra inferior
3. Desplázate y selecciona **"Agregar a pantalla de inicio"**
4. Edita el nombre si quieres: "PowerCool"
5. Toca **"Agregar"** en la esquina superior derecha
6. ¡Listo! El ícono aparecerá en tu pantalla de inicio

**Nota**: En iOS, la PWA se abrirá siempre en Safari WebView.

---

## 💻 Windows (Chrome, Edge)

1. Abre PowerCool en Chrome o Edge
2. **Opción A**: Click en el ícono de ➕ en la barra de URL (a la derecha)
3. **Opción B**: Menú (⋮) → "Instalar PowerCool..."
4. Click en **"Instalar"** en el popup
5. La app se instalará y se abrirá en una ventana separada
6. Un acceso directo se agregará a:
   - Menu Inicio de Windows
   - Escritorio (opcional)

---

## 🍎 macOS (Chrome, Edge, Safari)

### Chrome/Edge:
1. Abre PowerCool
2. Click en el ícono ⊕ en la barra de URL
3. Click en **"Instalar"**
4. La app aparecerá en tu Dock y carpeta Aplicaciones

### Safari (macOS Sonoma o superior):
1. Abre PowerCool
2. Menú Safari → Archivo → "Agregar a Dock"
3. La app se agregará al Dock

---

## 🔔 Activar Notificaciones

Después de instalar:

1. Abre la app PowerCool instalada
2. Ve al **Dashboard** (página principal)
3. Verás una tarjeta **"Notificaciones PWA"**
4. Click en **"Activar Notificaciones"**
5. Acepta los permisos cuando el navegador lo solicite
6. Click en **"Probar Notificación"** para verificar

### Tipos de notificaciones que recibirás:

- ⏰ **Mantenimientos próximos**: 2 días antes de la fecha programada
  - Ejemplo: "LG ABC-123 - Mantenimiento en 2 días"
  
- 📊 **Stock bajo** (cuando esté implementado):
  - Ejemplo: "Alerta: Stock bajo de filtros - Quedan 5 unidades"

### ⚠️ Requisito Importante: HTTPS

**Las notificaciones requieren HTTPS (conexión segura) para funcionar.**

- ✅ **Funciona en localhost** (desarrollo): `http://localhost:3000`
- ❌ **No funciona en HTTP remoto**: `http://192.168.x.x:3000` o `http://tu-ip:3000`
- ✅ **Funciona en producción HTTPS**: `https://powercool.vercel.app`

#### Soluciones para desarrollo/testing:

**Opción 1: Usar localhost** (recomendado para pruebas locales)
- Accede desde el mismo equipo: `http://localhost:3000`
- Las notificaciones funcionarán perfectamente

**Opción 2: Túnel HTTPS con ngrok**
```bash
# Instalar ngrok desde https://ngrok.com/
ngrok http 3000
```
- Esto te dará una URL HTTPS temporal: `https://abc123.ngrok.io`
- Comparte esa URL con otros dispositivos

**Opción 3: Túnel HTTPS con Cloudflare**
```bash
# Instalar cloudflared
npx cloudflared tunnel --url http://localhost:3000
```
- Te dará una URL temporal con HTTPS

**Opción 4: Desplegar en producción**
- Vercel, Netlify, Railway: Incluyen HTTPS automáticamente
- Recomendado para uso real con clientes

---

## 🔧 Desinstalar la App

### Android:
1. Mantén presionado el ícono de PowerCool
2. Selecciona **"Desinstalar"** o arrastra a "Desinstalar"
3. Confirma

### iOS:
1. Mantén presionado el ícono de PowerCool
2. Toca el ❌ o selecciona **"Eliminar app"**
3. Confirma **"Eliminar de pantalla de inicio"**

### Windows:
1. Click derecho en el ícono de PowerCool en el Menu Inicio
2. Selecciona **"Desinstalar"**
3. Confirma en el popup

### macOS:
1. Arrastra el ícono de PowerCool desde Aplicaciones a la Papelera
2. O: Click derecho → "Mover a la papelera"

---

## ❓ Preguntas Frecuentes

### ¿Ocupa mucho espacio?
No. Las PWAs ocupan mucho menos que apps nativas. PowerCool ocupa ~5-10 MB.

### ¿Necesito internet?
- **Sí** para cargar datos de Supabase (clientes, equipos, trámites)
- **No** para ver páginas ya visitadas (quedan en caché)

### ¿Se actualiza automáticamente?
Sí. Cuando hay una nueva versión, se descarga automáticamente en segundo plano.

### ¿Funciona en todos los navegadores?
- ✅ Chrome (Android, Windows, macOS)
- ✅ Edge (Windows, macOS, Android)
- ✅ Samsung Internet (Android)
- ⚠️ Safari (iOS, macOS) - Funcionalidad limitada
- ❌ Firefox - No soporta instalación PWA completa

### ¿Puedo usar notificaciones sin instalar?
Sí, pero es más confiable cuando está instalada como app.

### ¿Por qué no funcionan las notificaciones?
Las notificaciones web requieren **HTTPS** (conexión segura). Solo funcionan:
- ✅ En `localhost` durante desarrollo
- ✅ En sitios con HTTPS en producción
- ❌ **NO** en HTTP remoto (ej: `http://192.168.x.x:3000`)

**Solución**: Usa localhost localmente, o despliega con HTTPS (Vercel, Netlify).

### ¿Cómo pruebo las notificaciones en mi celular?
Dos opciones:
1. **Túnel HTTPS**: Usa ngrok o cloudflared para crear una URL HTTPS temporal
2. **Desplegar**: Sube la app a Vercel/Netlify (gratis) y obtendrás HTTPS automático

---

## 🆘 Soporte

Si tienes problemas instalando PowerCool:

1. Verifica que estés usando un navegador compatible
2. Asegúrate de tener conexión a internet
3. Intenta en modo incógnito/privado
4. Limpia la caché del navegador y reinténtalo
5. Contacta al soporte técnico

---

**¡Disfruta de PowerCool como aplicación instalada!** 🚀
