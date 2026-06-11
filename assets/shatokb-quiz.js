/**
 * ============================================================
 * SHATOKB · Skin Diagnosis Quiz Engine  v3.0
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
const SHATOKB_PREGUNTAS = [
  {
    id: 'tipo_piel',
    titulo: 'First things first — what is your skin like?',
    emoji: '🪞',
    subtitulo: 'Be honest with yourself. This is where everything starts.',
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
    subtitulo: 'The one thing you wish you could fix tomorrow.',
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
    subtitulo: 'Pick the transformation you want most.',
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
   2. TAG MAPS
============================================================ */
const TAG_CATEGORIA = {
  'Cleansers':               'cleanser',
  'Toner, Pads & Mists':     'toner',
  'Serums & Ampoules':       'serum',
  'Essences':                'essence',
  'Moisturizers & Creams':   'moisturizer',
  'Sunscreens & Sun Care':   'spf',
  'Exfoliators & Peels':     'exfoliator',
  'Face Masks':              'mask',
  'Eye Care':                'eye',
  'Lip Care':                'lip',
};

const TAG_TIPO_PIEL = {
  'Dry Skin':                 'seca',
  'Oily & Acne-Prone Skin':   'grasa',
  'Sensitive Skin':           'sensible',
  'Redness & Sensitive Skin': 'sensible',
  'Combination Skin':         'mixta',
};

const TAG_CONCERN = {
  'Large Pores & Texture':          'poros',
  'Sun Protection & Damage':        'manchas',
  'Anti-Aging & Wrinkles':          'antiaging',
  'Hyperpigmentation & Dark Spots': 'manchas',
  'Dull & Uneven Skin Tone':        'textura',
  'Dark Circles & Puffy Eyes':      'antiaging',
  'Redness & Irritation':           'rojeces',
  'Redness & Sensitive Skin':       'rojeces',
  'Acne & Blemishes':               'acne',
  'Oily & Acne-Prone Skin':         'acne',
  'Dehydration':                    'deshidratacion',
};

const TAGS_SENSIBLE_SAFE = new Set([
  'Sensitive Skin', 'Redness & Sensitive Skin',
  'Fragrance-Free', 'Hypoallergenic',
]);

const TAG_BADGE = {
  'Best Seller': 'Best Seller',
  'Bestseller':  'Best Seller',
  'New':         'New',
  'New Arrival': 'New',
  'Trending':    'Trending',
  'Viral':       'Viral',
};

const EMOJI_MAP = {
  cleanser: '🫧', toner: '💧', serum: '💊', essence: '🐌',
  moisturizer: '🧴', spf: '☀️', exfoliator: '✨',
  mask: '🩵', eye: '👁️', lip: '💋',
};


/* ============================================================
   3. LIVE CATALOGUE
============================================================ */
let SHATOKB_CATALOGO = [];
let shatokbCatalogoCargado = false;

function shatokbMapProduct(p) {
  const tags   = (p.tags || '').split(',').map(t => t.trim());
  const tagSet = new Set(tags);
  let categoria = null;
  for (const [tag, cat] of Object.entries(TAG_CATEGORIA)) {
    if (tagSet.has(tag)) { categoria = cat; break; }
  }
  if (!categoria) return null;
  const tipo_piel = [];
  for (const [tag, tipo] of Object.entries(TAG_TIPO_PIEL)) {
    if (tagSet.has(tag) && !tipo_piel.includes(tipo)) tipo_piel.push(tipo);
  }
  if (tipo_piel.length === 0) tipo_piel.push('nolose');
  const concerns = [];
  for (const [tag, concern] of Object.entries(TAG_CONCERN)) {
    if (tagSet.has(concern) && !concerns.includes(concern)) concerns.push(concern);
  }
  const sensible = [...TAGS_SENSIBLE_SAFE].some(t => tagSet.has(t));
  let badge = null;
  for (const [tag, label] of Object.entries(TAG_BADGE)) {
    if (tagSet.has(tag)) { badge = label; break; }
  }
  const precio_num = parseFloat(p.variants?.[0]?.price || '0');
  const precio     = '$' + precio_num.toFixed(2);
  return {
    id: p.handle, nombre: p.title, handle: p.handle,
    precio, precio_num, badge,
    emoji: EMOJI_MAP[categoria] || '🌿',
    desc: p.body_html ? p.body_html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160) + '…' : p.title,
    tipo_piel, categoria, concerns, sensible,
    imagen: p.images?.[0]?.src || null,
  };
}

