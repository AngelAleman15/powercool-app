# 🔧 Troubleshooting Vercel Deploy

## ⚠️ ANTES DE DEPLOY: Configura Variables de Entorno

**🚨 ERROR MÁS COMÚN:** 
```
Error: Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.
```

**Causa:** Las variables de entorno NO están configuradas en Vercel.

---

### ✅ Pasos para Configurar Variables (OBLIGATORIO):

  1. Ve a https://vercel.com → Tu Proyecto → **Settings** → **Environment Variables**
  2. Click en **"Add New"**
  3. Agrega la **primera variable**:
    - **Name:** `NEXT_PUBLIC_SUPABASE_URL`
    - **Value:** (copia de tu `.env.local`)
    - **Environments:** Selecciona **"All Environments"** (Production, Preview, Development)
    - Click **"Save"**

  4. Agrega la **segunda variable**:
    - **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - **Value:** (copia de tu `.env.local`)
    - **Environments:** Selecciona **"All Environments"**
    - Click **"Save"**

  5. Verifica que ambas variables digan **"All Environments"** arriba
  6. Ve a **Deployments** → Click en el último deploy → **3 puntos (...)** → **"Redeploy"**

  ---

  ## ❓ Deploy Fallido - Checklist

  ### 1️⃣ Verificar Variables de Entorno

  **¿Configuraste estas variables en Vercel?**

  Ve a tu proyecto en Vercel → **Settings** → **Environment Variables**

  Debe haber **2 variables** configuradas para **"All Environments"**:

  ```
  ✅ NEXT_PUBLIC_SUPABASE_URL → All Environments
  ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY → All Environments
  ```

  **Si solo configuraste Production:**
  1. Click en **"Edit"** en cada variable
  2. En **"Environments"** selecciona **"All Environments"**
  3. Click en **"Save"**
  4. Ve a **Deployments** → Click en los 3 puntos del último deploy → **"Redeploy"**

---

### 2️⃣ Copiar Error Completo

En la página de deploy fallido en Vercel:

1. Click en **"View Build Logs"** o expande los logs
2. Ve hasta el **final** de los logs (scroll down)
3. Copia las **últimas 30 líneas** (donde está el error en rojo)
4. Comparte el error completo

---

### 3️⃣ Errores Comunes y Soluciones

#### Error: "Missing environment variables"
**Solución:** Agrega `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Error: "Module not found" o "Cannot find module"
**Solución:** Vercel no instaló las dependencias correctamente. Redeploy.

#### Error: "Type error: ..."
**Solución:** Hay errores de TypeScript. Ejecuta `npm run build` localmente para verlos.

#### Error: "ESLint error"
**Solución:** Errores de linting. Desactiva ESLint en build:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};
```

---

### 4️⃣ Test Build Local

Antes de redeploy en Vercel, **prueba localmente**:

```bash
# En la carpeta aire-control
npm run build
```

Si el build pasa localmente pero falla en Vercel → Problema de variables de entorno

Si el build falla localmente → Hay errores en el código que debes arreglar

---

### 5️⃣ Vercel Build Command Correcto

En Vercel, verifica:
- **Framework Preset:** Next.js ✅
- **Root Directory:** `./` ✅  
- **Build Command:** `npm run build` ✅
- **Output Directory:** `.next` ✅

---

### 6️⃣ Forzar Redeploy

Si ya arreglaste todo:

1. Ve a **Deployments** en Vercel
2. Click en el deploy fallido
3. Click en los **3 puntos** (···)
4. Click en **"Redeploy"**

---

## 📊 Info del Proyecto

**Versión Next.js:** 16.1.6  
**Versión React:** 19.2.3  
**Node Version:** Auto (Vercel usa la última LTS)

---

## 🆘 Si Nada Funciona

1. **Elimina el proyecto en Vercel** (Settings → Delete)
2. **Reimporta desde GitHub** (New Project → powercool-app)
3. **Configura variables de entorno ANTES de deploy**
4. Click en Deploy

---

## ✅ Deployment Exitoso Se Ve Así

```
✓ Creating an optimized production build
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (22/22)
✓ Collecting build traces
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB         87.3 kB
├ ○ /clientes                            142 kB          229 kB
├ ○ /clientes/[id]                       1.2 kB         88.3 kB
└ ○ /equipos                             15 kB          102 kB

○  (Static)  prerendered as static content

Build successful! 🎉
Deploying...
Deployment completed!
```

Si ves esto → ¡Todo bien! 🚀
