import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { detectSessionInUrl: true, flowType: "pkce" } }
);

// ═══════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════

// Liste de marques du prototype (référence design)
const BRANDS = [
  "& Other Stories","A.P.C.","Acne Studios","Adidas","AMI Paris","Arket","ASOS",
  "Autry","Ba&sh","Balzac Paris","Carhartt WIP","Citizens of Humanity",
  "Claudie Pierlot","Comptoir des Cotonniers","COS","Filippa K","Frame","Ganni",
  "Golden Goose","IRO","Isabel Marant","Jacquemus","Khaite","Levi’s",
  "Loulou Studio","Maison Kitsuné","Maje","Mango","Nanushka","New Balance","Nike",
  "Oysho","Réalisation Par","Reformation","Rixo","Rotate","Rouje","Salomon",
  "Sandro","Sessùn","Soeur","Stine Goya","Stussy","Sézane","The Kooples","Totême",
  "Toteme","Uniqlo","Vanessa Bruno","Veja","Zadig & Voltaire","Zara",
].sort();

const STYLES = [
  { name:"Minimaliste", icon:"styleMinimal"  },
  { name:"Casual Chic", icon:"styleCasual"   },
  { name:"Boho",        icon:"styleBoho"     },
  { name:"Classique",   icon:"styleClassic"  },
  { name:"Parisien",    icon:"styleParisian" },
  { name:"Romantique",  icon:"styleRomantic" },
  { name:"Sportswear",  icon:"styleSport"    },
  { name:"Streetwear",  icon:"styleStreet"   },
];

const CUTS_HAUTS = ["Oversize","Cintré / Ajusté","Regular","Crop / Court","Asymétrique","Col montant"];
const CUTS_BAS   = ["Slim","Wide-leg","Straight","Flare","Taille haute","Taille basse","Mom / Boyfriend"];
const COUPES     = [...CUTS_HAUTS, ...CUTS_BAS];

const TONES = [
  { name:"Noir",          hexes:["#1A1714"] },
  { name:"Blanc & Crème", hexes:["#F5F5F0","#F0E8D8"] },
  { name:"Beige & Camel", hexes:["#C9B99A","#C19A6B","#795548","#78866B"] },
  { name:"Gris & Marine", hexes:["#9A9A9A","#1B2A4A"] },
  { name:"Pastel",        hexes:["#87CEEB","#F4C2C2","#F0C040"] },
  { name:"Coloré",        hexes:["#5A7A5A","#B03A2E","#6B1F2A","#C2714F"] },
];

const COULEURS = [
  "Noir","Blanc","Crème","Beige","Camel","Marron","Kaki","Gris","Marine",
  "Bleu ciel","Rose poudré","Jaune","Vert","Rouge","Bordeaux","Terracotta","Multicolore",
];
const VET_TYPES = [
  "T-shirt","Chemise","Pull","Sweat","Veste","Manteau","Robe","Jupe","Pantalon",
  "Jean","Short","Combinaison","Chaussures","Sac","Accessoire",
];

const SIZE_OPTIONS = {
  hauts:       ["XXS","XS","S","M","L","XL","XXL"],
  bas:         ["32","34","36","38","40","42","44","46"],
  chaussures:  ["35","36","37","38","39","40","41","42","43","44"],
  sousvets:    ["XXS","XS","S","M","L","XL","XXL"],
  accessoires: ["Unique","S","M","L"],
};

const SIZE_LABELS = { hauts:"Hauts", bas:"Bas", chaussures:"Chaussures", sousvets:"Sous-vêtements", accessoires:"Accessoires" };

const STEP_LABELS = ["Identité","Marques & Style","Mes tailles","Tons & Coupes","Mon dressing"];

function emptyProfile() {
  return {
    name:"", gender:"Femme", dressing:[], brands:[], style:[], discovery:"open",
    sizes:{ hauts:"", bas:"", chaussures:"", sousvets:"", accessoires:"" },
    tones:[], cutsHauts:[], cutsBas:[],
  };
}
function emptyDressingItem() { return { type:"", brand:"", color:"", cut:"" }; }

const ALL_PRODUCTS = [
  { id:1,  name:"Chemise oversize en popeline",       brand:"Sandro",       type:"Shirts",   price:195, color:"Off-white",   size:"S",      image:"https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&q=80", score:98, tag:"Coup de cœur IA" },
  { id:2,  name:"Pantalon taille haute droit",         brand:"A.P.C.",      type:"Trousers", price:290, color:"Camel",       size:"38",     image:"https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80", score:95, tag:"Complète ton dressing" },
  { id:3,  name:"Pull col V en laine mérinos",         brand:"Arket",        type:"Knitwear", price:119, color:"Ecru",        size:"S",      image:"https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&q=80", score:93, tag:"Tendance" },
  { id:4,  name:"Robe midi en satin",                  brand:"Rouje",        type:"Dresses",  price:245, color:"Blush pink",  size:"S",      image:"https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=400&q=80", score:91, tag:"Nouveau" },
  { id:5,  name:"Veste en jean délavée",               brand:"Sézane",       type:"Jackets",  price:175, color:"Light blue",  size:"S",      image:"https://images.unsplash.com/photo-1544441893-675973e31985?w=400&q=80", score:88, tag:"Complète ton dressing" },
  { id:6,  name:"T-shirt col rond coton pima",         brand:"Arket",        type:"T-shirts", price:49,  color:"White",       size:"S",      image:"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80", score:86, tag:null },
  { id:7,  name:"Manteau laine bouclette",             brand:"Sandro",       type:"Coats",    price:590, color:"Ivory",       size:"S",      image:"https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&q=80", score:94, tag:"Coup de cœur IA" },
  { id:8,  name:"Jupe longue plissée",                 brand:"Rouje",        type:"Skirts",   price:185, color:"Terracotta",  size:"38",     image:"https://images.unsplash.com/photo-1583496661160-fb5974ca5e53?w=400&q=80", score:82, tag:"Découverte" },
  { id:9,  name:"Blazer structuré double boutonnage",  brand:"A.P.C.",      type:"Blazers",  price:450, color:"Black",       size:"S",      image:"https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&q=80", score:90, tag:null },
  { id:10, name:"Jean straight leg 90s",               brand:"Sézane",       type:"Jeans",    price:135, color:"Indigo blue", size:"38",     image:"https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&q=80", score:87, tag:"Tendance" },
  { id:11, name:"Blouse en soie imprimée",             brand:"Rouje",        type:"Blouses",  price:215, color:"Cream floral",size:"S",      image:"https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400&q=80", score:85, tag:"Nouveau" },
  { id:12, name:"Sac à main en cuir grainé",           brand:"Sandro",       type:"Bags",     price:395, color:"Cognac",      size:"One size",image:"https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80", score:79, tag:null },
  { id:13, name:"Chemise en lin froissé",              brand:"Balzac Paris",  type:"Shirts",   price:89,  color:"Sand",        size:"S",      image:"https://images.unsplash.com/photo-1602810316498-ab67cf68c8e1?w=400&q=80", score:84, tag:"Découverte" },
  { id:14, name:"Bottines à talon carré",              brand:"Sézane",       type:"Boots",    price:265, color:"Camel",       size:"38",     image:"https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80", score:92, tag:"Coup de cœur IA" },
  { id:15, name:"Cardigan long ouvert",                brand:"A.P.C.",      type:"Knitwear", price:320, color:"Heather grey", size:"S",      image:"https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&q=80", score:81, tag:null },
  { id:16, name:"Robe chemise en coton",               brand:"Balzac Paris",  type:"Dresses",  price:145, color:"Ecru",        size:"S",      image:"https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=400&q=80", score:83, tag:"Découverte" },
];

const TAG_COLORS = {
  "Coup de cœur IA":     { bg:"rgba(181,105,74,.92)",  color:"#fff" },
  "Complète ton dressing":{ bg:"rgba(90,128,96,.92)",   color:"#fff" },
  "Tendance":            { bg:"rgba(28,21,16,.85)",    color:"#fff" },
  "Découverte":          { bg:"rgba(212,160,144,.9)",  color:"#1C1510" },
  "Nouveau":             { bg:"rgba(246,242,236,.95)", color:"#1C1510" },
};

const TYPES = [
  { key:"All",        label:"Tout" },
  { key:"Hauts",      label:"Hauts" },
  { key:"Chemises",   label:"Chemises" },
  { key:"Pulls",      label:"Pulls" },
  { key:"Vestes",     label:"Vestes" },
  { key:"Manteaux",   label:"Manteaux" },
  { key:"Robes",      label:"Robes" },
  { key:"Jupes",      label:"Jupes" },
  { key:"Pantalons",  label:"Pantalons" },
  { key:"Jeans",      label:"Jeans" },
  { key:"Chaussures", label:"Chaussures" },
  { key:"Accessoires",label:"Accessoires" },
];

const TYPE_MAP = {
  "Hauts":       ["T-shirts","Shirts","Blouses","Knitwear"],
  "Chemises":    ["Shirts","Blouses"],
  "Pulls":       ["Knitwear"],
  "Vestes":      ["Jackets","Blazers"],
  "Manteaux":    ["Coats"],
  "Robes":       ["Dresses"],
  "Jupes":       ["Skirts"],
  "Pantalons":   ["Trousers"],
  "Jeans":       ["Jeans"],
  "Chaussures":  ["Boots"],
  "Accessoires": ["Bags"],
};

// ═══════════════════════════════════════════════════════════════
// AI HELPER
// ═══════════════════════════════════════════════════════════════

async function fetchAIInsight(product, profile) {
  try {
    const dressingStr = (profile.dressing||[]).map(d => `${d.color} ${d.type}${d.brand?" ("+d.brand+")":""}`).join(", ");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        model:"claude-sonnet-4-20250514", max_tokens:80,
        messages:[{ role:"user", content:
          `Personal shopper IA experte. 1 phrase percutante, max 15 mots : pourquoi cette pièce est parfaite pour ce profil ?
Style : ${(profile.style||[]).join(", ")||"minimaliste"}, tons : ${(profile.tones||[]).join(", ")}, dressing : ${dressingStr||"non précisé"}.
Pièce : ${product.name} en ${product.color} par ${product.brand}.
Réponds uniquement par la phrase, sans guillemets ni ponctuation finale.`
        }],
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text || "Une pièce taillée pour votre style.";
  } catch { return "Une pièce taillée pour votre style."; }
}

// ═══════════════════════════════════════════════════════════════
// SUPABASE HELPERS
// ═══════════════════════════════════════════════════════════════

async function loadProfileFromSupabase(userId) {
  const [{ data: profileData }, { data: prefData }, { data: wardrobeData }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", userId).single(),
    supabase.from("profile_preferences").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("wardrobe_items").select("*").eq("user_id", userId),
  ]);

  if (!prefData) return null; // Nouvel utilisateur, onboarding non fait

  const base = emptyProfile();
  // `styles` (text[]) est la colonne enrichie ; fallback sur `style` (text) pour les anciens profils
  const styleArr = Array.isArray(prefData.styles) && prefData.styles.length
    ? prefData.styles
    : (prefData.style ? [prefData.style] : []);

  return {
    name:      profileData?.full_name || "",
    gender:    prefData.gender || "Femme",
    style:     styleArr,
    discovery: prefData.discovery ? "open" : "own",
    sizes:     { ...base.sizes, ...(prefData.sizes || {}) },
    tones:     prefData.tones || [],
    cutsHauts: prefData.cuts_hauts || [],
    cutsBas:   prefData.cuts_bas || [],
    brands:    prefData.brands || [],
    dressing:  (wardrobeData || []).map(w => ({
      type:  w.category || w.name || "",
      color: w.color || "",
      brand: w.notes || "",
      cut:   "",
    })),
  };
}

