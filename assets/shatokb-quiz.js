/**
 * ============================================================
 * SHATOKB · Skin Diagnosis Quiz Engine  v5.0
 * File: assets/shatokb-quiz.js
 *
 * v5.0 — SHATO SKIN OS Ultra Integration (June 2026)
 *   ALL FIELDS from Shato_Skin_OS_Master_Project.xlsx:
 *     momento        — 'am' | 'pm' | 'both' (time of day)
 *     score_base     — 0-100 editorial score from Excel
 *     ingredientes   — active key ingredients array
 *     risk           — safety flags (no_pregnant, pm_only…)
 *     fit            — explicit Excel profile matches
 *     subcategoria   — specific subcategory (serum_brightening, etc.)
 *     nivel_usuario  — 'beginner' | 'intermediate' | 'advanced'
 *     posicion_am    — step position in AM routine (1-10)
 *     posicion_pm    — step position in PM routine (1-10)
 *
 *   NEW SCORING ENGINE v5.0:
 *     score_base (Excel floor) + tipo_piel + concerns + objetivos
 *     + sensibilidad + presupuesto + fit_excel + nivel_usuario
 *     + ingredient_synergy (+3 each) + risk_penalties
 *     + INGREDIENT CONFLICT DETECTION (penalty -15)
 *
 *   NEW DISPLAY:
 *     AM/PM SPLIT — two separate routine blocks in results
 *     CONFLICT WARNINGS — detect retinol+vitC in same routine
 *     SYNERGY HIGHLIGHTS — show compatible stacks
 *     HERO PRODUCT badge — Excel-designated hero per profile
 *     LAYERING GUIDE — K-Beauty thin-to-thick order
 *
 * Sections:
 *  1.  QUIZ QUESTIONS
 *  2.  TAG MAPS  (Shopify tags → internal fields)
 *  3.  LIVE CATALOGUE  (fetched from /products.json)
 *  4.  FALLBACK CATALOGUE  (local/dev only)
 *  5.  SKIN PROFILES
 *  6.  INGREDIENT INTEL (conflicts, synergies, layering)
 *  7.  SCORING ENGINE  v5.0
 *  8.  RECOMMENDATION ENGINE
 *  9.  QUIZ STATE & NAVIGATION
 * 10.  EMAIL GATE + META PIXEL
 * 11.  RESULT DISPLAY
 * 12.  REVIEWS + URGENCY
 * 13.  PRODUCT RENDERING
 * 14.  CART INTEGRATION
 * 15.  DYNAMIC CONFIG (data-attributes → Theme Editor)
 * 16.  RESTART
 * 17.  INIT
 * ============================================================
 */

'use strict';

/* ============================================================
   1. QUIZ QUESTIONS
============================================================ */
// Preguntas que permiten selección múltiple
const SHATOKB_MULTI_SELECT = ['preocupacion', 'preocupacion_secundaria'];