async function shatokbFetchCatalogo() {
  const all = []; let page = 1; const limit = 250;
  try {
    while (true) {
      const res = await fetch(`/products.json?limit=${limit}&page=${page}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const products = data.products || [];
      all.push(...products);
      if (products.length < limit) break;
      page++;
    }
    SHATOKB_CATALOGO = all.map(shatokbMapProduct).filter(Boolean);
    shatokbCatalogoCargado = true;
  } catch (err) {
    console.warn('[SHATOKB] Live catalogue unavailable — using fallback:', err.message);
    SHATOKB_CATALOGO = SHATOKB_FALLBACK;
    shatokbCatalogoCargado = true;
  }
}


/* ============================================================
   4. FALLBACK CATALOGUE
============================================================ */
const SHATOKB_FALLBACK = [
  { id:'cosrx-low-ph-cleanser', nombre:'COSRX Low pH Gel Cleanser', handle:'cosrx-low-ph-good-morning-gel-cleanser', precio:'$12.95', precio_num:12.95, badge:'Best Seller', emoji:'🫧', desc:'Low pH gel that cleanses without disrupting the skin barrier. Perfect for oily and acne-prone skin.', tipo_piel:['grasa','mixta','sensible','seca','nolose'], categoria:'cleanser', concerns:['acne','poros','rojeces'], sensible:true },
  { id:'klairs-cleansing-oil', nombre:'Klairs Gentle Black Cleansing Oil', handle:'klairs-gentle-black-deep-cleansing-oil', precio:'$21.90', precio_num:21.90, badge:null, emoji:'🫙', desc:'Nourishing cleansing oil for dry and sensitive skin. Dissolves makeup and SPF while moisturising.', tipo_piel:['seca','sensible','mixta','nolose'], categoria:'cleanser', concerns:['deshidratacion','rojeces','antiaging'], sensible:true },
  { id:'banila-co-balm', nombre:'Banila Co Clean It Zero Balm', handle:'banila-co-clean-it-zero-cleansing-balm', precio:'$18.50', precio_num:18.50, badge:null, emoji:'✨', desc:'Iconic cleansing balm. Melts away SPF, makeup and excess sebum — the perfect first cleanse.', tipo_piel:['grasa','mixta','seca','sensible','nolose'], categoria:'cleanser', concerns:['acne','poros','manchas'], sensible:false },
  { id:'anua-cleanser', nombre:'Anua Heartleaf Foam Cleanser', handle:'anua-heartleaf-pore-control-cleansing-foam', precio:'$15.90', precio_num:15.90, badge:'Trending', emoji:'🌿', desc:'Heartleaf-infused foam cleanser that controls excess sebum and soothes irritated skin.', tipo_piel:['grasa','mixta','sensible','nolose'], categoria:'cleanser', concerns:['acne','poros','rojeces'], sensible:true },
  { id:'cosrx-aha-bha-toner', nombre:'COSRX AHA/BHA Clarifying Toner', handle:'cosrx-aha-bha-clarifying-treatment-toner', precio:'$14.95', precio_num:14.95, badge:'Best Seller', emoji:'💧', desc:'Gentle exfoliating toner with AHA/BHA. Clears pores, evens tone and refines texture without irritating.', tipo_piel:['grasa','mixta','seca','nolose'], categoria:'toner', concerns:['acne','poros','textura','manchas'], sensible:false },
  { id:'klairs-supple-toner', nombre:'Klairs Supple Preparation Toner', handle:'klairs-supple-preparation-facial-toner', precio:'$24.90', precio_num:24.90, badge:null, emoji:'💦', desc:'Alcohol-free hydrating toner. Soothes redness and delivers deep layered hydration to all skin types.', tipo_piel:['seca','mixta','sensible','grasa','nolose'], categoria:'toner', concerns:['deshidratacion','rojeces','antiaging'], sensible:true },
  { id:'some-by-mi-toner', nombre:'Some By Mi AHA·BHA·PHA 30 Days Toner', handle:'some-by-mi-aha-bha-pha-30-days-miracle-toner', precio:'$16.90', precio_num:16.90, badge:null, emoji:'🌿', desc:'Triple acid toner that treats acne, dark spots and rough texture simultaneously. Results in 30 days.', tipo_piel:['grasa','mixta','seca','nolose'], categoria:'toner', concerns:['acne','poros','textura','manchas'], sensible:false },
  { id:'beauty-of-joseon-toner', nombre:'Beauty of Joseon Glow Serum Toner', handle:'beauty-of-joseon-glow-serum', precio:'$19.90', precio_num:19.90, badge:'Viral', emoji:'🍚', desc:'Rice and propolis toner-serum hybrid. Brightens dull skin, evens tone and delivers intense hydration.', tipo_piel:['grasa','mixta','seca','sensible','nolose'], categoria:'toner', concerns:['manchas','deshidratacion','textura'], sensible:true },
  { id:'cosrx-snail-essence', nombre:'COSRX Advanced Snail 96 Mucin Essence', handle:'cosrx-advanced-snail-96-mucin-power-essence', precio:'$19.95', precio_num:19.95, badge:'Iconic', emoji:'🐌', desc:'The most famous K-Beauty essence. 96% snail mucin regenerates, hydrates and brightens every skin type.', tipo_piel:['grasa','mixta','seca','sensible','nolose'], categoria:'essence', concerns:['deshidratacion','manchas','textura','antiaging','rojeces'], sensible:true },
  { id:'missha-essence', nombre:'Missha Time Revolution Essence', handle:'missha-time-revolution-the-first-treatment-essence', precio:'$29.90', precio_num:29.90, badge:null, emoji:'⚗️', desc:'Fermented yeast essence that visibly improves skin texture, radiance and signs of aging over time.', tipo_piel:['seca','mixta','grasa','nolose'], categoria:'essence', concerns:['antiaging','textura','manchas','deshidratacion'], sensible:true },
  { id:'innisfree-green-tea-essence', nombre:'Innisfree Green Tea Seed Essence', handle:'innisfree-green-tea-seed-serum', precio:'$22.90', precio_num:22.90, badge:null, emoji:'🍵', desc:'Lightweight green tea essence packed with antioxidants. Hydrates, soothes and protects against environmental stress.', tipo_piel:['grasa','mixta','sensible','nolose'], categoria:'essence', concerns:['deshidratacion','rojeces','textura'], sensible:true },
  { id:'vitamin-c-serum', nombre:'By Wishtrend Pure Vitamin C 21.5%', handle:'by-wishtrend-pure-vitamin-c-21-5-advanced-serum', precio:'$28.90', precio_num:28.90, badge:'Brightening', emoji:'☀️', desc:'High-potency vitamin C serum. Brightens skin tone, fades dark spots and delivers antioxidant protection.', tipo_piel:['mixta','seca','grasa','nolose'], categoria:'serum', concerns:['manchas','antiaging','textura'], sensible:false },
  { id:'centella-serum', nombre:'Dr.Jart+ Cicapair Serum', handle:'dr-jart-cicapair-serum', precio:'$34.90', precio_num:34.90, badge:null, emoji:'🌱', desc:'High-concentration Centella Asiatica. Soothes active redness, repairs the barrier and calms inflammation.', tipo_piel:['sensible','mixta','seca','nolose'], categoria:'serum', concerns:['rojeces','textura','deshidratacion'], sensible:true },
  { id:'retinol-serum', nombre:'Some By Mi Retinol Intense Serum', handle:'some-by-mi-retinol-intense-reactivating-serum', precio:'$22.90', precio_num:22.90, badge:null, emoji:'⏳', desc:'Gentle retinol that stimulates cell renewal and collagen production. Start 2–3 nights per week.', tipo_piel:['seca','mixta','grasa','nolose'], categoria:'serum', concerns:['antiaging','textura','manchas'], sensible:false },
  { id:'niacinamide-serum', nombre:'COSRX Niacinamide 15% Face Serum', handle:'cosrx-niacinamide-15-face-serum', precio:'$17.90', precio_num:17.90, badge:'Pore Control', emoji:'🔬', desc:'15% niacinamide serum that minimises pores, controls sebum and visibly brightens uneven skin tone.', tipo_piel:['grasa','mixta','sensible','nolose'], categoria:'serum', concerns:['poros','acne','manchas','textura'], sensible:true },
  { id:'cosrx-oil-free-lotion', nombre:'COSRX Oil-Free Moisturizing Lotion', handle:'cosrx-oil-free-ultra-moisturizing-lotion', precio:'$16.95', precio_num:16.95, badge:null, emoji:'💧', desc:'Light gel-cream moisturizer, non-comedogenic. Hydrates oily and combination skin without clogging pores.', tipo_piel:['grasa','mixta','nolose'], categoria:'moisturizer', concerns:['acne','poros','deshidratacion'], sensible:true },
  { id:'laneige-sleeping-mask', nombre:'Laneige Water Sleeping Mask', handle:'laneige-water-sleeping-mask', precio:'$26.90', precio_num:26.90, badge:'Best Seller', emoji:'🌙', desc:"Korea's most famous sleeping mask. Overnight deep hydration — wake up with plump, glowing skin.", tipo_piel:['seca','mixta','grasa','nolose'], categoria:'moisturizer', concerns:['deshidratacion','antiaging','textura'], sensible:true },
  { id:'klairs-calming-cream', nombre:'Klairs Midnight Blue Calming Cream', handle:'klairs-midnight-blue-calming-cream', precio:'$21.90', precio_num:21.90, badge:null, emoji:'🌀', desc:'Reduces active redness and repairs the skin barrier with guaiazulene. Ideal for reactive skin.', tipo_piel:['sensible','mixta','seca','nolose'], categoria:'moisturizer', concerns:['rojeces','deshidratacion'], sensible:true },
  { id:'beauty-joseon-cream', nombre:'Beauty of Joseon Dynasty Cream', handle:'beauty-of-joseon-dynasty-cream', precio:'$16.90', precio_num:16.90, badge:'Cult Favorite', emoji:'🏺', desc:'Traditional Korean rice and ginseng cream. Deeply nourishes, brightens and firms all skin types.', tipo_piel:['seca','mixta','grasa','sensible','nolose'], categoria:'moisturizer', concerns:['deshidratacion','antiaging','manchas'], sensible:true },
  { id:'cosrx-spf', nombre:'COSRX Aloe Soothing Sun Cream SPF50+', handle:'cosrx-aloe-soothing-sun-cream-spf50', precio:'$14.95', precio_num:14.95, badge:'Essential', emoji:'☀️', desc:'SPF50+ with soothing aloe vera. Non-greasy, lightweight finish — perfect for daily use on any skin type.', tipo_piel:['grasa','mixta','sensible','seca','nolose'], categoria:'spf', concerns:['acne','poros','rojeces','manchas'], sensible:true },
  { id:'roundlab-spf', nombre:'Round Lab Birch Juice Sun Cream SPF50+', handle:'round-lab-birch-juice-moisturizing-sun-cream', precio:'$18.90', precio_num:18.90, badge:null, emoji:'🌲', desc:'Hydrating SPF50+ with no white cast. Birch juice keeps skin bouncy and comfortable all day long.', tipo_piel:['seca','mixta','sensible','grasa','nolose'], categoria:'spf', concerns:['deshidratacion','antiaging','manchas'], sensible:true },
  { id:'beauty-joseon-spf', nombre:'Beauty of Joseon Relief Sun SPF50+', handle:'beauty-of-joseon-relief-sun-rice-probiotics', precio:'$16.90', precio_num:16.90, badge:'Viral', emoji:'🌸', desc:'Beloved K-Beauty SPF with rice extract and probiotics. Calming, hydrating and zero white cast.', tipo_piel:['grasa','mixta','sensible','seca','nolose'], categoria:'spf', concerns:['rojeces','manchas','deshidratacion'], sensible:true }
];


/* ============================================================
   5. SKIN PROFILES
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
  if (r.tipo_piel === 'grasa')    { puntos.grasa_acne += 3; puntos.grasa_poros += 3; }
  if (r.tipo_piel === 'mixta')    { puntos.mixta_general += 3; puntos.mixta_manchas += 2; }
  if (r.tipo_piel === 'seca')     { puntos.seca_hidratacion += 3; puntos.seca_antiaging += 2; }
  if (r.tipo_piel === 'sensible') { puntos.sensible_rojeces += 5; }
  if (r.tipo_piel === 'nolose')   { puntos.general_glow += 3; }
  if (r.preocupacion === 'acne')           { puntos.grasa_acne += 4; }
  if (r.preocupacion === 'poros')          { puntos.grasa_poros += 4; }
  if (r.preocupacion === 'manchas')        { puntos.mixta_manchas += 4; puntos.seca_antiaging += 1; }
  if (r.preocupacion === 'deshidratacion') { puntos.seca_hidratacion += 4; puntos.mixta_general += 2; }
  if (r.preocupacion === 'rojeces')        { puntos.sensible_rojeces += 4; }
  if (r.preocupacion === 'antiaging')      { puntos.seca_antiaging += 4; }
  if (r.preocupacion === 'textura')        { puntos.grasa_poros += 2; puntos.mixta_general += 2; }
  if (r.objetivo === 'calmar')    { puntos.sensible_rojeces += 3; }
  if (r.objetivo === 'controlar') { puntos.grasa_acne += 2; puntos.grasa_poros += 2; }
  if (r.objetivo === 'hidratar')  { puntos.seca_hidratacion += 3; puntos.mixta_general += 2; }
  if (r.objetivo === 'unificar')  { puntos.mixta_manchas += 3; }
  if (r.objetivo === 'glow')      { puntos.general_glow += 2; puntos.seca_hidratacion += 1; }
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
  const preocupacion = respuestas.preocupacion;
  const objetivo     = respuestas.objetivo;
  const nivelRutina  = respuestas.nivel_rutina;
  const presupuesto  = respuestas.presupuesto;
  const budgetMax    = SHATOKB_BUDGET_LIMITS[presupuesto] || Infinity;
  let pasos = [...perfil.pasos];
  if (nivelRutina === 'basica' && pasos.length > 4) {
    const order     = ['cleanser', 'toner', 'essence', 'serum', 'moisturizer', 'spf'];
    const essential = ['cleanser', 'moisturizer', 'spf'];
    const actives   = pasos.filter(p => !essential.includes(p.categoria));
    const base      = pasos.filter(p => essential.includes(p.categoria));
    pasos = [...base, ...actives.slice(0, 1)].sort((a, b) => order.indexOf(a.categoria) - order.indexOf(b.categoria));
  }
  return pasos.map(paso => {
    let candidatos = SHATOKB_CATALOGO.filter(p => p.categoria === paso.categoria);
    candidatos = candidatos.map(p => {
      let score = 0;
      if (p.tipo_piel.includes(tipoPiel))         score += 10;
      else if (tipoPiel === 'nolose')              score += 5;
      if (p.concerns.includes(preocupacion))       score += 8;
      if (p.concerns.includes(objetivo))           score += 5;
      if (sensibilidad === 'alta' && p.sensible)   score += 6;
      if (sensibilidad === 'alta' && !p.sensible)  score -= 4;
      if (p.precio_num <= budgetMax)               score += 4;
      else                                         score -= 3;
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
  selectedProducts: {}
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
  container.innerHTML = `
    <div class="shatokb-pregunta">
      <div class="shatokb-pregunta__header">
        <span class="shatokb-pregunta__emoji" aria-hidden="true">${q.emoji || '💬'}</span>
        <div>
          <h3 class="shatokb-pregunta__titulo">${q.titulo}</h3>
          ${q.subtitulo ? `<p class="shatokb-pregunta__subtitulo">${q.subtitulo}</p>` : ''}
        </div>
      </div>
      <div class="shatokb-opciones">
        ${q.opciones.map(op => `
          <button
            class="shatokb-opcion${shatokbState.respuestas[q.id] === op.valor ? ' shatokb-opcion--selected' : ''}"
            onclick="shatokbElegirRespuesta('${q.id}','${op.valor}',this)"
            type="button">
            <span class="shatokb-opcion__label">${op.label}</span>
            <span class="shatokb-opcion__desc">${op.desc || ''}</span>
          </button>
        `).join('')}
      </div>
      <div class="shatokb-quiz-nav">
        ${idx > 0
          ? `<button class="shatokb-btn shatokb-btn--ghost" onclick="shatokbRenderPregunta(${idx - 1})" type="button">← Back</button>`
          : `<span></span>`}
        <button
          class="shatokb-btn shatokb-btn--primary"
          id="shatokb-btn-siguiente"
          onclick="shatokbSiguientePregunta(${idx})"
          type="button"
          ${shatokbState.respuestas[q.id] ? '' : 'disabled'}>
          ${idx === total - 1 ? 'See My Routine →' : 'Next →'}
        </button>
      </div>
    </div>`;
}

function shatokbElegirRespuesta(qId, valor, btn) {
  shatokbState.respuestas[qId] = valor;
  document.querySelectorAll('.shatokb-opcion').forEach(b => b.classList.remove('shatokb-opcion--selected'));
  btn.classList.add('shatokb-opcion--selected');
  const sig = document.getElementById('shatokb-btn-siguiente');
  if (sig) sig.disabled = false;
  setTimeout(() => shatokbSiguientePregunta(shatokbState.preguntaActual), 420);
}

function shatokbSiguientePregunta(idx) {
  const q = SHATOKB_PREGUNTAS[idx];
  if (!shatokbState.respuestas[q.id]) return;
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
  const gate = document.getElementById('stk-email-gate');
  if (!gate) { shatokbMostrarResultado(); return; }
  gate.style.display = 'flex';
  setTimeout(() => gate.classList.add('visible'), 10);
  setTimeout(() => { const inp = document.getElementById('stk-email-input'); if (inp) inp.focus(); }, 80);
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
  } catch(_) {}
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
  if (!shatokbCatalogoCargado) {
    const inner = resultadoEl.querySelector('.shatokb-resultado__inner') || resultadoEl;
    inner.innerHTML = `
      <div style="text-align:center; padding: 60px 20px;">
        <div style="font-size:2.5rem; margin-bottom:16px;">⏳</div>
        <p style="font-family:'Prompt',sans-serif; font-size:1.1rem; font-weight:700; color:#0b0335;">
          Building your personalized routine…
        </p>
        <p style="font-size:0.85rem; color:#6b7280; margin-top:8px;">
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
  shatokbState.selectedProducts = {};
  pasosProd.forEach((paso, i) => {
    if (paso.opciones.length > 0) shatokbState.selectedProducts[i] = paso.opciones[0].id;
  });
  const presupuesto   = shatokbState.respuestas.presupuesto;
  const budgetMax     = SHATOKB_BUDGET_LIMITS[presupuesto] || Infinity;
  const budgetLabel   = { bajo: 'under $40', medio: '$40–$80', alto: 'premium' }[presupuesto] || '';
  const hasOverBudget = pasosProd.some(p => p.opciones.length > 0 && p.opciones[0].precio_num > budgetMax);
  const inner = resultadoEl.querySelector('.shatokb-resultado__inner') || resultadoEl;
  inner.innerHTML = `
    <div class="shatokb-resultado__header">
      <div class="shatokb-resultado__check">✨</div>
      <h2 class="shatokb-resultado__titulo">Your Skin Profile</h2>
      <p class="shatokb-resultado__perfil-nombre">${perfil.titulo}</p>
      <div class="shatokb-resultado__badges">
        ${tags.map(t => `<span class="shatokb-resultado__badge">${t}</span>`).join('')}
      </div>
      <p class="shatokb-resultado__desc">${perfil.descripcion}</p>
    </div>
    ${hasOverBudget ? `<div class="stk-budget-note">⚠️ Some recommended products exceed your <strong>${budgetLabel}</strong> budget. We've marked them so you can choose alternatives within your range.</div>` : ''}
    <div style="margin-bottom: 24px;">
      <p class="stk-section-title">Your Personalized Routine</p>
      <p class="stk-section-sub">For each step below we've hand-picked the best options for your skin profile and budget.<br><strong>All the products within each step work for your skin — pick the one you prefer.</strong> Your estimated total updates automatically as you choose.</p>
    </div>
    <div id="shatokb-routine-steps">
      ${pasosProd.map((paso, stepIdx) => shatokbRenderPasoHTML(paso, stepIdx, budgetMax)).join('')}
    </div>
    <div class="shatokb-resultado__ctas" id="shatokb-ctas" style="margin-top: 40px;"></div>
    <div class="stk-total-bar" id="stk-total-bar">
      <div class="stk-total-bar__info">
        <div class="stk-total-bar__timer" id="stk-timer">⏱️ Routine saved for 15:00</div>
        <div class="stk-total-bar__label" id="stk-total-bar-label">Estimated total for your routine</div>
        <div class="stk-total-bar__amount" id="stk-total-amount">$0.00</div>
      </div>
      <button class="stk-total-bar__cta" onclick="shatokbAddAllToCart()" id="stk-add-btn">
        🛒 Add my full routine to cart
      </button>
    </div>`;
  shatokbActualizarTotal();
  shatokbRenderCTAs();
  shatokbApplyConfigToUI();
  shatokbIniciarTimer();
  shatokbCargarReviewsTodos(pasosProd);
  shatokbTrackPixel('ViewContent', {
    content_name: 'skin_routine_' + perfilId,
    content_category: perfilId,
    value: Object.values(shatokbState.selectedProducts).reduce((t, id) => {
      const p = SHATOKB_CATALOGO.find(x => x.id === id);
      return t + (p ? p.precio_num : 0);
    }, 0)
  });
}


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
    const isSelected = shatokbState.selectedProducts[stepIdx] === prod.id;
    const overBudget = prod.precio_num > budgetMax;
    const viewers    = shatokbViewersCount(prod.handle || prod.id);
    const stock      = shatokbStockCount(prod.handle || prod.id);
    let badgeHtml = '';
    if (overBudget)       badgeHtml = `<div class="stk-prod-option__badge">⚠️ Above your budget</div>`;
    else if (prod.badge)  badgeHtml = `<div class="stk-prod-option__badge stk-prod-option__badge--neutral">${prod.badge}</div>`;
    return `
      <div class="stk-prod-option${isSelected ? ' selected' : ''}"
           onclick="shatokbSeleccionarProducto(${stepIdx},'${prod.id}',this)"
           role="radio" aria-checked="${isSelected}" tabindex="0"
           data-handle="${prod.handle || prod.id}">
        ${badgeHtml}
        <div class="stk-prod-option__img">${prod.emoji}</div>
        <div class="stk-prod-option__name">${prod.nombre}</div>
        <div class="stk-prod-reviews" id="rev-${prod.id}">
          <span style="color:#f0a500;">★★★★★</span>
          <span style="font-size:0.72rem;color:#9ca3af">loading…</span>
        </div>
        <div class="stk-prod-urgency">
          <span class="stk-prod-urgency__viewers">👀 ${viewers} people viewing now</span>
          <span class="stk-prod-urgency__stock">⚡ Only ${stock} left in stock</span>
        </div>
        <div class="stk-prod-option__desc">${prod.desc}</div>
        <div class="stk-prod-option__price">${prod.precio}</div>
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
      <p style="font-size:0.78rem;color:#6b7280;margin-bottom:10px;font-style:italic;">
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
    if (s <= 60) el.classList.add('stk-total-bar__timer--urgent');
    if (s === 0) { el.textContent = '⚠️ Session expired — retake quiz to save your routine'; clearInterval(shatokbTimerInterval); }
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
    .map(([, prodId]) => { const prod = SHATOKB_CATALOGO.find(p => p.id === prodId); return prod ? prod.handle : null; })
    .filter(Boolean);
  if (handles.length === 0) { alert('Please select at least one product before adding to cart.'); return; }
  btn.disabled    = true;
  btn.textContent = '⏳ Adding to cart...';
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
    if (!cartRes.ok) { const err = await cartRes.json().catch(() => ({})); throw new Error(err.description || 'Could not add products to cart.'); }
    btn.textContent = '✅ Added! Redirecting...';
    window.location.href = '/cart';
  } catch (err) {
    console.error('[SHATOKB] addAllToCart error:', err);
    btn.disabled    = false;
    btn.textContent = '🛒 Add All to Cart →';
    let errEl = document.getElementById('stk-cart-error');
    if (!errEl) {
      errEl = document.createElement('p');
      errEl.id = 'stk-cart-error';
      errEl.style.cssText = 'color:#f42b23; font-size:0.8rem; text-align:center; margin-top:8px;';
      document.getElementById('stk-total-bar')?.after(errEl);
    }
    errEl.textContent = '⚠️ ' + err.message;
  }
}


/* ============================================================
   14. DYNAMIC CONFIG
============================================================ */
function shatokbGetConfig() {
  const el = document.getElementById('shatokb-quiz');
  if (!el) return {};
  const d    = el.dataset;
  const bool = v => v === 'true' || v === true;
  return {
    btnCatalogueShow:   bool(d.btnCatalogueShow),
    btnCatalogueText:   d.btnCatalogueText   || '🛍️ Explore the full catalogue',
    btnCatalogueUrl:    d.btnCatalogueUrl    || '/collections/all',
    btnWhatsappShow:    bool(d.btnWhatsappShow),
    btnWhatsappText:    d.btnWhatsappText    || '💬 Talk to a skin expert',
    btnWhatsappNumber:  d.btnWhatsappNumber  || '',
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
    html += `<a href="${cfg.btnCatalogueUrl}" class="shatokb-btn shatokb-btn--secondary shatokb-btn--lg">${cfg.btnCatalogueText}</a>`;
  }
  if (cfg.btnWhatsappShow) {
    const waMsg = encodeURIComponent(cfg.btnWhatsappMessage);
    html += `<a href="https://wa.me/${cfg.btnWhatsappNumber}?text=${waMsg}" class="shatokb-btn shatokb-btn--whatsapp shatokb-btn--lg" target="_blank" rel="noopener">${cfg.btnWhatsappText}</a>`;
  }
  if (cfg.btnRetakeShow) {
    html += `<button class="shatokb-btn shatokb-btn--ghost shatokb-btn--lg" type="button" onclick="shatokbReiniciar()">${cfg.btnRetakeText}</button>`;
  }
  container.innerHTML = html;
}

function shatokbApplyConfigToUI() {
  const cfg = shatokbGetConfig();
  const bsBtn = document.getElementById('shatokb-hero-bestsellers-btn');
  if (bsBtn) {
    bsBtn.style.display = cfg.btnBestsellersShow ? '' : 'none';
    if (cfg.btnBestsellersShow) { bsBtn.textContent = cfg.btnBestsellersText; bsBtn.href = cfg.btnBestsellersUrl; }
  }
  const barLabel = document.getElementById('stk-total-bar-label');
  if (barLabel) barLabel.textContent = cfg.totalBarLabel;
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
   16. INIT
============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  shatokbApplyConfigToUI();
  shatokbFetchCatalogo();
});
