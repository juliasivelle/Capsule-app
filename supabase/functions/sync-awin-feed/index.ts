import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Config ───────────────────────────────────────────────────
const TEST_MODE             = Deno.env.get("TEST_MODE") === "true";
const SUPABASE_URL          = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const AWIN_API_TOKEN        = Deno.env.get("AWIN_API_TOKEN") ?? "";

// ─── Types ────────────────────────────────────────────────────
interface AwinRow {
  aw_product_id:       string;
  merchant_product_id: string;
  merchant_image_url:  string;
  aw_image_url:        string;
  product_name:        string;
  merchant_name:       string;
  merchant_id:         string;
  merchant_category:   string;
  description:         string;
  buy_url:             string;
  in_stock:            string;
  search_price:        string;
  currency_symbol:     string;
  dimensions:          string; // sizes, semicolon-separated
  colour:              string;
  [key: string]: string;
}

interface MerchantRecord {
  id:               string;
  awin_merchant_id: string;
  name:             string;
  feed_url:         string | null;
  feed_format:      string;
}

interface SyncResult {
  merchant:  string;
  upserted:  number;
  skipped:   number;
  errors:    number;
  durationMs: number;
}

// ─── CSV parser (no external dep) ────────────────────────────
function parseCSV(text: string): AwinRow[] {
  const lines = text.trim().split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]);
  const rows: AwinRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i]);
    if (values.length < headers.length) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h.trim()] = (values[idx] ?? "").trim(); });
    rows.push(row as AwinRow);
  }
  return rows;
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === "," && !inQuotes) {
      result.push(current); current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ─── XML parser (minimal — Awin ItemFeed format) ──────────────
function parseXML(text: string): AwinRow[] {
  const items = [...text.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
  return items.map(([, block]) => {
    const get = (tag: string) =>
      block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[(.*?)\\]\\]><\\/${tag}>`, "i"))?.[1]
      ?? block.match(new RegExp(`<${tag}[^>]*>(.*?)<\\/${tag}>`, "i"))?.[1]
      ?? "";
    return {
      aw_product_id:       get("aw_product_id"),
      merchant_product_id: get("merchant_product_id"),
      merchant_image_url:  get("merchant_image_url"),
      aw_image_url:        get("aw_image_url"),
      product_name:        get("product_name"),
      merchant_name:       get("merchant_name"),
      merchant_id:         get("merchant_id"),
      merchant_category:   get("merchant_category"),
      description:         get("description"),
      buy_url:             get("buy_url"),
      in_stock:            get("in_stock"),
      search_price:        get("search_price"),
      currency_symbol:     get("currency_symbol"),
      dimensions:          get("dimensions"),
      colour:              get("colour"),
    } as AwinRow;
  });
}

// ─── Fetch + parse feed for one merchant ─────────────────────
async function fetchFeed(merchant: MerchantRecord): Promise<AwinRow[]> {
  if (TEST_MODE) {
    // Charge le fichier de test embarqué
    const samplePath = new URL("./awin-sample-feed.csv", import.meta.url);
    const text = await Deno.readTextFile(samplePath);
    return parseCSV(text);
  }

  if (!merchant.feed_url) {
    throw new Error(`No feed_url configured for merchant ${merchant.name}`);
  }

  const res = await fetch(merchant.feed_url, {
    headers: {
      "Authorization": `Bearer ${AWIN_API_TOKEN}`,
      "Accept": merchant.feed_format === "xml" ? "application/xml" : "text/csv",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${merchant.name}`);

  const text = await res.text();
  return merchant.feed_format === "xml" ? parseXML(text) : parseCSV(text);
}

// ─── Upsert one row into raw_products ────────────────────────
async function upsertProduct(
  supabase: ReturnType<typeof createClient>,
  row: AwinRow,
  merchantDbId: string,
): Promise<void> {
  if (!row.aw_product_id) throw new Error("Missing aw_product_id");

  const price = parseFloat(row.search_price);
  const record = {
    awin_product_id:     row.aw_product_id,
    merchant_id:         merchantDbId,
    merchant_product_id: row.merchant_product_id || null,
    product_name:        row.product_name || null,
    description:         row.description || null,
    merchant_category:   row.merchant_category || null,
    merchant_image_url:  row.merchant_image_url || null,
    aw_image_url:        row.aw_image_url || null,
    search_price:        isNaN(price) ? null : price,
    currency:            row.currency_symbol || "EUR",
    buy_url:             row.buy_url || null,
    raw_colour:          row.colour || null,
    raw_size:            row.dimensions || null,
    in_stock:            row.in_stock === "1" || row.in_stock?.toLowerCase() === "true",
    last_synced_at:      new Date().toISOString(),
  };

  const { error } = await supabase
    .from("raw_products")
    .upsert(record, { onConflict: "awin_product_id" });

  if (error) throw error;
}

// ─── Ensure test merchant exists ─────────────────────────────
async function ensureTestMerchant(
  supabase: ReturnType<typeof createClient>,
): Promise<MerchantRecord> {
  const { data: existing } = await supabase
    .from("merchants")
    .select("*")
    .eq("awin_merchant_id", "TEST_MERCHANT")
    .maybeSingle();

  if (existing) return existing as MerchantRecord;

  const { data, error } = await supabase
    .from("merchants")
    .insert({
      awin_merchant_id: "TEST_MERCHANT",
      name:             "Test Merchant (sample data)",
      sync_enabled:     true,
      feed_format:      "csv",
    })
    .select()
    .single();

  if (error) throw new Error(`Cannot create test merchant: ${error.message}`);
  return data as MerchantRecord;
}

// ─── Main handler ─────────────────────────────────────────────
Deno.serve(async (_req) => {
  const started = Date.now();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
  const results: SyncResult[] = [];
  let totalErrors = 0;

  try {
    // Récupérer les marchands actifs (ou créer le marchand de test)
    let merchants: MerchantRecord[];
    if (TEST_MODE) {
      merchants = [await ensureTestMerchant(supabase)];
    } else {
      const { data, error } = await supabase
        .from("merchants")
        .select("*")
        .eq("sync_enabled", true);
      if (error) throw error;
      merchants = (data ?? []) as MerchantRecord[];
    }

    if (merchants.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active merchants found." }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // Traiter chaque marchand
    for (const merchant of merchants) {
      const mStart = Date.now();
      let upserted = 0, skipped = 0, errors = 0;

      let rows: AwinRow[] = [];
      try {
        rows = await fetchFeed(merchant);
      } catch (fetchErr) {
        console.error(`[${merchant.name}] Feed fetch failed:`, fetchErr);
        results.push({ merchant: merchant.name, upserted: 0, skipped: 0, errors: 1, durationMs: Date.now() - mStart });
        totalErrors++;
        continue;
      }

      console.log(`[${merchant.name}] ${rows.length} rows fetched`);

      for (const row of rows) {
        try {
          await upsertProduct(supabase, row, merchant.id);
          upserted++;
        } catch (rowErr) {
          // Un produit malformé ne bloque pas les autres
          console.error(`[${merchant.name}] Row error (${row.aw_product_id}):`, rowErr);
          errors++;
          skipped++;
        }
      }

      // Mise à jour last_synced_at du marchand
      await supabase
        .from("merchants")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", merchant.id);

      const mResult: SyncResult = {
        merchant:  merchant.name,
        upserted,
        skipped,
        errors,
        durationMs: Date.now() - mStart,
      };
      results.push(mResult);
      totalErrors += errors;
      console.log(`[${merchant.name}] done — ${upserted} upserted, ${errors} errors (${mResult.durationMs}ms)`);
    }

    const totalDuration = Date.now() - started;
    const summary = {
      mode:          TEST_MODE ? "test" : "production",
      merchants:     results.length,
      total_upserted: results.reduce((s, r) => s + r.upserted, 0),
      total_errors:  totalErrors,
      duration_ms:   totalDuration,
      results,
    };

    // Log dans sync_logs
    await supabase.from("sync_logs").insert({
      function_name:       "sync-awin-feed",
      status:              totalErrors === 0 ? "success" : "partial",
      products_processed:  summary.total_upserted,
      errors_count:        totalErrors,
      error_detail:        totalErrors > 0 ? JSON.stringify(results.filter(r => r.errors > 0)) : null,
      duration_ms:         totalDuration,
    });

    console.log("=== SYNC SUMMARY ===", JSON.stringify(summary, null, 2));
    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Fatal error:", message);

    await supabase.from("sync_logs").insert({
      function_name: "sync-awin-feed",
      status:        "error",
      error_detail:  message,
      duration_ms:   Date.now() - started,
    }).catch(() => {}); // silencieux si le log échoue aussi

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
