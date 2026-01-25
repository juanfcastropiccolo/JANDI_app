# Instrucciones de Setup - JANDI

## ✅ Fase 1 Completada: Setup Inicial

### Archivos Creados

#### 1. Base de Datos
- ✅ `SUPABASE_SCHEMA.sql` - Schema completo con 11 tablas y RLS

#### 2. Configuración
- ✅ `chat-client/.env.local.example` - Variables de entorno frontend
- ✅ `business_agent/.env.example` - Variables de entorno backend

#### 3. Tipos TypeScript
- ✅ `chat-client/types/auth.types.ts`
- ✅ `chat-client/types/onboarding.types.ts`
- ✅ `chat-client/types/business.types.ts`

#### 4. Servicios
- ✅ `chat-client/services/supabase.ts`
- ✅ `chat-client/services/auth.service.ts`
- ✅ `chat-client/services/onboarding.service.ts`

#### 5. Hooks
- ✅ `chat-client/hooks/useAuth.ts`
- ✅ `chat-client/hooks/useOnboarding.ts`

#### 6. Contexts
- ✅ `chat-client/contexts/AuthContext.tsx`
- ✅ `chat-client/contexts/OnboardingContext.tsx`

#### 7. Componentes Compartidos
- ✅ `chat-client/components/Shared/LoadingSpinner.tsx`
- ✅ `chat-client/components/Shared/ErrorMessage.tsx`
- ✅ `chat-client/components/Shared/SuccessMessage.tsx`

#### 8. Dependencias Instaladas
- ✅ @supabase/supabase-js
- ✅ react-router-dom
- ✅ @heroicons/react
- ✅ framer-motion

---

## 📝 Pasos Siguientes para Configurar Supabase

### 1. Ejecutar el Schema SQL

1. Ve a tu proyecto de Supabase: https://bstddwmpsbfrwqaudkai.supabase.co
2. Navega a **SQL Editor** en el menú lateral
3. Crea un nuevo query
4. Copia y pega el contenido completo de `SUPABASE_SCHEMA.sql`
5. Ejecuta el script (Run)

Esto creará:
- 11 tablas con sus índices
- Triggers para actualizar `updated_at`
- Políticas de Row Level Security (RLS)
- Funciones útiles

### 2. Configurar Storage Buckets

En **Storage** del dashboard de Supabase, crea los siguientes buckets:

#### Bucket: `business-documents` (Privado)
```sql
-- Política de acceso
CREATE POLICY "Business owners can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Business owners can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'business-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Bucket: `business-logos` (Público)
- Configurar como público
- Permitir uploads de imágenes (jpg, png, webp)
- Límite de tamaño: 5MB

#### Bucket: `product-images` (Público)
- Configurar como público
- Permitir uploads de imágenes
- Límite de tamaño: 10MB

#### Bucket: `user-avatars` (Público)
- Configurar como público
- Permitir uploads de imágenes
- Límite de tamaño: 2MB

### 3. Configurar Google OAuth

1. Ve a **Authentication > Providers** en Supabase
2. Habilita **Google**
3. Necesitarás crear un proyecto en Google Cloud Console:

#### En Google Cloud Console:
1. Ve a https://console.cloud.google.com/
2. Crea un nuevo proyecto: "JANDI"
3. Habilita **Google+ API**
4. Ve a **APIs & Services > OAuth consent screen**
   - User Type: External
   - App name: JANDI
   - User support email: [tu email]
   - Authorized domains: `bstddwmpsbfrwqaudkai.supabase.co`
5. Ve a **Credentials > Create Credentials > OAuth 2.0 Client ID**
   - Application type: Web application
   - Name: JANDI Web Client
   - Authorized JavaScript origins:
     - `http://localhost:5173`
     - `https://bstddwmpsbfrwqaudkai.supabase.co`
   - Authorized redirect URIs:
     - `http://localhost:5173/auth/callback`
     - `https://bstddwmpsbfrwqaudkai.supabase.co/auth/v1/callback`

