-- Pipeline nightly automatisé — Capsule
--
-- Prérequis (à faire UNE FOIS dans Supabase Dashboard) :
--   1. Database → Extensions → activer pg_cron
--   2. Database → Extensions → activer pg_net
--   3. Déployer les 3 Edge Functions : sync-awin-feed, transform-products, run-pipeline
--
-- La Edge Function run-pipeline orchestre les deux étapes avec gestion d'erreur :
-- sync-awin-feed réussit → transform-products se lance
-- sync-awin-feed échoue → transform-products ne se lance PAS, erreur dans sync_logs

-- Supprime le job existant si on réexécute (idempotent)
do $$
begin
  if exists (select 1 from cron.job where jobname = 'capsule-pipeline-nightly') then
    perform cron.unschedule('capsule-pipeline-nightly');
  end if;
end $$;

-- Planifie le pipeline à 3h UTC tous les jours
-- 3h UTC = 4h Paris (UTC+1 hiver) = 5h Paris (UTC+2 été)
select cron.schedule(
  'capsule-pipeline-nightly',
  '0 3 * * *',
  $$
  select net.http_post(
    url     := 'https://dyrbhjmcixbpeultzbzq.supabase.co/functions/v1/run-pipeline',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5cmJoam1jaXhicGV1bHR6YnpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMTEyNDEsImV4cCI6MjA5NzY4NzI0MX0.nHF78d7Eahd_N7vD_qO4tuTtaCBUga9iWadHxKwoO1I", "Content-Type": "application/json"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);