async function saveProfileToSupabase(userId, profile) {
  await supabase
    .from("profiles")
    .update({ full_name: profile.name })
    .eq("id", userId);

  await supabase.from("profile_preferences").upsert({
    user_id:    userId,
    sizes:      profile.sizes,
    tones:      profile.tones,
    cuts_hauts: profile.cutsHauts,
    cuts_bas:   profile.cutsBas,
    styles:     profile.style,            // text[] — sélection multiple
    style:      profile.style?.[0] || null, // compat colonne mono-valeur
    gender:     profile.gender || null,
    brands:     profile.brands,
    discovery:  profile.discovery === "open",
  }, { onConflict: "user_id" });

  await supabase.from("wardrobe_items").delete().eq("user_id", userId);
  if (profile.dressing.length > 0) {
    await supabase.from("wardrobe_items").insert(
      profile.dressing
        .filter(d => d.type || d.color || d.brand)
        .map(d => ({
          user_id:  userId,
          name:     `${d.color} ${d.type}`.trim() || d.type || "Pièce",
          category: d.type || null,
          color:    d.color || null,
          notes:    d.brand || null,
        }))
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════

export default function CapsuleApp() {
  const [screen, setScreen]         = useState("loading"); // loading | auth | onboarding | listing
  const [userProfile, setUserProfile] = useState(null);
  const [userId, setUserId]           = useState(null);

  useEffect(() => {
    let active = true; // évite un setState après démontage

    // Applique une session (ou son absence) à l'état de l'app.
    const applySession = async (session) => {
      if (!active) return;
      if (!session) {
        setUserId(null);
        setUserProfile(null);
        setScreen("auth");
        return;
      }
      setUserId(session.user.id);
      const profile = await loadProfileFromSupabase(session.user.id);
      if (!active) return;
      if (profile) {
        setUserProfile(profile);
        setScreen("listing");
      } else {
        setScreen("onboarding");
      }
    };

    // 1. Récupère la session existante au montage — indispensable pour
    //    capter le retour OAuth (Google) : onAuthStateChange peut ne pas
    //    se redéclencher si la session est déjà restaurée depuis l'URL/storage.
    supabase.auth.getSession().then(({ data: { session } }) => applySession(session));

    // 2. Écoute les changements ultérieurs (login, logout, refresh token).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => applySession(session)
    );

    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const handleOnboardingComplete = async (profile) => {
    try {
      await saveProfileToSupabase(userId, profile);
    } catch (err) {
      console.error("Erreur sauvegarde profil :", err);
    }
    setUserProfile(profile);
    setScreen("listing");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      <style>{CSS}</style>
      {screen === "loading"    && <LoadingScreen />}
      {screen === "auth"       && <AuthScreen />}
      {screen === "onboarding" && (
        <OnboardingFlow
          onComplete={handleOnboardingComplete}
          initialProfile={userProfile}
        />
      )}
      {screen === "listing"    && (
        <ListingPage
          profile={userProfile}
          userId={userId}
          onEditProfile={() => setScreen("onboarding")}
          onSignOut={handleSignOut}
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// LOADING
// ═══════════════════════════════════════════════════════════════

function Logo({ light = false }) {
  return (
    <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:500, letterSpacing:".18em" }}>
      CAPS<span style={{ color: light ? "var(--accent-light)" : "var(--accent)", fontStyle:"italic" }}>U</span>LE
    </span>
  );
}

function LoadingDots() {
  return <span className="dots-loading"><span/><span/><span/></span>;
}

function AIDot() {
  return <span style={{ display:"inline-block", width:"6px", height:"6px", borderRadius:"50%", background:"var(--accent)", animation:"pulse 2s infinite", marginRight:"6px", marginTop:"6px", flexShrink:0 }}/>;
}

const FALLBACK_LISTING_INSIGHT = "Votre sélection du moment, choisie selon votre style et vos marques préférées.";

function LoadingScreen() {
  return (
    <div className="phone-frame fade-in" style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--ink)" }}>
      <div style={{ textAlign:"center", color:"#fff" }}>
        <div style={{ fontSize:"1.7rem" }}><Logo light/></div>
        <p style={{ fontFamily:"'Playfair Display',serif", fontStyle:"italic", fontSize:".95rem", color:"rgba(253,250,247,.65)", marginTop:".6rem" }}>
          Votre dressing rêvé
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// AUTH — copie conforme du prototype
// ═══════════════════════════════════════════════════════════════

function AuthScreen() {
  const [mode, setMode]               = useState("signup"); // signup | login
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPw, setShowPw]           = useState(false);
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showForgot, setShowForgot]   = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent]   = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const fieldStyle = { width:"100%", border:"1px solid var(--bone)", borderRadius:"2px", padding:".8rem 1rem", fontSize:".9rem", background:"var(--white)", outline:"none", fontFamily:"'Jost',sans-serif", color:"var(--charcoal)" };
  const labelStyle = { fontSize:".68rem", textTransform:"uppercase", letterSpacing:".05em", color:"var(--stone)", marginBottom:".4rem" };

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes("@")) { setError("Merci de renseigner une adresse email valide."); return; }
    if (password.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères."); return; }
    setError(""); setLoading(true);
    try {
      const { error: err } = mode === "signup"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      // La redirection vers onboarding/listing est gérée par onAuthStateChange.
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(""); setGoogleLoading(true);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (err) { setError(err.message); setGoogleLoading(false); }
  };

  const handleForgot = async () => {
    if (!forgotEmail.trim() || !forgotEmail.includes("@")) return;
    setForgotLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      setForgotSent(true); // message neutre : on confirme quoi qu'il arrive
    } catch {
      setForgotSent(true);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="phone-frame fade-in" style={{ minHeight:"100vh", display:"flex", flexDirection:"column" }}>
      {/* Hero sombre + logo */}
      <div style={{ background:"var(--ink)", padding:"3rem 1.5rem 2.5rem", color:"#fff" }}>
        <div style={{ fontSize:"1.6rem", marginBottom:".6rem" }}><Logo light/></div>
        <p style={{ fontFamily:"'Playfair Display',serif", fontStyle:"italic", fontSize:"1rem", color:"rgba(253,250,247,.7)", maxWidth:"260px" }}>
          Votre dressing rêvé, chaque pièce choisie pour vous.
        </p>
      </div>

      <div style={{ flex:1, padding:"1.75rem 1.5rem", display:"flex", flexDirection:"column" }}>
        {/* Onglets */}
        <div style={{ display:"flex", borderBottom:"1px solid var(--bone)", marginBottom:"1.5rem" }}>
          {[{ k:"signup", l:"Créer un compte" }, { k:"login", l:"Se connecter" }].map(tab => (
            <button key={tab.k} onClick={() => { setMode(tab.k); setError(""); }} style={{
              flex:1, background:"none", border:"none", padding:".7rem 0", fontSize:".82rem",
              fontWeight: mode === tab.k ? 500 : 400, color: mode === tab.k ? "var(--accent)" : "var(--stone)",
              borderBottom: mode === tab.k ? "2px solid var(--accent)" : "2px solid transparent", marginBottom:"-1px",
              cursor:"pointer", fontFamily:"'Jost',sans-serif",
            }}>{tab.l}</button>
          ))}
        </div>

        <div style={labelStyle}>Adresse email</div>
        <input type="email" value={email} placeholder="julia@exemple.com"
          onChange={e => setEmail(e.target.value)} style={{ ...fieldStyle, marginBottom:"1rem" }} />

        <div style={labelStyle}>Mot de passe</div>
        <div style={{ position:"relative", marginBottom:".5rem" }}>
          <input type={showPw ? "text" : "password"} value={password} placeholder="••••••••"
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            style={{ ...fieldStyle, padding:".8rem 2.5rem .8rem 1rem" }} />
          <button onClick={() => setShowPw(s => !s)} aria-label={showPw ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            style={{ position:"absolute", right:".7rem", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"var(--stone)", padding:".2rem", display:"flex", alignItems:"center", cursor:"pointer" }}>
            <Icon name={showPw ? "eyeOff" : "eye"} size={17}/>
          </button>
        </div>

        {mode === "signup" && (
          <div style={{ display:"flex", alignItems:"center", gap:".35rem", marginBottom:".5rem" }}>
            <span style={{
              width:"14px", height:"14px", borderRadius:"50%", flexShrink:0,
              border: password.length >= 6 ? "none" : "1px solid var(--warm-gray)",
              background: password.length >= 6 ? "var(--success)" : "none",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              {password.length >= 6 && <Icon name="check" size={9} color="#fff"/>}
            </span>
            <span style={{ fontSize:".7rem", color: password.length >= 6 ? "var(--success)" : "var(--stone)" }}>
              6 caractères minimum
            </span>
          </div>
        )}

        {mode === "login" && (
          <button onClick={() => { setForgotEmail(email); setForgotSent(false); setShowForgot(true); }}
            style={{ alignSelf:"flex-end", background:"none", border:"none", color:"var(--accent)", fontSize:".72rem", marginBottom:"1.25rem", padding:0, cursor:"pointer" }}>
            Mot de passe oublié ?
          </button>
        )}
        {mode === "signup" && <div style={{ marginBottom:"1.25rem" }}/>}

        {error && <div style={{ color:"var(--error)", fontSize:".78rem", marginBottom:"1rem" }}>{error}</div>}

        <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ marginBottom:".85rem" }}>
          {loading ? <LoadingDots/> : mode === "signup" ? "Créer mon compte" : "Se connecter"}
        </button>

        <div style={{ display:"flex", alignItems:"center", gap:".7rem", margin:".25rem 0 .85rem" }}>
          <div style={{ flex:1, height:"1px", background:"var(--bone)" }}/>
          <span style={{ fontSize:".7rem", color:"var(--warm-gray)" }}>ou</span>
          <div style={{ flex:1, height:"1px", background:"var(--bone)" }}/>
        </div>

        <button onClick={handleGoogle} disabled={googleLoading} style={{
          width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:".6rem",
          background:"var(--white)", border:"1px solid var(--bone)", borderRadius:"2px", padding:".78rem",
          fontSize:".82rem", color:"var(--charcoal)", fontWeight:500, cursor:"pointer",
          fontFamily:"'Jost',sans-serif", opacity: googleLoading ? .6 : 1,
        }}>
          {googleLoading ? <LoadingDots/> : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 010-4.18V7.07H2.18a11 11 0 000 9.86l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 00-9.82 6.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
              </svg>
              Continuer avec Google
            </>
          )}
        </button>

        <p style={{ fontSize:".7rem", color:"var(--warm-gray)", textAlign:"center", marginTop:"auto", paddingTop:"2rem" }}>
          En continuant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
        </p>
      </div>

      {/* Overlay mot de passe oublié */}
      <div style={{
        position:"fixed", inset:0, zIndex:90, background:"var(--cream)", maxWidth:"430px", margin:"0 auto",
        transform: showForgot ? "translateX(0)" : "translateX(100%)", transition:"transform .3s ease",
        display:"flex", flexDirection:"column",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:".6rem", padding:"1.1rem 1.25rem", borderBottom:"1px solid var(--bone)" }}>
          <button onClick={() => setShowForgot(false)} style={{ background:"none", border:"none", padding:".3rem", color:"var(--charcoal)", cursor:"pointer" }}>
            <Icon name="back" size={18}/>
          </button>
          <span style={{ fontSize:".92rem", fontWeight:500, color:"var(--charcoal)" }}>Mot de passe oublié</span>
        </div>
        <div style={{ flex:1, padding:"2rem 1.5rem" }}>
          {!forgotSent ? (
            <>
              <p style={{ color:"var(--stone)", fontSize:".85rem", marginBottom:"1.5rem", lineHeight:1.6 }}>
                Indiquez votre adresse email, nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>
              <div style={labelStyle}>Adresse email</div>
              <input type="email" value={forgotEmail} placeholder="julia@exemple.com"
                onChange={e => setForgotEmail(e.target.value)} style={{ ...fieldStyle, marginBottom:"1.5rem" }} />
              <button onClick={handleForgot} disabled={forgotLoading} className="btn-primary">
                {forgotLoading ? <LoadingDots/> : "Envoyer le lien"}
              </button>
            </>
          ) : (
            <div style={{ textAlign:"center", paddingTop:"2rem" }}>
              <div style={{ width:"52px", height:"52px", borderRadius:"50%", background:"var(--accent-pale)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem" }}>
                <Icon name="check" size={22} color="var(--accent)"/>
              </div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontStyle:"italic", fontSize:"1.05rem", color:"var(--charcoal)", marginBottom:".5rem" }}>
                Email envoyé
              </div>
              <p style={{ color:"var(--stone)", fontSize:".85rem", lineHeight:1.6, marginBottom:"1.5rem" }}>
                Si un compte existe pour {forgotEmail}, vous recevrez un lien de réinitialisation dans quelques instants.
              </p>
              <button onClick={() => setShowForgot(false)} className="btn-ghost">Retour à la connexion</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ONBOARDING — copie conforme du prototype (mobile phone-frame)
// ═══════════════════════════════════════════════════════════════

// Normalisation insensible aux accents/casse pour la recherche de marques
function normalizeText(str) {
  return (str || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().trim();
}

// Aperçu de compatibilité pour le teaser — léger, déterministe, à partir
// du catalogue de démo (les vrais scores sont calculés côté listing).
function teaserScore(product, profile) {
  let s = product.score || 75;
  if ((profile.brands || []).includes(product.brand)) s = Math.min(99, s + 4);
  return s;
}

function Icon({ name, size = 18, color = "currentColor" }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></>,
    heart: <path d="M12 21s-7.5-5.2-10-9.8C.3 7.8 2 4 5.6 4c2 0 3.5 1.2 4.4 2.6C10.9 5.2 12.4 4 14.4 4 18 4 19.7 7.8 18 11.2 17 13 12 18 12 21z" fill={color} stroke="none"/>,
    back: <polyline points="15 18 9 12 15 6"/>,
    close: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    check: <polyline points="20 6 9 17 4 12"/>,
    camera: <><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    eyeOff: <><path d="M17.94 17.94A10.94 10.94 0 0112 19c-7 0-11-7-11-7a18.5 18.5 0 015.06-5.94M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 7 11 7a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>,
    styleMinimal: <><path d="M8 4l-2 3v13h12V7l-2-3"/><path d="M8 4a4 4 0 008 0"/></>,
    styleCasual: <><path d="M5 7l3-3h2a2 2 0 004 0h2l3 3-2.5 3L16 9v9H8V9l-1.5 1z"/></>,
    styleBoho: <><path d="M7 3v6l-2 12h14L17 9V3"/><path d="M7 9h10"/><path d="M9 3v3M12 3v3M15 3v3"/></>,
    styleClassic: <><path d="M5 7l3-4h2a2 2 0 004 0h2l3 4-2 2v12H7V9z"/><line x1="10" y1="13" x2="14" y2="13"/></>,
    styleParisian: <><ellipse cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v3c0 2 3 3 7 3s7-1 7-3V7"/><line x1="12" y1="13" x2="12" y2="21"/></>,
    styleRomantic: <><path d="M12 5c-3 0-5 2-5 5 0 5 5 9 5 9s5-4 5-9c0-3-2-5-5-5z"/><path d="M9 9c1-1 2-1.5 3-1.5s2 .5 3 1.5"/></>,
    styleSport: <><path d="M6 5l3-2 3 2 3-2 3 2-2 4v11H8V9z"/><path d="M8 9l-2-1M16 9l2-1"/></>,
    styleStreet: <><path d="M4 9l4-5h2a2 2 0 004 0h2l4 5-3 2v9H7v-9z"/><circle cx="12" cy="16" r="1.5"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

function ProgressBar({ value }) {
  return (
    <div style={{ height:"3px", background:"var(--bone)", position:"sticky", top:0, zIndex:20 }}>
      <div style={{ height:"100%", background:"var(--accent)", width:value+"%", transition:"width .4s ease" }}/>
    </div>
  );
}

function OnboardingFlow({ onComplete, initialProfile }) {
  const isEditMode = !!initialProfile;
  const [draft, setDraft] = useState(() => ({ ...emptyProfile(), ...(initialProfile || {}) }));
  const [step, setStep] = useState(1);          // 1..5
  const [substep2, setSubstep2] = useState(1);  // étape 2 scindée (marques → style)
  const [showTeaser, setShowTeaser] = useState(false);
  const [anim, setAnim] = useState(0);
  const direction = useRef("fwd");

  const update = (key, val) => setDraft(d => ({ ...d, [key]: val }));
  const toggleArr = (key, val) => setDraft(d => {
    const arr = d[key];
    return { ...d, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
  });

  const isValid = () => {
    switch (step) {
      case 1: return draft.name.trim().length > 0;
      case 2: return substep2 === 1 ? draft.brands.length > 0 : draft.style.length > 0;
      case 3: return Object.values(draft.sizes).some(v => v);
      case 4: return draft.tones.length > 0 && (draft.cutsHauts.length > 0 || draft.cutsBas.length > 0);
      case 5: return true;
      default: return true;
    }
  };

  const bump = (dir) => { direction.current = dir; setAnim(a => a + 1); };

  const goNext = () => {
    if (step === 2 && substep2 === 1) { bump("fwd"); setSubstep2(2); return; }
    if (step === 2 && substep2 === 2 && !isEditMode) { setShowTeaser(true); return; }
    if (step < 5) { bump("fwd"); setStep(step + 1); }
    else onComplete(draft);
  };
  const goBack = () => {
    if (step === 2 && substep2 === 2) { bump("back"); setSubstep2(1); return; }
    if (step > 1) { bump("back"); setStep(step - 1); }
  };
  const jumpTo = (n) => { direction.current = n > step ? "fwd" : "back"; if (n === 2) setSubstep2(1); setStep(n); setAnim(a => a + 1); };
  const continueFromTeaser = () => { setShowTeaser(false); bump("fwd"); setStep(3); };

  const teaserProducts = showTeaser
    ? [...ALL_PRODUCTS].map(p => ({ ...p, matchScore: teaserScore(p, draft) }))
        .sort((a, b) => b.matchScore - a.matchScore).slice(0, 3)
    : [];

  return (
    <div className="phone-frame fade-in" style={{ minHeight:"100vh", display:"flex", flexDirection:"column" }}>
      <ProgressBar value={(step / 5) * 100} />

      {isEditMode && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1rem 1.25rem .25rem" }}>
          <h2 style={{ fontSize:"1.15rem" }}>Modifier mon profil</h2>
          <button onClick={() => onComplete(draft)} aria-label="Fermer" style={{ background:"var(--bone)", border:"none", width:"30px", height:"30px", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Icon name="close" size={14} color="var(--charcoal)"/>
          </button>
        </div>
      )}

      {isEditMode && (
        <div style={{ display:"flex", gap:".4rem", padding:".75rem 1.25rem", overflowX:"auto" }}>
          {STEP_LABELS.map((label, i) => {
            const n = i + 1, active = n === step;
            return (
              <button key={n} onClick={() => jumpTo(n)} style={{
                flexShrink:0, padding:".3rem .65rem", borderRadius:"9999px", fontSize:".68rem",
                border:"1px solid "+(active ? "var(--accent)" : "var(--bone)"),
                background: active ? "var(--accent)" : "var(--white)",
                color: active ? "var(--white)" : "var(--stone)", whiteSpace:"nowrap",
              }}>{n}. {label}</button>
            );
          })}
        </div>
      )}

      {!isEditMode && (
        <div style={{ padding:".75rem 1.25rem .25rem", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:".68rem", letterSpacing:".1em", textTransform:"uppercase", color:"var(--stone)" }}>
            Étape {step} / 5{step === 5 ? " — Optionnel" : ""}
          </span>
        </div>
      )}

      <div key={anim} className={direction.current === "fwd" ? "step-enter-fwd" : "step-enter-back"}
        style={{ flex:1, padding:".5rem 1.25rem 1.5rem", overflowY:"auto" }}>

        {step === 1 && (
          <div>
            <h2 style={{ fontSize:"1.5rem", marginBottom:".4rem" }}>Parlez-nous de vous</h2>
            <p style={{ color:"var(--stone)", fontSize:".85rem", marginBottom:"1.5rem" }}>
              Ces informations personnalisent votre expérience Capsule.
            </p>
            <div className="ob-fieldlabel">Votre prénom</div>
            <input type="text" value={draft.name} placeholder="Julia" autoFocus
              onChange={e => update("name", e.target.value)}
              onKeyDown={e => e.key === "Enter" && isValid() && goNext()}
              className="ob-text-input" style={{ marginBottom:"1.5rem" }} />
            <div className="ob-fieldlabel">Je cherche des vêtements pour</div>
            <div style={{ display:"flex", border:"1px solid var(--bone)", borderRadius:"2px", overflow:"hidden", width:"fit-content" }}>
              {["Femme","Homme","Enfant"].map((g, i) => (
                <button key={g} onClick={() => update("gender", g)} style={{
                  padding:".5rem 1.1rem", fontSize:".82rem", border:"none",
                  borderLeft: i > 0 ? "1px solid var(--bone)" : "none",
                  background: (draft.gender || "Femme") === g ? "var(--accent)" : "var(--white)",
                  color: (draft.gender || "Femme") === g ? "#fff" : "var(--charcoal)",
                }}>{g}</button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && substep2 === 1 && (
          <div>
            <h2 style={{ fontSize:"1.5rem", marginBottom:".4rem" }}>Vos marques</h2>
            <p style={{ color:"var(--stone)", fontSize:".85rem", marginBottom:"1.25rem" }}>
              Définissez vos incontournables — vous pourrez en ajouter d'autres plus tard.
            </p>
            <BrandStep draft={draft} toggleArr={toggleArr} />
          </div>
        )}

        {step === 2 && substep2 === 2 && (
          <div>
            <h2 style={{ fontSize:"1.5rem", marginBottom:".4rem" }}>Votre style</h2>
            <p style={{ color:"var(--stone)", fontSize:".85rem", marginBottom:"1.25rem" }}>
              Définissez votre univers stylistique.
            </p>
            <div className="ob-fieldlabel">Style vestimentaire <span style={{ textTransform:"none", color:"var(--warm-gray)" }}>(plusieurs choix)</span></div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:".5rem", marginBottom:"1.5rem" }}>
              {STYLES.map(s => (
                <button key={s.name} onClick={() => toggleArr("style", s.name)}
                  className={"chip" + (draft.style.includes(s.name) ? " selected" : "")}
                  style={{ display:"inline-flex", alignItems:"center", gap:".4rem" }}>
                  <Icon name={s.icon} size={13} color={draft.style.includes(s.name) ? "#fff" : "var(--accent)"}/>
                  {s.name}
                </button>
              ))}
            </div>
            <div className="ob-fieldlabel">Ouverture aux découvertes</div>
            <div style={{ display:"flex", border:"1px solid var(--bone)", borderRadius:"2px", overflow:"hidden" }}>
              <button onClick={() => update("discovery", "own")} style={{
                flex:1, padding:".6rem .5rem", fontSize:".76rem", border:"none",
                background: draft.discovery === "own" ? "var(--accent)" : "var(--white)",
                color: draft.discovery === "own" ? "#fff" : "var(--charcoal)",
              }}>Mes marques uniquement</button>
              <button onClick={() => update("discovery", "open")} style={{
                flex:1, padding:".6rem .5rem", fontSize:".76rem", border:"none", borderLeft:"1px solid var(--bone)",
                background: draft.discovery === "open" ? "var(--accent)" : "var(--white)",
                color: draft.discovery === "open" ? "#fff" : "var(--charcoal)",
              }}>Ouvert(e) à découvrir</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ fontSize:"1.5rem", marginBottom:".4rem" }}>Vos tailles</h2>
            <p style={{ color:"var(--stone)", fontSize:".85rem", marginBottom:"1.25rem" }}>
              Pour des recommandations à votre taille exacte.
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:".75rem" }}>
              {Object.entries(SIZE_LABELS).map(([key, label]) => (
                <div key={key} style={{ border:"1px solid var(--bone)", borderRadius:"2px", padding:".75rem", background:"var(--white)" }}>
                  <div className="ob-fieldlabel" style={{ marginBottom:".4rem" }}>{label}</div>
                  <select value={draft.sizes[key]} onChange={e => update("sizes", { ...draft.sizes, [key]: e.target.value })}
                    style={{ width:"100%", border:"1px solid var(--bone)", borderRadius:"2px", padding:".4rem", background:"var(--cream)", fontSize:".82rem" }}>
                    <option value="">—</option>
                    {SIZE_OPTIONS[key].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 style={{ fontSize:"1.5rem", marginBottom:".4rem" }}>Tons & Coupes</h2>
            <p style={{ color:"var(--stone)", fontSize:".85rem", marginBottom:"1.25rem" }}>
              Les dernières préférences pour calibrer vos recommandations.
            </p>
            <div className="ob-fieldlabel">Tons préférés <span style={{ textTransform:"none", color:"var(--warm-gray)" }}>(plusieurs choix)</span></div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:".7rem", margin:".6rem 0 1.5rem" }}>
              {TONES.map(t => {
                const sel = draft.tones.includes(t.name);
                const gradient = t.hexes.length > 1 ? `linear-gradient(90deg, ${t.hexes.join(", ")})` : t.hexes[0];
                return (
                  <div key={t.name} onClick={() => toggleArr("tones", t.name)} title={t.name} style={{
                    borderRadius:"2px", overflow:"hidden", cursor:"pointer",
                    border: sel ? "1.5px solid var(--accent)" : "1px solid var(--bone)", background:"var(--white)",
                  }}>
                    <div style={{ position:"relative", height:"40px", background:gradient }}>
                      {sel && (
                        <div style={{ position:"absolute", top:"4px", right:"4px", width:"18px", height:"18px", borderRadius:"50%", background:"var(--accent)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <Icon name="check" size={11} color="#fff"/>
                        </div>
                      )}
                    </div>
                    <div style={{ padding:".45rem .5rem", fontSize:".68rem", textAlign:"center", color: sel ? "var(--accent)" : "var(--charcoal)", fontWeight: sel ? 500 : 400 }}>
                      {t.name}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="ob-fieldlabel">Coupes préférées — Hauts <span style={{ textTransform:"none", color:"var(--warm-gray)" }}>(plusieurs choix)</span></div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:".5rem", margin:".5rem 0 1.1rem" }}>
              {CUTS_HAUTS.map(c => (
                <button key={c} onClick={() => toggleArr("cutsHauts", c)} className={"chip" + (draft.cutsHauts.includes(c) ? " selected" : "")}>{c}</button>
              ))}
            </div>
            <div className="ob-fieldlabel">Coupes préférées — Bas <span style={{ textTransform:"none", color:"var(--warm-gray)" }}>(plusieurs choix)</span></div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:".5rem", marginTop:".5rem" }}>
              {CUTS_BAS.map(c => (
                <button key={c} onClick={() => toggleArr("cutsBas", c)} className={"chip" + (draft.cutsBas.includes(c) ? " selected" : "")}>{c}</button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && <DressingStep draft={draft} setDraft={setDraft} />}
      </div>

      <div style={{ padding:".85rem 1.25rem 1rem", borderTop:"1px solid var(--bone)", display:"flex", flexDirection:"column", gap:".6rem", background:"var(--cream)" }}>
        {(step > 1 || step === 5) && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            {step > 1 ? (
              <button onClick={goBack} style={{ background:"none", border:"1px solid var(--bone)", borderRadius:"2px", padding:".6rem .9rem", fontSize:".76rem", color:"var(--stone)" }}>← Retour</button>
            ) : <span/>}
            {step === 5 && (
              <button onClick={() => onComplete(draft)} style={{ background:"none", border:"none", color:"var(--stone)", fontSize:".76rem", textDecoration:"underline", padding:".5rem" }}>Passer cette étape →</button>
            )}
          </div>
        )}
        <button onClick={goNext} disabled={!isValid()} className="btn-primary" style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
          {step === 5 ? "✦ Voir ma sélection" : isEditMode && step === 4 ? "Enregistrer" : "Continuer →"}
        </button>
      </div>

      {/* TEASER — aperçu de valeur après l'étape 2 */}
      <div style={{
        position:"fixed", inset:0, zIndex:80, background:"var(--cream)",
        transform: showTeaser ? "translateY(0)" : "translateY(100%)",
        transition:"transform .35s cubic-bezier(.4,0,.2,1)", display:"flex", flexDirection:"column",
        maxWidth:"430px", margin:"0 auto",
      }}>
        <div style={{ flex:1, overflowY:"auto", padding:"2.5rem 1.5rem 1.5rem", textAlign:"center" }}>
          <div style={{ width:"46px", height:"46px", borderRadius:"50%", background:"var(--accent-pale)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem" }}>
            <span style={{ fontSize:"1.2rem" }}>✦</span>
          </div>
          <h2 style={{ fontSize:"1.35rem", marginBottom:".5rem" }}>Déjà de belles pistes</h2>
          <p style={{ color:"var(--stone)", fontSize:".84rem", marginBottom:"1.75rem", maxWidth:"320px", marginLeft:"auto", marginRight:"auto" }}>
            Avec vos marques et votre style, voici un avant-goût de ce que Capsule vous proposera. Encore quelques précisions pour affiner votre sélection.
          </p>
          <div style={{ display:"flex", gap:".75rem", justifyContent:"center", flexWrap:"wrap" }}>
            {teaserProducts.map(p => (
              <div key={p.id} style={{ width:"104px", textAlign:"left" }}>
                <div style={{ width:"104px", height:"130px", borderRadius:"2px", overflow:"hidden", background:"#EAE4DA" }}>
                  <img src={p.image} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}
                    onError={e => { e.target.src = `https://placehold.co/104x130/EAE4DA/7C7268?text=${encodeURIComponent(p.brand)}`; }} />
                </div>
                <div style={{ fontSize:".6rem", textTransform:"uppercase", color:"var(--stone)", marginTop:".4rem" }}>{p.brand}</div>
                <div style={{ fontSize:".72rem", color:"var(--charcoal)", lineHeight:1.3 }}>{p.name}</div>
                <div style={{ fontSize:".68rem", color:"var(--accent)", marginTop:".15rem" }}>{p.matchScore}% compatible</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding:"1rem 1.25rem", borderTop:"1px solid var(--bone)", background:"var(--cream)" }}>
          <button onClick={continueFromTeaser} className="btn-primary">Continuer mon profil →</button>
        </div>
      </div>
    </div>
  );
}

// ─── Étape Marques — recherche + sélection ────────────────────
function BrandStep({ draft, toggleArr }) {
  const [query, setQuery] = useState("");
  const filtered = BRANDS.filter(b => normalizeText(b).includes(normalizeText(query)));
  return (
    <div>
      <div className="ob-fieldlabel">Marques préférées</div>
      <p style={{ color:"var(--stone)", fontSize:".85rem", margin:".5rem 0 1rem" }}>
        Recherchez et sélectionnez vos marques favorites.
      </p>
      <input type="text" value={query} placeholder="Rechercher une marque…"
        onChange={e => setQuery(e.target.value)} className="ob-text-input"
        style={{ marginBottom:".85rem" }} />
      {draft.brands.length > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:".4rem", marginBottom:".85rem" }}>
          {draft.brands.map(b => (
            <span key={b} onClick={() => toggleArr("brands", b)} style={{
              background:"var(--bone)", borderRadius:"9999px", padding:".3rem .7rem .3rem .9rem",
              fontSize:".76rem", display:"flex", alignItems:"center", gap:".4rem", cursor:"pointer",
            }}>{b} <span style={{ color:"var(--stone)" }}>✕</span></span>
          ))}
        </div>
      )}
      <div style={{ display:"flex", flexWrap:"wrap", gap:".5rem" }}>
        {filtered.map(b => (
          <button key={b} onClick={() => toggleArr("brands", b)}
            className={"chip" + (draft.brands.includes(b) ? " selected" : "")}>{b}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Étape Dressing — scan photo (placeholder) + ajout manuel ──
function DressingStep({ draft, setDraft }) {
  const dressing = draft.dressing;
  const addRow = () => setDraft(d => ({ ...d, dressing:[...d.dressing, emptyDressingItem()] }));
  const removeRow = (idx) => setDraft(d => ({ ...d, dressing: d.dressing.filter((_, i) => i !== idx) }));
  const updateRow = (idx, field, val) => setDraft(d => {
    const next = [...d.dressing];
    next[idx] = { ...next[idx], [field]: val };
    return { ...d, dressing: next };
  });

  return (
    <div>
      <h2 style={{ fontSize:"1.5rem", marginBottom:".4rem" }}>Votre dressing actuel</h2>
      <p style={{ color:"var(--stone)", fontSize:".85rem", marginBottom:"1.25rem" }}>
        Capsule évite les doublons et propose des pièces qui complètent ce que vous avez déjà. Cette étape est entièrement optionnelle.
      </p>
      <div style={{ border:"2px dashed var(--warm-gray)", borderRadius:"2px", padding:"1.5rem", textAlign:"center", marginBottom:"1.25rem", cursor:"pointer" }}>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:".5rem", color:"var(--stone)" }}>
          <Icon name="camera" size={26}/>
        </div>
        <div style={{ fontWeight:500, fontSize:".85rem" }}>Scanner via photo</div>
        <div style={{ fontSize:".72rem", color:"var(--stone)", marginTop:".2rem" }}>L'IA détecte automatiquement vos pièces</div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:".75rem", margin:"1.25rem 0" }}>
        <div style={{ flex:1, height:"1px", background:"var(--bone)" }}/>
        <span style={{ fontSize:".72rem", color:"var(--stone)", whiteSpace:"nowrap" }}>ou ajouter manuellement</span>
        <div style={{ flex:1, height:"1px", background:"var(--bone)" }}/>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:".6rem", marginBottom:"1rem" }}>
        {dressing.map((item, idx) => (
          <div key={idx} style={{ background:"var(--white)", border:"1px solid var(--bone)", borderRadius:"2px", padding:".75rem", display:"flex", flexWrap:"wrap", gap:".4rem", alignItems:"center" }}>
            <select value={item.type} onChange={e => updateRow(idx, "type", e.target.value)} style={dressingSelectStyle}>
              <option value="">Type</option>
              {VET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={item.brand} onChange={e => updateRow(idx, "brand", e.target.value)} style={dressingSelectStyle}>
              <option value="">Marque</option>
              {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              <option value="Autre">Autre</option>
            </select>
            <select value={item.color} onChange={e => updateRow(idx, "color", e.target.value)} style={dressingSelectStyle}>
              <option value="">Couleur</option>
              {COULEURS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={item.cut} onChange={e => updateRow(idx, "cut", e.target.value)} style={dressingSelectStyle}>
              <option value="">Coupe</option>
              {COUPES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={() => removeRow(idx)} aria-label="Supprimer cette pièce" style={{ background:"none", border:"none", color:"var(--warm-gray)", fontSize:".9rem", padding:".2rem .3rem", flexShrink:0 }}>✕</button>
          </div>
        ))}
      </div>
      <button onClick={addRow} className="btn-ghost" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:".4rem" }}>
        <Icon name="plus" size={14}/> Ajouter une pièce
      </button>
    </div>
  );
}

const dressingSelectStyle = { flex:"1 1 90px", border:"1px solid var(--bone)", borderRadius:"2px", padding:".4rem", fontSize:".76rem", background:"var(--cream)" };


// ═══════════════════════════════════════════════════════════════
// LISTING PAGE
// ═══════════════════════════════════════════════════════════════

function ListingPage({ profile, userId, onEditProfile, onSignOut }) {
  const [wishlist, setWishlist]             = useState([]);
  const [filterBrand, setFilterBrand]       = useState("All");
  const [filterType, setFilterType]         = useState("All");
  const [sortMode, setSortMode]             = useState("relevance");
  const [showWishlist, setShowWishlist]     = useState(false);
  const [avatarDdOpen, setAvatarDdOpen]     = useState(false);
  // aiInsights est intentionnellement réinitialisé à chaque remount (changement de profil)
  // ce qui invalide le cache IA automatiquement après une édition de profil
  const [aiInsights, setAiInsights]         = useState({});
  const [loadingInsight, setLoadingInsight] = useState(null);
  const [activeProduct, setActiveProduct]   = useState(null);
  const [showProfile, setShowProfile]       = useState(false);
  const [searchOpen, setSearchOpen]         = useState(false);
  const [searchQuery, setSearchQuery]       = useState("");
  // Filtrage débouncé : la saisie reste fluide même si le catalogue grossit.
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchInputRef                      = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 150);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Focus auto à l'ouverture + fermeture sur Échap
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 350);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setSearchOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Chargement initial de la wishlist depuis Supabase
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("wishlist_items")
      .select("product_id")
      .eq("user_id", userId)
      .then(({ data, error }) => {
        if (error) { console.error("Wishlist load error:", error); return; }
        if (data) setWishlist(data.map(w => Number(w.product_id)));
      });
  }, [userId]);

  const brands = ["All", ...Array.from(new Set(ALL_PRODUCTS.map(p => p.brand))).sort()];

  const displayed = ALL_PRODUCTS
    .filter(p => filterBrand==="All" || p.brand===filterBrand)
    .filter(p => filterType==="All"  || (TYPE_MAP[filterType] || [filterType]).includes(p.type) || p.category===filterType)
    .filter(p => {
      if (!debouncedQuery.trim()) return true;
      const q = normalizeText(debouncedQuery);
      return normalizeText(`${p.brand} ${p.name} ${p.type} ${p.color}`).includes(q);
    })
    .sort((a,b) => sortMode==="relevance" ? b.score-a.score : sortMode==="asc" ? a.price-b.price : b.price-a.price);

  // Résultats de recherche (indépendants des filtres marque/catégorie), pour l'overlay
  const searchResults = debouncedQuery.trim()
    ? ALL_PRODUCTS.filter(p => normalizeText(`${p.brand} ${p.name} ${p.type} ${p.color}`).includes(normalizeText(debouncedQuery)))
    : [];

  const wishlistProducts = ALL_PRODUCTS.filter(p => wishlist.includes(p.id));

  const toggleWish = (id, e) => {
    e?.stopPropagation();
    const isWished = wishlist.includes(id);
    // Mise à jour optimiste immédiate
    setWishlist(w => isWished ? w.filter(x => x !== id) : [...w, id]);
    // Sync Supabase en arrière-plan — silencieuse si erreur
    if (isWished) {
      supabase.from("wishlist_items")
        .delete()
        .eq("user_id", userId)
        .eq("product_id", String(id))
        .then(({ error }) => { if (error) console.error("Wishlist remove error:", error); });
    } else {
      supabase.from("wishlist_items")
        .insert({ user_id: userId, product_id: String(id) })
        .then(({ error }) => { if (error) console.error("Wishlist add error:", error); });
    }
  };

  const openProduct = async (product) => {
    setActiveProduct(product);
    if (!aiInsights[product.id]) {
      setLoadingInsight(product.id);
      const text = await fetchAIInsight(product, profile);
      setAiInsights(prev => ({...prev, [product.id]:text}));
      setLoadingInsight(null);
    }
  };

  return (
    <div className="ls-root">
      <header className="ls-header">
        <div className="ls-logo">
          CAPS<span style={{color:"#B5694A",fontStyle:"italic"}}>U</span>LE
        </div>
        <div className="ls-header-right">
          <button className="ls-icon-btn" aria-label="Rechercher" onClick={() => setSearchOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
          <button className="ls-icon-btn" onClick={() => setShowWishlist(true)} aria-label="Wishlist" style={{position:"relative"}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            {wishlist.length > 0 && <span className="ls-badge">{wishlist.length}</span>}
          </button>
          <div style={{position:"relative"}}>
            <button
              onClick={() => setAvatarDdOpen(o => !o)}
              style={{display:"flex",alignItems:"center",gap:".25rem",background:"none",border:"1px solid #EAE4DA",borderRadius:"9999px",padding:".2rem .45rem .2rem .2rem",cursor:"pointer"}}
            >
              <div style={{width:"22px",height:"22px",borderRadius:"50%",background:"#B5694A",color:"#fff",fontSize:".65rem",fontFamily:"'Jost',sans-serif",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {profile?.name?.[0]||"P"}
              </div>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#28211C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,3.5 5,6.5 8,3.5"/></svg>
            </button>
            {avatarDdOpen && (
              <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,background:"#fff",border:"1px solid #EAE4DA",borderRadius:"10px",boxShadow:"0 10px 30px rgba(0,0,0,.1)",minWidth:"180px",zIndex:200,overflow:"hidden"}}>
                <button onClick={() => { setAvatarDdOpen(false); setShowProfile(true); }} style={{display:"block",width:"100%",padding:".65rem 1rem",border:"none",background:"none",textAlign:"left",fontSize:".82rem",color:"#28211C",cursor:"pointer",fontFamily:"'Jost',sans-serif"}}>
                  Modifier mon profil
                </button>
                <button onClick={() => { setAvatarDdOpen(false); onSignOut(); }} style={{display:"block",width:"100%",padding:".65rem 1rem",border:"none",borderTop:"1px solid #EAE4DA",background:"none",textAlign:"left",fontSize:".82rem",color:"#28211C",cursor:"pointer",fontFamily:"'Jost',sans-serif"}}>
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Barre profil */}
      <div className="ls-profile-bar">
        <div style={{display:"flex",alignItems:"center",gap:".5rem",flexWrap:"wrap"}}>
          <span style={{fontSize:".78rem"}}>
            Profil&nbsp;:&nbsp;<em style={{fontFamily:"'Playfair Display',serif",color:"#D4A090",fontStyle:"italic"}}>{profile?.name||"Vous"}</em>
          </span>
          {(profile?.style||[]).map(s => (
            <span key={s} style={{background:"rgba(255,255,255,.1)",borderRadius:"9999px",padding:".15rem .55rem",fontSize:".68rem",flexShrink:0}}>
              {s}
            </span>
          ))}
        </div>
        <span className="ls-profile-bar-count">{displayed.length} pièces</span>
      </div>

      {/* Insight IA */}
      <div className="ls-insight">
        <AIDot/>
        <span className="ls-insight-text">{FALLBACK_LISTING_INSIGHT}</span>
      </div>

      {/* Catégories */}
      <div className="ls-categories">
        {TYPES.map(t => (
          <button key={t.key} onClick={() => setFilterType(t.key)} className={`ls-chip${filterType===t.key?" active":""}`}>{t.label}</button>
        ))}
      </div>

      {/* Filtres marque + tri */}
      <div className="ls-filter-bar">
        <div style={{display:"flex",gap:".5rem",alignItems:"center"}}>
          <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)} className="ls-select">
            <option value="All">Toutes les marques</option>
            {brands.filter(b=>b!=="All").map(b => <option key={b}>{b}</option>)}
          </select>
          <select value={sortMode} onChange={e => setSortMode(e.target.value)} className="ls-select">
            <option value="relevance">Pertinence IA</option>
            <option value="asc">Prix ↑</option>
            <option value="desc">Prix ↓</option>
          </select>
        </div>
        <span style={{fontSize:".72rem",color:"#7C7268"}}>{displayed.length} pièce{displayed.length!==1?"s":""}</span>
      </div>

      <div className="ls-grid">
        {displayed.map((p,i) => (
          <ProductCard key={p.id} product={p} index={i}
            isWished={wishlist.includes(p.id)} onWish={toggleWish} onClick={() => openProduct(p)} />
        ))}
      </div>

      {activeProduct && (
        <ProductModal product={activeProduct} isWished={wishlist.includes(activeProduct.id)}
          onWish={toggleWish} onClose={() => setActiveProduct(null)}
          insight={aiInsights[activeProduct.id]} loading={loadingInsight===activeProduct.id} />
      )}
      {showWishlist && (
        <WishlistPanel products={wishlistProducts} onClose={() => setShowWishlist(false)}
          onRemove={id => setWishlist(w => w.filter(x=>x!==id))}
          onOpen={p => { openProduct(p); setShowWishlist(false); }} />
      )}
      {showProfile && (
        <ProfilePanel profile={profile} onClose={() => setShowProfile(false)}
          onEdit={() => { setShowProfile(false); onEditProfile(); }}
          onSignOut={onSignOut} />
      )}

      {/* Overlay de recherche plein écran */}
      <div className="ls-search-overlay" style={{ transform: searchOpen ? "translateY(0)" : "translateY(-100%)" }}>
        <div className="ls-search-head">
          <div className="ls-logo" style={{ fontSize:"1.1rem", letterSpacing:".12em" }}>
            CAPS<span style={{ color:"#B5694A", fontStyle:"italic" }}>U</span>LE
          </div>
          <button className="ls-icon-btn" aria-label="Fermer la recherche" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ padding:"2.5rem 1.5rem 1.25rem" }}>
          <div className="ls-search-field">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C7268" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input ref={searchInputRef} type="text" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher une pièce, une marque…" className="ls-search-input" />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} aria-label="Effacer" style={{ background:"none", border:"none", color:"var(--warm-gray)", padding:".2rem", cursor:"pointer", display:"flex" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
        </div>

        {!searchQuery.trim() && (
          <div style={{ padding:"0 1.5rem" }}>
            <div className="ls-search-lbl">Catégories populaires</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:".5rem", marginBottom:"1.75rem" }}>
              {TYPES.filter(t => t.key !== "All").map(t => (
                <button key={t.key} onClick={() => setSearchQuery(t.label)} className="ls-search-sugg">{t.label}</button>
              ))}
            </div>
            {(profile?.brands || []).length > 0 && (
              <>
                <div className="ls-search-lbl">Marques populaires</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:".5rem" }}>
                  {profile.brands.map(b => (
                    <button key={b} onClick={() => setSearchQuery(b)} className="ls-search-sugg accent">{b}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {searchQuery.trim() && (
          <div style={{ flex:1, overflowY:"auto", padding:"0 1.5rem 1.5rem" }}>
            <div className="ls-search-lbl">{searchResults.length} résultat{searchResults.length > 1 ? "s" : ""}</div>
            {searchResults.length === 0 ? (
              <div style={{ textAlign:"center", padding:"2rem 0", color:"var(--stone)", fontSize:".85rem" }}>
                Aucun résultat pour «&nbsp;{searchQuery}&nbsp;»
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column" }}>
                {searchResults.slice(0, 8).map(p => (
                  <div key={p.id} className="ls-search-result" onClick={() => { setSearchOpen(false); setSearchQuery(""); openProduct(p); }}>
                    <img src={p.image} alt={p.name} className="ls-search-thumb"
                      onError={e => { e.target.src = `https://placehold.co/46x58/EAE4DA/7C7268?text=${encodeURIComponent(p.brand)}`; }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:".62rem", textTransform:"uppercase", color:"var(--stone)", letterSpacing:".1em" }}>{p.brand}</div>
                      <div style={{ fontSize:".85rem", color:"var(--charcoal)" }}>{p.name}</div>
                    </div>
                    <div style={{ fontSize:".8rem", color:"var(--charcoal)", flexShrink:0 }}>{p.price} €</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product, index, isWished, onWish, onClick }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const tagConf = TAG_COLORS[product.tag];
  return (
    <div className="af" style={{cursor:"pointer",animationDelay:`${index*.04}s`}} onClick={onClick}>
      <div style={{position:"relative",aspectRatio:"3/4",borderRadius:"2px",overflow:"hidden",background:"#EAE4DA"}}>
        {!imgLoaded && <div style={{position:"absolute",inset:0,background:"#EAE4DA"}}/>}
        <img src={product.image} alt={product.name}
          onLoad={()=>setImgLoaded(true)}
          onError={e=>{e.target.src=`https://placehold.co/400x533/EAE4DA/7C7268?text=${encodeURIComponent(product.brand)}`;setImgLoaded(true);}}
          style={{width:"100%",height:"100%",objectFit:"cover",display:"block",opacity:imgLoaded?1:0,transition:"opacity .4s"}}/>
        {product.tag && tagConf && (
          <span style={{position:"absolute",top:".5rem",left:".5rem",background:tagConf.bg,color:tagConf.color,padding:".2rem .55rem",borderRadius:"100px",fontSize:".6rem",fontWeight:500,letterSpacing:".04em",backdropFilter:"blur(4px)",lineHeight:1.4}}>
            {product.tag}
          </span>
        )}
        <button
          style={{position:"absolute",top:".5rem",right:".5rem",width:"28px",height:"28px",borderRadius:"50%",background:"rgba(255,255,255,.92)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}
          onClick={e=>onWish(product.id,e)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={isWished?"#B5694A":"none"} stroke="#B5694A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>
      <div style={{paddingTop:".5rem"}}>
        <div style={{fontSize:".6rem",textTransform:"uppercase",letterSpacing:".12em",color:"#7C7268"}}>{product.brand}</div>
        <div style={{fontSize:".82rem",color:"#28211C",fontWeight:300,margin:".1rem 0 .35rem",lineHeight:1.35}}>{product.name}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:".85rem",color:"#28211C"}}>{product.price} €</span>
          <div style={{display:"flex",alignItems:"center",gap:".3rem"}}>
            <div style={{width:"24px",height:"3px",background:"#EAE4DA",borderRadius:"2px",overflow:"hidden"}}>
              <div style={{width:`${product.score}%`,height:"100%",background:"#B5694A"}}/>
            </div>
            <span style={{fontSize:".65rem",color:"#B5694A"}}>{product.score}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductModal({ product, isWished, onWish, onClose, insight, loading }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-inner">
          <div className="modal-img-wrap">
            <img src={product.image} alt={product.name} className="modal-img"
              onError={e=>{e.target.src=`https://placehold.co/600x750/E8E0D5/8B7355?text=${encodeURIComponent(product.brand)}`;}}/>
            {product.tag && <div className="ls-tag" style={{top:16,left:16,background:TAG_COLORS[product.tag]?.bg,color:TAG_COLORS[product.tag]?.color}}>{product.tag}</div>}
          </div>
          <div className="modal-info">
            <div className="modal-brand">{product.brand}</div>
            <h2 className="modal-name">{product.name}</h2>
            <div className="modal-match">
              <div className="modal-match-lbl"><span>Compatibilité avec votre profil</span><span>{product.score}%</span></div>
              <div className="modal-track"><div className="modal-fill" style={{width:`${product.score}%`}}/></div>
            </div>
            <div className="modal-insight">
              <span className="modal-insight-icon">✦</span>
              {loading
                ? <span className="modal-loading">Analyse de votre profil…</span>
                : <span className="modal-insight-text">{insight||"—"}</span>
              }
            </div>
            <div className="modal-details">
              {[["Couleur",product.color],["Taille",product.size],["Catégorie",product.type],["Prix",`${product.price} €`]].map(([l,v])=>(
                <div key={l} className="modal-detail">
                  <span className="modal-detail-lbl">{l}</span>
                  <span className="modal-detail-val">{v}</span>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button onClick={e=>onWish(product.id,e)} className={`btn-outline${isWished?" wished":""}`}>
                {isWished?"♥ Dans ma wishlist":"♡ Ajouter à la wishlist"}
              </button>
              <a href="#" target="_blank" rel="noopener noreferrer" className="btn-primary">Voir sur {product.brand.toUpperCase()} →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WishlistPanel({ products, onClose, onRemove, onOpen }) {
  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-box" onClick={e=>e.stopPropagation()}>
        <div className="panel-header">
          <div><h2 className="panel-title">Ma Wishlist</h2>{products.length>0&&<p className="panel-sub">{products.length} pièce{products.length>1?"s":""}</p>}</div>
          <button className="modal-close" style={{position:"static"}} onClick={onClose}>✕</button>
        </div>
        {products.length===0
          ? <div className="panel-empty"><div style={{fontSize:44,opacity:.4}}>♡</div><p style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",color:"var(--charcoal)"}}>Votre wishlist est vide</p><p style={{fontSize:12}}>Ajoutez vos pièces favorites depuis le listing</p></div>
          : <div className="panel-list">
              {products.map(p=>(
                <div key={p.id} className="panel-item">
                  <img src={p.image} alt={p.name} className="panel-thumb" onClick={()=>onOpen(p)} style={{cursor:"pointer"}}
                    onError={e=>{e.target.src=`https://placehold.co/80x100/EAE4DA/7C7268?text=${encodeURIComponent(p.brand)}`;}}/>
                  <div className="panel-item-info">
                    <div className="panel-item-brand">{p.brand}</div>
                    <div className="panel-item-name">{p.name}</div>
                    <div className="panel-item-price">{p.price} €</div>
                    <button onClick={()=>onOpen(p)} style={{background:"none",border:"none",color:"var(--accent)",fontSize:".72rem",padding:0,cursor:"pointer",marginTop:4}}>Voir →</button>
                  </div>
                  <button onClick={e=>{e.stopPropagation();onRemove(p.id);}} style={{background:"none",border:"none",cursor:"pointer",color:"var(--stone)",fontSize:16,alignSelf:"flex-start"}}>✕</button>
                </div>
              ))}
              <div className="panel-total">
                <span>Total estimé</span>
                <span>{products.reduce((s,p)=>s+p.price,0)} €</span>
              </div>
            </div>
        }
      </div>
    </div>
  );
}

function ProfilePanel({ profile, onClose, onEdit, onSignOut }) {
  const dressingStr = (profile?.dressing||[]).map(d=>`${d.color} ${d.type}${d.brand?` · ${d.brand}`:""}`.trim()).filter(Boolean);
  const cuts = [...(profile?.cutsHauts||[]), ...(profile?.cutsBas||[])];
  const sizeEntries = Object.entries(profile?.sizes||{}).filter(([,v])=>v);
  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-box" onClick={e=>e.stopPropagation()}>
        <div className="panel-header">
          <h2 className="panel-title">Mon profil</h2>
          <button className="modal-close" style={{position:"static"}} onClick={onClose}>✕</button>
        </div>
        <div className="panel-list">
          <div className="profile-row">
            <div className="profile-avatar">{profile?.name?.[0]}</div>
            <div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:600,color:"#1C1510"}}>{profile?.name}</div>
              <div style={{fontSize:10,color:"#7C7268",letterSpacing:".1em",textTransform:"uppercase"}}>Membre Capsule{profile?.gender?` · ${profile.gender}`:""}</div>
            </div>
          </div>
          {(profile?.style||[]).length>0&&<div className="profile-section"><div className="profile-section-lbl">✨ Style</div><div className="chips-grid" style={{marginTop:8}}>{profile.style.map(s=><span key={s} className="chip selected" style={{cursor:"default"}}>{s}</span>)}</div></div>}
          <div className="profile-section"><div className="profile-section-lbl">🧭 Découvertes</div><div className="profile-section-val">{profile?.discovery==="open"?"Ouvert·e aux nouvelles marques":"Mes marques uniquement"}</div></div>
          {(profile?.brands||[]).length>0&&<div className="profile-section"><div className="profile-section-lbl">🏷️ Marques ({profile.brands.length})</div><div className="chips-grid" style={{marginTop:8}}>{profile.brands.map(m=><span key={m} className="chip selected" style={{cursor:"default"}}>{m}</span>)}</div></div>}
          {(profile?.tones||[]).length>0&&<div className="profile-section"><div className="profile-section-lbl">🎨 Tons</div><div className="chips-grid" style={{marginTop:8}}>{profile.tones.map(t=><span key={t} className="chip selected" style={{cursor:"default"}}>{t}</span>)}</div></div>}
          {cuts.length>0&&<div className="profile-section"><div className="profile-section-lbl">✂️ Coupes</div><div className="chips-grid" style={{marginTop:8}}>{cuts.map(c=><span key={c} className="chip selected" style={{cursor:"default"}}>{c}</span>)}</div></div>}
          {sizeEntries.length>0&&<div className="profile-section"><div className="profile-section-lbl">📐 Tailles</div><div style={{marginTop:8,display:"flex",flexDirection:"column",gap:5}}>{sizeEntries.map(([k,v])=>(<div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:13}}><span style={{color:"#7C7268"}}>{SIZE_LABELS[k]||k}</span><span className="chip selected" style={{cursor:"default"}}>{v}</span></div>))}</div></div>}
          {dressingStr.length>0&&<div className="profile-section"><div className="profile-section-lbl">👗 Dressing ({dressingStr.length})</div><div className="chips-grid" style={{marginTop:8}}>{dressingStr.map((v,i)=><span key={i} className="chip" style={{cursor:"default",fontSize:11}}>{v}</span>)}</div></div>}
          <button className="btn-outline" onClick={onEdit} style={{width:"100%",marginTop:4}}>✏️ Modifier mon profil</button>
          <button className="btn-outline" onClick={onSignOut} style={{width:"100%",marginTop:8,color:"#7C7268",borderColor:"#EAE4DA"}}>Se déconnecter</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════════════════════════
const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--cream:#F6F2EC;--bone:#EAE4DA;--stone:#7C7268;--charcoal:#28211C;--ink:#1C1510;--accent:#B5694A;--accent-light:#D4A090;--accent-pale:#FAF0EB}
body{background:var(--cream);font-family:'Jost',sans-serif}
::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:var(--accent-light);border-radius:2px}
@keyframes fu{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes fi{from{opacity:0}to{opacity:1}}
@keyframes sr{from{opacity:0;transform:translateX(26px)}to{opacity:1;transform:translateX(0)}}
@keyframes sl{from{opacity:0;transform:translateX(-26px)}to{opacity:1;transform:translateX(0)}}
@keyframes pi{from{transform:translateX(100%)}to{transform:translateX(0)}}
@keyframes sh{0%,100%{opacity:.4}50%{opacity:.9}}
.af{animation:fu .4s ease both}
.anim-forward{animation:sr .26s cubic-bezier(.22,.68,0,1.2) both}
.anim-back{animation:sl .26s cubic-bezier(.22,.68,0,1.2) both}

/* ── ONBOARDING (copie conforme prototype) ── */
:root{--warm-gray:#BDB5A8;--white:#FDFAF7;--success:#5A8060;--error:#B84040}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideInRight{from{transform:translateX(24px);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes slideInLeft{from{transform:translateX(-24px);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes blink{0%,80%,100%{opacity:.25}40%{opacity:1}}
.dots-loading{display:inline-flex;align-items:center}
.dots-loading span{display:inline-block;width:5px;height:5px;border-radius:50%;background:currentColor;margin:0 2px;animation:blink 1.2s infinite}
.dots-loading span:nth-child(2){animation-delay:.2s}
.dots-loading span:nth-child(3){animation-delay:.4s}
.fade-in{animation:fadeIn .35s ease both}
.step-enter-fwd{animation:slideInRight .3s ease both}
.step-enter-back{animation:slideInLeft .3s ease both}
.phone-frame{width:100%;max-width:430px;margin:0 auto;background:var(--cream);min-height:100vh;position:relative;overflow-x:hidden}
@media(min-width:480px){.phone-frame{box-shadow:0 0 60px rgba(28,21,16,.12)}}
.phone-frame h1,.phone-frame h2,.phone-frame h3{font-family:'Playfair Display',serif;font-weight:400;font-style:italic;color:var(--ink)}
.ob-fieldlabel{font-size:.68rem;text-transform:uppercase;letter-spacing:.05em;color:var(--stone);margin-bottom:.4rem}
.ob-text-input{width:100%;border:1px solid var(--bone);border-radius:2px;padding:.85rem 1rem;font-size:1rem;background:var(--white);outline:none;font-family:'Jost',sans-serif;color:var(--charcoal)}
.ob-text-input:focus{border-color:var(--accent)}
.phone-frame .btn-primary{width:100%;background:var(--ink);color:var(--white);border:none;border-radius:2px;padding:.85rem;font-size:.78rem;font-weight:500;letter-spacing:.07em;text-transform:uppercase;transition:background .2s;cursor:pointer;font-family:'Jost',sans-serif}
.phone-frame .btn-primary:hover:not(:disabled){background:var(--accent)}
.phone-frame .btn-primary:disabled{background:var(--warm-gray);cursor:not-allowed}
.phone-frame .btn-ghost{width:100%;background:transparent;color:var(--ink);border:1px solid var(--ink);border-radius:2px;padding:.8rem;font-size:.78rem;font-weight:500;letter-spacing:.06em;text-transform:uppercase;transition:all .2s;cursor:pointer;font-family:'Jost',sans-serif}
.phone-frame .btn-ghost:hover{border-color:var(--accent);color:var(--accent)}
.chip{border:1px solid var(--bone);background:var(--white);color:var(--charcoal);border-radius:9999px;padding:.45rem 1rem;font-size:.8rem;transition:all .18s;white-space:nowrap;cursor:pointer;font-family:'Jost',sans-serif}
.chip.selected{background:var(--ink);border-color:var(--ink);color:var(--white)}
.chip:hover:not(.selected){border-color:var(--accent-light)}

/* ── ONBOARDING (legacy, conservé pour AuthScreen) ── */
.ob-root{display:flex;min-height:100vh}
.ob-side{width:268px;min-height:100vh;background:#0F0F0F;padding:40px 30px;display:flex;flex-direction:column;position:sticky;top:0;flex-shrink:0;overflow:hidden}
.ob-brand{margin-bottom:48px}
.ob-logo{font-family:'Playfair Display',serif;font-size:26px;font-weight:600;letter-spacing:.06em;color:#F7F3EE;line-height:1}
.ob-tagline{font-size:9px;color:#6B5A4A;letter-spacing:.14em;text-transform:uppercase;margin-top:4px}
.ob-steps{display:flex;flex-direction:column;gap:4px;flex:1}
.ob-step-item{display:flex;align-items:center;gap:12px;font-size:12px;color:#2E2E2E;transition:color .2s;padding:5px 0}
.ob-step-item.active{color:#F7F3EE}.ob-step-item.done{color:#5A4A3A}
.ob-step-dot{width:28px;height:28px;border-radius:50%;border:1px solid #222;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;transition:all .25s;color:#444}
.ob-step-item.active .ob-step-dot{background:#C4A882;border-color:#C4A882;color:#0F0F0F;font-weight:600}
.ob-step-item.done .ob-step-dot{background:#1E1E1E;border-color:#1E1E1E;color:#C4A882}
.ob-side-deco{position:relative;height:80px;margin-top:20px}
.ob-deco-r1{position:absolute;bottom:-28px;right:-46px;width:130px;height:130px;border-radius:50%;border:1px solid rgba(196,168,130,.14)}
.ob-deco-r2{position:absolute;bottom:-4px;right:10px;width:76px;height:76px;border-radius:50%;border:1px solid rgba(196,168,130,.07)}

.ob-main{flex:1;display:flex;flex-direction:column;min-width:0}
.ob-progress{height:2px;background:#EDE5DA;flex-shrink:0}
.ob-progress-fill{height:100%;background:linear-gradient(90deg,#C4A882,#0F0F0F);transition:width .45s ease}
.ob-content{flex:1;padding:48px 56px 24px;overflow-y:auto}
.ob-section{max-width:580px}
.ob-eyebrow{font-size:10px;text-transform:uppercase;letter-spacing:.16em;color:#C4A882;font-weight:500;margin-bottom:10px}
.ob-title{font-family:'Playfair Display',serif;font-size:36px;font-weight:400;color:#0F0F0F;line-height:1.2;margin-bottom:12px}
.ob-desc{font-size:14px;color:#8B7355;line-height:1.75;margin-bottom:24px;font-weight:300}
.ob-hint{font-size:12px;color:#B0A090;font-style:italic;margin-top:14px}
.ob-label{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#8B7355;font-weight:500;margin-bottom:8px}
.ob-optional{font-size:9px;color:#B0A090;text-transform:none;letter-spacing:0;font-weight:300;margin-left:4px}
.ob-input{display:block;width:100%;padding:12px 14px;border:1px solid #DDD5C8;border-radius:8px;font-size:14px;font-family:inherit;background:#fff;color:#0F0F0F;outline:none;transition:border-color .2s;margin-bottom:16px}
.ob-input:focus{border-color:#0F0F0F}

/* Wardrobe builder */
.wardrobe-builder{display:flex;flex-direction:column;gap:20px;margin-bottom:24px;padding:20px;background:#fff;border:1px solid #EDE5DA;border-radius:12px}
.wb-field{display:flex;flex-direction:column;gap:0}
.wb-add-btn{padding:12px 18px;background:#0F0F0F;color:#F7F3EE;border:none;border-radius:8px;font-size:13px;font-family:inherit;cursor:pointer;text-align:left;transition:background .2s}
.wb-add-btn:hover{background:#C4A882}
.wb-add-btn em{font-style:normal;opacity:.7;font-size:12px}

/* Brand dropdown */
.brand-input-wrap{position:relative}
.brand-dropdown{position:absolute;top:100%;left:0;right:0;background:#fff;border:1px solid #DDD5C8;border-radius:0 0 8px 8px;z-index:50;box-shadow:0 8px 24px rgba(0,0,0,.10);max-height:220px;overflow-y:auto}
.brand-sugg-item{display:flex;align-items:center;justify-content:space-between;width:100%;padding:10px 14px;background:none;border:none;border-bottom:1px solid #F0EAE2;font-size:13px;font-family:inherit;cursor:pointer;color:#0F0F0F;text-align:left;transition:background .15s}
.brand-sugg-item:last-child{border-bottom:none}
.brand-sugg-item:hover{background:#F7F3EE}
.brand-sugg-item.picked{color:#C4A882}
.brand-sugg-check{font-size:12px;color:#C4A882;font-weight:600}

/* Wardrobe tags */
.wardrobe-list{margin-top:4px}
.wardrobe-tags{display:flex;flex-direction:column;gap:7px;max-height:200px;overflow-y:auto}
.wardrobe-tag{display:flex;align-items:center;gap:8px;padding:8px 12px;background:#fff;border:1px solid #EDE5DA;border-radius:8px;font-size:13px;color:#0F0F0F}
.wt-color-dot{width:8px;height:8px;border-radius:50%;background:#C4A882;flex-shrink:0}
.wt-remove{margin-left:auto;background:none;border:none;cursor:pointer;color:#8B7355;font-size:16px;line-height:1}

/* Chips */
.chips-grid{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:4px}

/* Style grid */
.style-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:10px}
.style-card{display:flex;flex-direction:column;gap:3px;padding:14px;border:1px solid #DDD5C8;border-radius:10px;cursor:pointer;background:#fff;text-align:left;transition:all .15s}
.style-card:hover{border-color:#8B7355;box-shadow:0 4px 12px rgba(0,0,0,.06)}
.style-card.sel{border-color:#0F0F0F;background:#0F0F0F}
.style-card.sel .style-label,.style-card.sel .style-desc{color:#F7F3EE}
.style-card.sel .style-desc{color:#6B5A4A}
.style-emoji{font-size:20px;margin-bottom:3px}
.style-label{font-weight:500;font-size:13px;color:#0F0F0F}
.style-desc{font-size:11px;color:#8B7355;line-height:1.4}

.ouv-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.ouv-card{display:flex;flex-direction:column;gap:9px;padding:22px 18px;border:1px solid #DDD5C8;border-radius:12px;cursor:pointer;background:#fff;text-align:left;transition:all .2s}
.ouv-card:hover{border-color:#8B7355}
.ouv-card.sel{border-color:#0F0F0F;background:#0F0F0F;color:#F7F3EE}
.ouv-card strong{font-size:14px}
.ouv-card p{font-size:12px;color:#8B7355;line-height:1.5}
.ouv-card.sel p{color:#6B5A4A}

.tailles-list{display:flex;flex-direction:column;gap:18px}
.taille-row{display:flex;flex-direction:column;gap:7px}
.taille-label{font-size:13px;font-weight:500;color:#0F0F0F}
.taille-chips{display:flex;flex-wrap:wrap;gap:7px}
.t-chip{padding:6px 13px;border:1px solid #DDD5C8;border-radius:100px;font-size:12px;cursor:pointer;background:#fff;color:#0F0F0F;font-family:inherit;transition:all .15s}
.t-chip:hover{border-color:#8B7355}
.t-chip.sel{background:#0F0F0F;color:#F7F3EE;border-color:#0F0F0F}

.tons-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.ton-card{border:1px solid #DDD5C8;border-radius:10px;overflow:hidden;cursor:pointer;background:#fff;transition:all .15s;display:flex;flex-direction:column}
.ton-card:hover{border-color:#8B7355;transform:translateY(-2px)}
.ton-card.sel{border-color:#0F0F0F;border-width:2px}
.ton-swatches{height:44px;display:flex;overflow:hidden}
.ton-label{padding:8px 10px;font-size:12px;color:#0F0F0F;font-weight:500}

.ob-nav{display:flex;align-items:center;justify-content:space-between;padding:18px 56px 28px;border-top:1px solid #EDE5DA;flex-shrink:0;gap:16px}
.back-btn{background:none;border:none;cursor:pointer;font-size:13px;color:#8B7355;font-family:inherit;transition:color .2s}
.back-btn:hover{color:#0F0F0F}
.next-btn{padding:12px 26px;background:#0F0F0F;color:#F7F3EE;border:none;border-radius:100px;font-size:13px;cursor:pointer;font-family:inherit;letter-spacing:.06em;transition:background .2s;margin-left:auto}
.next-btn:hover:not(.dis){background:#C4A882}
.next-btn.dis{opacity:.35;cursor:not-allowed}

/* ── LISTING ── */
.ls-root{min-height:100vh;background:var(--cream)}
.ls-header{display:flex;align-items:center;justify-content:space-between;padding:0 1.25rem;height:56px;border-bottom:1px solid var(--bone);background:var(--cream);position:sticky;top:0;z-index:100}
.ls-logo{font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:500;letter-spacing:.15em;color:var(--ink);line-height:1}
.ls-header-right{display:flex;align-items:center;gap:.5rem}
.ls-icon-btn{width:34px;height:34px;border:none;border-radius:50%;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--charcoal);transition:background .15s;position:relative;padding:0}
.ls-icon-btn:hover{background:var(--bone)}
.ls-badge{position:absolute;top:0;right:0;background:var(--accent);color:#fff;border-radius:50%;width:14px;height:14px;font-size:.55rem;display:flex;align-items:center;justify-content:center;font-weight:700;pointer-events:none}
.ls-profile-bar{display:flex;align-items:center;justify-content:space-between;padding:.55rem 1.25rem;background:var(--ink);color:#fff;gap:.5rem;flex-wrap:wrap}
.ls-profile-bar-count{font-size:.68rem;color:rgba(255,255,255,.5);white-space:nowrap}
.ls-categories{display:flex;gap:.5rem;overflow-x:auto;padding:.9rem 1.25rem .6rem;scrollbar-width:none}
.ls-categories::-webkit-scrollbar{display:none}
.ls-chip{flex-shrink:0;padding:.4rem .9rem;border-radius:9999px;font-size:.78rem;border:none;background:var(--bone);color:var(--charcoal);cursor:pointer;font-family:inherit;transition:all .15s;white-space:nowrap}
.ls-chip.active{background:var(--ink);color:#fff}
.ls-filter-bar{display:flex;align-items:center;justify-content:space-between;padding:.3rem 1.25rem .8rem;gap:.5rem;border-bottom:1px solid var(--bone)}
.ls-select{padding:.35rem .6rem;border:1px solid var(--warm-gray);border-radius:2px;background:var(--white);font-size:.75rem;cursor:pointer;color:var(--charcoal);font-family:inherit;outline:none}
.ls-insight{background:var(--accent-pale);padding:.75rem 1.25rem;font-size:.82rem;color:var(--charcoal);display:flex;align-items:flex-start;gap:.1rem}
.ls-insight-text{font-style:italic;font-family:'Playfair Display',serif}
.ls-search-overlay{position:fixed;inset:0;z-index:300;background:var(--cream);display:flex;flex-direction:column;transition:transform .38s cubic-bezier(.4,0,.2,1)}
.ls-search-head{display:flex;align-items:center;justify-content:space-between;padding:1.1rem 1.25rem;border-bottom:1px solid var(--bone)}
.ls-search-field{display:flex;align-items:center;gap:.75rem;border-bottom:1.5px solid var(--charcoal);padding-bottom:.6rem;max-width:760px}
.ls-search-input{flex:1;border:none;outline:none;background:none;font-family:'Playfair Display',serif;font-style:italic;font-size:1.3rem;color:var(--charcoal)}
.ls-search-input::placeholder{color:var(--warm-gray);font-style:italic}
.ls-search-lbl{font-size:.65rem;text-transform:uppercase;letter-spacing:.1em;color:var(--stone);margin-bottom:.75rem}
.ls-search-sugg{padding:.4rem .85rem;border-radius:9999px;font-size:.78rem;border:1px solid var(--bone);background:var(--white);color:var(--charcoal);cursor:pointer;font-family:'Jost',sans-serif}
.ls-search-sugg.accent{border-color:var(--accent-light);background:var(--accent-pale);color:var(--accent)}
.ls-search-result{display:flex;align-items:center;gap:.85rem;padding:.6rem 0;border-bottom:1px solid var(--bone);cursor:pointer;max-width:760px}
.ls-search-thumb{width:46px;height:58px;border-radius:2px;object-fit:cover;background:var(--bone);flex-shrink:0}
.ls-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(195px,1fr));gap:.75rem;padding:1rem 1.25rem}

/* ── MODAL ── */
.modal-overlay{position:fixed;inset:0;background:rgba(28,21,16,.55);backdrop-filter:blur(6px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;animation:fi .2s ease}
.modal-box{background:var(--cream);border-radius:4px;max-width:800px;width:100%;max-height:90vh;overflow:auto;position:relative;box-shadow:0 40px 100px rgba(28,21,16,.28)}
.modal-close{position:absolute;top:13px;right:13px;background:rgba(246,242,236,.92);border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:14px;z-index:10;backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;transition:background .2s;color:var(--charcoal)}
.modal-close:hover{background:var(--bone)}
.modal-inner{display:grid;grid-template-columns:1fr 1fr;min-height:440px}
.modal-img-wrap{position:relative;border-radius:4px 0 0 4px;overflow:hidden}
.modal-img{width:100%;height:100%;object-fit:cover;min-height:340px}
.modal-info{padding:34px 30px;display:flex;flex-direction:column;gap:16px}
.modal-brand{font-size:.6rem;font-weight:500;letter-spacing:.16em;color:var(--stone);text-transform:uppercase}
.modal-name{font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:400;font-style:italic;color:var(--ink);line-height:1.25}
.modal-match{display:flex;flex-direction:column;gap:5px}
.modal-match-lbl{display:flex;justify-content:space-between;font-size:.72rem;color:var(--stone)}
.modal-match-lbl span:last-child{color:var(--accent);font-weight:500}
.modal-track{height:5px;background:var(--bone);border-radius:2px;overflow:hidden}
.modal-fill{height:100%;background:linear-gradient(90deg,var(--accent-light),var(--accent));border-radius:2px;transition:width 1.2s cubic-bezier(.4,0,.2,1)}
.modal-insight{background:var(--accent-pale);border-left:3px solid var(--accent);border-radius:2px;padding:1rem;display:flex;gap:9px;align-items:flex-start}
.modal-insight-icon{color:var(--accent);font-size:13px;flex-shrink:0;margin-top:2px}
.modal-insight-text{font-size:.85rem;color:var(--charcoal);line-height:1.7;font-weight:300}
.modal-loading{font-size:13px;color:var(--stone);font-style:italic;animation:sh 1.2s infinite}
.modal-details{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.modal-detail{display:flex;flex-direction:column;gap:2px}
.modal-detail-lbl{font-size:.6rem;text-transform:uppercase;letter-spacing:.1em;color:var(--stone);font-weight:500}
.modal-detail-val{font-size:.85rem;color:var(--charcoal)}
.modal-actions{display:flex;flex-direction:column;gap:8px;margin-top:auto}

.btn-primary{display:block;text-align:center;background:var(--ink);color:var(--white);padding:.85rem 20px;border-radius:2px;font-size:.78rem;text-decoration:none;font-family:'Jost',sans-serif;letter-spacing:.07em;text-transform:uppercase;transition:background .2s;font-weight:500;border:none;cursor:pointer}
.btn-primary:hover{background:var(--accent)}
.btn-outline{border:1px solid var(--ink);border-radius:2px;padding:.8rem 20px;font-size:.78rem;cursor:pointer;font-family:'Jost',sans-serif;letter-spacing:.06em;text-transform:uppercase;transition:all .2s;background:transparent;color:var(--ink)}
.btn-outline:hover{border-color:var(--accent);color:var(--accent)}
.btn-outline.wished{background:var(--accent-pale);border-color:var(--accent);color:var(--accent)}

/* ── PANELS ── */
.panel-overlay{position:fixed;inset:0;background:rgba(28,21,16,.4);backdrop-filter:blur(3px);z-index:200;display:flex;justify-content:flex-end;animation:fi .2s ease}
.panel-box{background:var(--white);width:380px;max-width:100%;height:100%;overflow-y:auto;box-shadow:-20px 0 50px rgba(28,21,16,.12);display:flex;flex-direction:column;animation:pi .28s cubic-bezier(.22,.68,0,1.1) both}
.panel-header{display:flex;align-items:center;justify-content:space-between;padding:1.1rem 1.25rem;border-bottom:1px solid var(--bone);flex-shrink:0}
.panel-title{font-family:'Playfair Display',serif;font-size:1.2rem;font-weight:400;font-style:italic;color:var(--ink)}
.panel-sub{font-size:11px;color:var(--stone);margin-top:2px}
.panel-list{padding:1rem 1.25rem;display:flex;flex-direction:column;gap:10px;flex:1}
.panel-item{display:flex;gap:.75rem;align-items:center;padding:.75rem 0;border-bottom:1px solid var(--bone);cursor:pointer}
.panel-thumb{width:56px;height:72px;object-fit:cover;border-radius:2px;flex-shrink:0}
.panel-item-info{flex:1;min-width:0}
.panel-item-brand{font-size:.62rem;text-transform:uppercase;letter-spacing:.1em;color:var(--stone);margin-bottom:2px}
.panel-item-name{font-size:.85rem;color:var(--charcoal);line-height:1.4;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.panel-item-price{font-size:.8rem;color:var(--charcoal)}
.panel-total{display:flex;justify-content:space-between;align-items:center;padding:1rem 0 .3rem;border-top:1px solid var(--bone);margin-top:4px;font-size:.88rem;font-weight:500;color:var(--charcoal)}
.panel-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--stone);gap:8px;font-size:13px}
.profile-row{display:flex;align-items:center;gap:13px;padding-bottom:4px}
.profile-avatar{width:48px;height:48px;background:var(--accent);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:20px;font-weight:600;flex-shrink:0}
.profile-section{display:flex;flex-direction:column;gap:5px;padding:11px 12px;background:var(--cream);border-radius:2px;border:1px solid var(--bone)}
.profile-section-lbl{font-size:.6rem;text-transform:uppercase;letter-spacing:.12em;color:var(--stone);font-weight:500}
.profile-section-val{font-size:.82rem;color:var(--charcoal)}

@media(max-width:768px){
  .ob-side{display:none}
  .ob-content{padding:26px 18px 18px}
  .ob-nav{padding:14px 18px 22px}
  .tons-grid{grid-template-columns:repeat(2,1fr)}
  .ouv-grid{grid-template-columns:1fr}
  .style-grid{grid-template-columns:repeat(2,1fr)}
  .ob-title{font-size:28px}
  .ls-header{padding:0 1rem}
  .ls-profile-bar{padding:.5rem 1rem}
  .ls-categories{padding:.75rem 1rem .5rem}
  .ls-filter-bar{padding:.3rem 1rem .7rem}
  .ls-grid{padding:.75rem 1rem;gap:.6rem;grid-template-columns:1fr 1fr}
  .modal-inner{grid-template-columns:1fr}
  .modal-img-wrap{border-radius:14px 14px 0 0;max-height:240px}
  .modal-img{min-height:0}
  .panel-box{width:100%}
}

/* ── AUTH ── */
.auth-root{min-height:100vh;background:#F7F3EE;display:flex;align-items:center;justify-content:center;padding:20px}
.auth-card{background:#fff;border:1px solid #EDE5DA;border-radius:16px;padding:40px 36px;width:100%;max-width:400px;box-shadow:0 8px 40px rgba(0,0,0,.06)}
.auth-logo{font-family:'Playfair Display',serif;font-size:32px;font-weight:600;letter-spacing:.06em;color:#0F0F0F;text-align:center;margin-bottom:4px}
.auth-tagline{font-size:9px;color:#C4A882;letter-spacing:.14em;text-transform:uppercase;text-align:center;margin-bottom:28px}
.auth-title{font-family:'Playfair Display',serif;font-size:24px;font-weight:400;color:#0F0F0F;margin-bottom:6px}
.auth-desc{font-size:13px;color:#8B7355;margin-bottom:22px;line-height:1.6;font-weight:300}
.auth-google{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;padding:11px;border:1px solid #DDD5C8;border-radius:8px;background:#fff;font-size:13px;font-family:inherit;cursor:pointer;color:#0F0F0F;transition:border-color .2s,background .2s;margin-bottom:16px}
.auth-google:hover:not(:disabled){border-color:#8B7355;background:#F7F3EE}
.auth-google:disabled{opacity:.5;cursor:not-allowed}
.auth-divider{display:flex;align-items:center;gap:12px;margin-bottom:16px;font-size:11px;color:#B0A090}
.auth-divider::before,.auth-divider::after{content:'';flex:1;height:1px;background:#EDE5DA}
.auth-error{background:#FEF0EE;border:1px solid #F9CABB;border-radius:7px;padding:9px 12px;font-size:12px;color:#B94040;margin-bottom:12px;line-height:1.5}
.auth-success{text-align:center;padding:16px 0;font-size:14px;color:#3D6B3D;line-height:1.7}
.auth-link{background:none;border:none;cursor:pointer;font-size:12px;color:#8B7355;font-family:inherit;display:block;margin:14px auto 0;text-decoration:underline;text-underline-offset:2px;transition:color .2s}
.auth-link:hover{color:#0F0F0F}
.auth-link-inline{background:none;border:none;cursor:pointer;font-size:12px;color:#C4A882;font-family:inherit;text-decoration:underline;text-underline-offset:2px;padding:0;transition:color .2s}
.auth-link-inline:hover{color:#0F0F0F}
.auth-switch{text-align:center;font-size:12px;color:#8B7355;margin-top:16px}
`;

