-- AI Personal Stylist — esquema inicial (MVP)
-- Fuente de verdad del modelo de datos. Documentado en docs/producto/DATA_MODEL.md.
-- La aplica Felipe en el SQL Editor de Supabase (DT-14). Idempotente: se puede correr dos veces.
-- Principio (DT-02): toda tabla de usuario lleva user_id y RLS `auth.uid() = user_id`. Sin service role.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles: una fila por persona, creada por trigger al registrarse
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  city text not null default 'Santiago',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- style_profiles: perfil de imagen estructurado (memoria capa 1)
-- ---------------------------------------------------------------------------
create table if not exists public.style_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  clothing_sections text[] not null default '{}',      -- 'mujer' | 'hombre' | 'unisex'
  current_style text[] not null default '{}',          -- etiquetas libres: 'casual', 'clasico', ...
  aspirational_style text[] not null default '{}',
  occasions text[] not null default '{}',              -- 'oficina', 'citas', 'eventos', ...
  fit_preferences text[] not null default '{}',        -- 'holgado', 'entallado', 'tiro alto', ...
  comfort_constraints text[] not null default '{}',    -- 'sin tacos', 'sin lana', ...
  colors_disliked text[] not null default '{}',
  brands_liked text[] not null default '{}',
  brands_excluded text[] not null default '{}',
  sizes jsonb not null default '{}'::jsonb,            -- { "top": "M", "bottom": "40", "shoes": "38" }
  budget_monthly_clp integer check (budget_monthly_clp is null or budget_monthly_clp >= 0),
  budget_per_item_clp integer check (budget_per_item_clp is null or budget_per_item_clp >= 0),
  risk_level smallint check (risk_level is null or risk_level between 1 and 3), -- 1 seguro · 3 atrevido
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- color_analyses: paleta preliminar (DP-05). Una activa por persona.
-- ---------------------------------------------------------------------------
create table if not exists public.color_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  photo_path text,                                     -- null si fue elegida a mano
  season text not null check (season in ('primavera', 'verano', 'otono', 'invierno')),
  undertone text not null check (undertone in ('calido', 'frio', 'neutro')),
  contrast text not null check (contrast in ('bajo', 'medio', 'alto')),
  confidence text not null check (confidence in ('baja', 'media', 'alta')),
  lighting_ok boolean not null default true,
  recommended jsonb not null default '[]'::jsonb,      -- [{ "name": "terracota", "hex": "#B5654A" }]
  neutrals jsonb not null default '[]'::jsonb,
  avoid jsonb not null default '[]'::jsonb,
  rationale text not null default '',
  source text not null default 'ai' check (source in ('ai', 'manual')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index if not exists color_analyses_one_active
  on public.color_analyses (user_id) where is_active;

-- ---------------------------------------------------------------------------
-- garments: clóset digital
-- ---------------------------------------------------------------------------
create table if not exists public.garments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  photo_path text not null,
  name text not null default '',
  category text not null default 'top'
    check (category in ('top', 'bottom', 'dress', 'outerwear', 'shoes', 'bag', 'accessory')),
  subcategory text not null default '',                -- 'camisa', 'jeans', 'zapatillas', ...
  colors jsonb not null default '[]'::jsonb,           -- [{ "name": "azul marino", "hex": "#1F2A44" }]
  pattern text not null default 'liso',
  material text not null default '',
  seasons text[] not null default '{}',                -- 'verano' | 'invierno' | 'entretiempo'
  occasions text[] not null default '{}',
  formality smallint not null default 2 check (formality between 1 and 5), -- 1 deportivo · 5 gala
  brand text not null default '',
  status text not null default 'processing' check (status in ('processing', 'ready', 'failed')),
  user_edited boolean not null default false,
  favorite boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists garments_user_idx on public.garments (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- conversations / messages: historial del agente (memoria capa 3)
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists conversations_user_idx on public.conversations (user_id, updated_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  text text not null default '',                       -- texto visible del turno
  parts jsonb not null default '[]'::jsonb,            -- [{ "type": "outfit", "outfit_id": "..." }, { "type": "image", "path": "..." }]
  created_at timestamptz not null default now()
);
create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- outfits / outfit_items: la unidad de valor (DP-02)
-- ---------------------------------------------------------------------------
create table if not exists public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  conversation_id uuid references public.conversations (id) on delete set null,
  title text not null,
  occasion text not null default '',
  rationale text not null default '',                  -- por qué funciona (DP-11)
  weather jsonb,                                       -- { "temp_min": 9, "temp_max": 21, "summary": "..." }
  missing_piece jsonb,                                 -- { "category": "shoes", "description": "...", "why": "..." } (DP-07)
  status text not null default 'proposed' check (status in ('proposed', 'saved', 'discarded')),
  created_at timestamptz not null default now()
);
create index if not exists outfits_user_idx on public.outfits (user_id, created_at desc);

create table if not exists public.outfit_items (
  outfit_id uuid not null references public.outfits (id) on delete cascade,
  garment_id uuid not null references public.garments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  position smallint not null default 0,
  primary key (outfit_id, garment_id)
);

create table if not exists public.outfit_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  outfit_id uuid not null references public.outfits (id) on delete cascade,
  rating text not null check (rating in ('love', 'ok', 'no')),
  reason text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, outfit_id)
);

