# 🚀 Deploy PowerCool en Vercel (GRATIS)

Guía paso a paso para deployar tu aplicación en Vercel y tenerla funcionando en internet con HTTPS.

## ⚡ Qué es Vercel

Vercel es una plataforma de hosting **GRATIS** para proyectos Next.js que te da:
- ✅ HTTPS automático (necesario para notificaciones PWA)
- ✅ Dominio gratis: `powercool-app.vercel.app`
- ✅ Deploy automático cada vez que haces push a GitHub
- ✅ 100GB de ancho de banda gratis al mes
- ✅ No requiere tarjeta de crédito

---

## 📋 Pre-requisitos

Antes de empezar necesitas:
1. ✅ Tu código en GitHub (ya lo tienes en https://github.com/AngelAleman15/powercool-app)
2. ✅ Cuenta de Supabase activa con tu proyecto configurado

---

## 🎯 Paso a Paso

### 1️⃣ Crear cuenta en Vercel

1. Ve a: **https://vercel.com/signup**
2. Click en **"Continue with GitHub"**
3. Autoriza Vercel a acceder a tu GitHub
4. ¡Listo! Ya tienes cuenta gratis

### 2️⃣ Importar tu proyecto

1. En el dashboard de Vercel, click en **"Add New..."** → **"Project"**
2. Verás tus repositorios de GitHub
3. Busca **"powercool-app"** y click en **"Import"**

### 3️⃣ Configurar el proyecto

Vercel detectará automáticamente que es Next.js. Ahora configura:

**Framework Preset**: Next.js (ya detectado ✅)

**Build Command**: `npm run build` (ya configurado ✅)

**Deploy Directory**: `.next` (ya configurado ✅)

### 4️⃣ Configurar Variables de Entorno (IMPORTANTE)

Antes de deployar, necesitas agregar tus credenciales de Supabase:

1. Click en **"Environment Variables"**
2. Agrega estas 2 variables:

**Variable 1:**
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: [Tu URL de Supabase]
```

Para encontrar tu URL:
- Ve a https://supabase.com/dashboard
- Entra a tu proyecto
- Click en "Settings" → "API"
- Copia "Project URL"

**Variable 2:**
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [Tu ANON KEY de Supabase]
```

Para encontrar tu ANON KEY:
- En el mismo lugar (Settings → API)
- Copia "anon public" key

3. Click en **"Add"** para cada variable

### 5️⃣ Deploy!

1. Click en **"Deploy"**
2. Espera 1-2 minutos mientras Vercel construye tu app
3. ✨ ¡Listo! Verás un mensaje de éxito

---

## 🌐 Acceder a tu app

Vercel te dará una URL como:
```
https://powercool-app.vercel.app
```

También puedes ver el link en el dashboard de Vercel.

---

## 📱 Probar las notificaciones PWA

1. Abre tu app en Chrome (móvil o desktop)
2. Ve al menú → "Instalar aplicación"
3. Instala la app
4. Ve a Dashboard → Configuración de Notificaciones
5. Click en "Activar Notificaciones"
6. ✅ ¡Funcionará! (porque Vercel tiene HTTPS automático)

---

## 🔄 Deploy Automático

Vercel está conectado a tu GitHub. Ahora cada vez que hagas:

```bash
git add .
git commit -m "tu mensaje"
git push
```

Vercel automáticamente:
1. Detecta el push
2. Construye la nueva versión
3. La publica en tu dominio
4. ¡Sin hacer nada más!

Puedes ver el progreso en: https://vercel.com/dashboard

---

## 🎨 Personalizar Dominio (Opcional)

### Cambiar el subdominio
Por defecto: `powercool-app.vercel.app`

Puedes cambiarlo:
1. Ve a tu proyecto en Vercel
2. Settings → Domains
3. Edita el dominio a algo como: `powercool.vercel.app`

### Usar dominio propio (Plan Pro $20/mes)
Si compras un dominio: `powercool.com.uy`
1. Settings → Domains → Add
2. Ingresa tu dominio
3. Sigue las instrucciones para configurar DNS

---

## 🐛 Solución de Problemas

### Error: "La app no carga"
- Verifica que las variables de entorno estén correctas
- Revisa los logs en Vercel: Dashboard → tu proyecto → "Deployments" → click en el último → "View Function Logs"

### Error: "No se conecta a Supabase"
- Verifica que `NEXT_PUBLIC_SUPABASE_URL` tenga el formato: `https://xxxxx.supabase.co`
- Verifica que `NEXT_PUBLIC_SUPABASE_ANON_KEY` sea la clave "anon public" (no la "service_role")

### Las notificaciones no funcionan
- Asegúrate de estar usando HTTPS (Vercel lo da automáticamente)
- Prueba en Chrome/Edge (Safari en iOS tiene limitaciones con PWA)
- Limpia caché: Ctrl+Shift+Delete → Borrar todo

---

## 📊 Monitoreo

Vercel te da estadísticas gratis:
- Visitas a tu app
- Tiempo de carga
- Errores en producción

Todo en: https://vercel.com/dashboard → Tu Proyecto → Analytics

---

## 💰 Costos

**Plan Hobby (GRATIS para siempre):**
- 100GB ancho de banda/mes
- Deploy ilimitados
- HTTPS automático
- 1 usuario

**Suficiente para:**
- Desarrollo
- Startups pequeñas
- Proyectos personales
- Hasta ~500 usuarios activos/mes

---

## ✅ Checklist Final

- [ ] Cuenta en Vercel creada
- [ ] Repositorio importado
- [ ] Variables de entorno configuradas
- [ ] Deploy exitoso
- [ ] App accesible desde el dominio .vercel.app
- [ ] HTTPS funcionando (candado verde en navegador)
- [ ] PWA instalable
- [ ] Notificaciones funcionando

---

## 🆘 Soporte

- Documentación Vercel: https://vercel.com/docs
- Dashboard Vercel: https://vercel.com/dashboard
- Estado del servicio: https://vercel-status.com

---

¡Felicidades! 🎉 Tu app PowerCool ya está en internet con HTTPS gratis, deploy automático y notificaciones PWA funcionando.
