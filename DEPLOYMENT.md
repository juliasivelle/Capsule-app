# Capsule — Guide de déploiement

## URL de production

> À remplir après le premier déploiement Vercel.

---

## Déploiement initial (à faire une seule fois)

### Étape 1 — Créer un compte Vercel

Va sur [vercel.com](https://vercel.com) et crée un compte gratuit (connecte-toi avec GitHub, c'est plus simple).

### Étape 2 — Connecter le dépôt GitHub à Vercel

1. Sur [vercel.com/dashboard](https://vercel.com/dashboard), clique **"Add New… → Project"**
2. Sélectionne le dépôt **`juliasivelle/Capsule-app`**
3. Vercel détecte automatiquement que c'est un projet Vite — laisse les réglages par défaut :
   - **Framework Preset** : Vite
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
4. **Avant de cliquer "Deploy"**, ajoute les variables d'environnement (section ci-dessous)

### Étape 3 — Variables d'environnement dans Vercel

Dans l'interface de configuration du projet Vercel, section **"Environment Variables"** :

| Nom | Valeur |
|-----|--------|
| `VITE_SUPABASE_URL` | `https://dyrbhjmcixbpeultzbzq.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | *(ta clé anon — récupérable dans Supabase → Project Settings → API)* |

> Ces valeurs sont publiques (côté frontend) mais ne doivent pas être commitées dans le code par bonne pratique.

**Autre façon (ligne de commande)** si tu as installé la CLI Vercel (`npm install -g vercel`) :
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

### Étape 4 — Déployer

Clique **"Deploy"** dans l'interface Vercel, ou depuis le terminal :
```bash
vercel --prod
```

Vercel construit le projet (`npm run build`) et te donne une URL publique de type `https://capsule-app-xxx.vercel.app`.

---

## Mettre à jour le site après une modification

Voici le processus standard pour chaque modification du frontend :

### Ce que fait Claude Code (ou toi si tu modifies directement)

1. Modifie les fichiers dans `C:\Users\Julia\Desktop\App\src\`
2. Commit et push sur la branche `master` :
   ```bash
   git add .
   git commit -m "description de la modification"
   git push origin master
   ```

### Ce que fait Vercel automatiquement

Dès que le push arrive sur GitHub → Vercel déclenche un nouveau build → l'URL de production est mise à jour en 1-2 minutes.

**Tu n'as rien d'autre à faire.** Vercel envoie un email si le build échoue.

---

## Secrets et accès à conserver en sécurité

**Stocke ces informations dans un gestionnaire de mots de passe** (Bitwarden, 1Password, ou le trousseau macOS). Ne les commite JAMAIS dans le code.

| Ce qu'il faut garder | Où le trouver |
|---------------------|---------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `AWIN_API_TOKEN` | Awin Publisher Dashboard → API |
| Identifiants Vercel | vercel.com (login via GitHub) |
| Identifiants Supabase | supabase.com (login) |
| Identifiants GitHub | github.com (login) |

> La `VITE_SUPABASE_ANON_KEY` est publique par conception (elle est dans le bundle JS côté client) — pas besoin de la cacher, mais autant la garder avec le reste.

---

## Architecture résumée

```
GitHub (juliasivelle/Capsule-app)
  │
  ├── src/App.jsx          → Frontend React (Vite)
  │     └── push master    → Vercel rebuild automatique → URL publique
  │
  └── supabase/
        ├── migrations/    → Schéma base de données (appliquer manuellement via SQL Editor)
        └── functions/     → Edge Functions Deno (déployer via Dashboard)
              ├── sync-awin-feed      → Récupère flux Awin → raw_products
              ├── transform-products  → Transforme raw_products → products (+ IA)
              └── run-pipeline        → Orchestrateur (appelé par pg_cron chaque nuit)
```
