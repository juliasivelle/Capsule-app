import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ═══════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════

const MARQUES_LIST = [
  "& Other Stories","A.P.C.","Adidas","Ami Paris","Arket","Ba&sh",
  "Balzac Paris","Balmain","Celine","Claudie Pierlot","COS",
  "Des Petits Hauts","Ganni","H&M","Isabel Marant","Jacquemus",
  "Lemaire","Levi's","Maje","Mango","Marant Étoile","Monoprix",
  "New Balance","Nike","Patou","Réalisation Par","Rouje","Sandro",
  "Sessùn","Sézane","The Kooples","Toteme","Uniqlo","Veja","Zadig & Voltaire",
].sort();

const STYLES_LIST = [
  { id:"minimaliste", label:"Minimaliste",  desc:"Lignes épurées, palette neutre",  emoji:"⬜" },
  { id:"parisien",    label:"Parisien",     desc:"Élégance naturelle & intemporel",  emoji:"🗼" },
  { id:"casual",      label:"Casual Chic",  desc:"Confortable & dans l'air du temps",emoji:"👟" },
  { id:"boheme",      label:"Boho",         desc:"Fleurs, matières, liberté",        emoji:"🌿" },
  { id:"streetwear",  label:"Streetwear",   desc:"Urbain, graphique, affirmé",       emoji:"🔥" },
  { id:"classique",   label:"Classique",    desc:"Intemporel & soigné",              emoji:"🎀" },
  { id:"sporty",      label:"Sportswear",   desc:"Athleisure élégant",               emoji:"🏃‍♀️" },
  { id:"romantique",  label:"Romantique",   desc:"Dentelle, volants, douceur",       emoji:"🌸" },
];

const TONS_LIST = [
  { id:"noir",        label:"Noir",              swatches:["#1A1A1A","#2C2C2C","#3D1A1A","#1A1A2E"] },
  { id:"blanc",       label:"Blanc & Crème",     swatches:["#FFFFFF","#F5F0EB","#F0EAD6","#E8DFD0"] },
  { id:"beige",       label:"Beige & Camel",     swatches:["#F5F0EB","#D4C5B0","#C4A882","#A0785A"] },
  { id:"gris",        label:"Gris & Marine",     swatches:["#C0C0C0","#808080","#16213E","#1A1A2E"] },
  { id:"pastels",     label:"Pastel",            swatches:["#F9D5E5","#B5E8D5","#D5E8F9","#F9F0D5"] },
  { id:"vifs",        label:"Coloré",            swatches:["#FF3B3B","#FFB800","#00C16E","#0066FF"] },
];

const COUPES_LIST = [
  // Hauts
  { id:"oversize",      label:"Oversize",        emoji:"🌊" },
  { id:"cintre",        label:"Cintré/Ajusté",   emoji:"🔹" },
  { id:"regular",       label:"Regular",         emoji:"▬"  },
  { id:"crop",          label:"Crop/Court",      emoji:"✂️" },
  { id:"asymetrique",   label:"Asymétrique",     emoji:"🔺" },
  { id:"col_montant",   label:"Col montant",     emoji:"🔝" },
  // Bas
  { id:"slim",          label:"Slim",            emoji:"📌" },
  { id:"wide_leg",      label:"Wide-leg",        emoji:"🔔" },
  { id:"straight",      label:"Straight",        emoji:"📐" },
  { id:"flare",         label:"Flare",           emoji:"🌀" },
  { id:"taille_haute",  label:"Taille haute",    emoji:"⬆️" },
  { id:"taille_basse",  label:"Taille basse",    emoji:"⬇️" },
  { id:"mom_boyfriend", label:"Mom/Boyfriend",   emoji:"☁️" },
];

const TAILLES_CONFIG = [
  { id:"haut",     label:"Tops",          options:["XS","S","M","L","XL","XXL"],            icon:"👕" },
  { id:"bas",      label:"Bottoms",       options:["34","36","38","40","42","44","46"],      icon:"👖" },
  { id:"shoes",    label:"Shoes",         options:["35","36","37","38","39","40","41","42"], icon:"👟" },
  { id:"sousvets", label:"Underwear",     options:["XS","S","M","L","XL"],                  icon:"🩲" },
  { id:"access",   label:"Accessories",   options:["One size","S/M","M/L"],                 icon:"💍" },
];

const OB_STEPS = [
  { id:"welcome",   label:"Welcome",   icon:"✦" },
  { id:"dressing",  label:"Wardrobe",  icon:"👗" },
  { id:"marques",   label:"Brands",    icon:"🏷️" },
  { id:"style",     label:"Style",     icon:"✨" },
  { id:"ouverture", label:"Discovery", icon:"🧭" },
  { id:"tailles",   label:"Sizes",     icon:"📐" },
  { id:"tons",      label:"Colours",   icon:"🎨" },
  { id:"coupes",    label:"Cuts",      icon:"✂️" },
];

