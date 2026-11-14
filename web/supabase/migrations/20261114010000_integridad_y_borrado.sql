-- AI Personal Stylist — integridad entre personas, borrado completo y medición del reconocimiento.
-- Se aplica DESPUÉS de 20261114000000_esquema_inicial.sql. Idempotente.
-- Origen: revisión de arquitectura (DECISION_LOG §6, R-02 y R-19 a R-21).

-- ---------------------------------------------------------------------------
-- R-19 · Referencias cruzadas entre personas.
-- RLS solo mira el user_id de la fila propia y las FK se verifican sin RLS: sin esto, una persona
-- podría enlazar en sus filas el UUID de una prenda, outfit o conversación ajena.
-- Solución: FK compuestas (id, user_id) → la fila referenciada debe ser de la misma persona.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'garments_id_user_key') then
    alter table public.garments add constraint garments_id_user_key unique (id, user_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'outfits_id_user_key') then
    alter table public.outfits add constraint outfits_id_user_key unique (id, user_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'conversations_id_user_key') then
    alter table public.conversations add constraint conversations_id_user_key unique (id, user_id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'outfit_items_outfit_owner_fk') then
    alter table public.outfit_items add constraint outfit_items_outfit_owner_fk
      foreign key (outfit_id, user_id) references public.outfits (id, user_id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'outfit_items_garment_owner_fk') then
    alter table public.outfit_items add constraint outfit_items_garment_owner_fk
      foreign key (garment_id, user_id) references public.garments (id, user_id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'outfit_feedback_outfit_owner_fk') then
    alter table public.outfit_feedback add constraint outfit_feedback_outfit_owner_fk
      foreign key (outfit_id, user_id) references public.outfits (id, user_id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'messages_conversation_owner_fk') then
    alter table public.messages add constraint messages_conversation_owner_fk
      foreign key (conversation_id, user_id) references public.conversations (id, user_id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'outfits_conversation_owner_fk') then
    -- "set null (conversation_id)": al borrar la conversación solo se anula esa columna, no user_id.
    alter table public.outfits add constraint outfits_conversation_owner_fk
      foreign key (conversation_id, user_id) references public.conversations (id, user_id)
      on delete set null (conversation_id);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- R-20 · Medir el reconocimiento (supuesto S-01): se guarda lo que propuso la IA para compararlo
-- con lo que la persona corrigió. R-21 · Momento en que se guardó un look.
-- ---------------------------------------------------------------------------
alter table public.garments add column if not exists ai_recognition jsonb;
alter table public.outfits add column if not exists saved_at timestamptz;

-- ---------------------------------------------------------------------------
-- R-02 · Borrado completo.
-- ---------------------------------------------------------------------------
drop policy if exists analytics_events_delete_own on public.analytics_events;
create policy analytics_events_delete_own on public.analytics_events for delete to authenticated
  using ((select auth.uid()) = user_id);

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
  delete from public.analytics_events where user_id = uid;
  -- Los consentimientos se conservan mientras exista la cuenta: son el registro de lo que se aceptó.
  update public.style_profiles set
    clothing_sections = '{}', current_style = '{}', aspirational_style = '{}', occasions = '{}',
    fit_preferences = '{}', comfort_constraints = '{}', colors_disliked = '{}', brands_liked = '{}',
    brands_excluded = '{}', sizes = '{}'::jsonb, budget_monthly_clp = null, budget_per_item_clp = null,
    risk_level = null
  where user_id = uid;
  update public.profiles set display_name = null, city = 'Santiago', onboarding_completed_at = null
  where id = uid;
end $$;
revoke all on function public.delete_my_data() from public, anon;
grant execute on function public.delete_my_data() to authenticated;

-- Eliminar la cuenta: borra la fila propia de auth.users y, por cascada, todo lo demás.
-- security definer acotado a auth.uid(): evita exponer una clave de service role (DT-02).
-- Las fotos del bucket se borran desde el cliente antes de llamar.
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid());
begin
  if uid is null then raise exception 'not authenticated'; end if;
  delete from auth.users where id = uid;
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
