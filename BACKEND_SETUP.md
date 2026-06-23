# Capsule — Backend Setup

## Prérequis

- [Node.js 18+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (pour le dev local Supabase)
- CLI Supabase : `npm install -g supabase`

---

## 1. Connexion au projet Supabase

```bash
supabase login
supabase link --project-ref dyrbhjmcixbpeultzbzq
```

---

## 2. Appliquer les migrations

```bash
# Applique toutes les migrations en attente sur le projet distant
supabase db push
```

Migrations existantes (ordre d'application) :
| Fichier | Contenu |
|---------|---------|
| `20260622000001_initial_schema.sql` | profiles, items, capsules, capsule_items, wishlists |
| `20260622000002_pipeline_and_profile_schema.sql` | profile_preferences, wardrobe_items, merchants, raw_products, products, sync_logs |
| `20260622000003_wishlist_items.sql` | wishlist_items |

---

## 3. Edge Function — `sync-awin-feed`

### Ce que fait cette fonction

Pour chaque marchand actif (`sync_enabled = true` dans `merchants`) :
1. Récupère le flux produit (CSV ou XML)
2. Parse chaque ligne
3. UPSERT dans `raw_products` (clé : `awin_product_id`)
4. Logue le résultat dans `sync_logs`

### Déployer la fonction

```bash
supabase functions deploy sync-awin-feed
```

### Variables d'environnement requises

Définir dans **Supabase Dashboard → Edge Functions → sync-awin-feed → Secrets** :

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `TEST_MODE` | `"true"` pour utiliser le CSV de test embarqué | Non (défaut = production) |
| `AWIN_API_TOKEN` | Token API Awin (Bearer token) | Oui en production |

> `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont injectées automatiquement par Supabase Edge Functions.

### Lancer en mode TEST (dev local)

```bash
# Démarrer le serveur local Edge Functions
supabase functions serve sync-awin-feed --env-file .env.local

# Dans un autre terminal : déclencher manuellement
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/sync-awin-feed' \
  --header 'Authorization: Bearer <SUPABASE_ANON_KEY>'
```

Ajoute dans `.env.local` :
```
TEST_MODE=true
SUPABASE_SERVICE_ROLE_KEY=<ta clé service role>
```

La fonction lira `awin-sample-feed.csv` (15 produits de démo) et remplira `raw_products`.

### Lancer en production

```bash
# Déclencher via curl (remplace l'URL par celle de ton projet)
curl -i --location --request POST \
  'https://dyrbhjmcixbpeultzbzq.supabase.co/functions/v1/sync-awin-feed' \
  --header 'Authorization: Bearer <SUPABASE_ANON_KEY>'
```

### Planifier l'exécution automatique (Supabase Cron)

Dans **Supabase Dashboard → Database → Extensions**, active `pg_cron`, puis :

```sql
-- Sync toutes les 24h à 3h du matin
select cron.schedule(
  'sync-awin-daily',
  '0 3 * * *',
  $$
  select net.http_post(
    url    := 'https://dyrbhjmcixbpeultzbzq.supabase.co/functions/v1/sync-awin-feed',
    headers := '{"Authorization": "Bearer <ANON_KEY>"}'::jsonb
  );
  $$
);
```

---

## 4. Activer le vrai flux Awin

Quand ton compte Awin est approuvé :

### Étape 1 — Ajouter les marchands dans la table `merchants`

```sql
insert into public.merchants (awin_merchant_id, name, feed_url, feed_format, sync_enabled)
values
  ('12345', 'Sandro',       'https://productdata.awin.com/datafeed/download/apikey/<KEY>/fid/12345/language/fr/format/csv/', 'csv', true),
  ('67890', 'Sézane',       'https://productdata.awin.com/datafeed/download/apikey/<KEY>/fid/67890/language/fr/format/csv/', 'csv', true),
  ('11111', 'A.P.C.',       'https://productdata.awin.com/datafeed/download/apikey/<KEY>/fid/11111/language/fr/format/csv/', 'csv', true);
-- Remplace <KEY> par ton API key Awin et les IDs marchands réels
```

### Étape 2 — Configurer le secret Awin

Dans **Supabase Dashboard → Edge Functions → sync-awin-feed → Secrets** :
- `AWIN_API_TOKEN` = ta clé API Awin
- `TEST_MODE` = `"false"` (ou supprimer la variable)

### Étape 3 — Désactiver le marchand de test

```sql
update public.merchants set sync_enabled = false where awin_merchant_id = 'TEST_MERCHANT';
```

### Étape 4 — Lancer une première sync manuelle pour vérifier

```bash
curl -i --location --request POST \
  'https://dyrbhjmcixbpeultzbzq.supabase.co/functions/v1/sync-awin-feed' \
  --header 'Authorization: Bearer <SUPABASE_ANON_KEY>'
```

Vérifie le résultat dans `sync_logs` :
```sql
select * from public.sync_logs order by ran_at desc limit 5;
```

---

## 5. Edge Function — `transform-products`

### Ce que fait cette fonction

Pour chaque ligne de `raw_products` :
1. **Mapping catégorie** — `merchant_category` → catégorie interne via `merchants.category_mapping` (JSONB), avec fallback dictionnaire intégré. Produits non reconnus → catégorie `"À trier"` (warning console, jamais de plantage)
2. **Normalisation couleur** — `raw_colour` → groupe de tons parmi : `Neutrals`, `Earthy tones`, `Pastels`, `Bold colours`, `Dark & rich`, `Black & White`
3. **Parsing tailles** — `raw_size` (`;` ou `,` séparés) → `sizes_available[]`
4. **Stock status** — `in_stock=false` → `none` · 1 taille disponible → `few` · sync >48h → `few` · sinon → `ok`
5. **Classification IA** (Claude claude-sonnet-4-6) — uniquement si `style IS NULL` ou si le nom a changé. Sortie JSON forcée avec validation enum. Si invalide → `style/cut/gender` restent `NULL` (retrouvables via `SELECT * FROM products WHERE style IS NULL`)
6. **UPSERT** dans `products` avec `match_scores_dirty = true`
7. **Désactivation** — produits `in_stock=false` depuis >7 jours → `is_active = false` (jamais de suppression physique)

### Déployer

```bash
supabase functions deploy transform-products
```

### Secret requis

Dans **Supabase Dashboard → Edge Functions → transform-products → Secrets** :

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Clé API Anthropic pour la classification IA |

### Déclencher manuellement

```bash
curl -X POST https://dyrbhjmcixbpeultzbzq.supabase.co/functions/v1/transform-products \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5cmJoam1jaXhicGV1bHR6YnpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMTEyNDEsImV4cCI6MjA5NzY4NzI0MX0.nHF78d7Eahd_N7vD_qO4tuTtaCBUga9iWadHxKwoO1I"
```

### Ordre d'exécution recommandé

```
sync-awin-feed  →  transform-products
```

Enchaîner les deux en cron :

```sql
-- Sync Awin à 3h, transform à 3h15
select cron.schedule('transform-products-daily', '15 3 * * *',
  $$ select net.http_post(
    url     := 'https://dyrbhjmcixbpeultzbzq.supabase.co/functions/v1/transform-products',
    headers := '{"Authorization": "Bearer <ANON_KEY>"}'::jsonb
  ); $$
);
```

### Vérifier les produits transformés

```sql
-- Résumé après transformation
select category, count(*) as total,
       count(*) filter (where style is not null) as classified,
       count(*) filter (where style is null) as unclassified
from public.products
group by category
order by total desc;

-- Produits non classifiés (à corriger manuellement)
select awin_product_id, name, category, in_stock
from public.products
where style is null;

-- Cohérence style/cut pour 5 produits
select name, category, style, cut, gender, tones, stock_status
from public.products
limit 5;
```

---

## 6. Coût de la classification IA — estimation budget

Modèle : **claude-sonnet-4-6** · Tarifs : $3/MTok input · $15/MTok output

| Mode | Tokens input | Tokens output | Coût / produit |
|------|-------------|---------------|----------------|
| Texte seul | ~250 tok | ~30 tok | ~$0.0012 |
| Texte + image URL | ~1 500 tok | ~30 tok | ~$0.0050 |

> Les images Awin sont des URLs publiques — Claude les charge directement. Le coût varie selon la résolution.

**Estimations pour un vrai catalogue :**

| Nb produits | Texte seul | Avec images |
|-------------|-----------|-------------|
| 100 | ~$0.12 | ~$0.50 |
| 500 | ~$0.60 | ~$2.50 |
| 1 000 | ~$1.20 | ~$5.00 |
| 5 000 | ~$6.00 | ~$25.00 |

**Optimisation coût recommandée :** ne classifier qu'une fois (la fonction vérifie `style IS NULL` et ne reclassifie pas si le nom n'a pas changé). Sur un catalogue stable, le coût IA est un coût d'initialisation, pas récurrent.

---

## 7. Vérifier que raw_products se remplit

```sql
-- Compter les produits par marchand
select m.name, count(*) as products, max(r.last_synced_at) as last_sync
from public.raw_products r
join public.merchants m on m.id = r.merchant_id
group by m.name;

-- Voir les 10 derniers produits insérés
select awin_product_id, product_name, search_price, raw_colour, in_stock
from public.raw_products
order by last_synced_at desc
limit 10;
```