-- ---------------------------------------------------------------------------
-- memory_facts: lo que el agente aprende (memoria capa 2). Visible y borrable por la persona.
-- ---------------------------------------------------------------------------
create table if not exists public.memory_facts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  fact text not null check (char_length(fact) between 3 and 280),
  kind text not null default 'preference' check (kind in ('preference', 'dislike', 'context', 'fit')),
  source text not null default 'chat' check (source in ('onboarding', 'chat', 'feedback')),
  created_at timestamptz not null default now()
);
create index if not exists memory_facts_user_idx on public.memory_facts (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- consents: consentimiento granular y versionado
-- ---------------------------------------------------------------------------
create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('terms', 'photo_processing', 'face_photo')),
  version text not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index if not exists consents_user_idx on public.consents (user_id, kind);

-- ---------------------------------------------------------------------------
-- analytics_events: eventos de producto (DT-12). Solo insert propio; sin lectura desde el cliente.
-- ---------------------------------------------------------------------------
create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists analytics_events_name_idx on public.analytics_events (name, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.style_profiles enable row level security;
alter table public.color_analyses enable row level security;
alter table public.garments enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.outfits enable row level security;
alter table public.outfit_items enable row level security;
alter table public.outfit_feedback enable row level security;
alter table public.memory_facts enable row level security;
alter table public.consents enable row level security;
alter table public.analytics_events enable row level security;

drop policy if exists profiles_own on public.profiles;
create policy profiles_own on public.profiles for all to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

do $$
declare t text;
begin
  foreach t in array array[
    'style_profiles', 'color_analyses', 'garments', 'conversations', 'messages',
    'outfits', 'outfit_items', 'outfit_feedback', 'memory_facts', 'consents'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_own', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t || '_own', t
    );
  end loop;
end $$;

drop policy if exists analytics_events_insert_own on public.analytics_events;
create policy analytics_events_insert_own on public.analytics_events for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Triggers: perfil al registrarse, updated_at
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  insert into public.style_profiles (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['profiles', 'style_profiles', 'garments', 'conversations'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_touch', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.touch_updated_at()',
      t || '_touch', t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Derecho de borrado: la persona elimina todos sus datos (las fotos se borran desde el cliente antes).
-- ---------------------------------------------------------------------------
create or replace function public.delete_my_data()
returns void language plpgsql security invoker set search_path = '' as $$
declare uid uuid := (select auth.uid());
begin
  if uid is null then raise exception 'not authenticated'; end if;
  delete from public.outfits where user_id = uid;
  delete from public.conversations where user_id = uid;
  delete from public.garments where user_id = uid;
  delete from public.color_analyses where user_id = uid;
  delete from public.memory_facts where user_id = uid;
  delete from public.consents where user_id = uid;
  update public.style_profiles set
    clothing_sections = '{}', current_style = '{}', aspirational_style = '{}', occasions = '{}',
    fit_preferences = '{}', comfort_constraints = '{}', colors_disliked = '{}', brands_liked = '{}',
    brands_excluded = '{}', sizes = '{}'::jsonb, budget_monthly_clp = null, budget_per_item_clp = null,
    risk_level = null
  where user_id = uid;
  update public.profiles set display_name = null, onboarding_completed_at = null where id = uid;
end $$;
revoke all on function public.delete_my_data() from public, anon;
grant execute on function public.delete_my_data() to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: bucket privado user-media, ruta {user_id}/{kind}/{uuid}.jpg (DT-04)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('user-media', 'user-media', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists user_media_select_own on storage.objects;
create policy user_media_select_own on storage.objects for select to authenticated
  using (bucket_id = 'user-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists user_media_insert_own on storage.objects;
create policy user_media_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'user-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists user_media_delete_own on storage.objects;
create policy user_media_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'user-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