// Wardrobe criteria
const VET_TYPES = [
  "T-shirt","Shirt","Blouse","Knitwear","Sweatshirt","Dress","Skirt",
  "Trousers","Jeans","Shorts","Blazer","Jacket","Coat","Trench coat",
  "Shoes","Sneakers","Boots","Bag","Accessory","Other",
];
const VET_COLORS = [
  "White","Ecru","Beige","Camel","Sand","Khaki","Olive","Brown",
  "Black","Grey","Navy","Blue","Light blue","Pink","Red","Burgundy",
  "Green","Terracotta","Yellow","Orange","Multicolour","Print",
];

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
          `Expert AI personal shopper. 1 punchy sentence max 15 words: why is this piece perfect for this profile?
Style: ${profile.style||"minimalist"}, tones: ${(profile.tons||[]).join(", ")}, wardrobe: ${dressingStr||"not specified"}.
Item: ${product.name} in ${product.color} by ${product.brand}.
Reply with sentence only, no quotes, no punctuation at end.`
        }],
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text || "A piece made for your style.";
  } catch { return "A piece made for your style."; }
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

  return {
    prenom:    profileData?.full_name || "",
    style:     prefData.style || null,
    ouverture: prefData.discovery ? "open" : "strict",
    tailles:   prefData.sizes || {},
    tons:      prefData.tones || [],
    coupes:    prefData.cuts_hauts || [],
    marques:   prefData.brands || [],
    dressing:  (wardrobeData || []).map(w => ({
      type:  w.category || w.name,
      color: w.color || "",
      brand: w.notes || null,
    })),
  };
}