/* ============================================================
   QUIZ v6.0 — 8 preguntas, 10 campos de salida
   
   Nuevos campos vs v5.x:
     barrier_status       — 'healthy' | 'reactive' | 'damaged'
     ingredient_tolerance — 'none' | 'basic' | 'intermediate' | 'advanced'
     nivel_rutina         — 'basica' | 'intermedia' | 'completa' (renombrado)

   Fixes aplicados:
     - P2 y P3: "post-acne marks" solo en P2 (pigmentation), no en acne
     - P3: excluye automáticamente la selección de P2 via excludes[]
     - P5: wording sin "actives" — más claro para usuarios sin experiencia
     - P6: "glow" solo aparece si primary concern NO es pigmentation/acne
           (manejado via skipIf en el renderer)
============================================================ */
const SHATOKB_PREGUNTAS = [

  /* ── P1: SKIN TYPE ─────────────────────────────────────── */
  {
    id: 'tipo_piel',
    titulo: 'How does your skin feel 30 minutes after cleansing?',
    emoji: '🪞',
    subtitulo: 'Before any products. That raw, honest moment — that\'s your real skin type.',
    koiTip: 'Cleanse. Wait 30 min. No products. Then answer honestly — that feeling is your real skin type. 👇',
    opciones: [
      { valor: 'seca',     label: '🌵 Dry & tight',     desc: 'Feels tight, looks dull. Sometimes flaky around the nose or cheeks.' },
      { valor: 'grasa',    label: '🫧 Oily all over',   desc: 'Shiny across the whole face by midday. Pores are visible.' },
      { valor: 'mixta',    label: '☯️ Oily T-zone',     desc: 'Forehead and nose shine, but cheeks feel normal or dry.' },
      { valor: 'sensible', label: '🌸 Reactive',        desc: 'Stings, flushes, or breaks out easily. Reacts to products and weather.' },
      { valor: 'normal',   label: '✨ Balanced',        desc: 'Comfortable, not too oily or dry. Rarely reacts to products.' },
      { valor: 'nolose',   label: '🤷 Not sure',        desc: "Changes day to day. We'll figure it out from your other answers." }
    ]
  },

  /* ── P2: PRIMARY CONCERN ───────────────────────────────── */
  {
    id: 'preocupacion',
    titulo: 'What\'s the ONE thing you most want to fix?',
    emoji: '🎯',
    subtitulo: 'One answer only — this determines your hero product.',
    koiTip: 'Pick the ONE thing you want gone first. I\'ll build everything else around it. 🎯',
    opciones: [
      { valor: 'acne',           label: '🎯 Acne & breakouts',           desc: 'Active pimples, blackheads, clogged pores, oily skin.' },
      { valor: 'manchas',        label: '🌗 Dark spots & post-acne marks', desc: 'Hyperpigmentation, melasma, marks left after breakouts.' },
      { valor: 'antiaging',      label: '⏳ Fine lines & loss of firmness', desc: 'First wrinkles, skin thinning, loss of bounce.' },
      { valor: 'rojeces',        label: '🛡️ Redness & damaged barrier',   desc: 'Constant flushing, peeling, tight or irritated skin.' },
      { valor: 'deshidratacion', label: '💧 Dehydration & dullness',      desc: 'Flat skin with no glow. Feels thirsty even after moisturizer.' },
      { valor: 'textura',        label: '🔬 Texture & enlarged pores',    desc: 'Rough, uneven surface. Pores that makeup can\'t hide.' }
    ]
  },

  /* ── P3: SECONDARY CONCERN ─────────────────────────────── */
  {
    id: 'preocupacion_secundaria',
    titulo: 'Anything else bothering your skin?',
    emoji: '➕',
    subtitulo: 'Pick up to 2 — these refine your routine beyond the hero product.',
    koiTip: 'Up to 2. These fine-tune what goes around your hero product. 🔧',
    multiSelect: true,
    maxSelect: 2,
    // Dynamic: excludes whatever was selected in P2 (handled by renderer)
    excludeFrom: 'preocupacion',
    opciones: [
      { valor: 'acne',           label: '🎯 Acne & breakouts',             desc: 'Breakouts on top of your main concern.' },
      { valor: 'manchas',        label: '🌗 Dark spots & post-acne marks',  desc: 'Discoloration alongside your primary issue.' },
      { valor: 'antiaging',      label: '⏳ Fine lines & aging',            desc: 'Early signs of aging as a secondary concern.' },
      { valor: 'rojeces',        label: '🛡️ Redness & sensitivity',         desc: 'Reactive skin that needs extra calming.' },
      { valor: 'deshidratacion', label: '💧 Dehydration',                   desc: 'Skin that feels thirsty despite your routine.' },
      { valor: 'textura',        label: '🔬 Texture & pores',               desc: 'Uneven surface or visible pores on top of everything else.' },
      { valor: 'ninguna',        label: '— None',                           desc: 'My main concern is enough — keep it focused.' }
    ]
  },

  /* ── P4: BARRIER & SENSITIVITY (fusión P4+P9) ──────────── */
  {
    id: 'sensibilidad',
    titulo: 'How does your skin react to new products?',
    emoji: '⚡',
    subtitulo: 'This is your safety gate — it determines which ingredients are safe for you right now.',
    koiTip: 'Your barrier status decides which ingredients are safe for you right now. Be honest here. ⚡',
    opciones: [
      { valor: 'baja',    label: '💪 Rarely reacts',       desc: 'New products almost never cause problems. My skin is resilient.' },
      { valor: 'media',   label: '🌤️ Sometimes reacts',    desc: 'Occasional breakouts or redness with strong products. Generally okay.' },
      { valor: 'alta',    label: '⚡ Very reactive',        desc: 'Burns, breaks out, or turns red easily with new products.' },
      { valor: 'damaged', label: '🚨 Barrier is damaged',  desc: 'Currently peeling, flaking, or inflamed. Needs repair before actives.' }
    ]
  },

  /* ── P5: ACTIVE INGREDIENT EXPERIENCE ─────────────────── */
  {
    id: 'ingredient_tolerance',
    titulo: 'Have you used stronger skincare ingredients before?',
    emoji: '🧪',
    subtitulo: 'Like acids, Vitamin C, or retinol. This unlocks the right product strength for you.',
    koiTip: 'Not what you\'ve heard of — what your skin has actually used. This unlocks the right strength for you. 🧪',
    opciones: [
      { valor: 'none',         label: '🌱 New to all of this',      desc: 'Never used acids, Vitamin C, retinol or similar. Starting fresh.' },
      { valor: 'basic',        label: '🧴 Some experience',         desc: 'Used niacinamide, gentle Vitamin C, or light AHAs. Skin handled it.' },
      { valor: 'intermediate', label: '💊 Comfortable with actives', desc: 'Regularly use AHAs, BHAs, or Vitamin C without issues.' },
      { valor: 'advanced',     label: '🔬 Advanced — adapted skin',  desc: 'Retinol, strong acids, high-percentage actives. My skin is ready.' }
    ]
  },

  /* ── P6: SKIN GOAL ─────────────────────────────────────── */
  {
    id: 'objetivo',
    titulo: 'What does your ideal skin look like in 90 days?',
    emoji: '💭',
    subtitulo: 'One answer — this sets the direction of your entire routine.',
    koiTip: 'One answer. This sets the direction of everything I pick for you. 💭',
    opciones: [
      { valor: 'clear',    label: '🎯 Clear, acne-free skin',    desc: 'No breakouts. No marks. Clean, even, controlled.' },
      { valor: 'unificar', label: '🌗 Even, spot-free tone',     desc: 'Faded marks. Uniform complexion. Confident bare-faced.' },
      { valor: 'calmar',   label: '🛡️ Repaired, calm skin',     desc: 'No redness. No reactions. A strong, quiet barrier.' },
      { valor: 'antiaging',label: '⏳ Firmer, smoother skin',    desc: 'Reduced fine lines. Better elasticity. Younger-looking.' },
      { valor: 'glow',     label: '✨ That glass-skin glow',     desc: 'Dewy, luminous, lit-from-within. Healthy and radiant.' },
      { valor: 'controlar',label: '☯️ Balanced & low-maintenance', desc: 'Controlled oil. Minimized pores. No drama day to day.' }
    ]
  },

  /* ── P7: ROUTINE COMPLEXITY ────────────────────────────── */
  {
    id: 'nivel_rutina',
    titulo: 'How much time will you actually commit?',
    emoji: '⏱️',
    subtitulo: 'Be honest — a routine you stick to beats a perfect one you abandon.',
    koiTip: 'A routine you actually do beats a perfect one you skip. Be real with yourself. ⏱️',
    opciones: [
      { valor: 'basica',     label: '⚡ 2–3 min max',        desc: 'Cleanser + moisturizer + SPF. Minimal. Still effective.' },
      { valor: 'intermedia', label: '🧴 5–7 min',            desc: 'Happy to add a serum or toner. The sweet spot.' },
      { valor: 'completa',   label: '🏆 10+ min',            desc: 'Full AM + PM ritual. Every step. Maximum results.' }
    ]
  },

  /* ── P8: BUDGET ────────────────────────────────────────── */
  {
    id: 'presupuesto',
    titulo: "Last one — what's your monthly skincare budget?",
    emoji: '💳',
    subtitulo: 'Be honest. I\'ll build the best possible routine around what you can actually commit to.',
    koiTip: 'Budget doesn\'t predict results — consistency does. A $30 routine you stick to beats a $200 one you abandon. 💳',
    opciones: [
      { valor: 'bajo',  label: '💚 Under $40',   desc: 'K-Beauty was built for this. You\'ll be surprised what works.' },
      { valor: 'medio', label: '💛 $40–$80',     desc: 'The sweet spot. Targeted actives, real results.' },
      { valor: 'alto',  label: '🖤 $80+',        desc: 'Best-in-class only. Every product earns its place.' }
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
 * Pending audit log — handles of products auto-classified at runtime.
 * Populated by shatokbAutoClassify(). Access from browser console:
 *   copy(window.SHATOKB_INTEL_PENDING.join('\n'))
 * Then send the list to get them properly classified in EXCEL_INTEL.
 */
window.SHATOKB_INTEL_PENDING = window.SHATOKB_INTEL_PENDING || [];

/* ============================================================
   3a. AUTO-CLASSIFIER  v5.2
   
   Infers EXCEL_INTEL fields for products not yet in the Excel
   dataset. Called by shatokbMapProduct() when a product handle
   is not found in SHATOKB_EXCEL_INTEL.

   Logic:
   - categoria + tipo_piel + concerns  →  fit_vector (6D)
   - concerns + categoria              →  product_archetype
   - ingredientes (retinol/retinal)    →  safety_final, pm_only
   - categoria                         →  phase default
   - All new products enter as SECONDARY_MATCH (score 40)
     so they never displace editorially-classified products
     from top positions.

   The handle is logged to SHATOKB_INTEL_PENDING for batch
   editorial review. Admin can check from browser console:
     copy(window.SHATOKB_INTEL_PENDING.join('\n'))
============================================================ */

/**
 * Auto-classify a product not found in EXCEL_INTEL.
 *
 * @param {string}   handle      — Shopify product handle
 * @param {string}   categoria   — internal category (serum, moisturizer…)
 * @param {string[]} tipo_piel   — inferred skin types from tags
 * @param {string[]} concerns    — inferred concerns from tags
 * @param {string[]} ingredientes— inferred ingredients from tags
 * @param {boolean}  sensible    — sensitive-safe flag from tags
 * @returns {object} — EXCEL_INTEL-shaped object with _auto: true
 */
function shatokbAutoClassify(handle, categoria, tipo_piel, concerns, ingredientes, sensible) {

  // ── Log for audit ────────────────────────────────────────────
  if (!window.SHATOKB_INTEL_PENDING.includes(handle)) {
    window.SHATOKB_INTEL_PENDING.push(handle);
  }

  // ── Fit vector — inferred from tipo_piel + concerns ──────────
  // If tipo_piel is empty/nolose → set all non-acne to 1 (universal fit)
  const isUniversal = tipo_piel.length === 0 || tipo_piel.every(t => t === 'nolose');
  const fit_dry         = isUniversal ? 1 : (tipo_piel.includes('seca')     ? 1 : 0);
  const fit_oily        = isUniversal ? 1 : (tipo_piel.includes('grasa') || tipo_piel.includes('mixta') ? 1 : 0);
  const fit_combination = isUniversal ? 1 : (tipo_piel.includes('mixta')    ? 1 : 0);
  const fit_sensitive   = (isUniversal || tipo_piel.includes('sensible') || sensible) ? 1 : 0;
  const fit_acne        = concerns.includes('acne')    ? 1 : 0;
  const fit_pigmentation= concerns.includes('manchas') ? 1 : 0;

  // ── Safety — from actual ingredient content ──────────────────
  const hasRetinol   = ingredientes.includes('retinol') || ingredientes.includes('retinal');
  const safety_final = hasRetinol ? 'NO_PREGNANCY' : 'SAFE';
  const pm_only      = hasRetinol;  // retinoids are always PM

  // ── Archetype — from dominant concern + category signal ──────
  // Priority: acne > pigmentation > aging > barrier (default)
  let product_archetype = 'Barrier Specialist';  // safest default
  if (concerns.includes('acne') || concerns.includes('poros')) {
    product_archetype = 'Acne Specialist';
  } else if (concerns.includes('manchas') || concerns.includes('textura')) {
    product_archetype = 'Pigmentation Specialist';
  } else if (concerns.includes('antiaging') || ingredientes.includes('retinol') ||
             ingredientes.includes('peptide') || ingredientes.includes('bakuchiol')) {
    product_archetype = 'Aging Specialist';
  }

  // ── Phase — from category signal ────────────────────────────
  // repair = barrier/hydration base; treat = actives; optimize = advanced
  const PHASE_MAP = {
    cleanser:    'repair',
    toner:       'repair',
    essence:     'repair',
    moisturizer: 'repair',
    serum:       'treat',
    exfoliator:  'treat',
    mask:        'treat',
    eye:         'treat',
    spf:         'repair',
  };
  const phase = PHASE_MAP[categoria] || 'treat';

  // ── Score — conservative default ────────────────────────────
  // 40 = below all editorial tiers (SECONDARY_MATCH=45+, GOOD_MATCH=55+,
  // CORE_MATCH=90). Ensures auto-classified never beats Excel products.
  const user_match_score = 40;

  // ── AM routine hint — generic by category ───────────────────
  const AM_HINTS = {
    cleanser:    'cleanser → toner → serum → moisturizer → spf',
    toner:       'cleanser → toner → serum → moisturizer → spf',
    essence:     'toner → essence → serum → moisturizer',
    serum:       'toner → serum → moisturizer → spf',
    moisturizer: 'serum → moisturizer → spf',
    spf:         'moisturizer → spf',
    eye:         'serum → eye_cream → moisturizer',
    exfoliator:  'use 2-3x/week after cleansing',
    mask:        'use 1-2x/week',
  };
  const PM_HINTS = {
    cleanser:    'cleanser → toner → treatment → moisturizer',
    toner:       'cleanser → toner → treatment → moisturizer',
    essence:     'toner → essence → treatment → moisturizer',
    serum:       'toner → treatment_serum → moisturizer',
    moisturizer: 'treatment → moisturizer',
    spf:         null,  // SPF not used at night
    eye:         'treatment → eye_cream → moisturizer',
    exfoliator:  'use 2-3x/week at night after cleansing',
    mask:        'use 1-2x/week at night',
  };

  return {
    // Standard EXCEL_INTEL fields
    user_match_score,
    recommendation_tier:  'SECONDARY_MATCH',
    fit_dry,
    fit_oily,
    fit_combination,
    fit_sensitive,
    fit_acne,
    fit_pigmentation,
    safety_final,
    personalization_rule: pm_only ? 'use_only_at_night' : 'standard',
    phase,
    product_archetype,
    am_routine:  AM_HINTS[categoria] || 'standard_routine',
    pm_routine:  PM_HINTS[categoria] || 'standard_routine',
    progress_stage:    'repair',
    adaptation_rule:   'standard_tracking',
    // Auto-classification metadata
    _auto:       true,   // flag: not from Excel dataset
  };
}

/**
 * Converts a raw Shopify product object → internal catalogue format.
 * Returns null for products without a recognised category tag.
 *
 * v4.0: Also extracts SHATO SKIN OS fields from Shopify tags:
 *   momento    — from tags: 'AM Only', 'PM Only', 'AM PM', etc.
 *   score_base — from tags: 'Score 85', 'Score_Base_85', etc.
 *   ingredientes — from tags: 'ing_niacinamide', 'ing_retinol', etc.
 *   risk       — from tags: 'risk_pregnant', 'risk_beginner', etc.
 *   fit        — from tags: 'fit_grasa_acne', 'fit_seca', etc.
 *
 * v5.1 EXCEL_INTEL integration:
 *   After building the product object from Shopify tags, looks up
 *   shatokbGetIntel(handle) from the EXCEL_INTEL layer. If the
 *   product has no intel entry OR its user_match_score is below the
 *   gate (score 10 = non-facial / unclassified), returns null so
 *   it is filtered out of the catalogue entirely.
 *
 *   When intel IS found the following fields are attached:
 *     excel_score      — user_match_score (editorial strength 30-90)
 *     excel_tier       — 'CORE_MATCH' | 'GOOD_MATCH' | 'SECONDARY_MATCH'
 *     excel_fit        — { fit_dry, fit_oily, fit_combination,
 *                          fit_sensitive, fit_acne, fit_pigmentation }
 *     excel_safety     — 'SAFE' | 'NO_PREGNANCY'
 *     excel_pm_only    — boolean (personalization_rule === 'use_only_at_night')
 *     excel_phase      — 'repair' | 'treat' | 'optimize'
 *     excel_archetype  — 'Barrier Specialist' | 'Acne Specialist' |
 *                        'Pigmentation Specialist' | 'Aging Specialist'
 *     excel_am_routine — textual AM routine sequence from Excel
 *     excel_pm_routine — textual PM routine sequence from Excel
 */
// ── Blocklist de productos excluidos permanentemente ─────────────────────────
// Kits, sets de viaje y productos multi-unidad que no son SKUs individuales
// y no deben aparecer en ningún paso de rutina. Se excluyen por handle exacto
// independientemente de sus tags, score o cualquier otra propiedad.
// Para añadir un nuevo handle: copiarlo exactamente de la URL de Shopify.
const SHATOKB_HANDLE_BLOCKLIST = new Set([
  // ── Kits / Travel Sets / Multi-packs ────────────────────────────────────
  'skin1004-madagascar-centella-travel-kit-5-travel-size-items',   // Travel kit 5 piezas
  'cosrx-all-about-snail-mucin-korean-skin-care-set',              // Snail 4-piece set
  'cosrx-all-about-snail-kit',                                     // variante corta handle
]);

// ── Mapa de subcategoría explícita por handle ─────────────────────────────────
// Garantiza que productos del catálogo dinámico (Shopify live) sean clasificados
// correctamente aunque sus tags no incluyan el ingrediente clave.
// Se aplica en shatokbMapProduct() con máxima prioridad (sobre tags e ingredientes).
// Para añadir un producto: handle exacto → subcategoría del paso de rutina correcto.
const SHATOKB_SUBCATEGORIA_MAP = {
  // ── Serums con Niacinamide como activo principal ──────────────────────────
  'frankly-niacinamide-15-zinc-beads-1-2-serum-acne-dark-spots-care-1-01-fl-oz':             'serum_niacinamide',
  'cosrx-15-niacinamide-face-serum-0-67-fl-oz':                                              'serum_niacinamide',
  'anua-niacinamide-10-txa-4-serum-hyaluronic-acid-tranexamic-acid-vitamin-b12-30ml-1-01-fl-oz': 'serum_niacinamide',
  'anua-peach-70-niacinamide-serum-30ml-1-01-fl-oz':                                         'serum_niacinamide',
  'tiam-vita-b3-source-10-niacinamide-serum-2-arbutin-1-35-fl-oz':                           'serum_niacinamide',
  'cos-de-baha-niacinamide-20-zinc-pca-4-serum-for-face-1-fl-oz':                            'serum_niacinamide',
  'aplb-glutathione-niacinamide-ampoule-serum-lipo-gluta-niac-cen-31-3-1-35-fl-oz':          'serum_niacinamide',
  'axis-y-dark-spot-correcting-glow-serum-5-niacinamide-vegan-for-all-skin-types-1-69-fl-oz':'serum_niacinamide',
  'beauty-of-joseon-glow-serum-propolis-and-niacinamide-hydrating-facial-soothing-moisturizer-30ml-1-fl-oz': 'serum_niacinamide',
  // ── Moisturizers con Niacinamide ─────────────────────────────────────────
  'aplb-glutathione-niacinamide-facial-cream-lipo-gluta-niac-cen-24-8-1-86-fl-oz':           'moisturizer_niacinamide',
  // ── Masks con Niacinamide ─────────────────────────────────────────────────
  'sungboon-editor-deep-collagen-niacin-vita-c-overnight-mask-37gx4ea-real-collagen-2-160-000ppb-with-niacinamide-vitamin-c': 'mask_niacinamide',
  // ── Serums barrera con ceramida (relacionados, no niacinamide puro) ───────
  'anua-rice-ceramide-7-hydrating-barrier-serum-50ml-1-69fl-oz':                             'serum_barrier',
  'anua-azelaic-acid-10-hyaluron-redness-soothing-serum-30ml-1-01-fl-oz':                    'serum_calming',
};

function shatokbMapProduct(p) {
  // ── Hard-block kits and non-individual SKUs ───────────────────────────────
  if (SHATOKB_HANDLE_BLOCKLIST.has(p.handle)) return null;

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

  // ── SHATO SKIN OS v4.0 — Extract new fields from tags ────────

  // Momento (time of day) — from tags like 'AM Only', 'PM Only', 'AM PM', 'Morning', 'Evening'
  let momento = 'both';
  for (const tag of tags) {
    const tl = tag.toLowerCase().replace(/[_\-\s]/g, '');
    if (tl === 'amonly' || tl === 'morningonly' || tl === 'amroutine') { momento = 'am'; break; }
    if (tl === 'pmonly' || tl === 'nightonly'   || tl === 'pmroutine') { momento = 'pm'; break; }
    if (tl === 'ampm'   || tl === 'botham'      || tl === 'morningnight') { momento = 'both'; break; }
  }
  // Infer from category if not explicitly tagged
  if (momento === 'both') {
    if (categoria === 'spf') momento = 'am';  // SPF always AM
  }

  // score_base — from tags like 'Score 85', 'Score_85', 'Editorial_Score_90'
  let score_base = 50;  // default neutral
  for (const tag of tags) {
    const m = tag.match(/[Ss]core[_\s](\d+)/);
    if (m) { score_base = parseInt(m[1], 10); break; }
    if (tag === 'Best Seller' || tag === 'Bestseller') score_base = Math.max(score_base, 75);
    if (tag === 'Viral' || tag === 'Cult Favorite')    score_base = Math.max(score_base, 70);
  }

  // ingredientes — from tags like 'ing_niacinamide', 'ing_retinol', 'Niacinamide', 'Retinol'
  const ingredientes = [];
  const ING_TAG_MAP = {
    'Niacinamide': 'niacinamide', 'Retinol': 'retinol', 'Vitamin C': 'l_ascorbic_acid',
    'Centella Asiatica': 'centella_asiatica', 'Hyaluronic Acid': 'hyaluronic_acid',
    'Ceramide': 'ceramide', 'AHA': 'aha', 'BHA': 'bha', 'Snail Mucin': 'snail_mucin',
    'Peptide': 'peptide', 'Bakuchiol': 'bakuchiol', 'Heartleaf Extract': 'heartleaf_extract',
    'Salicylic Acid': 'salicylic_acid', 'Tranexamic Acid': 'tranexamic_acid',
    'Azelaic Acid': 'azelaic_acid', 'Alpha Arbutin': 'alpha_arbutin',
  };
  for (const tag of tags) {
    if (tag.startsWith('ing_')) { ingredientes.push(tag.slice(4)); }
    else if (ING_TAG_MAP[tag])  { ingredientes.push(ING_TAG_MAP[tag]); }
  }

  // risk — from tags like 'risk_pregnant', 'risk_beginner', 'PM Only', 'Start Slow'
  const risk = [];
  const RISK_TAG_MAP = {
    'PM Only': 'pm_only', 'AM Only': 'am_only',
    'No Pregnant': 'no_pregnant', 'Not Safe Pregnancy': 'no_pregnant',
    'Not for Beginners': 'no_beginner', 'Advanced Only': 'no_beginner',
    'Start Slow': 'start_slow', 'Introduce Gradually': 'start_slow',
    'SPF Required': 'spf_required', 'Use With SPF': 'spf_required',
    'High Potency': 'high_potency', 'High Strength': 'high_potency',
    'Patch Test': 'patch_test',
  };
  for (const tag of tags) {
    if (tag.startsWith('risk_')) { risk.push(tag.slice(5)); }
    else if (RISK_TAG_MAP[tag])  { risk.push(RISK_TAG_MAP[tag]); }
  }
  // Infer risk from ingredient content
  if (ingredientes.includes('retinol') || ingredientes.includes('retinal')) {
    if (!risk.includes('no_pregnant')) risk.push('no_pregnant');
    if (!risk.includes('pm_only'))     risk.push('pm_only');
    if (!risk.includes('spf_required')) risk.push('spf_required');
  }
  if (ingredientes.includes('l_ascorbic_acid')) {
    if (!risk.includes('am_only'))      risk.push('am_only');
    if (!risk.includes('spf_required')) risk.push('spf_required');
  }

  // fit — from tags like 'fit_grasa_acne', 'fit_seca'
  const fit = [];
  for (const tag of tags) {
    if (tag.startsWith('fit_')) { fit.push(tag.slice(4)); }
  }

  // ── EXCEL_INTEL v5.2 — enrich with editorial intelligence ────
  // Look up the product in the EXCEL_INTEL map by Shopify handle.
  // shatokbGetIntel() returns null for:
  //   a) products not in the Excel dataset  → auto-classify
  //   b) products with user_match_score < 20 → hard exclude (non-facial)
  const intelAvailable = typeof shatokbGetIntel === 'function';
  const intel = intelAvailable ? shatokbGetIntel(p.handle) : null;

  // Hard exclude: EXCEL_INTEL is loaded AND the handle exists with score < 20.
  // This covers known non-facial products (body, hair, makeup, devices).
  // We detect this by checking the raw map directly (bypassing the gate).
  const rawIntel = (typeof SHATOKB_EXCEL_INTEL !== 'undefined')
    ? SHATOKB_EXCEL_INTEL[p.handle]
    : undefined;
  if (rawIntel && rawIntel.user_match_score < 20) return null;

  // Auto-classify: product is new to Shopify, not yet in Excel.
  // shatokbAutoClassify() infers all EXCEL_INTEL fields from available
  // tag data. The product enters as SECONDARY_MATCH — visible but
  // never top-1 against editorially-classified products.
  // Also logs the handle to SHATOKB_INTEL_PENDING for batch review.
  const autoIntel = (!intel && categoria)
    ? shatokbAutoClassify(p.handle, categoria, tipo_piel, concerns, ingredientes, sensible)
    : null;

  // Use editorial intel if available, auto-classified otherwise.
  // If neither (EXCEL_INTEL not loaded at all), proceed without intel.
  const resolvedIntel = intel || autoIntel;

  // ── Override/enhance tag-derived fields with intel data ─────
  // resolvedIntel = editorial (Excel) OR auto-classified.
  // Editorial intel is authoritative; auto-classified is best-effort.
  let excel_score      = null;
  let excel_tier       = null;
  let excel_fit        = null;
  let excel_safety     = null;   // 'SAFE' | 'NO_PREGNANCY'
  let excel_pm_only    = false;
  let excel_phase      = null;
  let excel_archetype  = null;
  let excel_am_routine = null;
  let excel_pm_routine = null;
  let excel_auto       = false;  // true = auto-classified, not from Excel

  if (resolvedIntel) {
    excel_auto      = resolvedIntel._auto || false;
    excel_score     = resolvedIntel.user_match_score;
    excel_tier      = resolvedIntel.recommendation_tier;
    excel_fit       = {
      fit_dry:          resolvedIntel.fit_dry          || 0,
      fit_oily:         resolvedIntel.fit_oily          || 0,
      fit_combination:  resolvedIntel.fit_combination   || 0,
      fit_sensitive:    resolvedIntel.fit_sensitive     || 0,
      fit_acne:         resolvedIntel.fit_acne          || 0,
      fit_pigmentation: resolvedIntel.fit_pigmentation  || 0,
    };
    excel_safety     = resolvedIntel.safety_final;
    excel_pm_only    = resolvedIntel.personalization_rule === 'use_only_at_night';
    excel_phase      = resolvedIntel.phase;
    excel_archetype  = resolvedIntel.product_archetype;
    excel_am_routine = resolvedIntel.am_routine;
    excel_pm_routine = resolvedIntel.pm_routine;

    // Promote score_base if intel editorial is stronger
    if (excel_score > score_base) score_base = excel_score;

    // Enforce PM-only if intel says so
    if (excel_pm_only && momento !== 'pm') momento = 'pm';

    // Safety sync: add no_pregnant if intel says NO_PREGNANCY
    if (excel_safety === 'NO_PREGNANCY' && !risk.includes('no_pregnant')) {
      risk.push('no_pregnant');
    }
    // Safety correction: remove no_pregnant if intel explicitly says SAFE
    // (corrects false positives from tag inference on peptide products)
    if (excel_safety === 'SAFE' && risk.includes('no_pregnant')) {
      const hasActualRetinol = ingredientes.includes('retinol') || ingredientes.includes('retinal');
      if (!hasActualRetinol) risk = risk.filter(r => r !== 'no_pregnant');
    }
  }

  // ── Subcategoría — inferida del handle + ingredientes + tags ────────────────
  // Crítico para el filtro v7.5 (subcategoría first). Permite que productos del
  // catálogo dinámico (Shopify live) aparezcan en el paso correcto de la rutina.
  // Priority: mapa explícito > tag explícito > ingredientes > handle keyword.
  let subcategoria = null;
  // 0. Mapa explícito por handle — máxima prioridad, nunca se sobreescribe
  if (SHATOKB_SUBCATEGORIA_MAP[p.handle]) {
    subcategoria = SHATOKB_SUBCATEGORIA_MAP[p.handle];
  }
  // 1. Tag explícito ('subcat_serum_niacinamide', 'subcat_moisturizer_gel', etc.)
  if (!subcategoria) for (const tag of tags) {
    if (tag.startsWith('subcat_')) { subcategoria = tag.slice(7); break; }
  }
  // 2. Inferir desde ingredientes (más fiable que handle)
  if (!subcategoria && categoria === 'serum') {
    if (ingredientes.includes('niacinamide') && (ingredientes.includes('zinc') || ingredientes.includes('tranexamic_acid') || p.title.toLowerCase().includes('niacinamide')))
      subcategoria = 'serum_niacinamide';
    else if (ingredientes.includes('retinol') || ingredientes.includes('retinal'))
      subcategoria = 'serum_retinol';
    else if (ingredientes.includes('l_ascorbic_acid'))
      subcategoria = 'serum_vitamin_c';
    else if (ingredientes.includes('niacinamide') || ingredientes.includes('alpha_arbutin') || ingredientes.includes('glutathione') || ingredientes.includes('tranexamic_acid'))
      subcategoria = 'serum_brightening';
    else if (ingredientes.includes('centella_asiatica') || ingredientes.includes('azelaic_acid') || ingredientes.includes('panthenol'))
      subcategoria = 'serum_calming';
  }
  if (!subcategoria && categoria === 'toner') {
    if (ingredientes.includes('aha') || ingredientes.includes('bha') || ingredientes.includes('pha'))
      subcategoria = 'toner_exfoliating';
    else
      subcategoria = 'toner_hydrating';
  }
  if (!subcategoria && categoria === 'moisturizer') {
    if (ingredientes.includes('retinol') || ingredientes.includes('peptide'))
      subcategoria = 'moisturizer_anti_aging';
    else if (tipo_piel.includes('grasa') || tipo_piel.includes('mixta'))
      subcategoria = 'moisturizer_gel';
    else
      subcategoria = 'moisturizer_cream';
  }
  // 3. Inferir desde handle (último recurso)
  if (!subcategoria) {
    const h = p.handle.toLowerCase();
    if (h.includes('niacinamide'))                              subcategoria = categoria + '_niacinamide';
    else if (h.includes('retinol') || h.includes('retinal'))   subcategoria = categoria + '_retinol';
    else if (h.includes('vitamin-c') || h.includes('vita-c'))  subcategoria = categoria + '_vitamin_c';
  }

  return {
    id:           p.handle,
    nombre:       p.title,
    handle:       p.handle,
    precio,
    precio_num,
    badge,
    emoji:        EMOJI_MAP[categoria] || '🌿',
    desc:         p.body_html
                    ? p.body_html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160) + '…'
                    : p.title,
    tipo_piel,
    categoria,
    concerns,
    sensible,
    imagen:       p.images?.[0]?.src || null,
    subcategoria,   // ← ahora presente en todos los productos (dinámicos y fallback)
    // ── SHATO SKIN OS v4.0 fields ──────────────────────────────
    momento,
    score_base,
    ingredientes,
    risk,
    fit,
    // ── EXCEL_INTEL v5.1 fields ────────────────────────────────
    excel_score,
    excel_tier,
    excel_fit,
    excel_safety,
    excel_pm_only,
    excel_phase,
    excel_archetype,
    excel_am_routine,
    excel_pm_routine,
    excel_auto,        // true = auto-classified (not from Excel dataset)
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
    const raw      = await shatokbFetchAllPages(LIVE_STORE);
    const mapeados = raw.map(shatokbMapProduct).filter(Boolean);
    SHATOKB_CATALOGO = mapeados;
    window.SHATOKB_CATALOGO = SHATOKB_CATALOGO; // exponer para koi-chat.js
    shatokbCatalogoCargado = true;
    const autoCount = mapeados.filter(p => p.excel_auto).length;
    console.log(`[SHATOKB] ✅ Live catalogue: ${mapeados.length} products active` +
      ` (${mapeados.length - autoCount} editorial, ${autoCount} auto-classified)` +
      ` — ${raw.length - mapeados.length} excluded (non-facial / score-gated).`);
    if (autoCount > 0) {
      console.info('[SHATOKB] 📋 Auto-classified products pending editorial review:',
        window.SHATOKB_INTEL_PENDING.length,
        '— run: copy(window.SHATOKB_INTEL_PENDING.join("\\n")) to export list.');
    }
    return;
  } catch (err) {
    console.warn('[SHATOKB] shatokb.com fetch failed — trying relative URL:', err.message);
  }

  // ── Attempt 2: relative URL (Shopify CLI / theme preview) ─────
  try {
    const raw      = await shatokbFetchAllPages('');
    const mapeados = raw.map(shatokbMapProduct).filter(Boolean);
    SHATOKB_CATALOGO = mapeados.length > 0 ? mapeados : SHATOKB_FALLBACK;
    window.SHATOKB_CATALOGO = SHATOKB_CATALOGO; // exponer para koi-chat.js
    shatokbCatalogoCargado = true;
    if (mapeados.length > 0) {
      const autoCount = mapeados.filter(p => p.excel_auto).length;
      console.log(`[SHATOKB] ✅ Catalogue via relative URL: ${mapeados.length} products` +
        ` (${mapeados.length - autoCount} editorial, ${autoCount} auto-classified).`);
    } else {
      console.warn('[SHATOKB] No tagged products found — using static fallback.');
    }
    return;
  } catch (err) {
    console.warn('[SHATOKB] Relative fetch also failed — using static fallback:', err.message);
  }

  // ── Attempt 3: static fallback ────────────────────────────────
  SHATOKB_CATALOGO = SHATOKB_FALLBACK;
  window.SHATOKB_CATALOGO = SHATOKB_CATALOGO; // exponer para koi-chat.js
  shatokbCatalogoCargado = true;
  console.warn(`[SHATOKB] ⚠️ Using static fallback catalogue (${SHATOKB_FALLBACK.length} products). Results are representative but not exhaustive.`);
}


/* ============================================================
   4. FALLBACK CATALOGUE  —  SHATO SKIN OS v5.0
   Complete fields from Shato_Skin_OS_Master_Project.xlsx:
     momento:       'am' | 'pm' | 'both'
     score_base:    0-100 editorial score (Excel)
     ingredientes:  key active ingredients array
     risk:          safety flags array
     fit:           explicit skin profile matches from Excel
     subcategoria:  specific subcategory (serum_brightening, etc.)
     nivel_usuario: 'beginner' | 'intermediate' | 'advanced'
     posicion_am:   step position in AM routine (1-10)
     posicion_pm:   step position in PM routine (1-10)
   
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
    concerns:['acne','poros','rojeces'], sensible:true,
    // ── SHATO SKIN OS v5.0 ──────────────────────────────────────
    momento:'both', score_base:90,
    ingredientes:['salicylic_acid','tea_tree','low_ph'],
    risk:[], fit:['grasa_acne','grasa_poros'],
    subcategoria:'cleanser_gel', nivel_usuario:'beginner',
    posicion_am:1, posicion_pm:2
  },
  {
    id:'anua-foam-cleanser', handle:'anua-heartleaf-quercetinol-pore-deep-cleansing-foam-150ml-5-07-fl-oz',
    nombre:'Anua Heartleaf Quercetinol Pore Deep Cleansing Foam',
    precio:'$16.99', precio_num:16.99, badge:null, emoji:'🫧',
    desc:'BHA + heartleaf foam that dissolves sebum plugs while calming inflammation. Ideal for oily and acne-prone skin.',
    tipo_piel:['grasa','mixta','sensible','nolose'], categoria:'cleanser',
    concerns:['acne','poros','rojeces'], sensible:true,
    momento:'both', score_base:85,
    ingredientes:['heartleaf_extract','quercetinol','bha'],
    risk:[], fit:['grasa_acne','grasa_poros','sensible_rojeces'],
    subcategoria:'cleanser_foam', nivel_usuario:'beginner',
    posicion_am:1, posicion_pm:2
  },
  {
    id:'anua-cleansing-oil', handle:'anua-heartleaf-pore-control-cleansing-oil-6-76-fl-oz-200ml',
    nombre:'Anua Heartleaf Pore Control Cleansing Oil',
    precio:'$19.99', precio_num:19.99, badge:'Best Seller', emoji:'🫧',
    desc:'Glass-skin cleansing oil that dissolves SPF and makeup on contact. Fragrance-free, non-comedogenic — even for sensitive skin.',
    tipo_piel:['grasa','mixta','sensible','seca','nolose'], categoria:'cleanser',
    concerns:['acne','poros','deshidratacion'], sensible:true,
    momento:'pm', score_base:88,
    ingredientes:['heartleaf_extract','sunflower_oil','non_comedogenic'],
    risk:[], fit:['grasa_acne','sensible_rojeces','mixta_general'],
    subcategoria:'cleanser_oil', nivel_usuario:'intermediate',
    posicion_am:null, posicion_pm:1
  },
  {
    id:'dearklairs-black-cleanser', handle:'dearklairs-gentle-black-facial-cleanser-4-73-fl-oz-vegan-low-ph-hydrating-finish',
    nombre:'DearKlairs Gentle Black Facial Cleanser',
    precio:'$18.00', precio_num:18.00, badge:'Best Seller', emoji:'🫧',
    desc:'Low pH antioxidant cleanser with black bean and truffle. Hydrating finish — no tight feeling after washing.',
    tipo_piel:['seca','mixta','sensible','nolose'], categoria:'cleanser',
    concerns:['deshidratacion','rojeces','antiaging'], sensible:true,
    momento:'both', score_base:83,
    ingredientes:['black_bean_extract','truffle','glycerin'],
    risk:[], fit:['seca_hidratacion','seca_antiaging','sensible_rojeces'],
    subcategoria:'cleanser_foam', nivel_usuario:'beginner',
    posicion_am:1, posicion_pm:2
  },
  {
    id:'pyunkang-foam', handle:'pyunkang-yul-cleansing-foam-5-1-fl-oz',
    nombre:'Pyunkang Yul Cleansing Foam',
    precio:'$14.00', precio_num:14.00, badge:null, emoji:'🫧',
    desc:'Zero-irritation foam for dry and sensitive skin. Minimal ingredients, maximum gentleness.',
    tipo_piel:['seca','sensible','nolose'], categoria:'cleanser',
    concerns:['rojeces','deshidratacion'], sensible:true,
    momento:'both', score_base:79,
    ingredientes:['minimal_ingredients','glycerin'],
    risk:[], fit:['sensible_rojeces','seca_hidratacion'],
    subcategoria:'cleanser_foam', nivel_usuario:'beginner',
    posicion_am:1, posicion_pm:2
  },
  {
    id:'skin1004-foam', handle:'skin1004-madagascar-centella-ampoule-foam-4-22-fl-oz-125ml',
    nombre:'SKIN1004 Madagascar Centella Ampoule Foam',
    precio:'$14.00', precio_num:14.00, badge:'Best Seller', emoji:'🫧',
    desc:'Baking soda + centella foam that deep-cleans pores and soothes breakout-prone skin. EWG certified.',
    tipo_piel:['grasa','mixta','sensible','nolose'], categoria:'cleanser',
    concerns:['acne','poros','rojeces'], sensible:true,
    momento:'both', score_base:84,
    ingredientes:['centella_asiatica','baking_soda','low_ph'],
    risk:[], fit:['grasa_acne','sensible_rojeces','mixta_general'],
    subcategoria:'cleanser_foam', nivel_usuario:'beginner',
    posicion_am:1, posicion_pm:2
  },
  {
    id:'heimish-balm', handle:'heimish-all-clean-balm-4-0fl-oz-120ml-multi-purpose-cleansing-balm',
    nombre:'HEIMISH All Clean Balm',
    precio:'$22.00', precio_num:22.00, badge:'Best Seller', emoji:'🫧',
    desc:'Cult-status balm that melts makeup, SPF and impurities without residue. Perfect first cleanse.',
    tipo_piel:['grasa','mixta','seca','sensible','nolose'], categoria:'cleanser',
    concerns:['acne','manchas','deshidratacion'], sensible:true,
    momento:'pm', score_base:87,
    ingredientes:['beeswax','shea_butter','jojoba_oil'],
    risk:[], fit:['general_glow','seca_hidratacion','mixta_manchas'],
    subcategoria:'cleanser_balm', nivel_usuario:'intermediate',
    posicion_am:null, posicion_pm:1
  },
  {
    id:'beauty-joseon-balm', handle:'beauty-of-joseon-radiance-cleansing-balm-makeup-sunscreen-pore-cleanser-for-sensitive-acne-skin-korean-skincare-for-men-and-women-100ml-3-38-fl-oz',
    nombre:'Beauty of Joseon Radiance Cleansing Balm',
    precio:'$13.00', precio_num:13.00, badge:'Best Seller', emoji:'🫧',
    desc:'Exfoliating cleansing balm that removes SPF and makeup while brightening dull skin.',
    tipo_piel:['grasa','mixta','seca','sensible','nolose'], categoria:'cleanser',
    concerns:['manchas','textura','deshidratacion'], sensible:true,
    momento:'pm', score_base:85,
    ingredientes:['rice_bran','niacinamide','beeswax'],
    risk:[], fit:['mixta_manchas','general_glow','seca_antiaging'],
    subcategoria:'cleanser_balm', nivel_usuario:'beginner',
    posicion_am:null, posicion_pm:1
  },

  /* ── TONERS ─────────────────────────────────────────────────── */
  {
    id:'some-by-mi-toner', handle:'some-by-mi-aha-bha-pha-30-days-miracle-toner-5-07oz-150ml',
    nombre:'SOME BY MI AHA·BHA·PHA 30 Days Miracle Toner',
    precio:'$16.99', precio_num:16.99, badge:null, emoji:'💧',
    desc:'Triple-acid toner that treats acne, dark spots and rough texture simultaneously. Visible results in 30 days.',
    tipo_piel:['grasa','mixta','nolose'], categoria:'toner',
    concerns:['acne','poros','textura','manchas'], sensible:false,
    momento:'pm', score_base:78,
    ingredientes:['aha','bha','pha','salicylic_acid','glycolic_acid'],
    risk:['start_slow','spf_required'], fit:['grasa_acne','grasa_poros','mixta_manchas'],
    subcategoria:'toner_exfoliating', nivel_usuario:'intermediate',
    posicion_am:null, posicion_pm:3
  },
  {
    id:'dearklairs-toner', handle:'dear-klairs-supple-preparation-unscented-toner-6-08-fl-oz',
    nombre:'DearKlairs Supple Preparation Unscented Toner',
    precio:'$24.00', precio_num:24.00, badge:'Best Seller', emoji:'💧',
    desc:'Alcohol-free, fragrance-free hydrating toner. Beta-glucan and centella soothe redness and deeply replenish moisture.',
    tipo_piel:['seca','mixta','sensible','grasa','nolose'], categoria:'toner',
    concerns:['deshidratacion','rojeces','antiaging'], sensible:true,
    momento:'both', score_base:88,
    ingredientes:['beta_glucan','centella_asiatica','glycerin','hyaluronic_acid'],
    risk:[], fit:['sensible_rojeces','seca_hidratacion','mixta_general'],
    subcategoria:'toner_hydrating', nivel_usuario:'beginner',
    posicion_am:2, posicion_pm:3
  },
  {
    id:'anua-soothing-toner', handle:'anua-heartleaf-77-soothing-toner-i-ph-5-5-trouble-care-calming-skin-refreshing-hydrating-purifying-cruelty-free-vegan-250ml-8-45-fl-oz',
    nombre:'Anua Heartleaf 77 Soothing Toner',
    precio:'$22.00', precio_num:22.00, badge:'Best Seller', emoji:'💧',
    desc:'77% heartleaf extract at pH 5.5 — calms breakouts, strengthens the barrier and hydrates in one step.',
    tipo_piel:['grasa','mixta','sensible','nolose'], categoria:'toner',
    concerns:['acne','rojeces','deshidratacion'], sensible:true,
    momento:'both', score_base:87,
    ingredientes:['heartleaf_extract','centella','hyaluronic_acid'],
    risk:[], fit:['sensible_rojeces','grasa_acne','mixta_general'],
    subcategoria:'toner_calming', nivel_usuario:'beginner',
    posicion_am:2, posicion_pm:3
  },
  {
    id:'tirtir-rice-toner', handle:'tirtir-milk-skin-rice-toner-deep-moisturizing-hydrating-toner-for-face-5-07-fl-oz',
    nombre:'TIRTIR Milk Skin Rice Toner',
    precio:'$26.00', precio_num:26.00, badge:null, emoji:'💧',
    desc:'Milky rice toner with 4% niacinamide. Brightens uneven tone, hydrates deeply and leaves skin glass-smooth.',
    tipo_piel:['seca','mixta','sensible','nolose'], categoria:'toner',
    concerns:['manchas','deshidratacion','textura'], sensible:true,
    momento:'both', score_base:83,
    ingredientes:['rice_extract','niacinamide','hyaluronic_acid'],
    risk:[], fit:['mixta_manchas','seca_hidratacion','general_glow'],
    subcategoria:'toner_brightening', nivel_usuario:'beginner',
    posicion_am:2, posicion_pm:3
  },
  {
    id:'im-from-rice-toner', handle:'im-from-rice-toner-milky-toner-for-glowing-skin-korean-rice-glow-essence-with-niacinamide-5-07-fl-oz',
    nombre:"I'm From Rice Toner",
    precio:'$32.00', precio_num:32.00, badge:'Best Seller', emoji:'💧',
    desc:'Milky toner with rice bran extract and niacinamide for glass skin. Brightens, hydrates and evens tone.',
    tipo_piel:['seca','mixta','grasa','nolose'], categoria:'toner',
    concerns:['manchas','deshidratacion','textura'], sensible:true,
    momento:'both', score_base:85,
    ingredientes:['rice_bran_extract','niacinamide','fermented_rice'],
    risk:[], fit:['mixta_manchas','general_glow','seca_hidratacion'],
    subcategoria:'toner_brightening', nivel_usuario:'beginner',
    posicion_am:2, posicion_pm:3
  },
  {
    id:'medicube-collagen-toner', handle:'medicube-triple-collagen-toner',
    nombre:'Medicube Triple Collagen Toner',
    precio:'$29.00', precio_num:29.00, badge:'Best Seller', emoji:'💧',
    desc:'3-type collagen toner that deeply plumps and firms. Fast-absorbing dewy formula for visible elasticity boost.',
    tipo_piel:['seca','mixta','nolose'], categoria:'toner',
    concerns:['antiaging','deshidratacion','textura'], sensible:true,
    momento:'both', score_base:80,
    ingredientes:['collagen','hyaluronic_acid','peptide'],
    risk:[], fit:['seca_antiaging','seca_hidratacion'],
    subcategoria:'toner_hydrating', nivel_usuario:'beginner',
    posicion_am:2, posicion_pm:3
  },
  {
    id:'pyunkang-toner', handle:'pyunkang-yul-calming-deep-moisture-toner-face-toner-for-women-containing-aha-and-pha-150ml-5-07-fl-oz',
    nombre:'Pyunkang Yul Calming Deep Moisture Toner',
    precio:'$18.00', precio_num:18.00, badge:null, emoji:'💧',
    desc:'AHA + PHA toner that gently exfoliates while intensely hydrating. For dry, sensitive and acne-prone skin.',
    tipo_piel:['seca','sensible','grasa','nolose'], categoria:'toner',
    concerns:['deshidratacion','textura','acne','rojeces'], sensible:true,
    momento:'pm', score_base:81,
    ingredientes:['aha','pha','glycerin','centella'],
    risk:['start_slow'], fit:['seca_hidratacion','sensible_rojeces','grasa_acne'],
    subcategoria:'toner_exfoliating', nivel_usuario:'intermediate',
    posicion_am:null, posicion_pm:3
  },

  /* ── ESSENCES ───────────────────────────────────────────────── */
  {
    id:'cosrx-snail-essence', handle:'cosrx-snail-mucin-96-power-repairing-essence-3-38-fl-oz-100ml',
    nombre:'COSRX Snail Mucin 96% Power Repairing Essence',
    precio:'$25.00', precio_num:25.00, badge:'Best Seller', emoji:'🐌',
    desc:'The most iconic K-Beauty essence. 96% snail secretion repairs the barrier, fades marks and hydrates every skin type.',
    tipo_piel:['grasa','mixta','seca','sensible','nolose'], categoria:'essence',
    concerns:['deshidratacion','manchas','rojeces','antiaging','textura'], sensible:true,
    momento:'both', score_base:95,
    ingredientes:['snail_mucin','hyaluronic_acid','glycerin'],
    risk:[], fit:['general_glow','seca_hidratacion','mixta_general','sensible_rojeces'],
    subcategoria:'essence_treatment', nivel_usuario:'beginner',
    posicion_am:3, posicion_pm:4
  },
  {
    id:'haruharu-essence', handle:'haruharu-wonder-black-rice-probiotics-barrier-essence-4-05-fl-oz',
    nombre:'Haruharu Wonder Black Rice Probiotics Barrier Essence',
    precio:'$32.00', precio_num:32.00, badge:null, emoji:'🌿',
    desc:'Fermented black rice + probiotics essence that rebuilds the barrier, adds glow and soothes redness.',
    tipo_piel:['seca','mixta','sensible','nolose'], categoria:'essence',
    concerns:['deshidratacion','rojeces','manchas','antiaging'], sensible:true,
    momento:'both', score_base:85,
    ingredientes:['fermented_black_rice','probiotics','hyaluronic_acid'],
    risk:[], fit:['seca_hidratacion','sensible_rojeces','mixta_general'],
    subcategoria:'essence_barrier', nivel_usuario:'beginner',
    posicion_am:3, posicion_pm:4
  },
  {
    id:'abib-heartleaf-essence', handle:'abib-heartleaf-essence-calming-pump-1-69-fl-oz-50ml-i-essence-for-face',
    nombre:'Abib Heartleaf Essence Calming Pump',
    precio:'$29.00', precio_num:29.00, badge:'Best Seller', emoji:'🌿',
    desc:'Houttuynia cordata essence that instantly calms redness and soothes post-breakout inflammation.',
    tipo_piel:['sensible','mixta','seca','nolose'], categoria:'essence',
    concerns:['rojeces','deshidratacion','acne'], sensible:true,
    momento:'both', score_base:82,
    ingredientes:['heartleaf_extract','panthenol','hyaluronic_acid'],
    risk:[], fit:['sensible_rojeces','grasa_acne','mixta_general'],
    subcategoria:'essence_calming', nivel_usuario:'beginner',
    posicion_am:3, posicion_pm:4
  },
  {
    id:'haruharu-hyaluronic-toner-essence', handle:'haruharu-wonder-black-rice-hyaluronic-toner-for-all-skin-types-5-1-fl-oz-150ml',
    nombre:'Haruharu Wonder Black Rice Hyaluronic Toner',
    precio:'$28.00', precio_num:28.00, badge:'Best Seller', emoji:'🌿',
    desc:'EWG-safe fermented black rice toner-essence that delivers 72-hour hydration and restores skin elasticity.',
    tipo_piel:['seca','mixta','sensible','nolose'], categoria:'essence',
    concerns:['deshidratacion','antiaging','rojeces'], sensible:true,
    momento:'both', score_base:84,
    ingredientes:['fermented_black_rice','hyaluronic_acid','glycerin'],
    risk:[], fit:['seca_hidratacion','mixta_general','sensible_rojeces'],
    subcategoria:'essence_hydrating', nivel_usuario:'beginner',
    posicion_am:3, posicion_pm:4
  },
  {
    id:'vt-pdrn-essence', handle:'vt-cosmetics-pdrn-100-essence-intensive-glow-serum-vegan-pdrn-100-000ppm-1-01-fl-oz',
    nombre:'VT COSMETICS PDRN 100 Essence Intensive Glow Serum',
    precio:'$34.00', precio_num:34.00, badge:'Best Seller', emoji:'💊',
    desc:'100,000ppm PDRN essence that repairs skin elasticity, boosts collagen and delivers an intense glow.',
    tipo_piel:['seca','mixta','nolose'], categoria:'essence',
    concerns:['antiaging','deshidratacion','textura'], sensible:true,
    momento:'both', score_base:88,
    ingredientes:['pdrn','hyaluronic_acid','peptide'],
    risk:[], fit:['seca_antiaging','general_glow','mixta_general'],
    subcategoria:'essence_treatment', nivel_usuario:'intermediate',
    posicion_am:3, posicion_pm:4
  },

  /* ── SERUMS ─────────────────────────────────────────────────── */
  {
    id:'cosrx-niacinamide-serum', handle:'cosrx-15-niacinamide-face-serum-0-67-fl-oz',
    nombre:'COSRX 15% Niacinamide Face Serum',
    precio:'$17.99', precio_num:17.99, badge:'Best Seller', emoji:'💊',
    desc:'15% niacinamide minimises pores, controls sebum, fades dark spots and evens skin tone — visibly in 2 weeks.',
    tipo_piel:['grasa','mixta','sensible','nolose'], categoria:'serum',
    concerns:['poros','acne','manchas','textura'], sensible:true,
    momento:'both', score_base:82,
    ingredientes:['niacinamide','zinc'],
    risk:[], fit:['grasa_acne','grasa_poros','mixta_manchas'],
    subcategoria:'serum_niacinamide', nivel_usuario:'beginner',
    posicion_am:4, posicion_pm:5
  },
  {
    id:'anua-niacinamide-serum', handle:'anua-niacinamide-10-txa-4-serum-hyaluronic-acid-tranexamic-acid-vitamin-b12-30ml-1-01-fl-oz',
    nombre:'ANUA Niacinamide 10 + TXA 4 Serum',
    precio:'$22.00', precio_num:22.00, badge:'Best Seller', emoji:'💊',
    desc:'Niacinamide + tranexamic acid serum that fades spots, evens tone and tightens pores. A daily brightening essential.',
    tipo_piel:['grasa','mixta','sensible','nolose'], categoria:'serum',
    concerns:['manchas','poros','textura','deshidratacion'], sensible:true,
    momento:'both', score_base:88,
    ingredientes:['niacinamide','tranexamic_acid','hyaluronic_acid'],
    risk:[], fit:['mixta_manchas','grasa_acne','grasa_poros'],
    subcategoria:'serum_niacinamide', nivel_usuario:'intermediate',  // niacinamide es el activo principal (10%)
    posicion_am:4, posicion_pm:5
  },
  {
    id:'some-by-mi-retinol', handle:'some-by-mi-retinol-intense-reactivating-serum-1-69oz-50ml',
    nombre:'SOME BY MI Retinol Intense Reactivating Serum',
    precio:'$24.00', precio_num:24.00, badge:null, emoji:'💊',
    desc:'Gentle encapsulated retinol that stimulates collagen and speeds cell renewal. Start 2–3 nights per week.',
    tipo_piel:['seca','mixta','grasa','nolose'], categoria:'serum',
    concerns:['antiaging','textura','manchas'], sensible:false,
    momento:'pm', score_base:80,
    ingredientes:['retinol','ceramide'],
    risk:['pm_only','start_slow','no_pregnant','spf_required'], fit:['seca_antiaging','mixta_manchas'],
    subcategoria:'serum_retinol', nivel_usuario:'intermediate',
    posicion_am:null, posicion_pm:5
  },
  {
    id:'beauty-joseon-calming-serum', handle:'beauty-of-joseon-calming-serum-green-tea-panthenol-soothing-moisturizing-sensitive-acne-prone-uv-irritated-skin-daily-korean-skin-care-for-men-and-women-30ml-1-fl-oz',
    nombre:'Beauty of Joseon Calming Serum: Green Tea + Panthenol',
    precio:'$15.00', precio_num:15.00, badge:'Best Seller', emoji:'💊',
    desc:'Green tea + panthenol calming serum that soothes breakouts, hydrates and strengthens the skin barrier.',
    tipo_piel:['grasa','mixta','sensible','nolose'], categoria:'serum',
    concerns:['acne','rojeces','deshidratacion'], sensible:true,
    momento:'both', score_base:83,
    ingredientes:['green_tea','panthenol','centella'],
    risk:[], fit:['sensible_rojeces','grasa_acne','mixta_general'],
    subcategoria:'serum_calming', nivel_usuario:'beginner',
    posicion_am:4, posicion_pm:5
  },
  {
    id:'beauty-joseon-glow-serum', handle:'beauty-of-joseon-glow-deep-serum-rice-alpha-arbutin-30ml',
    nombre:'Beauty of Joseon Glow Deep Serum: Rice + Alpha-Arbutin',
    precio:'$15.00', precio_num:15.00, badge:'Best Seller', emoji:'💊',
    desc:'Rice water + alpha-arbutin serum that fades hyperpigmentation and delivers a glass-skin glow.',
    tipo_piel:['seca','mixta','grasa','nolose'], categoria:'serum',
    concerns:['manchas','textura','deshidratacion'], sensible:true,
    momento:'am', score_base:85,
    ingredientes:['rice_water','alpha_arbutin','niacinamide'],
    risk:[], fit:['mixta_manchas','general_glow','seca_antiaging'],
    subcategoria:'serum_brightening', nivel_usuario:'beginner',
    posicion_am:4, posicion_pm:null
  },
  {
    id:'skin1004-centella-ampoule', handle:'skin1004-madagascar-centella-asiatica-ampoule-facial-serum-3-38-fl-oz100ml',
    nombre:'SKIN1004 Madagascar Centella Asiatica Ampoule',
    precio:'$18.00', precio_num:18.00, badge:'Best Seller', emoji:'💊',
    desc:'100% Madagascar centella serum that calms redness, repairs the barrier and soothes sensitised skin.',
    tipo_piel:['sensible','mixta','seca','nolose'], categoria:'serum',
    concerns:['rojeces','deshidratacion','acne'], sensible:true,
    momento:'both', score_base:84,
    ingredientes:['centella_asiatica','madecassoside','asiaticoside'],
    risk:[], fit:['sensible_rojeces','mixta_general','grasa_acne'],
    subcategoria:'serum_calming', nivel_usuario:'beginner',
    posicion_am:4, posicion_pm:5
  },
  {
    id:'cosrx-vitamin-c-13', handle:'cosrx-pure-vitamin-c-13-serum-with-vitamin-e-hyaluronic-acid-0-67fl-oz-20ml',
    nombre:'COSRX Pure Vitamin C 13% Serum',
    precio:'$19.99', precio_num:19.99, badge:'Best Seller', emoji:'💊',
    desc:'Pure 13% L-ascorbic acid with vitamin E and HA. Brightens, fades spots and protects against free radicals.',
    tipo_piel:['mixta','seca','grasa','nolose'], categoria:'serum',
    concerns:['manchas','antiaging','textura'], sensible:false,
    momento:'am', score_base:83,
    ingredientes:['l_ascorbic_acid','vitamin_e','hyaluronic_acid'],
    risk:['am_only','spf_required','no_beginner'], fit:['mixta_manchas','seca_antiaging','general_glow'],
    subcategoria:'serum_vitamin_c', nivel_usuario:'advanced',
    posicion_am:4, posicion_pm:null
  },
  {
    id:'anua-azelaic-serum', handle:'anua-azelaic-acid-10-hyaluron-redness-soothing-serum-30ml-1-01-fl-oz',
    nombre:'ANUA Azelaic Acid 10 Hyaluron Redness Soothing Serum',
    precio:'$22.00', precio_num:22.00, badge:'Best Seller', emoji:'💊',
    desc:'Azelaic acid 10% + HA serum for redness, rosacea and blemishes. Calms, brightens and hydrates simultaneously.',
    tipo_piel:['sensible','mixta','grasa','nolose'], categoria:'serum',
    concerns:['rojeces','acne','manchas','deshidratacion'], sensible:true,
    momento:'both', score_base:82,
    ingredientes:['azelaic_acid','hyaluronic_acid','panthenol'],
    risk:[], fit:['sensible_rojeces','mixta_manchas','grasa_acne'],
    subcategoria:'serum_calming', nivel_usuario:'intermediate',
    posicion_am:4, posicion_pm:5
  },
  {
    id:'medicube-vita-c-serum', handle:'medicube-deep-vita-c-serum-2-0-14-5-pure-vitamin-c',
    nombre:'Medicube Deep Vita C Serum 2.0 — 14.5% Pure Vitamin C',
    precio:'$38.00', precio_num:38.00, badge:'Best Seller', emoji:'💊',
    desc:'14.5% pure vitamin C for intense brightening, dark spot correction and elasticity boosting.',
    tipo_piel:['mixta','seca','grasa','nolose'], categoria:'serum',
    concerns:['manchas','antiaging','textura'], sensible:false,
    momento:'am', score_base:85,
    ingredientes:['l_ascorbic_acid','niacinamide','vitamin_e'],
    risk:['am_only','spf_required','no_beginner','high_potency'], fit:['mixta_manchas','seca_antiaging'],
    subcategoria:'serum_vitamin_c', nivel_usuario:'advanced',
    posicion_am:4, posicion_pm:null
  },
  {
    id:'frankly-retinol', handle:'frankly-retinol-0-1-cream-1-01-fl-oz-beginner-retinol-night-cream-with-ceramides',
    nombre:'FRANKLY Retinol 0.1% Cream',
    precio:'$24.00', precio_num:24.00, badge:'Best Seller', emoji:'💊',
    desc:'Beginner retinol night cream with ceramides. Smooths texture, fades dark spots and builds collagen.',
    tipo_piel:['seca','mixta','grasa','nolose'], categoria:'serum',
    concerns:['antiaging','textura','manchas'], sensible:false,
    momento:'pm', score_base:79,
    ingredientes:['retinol','ceramide','squalane'],
    risk:['pm_only','start_slow','no_pregnant','spf_required'], fit:['seca_antiaging','mixta_manchas'],
    subcategoria:'serum_retinol', nivel_usuario:'intermediate',
    posicion_am:null, posicion_pm:5
  },
  {
    id:'cosrx-retinol-oil', handle:'cosrx-retinol-0-5-oil-anti-aging-serum-with-0-5-retinoid-treatment-for-face',
    nombre:'COSRX Retinol 0.5 Oil',
    precio:'$21.99', precio_num:21.99, badge:'Best Seller', emoji:'💊',
    desc:'0.5% retinol in a squalane-rich oil base. Renews skin, fades fine lines and improves texture overnight.',
    tipo_piel:['seca','mixta','nolose'], categoria:'serum',
    concerns:['antiaging','textura','manchas'], sensible:false,
    momento:'pm', score_base:81,
    ingredientes:['retinol','squalane'],
    risk:['pm_only','no_pregnant','no_beginner','start_slow','spf_required'], fit:['seca_antiaging'],
    subcategoria:'serum_retinol', nivel_usuario:'advanced',
    posicion_am:null, posicion_pm:5
  },
  {
    id:'abib-dark-spot-serum', handle:'abib-glutathiosome-dark-spot-serum-vita-drop-1-69-fl-oz',
    nombre:'Abib Glutathiosome Dark Spot Serum Vita Drop',
    precio:'$38.00', precio_num:38.00, badge:'Best Seller', emoji:'💊',
    desc:'Glutathione + vitamin C encapsulated serum for deep dark spot correction and luminous, even skin tone.',
    tipo_piel:['mixta','seca','grasa','sensible','nolose'], categoria:'serum',
    concerns:['manchas','antiaging','textura'], sensible:true,
    momento:'am', score_base:86,
    ingredientes:['glutathione','vitamin_c_encapsulated','niacinamide'],
    risk:['spf_required'], fit:['mixta_manchas','seca_antiaging','general_glow'],
    subcategoria:'serum_brightening', nivel_usuario:'intermediate',
    posicion_am:4, posicion_pm:null
  },

  /* ── MOISTURIZERS ───────────────────────────────────────────── */
  {
    id:'cosrx-birch-lotion', handle:'cosrx-oil-free-lotion-with-birch-sap-daily-acne-facial-moisturizer-hydrating-moisturizer-for-all-skin-types-3-38-fl-oz-100ml',
    nombre:'COSRX Oil-Free Lotion with Birch Sap',
    precio:'$18.00', precio_num:18.00, badge:'Best Seller', emoji:'🧴',
    desc:'Oil-free gel moisturizer with birch sap. Non-comedogenic hydration for oily and acne-prone skin.',
    tipo_piel:['grasa','mixta','nolose'], categoria:'moisturizer',
    concerns:['acne','poros','deshidratacion'], sensible:true,
    momento:'both', score_base:82,
    ingredientes:['birch_sap','niacinamide','salicylic_acid'],
    risk:[], fit:['grasa_acne','grasa_poros'],
    subcategoria:'moisturizer_gel', nivel_usuario:'beginner',
    posicion_am:6, posicion_pm:7
  },
  {
    id:'dearklairs-calming-cream', handle:'dearklairs-midnight-blue-calming-cream-2oz',
    nombre:'DearKlairs Midnight Blue Calming Cream',
    precio:'$21.00', precio_num:21.00, badge:'Best Seller', emoji:'🧴',
    desc:'Guaiazulene + centella cream that reduces active redness and repairs the barrier. The go-to for reactive skin.',
    tipo_piel:['sensible','mixta','seca','nolose'], categoria:'moisturizer',
    concerns:['rojeces','deshidratacion','acne'], sensible:true,
    momento:'both', score_base:88,
    ingredientes:['guaiazulene','centella_asiatica','ectoin'],
    risk:[], fit:['sensible_rojeces','mixta_general','seca_hidratacion'],
    subcategoria:'moisturizer_barrier', nivel_usuario:'beginner',
    posicion_am:6, posicion_pm:7
  },
  {
    id:'skin1004-soothing-cream', handle:'skin1004-madagascar-centella-soothing-cream-2-53-fl-oz-75ml',
    nombre:'SKIN1004 Madagascar Centella Soothing Cream',
    precio:'$18.00', precio_num:18.00, badge:'Best Seller', emoji:'🧴',
    desc:'Pure centella cream that calms sensitised skin, repairs the barrier and locks in long-lasting hydration.',
    tipo_piel:['sensible','mixta','seca','nolose'], categoria:'moisturizer',
    concerns:['rojeces','deshidratacion','antiaging'], sensible:true,
    momento:'both', score_base:85,
    ingredientes:['centella_asiatica','madecassoside','ceramide'],
    risk:[], fit:['sensible_rojeces','seca_hidratacion'],
    subcategoria:'moisturizer_barrier', nivel_usuario:'beginner',
    posicion_am:6, posicion_pm:7
  },
  {
    id:'pyunkang-moisture-cream', handle:'pyunkang-yul-moisture-cream-3-4-fl-oz',
    nombre:'Pyunkang Yul Moisture Cream',
    precio:'$28.00', precio_num:28.00, badge:'Best Seller', emoji:'🧴',
    desc:'Minimal-ingredient barrier cream with shea butter and jojoba oil. Intensely nourishes dry and damaged skin.',
    tipo_piel:['seca','sensible','mixta','nolose'], categoria:'moisturizer',
    concerns:['deshidratacion','rojeces','antiaging'], sensible:true,
    momento:'both', score_base:87,
    ingredientes:['shea_butter','jojoba_oil','ceramide'],
    risk:[], fit:['seca_hidratacion','sensible_rojeces','seca_antiaging'],
    subcategoria:'moisturizer_cream', nivel_usuario:'beginner',
    posicion_am:6, posicion_pm:7
  },
  {
    id:'cosrx-snail-moisturizer', handle:'cosrx-snail-mucin-92-face-moisturizer-3-52-oz',
    nombre:'COSRX Snail Mucin 92% Face Moisturizer',
    precio:'$24.00', precio_num:24.00, badge:'Best Seller', emoji:'🧴',
    desc:'92% snail secretion lightweight cream. Repairs, hydrates and brightens — ideal for dry and dull skin.',
    tipo_piel:['seca','mixta','sensible','nolose'], categoria:'moisturizer',
    concerns:['deshidratacion','manchas','antiaging','rojeces'], sensible:true,
    momento:'both', score_base:86,
    ingredientes:['snail_mucin','ceramide','hyaluronic_acid'],
    risk:[], fit:['seca_hidratacion','general_glow','mixta_manchas'],
    subcategoria:'moisturizer_barrier', nivel_usuario:'beginner',
    posicion_am:6, posicion_pm:7
  },
  {
    id:'tirtir-ceramide-cream', handle:'tirtir-natural-ceramide-cream-deep-moisturizer-for-glass-skin',
    nombre:'TIRTIR Natural Ceramide Cream',
    precio:'$28.00', precio_num:28.00, badge:null, emoji:'🧴',
    desc:'Ceramide-rich deep moisturizer for glass skin. Strengthens the barrier, soothes and delivers all-day hydration.',
    tipo_piel:['seca','mixta','sensible','nolose'], categoria:'moisturizer',
    concerns:['deshidratacion','antiaging','rojeces'], sensible:true,
    momento:'both', score_base:84,
    ingredientes:['ceramide_np','ceramide_ap','ceramide_eop','hyaluronic_acid'],
    risk:[], fit:['seca_hidratacion','seca_antiaging','sensible_rojeces'],
    subcategoria:'moisturizer_barrier', nivel_usuario:'beginner',
    posicion_am:6, posicion_pm:7
  },
  {
    id:'medicube-zero-pore-cream', handle:'zero-pore-one-day-cream',
    nombre:'Medicube Zero Pore One-Day Cream',
    precio:'$32.00', precio_num:32.00, badge:'Best Seller', emoji:'🧴',
    desc:'Niacinamide + salicylic acid cream that tightens pores, controls sebum and hydrates — all in one step.',
    tipo_piel:['grasa','mixta','nolose'], categoria:'moisturizer',
    concerns:['poros','acne','deshidratacion'], sensible:true,
    momento:'both', score_base:83,
    ingredientes:['niacinamide','salicylic_acid','hyaluronic_acid'],
    risk:[], fit:['grasa_poros','grasa_acne'],
    subcategoria:'moisturizer_oil_free', nivel_usuario:'beginner',
    posicion_am:6, posicion_pm:7
  },
  {
    id:'numbuzin-cream', handle:'numbuzin-no-4-cream-full-nutrient-firming-cream-2-02-fl-oz',
    nombre:'Numbuzin No.4 Full-Nutrient Firming Cream',
    precio:'$34.00', precio_num:34.00, badge:null, emoji:'🧴',
    desc:'Red ginseng + niacinamide firming cream. Revitalises, plumps and improves elasticity for mature or dry skin.',
    tipo_piel:['seca','mixta','nolose'], categoria:'moisturizer',
    concerns:['antiaging','deshidratacion','manchas'], sensible:true,
    momento:'both', score_base:80,
    ingredientes:['red_ginseng','niacinamide','peptide'],
    risk:[], fit:['seca_antiaging','mixta_manchas'],
    subcategoria:'moisturizer_cream', nivel_usuario:'intermediate',
    posicion_am:6, posicion_pm:7
  },

  /* ── SPF ────────────────────────────────────────────────────── */
  {
    id:'beauty-joseon-spf', handle:'beauty-of-joseon-relief-sun-rice-probiotics-spf50-pa-50ml',
    nombre:'Beauty of Joseon Relief Sun: Rice + Probiotics SPF50+',
    precio:'$16.00', precio_num:16.00, badge:'Best Seller', emoji:'☀️',
    desc:'The most beloved K-Beauty SPF. Rice extract + probiotics, zero white cast, deeply calming for sensitive skin.',
    tipo_piel:['grasa','mixta','sensible','seca','nolose'], categoria:'spf',
    concerns:['manchas','rojeces','deshidratacion'], sensible:true,
    momento:'am', score_base:93,
    ingredientes:['rice_extract','probiotics','zinc_oxide'],
    risk:['am_only'], fit:['sensible_rojeces','general_glow','grasa_acne','mixta_manchas'],
    subcategoria:'spf_mineral', nivel_usuario:'beginner',
    posicion_am:7, posicion_pm:null
  },
  {
    id:'haruharu-mineral-spf', handle:'haruharu-wonder-black-rice-pure-mineral-relief-daily-sunscreen-spf50-pa-50ml-1-69fl-oz',
    nombre:'Haruharu Wonder Black Rice Pure Mineral Sunscreen SPF50+',
    precio:'$22.00', precio_num:22.00, badge:'Best Seller', emoji:'☀️',
    desc:'Reef-safe mineral SPF50+ with black rice and niacinamide. Anti-pollution, anti-pigmentation, sensitive-skin safe.',
    tipo_piel:['sensible','seca','mixta','nolose'], categoria:'spf',
    concerns:['manchas','rojeces','deshidratacion'], sensible:true,
    momento:'am', score_base:88,
    ingredientes:['black_rice','niacinamide','titanium_dioxide','zinc_oxide'],
    risk:['am_only'], fit:['sensible_rojeces','seca_hidratacion','mixta_manchas'],
    subcategoria:'spf_mineral', nivel_usuario:'beginner',
    posicion_am:7, posicion_pm:null
  },
  {
    id:'abib-sunstick', handle:'abib-airy-sunstick-protection-bar-broad-spectrum-spf50-0-81-oz-23-g-semi-matte',
    nombre:'Abib Airy Sunstick Protection Bar SPF50+',
    precio:'$22.00', precio_num:22.00, badge:'Best Seller', emoji:'☀️',
    desc:'Hybrid SPF50+ stick with ceramides and peptides. Semi-matte finish — no white cast, makeup-friendly.',
    tipo_piel:['grasa','mixta','nolose'], categoria:'spf',
    concerns:['manchas','acne','poros'], sensible:true,
    momento:'am', score_base:85,
    ingredientes:['ceramide','peptide','hybrid_filter'],
    risk:['am_only'], fit:['grasa_acne','grasa_poros','mixta_manchas'],
    subcategoria:'spf_hybrid', nivel_usuario:'beginner',
    posicion_am:7, posicion_pm:null
  },
  {
    id:'purito-spf', handle:'purito-sun-day-adventure-korean-sunscreen-50ml-1-69-fl-oz',
    nombre:'PURITO Sun Day Adventure Sunscreen SPF50+',
    precio:'$18.00', precio_num:18.00, badge:'Best Seller', emoji:'☀️',
    desc:'Hybrid SPF50+ that is oil-free and non-comedogenic. Smooth texture that works perfectly under makeup.',
    tipo_piel:['grasa','mixta','sensible','nolose'], categoria:'spf',
    concerns:['acne','poros','manchas'], sensible:true,
    momento:'am', score_base:84,
    ingredientes:['hybrid_filter','centella','oil_free'],
    risk:['am_only'], fit:['grasa_acne','grasa_poros','sensible_rojeces'],
    subcategoria:'spf_hybrid', nivel_usuario:'beginner',
    posicion_am:7, posicion_pm:null
  },
  {
    id:'haruharu-airyfit-spf', handle:'haruharu-wonder-black-rice-moisture-airyfit-daily-sunscreen-50ml-1-69fl-oz',
    nombre:'Haruharu Wonder Black Rice Moisture Airyfit Sunscreen',
    precio:'$24.00', precio_num:24.00, badge:'Best Seller', emoji:'☀️',
    desc:'Antioxidant-rich black rice SPF50+ with niacinamide. Fragrance-free, ultra-light finish for sensitive skin.',
    tipo_piel:['sensible','seca','mixta','nolose'], categoria:'spf',
    concerns:['manchas','rojeces','deshidratacion'], sensible:true,
    momento:'am', score_base:87,
    ingredientes:['black_rice','niacinamide','hybrid_filter'],
    risk:['am_only'], fit:['sensible_rojeces','seca_hidratacion','general_glow'],
    subcategoria:'spf_hybrid', nivel_usuario:'beginner',
    posicion_am:7, posicion_pm:null
  },
  {
    id:'dalba-spf', handle:'dalba-piedmont-waterfull-tone-up-sunscreen-serum-broad-spectrum-spf-50-1-7fl-oz',
    nombre:"d'Alba Waterfull Tone-Up Sunscreen Serum SPF50+",
    precio:'$28.00', precio_num:28.00, badge:'Best Seller', emoji:'☀️',
    desc:'Hybrid sunscreen-serum with white truffle. Tone-up effect, dewy glow finish — perfect base for makeup.',
    tipo_piel:['seca','mixta','nolose'], categoria:'spf',
    concerns:['manchas','deshidratacion','textura'], sensible:true,
    momento:'am', score_base:82,
    ingredientes:['white_truffle','niacinamide','hybrid_filter'],
    risk:['am_only'], fit:['general_glow','seca_antiaging','mixta_manchas'],
    subcategoria:'spf_hybrid', nivel_usuario:'beginner',
    posicion_am:7, posicion_pm:null
  },

  /* ── MASKS ──────────────────────────────────────────────────── */
  {
    id:'cosrx-snail-mask', handle:'cosrx-advanced-snail-mucin-glass-glow-hydrogel-face-masks-skincare-3-ea',
    nombre:'COSRX Advanced Snail Mucin Glass Glow Hydrogel Masks',
    precio:'$12.00', precio_num:12.00, badge:null, emoji:'🩵',
    desc:'Snail mucin hydrogel masks for glass skin. 25% snail secretion + collagen for deep hydration and brightening.',
    tipo_piel:['grasa','mixta','seca','sensible','nolose'], categoria:'mask',
    concerns:['deshidratacion','manchas','antiaging'], sensible:true,
    momento:'pm', score_base:82,
    ingredientes:['snail_mucin','collagen','hyaluronic_acid'],
    risk:[], fit:['general_glow','seca_hidratacion','mixta_manchas'],
    subcategoria:'mask_sheet', nivel_usuario:'beginner',
    posicion_am:null, posicion_pm:6
  },
  {
    id:'vt-soothing-mask', handle:'vt-cosmetics-daily-soothing-mask-30ea-facial-sheet-mask-for-moist-hydrating',
    nombre:'VT Cosmetics Daily Soothing Mask (30 sheets)',
    precio:'$29.00', precio_num:29.00, badge:'Best Seller', emoji:'🩵',
    desc:'Daily centella sheet mask for instant hydration and soothing. Non-sticky, fast-absorbing ampoule essence.',
    tipo_piel:['sensible','mixta','seca','nolose'], categoria:'mask',
    concerns:['deshidratacion','rojeces','textura'], sensible:true,
    momento:'pm', score_base:88,
    ingredientes:['centella_asiatica','hyaluronic_acid','panthenol'],
    risk:[], fit:['sensible_rojeces','seca_hidratacion','mixta_general'],
    subcategoria:'mask_sheet', nivel_usuario:'beginner',
    posicion_am:null, posicion_pm:6
  },
  {
    id:'pyunkang-mask', handle:'pyunkang-yul-highly-moisturizing-mask-pack-10-pcs',
    nombre:'Pyunkang Yul Highly Moisturizing Mask Pack',
    precio:'$14.00', precio_num:14.00, badge:null, emoji:'🩵',
    desc:'10-pack ceramide + hyaluronic acid sheet mask for dry, sensitised skin. Fragrance-free, dermatologist tested.',
    tipo_piel:['seca','sensible','mixta','nolose'], categoria:'mask',
    concerns:['deshidratacion','rojeces','antiaging'], sensible:true,
    momento:'pm', score_base:80,
    ingredientes:['ceramide','hyaluronic_acid','panthenol'],
    risk:[], fit:['seca_hidratacion','sensible_rojeces'],
    subcategoria:'mask_sheet', nivel_usuario:'beginner',
    posicion_am:null, posicion_pm:6
  },
  {
    id:'abib-overnight-mask', handle:'abib-rice-probiotics-overnight-mask-barrier-jelly-2-7-fl-oz',
    nombre:'Abib Rice Probiotics Overnight Mask Barrier Jelly',
    precio:'$26.00', precio_num:26.00, badge:'Best Seller', emoji:'🩵',
    desc:'Overnight jelly sleeping mask with rice probiotics. Wakes up skin radiant, plump and barrier-strong.',
    tipo_piel:['seca','mixta','nolose'], categoria:'mask',
    concerns:['deshidratacion','manchas','antiaging'], sensible:true,
    momento:'pm', score_base:85,
    ingredientes:['rice_probiotics','hyaluronic_acid','niacinamide'],
    risk:[], fit:['seca_hidratacion','mixta_manchas','general_glow'],
    subcategoria:'mask_sleeping', nivel_usuario:'beginner',
    posicion_am:null, posicion_pm:8
  },
  {
    id:'medicube-clay-mask', handle:'medicube-zero-pore-blackhead-mud-facial-mask-3-52-oz',
    nombre:'Medicube Zero Pore Blackhead Mud Facial Mask',
    precio:'$24.00', precio_num:24.00, badge:'Best Seller', emoji:'🩵',
    desc:'AHA + BHA + PHA clay mask that deep-cleans pores and removes blackheads in 3 minutes.',
    tipo_piel:['grasa','mixta','nolose'], categoria:'mask',
    concerns:['acne','poros','textura'], sensible:false,
    momento:'pm', score_base:83,
    ingredientes:['aha','bha','pha','kaolin_clay'],
    risk:['start_slow','spf_required'], fit:['grasa_acne','grasa_poros'],
    subcategoria:'mask_clay', nivel_usuario:'intermediate',
    posicion_am:null, posicion_pm:6
  },

  /* ── EYE CARE ───────────────────────────────────────────────── */
  {
    id:'medicube-eye-serum', handle:'medicube-salmon-dna-pdrn-pink-peptide-eye-serum-with-niacinamide-and-99-purity-retinol-1-01fl-oz',
    nombre:'Medicube Salmon DNA PDRN Pink Peptide Eye Serum',
    precio:'$38.00', precio_num:38.00, badge:'Best Seller', emoji:'👁️',
    desc:'PDRN + peptide + retinol eye serum that brightens dark circles, firms and reduces fine lines around the eyes.',
    tipo_piel:['seca','mixta','nolose'], categoria:'eye',
    concerns:['antiaging','manchas','deshidratacion'], sensible:true,
    momento:'pm', score_base:86,
    ingredientes:['pdrn','peptide','retinol'],
    risk:['pm_only','no_pregnant'], fit:['seca_antiaging','mixta_manchas'],
    subcategoria:'eye_serum', nivel_usuario:'intermediate',
    posicion_am:null, posicion_pm:6
  },
  {
    id:'haruharu-eye-cream', handle:'haruharu-wonder-black-rice-bakuchiol-eye-cream-0-67-fl-oz-20ml-anti-aging-wrinkle-care-natural-retinol-alternative-cruelty-free-ewg-green',
    nombre:'Haruharu Wonder Black Rice Bakuchiol Eye Cream',
    precio:'$28.00', precio_num:28.00, badge:'Best Seller', emoji:'👁️',
    desc:'Natural retinol-alternative bakuchiol eye cream. Firms, brightens dark circles and reduces fine lines gently.',
    tipo_piel:['seca','mixta','sensible','nolose'], categoria:'eye',
    concerns:['antiaging','manchas','deshidratacion'], sensible:true,
    momento:'pm', score_base:84,
    ingredientes:['bakuchiol','black_rice','collagen'],
    risk:[], fit:['seca_antiaging','sensible_rojeces','mixta_manchas'],
    subcategoria:'eye_cream', nivel_usuario:'beginner',
    posicion_am:5, posicion_pm:6
  },
  {
    id:'beauty-joseon-eye-serum', handle:'beauty-of-joseon-revive-eye-serum-with-retinal-niacinamide-correction-for-puffy-eye-bags-fine-lines-dark-circles-wrinkles-korean-skin-care-30ml-1-fl-oz',
    nombre:'Beauty of Joseon Revive Eye Serum: Retinal + Niacinamide',
    precio:'$22.00', precio_num:22.00, badge:'Best Seller', emoji:'👁️',
    desc:'Retinal + niacinamide eye serum for dark circles, puffiness and fine lines. Results from week 2.',
    tipo_piel:['seca','mixta','nolose'], categoria:'eye',
    concerns:['antiaging','manchas','deshidratacion'], sensible:true,
    momento:'pm', score_base:87,
    ingredientes:['retinal','niacinamide','peptide'],
    risk:['pm_only','no_pregnant'], fit:['seca_antiaging','mixta_manchas'],
    subcategoria:'eye_serum', nivel_usuario:'advanced',
    posicion_am:null, posicion_pm:6
  },
  {
    id:'goodal-eye-patch', handle:'goodal-green-tangerine-vitamin-c-moisturizing-eye-patch-5-minute-hydrating-gel-patch-60-sheets',
    nombre:'Goodal Green Tangerine Vitamin C Eye Patches (60 sheets)',
    precio:'$22.00', precio_num:22.00, badge:'Best Seller', emoji:'👁️',
    desc:'5-minute vitamin C hydrogel eye patches that brighten dark circles, firm and instantly plump the eye area.',
    tipo_piel:['grasa','mixta','seca','sensible','nolose'], categoria:'eye',
    concerns:['manchas','antiaging','deshidratacion'], sensible:true,
    momento:'am', score_base:80,
    ingredientes:['vitamin_c','hyaluronic_acid','green_tangerine'],
    risk:[], fit:['mixta_manchas','general_glow','seca_antiaging'],
    subcategoria:'eye_patch', nivel_usuario:'beginner',
    posicion_am:5, posicion_pm:null
  }
];


/* ============================================================
   5. SKIN PROFILES
   Defines routine steps per profile.
   Products are found dynamically — nothing is hardcoded here.
   v5.0: Each profile now has a `hero_product` ID from Excel
         and expanded `pasos` with subcategoria hints.
============================================================ */
const SHATOKB_PERFILES = {
  grasa_acne: {
    titulo: 'The Oily Skin Overachiever',
    descripcion: "Your skin works overtime — producing more oil than it needs, which clogs pores and keeps breakouts coming back. The good news? K-Beauty was practically invented for this. These routines don't just mask the problem. They retrain your skin.",
    resumen: ['🫧 Oily & breakout-prone', '🎯 Active treatment', '⚡ Fast visible results'],
    hero_product: 'cosrx-low-ph-cleanser',
    pasos: [
      { categoria: 'cleanser',    nombre: 'Cleanser',          subcategoria_pref: 'cleanser_gel', por_que: 'A low pH cleanser removes oil and impurities without triggering more sebum production. Your pores can finally breathe.' },
      { categoria: 'toner',       nombre: 'Exfoliating Toner', subcategoria_pref: 'toner_exfoliating', por_que: 'AHA/BHA dissolves the sebum trapped inside pores. This is the step most people skip — and the one that makes the biggest difference.' },
      { categoria: 'moisturizer', nombre: 'Moisturizer',       subcategoria_pref: 'moisturizer_oil_free', por_que: 'Skipping moisturizer makes oily skin produce even more oil. A lightweight, non-comedogenic formula tells your skin to stop overcompensating.' },
      { categoria: 'spf',         nombre: 'SPF 50+',           subcategoria_pref: 'spf_hybrid', por_que: "Non-negotiable. Your acne-fighting actives make skin photosensitive — skipping SPF undoes everything else you're doing." }
    ]
  },
  grasa_poros: {
    titulo: 'The Pore Minimizer',
    descripcion: "Enlarged pores aren't just genetic — they're caused by excess oil and dead skin cells stretching them out over time. Korean chemical exfoliation is the most effective method in the world for gradually refining pore appearance. And it works.",
    resumen: ['🫧 Oily skin', '🔬 Visible pores', '✨ Texture refinement'],
    hero_product: 'medicube-zero-pore-cream',
    pasos: [
      { categoria: 'cleanser',    nombre: 'Cleanser',          subcategoria_pref: 'cleanser_foam', por_que: "Clears away the oil that keeps pores stretched and clogged — without sending your sebaceous glands into overdrive." },
      { categoria: 'toner',       nombre: 'Exfoliating Toner', subcategoria_pref: 'toner_exfoliating', por_que: "This is where the magic happens. AHA/BHA acids break down the buildup inside pores. Weekly use visibly shrinks them." },
      { categoria: 'serum',       nombre: 'Niacinamide Serum', subcategoria_pref: 'serum_niacinamide', por_que: 'Niacinamide at 10-15% visibly minimises pore appearance and regulates sebum in 2 weeks of consistent use.' },
      { categoria: 'moisturizer', nombre: 'Moisturizer',       subcategoria_pref: 'moisturizer_gel', por_que: "Light hydration locks in your routine's results without adding weight or blocking pores." },
      { categoria: 'spf',         nombre: 'SPF 50+',           subcategoria_pref: 'spf_hybrid', por_que: 'An oil-free formula keeps you matte all day. UV damage worsens pore appearance — SPF stops that from happening.' }
    ]
  },
  mixta_general: {
    titulo: 'The Balancing Act',
    descripcion: "Combination skin is tricky because it has contradictory needs in different zones. Products that fix one area often make another worse. K-Beauty's layering method solves this — you hydrate where you need it and control where you don't.",
    resumen: ['☯️ Combination skin', '💧 Needs balance', '🎯 Zone-specific results'],
    hero_product: 'cosrx-snail-essence',
    pasos: [
      { categoria: 'cleanser',    nombre: 'Cleanser',        subcategoria_pref: 'cleanser_foam', por_que: 'Gently cleanses without drying out your cheeks or over-stimulating the T-zone. Balance starts here.' },
      { categoria: 'toner',       nombre: 'Hydrating Toner', subcategoria_pref: 'toner_hydrating', por_que: 'Hydration delivered in layers absorbs evenly across all zones — no greasy patches, no tight areas.' },
      { categoria: 'essence',     nombre: 'Essence',         subcategoria_pref: 'essence_treatment', por_que: "The K-Beauty secret weapon. Replenishes moisture where it's needed while keeping oily areas in check." },
      { categoria: 'spf',         nombre: 'SPF 50+',         subcategoria_pref: 'spf_hybrid', por_que: 'Daily sun protection without the greasy residue. Your skin stays balanced all day.' }
    ]
  },
  mixta_manchas: {
    titulo: 'The Spot Eraser',
    descripcion: "You're fighting two battles at once — excess sebum and hyperpigmentation. The breakthrough? Korean brightening actives like vitamin C, niacinamide and tranexamic acid work on both simultaneously. Your even tone is closer than you think.",
    resumen: ['☯️ Combination skin', '🟤 Dark spots & marks', '✨ Even tone incoming'],
    hero_product: 'anua-niacinamide-serum',
    pasos: [
      { categoria: 'cleanser', nombre: 'Cleanser',          subcategoria_pref: 'cleanser_balm', por_que: 'A clean, pH-balanced canvas ensures your brightening actives penetrate deeply instead of sitting on top of dead skin.' },
      { categoria: 'serum',    nombre: 'Brightening Serum', subcategoria_pref: 'serum_brightening', por_que: 'Vitamin C in the morning is the gold standard for fading spots and blocking future pigmentation. This step changes faces.' },
      { categoria: 'essence',  nombre: 'Essence',           subcategoria_pref: 'essence_treatment', por_que: 'Accelerates cell renewal and progressively evens out skin tone from layer one.' },
      { categoria: 'spf',      nombre: 'SPF 50+',           subcategoria_pref: 'spf_hybrid', por_que: "Without SPF, your brightening actives are fighting a losing battle. UV exposure is the #1 cause of new dark spots." }
    ]
  },
  seca_hidratacion: {
    titulo: 'The Deep Hydration Protocol',
    descripcion: "Your skin is thirsty at a cellular level — and a single moisturizer isn't enough. K-Beauty invented layered hydration for exactly this: you build water content from the deepest layer outward, locking each one in before adding the next. The result is skin that stays plump for hours.",
    resumen: ['🌵 Dry skin', '💧 Hydration is everything', '🛡️ Barrier restoration'],
    hero_product: 'cosrx-snail-essence',
    pasos: [
      { categoria: 'cleanser',    nombre: 'Cleanser',        subcategoria_pref: 'cleanser_foam', por_que: "A sulfate-free, creamy formula cleanses without stealing the little moisture your skin has left. Never skip this." },
      { categoria: 'toner',       nombre: 'Hydrating Toner', subcategoria_pref: 'toner_hydrating', por_que: 'First layer of water. Apply while your face is still slightly damp — absorption increases by 40%.' },
      { categoria: 'essence',     nombre: 'Essence',         subcategoria_pref: 'essence_barrier', por_que: "Second layer. This is where K-Beauty separates itself. The essence penetrates deeper than a moisturizer ever could." },
      { categoria: 'moisturizer', nombre: 'Moisturizer',     subcategoria_pref: 'moisturizer_cream', por_que: 'Seals everything in. Without this final step, all that hydration evaporates within the hour.' },
      { categoria: 'spf',         nombre: 'SPF 50+',         subcategoria_pref: 'spf_mineral', por_que: 'A hydrating SPF with a dewy finish adds one last layer of protection. UV damage is the #1 cause of skin dryness.' }
    ]
  },
  seca_antiaging: {
    titulo: 'The Age-Defying Ritual',
    descripcion: "Dry skin ages faster — that's not an opinion, it's biology. When your barrier is weakened, collagen breaks down faster and fine lines deepen. The solution is intense, consistent hydration paired with proven actives. K-Beauty does this better than anything else in the world.",
    resumen: ['🌵 Dry skin', '⏳ Anti-aging focus', '🔬 Clinically proven actives'],
    hero_product: 'haruharu-eye-cream',
    pasos: [
      { categoria: 'cleanser',    nombre: 'Cleanser',        subcategoria_pref: 'cleanser_foam', por_que: "Sulfate-free is non-negotiable for you. Harsh cleansers accelerate aging by stripping your skin's natural lipid barrier." },
      { categoria: 'toner',       nombre: 'Hydrating Toner', subcategoria_pref: 'toner_hydrating', por_que: 'Preps skin before actives. Hydrated skin absorbs serums more effectively — this step multiplies everything that comes after.' },
      { categoria: 'serum',       nombre: 'Active Serum',    subcategoria_pref: 'serum_vitamin_c', por_que: 'Vitamin C (morning) brightens and protects. Retinol (evening) rebuilds collagen from within. Two serums. Transformative results.' },
      { categoria: 'eye',         nombre: 'Eye Treatment',   subcategoria_pref: 'eye_cream', por_que: 'The eye area has the thinnest skin on the face. Targeted treatment here slows fine lines and dark circles faster than any other step.' },
      { categoria: 'moisturizer', nombre: 'Moisturizer',     subcategoria_pref: 'moisturizer_cream', por_que: 'Rich, barrier-repairing hydration. While you sleep, your skin repairs itself — this gives it everything it needs to do that.' },
      { categoria: 'spf',         nombre: 'SPF 50+',         subcategoria_pref: 'spf_hybrid', por_que: 'UV damage is responsible for 90% of visible aging. This one step protects all the work everything else is doing.' }
    ]
  },
  sensible_rojeces: {
    titulo: 'The Calm-Down Routine',
    descripcion: "Your skin isn't high-maintenance — it's just been treated with the wrong products. Most skincare is too aggressive for reactive skin. K-Beauty's calming philosophy was built around ingredients like Centella asiatica, panthenol and mugwort — gentle enough for the most sensitive skin, powerful enough to actually repair it.",
    resumen: ['🌸 Sensitive & reactive', '🔴 Redness relief', '🛡️ Barrier repair mode'],
    hero_product: 'skin1004-centella-ampoule',
    pasos: [
      { categoria: 'cleanser',    nombre: 'Cleanser',      subcategoria_pref: 'cleanser_foam', por_que: 'Fragrance-free, SLS-free, minimal ingredients. Every unnecessary ingredient is a potential trigger — this step removes all of them.' },
      { categoria: 'toner',       nombre: 'Calming Toner', subcategoria_pref: 'toner_calming', por_que: 'Alcohol-free, centella or aloe-based. Cools down redness on contact and starts repairing your skin barrier immediately.' },
      { categoria: 'serum',       nombre: 'Calming Serum', subcategoria_pref: 'serum_calming', por_que: "Centella asiatica is Korea's #1 skin-calming ingredient. Clinical studies show 70% redness reduction in 4 weeks of consistent use." },
      { categoria: 'moisturizer', nombre: 'Repair Cream',  subcategoria_pref: 'moisturizer_barrier', por_que: 'A stronger barrier means less reactivity. Every time you use this, your skin gets a little tougher — in the best possible way.' },
      { categoria: 'spf',         nombre: 'SPF 50+',       subcategoria_pref: 'spf_mineral', por_que: 'Mineral (physical) sunscreens sit on top of the skin instead of being absorbed — far gentler for reactive skin types.' }
    ]
  },
  general_glow: {
    titulo: 'The Glow Starter Kit',
    descripcion: "You don't need an 18-step routine to get results. You need the right products, in the right order, for your skin. This is the routine that introduces your skin to K-Beauty — and once you feel the difference, you'll never go back.",
    resumen: ['✨ Glow is the goal', '💧 Hydration first', '🌟 Simple but powerful'],
    hero_product: 'beauty-joseon-spf',
    pasos: [
      { categoria: 'cleanser',    nombre: 'Cleanser',    subcategoria_pref: 'cleanser_balm', por_que: "Every great routine starts with a clean canvas. The right cleanser doesn't just clean — it sets the pH your other products need to work." },
      { categoria: 'essence',     nombre: 'Essence',     subcategoria_pref: 'essence_treatment', por_que: "The step that makes K-Beauty different from everything else. One bottle of snail mucin or fermented yeast changed millions of people's skin. It will change yours." },
      { categoria: 'moisturizer', nombre: 'Moisturizer', subcategoria_pref: 'moisturizer_barrier', por_que: 'Locks in everything. Keeps your barrier intact. Gives you that "I just woke up like this" glow that lasts all day.' },
      { categoria: 'spf',         nombre: 'SPF 50+',     subcategoria_pref: 'spf_hybrid', por_que: "If you're only going to do one thing for your skin, make it SPF. It's the single most powerful anti-aging, anti-damage step in existence." }
    ]
  }
};


/* ============================================================
   6. INGREDIENT INTEL  v5.0
   Conflict/synergy matrix from Shato_Skin_OS_Master_Project.xlsx
============================================================ */

const SHATOKB_INGREDIENT_CONFLICTS = {
  'retinol':          ['l_ascorbic_acid','vitamin_c','aha','bha','glycolic_acid','benzoyl_peroxide'],
  'retinal':          ['l_ascorbic_acid','vitamin_c','aha','bha','glycolic_acid'],
  'l_ascorbic_acid':  ['niacinamide'],
  'aha':              ['retinol','retinal','benzoyl_peroxide'],
  'glycolic_acid':    ['retinol','retinal'],
  'bha':              ['retinol','retinal'],
  'salicylic_acid':   ['retinol','retinal'],
  'benzoyl_peroxide': ['retinol','l_ascorbic_acid','vitamin_c'],
};

const SHATOKB_INGREDIENT_SYNERGIES = {
  'l_ascorbic_acid':       ['vitamin_e','ferulic_acid','hyaluronic_acid'],
  'vitamin_c':             ['vitamin_e','ferulic_acid'],
  'vitamin_c_encapsulated':['niacinamide','hyaluronic_acid'],
  'retinol':               ['ceramide','squalane','peptide','hyaluronic_acid'],
  'retinal':               ['niacinamide','ceramide','peptide'],
  'niacinamide':           ['zinc','hyaluronic_acid','centella','centella_asiatica'],
  'centella_asiatica':     ['panthenol','beta_glucan','hyaluronic_acid','madecassoside'],
  'madecassoside':         ['centella_asiatica','asiaticoside','panthenol'],
  'snail_mucin':           ['hyaluronic_acid','ceramide','glycerin'],
  'fermented_black_rice':  ['probiotics','hyaluronic_acid'],
  'pdrn':                  ['peptide','hyaluronic_acid'],
  'alpha_arbutin':         ['niacinamide','vitamin_c_encapsulated','hyaluronic_acid'],
  'azelaic_acid':          ['hyaluronic_acid','niacinamide','centella_asiatica'],
  'bakuchiol':             ['hyaluronic_acid','peptide','niacinamide'],
};

function shatokbSynergyBonus(prod, otherProds) {
  const ings = prod.ingredientes || [];
  let bonus = 0;
  for (const other of otherProds) {
    const otherIngs = other.ingredientes || [];
    for (const ing of ings) {
      const syn = SHATOKB_INGREDIENT_SYNERGIES[ing] || [];
      for (const s of syn) {
        if (otherIngs.includes(s)) bonus += 3;
      }
    }
  }
  return Math.min(bonus, 15);
}

function shatokbDetectarConflictos(pasosProd) {
  const warnings = [];
  const todos = pasosProd.map(p => p.opciones[0]).filter(Boolean);
  for (let i = 0; i < todos.length; i++) {
    for (let j = i + 1; j < todos.length; j++) {
      const a = todos[i]; const b = todos[j];
      if (!a || !b) continue;
      const ingsA = a.ingredientes || [];
      const ingsB = b.ingredientes || [];
      const conflictos = [];
      for (const ing of ingsA) {
        const cf = SHATOKB_INGREDIENT_CONFLICTS[ing] || [];
        for (const c of cf) { if (ingsB.includes(c)) conflictos.push({ from: ing, to: c }); }
      }
      if (conflictos.length > 0) {
        const ampmSplit = (a.momento === 'am' && b.momento === 'pm') ||
                          (a.momento === 'pm' && b.momento === 'am');
        warnings.push({ prodA: a.nombre, prodB: b.nombre, conflictos, ampmSplit,
          severidad: ampmSplit ? 'info' : 'warning' });
      }
    }
  }
  return warnings;
}


/* ============================================================
   7. SCORING ENGINE  v5.1  —  EXCEL_INTEL INTEGRATED
   
   7a. PROFILE CALCULATOR — maps quiz answers → skin profile ID
   7b. PRODUCT SCORER — multi-layer scoring with Excel intelligence
   
   Score formula (per product candidate):
   ┌─────────────────────────────────────────────────────────┐
   │  BASE LAYER (tag-derived)                               │
   │    score_base       (Excel editorial, 0-100) — floor    │
   │  + tipo_piel        (0–20)                              │
   │  + concern match    (0–32, up to 4 × 8pts)              │
   │  + objetivo match   (0–10, up to 2 × 5pts)              │
   │  + sensibilidad     (±10)                               │
   │  + presupuesto      (±6)                                │
   │  + subcategoria     (+8 if preferred subcat matches)    │
   │  + fit_tags         (+15 if tag-fit matches profile)    │
   │  + nivel_usuario    (+10 match / −10 mismatch)          │
   │  + synergy_bonus    (0–15 ingredient synergies)         │
   │  + risk penalties   (−10 to −20)                        │
   ├─────────────────────────────────────────────────────────┤
   │  EXCEL_INTEL LAYER  v5.1  (NEW — dominant layer)        │
   │  + vector_fit       (dot product 0-6 × 5 = 0–30 pts)   │
   │    Each matched dimension: dry/oily/combo/              │
   │    sensitive/acne/pigmentation → +5 pts each            │
   │  + tier_boost       CORE_MATCH   → +25 pts              │
   │                     GOOD_MATCH   → +10 pts              │
   │                     SECONDARY    →  +0 pts              │
   │  + phase_bonus      user repair phase match → +8 pts   │
   │  - safety_penalty   NO_PREGNANCY + sensitive user → -15 │
   │  - pm_night_penalty pm_only product scored for AM → -10 │
   └─────────────────────────────────────────────────────────┘
   Maximum raw: ~251 pts → normalised to 0-100 in UI display
   
   IMPORTANT: Products not in the EXCEL_INTEL map (score-gated)
   are already filtered out by shatokbMapProduct() before
   reaching the scorer. This scorer only sees the ~107 classified
   facial skincare products.
============================================================ */

// ── 7a. Profile Calculator v6.0 ──────────────────────────────────
/**
 * Maps quiz v6.0 answers → skin profile ID.
 *
 * New fields in v6.0:
 *   r.sensibilidad === 'damaged'      → barrier repair mode
 *   r.ingredient_tolerance            → 'none'|'basic'|'intermediate'|'advanced'
 *   r.preocupacion_secundaria[]       → secondary concerns array
 *   r.tipo_piel === 'normal'          → new skin type (maps to general_glow)
 *   r.objetivo                        → updated goal values (v6.0 labels)
 */
function shatokbCalcularPerfil(resp) {
  const puntos = {};
  Object.keys(SHATOKB_PERFILES).forEach(p => { puntos[p] = 0; });
  const r = resp;

  // ── Tipo de piel ──────────────────────────────────────────────
  if (r.tipo_piel === 'grasa')    { puntos.grasa_acne += 3; puntos.grasa_poros += 3; }
  if (r.tipo_piel === 'mixta')    { puntos.mixta_general += 3; puntos.mixta_manchas += 2; }
  if (r.tipo_piel === 'seca')     { puntos.seca_hidratacion += 3; puntos.seca_antiaging += 2; }
  if (r.tipo_piel === 'sensible') { puntos.sensible_rojeces += 5; }
  if (r.tipo_piel === 'normal')   { puntos.general_glow += 3; puntos.mixta_general += 1; }
  if (r.tipo_piel === 'nolose')   { puntos.general_glow += 3; }

  // ── Primary concern (single value in v6.0) ────────────────────
  const primary = r.preocupacion || '';
  if (primary === 'acne')           { puntos.grasa_acne += 5; }
  if (primary === 'manchas')        { puntos.mixta_manchas += 5; puntos.seca_antiaging += 1; }
  if (primary === 'antiaging')      { puntos.seca_antiaging += 5; }
  if (primary === 'rojeces')        { puntos.sensible_rojeces += 5; }
  if (primary === 'deshidratacion') { puntos.seca_hidratacion += 5; puntos.mixta_general += 2; }
  if (primary === 'textura')        { puntos.grasa_poros += 5; puntos.mixta_general += 2; }

  // ── Secondary concerns (multi-select, max 2) ──────────────────
  const secundarias = Array.isArray(r.preocupacion_secundaria)
    ? r.preocupacion_secundaria.filter(c => c !== 'ninguna')
    : (r.preocupacion_secundaria && r.preocupacion_secundaria !== 'ninguna'
        ? [r.preocupacion_secundaria] : []);

  secundarias.forEach(c => {
    if (c === 'acne')           { puntos.grasa_acne += 2; puntos.grasa_poros += 1; }
    if (c === 'manchas')        { puntos.mixta_manchas += 2; }
    if (c === 'antiaging')      { puntos.seca_antiaging += 2; }
    if (c === 'rojeces')        { puntos.sensible_rojeces += 2; }
    if (c === 'deshidratacion') { puntos.seca_hidratacion += 2; puntos.mixta_general += 1; }
    if (c === 'textura')        { puntos.grasa_poros += 2; puntos.mixta_general += 1; }
  });

  // ── Barrier status — 'damaged' pushes strongly to repair profiles ─
  if (r.sensibilidad === 'damaged') {
    puntos.sensible_rojeces += 5;
    puntos.seca_hidratacion += 2;
  }
  if (r.sensibilidad === 'alta') { puntos.sensible_rojeces += 3; }

  // ── Ingredient tolerance — advanced users pushed to treatment profiles ─
  if (r.ingredient_tolerance === 'advanced') {
    puntos.seca_antiaging  += 2;   // likely ready for retinoids
    puntos.mixta_manchas   += 1;   // likely ready for strong brighteners
  }
  if (r.ingredient_tolerance === 'none') {
    puntos.sensible_rojeces += 1;  // needs gentler route
    puntos.general_glow     += 1;
  }

  // ── Goal (v6.0 values) ────────────────────────────────────────
  const objetivo = r.objetivo || '';
  if (objetivo === 'clear')     { puntos.grasa_acne += 3; puntos.grasa_poros += 2; }
  if (objetivo === 'unificar')  { puntos.mixta_manchas += 3; }
  if (objetivo === 'calmar')    { puntos.sensible_rojeces += 3; }
  if (objetivo === 'antiaging') { puntos.seca_antiaging += 3; }
  if (objetivo === 'glow')      { puntos.general_glow += 3; puntos.seca_hidratacion += 1; }
  if (objetivo === 'controlar') { puntos.grasa_acne += 2; puntos.grasa_poros += 3; }
  // Legacy v5.x goal values (backward compatibility)
  if (objetivo === 'limpiar')   { puntos.grasa_acne += 2; puntos.grasa_poros += 3; }
  if (objetivo === 'hidratar')  { puntos.seca_hidratacion += 3; puntos.mixta_general += 2; }

  let mejor = 'general_glow', max = 0;
  Object.entries(puntos).forEach(([k, v]) => { if (v > max) { max = v; mejor = k; } });
  return mejor;
}

// ── 7b. Product Scorer v6.0 — EXCEL_INTEL + barrier + ingredient_tolerance ──
/**
 * Calculates a relevance score for a product.
 *
 * v6.0 NEW signals on top of v5.1:
 *   barrier_status       — 'damaged' mode: boosts repair products, blocks actives
 *   ingredient_tolerance — 'none'/'basic'/'intermediate'/'advanced':
 *                          gates high-potency products, boosts matched level
 *   preocupacion_secundaria — secondary concerns now also score
 *
 * @param {object}   p               — product from catalogue (with excel_* fields)
 * @param {string}   tipoPiel        — user skin type
 * @param {string[]} preocupaciones  — ALL user concerns (primary + secondary merged)
 * @param {string[]} objetivos       — user goals (array for legacy compat)
 * @param {string}   sensibilidad    — 'baja'|'media'|'alta'|'damaged'
 * @param {string}   presupuesto     — 'bajo'|'medio'|'alto'
 * @param {string}   perfilId        — calculated profile ID
 * @param {string}   [subcategoriaPref] — preferred subcategory for this step
 * @param {object[]} [otrosProductos]   — other top products for synergy calc
 * @param {object}   [respuestas]       — full quiz state for vector build
 * @returns {number} score 0+
 */
function shatokbScoreProducto(p, tipoPiel, preocupaciones, objetivos, sensibilidad, presupuesto, perfilId, subcategoriaPref, otrosProductos, respuestas) {
  let score = p.score_base || 50;

  // Extract v6.0 fields from respuestas if available
  const ingredientTolerance = respuestas?.ingredient_tolerance || 'basic';
  const barrierDamaged      = sensibilidad === 'damaged';
  // For internal logic, treat 'damaged' as 'alta' sensitivity
  const sensibilidadEfectiva = barrierDamaged ? 'alta' : sensibilidad;

  // ╔══════════════════════════════════════════════════════════╗
  // ║  BASE LAYER — tag-derived scoring                        ║
  // ╚══════════════════════════════════════════════════════════╝

  // ── Tipo de piel ─────────────────────────────────────────── (+0–20) ──
  if (p.tipo_piel.includes(tipoPiel))               score += 20;
  else if (tipoPiel === 'normal')                    score += 12;  // normal fits most
  else if (tipoPiel === 'nolose')                    score += 8;
  else if (p.tipo_piel.includes('nolose'))           score += 5;

  // ── Concerns — primary (×8) + secondary (×5) ─────────────── (+0–40) ──
  const primaryConcern    = respuestas?.preocupacion || '';
  const secondaryConcerns = Array.isArray(respuestas?.preocupacion_secundaria)
    ? respuestas.preocupacion_secundaria.filter(c => c !== 'ninguna')
    : [];

  if (primaryConcern && p.concerns.includes(primaryConcern)) score += 8;
  secondaryConcerns.forEach(c => {
    if (p.concerns.includes(c)) score += 5;
  });
  // Legacy: also score from merged preocupaciones array
  preocupaciones.forEach(concern => {
    if (concern !== primaryConcern && !secondaryConcerns.includes(concern)) {
      if (p.concerns.includes(concern)) score += 3;
    }
  });

  // ── Objetivos ────────────────────────────────────────────── (+0–10) ──
  objetivos.forEach(obj => {
    if (p.concerns.includes(obj)) score += 5;
  });

  // ── Sensibilidad ─────────────────────────────────────────── (±12) ────
  if (sensibilidadEfectiva === 'alta') {
    if (p.sensible)  score += 12;
    else             score -= 8;
    const hasHighRisk = p.risk && (p.risk.includes('high_potency') || p.risk.includes('no_beginner'));
    if (hasHighRisk) score -= 8;
  } else if (sensibilidadEfectiva === 'media') {
    if (p.sensible)  score += 5;
    if (p.risk && p.risk.includes('no_beginner')) score -= 4;
  }

  // ── Presupuesto ──────────────────────────────────────────── (±6) ─────
  const BUDGET = { bajo: 40, medio: 80, alto: Infinity };
  const budgetMax = BUDGET[presupuesto] || Infinity;
  if (p.precio_num <= budgetMax) score += 6;
  else                           score -= 5;

  // ── Subcategoría match ───────────────────────────────────── (+8) ─────
  if (subcategoriaPref && p.subcategoria && p.subcategoria === subcategoriaPref) {
    score += 8;
  }

  // ── Fit explícito de tags ────────────────────────────────── (+15) ────
  if (p.fit && p.fit.includes(perfilId)) score += 15;

  // ── Nivel usuario — from ingredient_tolerance (v6.0) ─────── (±12) ───
  // ingredient_tolerance directly maps to nivel_usuario — more precise than
  // inferring from sensitivity in v5.x
  const toleranceToNivel = {
    none: 'beginner', basic: 'beginner',
    intermediate: 'intermediate', advanced: 'advanced',
  };
  const nivelUsuario = toleranceToNivel[ingredientTolerance] || 'intermediate';
  if (p.nivel_usuario) {
    if (p.nivel_usuario === nivelUsuario)                               score += 12;
    else if (p.nivel_usuario === 'advanced' && nivelUsuario === 'beginner') score -= 15;
    else if (p.nivel_usuario === 'beginner' && nivelUsuario === 'advanced') score -= 3;
    else if (p.nivel_usuario === 'intermediate')                        score += 4;
  }

  // ── Synergy bonus ────────────────────────────────────────── (0–15) ──
  if (otrosProductos && otrosProductos.length > 0) {
    score += shatokbSynergyBonus(p, otrosProductos);
  }

  // ── Risk penalties (base) ────────────────────────────────── (−6 a −20) ──
  if (p.risk && p.risk.length > 0) {
    if (p.risk.includes('no_beginner') && nivelUsuario === 'beginner') score -= 15;
    if (p.risk.includes('high_potency') && nivelUsuario === 'beginner') score -= 8;
    if (p.risk.includes('high_potency') && nivelUsuario === 'intermediate') score -= 3;
  }

  // ╔══════════════════════════════════════════════════════════╗
  // ║  BARRIER DAMAGED MODE  v6.0  (new — hard gate)          ║
  // ╚══════════════════════════════════════════════════════════╝
  // When barrier is damaged: heavily boost repair-phase products,
  // heavily penalise treatment-phase actives (AHAs, retinol, etc.)
  if (barrierDamaged) {
    if (p.excel_phase === 'repair')                    score += 18;
    if (p.excel_phase === 'treat')                     score -= 20;
    if (p.excel_phase === 'optimize')                  score -= 25;
    // Hard gate: no_beginner products hidden from damaged barrier users
    if (p.risk && p.risk.includes('no_beginner'))      score -= 20;
    // High-potency actives get extra penalty
    if (p.ingredientes && (
      p.ingredientes.includes('retinol')  ||
      p.ingredientes.includes('retinal')  ||
      p.ingredientes.includes('aha')      ||
      p.ingredientes.includes('glycolic_acid')
    )) score -= 15;
  }

  // ╔══════════════════════════════════════════════════════════╗
  // ║  EXCEL_INTEL LAYER  v6.0  (dominant scoring signals)    ║
  // ╚══════════════════════════════════════════════════════════╝

  if (p.excel_fit && p.excel_tier) {

    // ── Vector dot-product fit score ─────────────────── (+0–30) ──────
    const userVec = (typeof shatokbBuildUserVector === 'function' && respuestas)
      ? shatokbBuildUserVector(respuestas)
      : {
          fit_dry:          tipoPiel === 'seca'    ? 1 : 0,
          fit_oily:         (tipoPiel === 'grasa' || tipoPiel === 'mixta') ? 1 : 0,
          fit_combination:  tipoPiel === 'mixta'   ? 1 : 0,
          fit_sensitive:    (tipoPiel === 'sensible' || sensibilidadEfectiva === 'alta') ? 1 : 0,
          fit_acne:         preocupaciones.includes('acne')    ? 1 : 0,
          fit_pigmentation: preocupaciones.includes('manchas') ? 1 : 0,
        };

    const dotProduct = (typeof shatokbVectorFitScore === 'function')
      ? shatokbVectorFitScore(userVec, p.excel_fit)
      : (
          userVec.fit_dry          * (p.excel_fit.fit_dry          || 0) +
          userVec.fit_oily         * (p.excel_fit.fit_oily         || 0) +
          userVec.fit_combination  * (p.excel_fit.fit_combination  || 0) +
          userVec.fit_sensitive    * (p.excel_fit.fit_sensitive    || 0) +
          userVec.fit_acne         * (p.excel_fit.fit_acne         || 0) +
          userVec.fit_pigmentation * (p.excel_fit.fit_pigmentation || 0)
        );
    score += dotProduct * 5;

    // ── Tier boost ────────────────────────────────────────────────────
    if      (p.excel_tier === 'CORE_MATCH')  score += 25;
    else if (p.excel_tier === 'GOOD_MATCH')  score += 10;

    // ── Phase coherence bonus ─────────────────────────────── (+8) ────
    if (p.excel_phase === 'repair' && (sensibilidadEfectiva === 'alta' || tipoPiel === 'sensible')) {
      score += 8;
    }
    if (p.excel_phase === 'treat' && preocupaciones.length >= 2 && !barrierDamaged) {
      score += 4;
    }

    // ── Safety penalty ────────────────────────────────────── (−4 to −15) ──
    if (p.excel_safety === 'NO_PREGNANCY') {
      if (sensibilidadEfectiva === 'alta' || tipoPiel === 'sensible') score -= 15;
      else                                                             score -= 4;
    }

    // ── PM-only penalty ───────────────────────────────────── (−10) ───
    if (p.excel_pm_only && tipoPiel !== 'seca') score -= 10;

  } // end EXCEL_INTEL layer

  return Math.max(0, Math.round(score));
}


/* ============================================================
   8. RECOMMENDATION ENGINE  v5.0
   
   Uses shatokbScoreProducto() v5.0 with ALL Excel fields.
   Returns routine steps with scored product options.
   Each step includes `momento` (am/pm/both) for AM/PM split.
   Passes subcategoria_pref + synergy context to scorer.
============================================================ */
const SHATOKB_BUDGET_LIMITS = { bajo: 40, medio: 80, alto: Infinity };
const SHATOKB_MAX_OPTIONS   = 3;

/* ============================================================
   ROTACIÓN INTELIGENTE DE PRODUCTOS — v7.4
   Garantiza que todos los productos del catálogo se muestren
   a lo largo del tiempo, sin sacrificar personalización.

   DISEÑO:
   1. Scorer rankea todos los candidatos por relevancia (como siempre)
   2. Se divide el resultado en 3 bandas por score:
      - TIER A: top 30% — los más relevantes para esta piel
      - TIER B: 30-60%  — buenos candidatos
      - TIER C: 60-100% — válidos pero menos prioritarios
   3. Se seleccionan 2 de TIER A + 1 rotando entre B y C
      → Los mejores siempre aparecen, los demás rotan garantizados
   4. Dentro de cada tier, shuffle aleatorio puro
      → Cada visita = combinación diferente

   RESULTADO:
   - Visita 1: A1, A2, B3        Visita 2: A1, A3, B7
   - Visita 3: A2, A4, C12       Visita 4: A1, A2, C5
   → A lo largo de N visitas, todos los productos B y C aparecen
   → Los A también rotan entre sí (nunca el mismo par dos veces)
============================================================ */

/**
 * Fisher-Yates shuffle — orden aleatorio puro, sin sesgo.
 * @param {Array} arr
 * @returns {Array} nuevo array mezclado
 */
function shatokbShuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Selección rotativa por tiers — el corazón de la rotación.
 * Divide candidatos ya rankeados por score en 3 bandas y
 * selecciona 2 del tier alto + 1 rotando entre los demás.
 *
 * @param {Array}  candidatos  — productos ya ordenados por _score desc
 * @param {number} n           — cuántos devolver (default 3)
 * @returns {Array}            — n productos seleccionados
 */
function shatokbSeleccionarConRotacion(candidatos, n = SHATOKB_MAX_OPTIONS) {
  if (candidatos.length <= n) return candidatos;

  const total = candidatos.length;

  // Calcular tamaño de cada tier
  // TIER A: top 30% pero mínimo 2 productos, máximo 6
  const tierASize = Math.min(Math.max(Math.ceil(total * 0.30), 2), 6);
  // TIER B: siguiente 35%
  const tierBSize = Math.min(Math.ceil(total * 0.35), 12);
  // TIER C: el resto

  const tierA = candidatos.slice(0, tierASize);
  const tierB = candidatos.slice(tierASize, tierASize + tierBSize);
  const tierC = candidatos.slice(tierASize + tierBSize);

  // Mezclar cada tier independientemente
  const shuffledA = shatokbShuffle(tierA);
  const shuffledBC = shatokbShuffle([...tierB, ...tierC]);

  // Selección: tomar del tier A primero (n-1 slots), 1 slot para B/C
  // Si n=3: 2 de A + 1 de B/C
  // Si n=4: 3 de A + 1 de B/C
  // Si n=5: 3 de A + 2 de B/C
  const slotsA  = Math.max(n - 1, Math.ceil(n * 0.65));
  const slotsBC = n - slotsA;

  const seleccionados = [
    ...shuffledA.slice(0, slotsA),
    ...shuffledBC.slice(0, slotsBC),
  ];

  // Shuffle final — mezclar A y B/C para que no sea predecible el orden
  return shatokbShuffle(seleccionados);
}

// Routine step order for sorting
const SHATOKB_STEP_ORDER = ['cleanser', 'toner', 'essence', 'serum', 'moisturizer', 'eye', 'spf', 'mask', 'exfoliator'];

function shatokbRecomendarProductos(perfilId, respuestas) {
  const perfil       = SHATOKB_PERFILES[perfilId];
  const tipoPiel     = respuestas.tipo_piel;
  const sensibilidad = respuestas.sensibilidad;
  const nivelRutina  = respuestas.nivel_rutina;
  const presupuesto  = respuestas.presupuesto;

  // ── v6.0: merge primary + secondary concerns into one array ──────────
  // The scorer receives the full concern list for signal richness.
  // Primary concern is accessed directly via respuestas.preocupacion.
  const primaryConcern = respuestas.preocupacion
    ? [respuestas.preocupacion]
    : [];
  const secondaryConcerns = Array.isArray(respuestas.preocupacion_secundaria)
    ? respuestas.preocupacion_secundaria.filter(c => c !== 'ninguna')
    : (respuestas.preocupacion_secundaria && respuestas.preocupacion_secundaria !== 'ninguna'
        ? [respuestas.preocupacion_secundaria] : []);
  // Merged deduped concerns — primary first
  const preocupaciones = [...new Set([...primaryConcern, ...secondaryConcerns])];

  // ── v6.0: objetivo as array (single value, kept as array for scorer) ──
  const objetivos = respuestas.objetivo
    ? [respuestas.objetivo]
    : (Array.isArray(respuestas.objetivo) ? respuestas.objetivo : []);

  // Trim steps based on routine level
  let pasos = [...perfil.pasos];
  if (nivelRutina === 'basica' && pasos.length > 4) {
    const essential = ['cleanser', 'moisturizer', 'spf'];
    const actives   = pasos.filter(p => !essential.includes(p.categoria));
    const base      = pasos.filter(p => essential.includes(p.categoria));
    pasos = [...base, ...actives.slice(0, 1)]
      .sort((a, b) => SHATOKB_STEP_ORDER.indexOf(a.categoria) - SHATOKB_STEP_ORDER.indexOf(b.categoria));
  }

  // ── First pass: get top product per step for synergy calc ──────
  const topProductosPorPaso = pasos.map(paso => {
    const candidatos = SHATOKB_CATALOGO.filter(p => p.categoria === paso.categoria);
    candidatos.sort((a, b) => (b.score_base || 50) - (a.score_base || 50));
    return candidatos[0] || null;
  }).filter(Boolean);

  return pasos.map((paso, pasoIdx) => {
    let candidatos = SHATOKB_CATALOGO.filter(p => p.categoria === paso.categoria);

    // Others = top products of OTHER steps (for synergy detection)
    const otrosTops = topProductosPorPaso.filter((_, i) => i !== pasoIdx);

    // ── Score each candidate with v5.1 engine ───────────────────
    candidatos = candidatos.map(p => {
      const _score = shatokbScoreProducto(
        p, tipoPiel, preocupaciones, objetivos, sensibilidad, presupuesto, perfilId,
        paso.subcategoria_pref,   // ← subcategoria preference from profile
        otrosTops,                // ← synergy context
        respuestas                // ← NEW v5.1: full respuestas for EXCEL vector build
      );
      return { ...p, _score };
    });

    // Ordenar por score descendente (el scorer ya evaluó relevancia para esta piel)
    candidatos.sort((a, b) => b._score - a._score);

    // ★ v7.5 SUBCATEGORÍA FIRST — garantizar que el paso muestre
    // productos de la subcategoría correcta cuando existe preferencia.
    //
    // Ejemplo: paso "Niacinamide Serum" (subcategoria_pref:'serum_niacinamide')
    // debe mostrar SOLO serums con niacinamida, no cualquier serum.
    //
    // Algoritmo:
    //   1. Si hay subcategoria_pref, separar candidatos en dos listas:
    //      a) exact   — tienen la subcategoría preferida exacta
    //      b) related — misma categoría pero subcategoría diferente
    //   2. Rellenar opciones con "exact" primero hasta MAX_OPTIONS
    //   3. Solo completar con "related" si no hay suficientes "exact"
    //   4. Si no hay subcategoria_pref, comportamiento original v7.4
    let poolSeleccion;
    if (paso.subcategoria_pref) {
      const exact   = candidatos.filter(p => p._score > 0 && p.subcategoria === paso.subcategoria_pref);
      const related = candidatos.filter(p => p._score > 0 && p.subcategoria !== paso.subcategoria_pref);
      if (exact.length >= SHATOKB_MAX_OPTIONS) {
        // Hay suficientes productos exactos — usar solo ellos
        poolSeleccion = exact;
      } else if (exact.length > 0) {
        // Pocos productos exactos — completar con relacionados
        poolSeleccion = [...exact, ...related];
      } else {
        // No hay ninguno con esa subcategoría — usar todos (comportamiento original)
        const candidatosValidos = candidatos.filter(p => p._score > 0);
        poolSeleccion = candidatosValidos.length >= SHATOKB_MAX_OPTIONS ? candidatosValidos : candidatos;
      }
    } else {
      // Sin preferencia de subcategoría — comportamiento original v7.4
      const candidatosValidos = candidatos.filter(p => p._score > 0);
      poolSeleccion = candidatosValidos.length >= SHATOKB_MAX_OPTIONS ? candidatosValidos : candidatos;
    }
    const opciones = shatokbSeleccionarConRotacion(poolSeleccion, SHATOKB_MAX_OPTIONS);

    // Determine the predominant momento for this step
    // Usar el producto con mayor score (primero antes del shuffle) como referencia
    const topMomento = candidatos[0]?.momento || 'both';

    // Hero product flag — mark if this is the Excel-designated hero for this profile
    const heroId = perfil.hero_product;
    opciones.forEach(op => {
      op._isHero = (op.id === heroId || op.handle === heroId);
    });

    return {
      paso:            paso.nombre,
      por_que:         paso.por_que,
      momento:         topMomento,
      subcategoria:    paso.subcategoria_pref || null,
      opciones,
    };
  });
}

/**
 * Split recommended steps into AM and PM blocks.
 * Used by the result display to show two separate routine lists.
 * @param {Array} pasos — result of shatokbRecomendarProductos()
 * @returns {{ am: Array, pm: Array }}
 */
function shatokbSplitAMPM(pasos) {
  const am = pasos.filter(s => s.momento === 'am' || s.momento === 'both' || !s.momento);
  const pm = pasos.filter(s => s.momento === 'pm');
  // Sort each block by natural routine order
  const sortFn = (a, b) => {
    const catA = a.opciones[0]?.categoria || '';
    const catB = b.opciones[0]?.categoria || '';
    return SHATOKB_STEP_ORDER.indexOf(catA) - SHATOKB_STEP_ORDER.indexOf(catB);
  };
  return { am: am.sort(sortFn), pm: pm.sort(sortFn) };
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
  const hookBlock = document.getElementById('stk-hook-block'); // ← bloque copy D

  if (inicio)     inicio.style.display    = 'none';
  if (cabecera)   cabecera.style.display  = 'none';
  if (hookBlock)  hookBlock.style.display = 'none'; // ← ocultar al iniciar quiz
  if (progreso)   progreso.style.display  = 'block';
  if (preguntas)  preguntas.style.display = 'block';

  shatokbRenderPregunta(0);
}

function shatokbRenderPregunta(idx) {
  shatokbState.preguntaActual = idx;
  const total = SHATOKB_PREGUNTAS.length;
  const q     = SHATOKB_PREGUNTAS[idx];
  const pct   = Math.round(((idx + 1) / total) * 100);

  const fill  = document.getElementById('shatokb-progreso-barra');
  const texto = document.getElementById('shatokb-progreso-texto');
  const pctEl = document.getElementById('shatokb-pregunta-num');

  if (fill) {
    fill.style.setProperty('width', pct + '%', 'important');
  }
  if (texto) texto.textContent = 'Question ' + (idx + 1) + ' of ' + total;
  if (pctEl) pctEl.textContent = pct + '%';

  const container = document.getElementById('shatokb-quiz-form');
  if (!container) return;

  const esMulti     = !!q.multiSelect;
  const maxSelect   = q.maxSelect || null;
  const respActual  = shatokbState.respuestas[q.id];
  // Normalizar respuesta actual como array para comparación
  const seleccionados = esMulti
    ? (Array.isArray(respActual) ? respActual : (respActual ? [respActual] : []))
    : [];

  // ── v6.0: excludeFrom — filtra dinámicamente opciones de P3 ──
  // Si la pregunta tiene `excludeFrom`, oculta la opción cuyo valor
  // coincida con la respuesta de la pregunta referenciada (ej: P2→P3).
  const excludedValue = q.excludeFrom
    ? (shatokbState.respuestas[q.excludeFrom] || null)
    : null;

  // Filtrar opciones visible (excluir la que choca con P2)
  const opcionesVisibles = excludedValue
    ? q.opciones.filter(op => op.valor !== excludedValue)
    : q.opciones;

  // Etiqueta del botón Next
  const esFinal   = idx === total - 1;
  const labelNext = esFinal ? 'See My Routine →' : 'Next →';

  // Indicador de multi-select — muestra hint dinámico para "ninguna"
  const hasNinguna = esMulti && opcionesVisibles.some(op => op.valor === 'ninguna');
  const maxSelectEfectivo = hasNinguna ? maxSelect : maxSelect; // reservado para futuro ajuste
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
  // Para multi-select con "ninguna": seleccionar "ninguna" cuenta como respuesta válida
  const tieneRespuesta = esMulti
    ? seleccionados.length > 0
    : !!respActual;

  // ── Tip contextual de KOI ────────────────────────────────────
  const koiTipHTML = q.koiTip ? `
    <div class="shatokb-koi-tip" role="note" aria-label="KOI tip">
      <div class="shatokb-koi-tip__content">
        <div class="shatokb-koi-tip__name"><span aria-hidden="true">🌸</span> KOI</div>
        <p class="shatokb-koi-tip__text">${q.koiTip}</p>
      </div>
    </div>` : '';

  // ── Nota dinámica de exclusión (P3) ──────────────────────────
  // Informa al usuario por qué hay una opción menos disponible
  const exclusionNoteHTML = excludedValue ? (() => {
    const excludedOp = q.opciones.find(op => op.valor === excludedValue);
    const excludedLabel = excludedOp ? excludedOp.label.replace(/^[^\w]*/, '').split(' ')[0] + '…' : excludedValue;
    return `<p class="shatokb-exclusion-note" aria-live="polite">
      ✓ <strong>${excludedLabel}</strong> is already your primary concern — pick something different here.
    </p>`;
  })() : '';

  container.innerHTML = `
    <div class="shatokb-pregunta">
      ${koiTipHTML}
      <div class="shatokb-pregunta__header">
        <span class="shatokb-pregunta__emoji" aria-hidden="true">${q.emoji || '💬'}</span>
        <div>
          <h3 class="shatokb-pregunta__titulo">${q.titulo}</h3>
          ${q.subtitulo ? `<p class="shatokb-pregunta__subtitulo">${q.subtitulo}</p>` : ''}
          ${exclusionNoteHTML}
          ${multiHint}
        </div>
      </div>
      <div class="shatokb-opciones${esMulti ? ' shatokb-opciones--multi' : ''}" id="stk-opciones-wrap">
        ${opcionesVisibles.map(op => {
          const isSelected = esMulti
            ? seleccionados.includes(op.valor)
            : respActual === op.valor;
          // "ninguna" tiene estilo visual diferenciado
          const esNinguna = op.valor === 'ninguna';
          return `
          <button
            class="shatokb-opcion${isSelected ? ' shatokb-opcion--selected' : ''}${esNinguna ? ' shatokb-opcion--ninguna' : ''}"
            type="button"
            data-valor="${op.valor}"
            onclick="event.stopPropagation();shatokbElegirRespuesta('${q.id}','${op.valor}',this,${esMulti},${maxSelect || 'null'})">
            ${esMulti ? '<span class="shatokb-opcion__check" aria-hidden="true"></span>' : ''}
            <span class="shatokb-opcion__label">${op.label}</span>
            <span class="shatokb-opcion__desc">${op.desc || ''}</span>
          </button>`;
        }).join('')}
      </div>
      <div class="shatokb-quiz-nav" id="stk-nav-wrap">
        ${idx > 0
          ? `<button class="shatokb-btn shatokb-btn--ghost" type="button" onclick="event.stopPropagation();shatokbRenderPregunta(${idx - 1})">← Back</button>`
          : `<span></span>`}
        <div id="stk-next-slot" style="display:${tieneRespuesta ? 'block' : 'none'};">
          ${tieneRespuesta ? `<button
            class="shatokb-btn shatokb-btn--primary shatokb-btn--ready"
            id="shatokb-btn-siguiente"
            type="button"
            onclick="event.stopPropagation();shatokbSiguientePregunta(${idx})"
            >${labelNext}</button>` : ''}
        </div>
      </div>
    </div>`;
}

function shatokbElegirRespuesta(qId, valor, btn, esMulti, maxSelect) {
  if (esMulti) {
    // ── Multi-select: toggle el valor en el array ──────────────
    let actual = shatokbState.respuestas[qId];
    if (!Array.isArray(actual)) actual = actual ? [actual] : [];

    const yaSeleccionado = actual.includes(valor);

    if (yaSeleccionado) {
      // ── Deseleccionar ──────────────────────────────────────
      actual = actual.filter(v => v !== valor);
      btn.classList.remove('shatokb-opcion--selected');

    } else {
      // ── Seleccionar ────────────────────────────────────────

      // v6.0: lógica mutual-exclusion para "ninguna"
      // • Si el usuario pulsa "ninguna" → desseleccionar todo lo demás
      // • Si el usuario pulsa cualquier otra cosa → deseleccionar "ninguna"
      if (valor === 'ninguna') {
        // Deseleccionar todas las demás opciones
        actual.forEach(v => {
          const otroBtn = document.querySelector(`#stk-opciones-wrap .shatokb-opcion[data-valor="${v}"]`);
          if (otroBtn) otroBtn.classList.remove('shatokb-opcion--selected');
        });
        actual = ['ninguna'];
        btn.classList.add('shatokb-opcion--selected');

      } else {
        // Eliminar "ninguna" del array si existía
        if (actual.includes('ninguna')) {
          actual = actual.filter(v => v !== 'ninguna');
          const ningunaBtn = document.querySelector('#stk-opciones-wrap .shatokb-opcion[data-valor="ninguna"]');
          if (ningunaBtn) ningunaBtn.classList.remove('shatokb-opcion--selected');
        }

        // Respetar límite maxSelect (FIFO — quita el más antiguo)
        if (maxSelect && actual.length >= maxSelect) {
          const quitado = actual.shift();
          const btnQuitado = document.querySelector(
            `#stk-opciones-wrap .shatokb-opcion[data-valor="${quitado}"]`
          );
          if (btnQuitado) btnQuitado.classList.remove('shatokb-opcion--selected');
        }

        actual = [...actual, valor];
        btn.classList.add('shatokb-opcion--selected');
      }
    }

    shatokbState.respuestas[qId] = actual;

    // Actualizar contador — "ninguna" no suma al display numérico
    const countEl = document.getElementById('stk-multi-count');
    if (countEl) {
      const countable = actual.filter(v => v !== 'ninguna');
      countEl.textContent = countable.length > 0 ? countable.length + ' selected' : '';
    }

    // Mostrar u ocultar el slot del botón Next según haya selección
    // "ninguna" cuenta como selección válida (usuario eligió explícitamente "ninguna")
    shatokbActualizarBtnNext(actual.length > 0, shatokbState.preguntaActual);

  } else {
    // ── Single-select ─────────────────────────────────────────────
    // Guarda la respuesta, marca la opción y muestra el botón Next.
    // El usuario debe hacer clic en Next para avanzar — sin auto-avance.
    shatokbState.respuestas[qId] = valor;
    document.querySelectorAll('.shatokb-opcion').forEach(b => b.classList.remove('shatokb-opcion--selected'));
    btn.classList.add('shatokb-opcion--selected');
    // Forzar esNuevo=true para que el scroll se ejecute siempre al seleccionar
    var slotAntes = document.getElementById('stk-next-slot');
    if (slotAntes) slotAntes.innerHTML = '';
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
  var label    = esFinal ? 'See what works for my skin →' : 'Next →';

  if (mostrar) {
    var esNuevo = !document.getElementById('shatokb-btn-siguiente');

    // Si ya existe el botón, solo actualizar visibilidad
    slot.style.display = 'block';
    if (esNuevo) {
      slot.innerHTML = `<button
        class="shatokb-btn shatokb-btn--primary shatokb-btn--ready"
        id="shatokb-btn-siguiente"
        type="button"
        onclick="event.stopPropagation();shatokbSiguientePregunta(${idx})"
        >${label}</button>`;
    }

    // Scroll suave hasta el botón Next cada vez que el usuario selecciona.
    // En móvil compensa el footer fijo de Shopify (~60px) para que el botón
    // no quede oculto detrás de la barra de navegación inferior.
    setTimeout(function() {
      var btnEl = document.getElementById('shatokb-btn-siguiente');
      if (!btnEl) return;
      var rect        = btnEl.getBoundingClientRect();
      var viewH       = window.innerHeight;
      // Detecta si hay footer fijo móvil (barra nav inferior Shopify ≈ 60px)
      var mobileFooter = window.innerWidth < 768 ? 70 : 20;
      var bottomEdge  = rect.bottom + mobileFooter;
      // Solo hace scroll si el botón NO es completamente visible
      if (bottomEdge > viewH || rect.top < 0) {
        var absTop  = rect.top + window.pageYOffset;
        var target  = absTop - (viewH - rect.height - mobileFooter - 16);
        window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
      }
    }, 80);

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
    // Scroll al inicio de la pregunta — siempre, en cualquier dispositivo
    setTimeout(function() {
      const form = document.getElementById('shatokb-quiz-form');
      const target = form || document.getElementById('shatokb-quiz');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 30);
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
  if (texto) texto.textContent    = '✓ Complete!';
  if (pctEl) pctEl.textContent    = '100%';

  shatokbTrackPixel('QuizCompleted', { skin_profile: shatokbCalcularPerfil(shatokbState.respuestas) });

  // Mostrar pantalla de transición "construyendo tu rutina"
  shatokbMostrarTransicion(function() {
    if (form) form.style.display = 'none';
    shatokbMostrarResultado();
  });
}

function shatokbMostrarTransicion(callback) {
  // Crear overlay de transición sobre el quiz
  const quizEl = document.getElementById('shatokb-quiz') ||
                 document.getElementById('shatokb-quiz-form') ||
                 document.body;

  // Eliminar overlay anterior si existe
  const prev = document.getElementById('stk-building-overlay');
  if (prev) prev.remove();

  const overlay = document.createElement('div');
  overlay.id = 'stk-building-overlay';
  overlay.innerHTML = `
    <div class="stk-building__inner">
      <div class="stk-building__icon-wrap">
        <div class="stk-building__ring stk-building__ring--1"></div>
        <div class="stk-building__ring stk-building__ring--2"></div>
        <div class="stk-building__ring stk-building__ring--3"></div>
        <span class="stk-building__emoji">🌸</span>
      </div>
      <p class="stk-building__title">Building your routine…</p>
      <p class="stk-building__sub">Analyzing your skin profile</p>
      <div class="stk-building__steps">
        <div class="stk-building__step" id="stk-bs-1">
          <span class="stk-building__step-dot"></span>
          <span>Calculating your skin profile</span>
        </div>
        <div class="stk-building__step" id="stk-bs-2">
          <span class="stk-building__step-dot"></span>
          <span>Selecting compatible actives</span>
        </div>
        <div class="stk-building__step" id="stk-bs-3">
          <span class="stk-building__step-dot"></span>
          <span>Personalizing AM &amp; PM routine</span>
        </div>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  // Scroll al top para que se vea el overlay
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Activar con frame de delay para transición suave
  requestAnimationFrame(() => {
    requestAnimationFrame(() => overlay.classList.add('stk-building--visible'));
  });

  // Animar steps secuencialmente
  // Cada step: aparece → se lee (~1200ms) → check → siguiente
  // Total visible: ~5.5s antes del fade out
  const steps = [
    document.getElementById('stk-bs-1'),
    document.getElementById('stk-bs-2'),
    document.getElementById('stk-bs-3'),
  ];
  steps.forEach(function(el, i) {
    if (!el) return;
    setTimeout(function() {
      el.classList.add('stk-building__step--active');
      setTimeout(function() { el.classList.add('stk-building__step--done'); }, 1400);
    }, 600 + i * 2000);
  });

  // Tras ~8s, fade out y ejecutar callback
  setTimeout(function() {
    overlay.classList.add('stk-building--exit');
    setTimeout(function() {
      overlay.remove();
      if (typeof callback === 'function') callback();
    }, 600);
  }, 8000);
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
  if (fill) {
    fill.style.setProperty('width', '100%', 'important');
    fill.style.setProperty('background', 'linear-gradient(90deg, #f5a0bb, #e0607e)', 'important');
  }
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
          Matching products to your skin…
        </p>
        <p style="font-size:14px; color:#6b7280; margin-top:8px;">
          Analyzing your profile
        </p>
      </div>`;

    await new Promise(resolve => {
      const check = setInterval(() => {
        if (shatokbCatalogoCargado) { clearInterval(check); resolve(); }
      }, 100);
    });
  }

  // ★ v7.3: usar perfilOverride y respuestasEnriquecidas si KOI Vision ya analizó la foto
  // Esto garantiza que la rutina final use los scores reales de la piel, no solo el quiz
  const perfilId  = shatokbState.perfilOverride || shatokbCalcularPerfil(shatokbState.respuestas);
  const respuestasParaScorer = shatokbState.respuestasEnriquecidas || shatokbState.respuestas;
  const perfil    = SHATOKB_PERFILES[perfilId];
  const pasosProd = shatokbRecomendarProductos(perfilId, respuestasParaScorer);
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

  // ── v6.0: campos nuevos para el summary card ──────────────
  const barrierStatus      = shatokbState.respuestas.sensibilidad      || '';
  const ingredientTolerance = shatokbState.respuestas.ingredient_tolerance || '';

  // Frases de insight personal — voz de KOI, orientadas a valor
  const BARRIER_INSIGHTS = {
    baja:    'Your barrier is strong — your skin handles new products without drama. We unlocked more powerful actives for you.',
    media:   'Your barrier is a little cautious. We\'ve kept the actives effective but picked formulas that won\'t push it over the edge.',
    alta:    'Your skin reacts fast — we filtered out every potential trigger. Only ingredients your skin can actually handle made the cut.',
    damaged: 'Your barrier needs to recover first. We\'ve paused all actives and built around repair. Ask KOI when you\'re ready to reintroduce them.',
  };
  const TOLERANCE_INSIGHTS = {
    none:         'You\'re starting fresh — we kept every formula gentle enough to build a solid base without any shock to your skin.',
    basic:        'You have some experience, so we went one level up from basics. Targeted actives, no overkill.',
    intermediate: 'Your skin knows what it\'s doing. We matched ingredients at the strength that actually moves the needle for you.',
    advanced:     'Your skin is adapted and ready. We picked the high-performance formulas — no need to hold back.',
  };

  // Labels legibles para el usuario (mantenidos para compatibilidad)
  const BARRIER_LABELS = {
    baja:    { icon: '💪', label: 'Resilient',         desc: 'Your barrier handles new products well.' },
    media:   { icon: '🌤️', label: 'Moderate',          desc: 'Occasionally reacts — some caution needed.' },
    alta:    { icon: '⚡', label: 'Very Reactive',      desc: 'Sensitive to new ingredients and textures.' },
    damaged: { icon: '🚨', label: 'Barrier Damaged',    desc: 'Repair mode active — actives are on pause.' },
  };
  const TOLERANCE_LABELS = {
    none:         { icon: '🌱', label: 'Beginner',           desc: 'Starting fresh — gentle formulas only.' },
    basic:        { icon: '🧴', label: 'Some Experience',    desc: 'Ready for niacinamide, gentle acids, light Vit-C.' },
    intermediate: { icon: '💊', label: 'Comfortable',        desc: 'Handles AHAs, BHAs, and Vitamin C routinely.' },
    advanced:     { icon: '🔬', label: 'Advanced',           desc: 'Adapted skin ready for retinol & high-strength actives.' },
  };

  const barrierInsight   = BARRIER_INSIGHTS[barrierStatus] || '';
  const toleranceInsight = TOLERANCE_INSIGHTS[ingredientTolerance] || '';

  const barrierInfo    = BARRIER_LABELS[barrierStatus]       || { icon: '🌸', label: barrierStatus,       desc: '' };
  const toleranceInfo  = TOLERANCE_LABELS[ingredientTolerance] || { icon: '🧪', label: ingredientTolerance, desc: '' };

  const inner = resultadoEl.querySelector('.shatokb-resultado__inner') || resultadoEl;
  inner.innerHTML = `

    <!-- Profile header -->
    <div class="shatokb-resultado__header">
      <h2 class="shatokb-resultado__titulo">Your skin. Your match.</h2>
      <p class="shatokb-resultado__perfil-nombre">${perfil.titulo}</p>
      <div class="shatokb-resultado__tags-line">
        ${tags.map(t => `<span class="shatokb-resultado__tag-dot">&#x2726;</span><span class="shatokb-resultado__tag-text">${t}</span>`).join('')}
      </div>
      <p class="shatokb-resultado__desc">${perfil.descripcion}</p>

      <!-- Insights personales — sin marcos, voz de KOI -->
      ${(barrierInsight || toleranceInsight) ? `
      <div class="stk-skin-insights">
        ${barrierInsight ? `<p class="stk-skin-insight">${barrierInfo.icon} ${barrierInsight}</p>` : ''}
        ${toleranceInsight ? `<p class="stk-skin-insight">${toleranceInfo.icon} ${toleranceInsight}</p>` : ''}
      </div>` : ''}
    </div>

    ${hasOverBudget ? `
      <div class="stk-budget-note">
        ⚠️ Some recommended products exceed your <strong>${budgetLabel}</strong> budget. We've marked them so you can choose alternatives within your range.
      </div>` : ''}

    <!-- Routine section -->
    <div class="stk-reveal-section stk-reveal-section--locked" id="stk-reveal-section">

      <div class="stk-reveal-header">
        <p class="stk-section-title">Your matched products</p>
        <p class="stk-section-sub">Hand-picked for your exact skin. Every product earns its place here.</p>
      </div>

      <!-- Aviso KOI — Teaser card WOW -->
      ${(function() {
        // Mensaje personalizado según concern principal
        const concern = Array.isArray(shatokbState.respuestas.preocupacion)
          ? shatokbState.respuestas.preocupacion[0]
          : (shatokbState.respuestas.preocupacion || '');
        const secondaryConcerns = Array.isArray(shatokbState.respuestas.preocupacion_secundaria)
          ? shatokbState.respuestas.preocupacion_secundaria.filter(c => c && c !== 'ninguna')
          : [];
        const totalConcerns = (concern ? 1 : 0) + secondaryConcerns.length;
        const concernCount  = Math.max(totalConcerns, 2); // mínimo 2 para el mensaje

        const CONCERN_MSGS = {
          acne:          `I flagged ${concernCount} things in your profile I need to talk to you about 👀`,
          poros:         `Your pores need a specific layering order — I mapped it out for you 🗺️`,
          manchas:       `There's a mistake most people make with hyperpigmentation. Yours is fixable 🌿`,
          deshidratacion:`Your barrier and hydration are linked. I found ${concernCount} patterns worth discussing 💧`,
          rojeces:       `Redness is almost always a barrier issue. I spotted something in your profile 🔎`,
          antiaging:     `I analyzed your profile. There are ${concernCount} things I want to walk you through 💎`,
          textura:       `Texture takes the right sequence. I've got something specific for your routine ✨`,
          sensible:      `Sensitive skin needs careful layering. I flagged ${concernCount} things for you 🌸`,
        };
        const msg = CONCERN_MSGS[concern] || `I analyzed your skin profile. There are ${concernCount} things I want to talk to you about 👀`;

        return `
      <div class="stk-koi-teaser" id="stk-blur-overlay" data-msg="${msg.replace(/"/g, '&quot;')}">
        <div class="stk-koi-teaser__header">
          <span class="stk-koi-teaser__avatar">🌸</span>
          <div class="stk-koi-teaser__meta">
            <span class="stk-koi-teaser__name">KOI</span>
            <span class="stk-koi-teaser__status">
              <span class="stk-koi-teaser__dot"></span>online now
            </span>
          </div>
        </div>
        <div class="stk-koi-teaser__bubble">
          <span class="stk-koi-teaser__typing" aria-hidden="true">
            <span></span><span></span><span></span>
          </span>
          <p class="stk-koi-teaser__text" aria-live="polite"></p>
        </div>
        <button class="stk-koi-teaser__cta" onclick="shatokbScrollAKOI()" type="button">
          Show me my products →
        </button>
      </div>`;
      })()}

      <!-- Productos sombreados — ocultos hasta que el usuario abre KOI -->
      <div class="stk-routine-blurred" id="stk-routine-blurred" style="display:none">

        <!-- ══════════════════════════════════════════════════
             SECCIÓN 1 — TODOS LOS PRODUCTOS (numerados 1…N)
             Tarjetas completas con opciones seleccionables.
             ═══════════════════════════════════════════════ -->
        <div id="shatokb-routine-steps">
          ${(function() {
            const { am, pm } = shatokbSplitAMPM(pasosProd);

            // Orden canónico: AM primero, luego PM-exclusivos.
            // Este orden define los números 1…N que aparecen
            // tanto en las tarjetas como en el schedule AM/PM.
            const allOrdered = [...am, ...pm.filter(p => !am.includes(p))];

            // Mapa paso → número display (1-based, secuencial)
            const displayNumMap = new Map();
            allOrdered.forEach((p, i) => displayNumMap.set(p, i + 1));

            let html = '';

            // ── Lista completa de pasos con tarjetas ─────────
            allOrdered.forEach((paso) => {
              html += shatokbRenderPasoHTML(paso, pasosProd.indexOf(paso), budgetMax, displayNumMap.get(paso));
            });

            // ── Separador "How to use them" ───────────────────
            html += `
            <div class="stk-schedule" id="stk-schedule">
              <div class="stk-schedule__header">
                <span class="stk-schedule__icon">🗓️</span>
                <div>
                  <h3 class="stk-schedule__title">How to use them</h3>
                  <p class="stk-schedule__sub">Apply your products in this order, morning and night</p>
                </div>
              </div>`;

            // ── AM lane ───────────────────────────────────────
            if (am.length > 0) {
              html += `
              <div class="stk-schedule__lane stk-schedule__lane--am">
                <div class="stk-schedule__lane-label">
                  <span class="stk-schedule__lane-icon">☀️</span>
                  <span>Morning</span>
                </div>
                <div class="stk-schedule__steps">`;
              am.forEach((paso, i) => {
                const num = displayNumMap.get(paso);
                html += `
                  <div class="stk-schedule__step">
                    <div class="stk-schedule__step-num">${num}</div>
                    <div class="stk-schedule__step-name">${paso.paso}</div>
                  </div>`;
                if (i < am.length - 1) {
                  html += `<div class="stk-schedule__arrow">→</div>`;
                }
              });
              html += `</div></div>`;
            }

            // ── PM lane ───────────────────────────────────────
            const pmAll = pasosProd.filter(s => s.momento === 'pm' || s.momento === 'both' || !s.momento);
            if (pmAll.length > 0) {
              html += `
              <div class="stk-schedule__lane stk-schedule__lane--pm">
                <div class="stk-schedule__lane-label">
                  <span class="stk-schedule__lane-icon">🌙</span>
                  <span>Night</span>
                </div>
                <div class="stk-schedule__steps">`;
              pmAll.forEach((paso, i) => {
                const num = displayNumMap.get(paso);
                const isPmOnly = paso.momento === 'pm';
                html += `
                  <div class="stk-schedule__step${isPmOnly ? ' stk-schedule__step--pm-only' : ''}">
                    <div class="stk-schedule__step-num">${num}</div>
                    <div class="stk-schedule__step-name">${paso.paso}${isPmOnly ? '<span class="stk-schedule__step-pm-badge">PM only</span>' : ''}</div>
                  </div>`;
                if (i < pmAll.length - 1) {
                  html += `<div class="stk-schedule__arrow">→</div>`;
                }
              });
              html += `</div></div>`;
            }

            html += `</div>`; // cierra .stk-schedule

            // ── Conflict warnings ─────────────────────────────
            const conflictos = shatokbDetectarConflictos(pasosProd);
            if (conflictos.length > 0) {
              html += '<div class="stk-conflict-warnings">';
              conflictos.forEach(w => {
                const icon = w.ampmSplit ? 'ℹ️' : '⚠️';
                const cls  = w.ampmSplit ? 'stk-conflict--info' : 'stk-conflict--warning';
                const msg  = w.ampmSplit
                  ? `<strong>Good news:</strong> <em>${w.prodA}</em> and <em>${w.prodB}</em> contain conflicting actives (${w.conflictos.map(c => c.from + ' + ' + c.to).join(', ')}), but they're already split — AM and PM. ✅`
                  : `<strong>Heads up:</strong> <em>${w.prodA}</em> and <em>${w.prodB}</em> contain actives that shouldn't be layered together (${w.conflictos.map(c => c.from + ' + ' + c.to).join(', ')}). Ask KOI how to use them safely.`;
                html += '<div class="stk-conflict-item ' + cls + '">' + icon + ' ' + msg + '</div>';
              });
              html += '</div>';
            }

            return html;
          })()}
        </div>

        <!-- CTAs — rendered dynamically from Theme Editor config -->
        <div class="shatokb-resultado__ctas" id="shatokb-ctas" style="margin-top: 16px;"></div>

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
  // Arrancar animación typewriter del KOI teaser
  setTimeout(shatokbActivarKoiTeaser, 400);
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
      .filter(p => p.momento === 'am' || p.momento === 'ambos' || p.momento === 'both' || !p.momento)
      .map(p => p.nombre),
    rutinaPM: pasosProd
      .filter(p => p.momento === 'pm' || p.momento === 'ambos' || p.momento === 'both' || !p.momento)
      .map(p => p.nombre),
    // Solo el producto elegido por el usuario en cada paso
    // (shatokbState.selectedProducts = { stepIdx: prodId })
    productos: pasosProd.map((paso, stepIdx) => {
      // Buscar el producto que el usuario seleccionó en este paso
      const elegidoId = shatokbState.selectedProducts[stepIdx];
      const prod = (elegidoId && paso.opciones.find(o => o.id === elegidoId))
        || paso.opciones[0]; // fallback al primero si no hay selección
      if (!prod) return null;

      // Normalizar momento: el catálogo usa 'both', el skin-report espera 'ambos'
      const momentoRaw = paso.momento || prod.momento || 'both';
      const momento = momentoRaw === 'both' ? 'ambos'
                    : momentoRaw === 'am'   ? 'am'
                    : momentoRaw === 'pm'   ? 'pm'
                    : 'ambos';

      return {
        nombre:      prod.nombre,
        precio:      prod.precio,
        paso:        paso.nombre || paso.paso || '',
        id:          prod.id,
        handle:      prod.handle || prod.id,
        momento,
        razon:       paso.por_que || prod.desc || '',
        descripcion: prod.desc || '',
        // Imagen real del producto desde Shopify CDN (usada en email de Klaviyo)
        imagen:      prod.imagen || null,
        url:         prod.handle ? `https://shatokb.com/products/${prod.handle}` : '',
      };
    }).filter(Boolean),
    // Respuestas completas del quiz — KOI las usa para entender
    // el análisis de piel y tener contexto del diagnóstico
    respuestas: {
      tipo_piel:              shatokbState.respuestas.tipo_piel              || '',
      sensibilidad:           shatokbState.respuestas.sensibilidad           || '',
      preocupacion:           shatokbState.respuestas.preocupacion           || '',
      preocupacion_secundaria: shatokbState.respuestas.preocupacion_secundaria || [],
      objetivo:               shatokbState.respuestas.objetivo               || '',
      nivel_rutina:           shatokbState.respuestas.nivel_rutina           || '',
      presupuesto:            shatokbState.respuestas.presupuesto            || '',
      // v6.0: nuevos campos explícitos para KOI
      barrier_status:         shatokbState.respuestas.sensibilidad           || '',
      ingredient_tolerance:   shatokbState.respuestas.ingredient_tolerance   || '',
    },
    // v6.0: campos de análisis de piel al nivel raíz del evento
    // (KOI puede acceder como detail.barrier_status directamente)
    barrier_status:       shatokbState.respuestas.sensibilidad         || '',
    ingredient_tolerance: shatokbState.respuestas.ingredient_tolerance || '',
    presupuesto:          shatokbState.respuestas.presupuesto          || '',
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

  // Guardar contexto en variable global — el botón "Open my analysis →"
  // lo usará cuando el usuario haga clic (shatokbScrollAKOI).
  // NO se llama a shatokbIniciarKOI aquí — KOI solo arranca al hacer clic.
  window.SHATOKB_RESULTADO = koiContexto;
}


/* ============================================================
   KOI TEASER — Animación typewriter del banner de bienvenida
   Se llama 400ms después de que se renderiza el resultado.
============================================================ */
function shatokbActivarKoiTeaser() {
  const teaser  = document.getElementById('stk-blur-overlay');
  if (!teaser) return;

  const typingEl = teaser.querySelector('.stk-koi-teaser__typing');
  const textEl   = teaser.querySelector('.stk-koi-teaser__text');
  const ctaEl    = teaser.querySelector('.stk-koi-teaser__cta');
  const msg      = teaser.dataset.msg || "I analyzed your skin profile. There are 2 things I want to talk to you about 👀";

  if (!typingEl || !textEl || !ctaEl) return;

  // Fase 1 — mostrar el teaser con entrada suave
  teaser.classList.add('stk-koi-teaser--visible');

  // Fase 2 (500ms) — mostrar typing dots
  setTimeout(function() {
    typingEl.classList.add('stk-koi-teaser__typing--active');
  }, 500);

  // Fase 3 (1500ms) — ocultar dots, arrancar typewriter
  setTimeout(function() {
    typingEl.classList.remove('stk-koi-teaser__typing--active');
    typingEl.style.display = 'none';
    textEl.classList.add('stk-koi-teaser__text--visible');

    // Typewriter letra a letra
    let i = 0;
    const chars = Array.from(msg); // soporte emojis multibyte
    function typeNext() {
      if (i < chars.length) {
        textEl.textContent += chars[i++];
        // velocidad variable: más rápida en palabras, pausa en puntuación
        const delay = /[,.!?👀💧🌿🔎✨💎🗺️🌸]/.test(chars[i - 1]) ? 120 : 38;
        setTimeout(typeNext, delay);
      } else {
        // Fase 4 — botón aparece con bounce cuando termina el texto
        setTimeout(function() {
          ctaEl.classList.add('stk-koi-teaser__cta--visible');
        }, 200);
      }
    }
    typeNext();
  }, 1500);
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
  // Mostrar productos (estaban ocultos con display:none hasta que KOI los revela)
  blurred.style.removeProperty('display');
  blurred.style.display = 'block';
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

  // 5. Mover sticky bar al final del stk-reveal-section (después del chat KOI)
  //    y mostrarla con animación una vez los productos estén revelados.
  //    Si la dejamos dentro de #stk-routine-blurred con position:sticky
  //    aparece encima del chat KOI (sticky bottom del scroll container del quiz).
  const totalBar = document.getElementById('stk-total-bar');
  if (totalBar) {
    const revealSection = document.getElementById('stk-reveal-section');
    if (revealSection && totalBar.parentNode !== revealSection) {
      revealSection.appendChild(totalBar);
    }
    const delayTotal = 200 + steps.length * 130 + 300;
    setTimeout(function () {
      totalBar.classList.add('stk-total-bar--visible');
    }, delayTotal);
  }

  // 6. Limpiar overlay del DOM cuando termine la transición
  setTimeout(function () {
    if (overlay && overlay.parentNode) overlay.remove();
  }, 800);

  // 7. Inyectar botón CTA directamente al final del blurred, visible garantizado
  var delayBtn = 200 + steps.length * 130 + 400;
  setTimeout(function () {
    // Evitar duplicado si ya existe
    if (document.getElementById('stk-add-btn-bottom')) return;

    // ══════════════════════════════════════════════════════════════
    // KOI STARTER KIT — Bloque de conversión con 20% OFF + envío gratis + countdown 30 min
    // Se inyecta ANTES del botón "Add my full routine to cart"
    // ══════════════════════════════════════════════════════════════
    (function shatokbInyectarStarterKit() {
      if (document.getElementById('stk-kit-card')) return;

      // ── 1. Obtener top-3 productos seleccionados del catálogo ──────────────────
      var kitProds = [];
      var selectedEntries = Object.entries(shatokbState.selectedProducts || {});
      var kitEntries = selectedEntries.slice(0, 3);
      kitEntries.forEach(function(entry) {
        var prodId = entry[1];
        var prod = SHATOKB_CATALOGO.find(function(p) { return p.id === prodId; });
        if (prod) kitProds.push(prod);
      });

      if (kitProds.length < 2) return;

      // ── 2. Calcular precios ───────────────────────────────────────────────────
      var totalOriginal = kitProds.reduce(function(sum, p) { return sum + (p.precio_num || 0); }, 0);
      var totalKit      = totalOriginal * 0.80;
      function fmt(n) { return '$' + n.toFixed(2); }

      // ── 3. Handles para el carrito ───────────────────────────────────────────
      var kitHandles = kitProds.map(function(p) { return p.handle || p.id; });

      // ── 4. HTML de lista de productos ─────────────────────────────────────────
      var prodListHTML = kitProds.map(function(p, i) {
        return '<span class="stk-kit__prod-item">' +
               '<span class="stk-kit__prod-num">' + (i + 1) + '</span>' +
               '<span class="stk-kit__prod-name">' + (p.nombre || p.id) + '</span>' +
               '<span class="stk-kit__prod-price">' + fmt(p.precio_num || 0) + '</span>' +
               '</span>';
      }).join('');

      // ── 5. Crear el card del Kit ──────────────────────────────────────────────
      var kitCard = document.createElement('div');
      kitCard.id = 'stk-kit-card';
      kitCard.setAttribute('role', 'region');
      kitCard.setAttribute('aria-label', 'KOI Starter Kit — Exclusive offer');

      kitCard.innerHTML =
        '<div class="stk-kit__badge-row">' +
          '<span class="stk-kit__badge stk-kit__badge--new">✦ KOI STARTER KIT ✦</span>' +
          '<span class="stk-kit__badge stk-kit__badge--off">20% OFF</span>' +
        '</div>' +
        '<p class="stk-kit__headline">Your personalized first-step routine</p>' +
        '<p class="stk-kit__sub">Curated by KOI for your exact skin · Free shipping · No minimum</p>' +
        '<div class="stk-kit__prods">' + prodListHTML + '</div>' +
        '<div class="stk-kit__price-row">' +
          '<span class="stk-kit__price-original">' + fmt(totalOriginal) + '</span>' +
          '<span class="stk-kit__price-final">' + fmt(totalKit) + '</span>' +
          '<span class="stk-kit__shipping-badge">🚚 FREE SHIPPING</span>' +
        '</div>' +
        '<div class="stk-kit__countdown-wrap">' +
          '<span class="stk-kit__countdown-label">⏱ Offer expires in</span>' +
          '<span class="stk-kit__countdown-timer" id="stk-kit-timer">30:00</span>' +
        '</div>' +
        '<button class="stk-kit__cta" id="stk-kit-btn" type="button">' +
          '✦ Add my Starter Kit — ' + fmt(totalKit) + ' ✦' +
        '</button>' +
        '<p class="stk-kit__guarantee">🛡️ 30-Day Money-Back Guarantee · Cancel anytime</p>';

      // ── 6. Insertar ANTES de #shatokb-ctas ───────────────────────────────────
      var ctasEl = document.getElementById('shatokb-ctas');
      if (ctasEl && ctasEl.parentNode === blurred) {
        blurred.insertBefore(kitCard, ctasEl);
      } else {
        blurred.appendChild(kitCard);
      }

      // ── 7. Fade-in suave ──────────────────────────────────────────────────────
      kitCard.style.opacity    = '0';
      kitCard.style.transform  = 'translateY(16px)';
      kitCard.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          kitCard.style.opacity   = '1';
          kitCard.style.transform = 'translateY(0)';
        });
      });

      // ── 8. Countdown 30 minutos ───────────────────────────────────────────────
      var kitTimerEl = document.getElementById('stk-kit-timer');
      var kitSeconds = 30 * 60;
      var kitTimerInterval = setInterval(function() {
        if (kitSeconds <= 0) {
          clearInterval(kitTimerInterval);
          if (kitTimerEl) kitTimerEl.textContent = '00:00';
          var kitBtn = document.getElementById('stk-kit-btn');
          if (kitBtn) {
            kitBtn.disabled = true;
            kitBtn.style.opacity = '0.5';
            kitBtn.textContent = 'Offer expired — see full routine below';
          }
          return;
        }
        kitSeconds--;
        var m  = String(Math.floor(kitSeconds / 60)).padStart(2, '0');
        var s2 = String(kitSeconds % 60).padStart(2, '0');
        if (kitTimerEl) {
          kitTimerEl.textContent = m + ':' + s2;
          if (kitSeconds < 300) kitTimerEl.style.color     = '#ff6b6b';
          if (kitSeconds < 60)  kitTimerEl.style.animation = '_stkKitBlink 0.7s ease-in-out infinite';
        }
      }, 1000);

      // ── 9. Botón "Add Starter Kit" ────────────────────────────────────────────
      var kitCta = document.getElementById('stk-kit-btn');
      if (kitCta) {
        kitCta.addEventListener('click', async function() {
          var self = this;
          self.disabled    = true;
          self.textContent = '⏳ Adding your kit...';
          try {
            var variantRequests = kitHandles.map(function(handle) {
              return fetch('/products/' + handle + '.js')
                .then(function(r) { return r.ok ? r.json() : null; })
                .then(function(d) { return d && d.variants && d.variants[0] ? d.variants[0].id : null; })
                .catch(function() { return null; });
            });
            var variantIds = await Promise.all(variantRequests);
            var items = variantIds
              .filter(function(id) { return id !== null; })
              .map(function(id)    { return { id: id, quantity: 1 }; });
            if (items.length === 0) throw new Error('Could not load product data.');
            var cartRes = await fetch('/cart/add.js', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({ items: items })
            });
            if (!cartRes.ok) throw new Error('Could not add to cart.');
            self.textContent = '✓ Kit added! Going to checkout...';
            setTimeout(function() { window.location.href = '/checkout?discount=KOI20'; }, 600);
          } catch(err) {
            console.error('[SHATOKB KIT]', err);
            self.disabled    = false;
            self.textContent = '✦ Add my Starter Kit — ' + fmt(totalKit) + ' ✦';
            alert('Something went wrong. Please try again.');
          }
        });
      }

      // ── 10. Inyectar estilos del Kit (solo una vez) ───────────────────────────
      if (!document.getElementById('stk-kit-style')) {
        var st = document.createElement('style');
        st.id = 'stk-kit-style';
        st.textContent = [
          '@keyframes _stkKitShimmer{0%{transform:translateX(-130%) skewX(-18deg)}100%{transform:translateX(280%) skewX(-18deg)}}',
          '@keyframes _stkKitPulse{0%,100%{box-shadow:0 0 0 0 rgba(236,149,184,0),0 10px 32px rgba(236,149,184,.35)}50%{box-shadow:0 0 0 8px rgba(236,149,184,.12),0 10px 32px rgba(236,149,184,.35)}}',
          '@keyframes _stkKitBlink{0%,100%{opacity:1}50%{opacity:0.4}}',
          '#stk-kit-card{box-sizing:border-box;background:linear-gradient(145deg,#1e1115 0%,#180e12 60%,#1c1018 100%);border:1.5px solid rgba(236,149,184,0.45);border-radius:18px;padding:24px 22px 20px;margin:32px 0 20px;position:relative;overflow:hidden;}',
          '#stk-kit-card::before{content:"";position:absolute;top:0;left:10%;width:80%;height:2px;background:linear-gradient(90deg,transparent,rgba(236,149,184,.7),transparent);pointer-events:none;}',
          '#stk-kit-card::after{content:"";position:absolute;top:0;left:0;width:35%;height:100%;background:linear-gradient(90deg,transparent,rgba(236,149,184,.06),transparent);transform:translateX(-130%) skewX(-18deg);animation:_stkKitShimmer 5s ease-in-out 2s infinite;pointer-events:none;}',
          '.stk-kit__badge-row{display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap;}',
          '.stk-kit__badge{font-family:Prompt,"Arial Black",sans-serif;font-size:11px;font-weight:800;letter-spacing:0.08em;padding:4px 10px;border-radius:20px;text-transform:uppercase;}',
          '.stk-kit__badge--new{background:rgba(236,149,184,0.15);color:#ec95b8;border:1px solid rgba(236,149,184,0.4);}',
          '.stk-kit__badge--off{background:linear-gradient(135deg,#b83280,#ec95b8);color:#fff;border:none;}',
          '.stk-kit__headline{font-family:Prompt,"Arial Black",sans-serif;font-size:18px;font-weight:700;color:#f5e6ef;margin:0 0 6px;line-height:1.3;}',
          '.stk-kit__sub{font-family:Arimo,Arial,sans-serif;font-size:13px;color:rgba(236,149,184,.75);margin:0 0 18px;}',
          '.stk-kit__prods{display:flex;flex-direction:column;gap:8px;margin-bottom:18px;}',
          '.stk-kit__prod-item{display:flex;align-items:center;gap:10px;background:rgba(236,149,184,.06);border-radius:8px;padding:8px 12px;}',
          '.stk-kit__prod-num{width:22px;height:22px;border-radius:50%;background:rgba(236,149,184,.18);color:#ec95b8;font-family:Prompt,sans-serif;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;}',
          '.stk-kit__prod-name{flex:1;font-family:Arimo,Arial,sans-serif;font-size:13px;font-weight:600;color:#f0dce6;}',
          '.stk-kit__prod-price{font-family:Arimo,Arial,sans-serif;font-size:13px;color:rgba(236,149,184,.7);white-space:nowrap;}',
          '.stk-kit__price-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px;}',
          '.stk-kit__price-original{font-family:Arimo,Arial,sans-serif;font-size:16px;color:rgba(236,149,184,.5);text-decoration:line-through;}',
          '.stk-kit__price-final{font-family:Prompt,"Arial Black",sans-serif;font-size:26px;font-weight:800;color:#ec95b8;}',
          '.stk-kit__shipping-badge{font-family:Arimo,Arial,sans-serif;font-size:12px;font-weight:700;color:#4ade80;background:rgba(74,222,128,.12);border:1px solid rgba(74,222,128,.3);border-radius:20px;padding:3px 10px;}',
          '.stk-kit__countdown-wrap{display:flex;align-items:center;gap:10px;background:rgba(0,0,0,.25);border-radius:10px;padding:10px 14px;margin-bottom:18px;}',
          '.stk-kit__countdown-label{font-family:Arimo,Arial,sans-serif;font-size:12px;color:rgba(236,149,184,.7);}',
          '.stk-kit__countdown-timer{font-family:Prompt,"Arial Black",sans-serif;font-size:22px;font-weight:800;color:#f5e6ef;letter-spacing:0.06em;min-width:70px;}',
          '.stk-kit__cta{display:block;width:100%;box-sizing:border-box;position:relative;overflow:hidden;background:linear-gradient(135deg,#b83280 0%,#8b1a6b 55%,#9c2073 100%);color:#fff;border:none;border-radius:14px;padding:20px 28px;min-height:62px;font-family:Prompt,"Arial Black",sans-serif;font-size:17px;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;text-align:center;cursor:pointer;margin-bottom:12px;box-shadow:0 10px 32px rgba(184,50,128,.45),inset 0 1px 0 rgba(255,255,255,.12);animation:_stkKitPulse 3s ease-in-out 1s infinite;transition:filter 0.2s,transform 0.2s;}',
          '.stk-kit__cta:hover{filter:brightness(1.12);transform:translateY(-2px);}',
          '.stk-kit__cta:disabled{animation:none;opacity:0.5;cursor:not-allowed;}',
          '.stk-kit__guarantee{font-family:Arimo,Arial,sans-serif;font-size:12px;color:rgba(236,149,184,.6);text-align:center;margin:0;}',
        ].join('');
        document.head.appendChild(st);
      }

    })(); // fin shatokbInyectarStarterKit
    // ══════════════════════════════════════════════════════════════
    // FIN KOI STARTER KIT
    // ══════════════════════════════════════════════════════════════

    // ── Wrapper Full Routine con badge 25% OFF ────────────────────────────────
    var fullWrap = document.createElement('div');
    fullWrap.id = 'stk-full-routine-wrap';
    fullWrap.style.cssText = 'margin-top:28px;opacity:0;transform:translateY(12px);transition:opacity 0.4s ease 0.1s,transform 0.4s ease 0.1s;';

    // Badge superior "Mejor valor · 25% OFF · Free shipping"
    var fullBadge = document.createElement('div');
    fullBadge.id = 'stk-full-badge';
    fullBadge.innerHTML =
      '<span style="font-family:Prompt,sans-serif;font-size:11px;font-weight:800;letter-spacing:0.07em;text-transform:uppercase;color:#f5e6ef;">⭐ BEST VALUE</span>' +
      '<span style="font-family:Arimo,Arial,sans-serif;font-size:11px;color:rgba(236,149,184,.8);">·</span>' +
      '<span style="font-family:Prompt,sans-serif;font-size:11px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;background:linear-gradient(135deg,#6366f1,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">25% OFF</span>' +
      '<span style="font-family:Arimo,Arial,sans-serif;font-size:11px;color:rgba(236,149,184,.8);">·</span>' +
      '<span style="font-family:Arimo,Arial,sans-serif;font-size:11px;font-weight:700;color:#4ade80;">🚚 Free shipping</span>';
    fullBadge.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;' +
      'background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.3);border-radius:10px 10px 0 0;' +
      'padding:8px 14px;';

    var btn = document.createElement('button');
    btn.id        = 'stk-add-btn-bottom';
    btn.type      = 'button';
    btn.className = 'stk-cta-bottom';
    btn.textContent = '✦ Add my full routine — 25% OFF ✦';
    btn.style.cssText = [
      'display:block',
      'width:100%',
      'box-sizing:border-box',
      'position:relative',
      'overflow:hidden',
      'background:linear-gradient(135deg,#2b1e24 0%,#1c181a 55%,#261820 100%)',
      'color:#ec95b8',
      'border:1.5px solid rgba(99,102,241,0.55)',
      'border-radius:0 0 14px 14px',
      'padding:20px 28px',
      'min-height:62px',
      'font-family:Prompt,"Arial Black",sans-serif',
      'font-size:17px',
      'font-weight:800',
      'letter-spacing:0.04em',
      'text-transform:uppercase',
      'text-align:center',
      'cursor:pointer',
      'margin-top:0',
      'box-shadow:0 8px 28px rgba(99,102,241,0.22),inset 0 1px 0 rgba(255,255,255,0.08)'
    ].join(';');

    // Click → añadir TODOS los productos + código KOI25FULL
    btn.addEventListener('click', async function() {
      var self = this;
      self.disabled    = true;
      self.textContent = '⏳ Adding your full routine...';
      try {
        var allHandles = Object.entries(shatokbState.selectedProducts || {})
          .map(function(e) {
            var prod = SHATOKB_CATALOGO.find(function(p) { return p.id === e[1]; });
            return prod ? (prod.handle || prod.id) : null;
          })
          .filter(Boolean);

        if (allHandles.length === 0) throw new Error('No products selected.');

        var vRequests = allHandles.map(function(handle) {
          return fetch('/products/' + handle + '.js')
            .then(function(r) { return r.ok ? r.json() : null; })
            .then(function(d) { return d && d.variants && d.variants[0] ? d.variants[0].id : null; })
            .catch(function() { return null; });
        });
        var vIds = await Promise.all(vRequests);
        var items = vIds.filter(Boolean).map(function(id) { return { id: id, quantity: 1 }; });
        if (items.length === 0) throw new Error('Could not load products.');

        var cartRes = await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: items })
        });
        if (!cartRes.ok) throw new Error('Could not add to cart.');

        self.textContent = '✓ Full routine added! Going to checkout...';
        setTimeout(function() { window.location.href = '/checkout?discount=KOI25FULL'; }, 600);
      } catch(err) {
        console.error('[SHATOKB FULL]', err);
        self.disabled    = false;
        self.textContent = '✦ Add my full routine — 25% OFF ✦';
        if (typeof shatokbAddAllToCart === 'function') shatokbAddAllToCart();
      }
    });

    // Hover
    btn.addEventListener('mouseenter', function () {
      this.style.background   = 'linear-gradient(135deg,#36212a 0%,#271d22 55%,#301e27 100%)';
      this.style.borderColor  = 'rgba(99,102,241,0.85)';
      this.style.color        = '#c4b5fd';
      this.style.transform    = 'translateY(-2px)';
      this.style.boxShadow    = '0 0 0 4px rgba(99,102,241,0.12),0 16px 40px rgba(99,102,241,0.30)';
    });
    btn.addEventListener('mouseleave', function () {
      this.style.background   = 'linear-gradient(135deg,#2b1e24 0%,#1c181a 55%,#261820 100%)';
      this.style.borderColor  = 'rgba(99,102,241,0.55)';
      this.style.color        = '#ec95b8';
      this.style.transform    = '';
      this.style.boxShadow    = '0 8px 28px rgba(99,102,241,0.22),inset 0 1px 0 rgba(255,255,255,0.08)';
    });

    fullWrap.appendChild(fullBadge);
    fullWrap.appendChild(btn);

    var ctasEl = document.getElementById('shatokb-ctas');
    if (ctasEl && ctasEl.parentNode === blurred) {
      blurred.insertBefore(fullWrap, ctasEl);
    } else {
      blurred.appendChild(fullWrap);
    }

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        fullWrap.style.opacity   = '1';
        fullWrap.style.transform = 'translateY(0)';
      });
    });

    if (!document.getElementById('stk-cta-bottom-style')) {
      var s = document.createElement('style');
      s.id = 'stk-cta-bottom-style';
      s.textContent =
        '@keyframes _stkShimmer{0%{transform:translateX(-130%) skewX(-18deg)}100%{transform:translateX(270%) skewX(-18deg)}}' +
        '@keyframes _stkPulse{0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,0),0 8px 28px rgba(99,102,241,.22),inset 0 1px 0 rgba(255,255,255,.08)}50%{box-shadow:0 0 0 6px rgba(99,102,241,.10),0 8px 28px rgba(99,102,241,.22),inset 0 1px 0 rgba(255,255,255,.08)}}' +
        '#stk-add-btn-bottom{animation:_stkPulse 3.5s ease-in-out 1s infinite!important;}' +
        '#stk-add-btn-bottom::before{content:"";position:absolute;top:0;left:0;width:38%;height:100%;background:linear-gradient(90deg,transparent,rgba(99,102,241,.12),transparent);transform:translateX(-130%) skewX(-18deg);animation:_stkShimmer 4s ease-in-out 1.5s infinite;pointer-events:none;}' +
        '#stk-add-btn-bottom::after{content:"";position:absolute;top:0;left:10%;width:80%;height:1px;background:linear-gradient(90deg,transparent,rgba(99,102,241,.45),transparent);pointer-events:none;}';
      document.head.appendChild(s);
    }
  }, delayBtn);
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
// Momento badge labels
const SHATOKB_MOMENTO_BADGE = {
  am:   { icon: '☀️', label: 'Morning',    cls: 'stk-momento--am' },
  pm:   { icon: '🌙', label: 'Night',      cls: 'stk-momento--pm' },
  both: { icon: '🔄', label: 'AM & PM',    cls: 'stk-momento--both' },
};

