# 🔒 HTTPS para Desarrollo - Solución de Notificaciones

## Problema

Las notificaciones PWA **requieren HTTPS** para funcionar por motivos de seguridad. 

- ✅ Funciona: `http://localhost:3000` (solo en la PC donde corre el servidor)
- ❌ **Bloqueado**: `http://26.39.223.86:3000` (HTTP en la red local o internet)
- ✅ Funciona: `https://...` (cualquier URL con HTTPS)

---

## 💡 Soluciones Rápidas

### Opción 1: ngrok (Recomendada - Más Fácil)

**¿Qué es?**: Crea un túnel HTTPS público que apunta a tu localhost.

#### Instalación:

1. **Descarga ngrok**: https://ngrok.com/download
2. Extrae el archivo ZIP
3. Mueve `ngrok.exe` a una carpeta (ej: `C:\ngrok\`)

#### Uso:

```bash
# En una terminal nueva (sin cerrar el servidor de Next.js)
cd C:\ngrok
ngrok http 3000
```

Verás algo como:
```
Forwarding  https://abc123xyz.ngrok-free.app -> http://localhost:3000
```

**Esa URL `https://abc123xyz.ngrok-free.app` la puedes usar en cualquier dispositivo** y las notificaciones funcionarán.

#### Para detener:
Presiona `Ctrl + C` en la terminal de ngrok.

---

### Opción 2: Cloudflare Tunnel (Gratis, Sin Cuenta)

```bash
# Abre una terminal PowerShell
npx cloudflared tunnel --url http://localhost:3000
```

Te dará una URL temporal con HTTPS:
```
https://random-name.trycloudflare.com
```

**Ventaja**: No necesitas instalar nada ni crear cuenta.  
**Desventaja**: Cada vez que lo ejecutes, la URL cambia.

---

### Opción 3: Desplegar en Vercel (Producción)

**Para uso real con clientes**, despliega la app en Vercel (gratis):

1. Crea una cuenta en https://vercel.com (usa tu GitHub)
2. Instala Vercel CLI:
   ```bash
   npm i -g vercel
   ```
3. Despliega desde la carpeta del proyecto:
   ```bash
   cd aire-control
   vercel
   ```
4. Sigue las instrucciones (usa la configuración por defecto)
5. Te dará una URL HTTPS permanente: `https://powercool.vercel.app`

**Importante**: Después de desplegar, actualiza las variables de entorno de Supabase en Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 🎯 Cuál Usar

| Escenario | Solución Recomendada |
|-----------|---------------------|
| 🔬 **Testing local en tu celular** | ngrok o cloudflared |
| 👥 **Mostrar a tu cliente/equipo** | ngrok (URL temporal) |
| 🚀 **Uso en producción real** | Vercel/Netlify (deploy) |
| 🏠 **Solo en tu PC** | localhost:3000 (sin túnel) |

---

## 📱 Ejemplo: Testing en Celular

### Con ngrok:

1. **En tu PC**:
   ```bash
   # Terminal 1: Servidor Next.js (ya corriendo)
   npm run dev
   
   # Terminal 2: ngrok
   ngrok http 3000
   ```

2. **Copia la URL HTTPS**: `https://abc123.ngrok-free.app`

3. **En tu celular**: 
   - Abre esa URL en el navegador
   - Las notificaciones ahora estarán disponibles
   - Puedes instalar la PWA
   - Todo funcionará como en producción

---

## ⚙️ ngrok con Dominio Fijo (Opcional)

Si usas ngrok frecuentemente, puedes obtener una URL fija:

1. Crea cuenta gratis en https://ngrok.com
2. Obtén tu authtoken
3. Configura:
   ```bash
   ngrok config add-authtoken TU_TOKEN_AQUI
   ```
4. Ejecuta con dominio fijo:
   ```bash
   ngrok http --domain=tu-nombre.ngrok-free.app 3000
   ```

Ahora siempre tendrás la misma URL.

---

## 🔍 Verificar que HTTPS Funciona

1. Abre la URL HTTPS en el navegador
2. Ve al Dashboard
3. La tarjeta "Notificaciones PWA" **NO** debe mostrar mensaje de "Bloqueadas por HTTP"
4. Deberías ver el botón "Activar Notificaciones"
5. Click en "Activar" → Acepta permisos
6. Click en "Probar Notificación" → Debe aparecer la notificación

---

## 🆘 Problemas Comunes

### ngrok dice "command not found"
- Asegúrate de estar en la carpeta donde está `ngrok.exe`
- O agrega ngrok al PATH de Windows

### La URL de ngrok no abre
- Verifica que el servidor Next.js esté corriendo en `localhost:3000`
- Asegúrate de usar `ngrok http 3000` (sin http:// en el comando)

### Las notificaciones siguen bloqueadas
- Verifica que estés usando la URL **HTTPS** (no HTTP)
- Revisa que el navegador no haya bloqueado las notificaciones antes
- Prueba en modo incógnito/privado

---

**Ahora podrás probar todas las funcionalidades PWA con HTTPS** ✅
