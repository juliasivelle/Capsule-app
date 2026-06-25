-- Profil enrichi (copie conforme du prototype) — Capsule
--
-- Le prototype collecte un profil plus riche que le schéma initial :
--   • style en SÉLECTION MULTIPLE (plusieurs esthétiques) → nouvelle colonne `styles text[]`
--   • le genre recherché (Femme / Homme / Enfant)        → nouvelle colonne `gender text`
--
-- On CONSERVE la colonne `style text` existante (mono-valeur) pour
-- compatibilité : le frontend y écrit styles[0]. Aucune donnée détruite.
--
-- À appliquer dans Supabase Dashboard → SQL Editor (idempotent).

alter table public.profile_preferences
  add column if not exists styles text[] default '{}';

alter table public.profile_preferences
  add column if not exists gender text;

-- Backfill : pour les profils existants, initialise styles[] à partir de style
update public.profile_preferences
set styles = array[style]
where style is not null
  and (styles is null or cardinality(styles) = 0);