/**
 * Returns a contextual icon for each product archetype.
 * Used in the product card archetype pill.
 * @param {string} archetype — from excel_archetype field
 * @returns {string} emoji icon
 */
function shatokbArchetypeIcon(archetype) {
  const ICONS = {
    'Barrier Specialist':      '🛡️',
    'Acne Specialist':         '🎯',
    'Pigmentation Specialist': '✨',
    'Aging Specialist':        '⏳',
  };
  return ICONS[archetype] || '🌿';
}

function shatokbRenderPasoHTML(paso, stepIdx, budgetMax, displayNum) {
  // ── Momento badge for the step ───────────────────────────────
  const momentoData = SHATOKB_MOMENTO_BADGE[paso.momento] || SHATOKB_MOMENTO_BADGE.both;
  const momentoBadge = `
    <span class="stk-momento-badge ${momentoData.cls}" title="When to use: ${momentoData.label}">
      ${momentoData.icon} ${momentoData.label}
    </span>`;

  const opcionesHTML = paso.opciones.map(prod => {
    const isSelected  = shatokbState.selectedProducts[stepIdx] === prod.id;
    const overBudget  = prod.precio_num > budgetMax;
    const viewers     = shatokbViewersCount(prod.handle || prod.id);
    const stock       = shatokbStockCount(prod.handle || prod.id);
    const nombreSafe  = prod.nombre.replace(/'/g, '&#39;');
    const pasoSafe    = paso.paso.replace(/'/g, '&#39;');
    const precioSafe  = String(prod.precio).replace(/'/g, '&#39;');

    // ── EXCEL_INTEL badge logic ──────────────────────────────────
    // CORE_MATCH  = ⭐ Expert Pick  (highest editorial priority)
    // auto        = ✦ New Arrival  (auto-classified, not yet in Excel)
    // NO_PREGNANCY = 🤰 safety warning (prominent, always shown)
    // Archetype tag = subtle category signal
    const isCoreMatch   = prod.excel_tier === 'CORE_MATCH';
    const isAutoClass   = prod.excel_auto === true;
    const archetype     = prod.excel_archetype || null;

    // Build primary badge HTML — priority order:
    //   1. CORE_MATCH ⭐   (premium editorial pick)
    //   2. Budget warning  (critical UX signal)
    //   3. Auto-classified ✦ New Arrival (subtle — recently added to store)
    //   4. Generic badge   (Best Seller, Trending, etc.)
    let badgeHtml = '';
    if (isCoreMatch) {
      badgeHtml = `<div class="stk-prod-option__badge stk-prod-option__badge--core">⭐ Expert Pick</div>`;
    } else if (overBudget) {
      badgeHtml = `<div class="stk-prod-option__badge">⚠️ Above your budget</div>`;
    } else if (isAutoClass) {
      badgeHtml = `<div class="stk-prod-option__badge stk-prod-option__badge--new">✦ New Arrival</div>`;
    } else if (prod.badge) {
      badgeHtml = `<div class="stk-prod-option__badge stk-prod-option__badge--neutral">${prod.badge}</div>`;
    }

    // Archetype tag — small metadata pill below name
    // Auto-classified products show archetype too (inferred) but with muted style
    const archetypeHtml = archetype
      ? `<div class="stk-prod-archetype${isAutoClass ? ' stk-prod-archetype--auto' : ''}">${shatokbArchetypeIcon(archetype)} ${archetype}</div>`
      : '';

    // ── Risk flags badges ────────────────────────────────────────
    // NO_PREGNANCY from Excel is authoritative and shown prominently.
    const riskBadges = (prod.risk || []).map(r => {
      const RISK_LABELS = {
        'pm_only':      '🌙 Night use only',
        'am_only':      '☀️ Morning use only',
        'no_pregnant':  '🤰 Avoid during pregnancy',
        'start_slow':   '⏱️ Introduce gradually',
        'high_potency': '💪 High potency',
        'spf_required': '☀️ Always pair with SPF',
        'patch_test':   '🧪 Patch test first',
      };
      return RISK_LABELS[r]
        ? `<span class="stk-risk-badge${r === 'no_pregnant' ? ' stk-risk-badge--pregnancy' : ''}">${RISK_LABELS[r]}</span>`
        : '';
    }).join('');

    // Extra: budget warning as a risk badge if it wasn't the main badge
    const budgetWarning = (overBudget && isCoreMatch)
      ? `<span class="stk-risk-badge stk-risk-badge--budget">⚠️ Above your budget</span>`
      : '';

    // Key ingredients badges (top 2)
    const ingBadges = (prod.ingredientes || []).slice(0, 2).map(ing => {
      const label = ing.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return `<span class="stk-ing-badge">${label}</span>`;
    }).join('');

    // CORE_MATCH: editorial explainer. Auto-classified: soft disclaimer.
    const coreMatchExplainer = isCoreMatch
      ? `<div class="stk-core-match-explainer">
           <span class="stk-core-match-explainer__icon">✦</span>
           Editorially selected as best-in-class for your profile — validated across multiple skin types.
         </div>`
      : isAutoClass
        ? `<div class="stk-auto-class-note">
             Recently added to our store — full editorial review coming soon.
           </div>`
        : '';

    return `
      <div class="stk-prod-option${isSelected ? ' selected' : ''}${isCoreMatch ? ' stk-prod-option--core-match' : ''}${isAutoClass ? ' stk-prod-option--auto' : ''}"
           onclick="shatokbSeleccionarProducto(${stepIdx},'${prod.id}',this)"
           role="radio" aria-checked="${isSelected}" tabindex="0"
           data-handle="${prod.handle || prod.id}"
           data-tier="${prod.excel_tier || 'auto'}"
           data-archetype="${archetype || ''}"
           data-auto="${isAutoClass}">
        ${badgeHtml}
        <div class="stk-prod-option__img">
          ${prod.imagen
            ? `<img src="${prod.imagen}" alt="${prod.nombre}" loading="lazy" style="width:100%;height:100%;object-fit:contain;display:block;">`
            : `<span style="font-size:40px;line-height:1;">${prod.emoji}</span>`
          }
        </div>
        <div class="stk-prod-option__name">${prod.nombre}</div>
        ${archetypeHtml}
        <div class="stk-prod-reviews" id="rev-${prod.id}">
          <span style="color:#f0a500;">★★★★★</span>
          <span style="font-size:11px;color:#9ca3af">loading…</span>
        </div>
        <div class="stk-prod-urgency">
          <span class="stk-prod-urgency__viewers">👀 ${viewers} people viewing now</span>
          <span class="stk-prod-urgency__stock">⚡ Only ${stock} left in stock</span>
        </div>
        ${ingBadges ? `<div class="stk-prod-ing-badges">${ingBadges}</div>` : ''}
        ${(riskBadges || budgetWarning) ? `<div class="stk-prod-risk-badges">${riskBadges}${budgetWarning}</div>` : ''}
        ${coreMatchExplainer}
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

  const numOpciones = paso.opciones.length;
  const pickLabels = {
    es: { bold: `Elige 1 de ${numOpciones}`, soft: `— todas son igual de efectivas para tu piel` },
    en: { bold: `Choose 1 of ${numOpciones}`, soft: `— all equally effective for your skin` },
    fr: { bold: `Choisissez 1 sur ${numOpciones}`, soft: `— toutes également efficaces pour votre peau` },
    pt: { bold: `Escolha 1 de ${numOpciones}`, soft: `— todas igualmente eficazes para sua pele` },
    de: { bold: `Wähle 1 von ${numOpciones}`, soft: `— alle gleich wirksam für deine Haut` },
    it: { bold: `Scegli 1 di ${numOpciones}`, soft: `— tutte ugualmente efficaci per la tua pelle` },
  };
  const lang = (typeof detectarIdioma === 'function' ? detectarIdioma() : null) ||
               document.documentElement.lang?.slice(0,2) || 'en';
  const pick = pickLabels[lang] || pickLabels['en'];

  return `
    <div class="stk-routine-step shatokb-paso" data-step="${stepIdx}" data-momento="${paso.momento || 'both'}">
      <div class="stk-routine-step__header">
        <div class="stk-routine-step__num">${displayNum !== undefined ? displayNum : stepIdx + 1}</div>
        <div style="flex:1;min-width:0;">
          <div class="stk-routine-step__name">
            ${paso.paso}
            ${momentoBadge}
          </div>
          <div class="stk-routine-step__why">${paso.por_que}</div>
        </div>
      </div>
      <div class="stk-routine-step__body">
        <div class="stk-step-pick-hint">
          <span class="stk-step-pick-hint__icon">👆</span>
          <p class="stk-step-pick-hint__text">
            ${pick.bold} <span>${pick.soft}</span>
          </p>
        </div>
        <div class="stk-routine-step__options">${opcionesHTML}</div>
      </div>
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

  // ── Textos del timer según idioma del navegador ──────────
  const _lang = (navigator.language || 'en').split('-')[0].toLowerCase();
  const _timerI18n = {
    es: { running: 'Rutina guardada por',    expired: '⚠️ Sesión expirada — vuelve a hacer el quiz' },
    fr: { running: 'Routine sauvegardée',    expired: '⚠️ Session expirée — refais le quiz' },
    pt: { running: 'Rotina salva por',       expired: '⚠️ Sessão expirada — refaça o quiz' },
    de: { running: 'Routine gespeichert für', expired: '⚠️ Sitzung abgelaufen — Quiz wiederholen' },
    it: { running: 'Routine salvata per',    expired: '⚠️ Sessione scaduta — rifai il quiz' },
  };
  const _tt = _timerI18n[_lang] || { running: 'Routine saved for', expired: '⚠️ Session expired — retake quiz to save your routine' };

  const tick = () => {
    if (s < 0) { clearInterval(shatokbTimerInterval); return; }
    const m   = String(Math.floor(s / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    el.textContent = `⏱️ ${_tt.running} ${m}:${sec}`;
    if (s <= 60)  el.classList.add('stk-total-bar__timer--urgent');
    if (s === 0) {
      el.textContent = _tt.expired;
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
  const btn       = document.getElementById('stk-add-btn');
  const btnBottom = document.getElementById('stk-add-btn-bottom');
  if (!btn && !btnBottom) return;

  function _syncBtns(disabled, text) {
    if (btn)       { btn.disabled = disabled; if (text) btn.textContent = text; }
    if (btnBottom) { btnBottom.disabled = disabled; if (text) btnBottom.textContent = text; }
  }

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
    _syncBtns(true, '⏳ Un momento...');
    window.shatokbInterceptarCarrito(function () {
      _syncBtns(true, '⏳ Adding to cart...');
      shatokbEjecutarAddToCart(handles, btn || btnBottom);
    });
    return;
  }

  _syncBtns(true, '⏳ Adding to cart...');

  shatokbEjecutarAddToCart(handles, btn);
}

async function shatokbEjecutarAddToCart(handles, btn) {
  try {
    // ── 1. Obtener variantId + datos de producto para cada handle ──────────────────
    // Necesitamos los datos completos del producto (no solo variantId) para
    // construir el payload de actualización del skin report con imágenes reales.
    const productRequests = handles.map(handle =>
      fetch(`/products/${handle}.js`)
        .then(res => { if (!res.ok) throw new Error(`Not found: ${handle}`); return res.json(); })
        .then(data => {
          // Imagen: featured_image puede ser string URL o null en /products/handle.js
          // images[] puede ser array de strings O array de objetos {src, width, ...}
          // FIX v8.2: extraer .src si el elemento es objeto (Shopify API >= 2022 devuelve objetos)
          const imgRaw0 = typeof data.featured_image === 'string'
            ? data.featured_image
            : (data.images && data.images[0])
              ? (typeof data.images[0] === 'object' ? (data.images[0].src || '') : data.images[0])
              : '';
          // Asegurar protocolo completo
          const imagen = imgRaw0.startsWith('//') ? 'https:' + imgRaw0
                       : imgRaw0.startsWith('http') ? imgRaw0
                       : '';
          return {
            handle,
            variantId: data.variants?.[0]?.id || null,
            nombre:    data.title || handle,
            precio:    data.variants?.[0]?.price
                         ? (parseFloat(data.variants[0].price) / 100).toFixed(2)
                         : '',
            imagen,
            url: `https://shatokb.com/products/${handle}`,
          };
        })
        .catch(() => ({ handle, variantId: null, nombre: handle, precio: '', imagen: '', url: '' }))
    );

    const productData = await Promise.all(productRequests);
    const items       = productData.filter(r => r.variantId !== null).map(r => ({ id: r.variantId, quantity: 1 }));

    if (items.length === 0) throw new Error('Could not retrieve product information. Please try again.');

    // ── 2. Añadir al carrito de Shopify ──────────────────────────────────────────
    const cartRes = await fetch('/cart/add.js', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ items })
    });

    if (!cartRes.ok) {
      const err = await cartRes.json().catch(() => ({}));
      throw new Error(err.description || 'Could not add products to cart.');
    }

    // ── 3. PATCH al Worker — actualizar Skin Report con productos reales ──────────
    // Este es el FIX DEFINITIVO del timing bug:
    // El POST /report se envió al capturar el email (productos por defecto).
    // Ahora actualizamos el KV con los productos REALES que se añadieron al carrito.
    // También reenvía el evento Klaviyo con los datos correctos.
    try {
      const workerBase  = 'https://koi-proxy.luisfonse2010.workers.dev';

      // ── waitForToken — lee el token de 3 fuentes con retry ────────────────
      // koi-chat.js lo guarda en window + localStorage + sessionStorage
      // cuando enviarSkinReport() recibe la respuesta del Worker.
      // Si aún no llegó (network lento / cold start) reintentamos hasta 8 s.
      // IMPORTANTE: solo lee el token — no toca NADA del reporte ni del carrito.
      const readToken = () =>
        window.KOI_STATE_REPORT_TOKEN ||
        localStorage.getItem('shatokb_report_token') ||
        sessionStorage.getItem('shatokb_report_token') ||
        null;

      let reportToken = readToken();

      if (!reportToken) {
        console.log('[SHATOKB] Token aún no disponible — esperando (máx 8s)...');
        // Polling cada 400ms, máximo 20 intentos = 8 segundos
        await new Promise(resolve => {
          let intentos = 0;
          const poll = setInterval(() => {
            intentos++;
            reportToken = readToken();
            if (reportToken) {
              clearInterval(poll);
              console.log('%c[SHATOKB] Token recibido en intento ' + intentos + ' ✅', 'color:#22c55e;font-weight:bold');
              resolve();
            } else if (intentos >= 20) {
              clearInterval(poll);
              console.warn('[SHATOKB] Token no llegó tras 8s — PATCH se saltará.');
              resolve();
            }
          }, 400);
        });
      }

      console.log('%c[SHATOKB] PATCH token:', 'color:#22c55e;font-weight:bold', reportToken ? reportToken.slice(0,8) + '…' : '❌ SIN TOKEN — PATCH saltado');

      if (reportToken) {
        // Construir array de productos con los datos reales de Shopify
        // Enriquecer con metadatos del quiz si están disponibles (paso, momento, razon)
        const catalogoVivo  = window.SHATOKB_CATALOGO || [];
        const selectedProds = window.shatokbState?.selectedProducts || {};

        // Mapa de stepIdx → prodId para recuperar metadatos del quiz
        const stepToId = {};
        Object.entries(selectedProds).forEach(([stepIdx, prodId]) => { stepToId[stepIdx] = prodId; });

        const productosParaPatch = productData
          .filter(r => r.variantId !== null)
          .map(r => {
            // Buscar en el catálogo para obtener metadata del quiz (paso, momento, razon)
            const catalogoItem = catalogoVivo.find(c => c.handle === r.handle || c.id === r.handle);

            // Imagen: usar la del catálogo si la del producto no es CDN
            let imagen = r.imagen || '';
            if ((!imagen || !imagen.includes('cdn.shopify.com')) && catalogoItem?.imagen) {
              imagen = catalogoItem.imagen;
            }
            // Normalizar imagen: Shopify devuelve solo la ruta relativa en featured_image a veces
            if (imagen && !imagen.startsWith('http')) {
              imagen = 'https:' + imagen;
            }

            // Normalizar momento: el catálogo usa 'am'|'pm'|'both', el Worker espera 'am'|'pm'|'ambos'.
            // Si el catálogo no tiene momento, inferirlo desde la categoría del producto.
            // La categoría 'spf' siempre es AM-only — regla universal K-Beauty.
            const momentoRaw = (catalogoItem?.momento || '').toLowerCase().trim();
            const categoria  = (catalogoItem?.categoria || '').toLowerCase();
            let momentoFinal;
            if      (momentoRaw === 'am')                 momentoFinal = 'am';
            else if (momentoRaw === 'pm')                 momentoFinal = 'pm';
            else if (categoria  === 'spf')                momentoFinal = 'am';   // SPF siempre AM
            else if (/\bspf\b|sunscreen|solar/.test((r.nombre || '').toLowerCase())) momentoFinal = 'am';
            else                                          momentoFinal = 'ambos';

            return {
              nombre:  r.nombre  || catalogoItem?.nombre || r.handle,
              precio:  r.precio  || catalogoItem?.precio || '',
              paso:    catalogoItem?.categoria || catalogoItem?.paso || '',
              id:      catalogoItem?.id || r.handle,
              handle:  r.handle,
              momento: momentoFinal,
              razon:   catalogoItem?.desc    || '',
              imagen,
              url:     r.url,
            };
          });

        const totalCarritoNuevo = productosParaPatch.reduce((s, p) => {
          const n = parseFloat(String(p.precio || '0').replace(/[^0-9.]/g, '')) || 0;
          return s + n;
        }, 0);

        // Obtener email del localStorage o KOI_STATE
        const emailGuardado = localStorage.getItem('shatokb_email') || '';

        const patchPayload = JSON.stringify({
          productos:    productosParaPatch,
          email:        emailGuardado,
          totalCarrito: totalCarritoNuevo,
        });

        const patchUrl = `${workerBase}/report/${reportToken}`;

        // Intentar con fetch+keepalive primero (respuesta legible)
        // Si falla o payload > 64KB, usar sendBeacon como fallback
        let patchOk = false;
        try {
          const patchRes = await fetch(patchUrl, {
            method:    'PATCH',
            headers:   { 'Content-Type': 'application/json' },
            body:      patchPayload,
            keepalive: true,
          });
          if (patchRes.ok) {
            const patchData = await patchRes.json().catch(() => ({}));
            patchOk = true;
            console.log('[SHATOKB] Skin Report PATCH exitoso ✅', {
              token:     reportToken,
              productos: productosParaPatch.length,
              klaviyo:   patchData.klaviyo?.ok,
            });
          } else {
            console.warn('[SHATOKB] PATCH HTTP error:', patchRes.status);
          }
        } catch (fetchErr) {
          console.warn('[SHATOKB] fetch PATCH falló, intentando sendBeacon:', fetchErr.message);
        }

        // Fallback: sendBeacon — garantizado que sobrevive la navegación
        // sendBeacon solo soporta POST, así que el Worker debe aceptar
        // POST /report/:token/beacon como alias del PATCH
        if (!patchOk && navigator.sendBeacon) {
          const blob = new Blob([patchPayload], { type: 'application/json' });
          const beaconSent = navigator.sendBeacon(patchUrl.replace('/report/', '/report-beacon/'), blob);
          console.log('[SHATOKB] sendBeacon enviado:', beaconSent);
        }
      } else {
        console.warn('[SHATOKB] No se encontró report token — PATCH saltado. El email se habrá enviado con productos por defecto.');
      }
    } catch (patchErr) {
      // El PATCH falla silenciosamente — no interrumpir el flujo del carrito
      console.warn('[SHATOKB] Skin Report PATCH error (silencioso):', patchErr.message);
    }

    const _bb = document.getElementById('stk-add-btn-bottom');
    if (btn) btn.textContent = '✅ Added! Redirecting...';
    if (_bb) _bb.textContent = '✅ Added! Redirecting...';
    // Marcar en sessionStorage para que el scroll al top ocurra al cargar /cart
    try { sessionStorage.setItem('shatokb_scroll_top', '1'); } catch(_) {}
    // Pequeño delay para dar tiempo al PATCH de completarse antes de navegar
    setTimeout(() => { window.location.href = '/cart'; }, 1200);

  } catch (err) {
    console.error('[SHATOKB] addAllToCart error:', err);
    const _bb2 = document.getElementById('stk-add-btn-bottom');
    if (btn)  { btn.disabled  = false; btn.textContent  = '🛒 Add my full routine to cart'; }
    if (_bb2) { _bb2.disabled = false; _bb2.textContent = '✦ Add my full routine to cart ✦'; }
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

  const hookBlock = document.getElementById('stk-hook-block');

  if (resultadoEl) resultadoEl.style.display = 'none';
  if (form)        form.style.display        = 'none';
  if (progreso)    progreso.style.display    = 'none';
  if (cabecera)    cabecera.style.display    = 'block';
  if (inicio)      inicio.style.display      = 'block';
  if (hookBlock)   hookBlock.style.display   = 'block'; // ← vuelve a mostrarse al reiniciar

  const quizSection = document.getElementById('shatokb-quiz');
  if (quizSection) quizSection.scrollIntoView({ behavior: 'smooth' });
}


/* ============================================================
   15a. REVELAR PRODUCTOS
   — Definición canónica en sección 10 arriba (window.shatokbRevelarProductos).
   Esta sección reservada para no romper numeración de bloques.
============================================================ */


/* ============================================================
   15b. SCROLL TO KOI
   Called by the blur overlay CTA button.
   Finds the KOI wrapper and scrolls to it smoothly.
============================================================ */
function shatokbScrollAKOI() {

  // ── Paso 1: ocultar teaser + header de la sección ───────────
  var teaser = document.getElementById('stk-blur-overlay');
  if (teaser) {
    teaser.style.transition = 'opacity 0.25s ease';
    teaser.style.opacity    = '0';
    teaser.style.pointerEvents = 'none';
    setTimeout(function() { teaser.style.display = 'none'; }, 260);
  }

  var revealHeader = document.querySelector('#stk-reveal-section .stk-reveal-header');
  if (revealHeader) {
    revealHeader.style.transition = 'opacity 0.25s ease';
    revealHeader.style.opacity    = '0';
    revealHeader.style.pointerEvents = 'none';
    setTimeout(function() { revealHeader.style.display = 'none'; }, 260);
  }

  var resultHeader = document.querySelector('.shatokb-resultado__header');
  if (resultHeader) {
    resultHeader.style.transition = 'opacity 0.25s ease';
    resultHeader.style.opacity    = '0';
    resultHeader.style.pointerEvents = 'none';
    setTimeout(function() { resultHeader.style.display = 'none'; }, 260);
  }

  var budgetNote = document.querySelector('.stk-budget-note');
  if (budgetNote) {
    budgetNote.style.transition = 'opacity 0.25s ease';
    budgetNote.style.opacity    = '0';
    setTimeout(function() { budgetNote.style.display = 'none'; }, 260);
  }

  // ── Paso 2: mostrar los productos sombreados inmediatamente ──
  var blurred = document.getElementById('stk-routine-blurred');
  if (blurred) blurred.style.display = 'block';

  // ── Paso 3: iniciar KOI con el contexto del quiz ─────────────
  var ctx = window.SHATOKB_RESULTADO
         || (function() {
               try { return JSON.parse(localStorage.getItem('shatokb_resultado') || 'null'); }
               catch(_) { return null; }
            })();

  if (typeof window.shatokbIniciarKOI === 'function') {
    window.shatokbIniciarKOI(ctx || {});
  }

  // ── Paso 4: ocultar footer + scroll hasta el panel KOI ──────
  // Añadir clase al body para ocultar el footer del tema via CSS
  document.body.classList.add('koi--chat-activo');

  setTimeout(function() {
    var koiEl = document.getElementById('shatokb-koi-wrapper');
    if (!koiEl) return;

    // Scroll al top del chat con un margen fijo de 80px (debajo del header de la tienda)
    var rect   = koiEl.getBoundingClientRect();
    var absTop = rect.top + window.pageYOffset;
    window.scrollTo({ top: Math.max(0, absTop - 80), behavior: 'smooth' });
  }, 150);
}


/* ============================================================
   15b-bis. ENRIQUECER RESPUESTAS CON SCORES DE VISIÓN — v7.3
   Traduce los 8 scores clínicos de la foto (0-10) a signals
   que el scorer shatokbScoreProducto() ya conoce.
   Resultado: los 250 productos se rankean según la piel REAL
   del usuario, no solo sus respuestas de texto.

   Reglas de traducción (conservadoras — no destruyen el quiz):
   • Solo override cuando el score fotográfico es significativo
   • Suma concerns al array, no destruye los del quiz
   • Thresholds calibrados: <4 = señal clara, >7 = señal clara
============================================================ */
window.shatokbEnriquecerRespuestasConVision = function(respuestasBase, visionResult) {
  if (!visionResult || !visionResult.dimensiones) return respuestasBase;

  // Deep copy para no mutar las respuestas originales del quiz
  const r = JSON.parse(JSON.stringify(respuestasBase));
  const dim = visionResult.dimensiones;

  // Helper: score numérico de una dimensión (null-safe)
  const s = (nombre) => {
    const d = dim[nombre];
    return (d && typeof d.score === 'number') ? d.score : null;
  };

  // Asegurar que preocupacion_secundaria es array
  if (!Array.isArray(r.preocupacion_secundaria)) {
    r.preocupacion_secundaria = r.preocupacion_secundaria
      ? [r.preocupacion_secundaria]
      : [];
  }
  // Helper: añadir concern sin duplicar
  const addConcern = (c) => {
    if (r.preocupacion !== c && !r.preocupacion_secundaria.includes(c)) {
      r.preocupacion_secundaria.push(c);
    }
  };

  // ── 1. HIDRATACIÓN ────────────────────────────────────────────
  // Score bajo → piel deshidratada → priorizar humectantes
  const hidScore = s('hidratacion');
  if (hidScore !== null) {
    if (hidScore <= 3) {
      // Deshidratación severa: override tipo_piel a seca si era mixta/normal
      if (r.tipo_piel === 'mixta' || r.tipo_piel === 'normal' || r.tipo_piel === 'nolose') {
        r.tipo_piel = 'seca';
      }
      addConcern('deshidratacion');
    } else if (hidScore <= 5) {
      // Deshidratación moderada: añadir concern sin cambiar tipo
      addConcern('deshidratacion');
    }
  }

  // ── 2. BARRERA ────────────────────────────────────────────────
  // Score bajo → barrera comprometida → activar barrier repair mode
  const barrScore = s('barrera');
  if (barrScore !== null) {
    if (barrScore <= 3) {
      // Barrera muy comprometida: damaged mode → bloquea activos fuertes
      r.sensibilidad = 'damaged';
    } else if (barrScore <= 5 && r.sensibilidad === 'baja') {
      // Barrera moderada: subir sensibilidad a media si quiz decía baja
      r.sensibilidad = 'media';
    }
  }

  // ── 3. SEBO ───────────────────────────────────────────────────
  // Score alto → exceso de sebo → priorizar oil-control
  const seboScore = s('sebum');
  if (seboScore !== null) {
    if (seboScore >= 8) {
      // Sebo muy alto: override tipo_piel a grasa si era mixta/normal
      if (r.tipo_piel === 'mixta' || r.tipo_piel === 'normal') {
        r.tipo_piel = 'grasa';
      }
      addConcern('textura'); // poros y textura asociados al exceso de sebo
    } else if (seboScore >= 6 && r.tipo_piel === 'seca') {
      // Seco en quiz pero foto muestra algo de sebo → realmente mixta
      r.tipo_piel = 'mixta';
    }
  }

  // ── 4. PIGMENTACIÓN ───────────────────────────────────────────
  // Score bajo → manchas/hiperpigmentación visibles
  const pigScore = s('pigmentacion');
  if (pigScore !== null && pigScore <= 5) {
    addConcern('manchas');
  }

  // ── 5. MICROBIOMA ─────────────────────────────────────────────
  // Score bajo → congestión, tendencia acneica visible
  const micScore = s('microbioma');
  if (micScore !== null && micScore <= 4) {
    addConcern('acne');
  }

  // ── 6. FIRMEZA ────────────────────────────────────────────────
  // Score bajo → pérdida de firmeza visible → antiaging
  const firmScore = s('firmeza');
  if (firmScore !== null && firmScore <= 5) {
    addConcern('antiaging');
    // Si la foto indica envejecimiento y el quiz no lo mencionó,
    // también subir tolerancia a ingredientes si estaba en 'none'
    if (r.ingredient_tolerance === 'none') {
      r.ingredient_tolerance = 'basic';
    }
  }

  // ── 7. TEXTURA ────────────────────────────────────────────────
  const texScore = s('textura');
  if (texScore !== null && texScore <= 4) {
    addConcern('textura');
  }

  // ── 8. CIRCULACIÓN (ojeras, apagamiento) ──────────────────────
  // Score bajo → piel apagada → glow / circulación
  const circScore = s('circulacion');
  if (circScore !== null && circScore <= 4) {
    // No hay concern directo para circulación → boost a glow
    if (r.objetivo === 'glow' || !r.objetivo) {
      // ya está bien orientado
    } else if (!r.objetivo) {
      r.objetivo = 'glow';
    }
  }

  // ── Guardar flag de enriquecimiento para trazabilidad ─────────
  r._vision_enriched = true;
  r._vision_score_global = visionResult.score_global || null;

  return r;
};


/* ============================================================
   15c. CAMBIAR PERFIL DINÁMICAMENTE — KOI Vision Override
   Llamado por KOI cuando el análisis de la foto revela que
   el perfil del quiz NO coincide con lo que se ve en la imagen.
   Re-renderiza la rutina completa con el perfil corregido.
============================================================ */
window.shatokbCambiarPerfil = async function (nuevoPerfilId, respuestasEnriquecidas) {
  const PERFILES_VALIDOS = [
    'grasa_acne','grasa_poros','mixta_general','mixta_manchas',
    'seca_hidratacion','seca_antiaging','sensible_rojeces','general_glow'
  ];

  // ── Capturar perfil anterior ANTES de cualquier cambio ───────────
  // Necesario para el log y el evento — sin esta línea era ReferenceError.
  const perfilActual = shatokbState.perfilOverride || shatokbState.perfilId || nuevoPerfilId;

  // ── Si hay respuestas enriquecidas con foto, recalcular el perfil
  // más adecuado usando el scorer de perfiles, en lugar de confiar
  // ciegamente en el perfil_id que propone el Worker (que puede ser
  // genérico). La foto + quiz juntos producen una señal más precisa.
  if (respuestasEnriquecidas && respuestasEnriquecidas._vision_enriched) {
    const perfilCalculado = shatokbCalcularPerfil(respuestasEnriquecidas);
    if (PERFILES_VALIDOS.includes(perfilCalculado) && perfilCalculado !== nuevoPerfilId) {
      console.log('[KOI Vision] 🔬 Perfil recalculado con foto+quiz:', nuevoPerfilId, '→', perfilCalculado);
      nuevoPerfilId = perfilCalculado;
    }
  }

  if (!PERFILES_VALIDOS.includes(nuevoPerfilId)) {
    console.warn('[KOI Vision] Perfil inválido ignorado:', nuevoPerfilId);
    return false;
  }

  // 1. Guardar override y respuestas enriquecidas
  shatokbState.perfilOverride = nuevoPerfilId;
  // Si se pasaron respuestas enriquecidas por foto, usarlas para el scorer
  const respuestasParaScorer = respuestasEnriquecidas || shatokbState.respuestas;
  if (respuestasEnriquecidas) {
    shatokbState.respuestasEnriquecidas = respuestasEnriquecidas;
  }

  // 2. Obtener datos del nuevo perfil y productos
  const nuevoPerfil = SHATOKB_PERFILES[nuevoPerfilId];
  if (!nuevoPerfil) return false;

  // Esperar catálogo si aún cargando
  if (!shatokbCatalogoCargado) {
    await new Promise(resolve => {
      const check = setInterval(() => {
        if (shatokbCatalogoCargado) { clearInterval(check); resolve(); }
      }, 100);
    });
  }

  // ★ Usar respuestas enriquecidas para que el scorer seleccione
  // los productos más adecuados para la piel REAL (foto + quiz)
  const pasosProd = shatokbRecomendarProductos(nuevoPerfilId, respuestasParaScorer);

  // 3. Pre-select top option para cada paso
  shatokbState.selectedProducts = {};
  pasosProd.forEach((paso, i) => {
    if (paso.opciones.length > 0) shatokbState.selectedProducts[i] = paso.opciones[0].id;
  });

  // 4. Re-renderizar header del resultado con nuevo perfil
  const nombreEl = document.querySelector('.shatokb-resultado__perfil-nombre');
  if (nombreEl) {
    nombreEl.style.transition = 'opacity 0.3s ease';
    nombreEl.style.opacity = '0';
    setTimeout(() => {
      nombreEl.textContent = nuevoPerfil.titulo;
      nombreEl.style.opacity = '1';
    }, 300);
  }

  // 5. Re-renderizar badges
  const badgesEl = document.querySelector('.shatokb-resultado__badges');
  if (badgesEl && nuevoPerfil.resumen) {
    badgesEl.style.opacity = '0';
    setTimeout(() => {
      badgesEl.innerHTML = nuevoPerfil.resumen
        .map(t => `<span class="shatokb-resultado__badge">${t}</span>`).join('');
      badgesEl.style.transition = 'opacity 0.3s ease';
      badgesEl.style.opacity = '1';
    }, 400);
  }

  // 6. Re-renderizar descripción
  const descEl = document.querySelector('.shatokb-resultado__desc');
  if (descEl) {
    descEl.style.opacity = '0';
    setTimeout(() => {
      descEl.textContent = nuevoPerfil.descripcion;
      descEl.style.transition = 'opacity 0.3s ease';
      descEl.style.opacity = '1';
    }, 450);
  }

  // 7. Re-renderizar pasos de rutina
  const stepsContainer = document.getElementById('shatokb-routine-steps');
  if (stepsContainer && pasosProd.length > 0) {
    const presupuesto  = shatokbState.respuestas.presupuesto;
    const budgetMax    = SHATOKB_BUDGET_LIMITS[presupuesto] || Infinity;
    stepsContainer.style.transition = 'opacity 0.3s ease';
    stepsContainer.style.opacity = '0';
    setTimeout(() => {
      stepsContainer.innerHTML = pasosProd.map((paso, i) =>
        shatokbRenderPasoHTML(paso, i, budgetMax, i + 1)
      ).join('');
      stepsContainer.style.opacity = '1';
      // Disparar reviews y urgency en los nuevos elementos
      try { shatokbActualizarReviewsDOM(); } catch(_) {}
      try { shatokbActualizarUrgencyDOM(); } catch(_) {}
    }, 500);
  }

  // 8. Emitir evento para que otros módulos (KOI cart, etc.) se enteren
  document.dispatchEvent(new CustomEvent('koi:perfil-actualizado', {
    detail: {
      perfilAnterior:       perfilActual,
      perfilNuevo:          nuevoPerfilId,
      perfil:               nuevoPerfil,
      visionEnriquecido:    !!(respuestasEnriquecidas && respuestasEnriquecidas._vision_enriched),
      visionScoreGlobal:    respuestasEnriquecidas?._vision_score_global || null,
    }
  }));

  console.log(`[KOI Vision] ✅ Perfil cambiado: ${perfilActual} → ${nuevoPerfilId} | vision_enriched: ${!!(respuestasEnriquecidas?._vision_enriched)}`);
  return true;
};


/* ============================================================
   16. INIT
   1. Apply config to hero immediately on DOMContentLoaded.
   2. Start fetching the live catalogue in the background so
      it's ready by the time the user finishes all 6 questions.
============================================================ */
// ── Exponer en window para garantizar scope global ──────────────
// koi-chat.js (IIFE) necesita estos para añadir al carrito:
//   • shatokbState.selectedProducts  → qué producto eligió el usuario
//   • SHATOKB_CATALOGO               → de qué handle es cada producto
//   • shatokbEjecutarAddToCart       → la función que hace el fetch /cart/add.js
window.shatokbIniciarQuiz         = shatokbIniciarQuiz;
window.shatokbState               = shatokbState;
window.SHATOKB_CATALOGO           = SHATOKB_CATALOGO;
window.shatokbEjecutarAddToCart   = shatokbEjecutarAddToCart;
window.shatokbAddAllToCart        = shatokbAddAllToCart;

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
   NOTA: El interceptor global de clicks fue eliminado.
   El bloqueo del tema Halo se maneja con stopPropagation()
   directamente en el listener delegado del container, lo que
   es más quirúrgico y evita bloquear los propios listeners
   del quiz en la fase de capture.
============================================================ */

/* ============================================================
   SCROLL AL TOP EN /cart — Fix mobile footer visible
   Cuando el usuario llega al carrito desde el botón KOI,
   el tema Shopify a veces renderiza el footer primero en mobile.
   Detectamos la flag de sessionStorage y forzamos scroll(0,0)
   inmediatamente, antes del primer paint visible.
============================================================ */
(function() {
  try {
    if (sessionStorage.getItem('shatokb_scroll_top') === '1') {
      sessionStorage.removeItem('shatokb_scroll_top');

      // Ejecutar inmediatamente — antes de que el DOM esté listo
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      // Refuerzo en DOMContentLoaded (por si el tema hace scroll propio al cargar)
      document.addEventListener('DOMContentLoaded', function() {
        window.scrollTo({ top: 0, behavior: 'instant' });
      });

      // Refuerzo en load completo (último recurso — cubre lazy load que empuja el scroll)
      window.addEventListener('load', function() {
        window.scrollTo({ top: 0, behavior: 'instant' });
      });
    }
  } catch(_) {}
})();
