import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Config ───────────────────────────────────────────────────
const SUPABASE_URL          = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY     = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

// ─── Enums (cohérents avec App.jsx STYLES_LIST / COUPES_LIST / TONS_LIST) ───
const VALID_STYLES = [
  "Minimalist", "Parisian chic", "Casual cool", "Bohemian",
  "Streetwear", "Preppy", "Sporty chic", "Romantic",
] as const;

const VALID_CUTS = [
  "Loose / Oversized", "Fitted", "Crop / Short", "Flared",
  "Straight", "Slouchy", "High-waisted", "Low-rise",
  "Midi length", "Maxi length", "Standard",
] as const;

const VALID_GENDERS  = ["femme", "homme", "mixte"] as const;
const VALID_TONES    = ["Neutrals", "Earthy tones", "Pastels", "Bold colours", "Dark & rich", "Black & White"] as const;
const VALID_STATUSES = ["ok", "few", "none"] as const;

type Style   = typeof VALID_STYLES[number];
type Cut     = typeof VALID_CUTS[number];
type Gender  = typeof VALID_GENDERS[number];
type Tone    = typeof VALID_TONES[number];
type Status  = typeof VALID_STATUSES[number];

// ─── Couleur → groupe de tons ─────────────────────────────────
const COLOR_MAP: Record<string, Tone> = {
  // Black & White
  black: "Black & White", noir: "Black & White", charcoal: "Black & White",
  white: "Black & White", blanc: "Black & White", "off-white": "Black & White",
  ivory: "Black & White", cream: "Black & White", ecru: "Black & White",
  // Neutrals
  grey: "Neutrals", gray: "Neutrals", gris: "Neutrals", silver: "Neutrals",
  "heather grey": "Neutrals",
  // Earthy tones
  camel: "Earthy tones", beige: "Earthy tones", sand: "Earthy tones",
  taupe: "Earthy tones", nude: "Earthy tones", cognac: "Earthy tones",
  brown: "Earthy tones", tan: "Earthy tones", khaki: "Earthy tones",
  olive: "Earthy tones", terracotta: "Earthy tones", natural: "Earthy tones",
  // Dark & rich
  navy: "Dark & rich", marine: "Dark & rich", indigo: "Dark & rich",
  "indigo blue": "Dark & rich", dark: "Dark & rich", burgundy: "Dark & rich",
  wine: "Dark & rich", forest: "Dark & rich",
  // Pastels
  pink: "Pastels", rose: "Pastels", blush: "Pastels", "blush pink": "Pastels",
  lavender: "Pastels", mint: "Pastels", "light blue": "Pastels",
  "powder blue": "Pastels", lilac: "Pastels", peach: "Pastels",
  "cream floral": "Pastels",
  // Bold colours (fallback for everything else)
  red: "Bold colours", blue: "Bold colours", green: "Bold colours",
  yellow: "Bold colours", orange: "Bold colours", purple: "Bold colours",
  multicolour: "Bold colours", print: "Bold colours", floral: "Bold colours",
};

function normalizeTone(rawColour: string): Tone[] {
  if (!rawColour) return [];
  const key = rawColour.toLowerCase().trim();
  return [COLOR_MAP[key] ?? "Bold colours"];
}

// ─── Catégorie par défaut (si merchant n'a pas de mapping) ────
const DEFAULT_CATEGORY_MAP: Record<string, string> = {
  "chemises": "tops", "shirts": "tops", "blouses": "tops", "tops": "tops",
  "t-shirts": "tops", "maille": "tops", "knitwear": "tops", "sweatshirts": "tops",
  "vestes": "outerwear", "jackets": "outerwear", "blazers": "outerwear",
  "manteaux": "outerwear", "coats": "outerwear", "trench": "outerwear",
  "outerwear": "outerwear",
  "pantalons": "bottoms", "jeans": "bottoms", "jupes": "bottoms",
  "shorts": "bottoms", "bottoms": "bottoms",
  "robes": "dresses", "dresses": "dresses",
  "chaussures": "shoes", "shoes": "shoes", "boots": "shoes",
  "sneakers": "shoes", "bottines": "shoes",
  "sacs": "bags", "bags": "bags",
  "accessoires": "accessories", "accessories": "accessories",
};