async function saveProfileToSupabase(userId, profile) {
  await supabase
    .from("profiles")
    .update({ full_name: profile.prenom })
    .eq("id", userId);

  await supabase.from("profile_preferences").upsert({
    user_id:    userId,
    sizes:      profile.tailles,
    tones:      profile.tons,
    cuts_hauts: profile.coupes,
    cuts_bas:   profile.coupes,
    style:      profile.style,
    brands:     profile.marques,
    discovery:  profile.ouverture === "open",
  }, { onConflict: "user_id" });

  if (profile.dressing.length > 0) {
    await supabase.from("wardrobe_items").delete().eq("user_id", userId);
    await supabase.from("wardrobe_items").insert(
      profile.dressing.map(d => ({
        user_id:  userId,
        name:     `${d.color} ${d.type}`,
        category: d.type,
        color:    d.color,
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setUserId(null);
        setUserProfile(null);
        setScreen("auth");
        return;
      }
      setUserId(session.user.id);
      const profile = await loadProfileFromSupabase(session.user.id);
      if (profile) {
        setUserProfile(profile);
        setScreen("listing");
      } else {
        setScreen("onboarding");
      }
    });
    return () => subscription.unsubscribe();
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

function LoadingScreen() {
  return (
    <div className="auth-root">
      <div style={{ textAlign:"center" }}>
        <div className="auth-logo">Capsule</div>
        <div className="auth-tagline">Your AI personal shopper</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════

function AuthScreen() {
  const [mode, setMode]           = useState("login"); // login | signup | forgot
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [name, setName]           = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [forgotSent, setForgotSent] = useState(false);

  const switchMode = (m) => { setMode(m); setError(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name } },
        });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (err) setError(err.message);
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (err) throw err;
      setForgotSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (mode === "forgot") {
    return (
      <div className="auth-root">
        <div className="auth-card">
          <div className="auth-logo">Capsule</div>
          <div className="auth-tagline">Your AI personal shopper</div>
          {forgotSent ? (
            <div className="auth-success">
              <p>Check your inbox — we've sent you a reset link.</p>
              <button className="auth-link" onClick={() => { switchMode("login"); setForgotSent(false); }}>
                ← Back to sign in
              </button>
            </div>
          ) : (
            <>
              <h2 className="auth-title">Reset password</h2>
              <p className="auth-desc">Enter your email and we'll send you a reset link.</p>
              <form onSubmit={handleForgot}>
                <label className="ob-label">Email</label>
                <input className="ob-input" type="email" value={email}
                  onChange={e => setEmail(e.target.value)} required autoFocus />
                {error && <div className="auth-error">{error}</div>}
                <button className="next-btn" style={{width:"100%",borderRadius:8,marginTop:4}} disabled={loading}>
                  {loading ? "Sending…" : "Send reset link →"}
                </button>
              </form>
              <button className="auth-link" onClick={() => switchMode("login")}>← Back to sign in</button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="auth-root">
      <div className="auth-card">
        <div className="auth-logo">Capsule</div>
        <div className="auth-tagline">Your AI personal shopper</div>
        <h2 className="auth-title">{mode === "login" ? "Welcome back" : "Create your account"}</h2>
        <p className="auth-desc">{mode === "login" ? "Sign in to your style profile." : "Start building your capsule wardrobe."}</p>

        <button className="auth-google" onClick={handleGoogle} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.706 17.64 9.2z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="auth-divider"><span>or</span></div>

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <>
              <label className="ob-label">First name</label>
              <input className="ob-input" type="text" placeholder="Sophie" value={name}
                onChange={e => setName(e.target.value)} />
            </>
          )}
          <label className="ob-label">Email</label>
          <input className="ob-input" type="email" placeholder="you@example.com" value={email}
            onChange={e => setEmail(e.target.value)} required />
          <label className="ob-label">Password</label>
          <input className="ob-input" type="password"
            placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
            value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <div className="auth-error">{error}</div>}
          <button className="next-btn" style={{width:"100%",borderRadius:8,marginTop:4}} disabled={loading}>
            {loading ? "…" : mode === "login" ? "Sign in →" : "Create account →"}
          </button>
        </form>

        {mode === "login" && (
          <button className="auth-link" onClick={() => switchMode("forgot")}>Forgot your password?</button>
        )}
        <div className="auth-switch">
          {mode === "login"
            ? <>No account? <button className="auth-link-inline" onClick={() => switchMode("signup")}>Sign up</button></>
            : <>Already a member? <button className="auth-link-inline" onClick={() => switchMode("login")}>Sign in</button></>
          }
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ONBOARDING
// ═══════════════════════════════════════════════════════════════

function OnboardingFlow({ onComplete, initialProfile }) {
  const [step, setStep]   = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [animDir, setAnimDir] = useState("forward");
  const [profile, setProfile] = useState(initialProfile || {
    prenom:"", dressing:[], marques:[], style:null,
    ouverture:null, tailles:{}, tons:[], coupes:[],
  });

  const navigate = (d) => {
    setAnimDir(d > 0 ? "forward" : "back");
    setAnimKey(k => k + 1);
    setStep(s => s + d);
  };

  const canContinue = () => {
    const id = OB_STEPS[step].id;
    if (id === "welcome")   return profile.prenom.trim().length > 0;
    if (id === "marques")   return profile.marques.length > 0;
    if (id === "style")     return !!profile.style;
    if (id === "ouverture") return !!profile.ouverture;
    if (id === "tailles")   return Object.keys(profile.tailles).length > 0;
    if (id === "tons")      return profile.tons.length > 0;
    if (id === "coupes")    return profile.coupes.length > 0;
    return true;
  };

  const toggle = (key, val) =>
    setProfile(p => ({ ...p, [key]: p[key].includes(val) ? p[key].filter(v=>v!==val) : [...p[key], val] }));

  const current = OB_STEPS[step];
  const progress = (step / (OB_STEPS.length - 1)) * 100;

  return (
    <div className="ob-root">
      <aside className="ob-side">
        <div className="ob-brand">
          <div className="ob-logo">Capsule</div>
          <div className="ob-tagline">Your AI personal shopper</div>
        </div>
        <nav className="ob-steps">
          {OB_STEPS.map((s, i) => (
            <div key={s.id} className={`ob-step-item${i===step?" active":""}${i<step?" done":""}`}>
              <div className="ob-step-dot">{i < step ? "✓" : s.icon}</div>
              <span>{s.label}</span>
            </div>
          ))}
        </nav>
        <div className="ob-side-deco"><div className="ob-deco-r1"/><div className="ob-deco-r2"/></div>
      </aside>

      <div className="ob-main">
        <div className="ob-progress"><div className="ob-progress-fill" style={{ width:`${progress}%` }}/></div>

        <div key={animKey} className={`ob-content anim-${animDir}`}>

          {current.id === "welcome" && (
            <div className="ob-section">
              <div className="ob-eyebrow">Welcome ✦</div>
              <h1 className="ob-title">Let's build your<br/>style profile</h1>
              <p className="ob-desc">In a few steps, Capsule analyses your taste and wardrobe to recommend pieces truly made for you.</p>
              <label className="ob-label">Your first name</label>
              <input className="ob-input" placeholder="e.g. Sophie" value={profile.prenom}
                onChange={e => setProfile(p => ({...p, prenom:e.target.value}))}
                onKeyDown={e => e.key==="Enter" && canContinue() && navigate(1)} autoFocus />
            </div>
          )}

          {current.id === "dressing" && (
            <WardrobeStep profile={profile} setProfile={setProfile} />
          )}

          {current.id === "marques" && (
            <BrandsStep profile={profile} toggle={toggle} />
          )}

          {current.id === "style" && (
            <div className="ob-section">
              <div className="ob-eyebrow">Step 3 of 7</div>
              <h1 className="ob-title">Your style</h1>
              <p className="ob-desc">Choose the aesthetic that best describes you.</p>
              <div className="style-grid">
                {STYLES_LIST.map(st => (
                  <button key={st.id} onClick={() => setProfile(p => ({...p, style:st.label}))}
                    className={`style-card${profile.style===st.label?" sel":""}`}>
                    <span className="style-emoji">{st.emoji}</span>
                    <span className="style-label">{st.label}</span>
                    <span className="style-desc">{st.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {current.id === "ouverture" && (
            <div className="ob-section">
              <div className="ob-eyebrow">Step 4 of 7</div>
              <h1 className="ob-title">How open are you?</h1>
              <p className="ob-desc">Should Capsule stay within your universe, or surprise you with new discoveries?</p>
              <div className="ouv-grid">
                {[
                  { val:"strict", emoji:"🎯", title:"Keep it familiar", desc:"Only pieces matching my current brands & style" },
                  { val:"open",   emoji:"🧭", title:"Open to discovery", desc:"Surprise me with new brands that might suit me" },
                ].map(o => (
                  <button key={o.val} onClick={() => setProfile(p => ({...p, ouverture:o.val}))}
                    className={`ouv-card${profile.ouverture===o.val?" sel":""}`}>
                    <span style={{ fontSize:34 }}>{o.emoji}</span>
                    <strong>{o.title}</strong>
                    <p>{o.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {current.id === "tailles" && (
            <div className="ob-section">
              <div className="ob-eyebrow">Step 5 of 7</div>
              <h1 className="ob-title">Your sizes</h1>
              <p className="ob-desc">Capsule will only show pieces available in your size.</p>
              <div className="tailles-list">
                {TAILLES_CONFIG.map(cat => (
                  <div key={cat.id} className="taille-row">
                    <div className="taille-label">{cat.icon} {cat.label}</div>
                    <div className="taille-chips">
                      {cat.options.map(opt => (
                        <button key={opt} onClick={() => setProfile(p => ({...p, tailles:{...p.tailles,[cat.id]:opt}}))}
                          className={`t-chip${profile.tailles[cat.id]===opt?" sel":""}`}>{opt}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {current.id === "tons" && (
            <div className="ob-section">
              <div className="ob-eyebrow">Step 6 of 7</div>
              <h1 className="ob-title">Your colour palette</h1>
              <p className="ob-desc">Which colour ranges do you reach for most? Multiple choices welcome.</p>
              <div className="tons-grid">
                {TONS_LIST.map(t => (
                  <button key={t.id} onClick={() => toggle("tons", t.label)}
                    className={`ton-card${profile.tons.includes(t.label)?" sel":""}`}>
                    <div className="ton-swatches">{t.swatches.map((c,i) => <div key={i} style={{background:c,flex:1,height:"100%"}}/>)}</div>
                    <span className="ton-label">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {current.id === "coupes" && (
            <div className="ob-section">
              <div className="ob-eyebrow">Step 7 of 7</div>
              <h1 className="ob-title">Your preferred cuts</h1>
              <p className="ob-desc">Select the silhouettes you love. Multiple choices welcome.</p>
              <div className="chips-grid two">
                {COUPES_LIST.map(c => (
                  <button key={c.id} onClick={() => toggle("coupes", c.label)}
                    className={`chip${profile.coupes.includes(c.label)?" sel":""}`}>
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        <div className="ob-nav">
          {step > 0 && <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>}
          <button className={`next-btn${!canContinue()?" dis":""}`} disabled={!canContinue()}
            onClick={() => step < OB_STEPS.length-1 ? navigate(1) : onComplete(profile)}>
            {step === OB_STEPS.length-1 ? "See my recommendations →" : "Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Wardrobe Step — criteria-based entry ─────────────────────
function WardrobeStep({ profile, setProfile }) {
  const [vetType, setVetType]   = useState("");
  const [vetColor, setVetColor] = useState("");
  const [vetBrand, setVetBrand] = useState("");
  const [brandSugg, setBrandSugg] = useState([]);
  const [showSugg, setShowSugg]   = useState(false);
  const brandRef = useRef();

  const handleBrandInput = (val) => {
    setVetBrand(val);
    if (val.trim().length > 0) {
      setBrandSugg(MARQUES_LIST.filter(m => m.toLowerCase().includes(val.toLowerCase())).slice(0,6));
      setShowSugg(true);
    } else {
      setShowSugg(false);
    }
  };

  const addPiece = () => {
    if (!vetType || !vetColor) return;
    const piece = { type: vetType, color: vetColor, brand: vetBrand.trim() || null };
    setProfile(p => ({ ...p, dressing: [...p.dressing, piece] }));
    setVetType(""); setVetColor(""); setVetBrand(""); setShowSugg(false);
  };

  const removePiece = (i) => setProfile(p => ({ ...p, dressing: p.dressing.filter((_,j) => j !== i) }));

  return (
    <div className="ob-section">
      <div className="ob-eyebrow">Step 1 of 7</div>
      <h1 className="ob-title">Your current wardrobe</h1>
      <p className="ob-desc">Add the pieces you already own — Capsule will avoid duplicates and spot what's missing.</p>

      <div className="wardrobe-builder">
        {/* Type */}
        <div className="wb-field">
          <label className="ob-label">Type of piece</label>
          <div className="chips-grid">
            {VET_TYPES.map(t => (
              <button key={t} onClick={() => setVetType(t)}
                className={`chip sm${vetType===t?" sel":""}`}>{t}</button>
            ))}
          </div>
        </div>

        {/* Colour */}
        {vetType && (
          <div className="wb-field">
            <label className="ob-label">Colour</label>
            <div className="chips-grid">
              {VET_COLORS.map(c => (
                <button key={c} onClick={() => setVetColor(c)}
                  className={`chip sm${vetColor===c?" sel":""}`}>{c}</button>
              ))}
            </div>
          </div>
        )}

        {/* Brand — optional with dropdown */}
        {vetType && vetColor && (
          <div className="wb-field">
            <label className="ob-label">Brand <span className="ob-optional">(optional)</span></label>
            <div className="brand-input-wrap" ref={brandRef}>
              <input className="ob-input" placeholder="e.g. Sézane, Zara…"
                value={vetBrand} onChange={e => handleBrandInput(e.target.value)}
                onFocus={() => vetBrand && setShowSugg(true)}
                onBlur={() => setTimeout(() => setShowSugg(false), 150)}
              />
              {showSugg && brandSugg.length > 0 && (
                <div className="brand-dropdown">
                  {brandSugg.map(m => (
                    <button key={m} className="brand-sugg-item" onMouseDown={() => { setVetBrand(m); setShowSugg(false); }}>{m}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add button */}
        {vetType && vetColor && (
          <button className="wb-add-btn" onClick={addPiece}>
            + Add to wardrobe — <em>{vetColor} {vetType}{vetBrand ? ` · ${vetBrand}` : ""}</em>
          </button>
        )}
      </div>

      {/* Pieces added */}
      {profile.dressing.length > 0 && (
        <div className="wardrobe-list">
          <div className="ob-label" style={{ marginBottom:10 }}>Added pieces ({profile.dressing.length})</div>
          <div className="wardrobe-tags">
            {profile.dressing.map((d, i) => (
              <div key={i} className="wardrobe-tag">
                <span className="wt-color-dot" />
                <span>{d.color} {d.type}{d.brand ? ` · ${d.brand}` : ""}</span>
                <button className="wt-remove" onClick={() => removePiece(i)}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.dressing.length === 0 && (
        <p className="ob-hint">💡 You can skip this step and add your wardrobe later.</p>
      )}
    </div>
  );
}

// ─── Brands Step — search with dropdown suggestions ───────────
function BrandsStep({ profile, toggle }) {
  const [search, setSearch] = useState("");
  const [showDrop, setShowDrop] = useState(false);
  const inputRef = useRef();

  const filtered = MARQUES_LIST.filter(m => m.toLowerCase().includes(search.toLowerCase()));
  const suggestions = search.trim().length > 0
    ? MARQUES_LIST.filter(m => m.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : [];

  const select = (m) => {
    toggle("marques", m);
    setSearch("");
    setShowDrop(false);
    inputRef.current?.focus();
  };

  return (
    <div className="ob-section">
      <div className="ob-eyebrow">Step 2 of 7</div>
      <h1 className="ob-title">Your favourite brands</h1>
      <p className="ob-desc">Search or browse below. Select as many as you like.</p>

      {/* Search with dropdown */}
      <div className="brand-input-wrap" style={{ marginBottom:20 }}>
        <input ref={inputRef} className="ob-input" placeholder="Search a brand…"
          value={search} onChange={e => { setSearch(e.target.value); setShowDrop(true); }}
          onFocus={() => search && setShowDrop(true)}
          onBlur={() => setTimeout(() => setShowDrop(false), 150)}
          style={{ marginBottom:0 }}
        />
        {showDrop && suggestions.length > 0 && (
          <div className="brand-dropdown">
            {suggestions.map(m => (
              <button key={m} className={`brand-sugg-item${profile.marques.includes(m)?" picked":""}`}
                onMouseDown={() => select(m)}>
                {m}
                {profile.marques.includes(m) && <span className="brand-sugg-check">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected tags */}
      {profile.marques.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div className="ob-label" style={{ marginBottom:8 }}>Selected ({profile.marques.length})</div>
          <div className="chips-grid">
            {profile.marques.map(m => (
              <button key={m} className="chip sel" onClick={() => toggle("marques", m)}>
                {m} ×
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Full brand grid */}
      <div className="ob-label" style={{ marginBottom:10 }}>All brands</div>
      <div className="chips-grid">
        {filtered.map(m => (
          <button key={m} onClick={() => toggle("marques", m)}
            className={`chip${profile.marques.includes(m)?" sel":""}`}>{m}</button>
        ))}
      </div>
    </div>
  );
}

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
    .sort((a,b) => sortMode==="relevance" ? b.score-a.score : sortMode==="asc" ? a.price-b.price : b.price-a.price);

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
          <button className="ls-icon-btn" aria-label="Rechercher">
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
                {profile?.prenom?.[0]||"P"}
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
            Profil&nbsp;:&nbsp;<em style={{fontFamily:"'Playfair Display',serif",color:"#D4A090",fontStyle:"italic"}}>{profile?.prenom||"Vous"}</em>
          </span>
          {profile?.style && (
            <span style={{background:"rgba(255,255,255,.1)",borderRadius:"9999px",padding:".15rem .55rem",fontSize:".68rem",flexShrink:0}}>
              {STYLES_LIST.find(s=>s.id===profile.style)?.label || profile.style}
            </span>
          )}
        </div>
        <span className="ls-profile-bar-count">{displayed.length} pièces</span>
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
              <div className="modal-match-lbl"><span>AI compatibility</span><span>{product.score}%</span></div>
              <div className="modal-track"><div className="modal-fill" style={{width:`${product.score}%`}}/></div>
            </div>
            <div className="modal-insight">
              <span className="modal-insight-icon">✦</span>
              {loading
                ? <span className="modal-loading">Analysing your profile…</span>
                : <span className="modal-insight-text">{insight||"—"}</span>
              }
            </div>
            <div className="modal-details">
              {[["Colour",product.color],["Size",product.size],["Category",product.type],["Price",`€${product.price}`]].map(([l,v])=>(
                <div key={l} className="modal-detail">
                  <span className="modal-detail-lbl">{l}</span>
                  <span className="modal-detail-val" style={l==="Price"?{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:600}:{}}>{v}</span>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <a href="#" target="_blank" rel="noopener noreferrer" className="btn-primary">Shop at {product.brand} →</a>
              <button onClick={e=>onWish(product.id,e)} className={`btn-outline${isWished?" wished":""}`}>
                {isWished?"♥ Saved to wishlist":"♡ Save to wishlist"}
              </button>
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
          <div><h2 className="panel-title">Wishlist</h2>{products.length>0&&<p className="panel-sub">{products.length} item{products.length>1?"s":""} saved</p>}</div>
          <button className="modal-close" style={{position:"static"}} onClick={onClose}>✕</button>
        </div>
        {products.length===0
          ? <div className="panel-empty"><div style={{fontSize:44}}>♡</div><p>No saved items yet</p></div>
          : <div className="panel-list">
              {products.map(p=>(
                <div key={p.id} className="panel-item" onClick={()=>onOpen(p)}>
                  <img src={p.image} alt={p.name} className="panel-thumb"
                    onError={e=>{e.target.src=`https://placehold.co/80x100/E8E0D5/8B7355?text=${encodeURIComponent(p.brand)}`;}}/>
                  <div className="panel-item-info">
                    <div className="panel-item-brand">{p.brand}</div>
                    <div className="panel-item-name">{p.name}</div>
                    <div className="panel-item-price">€{p.price}</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8,alignItems:"center"}}>
                    <a href="#" onClick={e=>e.stopPropagation()} className="btn-primary" style={{fontSize:11,padding:"6px 12px",whiteSpace:"nowrap"}}>Buy</a>
                    <button onClick={e=>{e.stopPropagation();onRemove(p.id);}} style={{background:"none",border:"none",cursor:"pointer",color:"#C4A882",fontSize:20}}>♥</button>
                  </div>
                </div>
              ))}
              <div className="panel-total">
                <span>Estimated total</span>
                <span style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:600,color:"#0F0F0F"}}>€{products.reduce((s,p)=>s+p.price,0)}</span>
              </div>
            </div>
        }
      </div>
    </div>
  );
}

function ProfilePanel({ profile, onClose, onEdit, onSignOut }) {
  const dressingStr = (profile?.dressing||[]).map(d=>`${d.color} ${d.type}${d.brand?` · ${d.brand}`:""}`);
  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-box" onClick={e=>e.stopPropagation()}>
        <div className="panel-header">
          <h2 className="panel-title">My Profile</h2>
          <button className="modal-close" style={{position:"static"}} onClick={onClose}>✕</button>
        </div>
        <div className="panel-list">
          <div className="profile-row">
            <div className="profile-avatar">{profile?.prenom?.[0]}</div>
            <div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:600,color:"#0F0F0F"}}>{profile?.prenom}</div>
              <div style={{fontSize:10,color:"#8B7355",letterSpacing:".1em",textTransform:"uppercase"}}>Capsule member</div>
            </div>
          </div>
          {[
            {icon:"✨",label:"Style",val:profile?.style},
            {icon:"🧭",label:"Discovery mode",val:profile?.ouverture==="open"?"Open to new brands":"Familiar universe only"},
          ].filter(x=>x.val).map(x=>(
            <div key={x.label} className="profile-section">
              <div className="profile-section-lbl">{x.icon} {x.label}</div>
              <div className="profile-section-val">{x.val}</div>
            </div>
          ))}
          {(profile?.marques||[]).length>0&&<div className="profile-section"><div className="profile-section-lbl">🏷️ Brands ({profile.marques.length})</div><div className="chips-grid" style={{marginTop:8}}>{profile.marques.map(m=><span key={m} className="chip sel" style={{cursor:"default"}}>{m}</span>)}</div></div>}
          {(profile?.tons||[]).length>0&&<div className="profile-section"><div className="profile-section-lbl">🎨 Colours</div><div className="chips-grid" style={{marginTop:8}}>{profile.tons.map(t=><span key={t} className="chip sel" style={{cursor:"default"}}>{t}</span>)}</div></div>}
          {(profile?.coupes||[]).length>0&&<div className="profile-section"><div className="profile-section-lbl">✂️ Cuts</div><div className="chips-grid" style={{marginTop:8}}>{profile.coupes.map(c=><span key={c} className="chip sel" style={{cursor:"default"}}>{c}</span>)}</div></div>}
          {Object.keys(profile?.tailles||{}).length>0&&<div className="profile-section"><div className="profile-section-lbl">📐 Sizes</div><div style={{marginTop:8,display:"flex",flexDirection:"column",gap:5}}>{TAILLES_CONFIG.map(cat=>profile?.tailles?.[cat.id]?(<div key={cat.id} style={{display:"flex",justifyContent:"space-between",fontSize:13}}><span style={{color:"#8B7355"}}>{cat.icon} {cat.label}</span><span className="t-chip sel" style={{cursor:"default"}}>{profile.tailles[cat.id]}</span></div>):null)}</div></div>}
          {dressingStr.length>0&&<div className="profile-section"><div className="profile-section-lbl">👗 Wardrobe ({dressingStr.length})</div><div className="chips-grid" style={{marginTop:8}}>{dressingStr.map((v,i)=><span key={i} className="chip" style={{cursor:"default",fontSize:11}}>{v}</span>)}</div></div>}
          <button className="btn-outline" onClick={onEdit} style={{width:"100%",marginTop:4}}>✏️ Edit my profile</button>
          <button className="btn-outline" onClick={onSignOut} style={{width:"100%",marginTop:8,color:"#8B7355",borderColor:"#D4C5B0"}}>Sign out</button>
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
::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:#C4A882;border-radius:2px}
@keyframes fu{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes fi{from{opacity:0}to{opacity:1}}
@keyframes sr{from{opacity:0;transform:translateX(26px)}to{opacity:1;transform:translateX(0)}}
@keyframes sl{from{opacity:0;transform:translateX(-26px)}to{opacity:1;transform:translateX(0)}}
@keyframes pi{from{transform:translateX(100%)}to{transform:translateX(0)}}
@keyframes sh{0%,100%{opacity:.4}50%{opacity:.9}}
.af{animation:fu .4s ease both}
.anim-forward{animation:sr .26s cubic-bezier(.22,.68,0,1.2) both}
.anim-back{animation:sl .26s cubic-bezier(.22,.68,0,1.2) both}

/* ── ONBOARDING ── */
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
.chips-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:7px;margin-bottom:4px}
.chips-grid.two{grid-template-columns:1fr 1fr}
.chip{padding:8px 12px;border:1px solid #DDD5C8;border-radius:8px;font-size:12px;font-family:inherit;cursor:pointer;background:#fff;color:#0F0F0F;text-align:left;transition:all .15s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chip:hover{border-color:#8B7355}
.chip.sel{background:#0F0F0F;color:#F7F3EE;border-color:#0F0F0F}
.chip.sm{font-size:11px;padding:6px 10px}

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
.ls-select{padding:.35rem .8rem;border:1px solid var(--bone);border-radius:9999px;background:#fff;font-size:.75rem;cursor:pointer;color:var(--charcoal);font-family:inherit;outline:none;appearance:none;-webkit-appearance:none}
.ls-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(195px,1fr));gap:.75rem;padding:1rem 1.25rem}

/* ── MODAL ── */
.modal-overlay{position:fixed;inset:0;background:rgba(15,15,15,.65);backdrop-filter:blur(8px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;animation:fi .2s ease}
.modal-box{background:#F7F3EE;border-radius:14px;max-width:800px;width:100%;max-height:90vh;overflow:auto;position:relative;box-shadow:0 40px 100px rgba(0,0,0,.25)}
.modal-close{position:absolute;top:13px;right:13px;background:rgba(247,243,238,.92);border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:14px;z-index:10;backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;transition:background .2s}
.modal-close:hover{background:#EDE5DA}
.modal-inner{display:grid;grid-template-columns:1fr 1fr;min-height:440px}
.modal-img-wrap{position:relative;border-radius:14px 0 0 14px;overflow:hidden}
.modal-img{width:100%;height:100%;object-fit:cover;min-height:340px}
.modal-info{padding:34px 30px;display:flex;flex-direction:column;gap:16px}
.modal-brand{font-size:9px;font-weight:600;letter-spacing:.14em;color:#8B7355;text-transform:uppercase}
.modal-name{font-family:'Playfair Display',serif;font-size:22px;font-weight:400;color:#0F0F0F;line-height:1.25}
.modal-match{display:flex;flex-direction:column;gap:5px}
.modal-match-lbl{display:flex;justify-content:space-between;font-size:11px;color:#8B7355}
.modal-track{height:3px;background:#E5DDD0;border-radius:3px;overflow:hidden}
.modal-fill{height:100%;background:linear-gradient(90deg,#C4A882,#0F0F0F);border-radius:3px;transition:width .8s ease}
.modal-insight{background:#EFE9E0;border-radius:9px;padding:12px 14px;display:flex;gap:9px;align-items:flex-start}
.modal-insight-icon{color:#C4A882;font-size:13px;flex-shrink:0;margin-top:2px}
.modal-insight-text{font-size:14px;color:#3D2B1F;line-height:1.6;font-style:italic;font-family:'Playfair Display',serif}
.modal-loading{font-size:13px;color:#8B7355;font-style:italic;animation:sh 1.2s infinite}
.modal-details{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.modal-detail{display:flex;flex-direction:column;gap:2px}
.modal-detail-lbl{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#8B7355;font-weight:500}
.modal-detail-val{font-size:14px;color:#0F0F0F}
.modal-actions{display:flex;flex-direction:column;gap:8px;margin-top:auto}

.btn-primary{display:block;text-align:center;background:#0F0F0F;color:#F7F3EE;padding:12px 20px;border-radius:100px;font-size:13px;text-decoration:none;font-family:inherit;letter-spacing:.07em;transition:background .2s;font-weight:500;border:none;cursor:pointer}
.btn-primary:hover{background:#C4A882}
.btn-outline{border:1px solid #0F0F0F;border-radius:100px;padding:11px 20px;font-size:13px;cursor:pointer;font-family:inherit;letter-spacing:.05em;transition:all .2s;background:transparent;color:#0F0F0F}
.btn-outline:hover{background:#EFE9E0}
.btn-outline.wished{background:#0F0F0F;color:#F7F3EE}

/* ── PANELS ── */
.panel-overlay{position:fixed;inset:0;background:rgba(15,15,15,.4);backdrop-filter:blur(4px);z-index:200;display:flex;justify-content:flex-end;animation:fi .2s ease}
.panel-box{background:#F7F3EE;width:380px;height:100%;overflow-y:auto;box-shadow:-20px 0 50px rgba(0,0,0,.12);display:flex;flex-direction:column;animation:pi .28s cubic-bezier(.22,.68,0,1.1) both}
.panel-header{display:flex;align-items:center;justify-content:space-between;padding:24px 20px 16px;border-bottom:1px solid #E5DDD0;flex-shrink:0}
.panel-title{font-family:'Playfair Display',serif;font-size:22px;font-weight:400;color:#0F0F0F}
.panel-sub{font-size:11px;color:#8B7355;margin-top:2px}
.panel-list{padding:16px 20px;display:flex;flex-direction:column;gap:10px;flex:1}
.panel-item{display:flex;gap:12px;align-items:center;padding:10px;border-radius:9px;background:#fff;border:1px solid #EDE5DA;cursor:pointer;transition:box-shadow .2s}
.panel-item:hover{box-shadow:0 4px 14px rgba(0,0,0,.08)}
.panel-thumb{width:64px;height:80px;object-fit:cover;border-radius:7px;flex-shrink:0}
.panel-item-info{flex:1;min-width:0}
.panel-item-brand{font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:#8B7355;font-weight:600;margin-bottom:2px}
.panel-item-name{font-size:12px;color:#0F0F0F;line-height:1.4;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.panel-item-price{font-family:'Playfair Display',serif;font-size:15px;color:#0F0F0F;font-weight:600}
.panel-total{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-top:1px solid #E5DDD0;margin-top:4px;font-size:12px;color:#8B7355}
.panel-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#8B7355;gap:8px;font-size:13px}
.profile-row{display:flex;align-items:center;gap:13px;padding-bottom:4px}
.profile-avatar{width:48px;height:48px;background:#0F0F0F;color:#F7F3EE;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:20px;font-weight:600;flex-shrink:0}
.profile-section{display:flex;flex-direction:column;gap:5px;padding:11px 12px;background:#fff;border-radius:9px;border:1px solid #EDE5DA}
.profile-section-lbl{font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:#8B7355;font-weight:500}
.profile-section-val{font-size:13px;color:#0F0F0F}

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

