# 🔔 Por Qué Están Bloqueadas Las Notificaciones

## El Problema

Cuando accedes a PowerCool desde `http://26.39.223.86:3000`, las notificaciones están **bloqueadas** porque:

- Los navegadores **solo permiten notificaciones en HTTPS** (conexión segura 🔒)
- HTTP sin HTTPS = No notificaciones ❌
- Excepción: `localhost` (solo en la misma PC)

---

## 3 Soluciones Rápidas

### 🏆 Solución 1: ngrok (5 minutos)

**Crea un túnel HTTPS gratis para testing:**

1. Descarga: https://ngrok.com/download
2. Extrae y abre `ngrok.exe`
3. En la terminal:
   ```bash
   ngrok http 3000
   ```
4. Copia la URL HTTPS que te da: `https://abc123.ngrok-free.app`
5. **Úsala en tu celular o cualquier dispositivo**
6. ✅ Las notificaciones funcionarán

**Ventaja**: Temporal, perfecto para pruebas  
**Desventaja**: Cada vez que lo cierres, cambia la URL

---

### 🚀 Solución 2: Cloudflare Tunnel (1 comando)

**Aún más rápido, sin instalación:**

```bash
npx cloudflared tunnel --url http://localhost:3000
```

Te da una URL HTTPS temporal. Úsala igual que ngrok.

---

### 💎 Solución 3: Desplegar en Vercel (Producción)

**Para uso real con tu cliente:**

```bash
npm i -g vercel
cd aire-control
vercel
```

Sigue los pasos y tendrás:
- URL permanente con HTTPS
- Gratis
- Actualización automática con cada `git push`

**Ejemplo**: `https://powercool.vercel.app`

---

## ¿Cuál Elegir?

| Necesitas... | Usa esto |
|--------------|----------|
| Probar en tu celular ahora | ngrok o cloudflared |
| Mostrar a tu cliente | Vercel (deploy) |
| Solo en tu PC | `localhost:3000` (ya funciona) |

---

## Instrucciones Detalladas

Ver: [HTTPS-DEVELOPMENT.md](HTTPS-DEVELOPMENT.md)

---

## Resumen Visual

```
❌ http://26.39.223.86:3000
   └─ Notificaciones bloqueadas

✅ https://abc123.ngrok-free.app
   └─ Notificaciones funcionan ✓

✅ https://powercool.vercel.app
   └─ Notificaciones funcionan ✓
   └─ URL permanente
   └─ Gratis
```

---

**Usa ngrok para probar ahora, Vercel para producción** 🎯