function mapCategory(merchantCategory: string, categoryMapping: Record<string, string>): string {
  if (!merchantCategory) return "À trier";
  const key = merchantCategory.toLowerCase().trim();
  // Essaie le mapping du marchand en premier
  const fromMerchant = categoryMapping?.[merchantCategory] ?? categoryMapping?.[key];
  if (fromMerchant) return fromMerchant;
  // Fallback sur le mapping par défaut
  return DEFAULT_CATEGORY_MAP[key] ?? "À trier";
}

// ─── Parsing des tailles ──────────────────────────────────────
function parseSizes(rawSize: string): string[] {
  if (!rawSize?.trim()) return [];
  // Séparateur ; (Awin) ou , ou espace
  return rawSize
    .split(/[;,]/)
    .map(s => s.trim())
    .filter(Boolean);
}

// ─── Stock status ─────────────────────────────────────────────
function computeStockStatus(
  inStock: boolean,
  sizes: string[],
  lastSyncedAt: string,
): Status {
  if (!inStock) return "none";
  const syncAge = Date.now() - new Date(lastSyncedAt).getTime();
  const hours48 = 48 * 60 * 60 * 1000;
  if (syncAge > hours48) return "few";
  if (sizes.length === 1) return "few";
  return "ok";
}

// ─── Classification IA via Claude ─────────────────────────────
interface AIClassification {
  style:  Style;
  cut:    Cut;
  gender: Gender;
}

