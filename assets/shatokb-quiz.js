/**
 * ============================================================
 * SHATOKB · Skin Diagnosis Quiz Engine  v3.3
 * File: assets/shatokb-quiz.js
 *
 * Sections:
 *  1.  QUIZ QUESTIONS
 *  2.  TAG MAPS  (Shopify tags → internal fields)
 *  3.  LIVE CATALOGUE  (fetched from /products.json)
 *  4.  FALLBACK CATALOGUE  (local/dev only)
 *  5.  SKIN PROFILES
 *  6.  SCORING ENGINE
 *  7.  RECOMMENDATION ENGINE
 *  8.  QUIZ STATE & NAVIGATION
 *  9.  EMAIL GATE + META PIXEL
 * 10.  RESULT DISPLAY
 * 11.  REVIEWS + URGENCY
 * 12.  PRODUCT RENDERING
 * 13.  CART INTEGRATION
 * 14.  DYNAMIC CONFIG (data-attributes → Theme Editor)
 * 15.  RESTART
 * 16.  INIT
 * ============================================================
 */

'use strict';

/* ============================================================
   1. QUIZ QUESTIONS
============================================================ */
// Preguntas que permiten selección múltiple
const SHATOKB_MULTI_SELECT = ['preocupacion', 'objetivo'];

const SHATOKB_PREGUNTAS = [
  {
    id: 'tipo_piel',
    titulo: 'First things first — what is your skin like?',
    emoji: '🪞',
    subtitulo: 'Be honest with yourself. This is where everything starts.',
    // ── Momento 1: Tip contextual de KOI ──────────────────────
    koiTip: "The way your skin feels 30 minutes after cleansing \u2014 before any products \u2014 is the most accurate indicator of your real skin type. That morning texture you feel when you first wake up? That's the data point I use.",
    opciones: [
      { valor: 'grasa',    label: '🫧 Oily',          desc: 'Shiny by midday. Visible pores. Breakout-prone.' },
      { valor: 'mixta',    label: '☯️ Combination',   desc: 'Oily T-zone, dry or normal everywhere else.' },
      { valor: 'seca',     label: '🌵 Dry',           desc: 'Tight, flaky, thirsty. Feels stripped after cleansing.' },
      { valor: 'sensible', label: '🌸 Sensitive',     desc: 'Reacts to everything. Redness. Irritation. Stinging.' },
      { valor: 'nolose',   label: '🤷 Not sure yet',  desc: "No worries — we'll figure it out from your other answers." }
    ]
  },
  {
    id: 'sensibilidad',
    titulo: 'How does your skin handle new products?',
    emoji: '⚡',
    subtitulo: 'This protects you from ingredients that could backfire.',
    // ── Momento 1: Tip contextual de KOI ──────────────────────
    koiTip: 'Most people confuse <em>oily skin</em> with <em>dehydrated skin</em> — they\'re opposite conditions with completely different solutions. Oily skin overproduces sebum. Dehydrated skin lacks water. You can have both at the same time.',
    opciones: [
      { valor: 'baja',  label: '💪 Tough as nails',  desc: "I can try anything. My skin barely reacts." },
      { valor: 'media', label: '🤔 It depends',      desc: 'Occasional redness or breakouts with some products.' },
      { valor: 'alta',  label: '🚨 Very reactive',   desc: 'My skin throws a tantrum with almost everything new.' }
    ]
  },
  {
    id: 'preocupacion',
    titulo: 'What does your skin make you most self-conscious about?',
    emoji: '😔',
    subtitulo: 'Select all that apply — we treat every concern.',
    koiTip: 'Dark spots and acne marks are <em>post-inflammatory hyperpigmentation</em> — a different mechanism than structural aging. Treating them without daily SPF is one of the most common (and expensive) mistakes I see.',
    multiSelect: true,
    opciones: [
      { valor: 'acne',           label: '😤 Acne & breakouts',     desc: 'Blackheads, pimples, cysts. It never fully clears.' },
      { valor: 'manchas',        label: '🟤 Dark spots',           desc: 'Post-acne marks, sun damage, uneven patches.' },
      { valor: 'poros',          label: '🔬 Enlarged pores',       desc: "Visible pores that makeup can't hide." },
      { valor: 'deshidratacion', label: '💧 Dull & dehydrated',    desc: 'Flat, lifeless skin. No bounce. No glow.' },
      { valor: 'textura',        label: '🍊 Rough texture',        desc: "Bumpy, uneven skin that's not smooth to the touch." },
      { valor: 'rojeces',        label: '🔴 Redness & irritation', desc: 'Constant redness, flushing or sensitive patches.' },
      { valor: 'antiaging',      label: '⏳ Fine lines & firmness', desc: 'First signs of aging. Skin is losing its snap.' }
    ]
  },
  {
    id: 'objetivo',
    titulo: 'Close your eyes. What does your dream skin look like?',
    emoji: '💭',
    subtitulo: 'Pick up to 2 — we build around what matters most to you.',
    multiSelect: true,
    maxSelect: 2,
    opciones: [
      { valor: 'glow',      label: '✨ That glass-skin glow',   desc: 'Lit from within. Dewy, radiant, luminous.' },
      { valor: 'calmar',    label: '🧘 Calm, quiet skin',       desc: 'No redness. No reactions. Just peace.' },
      { valor: 'limpiar',   label: '🫧 Deeply clean pores',    desc: 'Unclogged, tight, purified. Clean slate.' },
      { valor: 'hidratar',  label: '💦 Plump & bouncy',         desc: 'Hydrated to the core. Soft, pillowy, elastic.' },
      { valor: 'unificar',  label: '🌅 Even, spot-free tone',   desc: 'Uniform complexion. Spots faded. Confidence up.' },
      { valor: 'controlar', label: '🎯 Matte & pore-minimized', desc: 'Less shine. Smaller pores. In control all day.' }
    ]
  },
  {
    id: 'nivel_rutina',
    titulo: 'How much time will you actually commit?',
    emoji: '⏱️',
    subtitulo: 'A routine you stick to beats a perfect one you abandon.',
    koiTip: 'A 3-step routine done every single day outperforms a 10-step routine done twice a week. Consistency is the only variable that actually predicts results — not the number of products.',
    opciones: [
      { valor: 'basica',     label: '⚡ Quick & powerful (3–4 steps)',  desc: 'Under 5 minutes. The essentials only. Still transforms your skin.' },
      { valor: 'intermedia', label: '⚖️ Balanced (5–6 steps)',          desc: '8–10 minutes. Real results without taking over your morning.' },
      { valor: 'completa',   label: '🏆 The full ritual (7+ steps)',    desc: 'The complete K-Beauty experience. Maximum results. Worth every second.' }
    ]
  },
  {
    id: 'presupuesto',
    titulo: "Last one. What's your investment range?",
    emoji: '💳',
    subtitulo: 'K-Beauty delivers incredible results at every price point.',
    opciones: [
      { valor: 'bajo',  label: '💚 Smart spender', desc: 'Under $40 total. Proven products, zero waste.' },
      { valor: 'medio', label: '💛 Best of both',  desc: '$40–$80. Where quality meets value. Our sweet spot.' },
      { valor: 'alto',  label: '🖤 Best in class', desc: 'No ceiling. Only the highest-performing formulas.' }
    ]
  }
];


/* ============================================================
   2. TAG MAPS  —  Shopify product tags → internal engine fields
   All tags are in English and match exactly what's in the store.
============================================================ */

// ============================================================
// TAG MAPS v3.4 — Built from REAL Shopify admin product tags
// Extracted from live store Tag Auditor run (Jun 2026).
// v3.3: Added singular/alternate serum/toner/moisturizer tags
//       to rescue ~14 excluded products (COSRX, TIAM, JUMISO,
//       Cos De Baha, Round Lab, Pyunkang Yul, Innisfree).
// v3.4: Moved SPF block before Essences in TAG_CATEGORIA so
//       hybrid SPF+essence products (e.g. SCINIC Sun Essence)
//       are correctly classified as spf, not essence.
//       Expanded TAG_CONCERN with ~15 real store tags to
//       improve scoring accuracy across all profiles.
// ============================================================

// Tag → routine step category
// These are the ACTUAL tags used in the store's products.
const TAG_CATEGORIA = {
  // ── CLEANSERS ──────────────────────────────────────────────
  'Cleansers':                      'cleanser',
  'Foam Cleansers':                 'cleanser',
  'Hydrating Cleansers':            'cleanser',
  'Vegan Cleansers':                'cleanser',
  'Daily Use Cleansers':            'cleanser',
  'Radiance-Boosting Cleansers':    'cleanser',
  'Makeup Removing Cleansers':      'cleanser',
  'Cleansing Foam':                 'cleanser',
  'Facial Cleansers':               'cleanser',
  'Gentle Cleansers':               'cleanser',
  'Low pH Cleansers':               'cleanser',
  'Micellar Water':                 'cleanser',
  'Cleansing Balm':                 'cleanser',
  'Oil Cleansers':                  'cleanser',
  'Makeup Remover':                 'cleanser',
  'Double Cleansers':               'cleanser',

  // ── TONERS, PADS & MISTS ───────────────────────────────────
  'Toner, Pads & Mists':            'toner',
  'Toners':                         'toner',
  'Toner':                          'toner',  // ← v3.3 singular (Round Lab, COSRX)
  'Toner Pads':                     'toner',
  'Toner pads':                     'toner',
  'Essence Toners':                 'toner',
  'Exfoliating Toners':             'toner',
  'Hydrating Toners':               'toner',
  'Hydrating Toner':                'toner',  // ← v3.3 singular (COSRX Propolis Toner)
  'Facial Mists':                   'toner',
  'Face Mist':                      'toner',
  'Cotton Pads':                    'toner',
  'Brightening Toners':             'toner',
  'Calming Toners':                 'toner',
  'AHA BHA Toners':                 'toner',
  'BHA Toners':                     'toner',

  // ── SERUMS & AMPOULES ──────────────────────────────────────
  'Serums & Ampoules':              'serum',
  'Serums':                         'serum',  // ← v3.3 (Innisfree, JUMISO, Anua, VT PDRN)
  'Serum':                          'serum',  // ← v3.3 singular (Cos De Baha VA 15%, BOJ)
  'Serums & Essences':              'serum',  // ← v3.3 (TIAM, Cos De Baha Niacinamide 20%)
  'Serums & Treatments':            'serum',  // ← v3.3 (Pyunkang Yul, AXIS-Y, DearKlairs)
  'Face Serum':                     'serum',  // ← v3.3 (COSRX Vitamin C 13%/23%, Niacinamide, HA3%, PURITO Centella)
  'Retinol Serum':                  'serum',  // ← v3.3 (COSRX Retinol 0.5 Oil, SOME BY MI)
  'Hydrating Serum':                'serum',  // ← v3.3 (COSRX HA3% Serum)
  'Brightening Serums':             'serum',
  'Anti-Aging Serums':              'serum',
  'Peptide & Collagen Ampoules':    'serum',
  'Hydrating Serums':               'serum',
  'Acne Treatment Serums':          'serum',
  'Vitamin C Serums':               'serum',
  'Niacinamide Serums':             'serum',
  'Retinol Serums':                 'serum',
  'Snail Serums':                   'serum',
  'Centella Serums':                'serum',

  // ── SUNSCREENS & SUN CARE ─────────────────────────────────
  // NOTE: Must come BEFORE Essences so hybrid SPF+essence
  // products (e.g. SCINIC Sun Essence SPF50+) are classified
  // as spf, not essence. First-match-wins.
  'Sunscreens & Sun Care':          'spf',
  'Sunscreen':                      'spf',
  'Mineral Sunscreens':             'spf',
  'Chemical Sunscreens':            'spf',
  'Hybrid Sunscreens':              'spf',
  'Hydrating Sunscreens':           'spf',
  'High SPF Sunscreens (Chemical & Mineral)': 'spf',
  'SPF50':                          'spf',
  'Sun Protection & Damage':        'spf',

  // ── ESSENCES ───────────────────────────────────────────────
  'Essences':                       'essence',
  'First Essences':                 'essence',
  'Boosters':                       'essence',
  'Treatment Essences':             'essence',

  // ── MOISTURIZERS & CREAMS ──────────────────────────────────
  'Moisturizers & Creams':          'moisturizer',
  'Moisturizers':                   'moisturizer',
  'Moisturizer':                    'moisturizer',
  'Moisturizers & Lotions':         'moisturizer',  // ← v3.3 (Pyunkang Yul Intensive Ceramide Lotion)
  'Cream Moisturizers':             'moisturizer',
  'Gel Moisturizers':               'moisturizer',
  'Sleeping Masks':                 'moisturizer',
  'Night Creams':                   'moisturizer',
  'Collagen-Boosting Creams':       'moisturizer',
  'Barrier Creams':                 'moisturizer',
  'Face Moisturizers':              'moisturizer',

  // ── EYE CARE ───────────────────────────────────────────────
  'Eye Care':                       'eye',
  'Eye Creams & Serums':            'eye',
  'Eye Creams':                     'eye',
  'Eye Serums':                     'eye',
  'Hydrating Eye Serums':           'eye',
  'Brightening Eye Treatments':     'eye',
  'Eye Patches':                    'eye',
  'Under Eye Creams':               'eye',

  // ── EXFOLIATORS & PEELS ────────────────────────────────────
  'Exfoliators & Peels':            'exfoliator',
  'AHA Exfoliators':                'exfoliator',
  'BHA Exfoliators':                'exfoliator',
  'Physical Exfoliators':           'exfoliator',
  'Peeling Gels':                   'exfoliator',

  // ── FACE MASKS ─────────────────────────────────────────────
  'Face Masks':                     'mask',
  'Sheet Masks':                    'mask',
  'Clay Masks':                     'mask',
  'Sleeping Packs':                 'mask',
  'Brightening Masks':              'mask',
  'Hydrating Masks':                'mask',
  'Acne Masks':                     'mask',

  // ── LIP CARE ───────────────────────────────────────────────
  'Lip Care':                       'lip',
  'Lip Masks':                      'lip',
  'Lip Balms':                      'lip',

  // ── SKINCARE SETS ──────────────────────────────────────────
  'Skincare Sets & Kits':           'set',
};

// Tag → skin type (REAL store tags used in Collections + product Tags)
const TAG_TIPO_PIEL = {
  'Dry Skin':                       'seca',
  'Oily & Acne-Prone Skin':         'grasa',
  'Oily Skin':                      'grasa',
  'Acne-Prone Skin':                'grasa',
  'Sensitive Skin':                 'sensible',
  'Redness & Sensitive Skin':       'sensible',
  'Sensitive Skin Formulas':        'sensible',
  'Combination Skin':               'mixta',
  'All Skin Types':                 'nolose',
  'All Skin':                       'nolose',
  'Korean Skincare':                'nolose',
  'Skincare':                       'nolose',
};