6. Copia el **Client ID** y **Client Secret**
7. Pégalos en la configuración de Google en Supabase

### 4. Configurar Variables de Entorno

#### Frontend (`chat-client/.env.local`)
```bash
cp .env.local.example .env.local
```

Edita `.env.local` y completa:
- `VITE_SUPABASE_ANON_KEY`: Obtener de Supabase > Settings > API > anon public
- `VITE_GOOGLE_CLIENT_ID`: El Client ID de Google Cloud Console

#### Backend (`business_agent/.env`)
```bash
cp .env.example .env
```

Edita `.env` y completa:
- `SUPABASE_KEY`: Obtener de Supabase > Settings > API > service_role (¡SECRETO!)
- `SUPABASE_DB_URL`: postgresql://postgres:[PASSWORD]@db.bstddwmpsbfrwqaudkai.supabase.co:5432/postgres
  - Reemplazar [PASSWORD] con tu contraseña de Supabase
- `GOOGLE_API_KEY`: Tu API key de Google Cloud
- `GOOGLE_PROJECT_ID`: Tu project ID de Google Cloud

### 5. Obtener Credenciales de Supabase

1. Ve a **Settings > API** en tu proyecto de Supabase
2. Copia:
   - **Project URL**: Ya lo tienes (https://bstddwmpsbfrwqaudkai.supabase.co)
   - **anon public**: Para VITE_SUPABASE_ANON_KEY
   - **service_role**: Para SUPABASE_KEY (backend)
3. Ve a **Settings > Database**
4. Copia la **Connection string** (modo URI) para SUPABASE_DB_URL

---

## 🚀 Próximos Pasos de Desarrollo

### Fase 2: Sistema de Autenticación (En Progreso)
Los siguientes componentes se crearán a continuación:
- Landing Page
- Login Form
- Register Form
- Google Auth Button
- Auth Layout

### Fase 3: Onboarding de Usuario
- Onboarding Container con animaciones
- 5 pantallas de onboarding
- Step Indicator
- Navigation Buttons

### Fase 4: Portal de Comercios
- Business Landing Page
- Business Registration (6 pasos)
- Document Upload
- UCP Configuration

### Fase 5: Integración Backend
- Google ADK setup
- UCP tools
- Supabase integration desde Python

---

## 🧪 Testing

Una vez completada la configuración, puedes probar:

```bash
# Frontend
cd chat-client
npm run dev

# Backend (después de Fase 5)
cd business_agent
python -m uvicorn main:app --reload
```

---

## 📚 Recursos

- [Supabase Docs](https://supabase.com/docs)
- [UCP Specification](https://ucp.dev/specification/overview/)
- [Google ADK](https://google.github.io/adk-docs/)
- [React Router](https://reactrouter.com/)
- [Framer Motion](https://www.framer.com/motion/)

---

## ⚠️ Notas Importantes

1. **NUNCA** commitear archivos `.env` con credenciales reales
2. El `service_role` key de Supabase es **SECRETO** - solo para backend
3. Las políticas RLS protegen los datos - no modificarlas sin entender el impacto
4. Los tokens de pago son mockup - en producción usar Mercado Pago real
5. Backup de la base de datos regularmente

---

## 🐛 Troubleshooting

### Error: "Missing Supabase environment variables"
- Verifica que `.env.local` existe y tiene las variables correctas
- Reinicia el servidor de desarrollo

### Error: "Invalid API key"
- Verifica que copiaste la key correcta de Supabase
- Asegúrate de usar `anon public` en frontend y `service_role` en backend

### Error: "Google OAuth not working"
- Verifica que las redirect URIs están correctamente configuradas
- Asegúrate de que el dominio está autorizado en Google Cloud Console

### Error: "RLS policy violation"
- Verifica que el usuario está autenticado
- Revisa las políticas RLS en la tabla correspondiente

---

**Estado Actual:** ✅ Fase 1 Completada | 🔄 Fase 2 En Progreso
