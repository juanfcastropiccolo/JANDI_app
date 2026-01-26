# Configuración de OAuth Callbacks - JANDI

## 🔴 CRÍTICO: URLs que debes configurar

### 1. Configuración en Supabase Dashboard

**URL del Dashboard:** https://supabase.com/dashboard/project/bstddwmpsbfrwqaudkai

#### A. URL Configuration (Authentication → URL Configuration)

**Site URL:**
```
https://jandi.com.ar
```

**Redirect URLs (agregar ambos):**
```
https://jandi.com.ar/auth/callback
http://localhost:5173/auth/callback
```

**NOTA:** Supabase permite múltiples Redirect URLs. Asegúrate de agregar ambos (producción y desarrollo).

---

### 2. Configuración en Google Cloud Console

**URL del Console:** https://console.cloud.google.com/apis/credentials

**Tu Client ID:** `123981717304-8ct85hepu58chuci6nivr9gdlm055q80`

#### A. Orígenes de JavaScript autorizados

Agregar estos 3 orígenes:
```
https://jandi.com.ar
https://bstddwmpsbfrwqaudkai.supabase.co
http://localhost:5173
```

#### B. URIs de redireccionamiento autorizados

Agregar SOLO este (el de Supabase, NO el de tu app):
```
https://bstddwmpsbfrwqaudkai.supabase.co/auth/v1/callback
```

**⚠️ IMPORTANTE:** Google OAuth redirige a Supabase primero, y Supabase luego redirige a tu app. Por eso el URI de redireccionamiento autorizado es el de Supabase, NO el de tu app.

---

### 3. Variables de Entorno en Vercel

**URL del Proyecto:** https://vercel.com/dashboard → Tu proyecto → Settings → Environment Variables

Verificar que estas variables estén configuradas para **Production**:

```env
VITE_SUPABASE_URL=https://bstddwmpsbfrwqaudkai.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzdGRkd21wc2JmcndxYXVka2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNjA2ODgsImV4cCI6MjA4NDkzNjY4OH0.1aw4JJP6ISHnPDbBDnoVlVNYdqS-IO8mtv2DzpOnDjo
VITE_GOOGLE_CLIENT_ID=123981717304-8ct85hepu58chuci6nivr9gdlm055q80.apps.googleusercontent.com
VITE_APP_URL=https://jandi.com.ar
VITE_ENABLE_GOOGLE_AUTH=true
```

---

## 🔄 Flujo de Autenticación (Para Entender)

```
Usuario → Click "Google Login"
    ↓
Google OAuth (consent screen)
    ↓
Google redirige a: https://bstddwmpsbfrwqaudkai.supabase.co/auth/v1/callback?code=...
    ↓
Supabase procesa el código
    ↓
Supabase redirige a: https://jandi.com.ar/auth/callback?code=...
    ↓
Tu app (AuthCallback.tsx) intercambia el código por sesión
    ↓
Redirige a /chat o /onboarding
```

---

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"
- **Causa:** El redirect URI no está autorizado en Google Cloud Console
- **Solución:** Verifica que `https://bstddwmpsbfrwqaudkai.supabase.co/auth/v1/callback` esté en la lista

### Error: "Invalid Redirect URL"
- **Causa:** El redirect URL no está autorizado en Supabase
- **Solución:** Agrega `https://jandi.com.ar/auth/callback` en Supabase → URL Configuration

### Error: "AbortError: signal is aborted"
- **Causa:** Request cancelado (normal durante unmount de componentes)
- **Solución:** Ya está manejado en el código, este error se puede ignorar

### Callback se queda cargando infinitamente
- **Causa:** El código OAuth ya fue usado o expiró
- **Solución:** 
  1. Limpia las cookies del navegador
  2. Vuelve a intentar el login
  3. Verifica en Console del navegador si hay errores específicos

---

## ✅ Checklist de Verificación

Marca cada item después de verificarlo:

- [ ] **Supabase - Site URL:** `https://jandi.com.ar` configurado
- [ ] **Supabase - Redirect URLs:** Ambos URLs agregados (prod y local)
- [ ] **Google Cloud - JavaScript Origins:** Los 3 orígenes agregados
- [ ] **Google Cloud - Redirect URIs:** El URI de Supabase agregado
- [ ] **Vercel - Environment Variables:** Todas las variables configuradas
- [ ] **DNS:** jandi.com.ar apunta a Vercel
- [ ] **Vercel:** Último deployment exitoso
- [ ] **Test:** Login con Google funciona en producción

---

## 📝 Notas Adicionales

- Después de cambiar configuración en Google Cloud Console, puede tomar unos minutos en propagarse
- Después de cambiar Redirect URLs en Supabase, los cambios son inmediatos
- Después de cambiar Environment Variables en Vercel, necesitas redesplegar
- Los códigos OAuth solo se pueden usar una vez y expiran en ~10 minutos

---

## 🆘 ¿Todavía no funciona?

Si después de verificar todo lo anterior el problema persiste:

1. **Revisa los logs del navegador** (Console + Network tab)
2. **Revisa los logs de Supabase** (Dashboard → Logs → Auth Logs)
3. **Intenta con una ventana de incógnito** (para descartar problemas de caché)
4. **Verifica que el dominio esté funcionando:** https://jandi.com.ar debe cargar correctamente
