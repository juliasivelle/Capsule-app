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

// ─── Sample data embarquée (TEST_MODE) ───────────────────────
// Données inline — pas de Deno.readTextFile (interdit sur Supabase cloud)
const SAMPLE_CSV = `aw_product_id,merchant_product_id,merchant_image_url,aw_image_url,product_name,merchant_name,merchant_id,category_name,merchant_category,description,keywords,buy_url,in_stock,stock_quantity,search_price,currency_symbol,dimensions,colour,language,last_updated,product_type
AW_SANDRO_001,SAN-CHE-001,https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400,https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800,Chemise oversize en popeline,Sandro,TEST_MERCHANT,Tops,Chemises,Chemise oversize coupe fluide en popeline légère. Col classique boutonnée devant.,chemise,oversize,popeline,https://www.sandro-paris.com/chemise-001,1,15,195.00,EUR,S;M;L,Off-white,fr,2026-06-01,Tops
AW_SANDRO_002,SAN-MAN-001,https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400,https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800,Manteau laine bouclette,Sandro,TEST_MERCHANT,Outerwear,Manteaux,Manteau oversize en laine bouclette ivoire. Coupe droite col châle.,manteau,laine,bouclette,https://www.sandro-paris.com/manteau-001,1,3,590.00,EUR,XS;S;M;L,Ivory,fr,2026-06-01,Outerwear
AW_APC_001,APC-PAN-001,https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400,https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800,Pantalon taille haute droit,A.P.C.,TEST_MERCHANT,Bottoms,Pantalons,Pantalon taille haute coupe droite en gabardine. Fermeture zip sur le côté.,pantalon,taille haute,droit,https://www.apc.fr/pantalon-001,1,8,290.00,EUR,34;36;38;40;42,Camel,fr,2026-06-01,Bottoms
AW_APC_002,APC-BLA-001,https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400,https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800,Blazer structuré double boutonnage,A.P.C.,TEST_MERCHANT,Tops,Vestes,Blazer en laine structurée double boutonnage. Coupe ajustée épaules marquées.,blazer,structuré,double boutonnage,https://www.apc.fr/blazer-001,1,5,450.00,EUR,XS;S;M;L,Black,fr,2026-06-01,Tops
AW_ARKET_001,ARK-PUL-001,https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400,https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800,Pull col V en laine mérinos,Arket,TEST_MERCHANT,Tops,Maille,Pull col V en laine mérinos 100%. Coupe relaxée manches longues.,pull,col V,mérinos,https://www.arket.com/pull-001,1,20,119.00,EUR,XS;S;M;L;XL,Ecru,fr,2026-06-01,Tops
AW_ARKET_002,ARK-TSH-001,https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400,https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800,T-shirt col rond coton pima,Arket,TEST_MERCHANT,Tops,T-shirts,T-shirt en coton pima biologique. Coupe droite col rond.,t-shirt,coton,pima,https://www.arket.com/tshirt-001,1,50,49.00,EUR,XS;S;M;L;XL,White,fr,2026-06-01,Tops
AW_ROUJE_001,ROJ-ROB-001,https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=400,https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=800,Robe midi en satin,Rouje,TEST_MERCHANT,Dresses,Robes,Robe midi en satin fluide. Encolure carrée bretelles fines.,robe,midi,satin,https://www.rouje.com/robe-001,1,7,245.00,EUR,34;36;38;40,Blush pink,fr,2026-06-01,Dresses
AW_ROUJE_002,ROJ-JUP-001,https://images.unsplash.com/photo-1583496661160-fb5974ca5e53?w=400,https://images.unsplash.com/photo-1583496661160-fb5974ca5e53?w=800,Jupe longue plissée,Rouje,TEST_MERCHANT,Bottoms,Jupes,Jupe longue plissée taille élastiquée. Tissu léger fluide.,jupe,longue,plissée,https://www.rouje.com/jupe-001,1,12,185.00,EUR,34;36;38;40;42,Terracotta,fr,2026-06-01,Bottoms
AW_SEZANE_001,SEZ-BOT-001,https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400,https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800,Bottines à talon carré,Sézane,TEST_MERCHANT,Shoes,Chaussures,Bottines en cuir à talon carré 6 cm. Fermeture zip intérieur.,bottines,talon carré,cuir,https://www.sezane.com/bottines-001,1,6,265.00,EUR,35;36;37;38;39;40;41,Camel,fr,2026-06-01,Shoes
AW_SEZANE_002,SEZ-JEA-001,https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400,https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800,Jean straight leg 90s,Sézane,TEST_MERCHANT,Bottoms,Jeans,Jean straight taille haute coupe 90s en denim brut. 5 poches.,jean,straight,90s,https://www.sezane.com/jean-001,1,18,135.00,EUR,34;36;38;40;42,Indigo blue,fr,2026-06-01,Bottoms
AW_BALZAC_001,BAL-CHE-001,https://images.unsplash.com/photo-1602810316498-ab67cf68c8e1?w=400,https://images.unsplash.com/photo-1602810316498-ab67cf68c8e1?w=800,Chemise en lin froissé,Balzac Paris,TEST_MERCHANT,Tops,Chemises,Chemise en lin naturel froissé. Coupe légèrement oversize col classique.,chemise,lin,froissé,https://www.balzac-paris.fr/chemise-001,1,22,89.00,EUR,XS;S;M;L;XL,Sand,fr,2026-06-01,Tops
AW_APC_003,APC-CAR-001,https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400,https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800,Cardigan long ouvert,A.P.C.,TEST_MERCHANT,Tops,Maille,Cardigan long oversize en laine et alpaga. Coupe fluide sans fermeture.,cardigan,long,ouvert,https://www.apc.fr/cardigan-001,1,4,320.00,EUR,XS;S;M;L,Heather grey,fr,2026-06-01,Tops
AW_SANDRO_003,SAN-SAC-001,https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400,https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800,Sac à main en cuir grainé,Sandro,TEST_MERCHANT,Bags,Sacs,Sac à main en cuir grainé. Bandoulière amovible réglable. Fermeture magnétique.,sac,cuir,grainé,https://www.sandro-paris.com/sac-001,1,9,395.00,EUR,One size,Cognac,fr,2026-06-01,Bags
AW_ROUJE_003,ROJ-BLO-001,https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400,https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800,Blouse en soie imprimée,Rouje,TEST_MERCHANT,Tops,Blouses,Blouse en soie naturelle imprimée fleurie. Col V boutonné devant.,blouse,soie,imprimée,https://www.rouje.com/blouse-001,1,11,215.00,EUR,34;36;38;40,Cream floral,fr,2026-06-01,Tops
AW_BALZAC_002,BAL-ROB-001,https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=400,https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=800,Robe chemise en coton,Balzac Paris,TEST_MERCHANT,Dresses,Robes,Robe chemise en coton lavé. Col classique ceinture à nouer.,robe,chemise,coton,https://www.balzac-paris.fr/robe-001,0,0,145.00,EUR,34;36;38;40;42,Ecru,fr,2026-06-01,Dresses`;

// ─── Fetch + parse feed for one merchant ─────────────────────
async function fetchFeed(merchant: MerchantRecord): Promise<AwinRow[]> {
  if (TEST_MODE) {
    return parseCSV(SAMPLE_CSV);
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