// Tag → skin concern (REAL store tags — seen in Collections AND product Tags)
const TAG_CONCERN = {
  // Anti-aging & firmness
  'Anti-Aging & Wrinkles':          'antiaging',
  'Anti-Aging Serums':              'antiaging',
  'Anti-Aging Creams':              'antiaging',
  'Collagen-Boosting Creams':       'antiaging',
  'Peptide & Collagen Ampoules':    'antiaging',
  'Dark Circles & Puffy Eyes':      'antiaging',
  'Hydrating Eye Serums':           'antiaging',
  'fine lines serum':               'antiaging',
  'retinol eye cream':              'antiaging',
  'well-aging skincare':            'antiaging',

  // Hyperpigmentation / dark spots / brightening
  'Hyperpigmentation & Dark Spots': 'manchas',
  'Dull & Uneven Skin Tone':        'manchas',
  'Brightening Serums':             'manchas',
  'Brightening Eye Treatments':     'manchas',
  'Brightening Toners':             'manchas',
  'serum for dark spots':           'manchas',
  'anti-dark spots':                'manchas',
  'daily vitamin c':                'manchas',
  // v3.4: real store tags seen in brightening products
  'Brightening':                    'manchas',
  'Brightening Cleansers':          'manchas',
  'Brightening Masks':              'manchas',
  'Vitamin C':                      'manchas',
  'Vitamin C Serums':               'manchas',
  'Niacinamide':                    'manchas',
  'Uneven Skin Tone':               'manchas',
  'Dull Skin':                      'manchas',
  'Dark Spot Serum':                'manchas',
  'Glass Skin':                     'manchas',


  // Hydration / dehydration
  'Hydrating':                      'deshidratacion',
  'Hydrating Serums':               'deshidratacion',
  'Hydrating Toners':               'deshidratacion',
  'Moisturizing Sunscreen':         'deshidratacion',
  'Hydrating Sunscreens':           'deshidratacion',
  'Hydrating Sunscreen':            'deshidratacion',
  'hydrating face cream':           'deshidratacion',
  'glow hydration':                 'deshidratacion',
  'dewy glow':                      'deshidratacion',
  'Moisturizers & Creams':          'deshidratacion',
  'Moisturizer':                    'deshidratacion',
  'Hydrating Cleansers':            'deshidratacion',
  'Hydrating Masks':                'deshidratacion',

  // Redness / sensitivity
  'Redness & Irritation':           'rojeces',
  'Redness & Sensitive Skin':       'rojeces',
  'Calming Toners':                 'rojeces',
  // v3.4: real store tags for redness/calming products
  'Redness':                        'rojeces',
  'Anti-Inflammatory':              'rojeces',
  'Centella Asiatica':              'rojeces',
  'Soothing':                       'rojeces',
  'Calming':                        'rojeces',
  'Heartleaf Extract':              'rojeces',

  // Acne / pores
  'Oily & Acne-Prone Skin':         'acne',
  'Acne Treatment Serums':          'acne',
  'Acne-Prone Skin':                'acne',
  'Large Pores & Texture':          'poros',
  // v3.4: real store tags for pore/acne products
  'Pore Care':                      'poros',
  'Pore Minimizing':                'poros',
  'Blackhead Removal':              'poros',
  'Blackheads & Sebum':             'poros',
  'Sebum Control':                  'poros',
  'Excess Sebum Control':           'poros',
  'BHA':                            'poros',

  // Texture / uneven skin
  'Dull & Uneven Skin Tone':        'textura',
  'Exfoliating Toners':             'textura',
  'AHA BHA Toners':                 'textura',
  // v3.4: real store tags for texture products
  'Exfoliating':                    'textura',
  'Uneven Texture':                 'textura',
  'Dullness & Uneven Texture':      'textura',
  'AHA':                            'textura',
  'Peeling Gels':                   'textura',

  // Sun protection / pigmentation prevention
  'Sun Protection & Damage':        'manchas',
};

// Tags that confirm a product is safe for sensitive skin
const TAGS_SENSIBLE_SAFE = new Set([
  'Sensitive Skin',
  'Redness & Sensitive Skin',
  'Sensitive Skin Formulas',
  'Fragrance-Free',
  'Hypoallergenic',
  'vegan face wash',
  'Vegan Cleansers',
  'reef safe',
  'gentle retinol',
  'retinol for beginners',
  'Calming Toners',
]);

// Tags that map to a product badge
const TAG_BADGE = {
  'Best Seller':  'Best Seller',
  'Bestseller':   'Best Seller',
  'New':          'New',
  'New Arrival':  'New',
  'Trending':     'Trending',
  'Viral':        'Viral',
  'Staff Pick':   'Staff Pick',
  'Fan Favorite': 'Fan Favorite',
  'Cult Favorite':'Cult Favorite',
};

// Emoji per category
const EMOJI_MAP = {
  cleanser:    '🫧',
  toner:       '💧',
  serum:       '💊',
  essence:     '🐌',
  moisturizer: '🧴',
  spf:         '☀️',
  exfoliator:  '✨',
  mask:        '🩵',
  eye:         '👁️',
  lip:         '💋',
  hair:        '💆',
  makeup:      '💄',
};


/* ============================================================
   3. LIVE CATALOGUE  —  populated at runtime by shatokbFetchCatalogo()
============================================================ */
let SHATOKB_CATALOGO = [];
let shatokbCatalogoCargado = false;

/**
 * Converts a raw Shopify product object → internal catalogue format.
 * Returns null for products without a recognised category tag.
 */
function shatokbMapProduct(p) {
  // Shopify returns tags as a comma-separated string in /products.json
  // but some API versions / storefronts return an array — handle both.
  const rawTags = p.tags || '';
  const tags    = Array.isArray(rawTags)
    ? rawTags.map(t => t.trim())
    : rawTags.split(',').map(t => t.trim());
  const tagSet = new Set(tags);

  // Determine routine step category
  let categoria = null;
  for (const [tag, cat] of Object.entries(TAG_CATEGORIA)) {
    if (tagSet.has(tag)) { categoria = cat; break; }
  }
  if (!categoria) return null;

  // Skin types
  const tipo_piel = [];
  for (const [tag, tipo] of Object.entries(TAG_TIPO_PIEL)) {
    if (tagSet.has(tag) && !tipo_piel.includes(tipo)) tipo_piel.push(tipo);
  }
  if (tipo_piel.length === 0) tipo_piel.push('nolose');

  // Concerns
  const concerns = [];
  for (const [tag, concern] of Object.entries(TAG_CONCERN)) {
    if (tagSet.has(tag) && !concerns.includes(concern)) concerns.push(concern);
  }

  // Sensitive-safe?
  const sensible = [...TAGS_SENSIBLE_SAFE].some(t => tagSet.has(t));

  // Badge
  let badge = null;
  for (const [tag, label] of Object.entries(TAG_BADGE)) {
    if (tagSet.has(tag)) { badge = label; break; }
  }

  // Price from first variant
  const precio_num = parseFloat(p.variants?.[0]?.price || '0');
  const precio     = '$' + precio_num.toFixed(2);

  return {
    id:         p.handle,
    nombre:     p.title,
    handle:     p.handle,
    precio,
    precio_num,
    badge,
    emoji:      EMOJI_MAP[categoria] || '🌿',
    desc:       p.body_html
                  ? p.body_html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160) + '…'
                  : p.title,
    tipo_piel,
    categoria,
    concerns,
    sensible,
    imagen:     p.images?.[0]?.src || null,
  };
}

/**
 * Fetches ALL products from a given base URL using pagination.
 * Returns raw array of Shopify product objects, or throws.
 */