async function classifyWithAI(product: {
  name: string;
  description: string | null;
  category: string;
  colour: string | null;
  image_url: string | null;
}): Promise<AIClassification | null> {
  if (!ANTHROPIC_API_KEY) {
    console.warn("No ANTHROPIC_API_KEY — skipping AI classification");
    return null;
  }

  const textContent = {
    type: "text",
    text: `You are a fashion classifier. Analyze this product and return ONLY a valid JSON object — no markdown, no explanation.

Product name: ${product.name}
Description: ${product.description ?? "not provided"}
Category: ${product.category}
Colour: ${product.colour ?? "not provided"}

Return exactly this JSON:
{
  "style": one of ${JSON.stringify(VALID_STYLES)},
  "cut": one of ${JSON.stringify(VALID_CUTS)},
  "gender": one of ${JSON.stringify(VALID_GENDERS)}
}`,
  };

  // Inclure l'image si disponible (multimodal)
  const content: unknown[] = [];
  if (product.image_url) {
    content.push({ type: "image", source: { type: "url", url: product.image_url } });
  }
  content.push(textContent);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 100,
      messages: [{ role: "user", content }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const raw = data.content?.[0]?.text ?? "";

  // Parser le JSON — si invalide, log + retourne null
  let parsed: Record<string, unknown>;
  try {
    // Extraire le JSON même si Claude ajoute du texte autour
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON object found in response");
    parsed = JSON.parse(match[0]);
  } catch (e) {
    console.error("AI JSON parse error:", e, "| raw:", raw);
    return null;
  }

  // Valider les enums — ne jamais insérer une valeur invalide
  const style  = parsed.style  as string;
  const cut    = parsed.cut    as string;
  const gender = parsed.gender as string;

  if (!VALID_STYLES.includes(style as Style)) {
    console.error(`Invalid style "${style}" for product: ${product.name}`);
    return null;
  }
  if (!VALID_CUTS.includes(cut as Cut)) {
    console.error(`Invalid cut "${cut}" for product: ${product.name}`);
    return null;
  }
  if (!VALID_GENDERS.includes(gender as Gender)) {
    console.error(`Invalid gender "${gender}" for product: ${product.name}`);
    return null;
  }

  return { style: style as Style, cut: cut as Cut, gender: gender as Gender };
}

// ─── Main handler ─────────────────────────────────────────────
Deno.serve(async (_req) => {
  const started = Date.now();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

  let transformed = 0, classified = 0, skipped = 0, errors = 0;

  try {
    // 1. Récupérer tous les raw_products avec leur marchand
    const { data: rawProducts, error: fetchErr } = await supabase
      .from("raw_products")
      .select("*, merchants(id, name, category_mapping)")
      .order("last_synced_at", { ascending: false });

    if (fetchErr) throw fetchErr;
    if (!rawProducts?.length) {
      return new Response(JSON.stringify({ message: "No raw_products to transform." }), {
        status: 200, headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${rawProducts.length} raw products…`);

    // 2. Récupérer les products existants pour détecter les changements
    const { data: existingProducts } = await supabase
      .from("products")
      .select("awin_product_id, classified_at, name, style");

    const existingMap = new Map(
      (existingProducts ?? []).map(p => [p.awin_product_id, p])
    );

    // 3. Transformer chaque produit
    for (const raw of rawProducts) {
      try {
        const merchant = raw.merchants as { id: string; name: string; category_mapping: Record<string, string> } | null;
        const categoryMapping = merchant?.category_mapping ?? {};

        const category     = mapCategory(raw.merchant_category ?? "", categoryMapping);
        const tones        = normalizeTone(raw.raw_colour ?? "");
        const sizes        = parseSizes(raw.raw_size ?? "");
        const stockStatus  = computeStockStatus(raw.in_stock, sizes, raw.last_synced_at);
        const imageUrl     = raw.aw_image_url || raw.merchant_image_url || null;

        // Catégorie inconnue → warning mais on continue
        if (category === "À trier") {
          console.warn(`[${raw.awin_product_id}] Unknown category: "${raw.merchant_category}"`);
        }

        // Déterminer si une classification IA est nécessaire
        const existing     = existingMap.get(raw.awin_product_id);
        const needsAI      = !existing?.style || existing?.name !== raw.product_name;

        let aiResult: AIClassification | null = null;
        if (needsAI) {
          try {
            aiResult = await classifyWithAI({
              name:        raw.product_name ?? "",
              description: raw.description,
              category,
              colour:      raw.raw_colour,
              image_url:   imageUrl,
            });
            if (aiResult) classified++;
          } catch (aiErr) {
            console.error(`[${raw.awin_product_id}] AI classification error:`, aiErr);
            // Ne pas bloquer — produit reste style=NULL, retrouvable via SELECT * FROM products WHERE style IS NULL
          }
        }

        // UPSERT dans products
        const productRecord: Record<string, unknown> = {
          awin_product_id:    raw.awin_product_id,
          raw_product_id:     raw.id,
          merchant_id:        raw.merchant_id,
          name:               raw.product_name ?? "",
          description:        raw.description,
          category,
          price:              raw.search_price,
          currency:           raw.currency ?? "EUR",
          image_url:          imageUrl,
          product_url:        raw.buy_url,
          tones,
          sizes_available:    sizes,
          stock_status:       stockStatus,
          in_stock:           raw.in_stock,
          is_active:          true,
          match_scores_dirty: true,
          last_synced_at:     raw.last_synced_at,
          updated_at:         new Date().toISOString(),
        };

        // N'écrire style/cut/gender que si l'IA a répondu — sinon laisser NULL
        if (aiResult) {
          productRecord.style        = aiResult.style;
          productRecord.cut          = aiResult.cut;
          productRecord.gender       = aiResult.gender;
          productRecord.classified_at = new Date().toISOString();
        }

        const { error: upsertErr } = await supabase
          .from("products")
          .upsert(productRecord, { onConflict: "awin_product_id" });

        if (upsertErr) throw upsertErr;
        transformed++;

      } catch (rowErr) {
        console.error(`[${raw.awin_product_id}] Transform error:`, rowErr);
        errors++;
        skipped++;
      }
    }

    // 4. Désactiver les produits absents du flux depuis >7 jours
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error: deactivateErr } = await supabase
      .from("products")
      .update({ is_active: false })
      .eq("in_stock", false)
      .lt("last_synced_at", sevenDaysAgo);

    if (deactivateErr) console.error("Deactivation error:", deactivateErr);

    const duration = Date.now() - started;
    const summary = {
      raw_products_processed: rawProducts.length,
      transformed,
      ai_classified: classified,
      skipped,
      errors,
      duration_ms: duration,
    };

    // 5. Log dans sync_logs
    await supabase.from("sync_logs").insert({
      function_name:      "transform-products",
      status:             errors === 0 ? "success" : "partial",
      products_processed: transformed,
      errors_count:       errors,
      error_detail:       errors > 0 ? `${errors} rows failed` : null,
      duration_ms:        duration,
    });

    console.log("=== TRANSFORM SUMMARY ===", JSON.stringify(summary, null, 2));
    return new Response(JSON.stringify(summary), {
      status: 200, headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Fatal error:", message);
    await supabase.from("sync_logs").insert({
      function_name: "transform-products",
      status:        "error",
      error_detail:  message,
      duration_ms:   Date.now() - started,
    }).catch(() => {});
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
});
