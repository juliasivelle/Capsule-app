// Orchestrateur du pipeline produit Capsule.
// Appelé par pg_cron chaque nuit — déclenche sync-awin-feed,
// puis transform-products UNIQUEMENT si le sync a réussi.

const SUPABASE_URL          = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;

async function callFunction(name: string): Promise<{ ok: boolean; body: unknown }> {
  const res = await fetch(`${FUNCTIONS_BASE}/${name}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE}`,
      "Content-Type": "application/json",
    },
  });
  const body = await res.json().catch(() => ({ error: "unparseable response" }));
  return { ok: res.ok, body };
}

async function logPipeline(
  status: "success" | "error" | "partial",
  detail: string,
  durationMs: number,
) {
  await fetch(`${SUPABASE_URL}/rest/v1/sync_logs`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE}`,
      "apikey": SUPABASE_SERVICE_ROLE,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({
      function_name: "run-pipeline",
      status,
      error_detail: detail || null,
      duration_ms: durationMs,
    }),
  });
}

Deno.serve(async (_req) => {
  const started = Date.now();
  console.log("=== PIPELINE START ===");

  // Étape 1 — sync-awin-feed
  console.log("Étape 1: sync-awin-feed...");
  const syncResult = await callFunction("sync-awin-feed").catch(e => ({
    ok: false,
    body: { error: String(e) },
  }));

  console.log("sync-awin-feed résultat:", JSON.stringify(syncResult.body));

  if (!syncResult.ok) {
    const detail = `sync-awin-feed a échoué : ${JSON.stringify(syncResult.body)}`;
    console.error(detail);
    await logPipeline("error", detail, Date.now() - started);
    return new Response(JSON.stringify({ error: detail }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Étape 2 — transform-products (uniquement si sync OK)
  console.log("Étape 2: transform-products...");
  const transformResult = await callFunction("transform-products").catch(e => ({
    ok: false,
    body: { error: String(e) },
  }));

  console.log("transform-products résultat:", JSON.stringify(transformResult.body));

  const duration = Date.now() - started;

  if (!transformResult.ok) {
    const detail = `transform-products a échoué : ${JSON.stringify(transformResult.body)}`;
    console.error(detail);
    await logPipeline("partial", detail, duration);
    return new Response(JSON.stringify({
      sync: syncResult.body,
      transform: { error: detail },
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const summary = {
    sync: syncResult.body,
    transform: transformResult.body,
    duration_ms: duration,
  };

  await logPipeline("success", "", duration);
  console.log("=== PIPELINE OK ===", JSON.stringify(summary));

  return new Response(JSON.stringify(summary), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
