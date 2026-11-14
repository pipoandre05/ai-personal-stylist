-- AI Personal Stylist — contrato v2: dos looks para elegir, evidencia y opción de compra elegida.
-- Se aplica DESPUÉS de 20261114010000_integridad_y_borrado.sql. Idempotente y solo aditiva: no borra ni cambia nada existente.
-- Origen: docs/superpowers/specs/2026-11-14-contrato-v2.md (C-2, C-5 y decisión de dos looks D-04).
--
-- Qué NO necesita migración (va en messages.parts, que ya existe): pasos de trabajo (C-1), resumen del evento (C-8),
-- botones de refinamiento (C-3), opciones de compra (C-4) y la marca de la opción elegida dentro del hilo (C-5).
-- Estas columnas solo agregan lo que "Tus looks" y la analítica necesitan sin recorrer conversaciones.
--
-- No crea tablas: por eso no hay políticas RLS nuevas ni FK compuestas (id, user_id). Las columnas viven en `outfits`,
-- que ya tiene RLS por fila (outfits_own: auth.uid() = user_id) y cuya FK compuesta con conversations quedó en la migración anterior.

-- Dos looks para elegir: cuál es cada uno y a qué par pertenece (señal de gusto: cuál guarda la persona).
alter table public.outfits add column if not exists variant text;
alter table public.outfits add column if not exists pair_id uuid;

-- "En qué me basé": [{ "kind": "palette"|"weather"|"closet"|"occasion", "label": "...", "swatches": ["#8E9A7E"] }]
alter table public.outfits add column if not exists evidence jsonb;

-- Opción de compra que la persona eligió para la pieza faltante (copia de la ProductOption que se le mostró).
-- Elegir NO compra nada (DP-09): solo marca la opción para ver cómo queda el look.
alter table public.outfits add column if not exists selected_option jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'outfits_variant_check') then
    alter table public.outfits add constraint outfits_variant_check
      check (variant is null or variant in ('seguro', 'atrevido'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'outfits_evidence_array_check') then
    alter table public.outfits add constraint outfits_evidence_array_check
      check (evidence is null or jsonb_typeof(evidence) = 'array');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'outfits_selected_option_object_check') then
    alter table public.outfits add constraint outfits_selected_option_object_check
      check (selected_option is null or jsonb_typeof(selected_option) = 'object');
  end if;
end $$;

create index if not exists outfits_pair_idx on public.outfits (user_id, pair_id) where pair_id is not null;
