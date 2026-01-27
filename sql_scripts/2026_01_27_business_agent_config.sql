-- 2026-01-27: Business agent configuration (A2A + internal business config + UCP profile support)
-- Objetivo:
-- - Persistir configuración one-time del negocio (sin exponer UCP/A2A en el frontend)
-- - Guardar snapshots en DB para regenerar Agent Card (A2A) y UCP Profile
-- - Soportar importaciones de catálogo por CSV
--
-- NOTA:
-- - Este script es DDL: aplicarlo como migration en Supabase.
-- - Mantiene compatibilidad con el esquema actual (solo agrega).

begin;

-- ---------------------------------------------------------------------------
-- 1) Expandir public.businesses
-- ---------------------------------------------------------------------------

alter table public.businesses
  add column if not exists operating_regions text[] not null default '{}'::text[],
  add column if not exists delivery_methods jsonb not null default '{"delivery": true, "pickup": false}'::jsonb,
  add column if not exists delivery_zones text[] not null default '{}'::text[],
  add column if not exists estimated_delivery_time_min integer,
  add column if not exists estimated_delivery_time_max integer,
  add column if not exists pickup_preparation_time_minutes integer,
  add column if not exists payment_methods_supported jsonb not null default '{}'::jsonb,
  add column if not exists payment_timing text,
  add column if not exists return_policy text,
  add column if not exists refund_policy text,
  add column if not exists cancellation_window_minutes integer,
  add column if not exists business_contact_email text,
  add column if not exists business_contact_phone text,
  add column if not exists responsible_person_name text,
  add column if not exists catalog_source_type text not null default 'manual',
  add column if not exists price_currency text not null default 'ARS',
  add column if not exists agent_card jsonb not null default '{}'::jsonb,
  add column if not exists business_config jsonb not null default '{}'::jsonb;

-- Constraints (crear solo si no existen)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'businesses_payment_timing_check'
      and conrelid = 'public.businesses'::regclass
  ) then
    alter table public.businesses
      add constraint businesses_payment_timing_check
      check (payment_timing is null or payment_timing in ('online', 'on_delivery', 'both'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'businesses_catalog_source_type_check'
      and conrelid = 'public.businesses'::regclass
  ) then
    alter table public.businesses
      add constraint businesses_catalog_source_type_check
      check (catalog_source_type in ('manual', 'csv', 'api'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'businesses_estimated_delivery_time_check'
      and conrelid = 'public.businesses'::regclass
  ) then
    alter table public.businesses
      add constraint businesses_estimated_delivery_time_check
      check (
        (estimated_delivery_time_min is null and estimated_delivery_time_max is null)
        or (
          estimated_delivery_time_min is not null
          and estimated_delivery_time_max is not null
          and estimated_delivery_time_min >= 0
          and estimated_delivery_time_max >= estimated_delivery_time_min
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'businesses_pickup_prep_time_check'
      and conrelid = 'public.businesses'::regclass
  ) then
    alter table public.businesses
      add constraint businesses_pickup_prep_time_check
      check (pickup_preparation_time_minutes is null or pickup_preparation_time_minutes >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'businesses_cancellation_window_check'
      and conrelid = 'public.businesses'::regclass
  ) then
    alter table public.businesses
      add constraint businesses_cancellation_window_check
      check (cancellation_window_minutes is null or cancellation_window_minutes >= 0);
  end if;
end
$$;

-- Índices (búsquedas y filtros)
create index if not exists businesses_operating_regions_gin
  on public.businesses using gin (operating_regions);

create index if not exists businesses_agent_card_gin
  on public.businesses using gin (agent_card);

create index if not exists businesses_business_config_gin
  on public.businesses using gin (business_config);

-- ---------------------------------------------------------------------------
-- 2) Tabla para importaciones de catálogo (CSV)
-- ---------------------------------------------------------------------------

create table if not exists public.business_catalog_imports (
  id uuid primary key default extensions.uuid_generate_v4(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  source_type text not null default 'csv',
  file_url text not null,
  status text not null default 'pending',
  error text,
  processed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

alter table public.business_catalog_imports enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'business_catalog_imports_source_type_check'
      and conrelid = 'public.business_catalog_imports'::regclass
  ) then
    alter table public.business_catalog_imports
      add constraint business_catalog_imports_source_type_check
      check (source_type in ('csv'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'business_catalog_imports_status_check'
      and conrelid = 'public.business_catalog_imports'::regclass
  ) then
    alter table public.business_catalog_imports
      add constraint business_catalog_imports_status_check
      check (status in ('pending', 'processing', 'completed', 'failed'));
  end if;
end
$$;

create index if not exists business_catalog_imports_business_id_idx
  on public.business_catalog_imports (business_id);

create index if not exists business_catalog_imports_status_idx
  on public.business_catalog_imports (status);

-- RLS policies: mismo patrón actual (ownership por email del negocio vs auth.jwt email)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'business_catalog_imports'
      and policyname = 'Business owners can manage their catalog imports'
  ) then
    create policy "Business owners can manage their catalog imports"
      on public.business_catalog_imports
      as permissive
      for all
      to public
      using (
        exists (
          select 1
          from public.businesses
          where businesses.id = business_catalog_imports.business_id
            and businesses.email::text = (auth.jwt() ->> 'email'::text)
        )
      )
      with check (
        exists (
          select 1
          from public.businesses
          where businesses.id = business_catalog_imports.business_id
            and businesses.email::text = (auth.jwt() ->> 'email'::text)
        )
      );
  end if;
end
$$;

commit;