async function shatokbFetchAllPages(baseUrl) {
  const all   = [];
  let page    = 1;
  const limit = 250;
  while (true) {
    const res = await fetch(`${baseUrl}/products.json?limit=${limit}&page=${page}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data     = await res.json();
    const products = data.products || [];
    all.push(...products);
    if (products.length < limit) break;
    page++;
  }
  return all;
}

/**
 * Loads the product catalogue.
 *
 * Priority order:
 *   1. https://shatokb.com  — live store, public CORS-open endpoint.
 *      Works in Shopify preview AND local/dev environments.
 *      Returns all ~224 real skincare products.
 *   2. '' (relative URL)    — used when served from inside the Shopify
 *      theme (e.g. Shopify CLI local preview on port 9292).
 *   3. SHATOKB_FALLBACK     — static 46-product safety net.
 *      Only reached if the device has no internet access.
 */
async function shatokbFetchCatalogo() {
  const LIVE_STORE = 'https://shatokb.com';

  // ── Attempt 1: live store absolute URL ────────────────────────
  try {
    const raw     = await shatokbFetchAllPages(LIVE_STORE);
    const mapeados = raw.map(shatokbMapProduct).filter(Boolean);
    SHATOKB_CATALOGO = mapeados;
    shatokbCatalogoCargado = true;
    console.log(`[SHATOKB] ✅ Live catalogue from shatokb.com: ${mapeados.length} products (from ${raw.length} total).`);
    return;
  } catch (err) {
    console.warn('[SHATOKB] shatokb.com fetch failed — trying relative URL:', err.message);
  }

  // ── Attempt 2: relative URL (Shopify CLI / theme preview) ─────
  try {
    const raw     = await shatokbFetchAllPages('');
    const mapeados = raw.map(shatokbMapProduct).filter(Boolean);
    SHATOKB_CATALOGO = mapeados.length > 0 ? mapeados : SHATOKB_FALLBACK;
    shatokbCatalogoCargado = true;
    if (mapeados.length > 0) {
      console.log(`[SHATOKB] ✅ Catalogue via relative URL: ${mapeados.length} products (from ${raw.length} total).`);
    } else {
      console.warn('[SHATOKB] No tagged products found — using static fallback.');
    }
    return;
  } catch (err) {
    console.warn('[SHATOKB] Relative fetch also failed — using static fallback:', err.message);
  }

  // ── Attempt 3: static fallback ────────────────────────────────
  SHATOKB_CATALOGO = SHATOKB_FALLBACK;
  shatokbCatalogoCargado = true;
  console.warn(`[SHATOKB] ⚠️ Using static fallback catalogue (${SHATOKB_FALLBACK.length} products). Results are representative but not exhaustive.`);
}


/* ============================================================
   4. FALLBACK CATALOGUE  —  used only when /products.json is
   unavailable (local preview, dev environment).
   All handles, names and prices are REAL products from shatokb.com.
   In production Shopify this array is never used — the live
   catalogue from /products.json takes over automatically.
============================================================ */
const SHATOKB_FALLBACK = [

  /* ── CLEANSERS ─────────────────────────────────────────────── */
  {
    id:'cosrx-low-ph-cleanser', handle:'cosrx-low-ph-good-morning-gel-face-cleanser',
    nombre:'COSRX Low pH Good Morning Gel Cleanser',
    precio:'$12.99', precio_num:12.99, badge:'Best Seller', emoji:'🫧',
    desc:'Low-pH gel that cleanses without disrupting your barrier. Salicylic acid controls sebum and minimises pores without stripping.',
    tipo_piel:['grasa','mixta','sensible','nolose'], categoria:'cleanser',
    concerns:['acne','poros','rojeces'], sensible:true
  },
  {
    id:'anua-foam-cleanser', handle:'anua-heartleaf-quercetinol-pore-deep-cleansing-foam-150ml-5-07-fl-oz',
    nombre:'Anua Heartleaf Quercetinol Pore Deep Cleansing Foam',
    precio:'$16.99', precio_num:16.99, badge:null, emoji:'🫧',
    desc:'BHA + heartleaf foam that dissolves sebum plugs while calming inflammation. Ideal for oily and acne-prone skin.',
    tipo_piel:['grasa','mixta','sensible','nolose'], categoria:'cleanser',
    concerns:['acne','poros','rojeces'], sensible:true
  },
  {
    id:'anua-cleansing-oil', handle:'anua-heartleaf-pore-control-cleansing-oil-6-76-fl-oz-200ml',
    nombre:'Anua Heartleaf Pore Control Cleansing Oil',
    precio:'$19.99', precio_num:19.99, badge:'Best Seller', emoji:'🫧',
    desc:'Glass-skin cleansing oil that dissolves SPF and makeup on contact. Fragrance-free, non-comedogenic — even for sensitive skin.',
    tipo_piel:['grasa','mixta','sensible','seca','nolose'], categoria:'cleanser',
    concerns:['acne','poros','deshidratacion'], sensible:true
  },
  {
    id:'dearklairs-black-cleanser', handle:'dearklairs-gentle-black-facial-cleanser-4-73-fl-oz-vegan-low-ph-hydrating-finish',
    nombre:'DearKlairs Gentle Black Facial Cleanser',
    precio:'$18.00', precio_num:18.00, badge:'Best Seller', emoji:'🫧',
    desc:'Low pH antioxidant cleanser with black bean and truffle. Hydrating finish — no tight feeling after washing.',
    tipo_piel:['seca','mixta','sensible','nolose'], categoria:'cleanser',
    concerns:['deshidratacion','rojeces','antiaging'], sensible:true
  },
  {
    id:'pyunkang-foam', handle:'pyunkang-yul-cleansing-foam-5-1-fl-oz',
    nombre:'Pyunkang Yul Cleansing Foam',
    precio:'$14.00', precio_num:14.00, badge:null, emoji:'🫧',
    desc:'Zero-irritation foam for dry and sensitive skin. Minimal ingredients, maximum gentleness.',
    tipo_piel:['seca','sensible','nolose'], categoria:'cleanser',
    concerns:['rojeces','deshidratacion'], sensible:true
  },
  {
    id:'skin1004-foam', handle:'skin1004-madagascar-centella-ampoule-foam-4-22-fl-oz-125ml',
    nombre:'SKIN1004 Madagascar Centella Ampoule Foam',
    precio:'$14.00', precio_num:14.00, badge:'Best Seller', emoji:'🫧',
    desc:'Baking soda + centella foam that deep-cleans pores and soothes breakout-prone skin. EWG certified.',
    tipo_piel:['grasa','mixta','sensible','nolose'], categoria:'cleanser',
    concerns:['acne','poros','rojeces'], sensible:true
  },
  {
    id:'heimish-balm', handle:'heimish-all-clean-balm-4-0fl-oz-120ml-multi-purpose-cleansing-balm',
    nombre:'HEIMISH All Clean Balm',
    precio:'$22.00', precio_num:22.00, badge:'Best Seller', emoji:'🫧',
    desc:'Cult-status balm that melts makeup, SPF and impurities without residue. Perfect first cleanse.',
    tipo_piel:['grasa','mixta','seca','sensible','nolose'], categoria:'cleanser',
    concerns:['acne','manchas','deshidratacion'], sensible:true
  },
  {
    id:'beauty-joseon-balm', handle:'beauty-of-joseon-radiance-cleansing-balm-makeup-sunscreen-pore-cleanser-for-sensitive-acne-skin-korean-skincare-for-men-and-women-100ml-3-38-fl-oz',
    nombre:'Beauty of Joseon Radiance Cleansing Balm',
    precio:'$13.00', precio_num:13.00, badge:'Best Seller', emoji:'🫧',
    desc:'Exfoliating cleansing balm that removes SPF and makeup while brightening dull skin.',
    tipo_piel:['grasa','mixta','seca','sensible','nolose'], categoria:'cleanser',
    concerns:['manchas','textura','deshidratacion'], sensible:true
  },

  /* ── TONERS ─────────────────────────────────────────────────── */
  {
    id:'some-by-mi-toner', handle:'some-by-mi-aha-bha-pha-30-days-miracle-toner-5-07oz-150ml',
    nombre:'SOME BY MI AHA·BHA·PHA 30 Days Miracle Toner',
    precio:'$16.99', precio_num:16.99, badge:null, emoji:'💧',
    desc:'Triple-acid toner that treats acne, dark spots and rough texture simultaneously. Visible results in 30 days.',
    tipo_piel:['grasa','mixta','nolose'], categoria:'toner',
    concerns:['acne','poros','textura','manchas'], sensible:false
  },
  {
    id:'dearklairs-toner', handle:'dear-klairs-supple-preparation-unscented-toner-6-08-fl-oz',
    nombre:'DearKlairs Supple Preparation Unscented Toner',
    precio:'$24.00', precio_num:24.00, badge:'Best Seller', emoji:'💧',
    desc:'Alcohol-free, fragrance-free hydrating toner. Beta-glucan and centella soothe redness and deeply replenish moisture.',
    tipo_piel:['seca','mixta','sensible','grasa','nolose'], categoria:'toner',
    concerns:['deshidratacion','rojeces','antiaging'], sensible:true
  },
  {
    id:'anua-soothing-toner', handle:'anua-heartleaf-77-soothing-toner-i-ph-5-5-trouble-care-calming-skin-refreshing-hydrating-purifying-cruelty-free-vegan-250ml-8-45-fl-oz',
    nombre:'Anua Heartleaf 77 Soothing Toner',
    precio:'$22.00', precio_num:22.00, badge:'Best Seller', emoji:'💧',
    desc:'77% heartleaf extract at pH 5.5 — calms breakouts, strengthens the barrier and hydrates in one step.',
    tipo_piel:['grasa','mixta','sensible','nolose'], categoria:'toner',
    concerns:['acne','rojeces','deshidratacion'], sensible:true
  },
  {
    id:'tirtir-rice-toner', handle:'tirtir-milk-skin-rice-toner-deep-moisturizing-hydrating-toner-for-face-5-07-fl-oz',
    nombre:'TIRTIR Milk Skin Rice Toner',
    precio:'$26.00', precio_num:26.00, badge:null, emoji:'💧',
    desc:'Milky rice toner with 4% niacinamide. Brightens uneven tone, hydrates deeply and leaves skin glass-smooth.',
    tipo_piel:['seca','mixta','sensible','nolose'], categoria:'toner',
    concerns:['manchas','deshidratacion','textura'], sensible:true
  },
  {
    id:'im-from-rice-toner', handle:'im-from-rice-toner-milky-toner-for-glowing-skin-korean-rice-glow-essence-with-niacinamide-5-07-fl-oz',
    nombre:"I'm From Rice Toner",
    precio:'$32.00', precio_num:32.00, badge:'Best Seller', emoji:'💧',
    desc:'Milky toner with rice bran extract and niacinamide for glass skin. Brightens, hydrates and evens tone.',
    tipo_piel:['seca','mixta','grasa','nolose'], categoria:'toner',
    concerns:['manchas','deshidratacion','textura'], sensible:true
  },
  {
    id:'medicube-collagen-toner', handle:'medicube-triple-collagen-toner',
    nombre:'Medicube Triple Collagen Toner',
    precio:'$29.00', precio_num:29.00, badge:'Best Seller', emoji:'💧',
    desc:'3-type collagen toner that deeply plumps and firms. Fast-absorbing dewy formula for visible elasticity boost.',
    tipo_piel:['seca','mixta','nolose'], categoria:'toner',
    concerns:['antiaging','deshidratacion','textura'], sensible:true
  },
  {
    id:'pyunkang-toner', handle:'pyunkang-yul-calming-deep-moisture-toner-face-toner-for-women-containing-aha-and-pha-150ml-5-07-fl-oz',
    nombre:'Pyunkang Yul Calming Deep Moisture Toner',
    precio:'$18.00', precio_num:18.00, badge:null, emoji:'💧',
    desc:'AHA + PHA toner that gently exfoliates while intensely hydrating. For dry, sensitive and acne-prone skin.',
    tipo_piel:['seca','sensible','grasa','nolose'], categoria:'toner',
    concerns:['deshidratacion','textura','acne','rojeces'], sensible:true
  },

  /* ── ESSENCES ───────────────────────────────────────────────── */
  {
    id:'cosrx-snail-essence', handle:'cosrx-snail-mucin-96-power-repairing-essence-3-38-fl-oz-100ml',
    nombre:'COSRX Snail Mucin 96% Power Repairing Essence',
    precio:'$25.00', precio_num:25.00, badge:'Best Seller', emoji:'🐌',
    desc:'The most iconic K-Beauty essence. 96% snail secretion repairs the barrier, fades marks and hydrates every skin type.',
    tipo_piel:['grasa','mixta','seca','sensible','nolose'], categoria:'essence',
    concerns:['deshidratacion','manchas','rojeces','antiaging','textura'], sensible:true
  },
  {
    id:'haruharu-essence', handle:'haruharu-wonder-black-rice-probiotics-barrier-essence-4-05-fl-oz',
    nombre:'Haruharu Wonder Black Rice Probiotics Barrier Essence',
    precio:'$32.00', precio_num:32.00, badge:null, emoji:'🌿',
    desc:'Fermented black rice + probiotics essence that rebuilds the barrier, adds glow and soothes redness.',
    tipo_piel:['seca','mixta','sensible','nolose'], categoria:'essence',
    concerns:['deshidratacion','rojeces','manchas','antiaging'], sensible:true
  },
  {
    id:'abib-heartleaf-essence', handle:'abib-heartleaf-essence-calming-pump-1-69-fl-oz-50ml-i-essence-for-face',
    nombre:'Abib Heartleaf Essence Calming Pump',
    precio:'$29.00', precio_num:29.00, badge:'Best Seller', emoji:'🌿',
    desc:'Houttuynia cordata essence that instantly calms redness and soothes post-breakout inflammation.',
    tipo_piel:['sensible','mixta','seca','nolose'], categoria:'essence',
    concerns:['rojeces','deshidratacion','acne'], sensible:true
  },
  {
    id:'haruharu-hyaluronic-toner-essence', handle:'haruharu-wonder-black-rice-hyaluronic-toner-for-all-skin-types-5-1-fl-oz-150ml',
    nombre:'Haruharu Wonder Black Rice Hyaluronic Toner',
    precio:'$28.00', precio_num:28.00, badge:'Best Seller', emoji:'🌿',
    desc:'EWG-safe fermented black rice toner-essence that delivers 72-hour hydration and restores skin elasticity.',
    tipo_piel:['seca','mixta','sensible','nolose'], categoria:'essence',
    concerns:['deshidratacion','antiaging','rojeces'], sensible:true
  },
  {
    id:'vt-pdrn-essence', handle:'vt-cosmetics-pdrn-100-essence-intensive-glow-serum-vegan-pdrn-100-000ppm-1-01-fl-oz',
    nombre:'VT COSMETICS PDRN 100 Essence Intensive Glow Serum',
    precio:'$34.00', precio_num:34.00, badge:'Best Seller', emoji:'💊',
    desc:'100,000ppm PDRN essence that repairs skin elasticity, boosts collagen and delivers an intense glow.',
    tipo_piel:['seca','mixta','nolose'], categoria:'essence',
    concerns:['antiaging','deshidratacion','textura'], sensible:true
  },

  /* ── SERUMS ─────────────────────────────────────────────────── */
  {
    id:'cosrx-niacinamide-serum', handle:'cosrx-15-niacinamide-face-serum-0-67-fl-oz',
    nombre:'COSRX 15% Niacinamide Face Serum',
    precio:'$17.99', precio_num:17.99, badge:'Best Seller', emoji:'💊',
    desc:'15% niacinamide minimises pores, controls sebum, fades dark spots and evens skin tone — visibly in 2 weeks.',
    tipo_piel:['grasa','mixta','sensible','nolose'], categoria:'serum',
    concerns:['poros','acne','manchas','textura'], sensible:true
  },
  {
    id:'anua-niacinamide-serum', handle:'anua-niacinamide-10-txa-4-serum-hyaluronic-acid-tranexamic-acid-vitamin-b12-30ml-1-01-fl-oz',
    nombre:'ANUA Niacinamide 10 + TXA 4 Serum',
    precio:'$22.00', precio_num:22.00, badge:'Best Seller', emoji:'💊',
    desc:'Niacinamide + tranexamic acid serum that fades spots, evens tone and tightens pores. A daily brightening essential.',
    tipo_piel:['grasa','mixta','sensible','nolose'], categoria:'serum',
    concerns:['manchas','poros','textura','deshidratacion'], sensible:true
  },
  {
    id:'some-by-mi-retinol', handle:'some-by-mi-retinol-intense-reactivating-serum-1-69oz-50ml',
    nombre:'SOME BY MI Retinol Intense Reactivating Serum',
    precio:'$24.00', precio_num:24.00, badge:null, emoji:'💊',
    desc:'Gentle encapsulated retinol that stimulates collagen and speeds cell renewal. Start 2–3 nights per week.',
    tipo_piel:['seca','mixta','grasa','nolose'], categoria:'serum',
    concerns:['antiaging','textura','manchas'], sensible:false
  },
  {
    id:'beauty-joseon-calming-serum', handle:'beauty-of-joseon-calming-serum-green-tea-panthenol-soothing-moisturizing-sensitive-acne-prone-uv-irritated-skin-daily-korean-skin-care-for-men-and-women-30ml-1-fl-oz',
    nombre:'Beauty of Joseon Calming Serum: Green Tea + Panthenol',
    precio:'$15.00', precio_num:15.00, badge:'Best Seller', emoji:'💊',
    desc:'Green tea + panthenol calming serum that soothes breakouts, hydrates and strengthens the skin barrier.',
    tipo_piel:['grasa','mixta','sensible','nolose'], categoria:'serum',
    concerns:['acne','rojeces','deshidratacion'], sensible:true
  },
  {
    id:'beauty-joseon-glow-serum', handle:'beauty-of-joseon-glow-deep-serum-rice-alpha-arbutin-30ml',
    nombre:'Beauty of Joseon Glow Deep Serum: Rice + Alpha-Arbutin',
    precio:'$15.00', precio_num:15.00, badge:'Best Seller', emoji:'💊',
    desc:'Rice water + alpha-arbutin serum that fades hyperpigmentation and delivers a glass-skin glow.',
    tipo_piel:['seca','mixta','grasa','nolose'], categoria:'serum',
    concerns:['manchas','textura','deshidratacion'], sensible:true
  },
  {
    id:'skin1004-centella-ampoule', handle:'skin1004-madagascar-centella-asiatica-ampoule-facial-serum-3-38-fl-oz100ml',
    nombre:'SKIN1004 Madagascar Centella Asiatica Ampoule',
    precio:'$18.00', precio_num:18.00, badge:'Best Seller', emoji:'💊',
    desc:'100% Madagascar centella serum that calms redness, repairs the barrier and soothes sensitised skin.',
    tipo_piel:['sensible','mixta','seca','nolose'], categoria:'serum',
    concerns:['rojeces','deshidratacion','acne'], sensible:true
  },
  {
    id:'cosrx-vitamin-c-13', handle:'cosrx-pure-vitamin-c-13-serum-with-vitamin-e-hyaluronic-acid-0-67fl-oz-20ml',
    nombre:'COSRX Pure Vitamin C 13% Serum',
    precio:'$19.99', precio_num:19.99, badge:'Best Seller', emoji:'💊',
    desc:'Pure 13% L-ascorbic acid with vitamin E and HA. Brightens, fades spots and protects against free radicals.',
    tipo_piel:['mixta','seca','grasa','nolose'], categoria:'serum',
    concerns:['manchas','antiaging','textura'], sensible:false
  },
  {
    id:'anua-azelaic-serum', handle:'anua-azelaic-acid-10-hyaluron-redness-soothing-serum-30ml-1-01-fl-oz',
    nombre:'ANUA Azelaic Acid 10 Hyaluron Redness Soothing Serum',
    precio:'$22.00', precio_num:22.00, badge:'Best Seller', emoji:'💊',
    desc:'Azelaic acid 10% + HA serum for redness, rosacea and blemishes. Calms, brightens and hydrates simultaneously.',
    tipo_piel:['sensible','mixta','grasa','nolose'], categoria:'serum',
    concerns:['rojeces','acne','manchas','deshidratacion'], sensible:true
  },
  {
    id:'medicube-vita-c-serum', handle:'medicube-deep-vita-c-serum-2-0-14-5-pure-vitamin-c',
    nombre:'Medicube Deep Vita C Serum 2.0 — 14.5% Pure Vitamin C',
    precio:'$38.00', precio_num:38.00, badge:'Best Seller', emoji:'💊',
    desc:'14.5% pure vitamin C for intense brightening, dark spot correction and elasticity boosting.',
    tipo_piel:['mixta','seca','grasa','nolose'], categoria:'serum',
    concerns:['manchas','antiaging','textura'], sensible:false
  },
  {
    id:'frankly-retinol', handle:'frankly-retinol-0-1-cream-1-01-fl-oz-beginner-retinol-night-cream-with-ceramides',
    nombre:'FRANKLY Retinol 0.1% Cream',
    precio:'$24.00', precio_num:24.00, badge:'Best Seller', emoji:'💊',
    desc:'Beginner retinol night cream with ceramides. Smooths texture, fades dark spots and builds collagen.',
    tipo_piel:['seca','mixta','grasa','nolose'], categoria:'serum',
    concerns:['antiaging','textura','manchas'], sensible:false
  },
  {
    id:'cosrx-retinol-oil', handle:'cosrx-retinol-0-5-oil-anti-aging-serum-with-0-5-retinoid-treatment-for-face',
    nombre:'COSRX Retinol 0.5 Oil',
    precio:'$21.99', precio_num:21.99, badge:'Best Seller', emoji:'💊',
    desc:'0.5% retinol in a squalane-rich oil base. Renews skin, fades fine lines and improves texture overnight.',
    tipo_piel:['seca','mixta','nolose'], categoria:'serum',
    concerns:['antiaging','textura','manchas'], sensible:false
  },
  {
    id:'abib-dark-spot-serum', handle:'abib-glutathiosome-dark-spot-serum-vita-drop-1-69-fl-oz',
    nombre:'Abib Glutathiosome Dark Spot Serum Vita Drop',
    precio:'$38.00', precio_num:38.00, badge:'Best Seller', emoji:'💊',
    desc:'Glutathione + vitamin C encapsulated serum for deep dark spot correction and luminous, even skin tone.',
    tipo_piel:['mixta','seca','grasa','sensible','nolose'], categoria:'serum',
    concerns:['manchas','antiaging','textura'], sensible:true
  },

  /* ── MOISTURIZERS ───────────────────────────────────────────── */
  {
    id:'cosrx-birch-lotion', handle:'cosrx-oil-free-lotion-with-birch-sap-daily-acne-facial-moisturizer-hydrating-moisturizer-for-all-skin-types-3-38-fl-oz-100ml',
    nombre:'COSRX Oil-Free Lotion with Birch Sap',
    precio:'$18.00', precio_num:18.00, badge:'Best Seller', emoji:'🧴',
    desc:'Oil-free gel moisturizer with birch sap. Non-comedogenic hydration for oily and acne-prone skin.',
    tipo_piel:['grasa','mixta','nolose'], categoria:'moisturizer',
    concerns:['acne','poros','deshidratacion'], sensible:true
  },
  {
    id:'dearklairs-calming-cream', handle:'dearklairs-midnight-blue-calming-cream-2oz',
    nombre:'DearKlairs Midnight Blue Calming Cream',
    precio:'$21.00', precio_num:21.00, badge:'Best Seller', emoji:'🧴',
    desc:'Guaiazulene + centella cream that reduces active redness and repairs the barrier. The go-to for reactive skin.',
    tipo_piel:['sensible','mixta','seca','nolose'], categoria:'moisturizer',
    concerns:['rojeces','deshidratacion','acne'], sensible:true
  },
  {
    id:'skin1004-soothing-cream', handle:'skin1004-madagascar-centella-soothing-cream-2-53-fl-oz-75ml',
    nombre:'SKIN1004 Madagascar Centella Soothing Cream',
    precio:'$18.00', precio_num:18.00, badge:'Best Seller', emoji:'🧴',
    desc:'Pure centella cream that calms sensitised skin, repairs the barrier and locks in long-lasting hydration.',
    tipo_piel:['sensible','mixta','seca','nolose'], categoria:'moisturizer',
    concerns:['rojeces','deshidratacion','antiaging'], sensible:true
  },
  {
    id:'pyunkang-moisture-cream', handle:'pyunkang-yul-moisture-cream-3-4-fl-oz',
    nombre:'Pyunkang Yul Moisture Cream',
    precio:'$28.00', precio_num:28.00, badge:'Best Seller', emoji:'🧴',
    desc:'Minimal-ingredient barrier cream with shea butter and jojoba oil. Intensely nourishes dry and damaged skin.',
    tipo_piel:['seca','sensible','mixta','nolose'], categoria:'moisturizer',
    concerns:['deshidratacion','rojeces','antiaging'], sensible:true
  },
  {
    id:'cosrx-snail-moisturizer', handle:'cosrx-snail-mucin-92-face-moisturizer-3-52-oz',
    nombre:'COSRX Snail Mucin 92% Face Moisturizer',
    precio:'$24.00', precio_num:24.00, badge:'Best Seller', emoji:'🧴',
    desc:'92% snail secretion lightweight cream. Repairs, hydrates and brightens — ideal for dry and dull skin.',
    tipo_piel:['seca','mixta','sensible','nolose'], categoria:'moisturizer',
    concerns:['deshidratacion','manchas','antiaging','rojeces'], sensible:true
  },
  {
    id:'tirtir-ceramide-cream', handle:'tirtir-natural-ceramide-cream-deep-moisturizer-for-glass-skin',
    nombre:'TIRTIR Natural Ceramide Cream',
    precio:'$28.00', precio_num:28.00, badge:null, emoji:'🧴',
    desc:'Ceramide-rich deep moisturizer for glass skin. Strengthens the barrier, soothes and delivers all-day hydration.',
    tipo_piel:['seca','mixta','sensible','nolose'], categoria:'moisturizer',
    concerns:['deshidratacion','antiaging','rojeces'], sensible:true
  },
  {
    id:'medicube-zero-pore-cream', handle:'zero-pore-one-day-cream',
    nombre:'Medicube Zero Pore One-Day Cream',
    precio:'$32.00', precio_num:32.00, badge:'Best Seller', emoji:'🧴',
    desc:'Niacinamide + salicylic acid cream that tightens pores, controls sebum and hydrates — all in one step.',
    tipo_piel:['grasa','mixta','nolose'], categoria:'moisturizer',
    concerns:['poros','acne','deshidratacion'], sensible:true
  },
  {
    id:'numbuzin-cream', handle:'numbuzin-no-4-cream-full-nutrient-firming-cream-2-02-fl-oz',
    nombre:'Numbuzin No.4 Full-Nutrient Firming Cream',
    precio:'$34.00', precio_num:34.00, badge:null, emoji:'🧴',
    desc:'Red ginseng + niacinamide firming cream. Revitalises, plumps and improves elasticity for mature or dry skin.',
    tipo_piel:['seca','mixta','nolose'], categoria:'moisturizer',
    concerns:['antiaging','deshidratacion','manchas'], sensible:true
  },

  /* ── SPF ────────────────────────────────────────────────────── */
  {
    id:'beauty-joseon-spf', handle:'beauty-of-joseon-relief-sun-rice-probiotics-spf50-pa-50ml',
    nombre:'Beauty of Joseon Relief Sun: Rice + Probiotics SPF50+',
    precio:'$16.00', precio_num:16.00, badge:'Best Seller', emoji:'☀️',
    desc:'The most beloved K-Beauty SPF. Rice extract + probiotics, zero white cast, deeply calming for sensitive skin.',
    tipo_piel:['grasa','mixta','sensible','seca','nolose'], categoria:'spf',
    concerns:['manchas','rojeces','deshidratacion'], sensible:true
  },
  {
    id:'haruharu-mineral-spf', handle:'haruharu-wonder-black-rice-pure-mineral-relief-daily-sunscreen-spf50-pa-50ml-1-69fl-oz',
    nombre:'Haruharu Wonder Black Rice Pure Mineral Sunscreen SPF50+',
    precio:'$22.00', precio_num:22.00, badge:'Best Seller', emoji:'☀️',
    desc:'Reef-safe mineral SPF50+ with black rice and niacinamide. Anti-pollution, anti-pigmentation, sensitive-skin safe.',
    tipo_piel:['sensible','seca','mixta','nolose'], categoria:'spf',
    concerns:['manchas','rojeces','deshidratacion'], sensible:true
  },
  {
    id:'abib-sunstick', handle:'abib-airy-sunstick-protection-bar-broad-spectrum-spf50-0-81-oz-23-g-semi-matte',
    nombre:'Abib Airy Sunstick Protection Bar SPF50+',
    precio:'$22.00', precio_num:22.00, badge:'Best Seller', emoji:'☀️',
    desc:'Hybrid SPF50+ stick with ceramides and peptides. Semi-matte finish — no white cast, makeup-friendly.',
    tipo_piel:['grasa','mixta','nolose'], categoria:'spf',
    concerns:['manchas','acne','poros'], sensible:true
  },
  {
    id:'purito-spf', handle:'purito-sun-day-adventure-korean-sunscreen-50ml-1-69-fl-oz',
    nombre:'PURITO Sun Day Adventure Sunscreen SPF50+',
    precio:'$18.00', precio_num:18.00, badge:'Best Seller', emoji:'☀️',
    desc:'Hybrid SPF50+ that is oil-free and non-comedogenic. Smooth texture that works perfectly under makeup.',
    tipo_piel:['grasa','mixta','sensible','nolose'], categoria:'spf',
    concerns:['acne','poros','manchas'], sensible:true
  },
  {
    id:'haruharu-airyfit-spf', handle:'haruharu-wonder-black-rice-moisture-airyfit-daily-sunscreen-50ml-1-69fl-oz',
    nombre:'Haruharu Wonder Black Rice Moisture Airyfit Sunscreen',
    precio:'$24.00', precio_num:24.00, badge:'Best Seller', emoji:'☀️',
    desc:'Antioxidant-rich black rice SPF50+ with niacinamide. Fragrance-free, ultra-light finish for sensitive skin.',
    tipo_piel:['sensible','seca','mixta','nolose'], categoria:'spf',
    concerns:['manchas','rojeces','deshidratacion'], sensible:true
  },
  {
    id:'dalba-spf', handle:'dalba-piedmont-waterfull-tone-up-sunscreen-serum-broad-spectrum-spf-50-1-7fl-oz',
    nombre:"d'Alba Waterfull Tone-Up Sunscreen Serum SPF50+",
    precio:'$28.00', precio_num:28.00, badge:'Best Seller', emoji:'☀️',
    desc:'Hybrid sunscreen-serum with white truffle. Tone-up effect, dewy glow finish — perfect base for makeup.',
    tipo_piel:['seca','mixta','nolose'], categoria:'spf',
    concerns:['manchas','deshidratacion','textura'], sensible:true
  },

  /* ── MASKS ──────────────────────────────────────────────────── */
  {
    id:'cosrx-snail-mask', handle:'cosrx-advanced-snail-mucin-glass-glow-hydrogel-face-masks-skincare-3-ea',
    nombre:'COSRX Advanced Snail Mucin Glass Glow Hydrogel Masks',
    precio:'$12.00', precio_num:12.00, badge:null, emoji:'🩵',
    desc:'Snail mucin hydrogel masks for glass skin. 25% snail secretion + collagen for deep hydration and brightening.',
    tipo_piel:['grasa','mixta','seca','sensible','nolose'], categoria:'mask',
    concerns:['deshidratacion','manchas','antiaging'], sensible:true
  },
  {
    id:'vt-soothing-mask', handle:'vt-cosmetics-daily-soothing-mask-30ea-facial-sheet-mask-for-moist-hydrating',
    nombre:'VT Cosmetics Daily Soothing Mask (30 sheets)',
    precio:'$29.00', precio_num:29.00, badge:'Best Seller', emoji:'🩵',
    desc:'Daily centella sheet mask for instant hydration and soothing. Non-sticky, fast-absorbing ampoule essence.',
    tipo_piel:['sensible','mixta','seca','nolose'], categoria:'mask',
    concerns:['deshidratacion','rojeces','textura'], sensible:true
  },
  {
    id:'pyunkang-mask', handle:'pyunkang-yul-highly-moisturizing-mask-pack-10-pcs',
    nombre:'Pyunkang Yul Highly Moisturizing Mask Pack',
    precio:'$14.00', precio_num:14.00, badge:null, emoji:'🩵',
    desc:'10-pack ceramide + hyaluronic acid sheet mask for dry, sensitised skin. Fragrance-free, dermatologist tested.',
    tipo_piel:['seca','sensible','mixta','nolose'], categoria:'mask',
    concerns:['deshidratacion','rojeces','antiaging'], sensible:true
  },
  {
    id:'abib-overnight-mask', handle:'abib-rice-probiotics-overnight-mask-barrier-jelly-2-7-fl-oz',
    nombre:'Abib Rice Probiotics Overnight Mask Barrier Jelly',
    precio:'$26.00', precio_num:26.00, badge:'Best Seller', emoji:'🩵',
    desc:'Overnight jelly sleeping mask with rice probiotics. Wakes up skin radiant, plump and barrier-strong.',
    tipo_piel:['seca','mixta','nolose'], categoria:'mask',
    concerns:['deshidratacion','manchas','antiaging'], sensible:true
  },
  {
    id:'medicube-clay-mask', handle:'medicube-zero-pore-blackhead-mud-facial-mask-3-52-oz',
    nombre:'Medicube Zero Pore Blackhead Mud Facial Mask',
    precio:'$24.00', precio_num:24.00, badge:'Best Seller', emoji:'🩵',
    desc:'AHA + BHA + PHA clay mask that deep-cleans pores and removes blackheads in 3 minutes.',
    tipo_piel:['grasa','mixta','nolose'], categoria:'mask',
    concerns:['acne','poros','textura'], sensible:false
  },

  /* ── EYE CARE ───────────────────────────────────────────────── */
  {
    id:'medicube-eye-serum', handle:'medicube-salmon-dna-pdrn-pink-peptide-eye-serum-with-niacinamide-and-99-purity-retinol-1-01fl-oz',
    nombre:'Medicube Salmon DNA PDRN Pink Peptide Eye Serum',
    precio:'$38.00', precio_num:38.00, badge:'Best Seller', emoji:'👁️',
    desc:'PDRN + peptide + retinol eye serum that brightens dark circles, firms and reduces fine lines around the eyes.',
    tipo_piel:['seca','mixta','nolose'], categoria:'eye',
    concerns:['antiaging','manchas','deshidratacion'], sensible:true
  },
  {
    id:'haruharu-eye-cream', handle:'haruharu-wonder-black-rice-bakuchiol-eye-cream-0-67-fl-oz-20ml-anti-aging-wrinkle-care-natural-retinol-alternative-cruelty-free-ewg-green',
    nombre:'Haruharu Wonder Black Rice Bakuchiol Eye Cream',
    precio:'$28.00', precio_num:28.00, badge:'Best Seller', emoji:'👁️',
    desc:'Natural retinol-alternative bakuchiol eye cream. Firms, brightens dark circles and reduces fine lines gently.',
    tipo_piel:['seca','mixta','sensible','nolose'], categoria:'eye',
    concerns:['antiaging','manchas','deshidratacion'], sensible:true
  },
  {
    id:'beauty-joseon-eye-serum', handle:'beauty-of-joseon-revive-eye-serum-with-retinal-niacinamide-correction-for-puffy-eye-bags-fine-lines-dark-circles-wrinkles-korean-skin-care-30ml-1-fl-oz',
    nombre:'Beauty of Joseon Revive Eye Serum: Retinal + Niacinamide',
    precio:'$22.00', precio_num:22.00, badge:'Best Seller', emoji:'👁️',
    desc:'Retinal + niacinamide eye serum for dark circles, puffiness and fine lines. Results from week 2.',
    tipo_piel:['seca','mixta','nolose'], categoria:'eye',
    concerns:['antiaging','manchas','deshidratacion'], sensible:true
  },
  {
    id:'goodal-eye-patch', handle:'goodal-green-tangerine-vitamin-c-moisturizing-eye-patch-5-minute-hydrating-gel-patch-60-sheets',
    nombre:'Goodal Green Tangerine Vitamin C Eye Patches (60 sheets)',
    precio:'$22.00', precio_num:22.00, badge:'Best Seller', emoji:'👁️',
    desc:'5-minute vitamin C hydrogel eye patches that brighten dark circles, firm and instantly plump the eye area.',
    tipo_piel:['grasa','mixta','seca','sensible','nolose'], categoria:'eye',
    concerns:['manchas','antiaging','deshidratacion'], sensible:true
  }
];


/* ============================================================
   5. SKIN PROFILES
   Defines routine steps per profile.
   Products are found dynamically — nothing is hardcoded here.
============================================================ */
const SHATOKB_PERFILES = {
  grasa_acne: {
    titulo: 'The Oily Skin Overachiever',
    descripcion: "Your skin works overtime — producing more oil than it needs, which clogs pores and keeps breakouts coming back. The good news? K-Beauty was practically invented for this. These routines don't just mask the problem. They retrain your skin.",
    resumen: ['🫧 Oily & breakout-prone', '🎯 Active treatment', '⚡ Fast visible results'],
    pasos: [
      { categoria: 'cleanser',    nombre: 'Cleanser',          por_que: 'A low pH cleanser removes oil and impurities without triggering more sebum production. Your pores can finally breathe.' },
      { categoria: 'toner',       nombre: 'Exfoliating Toner', por_que: 'AHA/BHA dissolves the sebum trapped inside pores. This is the step most people skip — and the one that makes the biggest difference.' },
      { categoria: 'moisturizer', nombre: 'Moisturizer',       por_que: 'Skipping moisturizer makes oily skin produce even more oil. A lightweight, non-comedogenic formula tells your skin to stop overcompensating.' },
      { categoria: 'spf',         nombre: 'SPF 50+',           por_que: "Non-negotiable. Your acne-fighting actives make skin photosensitive — skipping SPF undoes everything else you're doing." }
    ]
  },
  grasa_poros: {
    titulo: 'The Pore Minimizer',
    descripcion: "Enlarged pores aren't just genetic — they're caused by excess oil and dead skin cells stretching them out over time. Korean chemical exfoliation is the most effective method in the world for gradually refining pore appearance. And it works.",
    resumen: ['🫧 Oily skin', '🔬 Visible pores', '✨ Texture refinement'],
    pasos: [
      { categoria: 'cleanser',    nombre: 'Cleanser',          por_que: "Clears away the oil that keeps pores stretched and clogged — without sending your sebaceous glands into overdrive." },
      { categoria: 'toner',       nombre: 'Exfoliating Toner', por_que: "This is where the magic happens. AHA/BHA acids break down the buildup inside pores. Weekly use visibly shrinks them." },
      { categoria: 'moisturizer', nombre: 'Moisturizer',       por_que: "Light hydration locks in your routine's results without adding weight or blocking pores." },
      { categoria: 'spf',         nombre: 'SPF 50+',           por_que: 'An oil-free formula keeps you matte all day. UV damage worsens pore appearance — SPF stops that from happening.' }
    ]
  },
  mixta_general: {
    titulo: 'The Balancing Act',
    descripcion: "Combination skin is tricky because it has contradictory needs in different zones. Products that fix one area often make another worse. K-Beauty's layering method solves this — you hydrate where you need it and control where you don't.",
    resumen: ['☯️ Combination skin', '💧 Needs balance', '🎯 Zone-specific results'],
    pasos: [
      { categoria: 'cleanser',    nombre: 'Cleanser',        por_que: 'Gently cleanses without drying out your cheeks or over-stimulating the T-zone. Balance starts here.' },
      { categoria: 'toner',       nombre: 'Hydrating Toner', por_que: 'Hydration delivered in layers absorbs evenly across all zones — no greasy patches, no tight areas.' },
      { categoria: 'essence',     nombre: 'Essence',         por_que: "The K-Beauty secret weapon. Replenishes moisture where it's needed while keeping oily areas in check." },
      { categoria: 'spf',         nombre: 'SPF 50+',         por_que: 'Daily sun protection without the greasy residue. Your skin stays balanced all day.' }
    ]
  },
  mixta_manchas: {
    titulo: 'The Spot Eraser',
    descripcion: "You're fighting two battles at once — excess sebum and hyperpigmentation. The breakthrough? Korean brightening actives like vitamin C, niacinamide and tranexamic acid work on both simultaneously. Your even tone is closer than you think.",
    resumen: ['☯️ Combination skin', '🟤 Dark spots & marks', '✨ Even tone incoming'],
    pasos: [
      { categoria: 'cleanser', nombre: 'Cleanser',          por_que: 'A clean, pH-balanced canvas ensures your brightening actives penetrate deeply instead of sitting on top of dead skin.' },
      { categoria: 'serum',    nombre: 'Brightening Serum', por_que: 'Vitamin C in the morning is the gold standard for fading spots and blocking future pigmentation. This step changes faces.' },
      { categoria: 'essence',  nombre: 'Essence',           por_que: 'Accelerates cell renewal and progressively evens out skin tone from layer one.' },
      { categoria: 'spf',      nombre: 'SPF 50+',           por_que: "Without SPF, your brightening actives are fighting a losing battle. UV exposure is the #1 cause of new dark spots." }
    ]
  },
  seca_hidratacion: {
    titulo: 'The Deep Hydration Protocol',
    descripcion: "Your skin is thirsty at a cellular level — and a single moisturizer isn't enough. K-Beauty invented layered hydration for exactly this: you build water content from the deepest layer outward, locking each one in before adding the next. The result is skin that stays plump for hours.",
    resumen: ['🌵 Dry skin', '💧 Hydration is everything', '🛡️ Barrier restoration'],
    pasos: [
      { categoria: 'cleanser',    nombre: 'Cleanser',        por_que: "A sulfate-free, creamy formula cleanses without stealing the little moisture your skin has left. Never skip this." },
      { categoria: 'toner',       nombre: 'Hydrating Toner', por_que: 'First layer of water. Apply while your face is still slightly damp — absorption increases by 40%.' },
      { categoria: 'essence',     nombre: 'Essence',         por_que: "Second layer. This is where K-Beauty separates itself. The essence penetrates deeper than a moisturizer ever could." },
      { categoria: 'moisturizer', nombre: 'Moisturizer',     por_que: 'Seals everything in. Without this final step, all that hydration evaporates within the hour.' },
      { categoria: 'spf',         nombre: 'SPF 50+',         por_que: 'A hydrating SPF with a dewy finish adds one last layer of protection. UV damage is the #1 cause of skin dryness.' }
    ]
  },
  seca_antiaging: {
    titulo: 'The Age-Defying Ritual',
    descripcion: "Dry skin ages faster — that's not an opinion, it's biology. When your barrier is weakened, collagen breaks down faster and fine lines deepen. The solution is intense, consistent hydration paired with proven actives. K-Beauty does this better than anything else in the world.",
    resumen: ['🌵 Dry skin', '⏳ Anti-aging focus', '🔬 Clinically proven actives'],
    pasos: [
      { categoria: 'cleanser',    nombre: 'Cleanser',        por_que: "Sulfate-free is non-negotiable for you. Harsh cleansers accelerate aging by stripping your skin's natural lipid barrier." },
      { categoria: 'toner',       nombre: 'Hydrating Toner', por_que: 'Preps skin before actives. Hydrated skin absorbs serums more effectively — this step multiplies everything that comes after.' },
      { categoria: 'serum',       nombre: 'Active Serum',    por_que: 'Vitamin C (morning) brightens and protects. Retinol (evening) rebuilds collagen from within. Two serums. Transformative results.' },
      { categoria: 'moisturizer', nombre: 'Moisturizer',     por_que: 'Rich, barrier-repairing hydration. While you sleep, your skin repairs itself — this gives it everything it needs to do that.' },
      { categoria: 'spf',         nombre: 'SPF 50+',         por_que: 'UV damage is responsible for 90% of visible aging. This one step protects all the work everything else is doing.' }
    ]
  },
  sensible_rojeces: {
    titulo: 'The Calm-Down Routine',
    descripcion: "Your skin isn't high-maintenance — it's just been treated with the wrong products. Most skincare is too aggressive for reactive skin. K-Beauty's calming philosophy was built around ingredients like Centella asiatica, panthenol and mugwort — gentle enough for the most sensitive skin, powerful enough to actually repair it.",
    resumen: ['🌸 Sensitive & reactive', '🔴 Redness relief', '🛡️ Barrier repair mode'],
    pasos: [
      { categoria: 'cleanser',    nombre: 'Cleanser',      por_que: 'Fragrance-free, SLS-free, minimal ingredients. Every unnecessary ingredient is a potential trigger — this step removes all of them.' },
      { categoria: 'toner',       nombre: 'Calming Toner', por_que: 'Alcohol-free, centella or aloe-based. Cools down redness on contact and starts repairing your skin barrier immediately.' },
      { categoria: 'serum',       nombre: 'Calming Serum', por_que: "Centella asiatica is Korea's #1 skin-calming ingredient. Clinical studies show 70% redness reduction in 4 weeks of consistent use." },
      { categoria: 'moisturizer', nombre: 'Repair Cream',  por_que: 'A stronger barrier means less reactivity. Every time you use this, your skin gets a little tougher — in the best possible way.' },
      { categoria: 'spf',         nombre: 'SPF 50+',       por_que: 'Mineral (physical) sunscreens sit on top of the skin instead of being absorbed — far gentler for reactive skin types.' }
    ]
  },
  general_glow: {
    titulo: 'The Glow Starter Kit',
    descripcion: "You don't need an 18-step routine to get results. You need the right products, in the right order, for your skin. This is the routine that introduces your skin to K-Beauty — and once you feel the difference, you'll never go back.",
    resumen: ['✨ Glow is the goal', '💧 Hydration first', '🌟 Simple but powerful'],
    pasos: [
      { categoria: 'cleanser',    nombre: 'Cleanser',    por_que: "Every great routine starts with a clean canvas. The right cleanser doesn't just clean — it sets the pH your other products need to work." },
      { categoria: 'essence',     nombre: 'Essence',     por_que: "The step that makes K-Beauty different from everything else. One bottle of snail mucin or fermented yeast changed millions of people's skin. It will change yours." },
      { categoria: 'moisturizer', nombre: 'Moisturizer', por_que: 'Locks in everything. Keeps your barrier intact. Gives you that "I just woke up like this" glow that lasts all day.' },
      { categoria: 'spf',         nombre: 'SPF 50+',     por_que: "If you're only going to do one thing for your skin, make it SPF. It's the single most powerful anti-aging, anti-damage step in existence." }
    ]
  }
};


/* ============================================================
   6. SCORING ENGINE
============================================================ */
function shatokbCalcularPerfil(resp) {
  const puntos = {};
  Object.keys(SHATOKB_PERFILES).forEach(p => { puntos[p] = 0; });
  const r = resp;

  // ── Tipo de piel ──────────────────────────────────────────────
  if (r.tipo_piel === 'grasa')    { puntos.grasa_acne += 3; puntos.grasa_poros += 3; }
  if (r.tipo_piel === 'mixta')    { puntos.mixta_general += 3; puntos.mixta_manchas += 2; }
  if (r.tipo_piel === 'seca')     { puntos.seca_hidratacion += 3; puntos.seca_antiaging += 2; }
  if (r.tipo_piel === 'sensible') { puntos.sensible_rojeces += 5; }
  if (r.tipo_piel === 'nolose')   { puntos.general_glow += 3; }

  // ── Preocupacion — puede ser string (legacy) o array (multi-select) ──
  const preocupaciones = Array.isArray(r.preocupacion)
    ? r.preocupacion
    : (r.preocupacion ? [r.preocupacion] : []);

  preocupaciones.forEach(p => {
    if (p === 'acne')           { puntos.grasa_acne += 4; }
    if (p === 'poros')          { puntos.grasa_poros += 4; }
    if (p === 'manchas')        { puntos.mixta_manchas += 4; puntos.seca_antiaging += 1; }
    if (p === 'deshidratacion') { puntos.seca_hidratacion += 4; puntos.mixta_general += 2; }
    if (p === 'rojeces')        { puntos.sensible_rojeces += 4; }
    if (p === 'antiaging')      { puntos.seca_antiaging += 4; }
    if (p === 'textura')        { puntos.grasa_poros += 2; puntos.mixta_general += 2; }
  });

  // ── Objetivo — puede ser string (legacy) o array (multi-select, max 2) ──
  const objetivos = Array.isArray(r.objetivo)
    ? r.objetivo
    : (r.objetivo ? [r.objetivo] : []);

  objetivos.forEach(o => {
    if (o === 'calmar')    { puntos.sensible_rojeces += 3; }
    if (o === 'controlar') { puntos.grasa_acne += 2; puntos.grasa_poros += 2; }
    if (o === 'hidratar')  { puntos.seca_hidratacion += 3; puntos.mixta_general += 2; }
    if (o === 'unificar')  { puntos.mixta_manchas += 3; }
    if (o === 'glow')      { puntos.general_glow += 2; puntos.seca_hidratacion += 1; }
    if (o === 'limpiar')   { puntos.grasa_acne += 2; puntos.grasa_poros += 3; }
  });

  if (r.sensibilidad === 'alta')  { puntos.sensible_rojeces += 3; }

  let mejor = 'general_glow', max = 0;
  Object.entries(puntos).forEach(([k, v]) => { if (v > max) { max = v; mejor = k; } });
  return mejor;
}


/* ============================================================
   7. RECOMMENDATION ENGINE
============================================================ */
const SHATOKB_BUDGET_LIMITS = { bajo: 40, medio: 80, alto: Infinity };
const SHATOKB_MAX_OPTIONS   = 3;

function shatokbRecomendarProductos(perfilId, respuestas) {
  const perfil       = SHATOKB_PERFILES[perfilId];
  const tipoPiel     = respuestas.tipo_piel;
  const sensibilidad = respuestas.sensibilidad;
  const nivelRutina  = respuestas.nivel_rutina;
  const presupuesto  = respuestas.presupuesto;
  const budgetMax    = SHATOKB_BUDGET_LIMITS[presupuesto] || Infinity;

  // Normalizar preocupacion y objetivo como arrays (backward-compatible con string)
  const preocupaciones = Array.isArray(respuestas.preocupacion)
    ? respuestas.preocupacion
    : (respuestas.preocupacion ? [respuestas.preocupacion] : []);

  const objetivos = Array.isArray(respuestas.objetivo)
    ? respuestas.objetivo
    : (respuestas.objetivo ? [respuestas.objetivo] : []);

  // Trim steps based on routine level
  let pasos = [...perfil.pasos];
  if (nivelRutina === 'basica' && pasos.length > 4) {
    const order     = ['cleanser', 'toner', 'essence', 'serum', 'moisturizer', 'spf'];
    const essential = ['cleanser', 'moisturizer', 'spf'];
    const actives   = pasos.filter(p => !essential.includes(p.categoria));
    const base      = pasos.filter(p => essential.includes(p.categoria));
    pasos = [...base, ...actives.slice(0, 1)]
      .sort((a, b) => order.indexOf(a.categoria) - order.indexOf(b.categoria));
  }

  return pasos.map(paso => {
    let candidatos = SHATOKB_CATALOGO.filter(p => p.categoria === paso.categoria);

    candidatos = candidatos.map(p => {
      let score = 0;

      // ── Tipo de piel ────────────────────────────────────────────
      if (p.tipo_piel.includes(tipoPiel))  score += 10;
      else if (tipoPiel === 'nolose')       score += 5;

      // ── Preocupacion — suma por cada concern que coincida (array) ─
      preocupaciones.forEach(concern => {
        if (p.concerns.includes(concern)) score += 8;
      });

      // ── Objetivo — suma por cada objetivo que coincida (array) ───
      objetivos.forEach(obj => {
        if (p.concerns.includes(obj)) score += 5;
      });

      // ── Sensibilidad ─────────────────────────────────────────────
      if (sensibilidad === 'alta' && p.sensible)   score += 6;
      if (sensibilidad === 'alta' && !p.sensible)  score -= 4;

      // ── Presupuesto ──────────────────────────────────────────────
      if (p.precio_num <= budgetMax)  score += 4;
      else                            score -= 3;

      return { ...p, _score: score };
    });

    candidatos.sort((a, b) => b._score - a._score);
    const opciones = candidatos.slice(0, SHATOKB_MAX_OPTIONS);

    return { paso: paso.nombre, por_que: paso.por_que, opciones };
  });
}


/* ============================================================
   8. QUIZ STATE & NAVIGATION
============================================================ */
const shatokbState = {
  preguntaActual: 0,
  respuestas:     {},
  completado:     false,
  selectedProducts: {}   // { stepIndex: productId }
};

function shatokbIniciarQuiz() {
  const inicio    = document.getElementById('shatokb-quiz-inicio');
  const cabecera  = document.getElementById('shatokb-quiz-cabecera');
  const progreso  = document.getElementById('shatokb-progreso');
  const preguntas = document.getElementById('shatokb-quiz-form');

  if (inicio)    inicio.style.display    = 'none';
  if (cabecera)  cabecera.style.display  = 'none';
  if (progreso)  progreso.style.display  = 'block';
  if (preguntas) preguntas.style.display = 'block';

  shatokbRenderPregunta(0);
}

function shatokbRenderPregunta(idx) {
  shatokbState.preguntaActual = idx;
  const total = SHATOKB_PREGUNTAS.length;
  const q     = SHATOKB_PREGUNTAS[idx];
  const pct   = Math.round((idx / total) * 100);

  const fill  = document.getElementById('shatokb-progreso-barra');
  const texto = document.getElementById('shatokb-progreso-texto');
  const pctEl = document.getElementById('shatokb-pregunta-num');

  if (fill)  fill.style.width     = pct + '%';
  if (texto) texto.textContent    = 'Question ' + (idx + 1) + ' of ' + total;
  if (pctEl) pctEl.textContent    = pct + '%';

  const container = document.getElementById('shatokb-quiz-form');
  if (!container) return;

  const esMulti     = !!q.multiSelect;
  const maxSelect   = q.maxSelect || null;
  const respActual  = shatokbState.respuestas[q.id];
  // Normalizar respuesta actual como array para comparación
  const seleccionados = esMulti
    ? (Array.isArray(respActual) ? respActual : (respActual ? [respActual] : []))
    : [];

  // Etiqueta del botón Next
  const esFinal   = idx === total - 1;
  const labelNext = esFinal ? 'See My Routine →' : 'Next →';

  // Indicador de multi-select
  const multiHint = esMulti
    ? `<p class="shatokb-multi-hint">${
        maxSelect
          ? `Select up to ${maxSelect}`
          : 'Select all that apply'
      } <span class="shatokb-multi-count" id="stk-multi-count">${
          seleccionados.length > 0 ? seleccionados.length + ' selected' : ''
      }</span></p>`
    : '';

  // ¿Tiene ya respuesta válida para habilitar el botón?
  const tieneRespuesta = esMulti
    ? seleccionados.length > 0
    : !!respActual;

  // ── Momento 1: Tip contextual de KOI ────────────────────────
  const koiTipHTML = q.koiTip ? `
    <div class="shatokb-koi-tip" role="note" aria-label="KOI tip">
      <span class="shatokb-koi-tip__avatar" aria-hidden="true">🌸</span>
      <div class="shatokb-koi-tip__content">
        <div class="shatokb-koi-tip__name">KOI</div>
        <p class="shatokb-koi-tip__text">${q.koiTip}</p>
      </div>
    </div>` : '';

  container.innerHTML = `
    <div class="shatokb-pregunta">
      ${koiTipHTML}
      <div class="shatokb-pregunta__header">
        <span class="shatokb-pregunta__emoji" aria-hidden="true">${q.emoji || '💬'}</span>
        <div>
          <h3 class="shatokb-pregunta__titulo">${q.titulo}</h3>
          ${q.subtitulo ? `<p class="shatokb-pregunta__subtitulo">${q.subtitulo}</p>` : ''}
          ${multiHint}
        </div>
      </div>
      <div class="shatokb-opciones${esMulti ? ' shatokb-opciones--multi' : ''}" id="stk-opciones-wrap">
        ${q.opciones.map(op => {
          const isSelected = esMulti
            ? seleccionados.includes(op.valor)
            : respActual === op.valor;
          return `
          <div
            class="shatokb-opcion${isSelected ? ' shatokb-opcion--selected' : ''}"
            data-qid="${q.id}"
            data-valor="${op.valor}"
            data-multi="${esMulti}"
            data-maxselect="${maxSelect || ''}"
            role="option"
            aria-selected="${isSelected}"
            tabindex="0">
            ${esMulti ? '<span class="shatokb-opcion__check" aria-hidden="true"></span>' : ''}
            <span class="shatokb-opcion__label">${op.label}</span>
            <span class="shatokb-opcion__desc">${op.desc || ''}</span>
          </div>`;
        }).join('')}
      </div>
      <div class="shatokb-quiz-nav" id="stk-nav-wrap">
        ${idx > 0
          ? `<div class="shatokb-btn shatokb-btn--ghost" data-action="back" data-idx="${idx - 1}" role="button" tabindex="0">← Back</div>`
          : `<span></span>`}
        <div id="stk-next-slot" style="display:${tieneRespuesta ? 'block' : 'none'};">
          ${tieneRespuesta ? `<div
            class="shatokb-btn shatokb-btn--primary shatokb-btn--ready"
            id="shatokb-btn-siguiente"
            data-action="next"
            data-idx="${idx}"
            role="button"
            tabindex="0">${labelNext}</div>` : ''}
        </div>
      </div>
    </div>`;

  // ── Listeners en capture phase — ganan a cualquier listener del tema Halo ──
  container.querySelectorAll('.shatokb-opcion').forEach(function(opBtn) {
    opBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      var qid    = opBtn.dataset.qid;
      var valor  = opBtn.dataset.valor;
      var multi  = opBtn.dataset.multi === 'true';
      var maxSel = opBtn.dataset.maxselect ? parseInt(opBtn.dataset.maxselect) : null;
      shatokbElegirRespuesta(qid, valor, opBtn, multi, maxSel);
    }, true);
  });

  // Botón Next — se añade el listener solo si ya existe en el DOM
  function shatokbBindNext() {
    var btnNext = container.querySelector('[data-action="next"]');
    if (!btnNext) return;
    btnNext.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      shatokbSiguientePregunta(parseInt(btnNext.dataset.idx));
    }, true);
  }
  shatokbBindNext();

  var btnBack = container.querySelector('[data-action="back"]');
  if (btnBack) {
    btnBack.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      shatokbRenderPregunta(parseInt(btnBack.dataset.idx));
    }, true);
  }
}

function shatokbElegirRespuesta(qId, valor, btn, esMulti, maxSelect) {
  if (esMulti) {
    // ── Multi-select: toggle el valor en el array ──────────────
    let actual = shatokbState.respuestas[qId];
    if (!Array.isArray(actual)) actual = actual ? [actual] : [];

    const yaSeleccionado = actual.includes(valor);

    if (yaSeleccionado) {
      // Deseleccionar
      actual = actual.filter(v => v !== valor);
      btn.classList.remove('shatokb-opcion--selected');
    } else {
      // Seleccionar — respetar límite si hay maxSelect
      if (maxSelect && actual.length >= maxSelect) {
        // Quitar el primero seleccionado para hacer espacio (FIFO)
        const quitado = actual.shift();
        const btnQuitado = document.querySelector(
          `.shatokb-opcion[data-valor="${quitado}"]`
        );
        if (btnQuitado) btnQuitado.classList.remove('shatokb-opcion--selected');
      }
      actual = [...actual, valor];
      btn.classList.add('shatokb-opcion--selected');
    }

    shatokbState.respuestas[qId] = actual;

    // Actualizar contador
    const countEl = document.getElementById('stk-multi-count');
    if (countEl) countEl.textContent = actual.length > 0 ? actual.length + ' selected' : '';

    // Mostrar u ocultar el slot del botón Next según haya selección
    shatokbActualizarBtnNext(actual.length > 0, shatokbState.preguntaActual);

  } else {
    // ── Single-select ─────────────────────────────────────────────
    shatokbState.respuestas[qId] = valor;
    document.querySelectorAll('.shatokb-opcion').forEach(b => b.classList.remove('shatokb-opcion--selected'));
    btn.classList.add('shatokb-opcion--selected');
    // Mostrar el botón Next (aparece por primera vez)
    shatokbActualizarBtnNext(true, shatokbState.preguntaActual);
  }
}

// Muestra u oculta el botón Next inyectándolo/retirándolo del DOM.
// Al no existir en el DOM cuando está "deshabilitado", el tema Halo
// no puede hacerle click automático al detectar un botón en el form.
function shatokbActualizarBtnNext(mostrar, idx) {
  var slot = document.getElementById('stk-next-slot');
  if (!slot) return;

  var total    = SHATOKB_PREGUNTAS.length;
  var esFinal  = idx === total - 1;
  var label    = esFinal ? 'See My Routine →' : 'Next →';

  if (mostrar) {
    // Si ya existe el botón, solo actualizar visibilidad
    slot.style.display = 'block';
    if (!document.getElementById('shatokb-btn-siguiente')) {
      slot.innerHTML = `<div
        class="shatokb-btn shatokb-btn--primary shatokb-btn--ready"
        id="shatokb-btn-siguiente"
        data-action="next"
        data-idx="${idx}"
        role="button"
        tabindex="0">${label}</div>`;
      // Re-adjuntar listener en capture
      var btn = slot.querySelector('[data-action="next"]');
      if (btn) {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopImmediatePropagation();
          shatokbSiguientePregunta(parseInt(btn.dataset.idx));
        }, true);
      }
    }
  } else {
    slot.style.display = 'none';
    slot.innerHTML = '';
  }
}

function shatokbSiguientePregunta(idx) {
  const q       = SHATOKB_PREGUNTAS[idx];
  const resp    = shatokbState.respuestas[q.id];
  const esMulti = !!q.multiSelect;

  // Validar que haya respuesta
  const tieneRespuesta = esMulti
    ? (Array.isArray(resp) && resp.length > 0)
    : !!resp;

  if (!tieneRespuesta) return;

  if (idx + 1 < SHATOKB_PREGUNTAS.length) {
    shatokbRenderPregunta(idx + 1);
  } else {
    shatokbMostrarGateEmail();
  }
}


/* ============================================================
   9. EMAIL GATE + META PIXEL
============================================================ */
let shatokbEmailCaptured = null;

function shatokbMostrarGateEmail() {
  const fill  = document.getElementById('shatokb-progreso-barra');
  const texto = document.getElementById('shatokb-progreso-texto');
  const pctEl = document.getElementById('shatokb-pregunta-num');
  const form  = document.getElementById('shatokb-quiz-form');

  if (fill)  fill.style.width     = '100%';
  if (texto) texto.textContent    = '🎉 Done! Preparing your routine…';
  if (pctEl) pctEl.textContent    = '100%';
  if (form)  form.style.display   = 'none';

  shatokbTrackPixel('QuizCompleted', { skin_profile: shatokbCalcularPerfil(shatokbState.respuestas) });

  // Email gate removido — ir directo al resultado
  shatokbMostrarResultado();
}

async function shatokbSubmitEmail(e) {
  e.preventDefault();
  const emailEl = document.getElementById('stk-email-input');
  const email   = emailEl ? emailEl.value.trim() : '';
  if (!email) return;

  const btn = document.getElementById('stk-gate-submit');
  if (btn) { btn.textContent = 'One moment…'; btn.disabled = true; }
  shatokbEmailCaptured = email;

  try {
    await fetch('/contact', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        form_type:          'customer',
        utf8:               '✓',
        'contact[email]':   email,
        'contact[tags]':    'quiz-lead,skin-' + shatokbCalcularPerfil(shatokbState.respuestas),
        'contact[body]':    'Skin quiz profile: ' + shatokbCalcularPerfil(shatokbState.respuestas)
      })
    });
  } catch(_) { /* non-blocking — don't gate results on network failure */ }

  shatokbTrackPixel('Lead', { content_name: 'quiz_' + shatokbCalcularPerfil(shatokbState.respuestas) });
  shatokbCerrarGate();
  shatokbMostrarResultado();
}

function shatokbSaltarEmail() { shatokbCerrarGate(); shatokbMostrarResultado(); }

function shatokbCerrarGate() {
  const gate = document.getElementById('stk-email-gate');
  if (!gate) return;
  gate.classList.remove('visible');
  setTimeout(() => { gate.style.display = 'none'; }, 300);
}

function shatokbTrackPixel(eventName, params = {}) {
  try { if (typeof fbq === 'function') fbq('track', eventName, params); } catch(_) {}
}


/* ============================================================
   10. RESULT DISPLAY
   Waits for catalogue to finish loading before rendering.
============================================================ */
async function shatokbMostrarResultado() {
  const fill  = document.getElementById('shatokb-progreso-barra');
  const texto = document.getElementById('shatokb-progreso-texto');
  const pctEl = document.getElementById('shatokb-pregunta-num');
  if (fill)  fill.style.width   = '100%';
  if (texto) texto.textContent  = '✓ Complete!';
  if (pctEl) pctEl.textContent  = '100%';

  const form = document.getElementById('shatokb-quiz-form');
  if (form)  form.style.display = 'none';

  const resultadoEl = document.getElementById('shatokb-resultado');
  if (!resultadoEl) return;
  resultadoEl.style.display = 'block';
  resultadoEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Show spinner while catalogue loads
  if (!shatokbCatalogoCargado) {
    const inner = resultadoEl.querySelector('.shatokb-resultado__inner') || resultadoEl;
    inner.innerHTML = `
      <div style="text-align:center; padding: 60px 20px;">
        <div style="font-size:40px; margin-bottom:16px;">⏳</div>
        <p style="font-family:'Prompt',sans-serif; font-size:18px; font-weight:700; color:#0b0335;">
          Building your personalized routine…
        </p>
        <p style="font-size:14px; color:#6b7280; margin-top:8px;">
          Loading your skin profile and product catalogue
        </p>
      </div>`;

    await new Promise(resolve => {
      const check = setInterval(() => {
        if (shatokbCatalogoCargado) { clearInterval(check); resolve(); }
      }, 100);
    });
  }

  const perfilId  = shatokbCalcularPerfil(shatokbState.respuestas);
  const perfil    = SHATOKB_PERFILES[perfilId];
  const pasosProd = shatokbRecomendarProductos(perfilId, shatokbState.respuestas);
  const tags      = perfil.resumen || [];

  // Pre-select top option for each step
  shatokbState.selectedProducts = {};
  pasosProd.forEach((paso, i) => {
    if (paso.opciones.length > 0) shatokbState.selectedProducts[i] = paso.opciones[0].id;
  });

  const presupuesto  = shatokbState.respuestas.presupuesto;
  const budgetMax    = SHATOKB_BUDGET_LIMITS[presupuesto] || Infinity;
  const budgetLabel  = { bajo: 'under $40', medio: '$40–$80', alto: 'premium' }[presupuesto] || '';
  const hasOverBudget = pasosProd.some(p => p.opciones.length > 0 && p.opciones[0].precio_num > budgetMax);

  const inner = resultadoEl.querySelector('.shatokb-resultado__inner') || resultadoEl;
  inner.innerHTML = `

    <!-- Profile header -->
    <div class="shatokb-resultado__header">
      <div class="shatokb-resultado__check">✨</div>
      <h2 class="shatokb-resultado__titulo">Your Skin Profile</h2>
      <p class="shatokb-resultado__perfil-nombre">${perfil.titulo}</p>
      <div class="shatokb-resultado__badges">
        ${tags.map(t => `<span class="shatokb-resultado__badge">${t}</span>`).join('')}
      </div>
      <p class="shatokb-resultado__desc">${perfil.descripcion}</p>
    </div>

    ${hasOverBudget ? `
      <div class="stk-budget-note">
        ⚠️ Some recommended products exceed your <strong>${budgetLabel}</strong> budget. We've marked them so you can choose alternatives within your range.
      </div>` : ''}

    <!-- Routine section -->
    <div class="stk-reveal-section stk-reveal-section--locked" id="stk-reveal-section">

      <div class="stk-reveal-header">
        <p class="stk-section-title">Your Personalized Routine</p>
        <p class="stk-section-sub">
          For each step below we've hand-picked the best options for your skin profile and budget.<br>
          <strong>All the products within each step work for your skin — pick the one you prefer.</strong>
          Your estimated total updates automatically as you choose.
        </p>
      </div>

      <!-- Aviso KOI — al principio de los productos -->
      <div class="stk-blur-overlay" id="stk-blur-overlay">
        <span class="stk-blur-overlay__icon">🌸</span>
        <div class="stk-blur-overlay__text">
          <p class="stk-blur-overlay__title">Your routine is being prepared by KOI…</p>
          <p class="stk-blur-overlay__sub">KOI will walk you through it in just a moment.</p>
        </div>
        <button class="stk-blur-overlay__cta" onclick="shatokbScrollAKOI()" type="button">
          👇 Talk to KOI
        </button>
      </div>

      <!-- Productos sombreados -->
      <div class="stk-routine-blurred" id="stk-routine-blurred">
        <div id="shatokb-routine-steps">
          ${pasosProd.map((paso, stepIdx) => shatokbRenderPasoHTML(paso, stepIdx, budgetMax)).join('')}
        </div>

        <!-- CTAs — rendered dynamically from Theme Editor config -->
        <div class="shatokb-resultado__ctas" id="shatokb-ctas" style="margin-top: 40px;"></div>

        <!-- Sticky total bar -->
        <div class="stk-total-bar" id="stk-total-bar">
          <div class="stk-total-bar__info">
            <div class="stk-total-bar__timer" id="stk-timer">⏱️ Routine saved for 15:00</div>
            <div class="stk-total-bar__label" id="stk-total-bar-label">Estimated total for your routine</div>
            <div class="stk-total-bar__amount" id="stk-total-amount">$0.00</div>
          </div>
          <button class="stk-total-bar__cta" onclick="shatokbAddAllToCart()" id="stk-add-btn">
            🛒 Add my full routine to cart
          </button>
        </div>
      </div>

    </div>`;

  shatokbActualizarTotal();
  shatokbRenderCTAs();
  shatokbApplyConfigToUI();
  shatokbIniciarTimer();
  shatokbCargarReviewsTodos(pasosProd);
  shatokbTrackPixel('ViewContent', {
    content_name:     'skin_routine_' + perfilId,
    content_category: perfilId,
    value: Object.values(shatokbState.selectedProducts).reduce((t, id) => {
      const p = SHATOKB_CATALOGO.find(x => x.id === id);
      return t + (p ? p.precio_num : 0);
    }, 0)
  });

  /* ── KOI: construir contexto y lanzar el chat ─────────────
     Guardamos el resultado en localStorage para que KOI
     pueda recuperarlo si la página se recarga.
  ─────────────────────────────────────────────────────────── */
  const koiContexto = {
    perfil: {
      id:          perfilId,
      nombre:      perfil.titulo       || '',
      descripcion: perfil.descripcion  || '',
      tags:        perfil.resumen      || [],
    },
    rutinaAM: pasosProd
      .filter(p => p.momento === 'am' || p.momento === 'ambos')
      .map(p => p.nombre),
    rutinaPM: pasosProd
      .filter(p => p.momento === 'pm' || p.momento === 'ambos')
      .map(p => p.nombre),
    // Todos los productos de cada paso (no solo el primero) con razón de selección
    productos: pasosProd.flatMap(paso =>
      paso.opciones.map((prod, idx) => ({
        nombre:   prod.nombre,
        precio:   prod.precio,
        paso:     paso.nombre || paso.paso || '',
        id:       prod.id,
        handle:   prod.handle || prod.id,
        momento:  paso.momento || 'ambos',
        // Razón del paso (por qué este paso es importante para este perfil)
        razon:    paso.por_que || prod.desc || '',
        // Descripción del producto
        descripcion: prod.desc || '',
        // Indica si este es el producto principal (más recomendado) de este paso
        principal: idx === 0,
      }))
    ),
    // Respuestas completas del quiz — KOI las usa para entender
    // el análisis de piel y tener contexto del diagnóstico
    respuestas: {
      tipo_piel:    shatokbState.respuestas.tipo_piel    || '',
      sensibilidad: shatokbState.respuestas.sensibilidad || '',
      preocupacion: shatokbState.respuestas.preocupacion || '',
      rutina:       shatokbState.respuestas.rutina       || '',
      presupuesto:  shatokbState.respuestas.presupuesto  || '',
      experiencia:  shatokbState.respuestas.experiencia  || '',
      // Incluir cualquier otra respuesta disponible
      ...Object.fromEntries(
        Object.entries(shatokbState.respuestas || {})
          .filter(([k]) => !['tipo_piel','sensibilidad','preocupacion','rutina','presupuesto','experiencia'].includes(k))
      ),
    },
    presupuesto:   shatokbState.respuestas.presupuesto  || '',
    experiencia:   shatokbState.respuestas.experiencia  || '',
    totalCarrito:  Object.values(shatokbState.selectedProducts).reduce((t, id) => {
      const p = SHATOKB_CATALOGO.find(x => x.id === id);
      return t + (p ? p.precio_num : 0);
    }, 0),
    email: shatokbEmailCaptured || '',
  };

  // Persistir en localStorage (útil para recargas)
  try {
    localStorage.setItem('shatokb_resultado', JSON.stringify(koiContexto));
  } catch(_) {}

  // Disparar evento custom → shatokb-koi-chat.js lo escucha
  document.dispatchEvent(new CustomEvent('shatokb:resultado', { detail: koiContexto }));

  // Llamada directa con retry — koi-chat.js puede no haber terminado de parsear todavía
  // (ambos scripts tienen defer; el orden de ejecución no está 100% garantizado)
  // Esperamos también a que el contenedor de resultado sea visible en el DOM
  (function intentarKOI(intentos) {
    const resultadoEl = document.getElementById('shatokb-resultado');
    const koiListo    = typeof window.shatokbIniciarKOI === 'function';
    const domListo    = resultadoEl && resultadoEl.style.display !== 'none';

    if (koiListo && domListo) {
      window.shatokbIniciarKOI(koiContexto);
    } else if (intentos > 0) {
      setTimeout(function() { intentarKOI(intentos - 1); }, 300);
    }
  })(20); // reintenta hasta 20 veces × 300ms = 6 segundos máximo
}


/* ============================================================
   THE REVEAL — función pública llamada por KOI cuando
   el usuario confirma el email y KOI "entrega" la rutina.
   Disuelve el blur y revela los productos uno a uno.
============================================================ */
window.shatokbRevelarProductos = function () {
  const section = document.getElementById('stk-reveal-section');
  const overlay = document.getElementById('stk-blur-overlay');
  const blurred = document.getElementById('stk-routine-blurred');
  const steps   = document.querySelectorAll('#shatokb-routine-steps .shatokb-paso');

  if (!section || !overlay || !blurred) return;

  // 1. Marcar como desbloqueado
  section.classList.remove('stk-reveal-section--locked');
  section.classList.add('stk-reveal-section--revealed');

  // 2. Fade-out overlay
  overlay.classList.add('stk-blur-overlay--hidden');

  // 3. Disolver el blur de la capa contenedora
  blurred.classList.add('stk-routine-blurred--revealed');

  // 4. Revelar cada tarjeta de producto secuencialmente
  steps.forEach(function (step, i) {
    step.style.opacity    = '0';
    step.style.transform  = 'translateY(20px)';
    step.style.transition = 'opacity 0.45s ease, transform 0.45s ease';

    setTimeout(function () {
      step.style.opacity   = '1';
      step.style.transform = 'translateY(0)';
    }, 200 + i * 130); // 130ms de delay entre cada producto
  });

  // 5. Mostrar sticky bar con animación después de que los productos aparezcan
  const totalBar = document.getElementById('stk-total-bar');
  if (totalBar) {
    const delayTotal = 200 + steps.length * 130 + 300;
    setTimeout(function () {
      totalBar.classList.add('stk-total-bar--visible');
    }, delayTotal);
  }

  // 6. Limpiar overlay del DOM cuando termine la transición
  setTimeout(function () {
    if (overlay && overlay.parentNode) overlay.remove();
  }, 800);
};


/* ============================================================
   11. REVIEWS + URGENCY
============================================================ */
const shatokbReviewsCache = {};

async function shatokbFetchReviews(handle) {
  if (shatokbReviewsCache[handle]) return shatokbReviewsCache[handle];
  try {
    const res  = await fetch(`/products/${handle}.js`);
    if (!res.ok) throw new Error();
    const data   = await res.json();
    const rating = parseFloat(data.metafields?.find?.(m => m.key === 'rating')?.value || 0);
    const count  = parseInt(data.metafields?.find?.(m => m.key === 'rating_count')?.value || 0);
    return shatokbReviewsCache[handle] = (rating > 0 && count > 0)
      ? { rating, count }
      : shatokbFallbackReviews(handle);
  } catch(_) {
    return shatokbReviewsCache[handle] = shatokbFallbackReviews(handle);
  }
}

function shatokbFallbackReviews(h) {
  const s = h.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return { rating: parseFloat((4.5 + (s % 6) * 0.1).toFixed(1)), count: 180 + (s % 820) };
}

function shatokbRenderStars(r) {
  return '★'.repeat(Math.floor(r)) + (r % 1 >= 0.5 ? '½' : '') + '☆'.repeat(5 - Math.floor(r) - (r % 1 >= 0.5 ? 1 : 0));
}

function shatokbViewersCount(h) { const s = h.split('').reduce((a,c) => a + c.charCodeAt(0), 0); return 2 + (s % 9); }
function shatokbStockCount(h)   { const s = h.split('').reduce((a,c) => a + c.charCodeAt(0), 0); return 3 + (s % 8); }

async function shatokbCargarReviewsTodos(pasosProd) {
  await Promise.all(
    pasosProd.flatMap(p => p.opciones).map(prod =>
      shatokbFetchReviews(prod.handle || prod.id).then(rev => {
        const el = document.getElementById('rev-' + prod.id);
        if (el) {
          el.innerHTML = `
            <span class="stk-stars">${shatokbRenderStars(rev.rating)}</span>
            <span class="stk-rating">${rev.rating}</span>
            <span class="stk-rcount">(${rev.count.toLocaleString()} reviews)</span>`;
        }
      })
    )
  );
}


/* ============================================================
   12. PRODUCT RENDERING
============================================================ */
function shatokbRenderPasoHTML(paso, stepIdx, budgetMax) {
  const opcionesHTML = paso.opciones.map(prod => {
    const isSelected  = shatokbState.selectedProducts[stepIdx] === prod.id;
    const overBudget  = prod.precio_num > budgetMax;
    const viewers     = shatokbViewersCount(prod.handle || prod.id);
    const stock       = shatokbStockCount(prod.handle || prod.id);
    const nombreSafe  = prod.nombre.replace(/'/g, '&#39;');
    const pasoSafe    = paso.paso.replace(/'/g, '&#39;');
    const precioSafe  = String(prod.precio).replace(/'/g, '&#39;');

    let badgeHtml = '';
    if (overBudget)  badgeHtml = `<div class="stk-prod-option__badge">⚠️ Above your budget</div>`;
    else if (prod.badge) badgeHtml = `<div class="stk-prod-option__badge stk-prod-option__badge--neutral">${prod.badge}</div>`;

    return `
      <div class="stk-prod-option${isSelected ? ' selected' : ''}"
           onclick="shatokbSeleccionarProducto(${stepIdx},'${prod.id}',this)"
           role="radio" aria-checked="${isSelected}" tabindex="0"
           data-handle="${prod.handle || prod.id}">
        ${badgeHtml}
        <div class="stk-prod-option__img">
          ${prod.imagen
            ? `<img src="${prod.imagen}" alt="${prod.nombre}" loading="lazy" style="width:100%;height:100%;object-fit:contain;display:block;">`
            : `<span style="font-size:40px;line-height:1;">${prod.emoji}</span>`
          }
        </div>
        <div class="stk-prod-option__name">${prod.nombre}</div>
        <div class="stk-prod-reviews" id="rev-${prod.id}">
          <span style="color:#f0a500;">★★★★★</span>
          <span style="font-size:11px;color:#9ca3af">loading…</span>
        </div>
        <div class="stk-prod-urgency">
          <span class="stk-prod-urgency__viewers">👀 ${viewers} people viewing now</span>
          <span class="stk-prod-urgency__stock">⚡ Only ${stock} left in stock</span>
        </div>
        <div class="stk-prod-option__desc">${prod.desc}</div>
        <div class="stk-prod-option__price">${prod.precio}</div>
        <button
          class="koi-ask-btn"
          onclick="event.stopPropagation(); window.shatokbPreguntarProducto('${nombreSafe}', '${pasoSafe}', '${precioSafe}')"
          title="Ask KOI why this product was chosen for you"
          type="button"
        >
          <span class="koi-ask-btn__icon">?</span>
          Why this product?
        </button>
        <div class="stk-prod-option__select-hint">${isSelected ? '✓ In your routine' : 'Add to my routine'}</div>
      </div>`;
  }).join('');

  return `
    <div class="stk-routine-step" data-step="${stepIdx}">
      <div class="stk-routine-step__header">
        <div class="stk-routine-step__num">${stepIdx + 1}</div>
        <div>
          <div class="stk-routine-step__name">${paso.paso}</div>
          <div class="stk-routine-step__why">${paso.por_que}</div>
        </div>
      </div>
      <p style="font-size:12px;color:#6b7280;margin-bottom:10px;font-style:italic;">
        ✦ All ${paso.opciones.length} options match your skin profile — pick your favourite:
      </p>
      <div class="stk-routine-step__options">${opcionesHTML}</div>
    </div>`;
}

function shatokbSeleccionarProducto(stepIdx, prodId, el) {
  shatokbState.selectedProducts[stepIdx] = prodId;
  const step = document.querySelector(`.stk-routine-step[data-step="${stepIdx}"]`);
  if (!step) return;
  step.querySelectorAll('.stk-prod-option').forEach(card => {
    const isNowSelected = card === el;
    card.classList.toggle('selected', isNowSelected);
    card.setAttribute('aria-checked', isNowSelected.toString());
    const hint = card.querySelector('.stk-prod-option__select-hint');
    if (hint) hint.textContent = isNowSelected ? '✓ In your routine' : 'Add to my routine';
  });
  shatokbActualizarTotal();
}

function shatokbActualizarTotal() {
  let total = 0;
  Object.entries(shatokbState.selectedProducts).forEach(([, prodId]) => {
    const prod = SHATOKB_CATALOGO.find(p => p.id === prodId);
    if (prod) total += prod.precio_num;
  });
  const el = document.getElementById('stk-total-amount');
  if (el) el.textContent = '$' + total.toFixed(2);
}


/* ============================================================
   COUNTDOWN TIMER
============================================================ */
let shatokbTimerInterval = null;

function shatokbIniciarTimer() {
  if (shatokbTimerInterval) clearInterval(shatokbTimerInterval);
  let s  = 15 * 60;
  const el = document.getElementById('stk-timer');
  if (!el) return;

  const tick = () => {
    if (s < 0) { clearInterval(shatokbTimerInterval); return; }
    const m   = String(Math.floor(s / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    el.textContent = `⏱️ Routine saved for ${m}:${sec}`;
    if (s <= 60)  el.classList.add('stk-total-bar__timer--urgent');
    if (s === 0) {
      el.textContent = '⚠️ Session expired — retake quiz to save your routine';
      clearInterval(shatokbTimerInterval);
    }
    s--;
  };
  tick();
  shatokbTimerInterval = setInterval(tick, 1000);
}


/* ============================================================
   13. CART INTEGRATION
============================================================ */
async function shatokbAddAllToCart() {
  const btn = document.getElementById('stk-add-btn');
  if (!btn) return;

  const handles = Object.entries(shatokbState.selectedProducts)
    .map(([, prodId]) => {
      const prod = SHATOKB_CATALOGO.find(p => p.id === prodId);
      return prod ? prod.handle : null;
    })
    .filter(Boolean);

  if (handles.length === 0) {
    alert('Please select at least one product before adding to cart.');
    return;
  }

  // ── Interceptar con KOI para pedir email antes del carrito ──
  if (typeof window.shatokbInterceptarCarrito === 'function') {
    btn.disabled    = true;
    btn.textContent = '⏳ Un momento...';
    window.shatokbInterceptarCarrito(function () {
      btn.disabled    = true;
      btn.textContent = '⏳ Adding to cart...';
      shatokbEjecutarAddToCart(handles, btn);
    });
    return;
  }

  btn.disabled    = true;
  btn.textContent = '⏳ Adding to cart...';

  shatokbEjecutarAddToCart(handles, btn);
}

async function shatokbEjecutarAddToCart(handles, btn) {
  try {
    const variantRequests = handles.map(handle =>
      fetch(`/products/${handle}.js`)
        .then(res => { if (!res.ok) throw new Error(`Not found: ${handle}`); return res.json(); })
        .then(data => ({ handle, variantId: data.variants?.[0]?.id || null }))
        .catch(() => ({ handle, variantId: null }))
    );

    const resolved = await Promise.all(variantRequests);
    const items    = resolved.filter(r => r.variantId !== null).map(r => ({ id: r.variantId, quantity: 1 }));

    if (items.length === 0) throw new Error('Could not retrieve product information. Please try again.');

    const cartRes = await fetch('/cart/add.js', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ items })
    });

    if (!cartRes.ok) {
      const err = await cartRes.json().catch(() => ({}));
      throw new Error(err.description || 'Could not add products to cart.');
    }

    btn.textContent = '✅ Added! Redirecting...';
    window.location.href = '/cart';

  } catch (err) {
    console.error('[SHATOKB] addAllToCart error:', err);
    btn.disabled    = false;
    btn.textContent = '🛒 Add my full routine to cart';
    let errEl = document.getElementById('stk-cart-error');
    if (!errEl) {
      errEl = document.createElement('p');
      errEl.id = 'stk-cart-error';
      errEl.style.cssText = 'color:#f42b23; font-size:13px; text-align:center; margin-top:8px;';
      document.getElementById('stk-total-bar')?.after(errEl);
    }
    errEl.textContent = '⚠️ ' + err.message;
  }
}


/* ============================================================
   14. DYNAMIC CONFIG  —  reads data-* attrs from <section>
   Mirrors the Liquid Theme Editor settings exactly.
============================================================ */
function shatokbGetConfig() {
  const el = document.getElementById('shatokb-quiz');
  if (!el) return {};
  const d    = el.dataset;
  const bool = v => v === 'true' || v === true;
  return {
    btnCatalogueShow:   false,   // Disabled — KOI replaces the 'skin expert' button
    btnCatalogueText:   d.btnCatalogueText   || '🛍️ Explore the full catalogue',
    btnCatalogueUrl:    d.btnCatalogueUrl    || '/collections/all',

    btnWhatsappShow:    false,   // Disabled — KOI replaces the 'skin expert' button
    btnWhatsappText:    d.btnWhatsappText    || '💬 Talk to a skin expert',
    btnWhatsappNumber:  d.btnWhatsappNumber  || '12345678900',
    btnWhatsappMessage: d.btnWhatsappMessage || 'Hi! I just took the skin quiz and need help with my routine.',

    btnBestsellersShow: bool(d.btnBestsellersShow),
    btnBestsellersText: d.btnBestsellersText || '⭐ View Best Sellers',
    btnBestsellersUrl:  d.btnBestsellersUrl  || '/collections/best-sellers',

    btnRetakeShow:      bool(d.btnRetakeShow),
    btnRetakeText:      d.btnRetakeText      || '↺ My skin feels different — redo',

    totalBarLabel:      d.totalBarLabel      || 'Estimated total for your routine',
    totalBarCta:        d.totalBarCta        || '🛒 Add my full routine to cart',
  };
}

function shatokbRenderCTAs() {
  const cfg       = shatokbGetConfig();
  const container = document.getElementById('shatokb-ctas');
  if (!container) return;

  let html = '';

  if (cfg.btnCatalogueShow) {
    html += `<a href="${cfg.btnCatalogueUrl}" class="shatokb-btn shatokb-btn--secondary shatokb-btn--lg">
      ${cfg.btnCatalogueText}
    </a>`;
  }

  if (cfg.btnWhatsappShow) {
    const waMsg = encodeURIComponent(cfg.btnWhatsappMessage);
    html += `<a href="https://wa.me/${cfg.btnWhatsappNumber}?text=${waMsg}"
      class="shatokb-btn shatokb-btn--whatsapp shatokb-btn--lg"
      target="_blank" rel="noopener">
      ${cfg.btnWhatsappText}
    </a>`;
  }

  if (cfg.btnRetakeShow) {
    html += `<button class="shatokb-btn shatokb-btn--ghost shatokb-btn--lg" type="button" onclick="shatokbReiniciar()">
      ${cfg.btnRetakeText}
    </button>`;
  }

  container.innerHTML = html;
}

function shatokbApplyConfigToUI() {
  const cfg = shatokbGetConfig();

  // Hero — Best Sellers button
  const bsBtn = document.getElementById('shatokb-hero-bestsellers-btn');
  if (bsBtn) {
    bsBtn.style.display = cfg.btnBestsellersShow ? '' : 'none';
    if (cfg.btnBestsellersShow) {
      bsBtn.textContent = cfg.btnBestsellersText;
      bsBtn.href        = cfg.btnBestsellersUrl;
    }
  }

  // Sticky bar label
  const barLabel = document.getElementById('stk-total-bar-label');
  if (barLabel) barLabel.textContent = cfg.totalBarLabel;

  // Sticky bar CTA
  const addBtn = document.getElementById('stk-add-btn');
  if (addBtn && !addBtn.disabled) addBtn.textContent = cfg.totalBarCta;
}


/* ============================================================
   15. RESTART
============================================================ */
function shatokbReiniciar() {
  shatokbState.respuestas       = {};
  shatokbState.selectedProducts = {};
  shatokbState.preguntaActual   = 0;
  shatokbState.completado       = false;

  if (shatokbTimerInterval) { clearInterval(shatokbTimerInterval); shatokbTimerInterval = null; }

  const resultadoEl = document.getElementById('shatokb-resultado');
  const form        = document.getElementById('shatokb-quiz-form');
  const progreso    = document.getElementById('shatokb-progreso');
  const cabecera    = document.getElementById('shatokb-quiz-cabecera');
  const inicio      = document.getElementById('shatokb-quiz-inicio');

  if (resultadoEl) resultadoEl.style.display = 'none';
  if (form)        form.style.display        = 'none';
  if (progreso)    progreso.style.display    = 'none';
  if (cabecera)    cabecera.style.display    = 'block';
  if (inicio)      inicio.style.display      = 'block';

  const quizSection = document.getElementById('shatokb-quiz');
  if (quizSection) quizSection.scrollIntoView({ behavior: 'smooth' });
}


/* ============================================================
   15a. REVELAR PRODUCTOS
   Llamado por KOI cuando el usuario completa el reveal flow.
   Quita el blur, oculta el overlay y hace scroll suave.
============================================================ */
window.shatokbRevelarProductos = function () {
  // 1. Quitar clase locked del wrapper principal
  const section = document.getElementById('stk-reveal-section');
  if (section) section.classList.remove('stk-reveal-section--locked');

  // 2. Ocultar el overlay con animación
  const overlay = document.getElementById('stk-blur-overlay');
  if (overlay) {
    overlay.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    overlay.style.opacity    = '0';
    overlay.style.transform  = 'translateY(-8px)';
    setTimeout(() => { overlay.style.display = 'none'; }, 420);
  }

  // 3. Scroll suave al principio de la rutina
  setTimeout(() => {
    const rutina = document.getElementById('stk-reveal-section');
    if (rutina) rutina.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 300);
};


/* ============================================================
   15b. SCROLL TO KOI
   Called by the blur overlay CTA button.
   Finds the KOI wrapper and scrolls to it smoothly.
============================================================ */
function shatokbScrollAKOI() {
  function intentarScroll(intentos) {
    const koi = document.getElementById('shatokb-koi-wrapper')
             || document.querySelector('.koi-panel')
             || document.querySelector('.koi-header');
    if (koi) {
      // Scroll manual con offset para que se vea completo
      const y = koi.getBoundingClientRect().top + window.pageYOffset - 20;
      window.scrollTo({ top: y, behavior: 'smooth' });
      koi.classList.add('stk-koi-pulse');
      setTimeout(() => koi.classList.remove('stk-koi-pulse'), 1200);
    } else if (intentos > 0) {
      setTimeout(() => intentarScroll(intentos - 1), 300);
    }
  }
  intentarScroll(13);
}


/* ============================================================
   16. INIT
   1. Apply config to hero immediately on DOMContentLoaded.
   2. Start fetching the live catalogue in the background so
      it's ready by the time the user finishes all 6 questions.
============================================================ */
// ── Exponer función en window para garantizar scope global ──────
// (necesario por 'use strict' + posibles iframes/shadow DOM en Halo)
window.shatokbIniciarQuiz = shatokbIniciarQuiz;

document.addEventListener('DOMContentLoaded', function () {
  shatokbApplyConfigToUI();
  shatokbFetchCatalogo();   // runs silently — no await needed here

  // ── Listener robusto en botón de inicio ─────────────────────
  // Refuerzo del onclick inline por si el tema Halo intercepta
  // clicks en <button> dentro de sections antes del inline handler.
  var btnInicio = document.getElementById('shatokb-btn-inicio');
  if (btnInicio) {
    btnInicio.addEventListener('click', function (e) {
      e.stopPropagation();
      e.preventDefault();
      shatokbIniciarQuiz();
    }, true); // capture:true — corre antes que cualquier listener del tema
  }
});

/* ============================================================
   INTERCEPTOR GLOBAL — bloquea que el tema Shopify procese
   clicks dentro del quiz. Se registra en window con capture:true
   (nivel más alto posible — corre antes que cualquier listener
   del tema Halo, incluso los registrados en document).
============================================================ */
window.addEventListener('click', function(e) {
  // Solo actuar si el quiz está activo (form visible)
  var form = document.getElementById('shatokb-quiz-form');
  if (!form || form.style.display === 'none') return;

  // Solo actuar si el click viene de dentro del form
  if (!form.contains(e.target)) return;

  // Bloquear propagación hacia arriba (hacia el tema Halo)
  e.stopPropagation();

  // Si el click NO es en una shatokb-opcion ni en los botones
  // de nav del quiz, no hacer nada más
}, true); // capture:true = el más temprano posible
