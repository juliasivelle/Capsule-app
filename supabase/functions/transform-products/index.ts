import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Config ───────────────────────────────────────────────────
const SUPABASE_URL          = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY     = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

// ─── Enums (cohérents avec App.jsx STYLES_LIST / COUPES_LIST / TONS_LIST) ───
const VALID_STYLES = [
  "Minimaliste", "Parisien", "Casual Chic", "Boho",
  "Streetwear", "Classique", "Sportswear", "Romantique",
] as const;

const VALID_CUTS = [
  // Hauts
  "Oversize", "Cintré/Ajusté", "Regular", "Crop/Court", "Asymétrique", "Col montant",
  // Bas
  "Slim", "Wide-leg", "Straight", "Flare", "Taille haute", "Taille basse", "Mom/Boyfriend",
] as const;

const VALID_GENDERS  = ["femme", "homme", "enfant"] as const;
const VALID_TONES    = ["Noir", "Blanc & Crème", "Beige & Camel", "Gris & Marine", "Pastel", "Coloré"] as const;
const VALID_STATUSES = ["ok", "few", "none"] as const;

type Style   = typeof VALID_STYLES[number];
type Cut     = typeof VALID_CUTS[number];
type Gender  = typeof VALID_GENDERS[number];
type Tone    = typeof VALID_TONES[number];
type Status  = typeof VALID_STATUSES[number];

// ─── Couleur → groupe de tons ─────────────────────────────────
const COLOR_MAP: Record<string, Tone> = {
  // Noir
  black: "Noir", noir: "Noir", charcoal: "Noir",
  dark: "Noir", "dark navy": "Noir", burgundy: "Noir",
  wine: "Noir", forest: "Noir",
  // Blanc & Crème
  white: "Blanc & Crème", blanc: "Blanc & Crème", "off-white": "Blanc & Crème",
  ivory: "Blanc & Crème", cream: "Blanc & Crème", ecru: "Blanc & Crème",
  // Beige & Camel
  camel: "Beige & Camel", beige: "Beige & Camel", sand: "Beige & Camel",
  taupe: "Beige & Camel", nude: "Beige & Camel", cognac: "Beige & Camel",
  brown: "Beige & Camel", tan: "Beige & Camel", khaki: "Beige & Camel",
  olive: "Beige & Camel", terracotta: "Beige & Camel", natural: "Beige & Camel",
  // Gris & Marine
  grey: "Gris & Marine", gray: "Gris & Marine", gris: "Gris & Marine",
  silver: "Gris & Marine", "heather grey": "Gris & Marine",
  navy: "Gris & Marine", marine: "Gris & Marine", indigo: "Gris & Marine",
  "indigo blue": "Gris & Marine",
  // Pastel
  pink: "Pastel", rose: "Pastel", blush: "Pastel", "blush pink": "Pastel",
  lavender: "Pastel", mint: "Pastel", "light blue": "Pastel",
  "powder blue": "Pastel", lilac: "Pastel", peach: "Pastel",
  "cream floral": "Pastel",
  // Coloré (fallback pour tout le reste)
  red: "Coloré", blue: "Coloré", green: "Coloré",
  yellow: "Coloré", orange: "Coloré", purple: "Coloré",
  multicolour: "Coloré", print: "Coloré", floral: "Coloré",
};

function normalizeTone(rawColour: string): Tone[] {
  if (!rawColour) return [];
  const key = rawColour.toLowerCase().trim();
  return [COLOR_MAP[key] ?? "Coloré"];
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
  console.log(`[classifyWithAI] called for: "${product.name}" | ANTHROPIC_API_KEY set: ${!!ANTHROPIC_API_KEY}`);
  if (!ANTHROPIC_API_KEY) {
    console.error("[classifyWithAI] ANTHROPIC_API_KEY is empty — ajoute ce secret dans Supabase Dashboard → Edge Functions → Secrets");
    return null;
  }

  const textContent = {
    type: "text",
    text: `Tu es un classificateur de mode. Analyse ce produit et renvoie UNIQUEMENT un objet JSON valide — sans markdown, sans explication.

Nom du produit : ${product.name}
Description : ${product.description ?? "non fournie"}
Catégorie : ${product.category}
Couleur : ${product.colour ?? "non fournie"}

Retourne exactement ce JSON :
{
  "style": une valeur parmi ${JSON.stringify(VALID_STYLES)},
  "cut": une valeur parmi ${JSON.stringify(VALID_CUTS)},
  "gender": une valeur parmi ${JSON.stringify(VALID_GENDERS)}
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

        // Classifier si style est absent (nouveau produit ou pas encore classifié)
        const existing      = existingMap.get(raw.awin_product_id);
        const existingStyle = existing?.style ?? null;
        const needsAI       = existingStyle === null || existingStyle === undefined || existingStyle === "";

        console.log(`[${raw.awin_product_id}] existing.style="${existingStyle}" | needsAI=${needsAI} | classifyWithAI sera appelée: ${needsAI}`);

        let aiResult: AIClassification | null = null;
        if (needsAI) {
          console.log(`[${raw.awin_product_id}] → appel classifyWithAI...`);
          try {
            aiResult = await classifyWithAI({
              name:        raw.product_name ?? "",
              description: raw.description,
              category,
              colour:      raw.raw_colour,
              image_url:   imageUrl,
            });
            console.log(`[${raw.awin_product_id}] → classifyWithAI result: ${JSON.stringify(aiResult)}`);
            if (aiResult) {
              classified++;
            } else {
              console.error(`[${raw.awin_product_id}] → classifyWithAI a retourné null (voir logs ci-dessus pour la cause)`);
            }
          } catch (aiErr) {
            console.error(`[${raw.awin_product_id}] → AI classification EXCEPTION:`, aiErr);
          }
        } else {
          console.log(`[${raw.awin_product_id}] → classification IA skippée (style déjà défini: "${existingStyle}")`);
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
