# 🚀 Deploy a Vercel con jandi.com.ar

## 📋 Checklist de Deploy

### 1️⃣ Preparar el proyecto

#### A. Crear archivo de configuración de Vercel
Ya voy a crear `vercel.json` con la configuración correcta.

#### B. Configurar variables de entorno
Vamos a necesitar estas variables en Vercel:

```env
# Supabase
VITE_SUPABASE_URL=https://bstddwmpsbfrwqaudkai.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzdGRkd21wc2JmcndxYXVka2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNjA2ODgsImV4cCI6MjA4NDkzNjY4OH0.1aw4JJP6ISHnPDbBDnoVlVNYdqS-IO8mtv2DzpOnDjo

# Google OAuth
VITE_GOOGLE_CLIENT_ID=123981717304-8ct85hepu58chuci6nivr9gdlm055q80.apps.googleusercontent.com

# App Config
VITE_APP_URL=https://jandi.com.ar
VITE_API_URL=https://jandi.com.ar/api

# Mercado Pago (cuando lo configures)
VITE_MP_PUBLIC_KEY=TEST-mockup-key

# Feature Flags
VITE_ENABLE_BUSINESS_REGISTRATION=true
VITE_ENABLE_GOOGLE_AUTH=true
```

---

### 2️⃣ Configurar Vercel

#### A. Instalar Vercel CLI (si no lo tenés)
```bash
npm install -g vercel
```

#### B. Login en Vercel
```bash
vercel login
```

#### C. Deploy inicial
```bash
cd chat-client
vercel
```

Seguí las instrucciones:
- **Set up and deploy "~/path/to/chat-client"?** → Yes
- **Which scope?** → Tu cuenta personal o team
- **Link to existing project?** → No
- **What's your project's name?** → jandi-app (o el que prefieras)
- **In which directory is your code located?** → ./
- **Override settings?** → No (usa las del package.json)

#### D. Configurar el dominio personalizado

1. En **Vercel Dashboard** (vercel.com)
2. Andá a tu proyecto → **Settings → Domains**
3. Agregá tu dominio: `jandi.com.ar`
4. Vercel te va a dar los DNS records para configurar

#### E. Configurar variables de entorno en Vercel

1. En **Vercel Dashboard** → tu proyecto → **Settings → Environment Variables**
2. Agregá todas las variables de arriba (una por una)
3. Seleccioná **Production**, **Preview**, y **Development**

---

### 3️⃣ Configurar DNS en tu proveedor

Depende de dónde compraste `jandi.com.ar`, pero generalmente:

#### Opción A: Usar nameservers de Vercel (recomendado)
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

#### Opción B: CNAME record
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

---

### 4️⃣ Configurar Google OAuth con el nuevo dominio

#### A. Google Cloud Console

1. Ve a **APIs & Services → Credentials**
2. Seleccioná tu OAuth 2.0 Client ID
3. En **Authorized JavaScript origins**, agregá:
   ```
   https://jandi.com.ar
   https://www.jandi.com.ar
   https://bstddwmpsbfrwqaudkai.supabase.co
   http://localhost:3000  (mantener para desarrollo)
   ```

4. En **Authorized redirect URIs**, agregá:
   ```
   https://bstddwmpsbfrwqaudkai.supabase.co/auth/v1/callback
   https://jandi.com.ar/auth/callback
   https://www.jandi.com.ar/auth/callback
   http://localhost:3000/auth/callback  (mantener para desarrollo)
   ```

---

### 5️⃣ Configurar Supabase con el nuevo dominio

#### A. URL Configuration

1. Ve a **Supabase Dashboard → Authentication → URL Configuration**

2. **Site URL**: `https://jandi.com.ar`

3. **Redirect URLs** (agregar todas estas):
   ```
   https://jandi.com.ar/**
   https://www.jandi.com.ar/**
   http://localhost:3000/**
   http://localhost:5173/**
   ```

#### B. Verificar políticas RLS

Ejecutá en **SQL Editor**:
```sql
-- Ver políticas actuales
SELECT policyname, cmd FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users';
```

Si no hay políticas, ejecutá `SUPABASE_RLS_POLICIES.sql`.

---

### 6️⃣ Deploy final y verificación

#### A. Deploy a producción
```bash
cd chat-client
vercel --prod
```

#### B. Verificar que funciona

1. Abrí `https://jandi.com.ar`
2. Click en "Continuar con Google"
3. Autorizá con Google
4. Verificá que redirige correctamente y completa el login

#### C. Verificar logs

En **Vercel Dashboard** → tu proyecto → **Deployments** → click en el deployment más reciente → **Logs**

---

## 🔧 Configuración específica para chat-client

### Actualizar package.json (si hace falta)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

Vercel va a detectar automáticamente que es un proyecto Vite y va a usar:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

---

## ⚠️ Problemas comunes

### "Domain is not configured"
→ Esperá unos minutos a que los DNS se propaguen (puede tardar hasta 48 horas, pero usualmente 5-10 minutos)

### "OAuth redirect_uri_mismatch"
→ Verificá que agregaste `https://jandi.com.ar/auth/callback` en Google Console

### "CORS error"
→ Verificá que en Supabase tenés `https://jandi.com.ar` en las Redirect URLs

### Variables de entorno no funcionan
→ En Vercel, asegurate de que las variables tienen el prefijo `VITE_` y que redesplegaste después de agregarlas

---

## 📝 Comandos útiles

```bash
# Deploy a preview
vercel

# Deploy a producción
vercel --prod

# Ver logs en tiempo real
vercel logs [deployment-url]

# Ver dominios configurados
vercel domains ls

# Eliminar deployment
vercel rm [deployment-name]
```

---

## ✅ Checklist final

- [ ] Proyecto desplegado en Vercel
- [ ] Dominio jandi.com.ar configurado y funcionando
- [ ] Variables de entorno configuradas en Vercel
- [ ] Google OAuth actualizado con nuevas URLs
- [ ] Supabase actualizado con nuevas URLs
- [ ] Políticas RLS aplicadas en Supabase
- [ ] Login con Google funciona en producción
- [ ] Callback redirige correctamente

---

## 🎉 Próximos pasos después del deploy

1. Configurar CI/CD (Vercel ya lo hace automáticamente con cada push a main)
2. Configurar dominios adicionales (www, api, etc.)
3. Agregar SSL/HTTPS (Vercel lo hace automáticamente)
4. Configurar analytics y monitoring
5. Configurar variables de entorno por ambiente (production, preview, development)
