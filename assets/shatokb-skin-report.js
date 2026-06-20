/* ════════════════════════════════════════════════════════════════
   KOI SKIN REPORT — JS Engine v1.0
   shatokb.com · /pages/skin-report?token=UUID
   ════════════════════════════════════════════════════════════════ */

'use strict';

/* ── DATA MAPS ──────────────────────────────────────────────────── */

const KSR_SCORE_META = {
  hidratacion:  { icon: '💧', name: 'Hydration' },
  barrera:      { icon: '🛡️', name: 'Skin Barrier' },
  sebum:        { icon: '✨', name: 'Sebum Balance' },
  pigmentacion: { icon: '🌟', name: 'Pigmentation' },
  textura:      { icon: '🔬', name: 'Texture' },
  circulacion:  { icon: '🩸', name: 'Circulation' },
  firmeza:      { icon: '💪', name: 'Firmness' },
  microbioma:   { icon: '🌿', name: 'Microbiome' },
};

const KSR_ZONE_META = {
  tzone:    { icon: '📍', name: 'T-Zone' },
  mejillas: { icon: '🌸', name: 'Cheeks' },
  ojos:     { icon: '👁️', name: 'Eye Contour' },
  boca:     { icon: '💋', name: 'Lip Area' },
};

const KSR_INGREDIENTS_BY_PROFILE = {
  grasa_acne: [
    { icon: '🧪', name: 'Salicylic Acid (BHA)', text: 'Penetrates the pore wall and dissolves oxidized sebum from within. The only exfoliant that works inside the follicle — not just on the surface. 2% concentration, used 3x per week.' },
    { icon: '💊', name: 'Niacinamide 10%', text: 'Regulates sebum production at the gland level, visibly reduces pore size, and calms active redness. Your primary active for long-term sebum control.' },
    { icon: '🌿', name: 'Centella Asiatica', text: 'Calms active inflammation without over-drying. Madecassoside and asiaticoside accelerate healing of post-breakout marks. Anti-inflammatory, not drying.' },
    { icon: '🔬', name: 'Panthenol (B5)', text: 'Barrier-rebuilding humectant that replenishes what BHA removes. Keeps the skin resilient through active exfoliation cycles.' },
  ],
  grasa_poros: [
    { icon: '🧪', name: 'BHA / Salicylic Acid', text: 'Clears congestion inside the pore that makes it appear enlarged. Consistent use over 8 weeks measurably reduces pore visibility.' },
    { icon: '💊', name: 'Niacinamide', text: 'Tightens the pore opening by strengthening the surrounding skin matrix. The single most studied ingredient for pore minimization.' },
    { icon: '🌟', name: 'Retinol / Bakuchiol', text: 'Increases collagen around pore walls, making them structurally smaller over time. Bakuchiol is the non-irritating alternative with equivalent efficacy.' },
    { icon: '💧', name: 'Hyaluronic Acid', text: 'Plumps surrounding skin which optically reduces pore appearance. Lightweight — adds hydration without any oil that could dilate pores.' },
  ],
  mixta_general: [
    { icon: '💊', name: 'Niacinamide', text: 'The only ingredient that simultaneously regulates the T-zone without drying the cheeks. Equilibrium in one formula.' },
    { icon: '💧', name: 'Hyaluronic Acid', text: 'Hydrates drier zones without adding oil. Weightless hydration for the whole face.' },
    { icon: '🧪', name: 'Low-Dose BHA', text: 'Targets T-zone congestion at low concentration (0.5-1%) — effective where needed, safe for drier zones.' },
    { icon: '🛡️', name: 'Ceramides', text: 'Repair barrier function on the drier areas of a mixed skin, preventing the compensatory sebum surge.' },
  ],
  mixta_manchas: [
    { icon: '✨', name: 'Vitamin C (LAA)', text: 'Inhibits new melanin synthesis and neutralizes UV-generated free radicals that trigger dark spots. Morning application essential.' },
    { icon: '💊', name: 'Niacinamide', text: 'Interferes with melanin transfer to surface cells — progressively fades existing spots while preventing new ones.' },
    { icon: '🧪', name: 'AHA (Glycolic/Mandelic)', text: 'Accelerates cell turnover so pigmented cells reach the surface and shed faster. Mandelic acid is gentler for darker skin tones.' },
    { icon: '💧', name: 'Hyaluronic Acid', text: 'Deeply hydrated skin reflects light more evenly — immediately improves the appearance of uneven tone.' },
  ],
  seca_hidratacion: [
    { icon: '💧', name: 'Hyaluronic Acid (Multi-weight)', text: 'Three molecular weights — surface, mid-layer, and deep hydration simultaneously. Can bind 1,000x its weight in water.' },
    { icon: '🛡️', name: 'Ceramides (1, 3, 6-II)', text: 'The lipid bricks of your skin barrier. Without ceramides, hyaluronic acid evaporates in hours — ceramides lock it in.' },
    { icon: '🧴', name: 'Glycerin', text: 'The most studied and clinically proven humectant. Draws moisture from the air continuously into the skin.' },
    { icon: '🌿', name: 'Panthenol + Squalane', text: 'Panthenol heals while squalane mimics skin\'s own sebum for occlusive sealing. The ideal closing duo for dry skin.' },
  ],
  seca_antiaging: [
    { icon: '⚗️', name: 'Retinol / Bakuchiol', text: 'Stimulates cell renewal and collagen production — the most clinically validated anti-aging active in existence. Bakuchiol for sensitive skin.' },
    { icon: '🔬', name: 'Peptides (Matrixyl 3000)', text: 'Signal proteins that activate fibroblasts to produce new collagen. Visible firming without the irritation risk of retinol.' },
    { icon: '✨', name: 'Vitamin C', text: 'Protects existing collagen from free-radical degradation. Brightening and anti-aging simultaneously — no other antioxidant matches it.' },
    { icon: '💧', name: 'Hyaluronic Acid', text: 'Plumps fine lines from within. Mature skin produces 50% less HA than young skin — topical application is essential.' },
  ],
  sensible_rojeces: [
    { icon: '🌿', name: 'Centella Asiatica', text: 'The gold standard for reactive skin. Madecassoside reduces inflammatory cytokines — clinically proven to calm redness and strengthen capillary walls.' },
    { icon: '🛡️', name: 'Ceramides', text: 'Sensitive skin almost always has a compromised barrier. Ceramides rebuild the lipid matrix — when barrier is intact, reactivity drops dramatically.' },
    { icon: '💙', name: 'Panthenol (B5)', text: 'Healing and calming. Reduces burning sensation and accelerates barrier recovery. Safe for the most reactive skin.' },
    { icon: '🌿', name: 'Mugwort (Artemisia)', text: 'Korean traditional anti-inflammatory. Soothes redness-prone skin without triggering the sensitization that harsher ingredients cause.' },
  ],
  barrera_daniada: [
    { icon: '🛡️', name: 'Ceramides (1, 3, 6-II)', text: 'The structural bricks of the skin barrier. Without ceramides, the barrier cannot rebuild itself — all other actives become secondary.' },
    { icon: '🌿', name: 'Centella Asiatica', text: 'Accelerates endogenous ceramide synthesis. Rebuilds from the inside while topical ceramides work from the outside. Use both simultaneously.' },
    { icon: '💙', name: 'Panthenol + Allantoin', text: 'Calming and healing duo. Reduces active inflammation while the barrier recovers. The safest pairing for damaged skin.' },
    { icon: '🧴', name: 'Squalane', text: 'Occlusive that mimics skin\'s natural sebum without causing sensitivity. Seals the barrier while it repairs — essential at night.' },
  ],
  general_glow: [
    { icon: '✨', name: 'Vitamin C (Stable Form)', text: 'The ultimate brightening active. Inhibits melanin, neutralizes free radicals, stimulates collagen. Ascorbyl glucoside for stability.' },
    { icon: '💊', name: 'Niacinamide', text: 'Refines texture and reduces dullness. Improves skin clarity by reducing excess pigment transfer to the surface.' },
    { icon: '🌿', name: 'Green Tea Extract', text: 'Dense in EGCG — protects against environmental stress that causes premature dullness and uneven tone.' },
    { icon: '💧', name: 'Hyaluronic Acid', text: 'Glow is inseparable from hydration. Plumped, well-hydrated skin reflects light — flat, dehydrated skin absorbs it.' },
  ],
};

const KSR_DONOTMIX_BY_PROFILE = {
  grasa_acne: [
    '<strong>BHA + Retinol</strong> on the same night — use on alternating evenings to avoid over-exfoliation and sensitivity.',
    '<strong>Vitamin C (LAA) + Niacinamide</strong> at high concentrations simultaneously — apply Vitamin C in AM, Niacinamide in PM.',
    '<strong>BHA + AHA</strong> in the same session — choose one acid per application. Never stack on the same skin.',
  ],
  seca_hidratacion: [
    '<strong>Retinol + AHA</strong> on the same night — alternating use only. Combining strips an already dry barrier.',
    '<strong>Heavy occlusives + Vitamin C</strong> — apply Vitamin C first, let absorb, then seal. Occlusives trap actives and may cause irritation.',
  ],
  sensible_rojeces: [
    '<strong>Acids (AHA/BHA) + Retinol</strong> — avoid entirely until barrier is fully rebuilt. Introduce one at a time, months apart.',
    '<strong>Fragrance + active ingredients</strong> — fragrance is the #1 trigger for reactive skin. Remove all fragrance from your routine during recovery.',
    '<strong>Multiple new products at once</strong> — introduce one product per two weeks maximum. This is non-negotiable for sensitive skin.',
  ],
  barrera_daniada: [
    '<strong>ANY exfoliant (AHA, BHA, Retinol)</strong> while barrier is compromised — pause all actives for minimum 2 weeks.',
    '<strong>Fragrance + compromised skin</strong> — fragrance penetrates a damaged barrier and triggers intense reactivity. Fragrance-free only.',
    '<strong>Foam cleansers with sulfates</strong> — use only gentle cream or micellar cleansers until barrier recovers fully.',
  ],
  default: [
    '<strong>BHA (Salicylic) + AHA (Glycolic/Lactic)</strong> in the same application — always use one acid at a time.',
    '<strong>Vitamin C (LAA) + direct acids</strong> — LAA is most active at low pH. Acids lower pH further causing instability and potential irritation.',
    '<strong>Retinol + Vitamin C</strong> simultaneously — use Vitamin C in your morning routine, retinol at night.',
  ],
};

const KSR_TIMELINE_BY_PROFILE = {
  grasa_acne: [
    { week: 'Day 1–3', title: 'Your skin adjusts', text: 'You may notice slight dryness or minor purging in areas of existing congestion — this is the BHA clearing blocked follicles. Normal and expected. Do not skip your moisturizer.' },
    { week: 'Week 2–4', title: 'Purge phase clears', text: 'Active breakouts begin to calm. Pores appear slightly smaller as salicylic acid dissolves the congestion. Niacinamide starts regulating sebum production. Skin feels cleaner.' },
    { week: 'Week 4–8', title: 'Visible sebum control', text: 'Oil production measurably reduced. Fewer breakouts, smaller-looking pores, improved skin texture. Your morning skin no longer looks shiny within 2 hours. This is the protocol working.' },
    { week: 'Week 8–12', title: 'Structural improvement', text: 'Post-acne marks begin fading as cell turnover accelerates. Skin tone more even. The barrier is stronger and responding with less reactivity. This is your new baseline.' },
    { week: 'Week 12+', title: 'Long-term maintenance', text: 'Skin is in its optimal balanced state. Maintain the routine 5 days per week. Evaluate in 3 months — retake the KOI quiz to assess evolution and adjust products.' },
  ],
  seca_hidratacion: [
    { week: 'Day 1–3', title: 'Immediate hydration feedback', text: 'You\'ll notice skin feeling plumper and less tight within the first 48 hours. Hyaluronic acid works fast — your skin registers the hydration immediately.' },
    { week: 'Week 2', title: 'Barrier reinforcement begins', text: 'Ceramides begin rebuilding the lipid matrix. Less TEWL (transepidermal water loss) means you hold hydration longer through the day. Fine dehydration lines start smoothing.' },
    { week: 'Week 4', title: 'Skin is visibly plumper', text: 'Texture is significantly smoother. Skin feels comfortable all day without needing to reapply moisturizer. The barrier is functioning closer to its optimal state.' },
    { week: 'Week 8+', title: 'Sustained results', text: 'Skin is consistently well-hydrated. If retinol or actives were introduced at week 4, you\'ll begin seeing early anti-aging results. Long-term commitment to barrier care is transformative.' },
  ],
  sensible_rojeces: [
    { week: 'Day 1–7', title: 'Elimination phase', text: 'Remove all potential irritants: fragrance, alcohol, acids, retinol. Your skin needs a clean baseline. Expect noticeable calming within 5 days of this reset.' },
    { week: 'Week 2–4', title: 'Barrier rebuilding', text: 'Centella and ceramides begin reinforcing the skin\'s protective layer. Redness episodes become less frequent and less intense. The barrier is getting stronger.' },
    { week: 'Week 4–8', title: 'Reactivity decreases', text: 'Skin tolerates a wider range of temperatures, environments, and products. Redness appears less quickly and fades faster. This is measurable barrier improvement.' },
    { week: 'Week 8+', title: 'Careful introduction of actives', text: 'With barrier strengthened, you may begin introducing very gentle actives (PHA, low-dose azelaic acid) one at a time. Introduce one product, wait two weeks. Never rush sensitive skin.' },
  ],
  default: [
    { week: 'Week 1–2', title: 'Adjustment phase', text: 'Your skin acclimates to the new protocol. Some temporary dryness or mild sensitivity is normal — it\'s your skin recalibrating. Do not abandon the routine. Stay consistent.' },
    { week: 'Week 3–4', title: 'First visible changes', text: 'Texture improves noticeably. Skin feels cleaner, more comfortable, and more balanced. This is your first measurable feedback that the protocol is working.' },
    { week: 'Week 6–8', title: 'Established results', text: 'The protocol is now fully integrated into your skin\'s cycle. The active ingredients are working at their full capacity. Your skin looks and behaves differently.' },
    { week: 'Week 12', title: 'Assessment point', text: 'Retake the KOI quiz. Your skin has changed — your routine should evolve with it. This is how a professional skincare approach works: constant refinement.' },
    { week: 'Week 12+', title: 'Long-term maintenance', text: 'You have established a routine that works for your skin. Maintenance is now about consistency and seasonal adjustments. Your skin is in the best shape it\'s been.' },
  ],
};

const KSR_GUIDE_ITEMS = [
  { icon: '🪶', title: 'Thinnest to thickest', text: 'Always apply in order of texture: Toner → Essence → Serum → Moisturizer → SPF (AM). This ensures each layer penetrates properly without blocking the next.' },
  { icon: '⏱️', title: '30–60 seconds between steps', text: 'Wait 30–60 seconds before applying the next product — especially actives like Vitamin C or BHA. Rushed layering reduces efficacy significantly.' },
  { icon: '☀️', title: 'SPF — always last in AM', text: 'Sunscreen is ALWAYS the final step of your morning routine. Nothing goes on top of it. This is the most important rule in all of skincare.' },
  { icon: '🌙', title: 'Double cleanse every PM', text: 'Start with an oil cleanser to dissolve SPF and makeup, then follow with your water-based cleanser. Single cleansing leaves residue that blocks your actives.' },
  { icon: '🤲', title: 'Patting technique', text: 'Press — don\'t rub — products into skin, especially toners and essences. The Korean "palmar press" technique increases absorption by up to 30%.' },
  { icon: '❄️', title: 'Active ingredients at night', text: 'BHA, retinol, and AHAs work best — and safest — at night. UV exposure can deactivate or irritate skin treated with photosensitive actives.' },
];

const KSR_HOW_TO_USE = {
  default: 'Apply a small amount (pea-sized for serums, dime-sized for moisturizers) to clean, slightly damp skin. Press gently into skin using fingertips — do not rub. Allow 30–60 seconds to absorb before the next step.',
  cleanser: 'Apply to wet skin and massage gently in circular motions for 30–60 seconds. Focus on the T-zone and any congested areas. Rinse thoroughly with lukewarm water — never hot.',
  toner: 'Apply to a cotton pad or directly to palms. Press gently into skin in upward motions starting from chin. Do not wipe — press and hold for 3–5 seconds per area.',
  serum: 'Apply 3–4 drops to the entire face and neck while skin is still slightly damp from toner. Press in using both palms. Never drag. Wait 45–60 seconds before the next step.',
  moisturizer: 'Apply the last skincare step before SPF (AM) or as the final step at night. Use upward, outward motions. Include neck and décolleté — they age at the same rate.',
  sunscreen: 'This is the most critical step in your AM routine. Apply ¼ teaspoon (2 finger lengths) to face and neck. Do not massage in — press gently. Reapply every 2 hours of UV exposure.',
  essence: 'Press 2–3 pumps between palms to warm, then press gently into skin. The warmth from your palms increases absorption. Work from the center of the face outward.',
  eyecream: 'Apply with your ring finger (the weakest, least likely to cause damage). Tap — never rub — along the orbital bone. Never pull the delicate eye skin.',
  mask: 'Apply after toner on cleansed skin. Leave for the time indicated on the packaging — removing too early reduces efficacy, too long can irritate. Follow with serum and moisturizer.',
  oil: 'Always the LAST step in your evening routine — oils are occlusives that seal all previous layers. Warm 2–3 drops between palms and press gently into skin.',
};

/* ── UTILITY ────────────────────────────────────────────────────── */

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function formatDate(ts) {
  const d = new Date(ts || Date.now());
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

function el(id) { return document.getElementById(id); }

// Intenta obtener la imagen real del producto via Shopify API
async function fetchProductImage(handle) {
  if (!handle) return null;
  try {
    const res = await fetch(`https://shatokb.com/products/${handle}.js`);
    if (!res.ok) return null;
    const data = await res.json();
    // featured_image es una URL string; images[0] puede ser objeto {src} o string
    const img = data.featured_image || (data.images && data.images[0]) || null;
    if (!img) return null;
    return typeof img === 'object' ? (img.src || null) : img;
  } catch(_) { return null; }
}

function inferHowToUse(product) {
  const n = (product.nombre || '').toLowerCase();
  const p = (product.paso || '').toLowerCase();
  const combined = n + ' ' + p;
  if (combined.includes('clean') || combined.includes('wash') || combined.includes('foam')) return KSR_HOW_TO_USE.cleanser;
  if (combined.includes('toner') || combined.includes('tónico')) return KSR_HOW_TO_USE.toner;
  if (combined.includes('serum') || combined.includes('sérum') || combined.includes('ampul')) return KSR_HOW_TO_USE.serum;
  if (combined.includes('moisturizer') || combined.includes('cream') || combined.includes('crema')) return KSR_HOW_TO_USE.moisturizer;
  if (combined.includes('sunscreen') || combined.includes('spf') || combined.includes('sun')) return KSR_HOW_TO_USE.sunscreen;
  if (combined.includes('essence') || combined.includes('esencia')) return KSR_HOW_TO_USE.essence;
  if (combined.includes('eye') || combined.includes('ojo')) return KSR_HOW_TO_USE.eyecream;
  if (combined.includes('mask') || combined.includes('mascarilla')) return KSR_HOW_TO_USE.mask;
  if (combined.includes('oil') || combined.includes('aceite')) return KSR_HOW_TO_USE.oil;
  return KSR_HOW_TO_USE.default;
}

function getWaitTime(product) {
  const n = (product.nombre || '').toLowerCase();
  const p = (product.paso || '').toLowerCase();
  const combined = n + ' ' + p;
  if (combined.includes('clean') || combined.includes('wash')) return null;
  if (combined.includes('toner') || combined.includes('essence')) return '30 sec';
  if (combined.includes('serum') || combined.includes('ampul') || combined.includes('vitamin c')) return '60 sec';
  if (combined.includes('moisturizer') || combined.includes('cream')) return '2 min';
  if (combined.includes('sunscreen') || combined.includes('spf')) return null;
  if (combined.includes('oil')) return null;
  return '45 sec';
}

function getMomentoLabel(momento) {
  if (!momento || momento === 'ambos' || momento === 'both') return 'AM + PM';
  if (momento === 'am') return 'Morning';
  if (momento === 'pm') return 'Evening';
  return momento.toUpperCase();
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ── STATE ──────────────────────────────────────────────────────── */
let ksrData = null;

/* ── LOADING / ERROR ────────────────────────────────────────────── */
function hideLoading() {
  const loadEl = el('ksr-loading');
  if (!loadEl) return;
  loadEl.classList.add('ksr-fade-out');
  setTimeout(() => { loadEl.style.display = 'none'; }, 800);
}

function showError() {
  hideLoading();
  // Hide content, show error
  const contentEl = el('ksr-content');
  if (contentEl) contentEl.setAttribute('hidden', '');
  const errEl = el('ksr-error');
  if (errEl) errEl.removeAttribute('hidden');
}

function showContent() {
  hideLoading();
  // Hide error, show content
  const errEl = el('ksr-error');
  if (errEl) errEl.setAttribute('hidden', '');
  const contentEl = el('ksr-content');
  if (contentEl) contentEl.removeAttribute('hidden');
  initScrollAnimations();
  initStickyBar();
}

/* ── PERFIL MASTER MAP — fallback local si KV llega con dato crudo ── */
const KSR_PERFILES = {
  grasa_acne: {
    nombre:      'Oil Balance & Clarity',
    headline:    'Your skin is overproducing oil — and your pores are paying the price.',
    descripcion: 'Your skin works overtime — producing more oil than it needs, which clogs pores and keeps breakouts coming back. The good news? K-Beauty was practically invented for this. These routines don\'t just mask the problem. They retrain your skin.',
    tags:        ['🫧 Oily & breakout-prone', '🎯 Active treatment', '⚡ Fast visible results'],
    stats:       [{ label: 'Main concern', value: 'Excess sebum & congestion' }, { label: 'Key actives', value: 'BHA · Niacinamide · Centella' }, { label: 'Expected results', value: '2–4 weeks' }],
  },
  grasa_poros: {
    nombre:      'Pore Refinement',
    headline:    'Enlarged pores are clogged with oxidized oil — and they can be minimized.',
    descripcion: 'Enlarged pores aren\'t just genetic — they\'re caused by excess oil and dead skin cells stretching them out over time. Korean chemical exfoliation is the most effective method in the world for gradually refining pore appearance. And it works.',
    tags:        ['🫧 Oily skin', '🔬 Visible pores', '✨ Texture refinement'],
    stats:       [{ label: 'Main concern', value: 'Pore size & texture' }, { label: 'Key actives', value: 'BHA · Niacinamide · Retinol' }, { label: 'Expected results', value: '4–8 weeks' }],
  },
  mixta_general: {
    nombre:      'Zone Balance',
    headline:    'Your T-zone and cheeks have opposite needs — your routine has to address both.',
    descripcion: 'Combination skin is tricky because it has contradictory needs in different zones. Products that fix one area often make another worse. K-Beauty\'s layering method solves this — you hydrate where you need it and control where you don\'t.',
    tags:        ['☯️ Combination skin', '💧 Needs balance', '🎯 Zone-specific results'],
    stats:       [{ label: 'Main concern', value: 'Oil-hydration balance' }, { label: 'Key actives', value: 'Niacinamide · HA · Ceramides' }, { label: 'Expected results', value: '2–3 weeks' }],
  },
  mixta_manchas: {
    nombre:      'Balance & Brighten',
    headline:    'You\'re fighting excess sebum and dark spots at the same time — and that requires precision.',
    descripcion: 'You\'re fighting two battles at once — excess sebum and hyperpigmentation. The breakthrough? Korean brightening actives like vitamin C, niacinamide and tranexamic acid work on both simultaneously. Your even tone is closer than you think.',
    tags:        ['☯️ Combination skin', '🟤 Dark spots & marks', '✨ Even tone incoming'],
    stats:       [{ label: 'Main concern', value: 'Pigmentation & sebum' }, { label: 'Key actives', value: 'Vitamin C · Niacinamide · AHA' }, { label: 'Expected results', value: '4–6 weeks' }],
  },
  seca_hidratacion: {
    nombre:      'Hydration Restore',
    headline:    'Your skin is dehydrated at a cellular level — one moisturizer is not enough.',
    descripcion: 'Your skin is thirsty at a cellular level — and a single moisturizer isn\'t enough. K-Beauty invented layered hydration for exactly this: you build water content from the deepest layer outward, locking each one in before adding the next. The result is skin that stays plump for hours.',
    tags:        ['🌵 Dry skin', '💧 Hydration is everything', '🛡️ Barrier restoration'],
    stats:       [{ label: 'Main concern', value: 'Deep dehydration & dryness' }, { label: 'Key actives', value: 'HA · Ceramides · Glycerin · Squalane' }, { label: 'Expected results', value: '1–2 weeks' }],
  },
  seca_antiaging: {
    nombre:      'Age Defense',
    headline:    'Dry skin ages faster — your barrier needs repair before any anti-aging active can work.',
    descripcion: 'Dry skin ages faster — that\'s not an opinion, it\'s biology. When your barrier is weakened, collagen breaks down faster and fine lines deepen. The solution is intense, consistent hydration paired with proven actives. K-Beauty does this better than anything else in the world.',
    tags:        ['🌵 Dry skin', '⏳ Anti-aging focus', '🔬 Clinically proven actives'],
    stats:       [{ label: 'Main concern', value: 'Fine lines & barrier damage' }, { label: 'Key actives', value: 'Retinol · Vitamin C · Ceramides' }, { label: 'Expected results', value: '6–12 weeks' }],
  },
  sensible_rojeces: {
    nombre:      'Calm & Repair',
    headline:    'Your skin is reactive — every wrong product triggers redness and irritation.',
    descripcion: 'Reactive skin needs ingredients that calm, not stimulate. Every harsh cleanser, fragrance, or active you\'ve used has been accumulating stress in your barrier. The K-Beauty approach flips this — it repairs first, then treats.',
    tags:        ['🌸 Sensitive skin', '🔴 Redness-prone', '🛡️ Barrier-first approach'],
    stats:       [{ label: 'Main concern', value: 'Redness & reactivity' }, { label: 'Key actives', value: 'Centella · Panthenol · Ceramides' }, { label: 'Expected results', value: '2–4 weeks' }],
  },
  barrera_daniada: {
    nombre:      'Barrier Recovery',
    headline:    'Your skin barrier is compromised — it needs repair before anything else.',
    descripcion: 'A damaged barrier lets irritants in and moisture out — creating a cycle of sensitivity, dryness, and breakouts that no single product can break. The only solution is systematic repair: gentle cleansing, barrier-building actives, and zero exfoliation until your skin stabilizes.',
    tags:        ['🚨 Barrier compromised', '🛡️ Repair protocol', '🌿 Zero actives for now'],
    stats:       [{ label: 'Main concern', value: 'Barrier dysfunction' }, { label: 'Key actives', value: 'Ceramides · Panthenol · Madecassoside' }, { label: 'Expected results', value: '3–6 weeks' }],
  },
  general_glow: {
    nombre:      'Glass Skin Glow',
    headline:    'Your skin is ready for the full K-Beauty protocol — and the results will show.',
    descripcion: 'Glass skin isn\'t a filter. It\'s what happens when your hydration, barrier, and cell renewal are all working together at their peak. This protocol layers the most effective K-Beauty actives in the exact sequence that creates that lit-from-within luminosity.',
    tags:        ['✨ Glass skin goal', '💎 Full glow protocol', '🌟 Multi-layer hydration'],
    stats:       [{ label: 'Main concern', value: 'Luminosity & glass skin' }, { label: 'Key actives', value: 'HA · Vitamin C · Essence · Snail' }, { label: 'Expected results', value: '2–3 weeks' }],
  },
};

/* ── RENDER HERO ────────────────────────────────────────────────── */
function renderHero(data) {
  const perfil    = data.perfil || {};
  const perfilId  = perfil.id || '';
  const vision    = data.visionAnalysis;

  // ── Resolver datos del perfil con fallback local ───────────────
  // Si el KV guardó el ID raw ('seca_hidratacion') en lugar del nombre bonito,
  // el mapa local lo corrige. El mapa también provee headline, stats y descripción
  // completa si llegaron vacíos desde KV.
  const meta = KSR_PERFILES[perfilId] || KSR_PERFILES[perfil.nombre] || null;

  const nombre      = meta?.nombre      || perfil.nombre      || 'Your Skin Report';
  const headline    = meta?.headline    || perfil.descripcion  || 'A personalized skin analysis prepared exclusively for you.';
  const descripcion = meta?.descripcion || perfil.descripcion  || '';
  const tags        = (perfil.tags && perfil.tags.length > 0) ? perfil.tags : (meta?.tags || []);
  const stats       = meta?.stats || [];

  // ── Score global (de vision si existe, si no calcular del perfil) ──
  const scoreGlobal = (vision && typeof vision.score_global === 'number') ? vision.score_global : null;

  // ── Construir el hero completo via innerHTML ───────────────────
  const heroInner = el('ksr-hero__inner') || document.querySelector('.ksr-hero__inner');
  if (!heroInner) return;

  // Colores del score
  function scoreColor(s) {
    if (s === null) return 'var(--ksr-rose)';
    if (s >= 8) return '#4caf7d';
    if (s >= 6) return '#84cc16';
    if (s >= 5) return '#f59e0b';
    return '#ef4444';
  }
  function scoreLabel(s) {
    if (s === null) return '';
    if (s >= 8) return 'Excellent';
    if (s >= 6) return 'Good';
    if (s >= 5) return 'Fair';
    return 'Needs attention';
  }

  heroInner.innerHTML = `
    <!-- Badge superior -->
    <div class="ksr-hero__badge">
      <span class="ksr-badge-dot"></span>
      KOI Skin Analysis &nbsp;·&nbsp; <span id="ksr-date">${formatDate(data.createdAt)}</span>
    </div>

    <!-- Email personalizado -->
    ${data.email ? `<div class="ksr-hero__email-line">Prepared exclusively for <strong>${escHtml(data.email)}</strong></div>` : ''}

    <!-- Nombre del perfil (título grande) -->
    <h1 class="ksr-hero__title" id="ksr-profile-name">${escHtml(nombre)}</h1>

    <!-- Headline — el diagnóstico en una frase poderosa -->
    <p class="ksr-hero__headline">${escHtml(headline)}</p>

    <!-- Tags del tipo de piel -->
    ${tags.length > 0 ? `
    <div class="ksr-hero__tags" id="ksr-profile-tags">
      ${tags.map(t => `<span class="ksr-tag">${escHtml(t)}</span>`).join('')}
    </div>` : ''}

    <!-- Score ring (solo si hay análisis visual) -->
    ${scoreGlobal !== null ? `
    <div class="ksr-hero__score-wrap ksr-animate-in" id="ksr-score-ring-wrap">
      <div class="ksr-hero__score-ring-outer">
        <svg class="ksr-ring" viewBox="0 0 120 120" aria-hidden="true">
          <circle class="ksr-ring__track" cx="60" cy="60" r="52"/>
          <circle class="ksr-ring__fill" id="ksr-ring-fill" cx="60" cy="60" r="52"
                  stroke-dasharray="326.7" stroke-dashoffset="326.7"
                  style="stroke:${scoreColor(scoreGlobal)}"/>
        </svg>
        <div class="ksr-ring__label">
          <span class="ksr-ring__score" id="ksr-ring-score">${scoreGlobal.toFixed(1)}</span>
          <span class="ksr-ring__sub">/ 10</span>
        </div>
      </div>
      <div class="ksr-hero__score-meta">
        <div class="ksr-hero__score-label" style="color:${scoreColor(scoreGlobal)}">${scoreLabel(scoreGlobal)}</div>
        <div class="ksr-hero__score-desc">Overall skin health score<br>based on your photo analysis</div>
      </div>
    </div>` : ''}

    <!-- Stats row — datos específicos del perfil -->
    ${stats.length > 0 ? `
    <div class="ksr-hero__stats">
      ${stats.map(s => `
        <div class="ksr-hero__stat">
          <div class="ksr-hero__stat-label">${escHtml(s.label)}</div>
          <div class="ksr-hero__stat-value">${escHtml(s.value)}</div>
        </div>`).join('')}
    </div>` : ''}

    <!-- Descripción completa del perfil -->
    ${descripcion ? `
    <div class="ksr-hero__desc-block">
      <p class="ksr-hero__subtitle" id="ksr-profile-desc">${escHtml(descripcion)}</p>
    </div>` : ''}

    <!-- Divider con CTA scroll -->
    <div class="ksr-hero__scroll-hint">
      <span>Your full analysis below</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5v14M5 12l7 7 7-7"/>
      </svg>
    </div>
  `;

  // Animar el ring después de renderizar
  if (scoreGlobal !== null) {
    setTimeout(() => {
      const fillEl = el('ksr-ring-fill');
      if (fillEl) {
        const circumference = 326.7;
        const pct = (scoreGlobal / 10) * circumference;
        fillEl.style.strokeDashoffset = (circumference - pct).toFixed(1);
      }
    }, 700);
  }

  // Routine section profile name
  const rpEl = el('ksr-routine-profile-name');
  if (rpEl) rpEl.textContent = nombre;
}

/* ── RENDER DIAGNOSIS ───────────────────────────────────────────── */
function renderDiagnosis(data) {
  const vision = data.visionAnalysis;
  const secEl = el('ksr-sec-diagnosis');

  if (!vision) {
    if (secEl) secEl.setAttribute('hidden', '');
    return;
  }
  if (secEl) secEl.removeAttribute('hidden');

  // ── Reemplazar contenido completo con sección premium ──────────
  // Buscar el contenedor de diagnosis y vaciarlo para rediseñar
  const diagContainer = secEl ? secEl.querySelector('.ksr-section__body') || secEl : secEl;

  // Calcular grado global
  const sg = typeof vision.score_global === 'number' ? vision.score_global : null;
  function _ksrGrade(s) {
    if (s === null) return '—';
    if (s >= 9) return 'A+'; if (s >= 8) return 'A';
    if (s >= 7) return 'B+'; if (s >= 6) return 'B';
    if (s >= 5) return 'C+'; if (s >= 4) return 'C';
    return 'D';
  }
  function _ksrScoreColor(s) {
    if (s === null) return '#a89ea6';
    if (s >= 8) return '#4caf7d';
    if (s >= 6) return '#84cc16';
    if (s >= 4) return '#f59e0b';
    return '#ef4444';
  }
  function _ksrScoreLabel(s) {
    if (s === null) return '';
    if (s >= 8) return 'Excellent condition';
    if (s >= 6) return 'Good condition';
    if (s >= 4) return 'Areas to improve';
    return 'Needs urgent attention';
  }

  // ── 1. MENSAJE KOI — Sección estrella ──────────────────────────
  const msgEl = el('ksr-mensaje-koi');
  if (msgEl && vision.mensaje_koi) {
    // Reemplazar el elemento con diseño nuevo
    const msgParent = msgEl.parentElement;
    msgEl.style.display = 'none';

    // Insertar nueva card premium de mensaje KOI
    const koiMsgCard = document.createElement('div');
    koiMsgCard.className = 'ksr-koi-msg-card ksr-animate-in';
    koiMsgCard.innerHTML = `
      <div class="ksr-koi-msg-card__header">
        <div class="ksr-koi-msg-card__avatar">
          <span>🌸</span>
        </div>
        <div class="ksr-koi-msg-card__meta">
          <div class="ksr-koi-msg-card__name">KOI · Personal Analysis</div>
          <div class="ksr-koi-msg-card__badge">
            <span class="ksr-koi-msg-card__dot"></span>
            AI · K-Beauty Specialist
          </div>
        </div>
        ${sg !== null ? `
        <div class="ksr-koi-msg-card__score-pill" style="--score-color:${_ksrScoreColor(sg)}">
          <span class="ksr-koi-msg-card__score-num">${sg.toFixed(1)}</span>
          <span class="ksr-koi-msg-card__score-grade">${_ksrGrade(sg)}</span>
        </div>` : ''}
      </div>
      <blockquote class="ksr-koi-msg-card__quote">
        ${escHtml(vision.mensaje_koi)}
      </blockquote>
      ${sg !== null ? `
      <div class="ksr-koi-msg-card__score-bar-row">
        <span class="ksr-koi-msg-card__score-label">${_ksrScoreLabel(sg)}</span>
        <div class="ksr-koi-msg-card__score-track">
          <div class="ksr-koi-msg-card__score-fill" data-pct="${(sg/10)*100}" style="background:${_ksrScoreColor(sg)}"></div>
        </div>
        <span class="ksr-koi-msg-card__score-val">${sg.toFixed(1)}/10</span>
      </div>` : ''}
    `;
    if (msgParent) {
      msgParent.insertBefore(koiMsgCard, msgEl);
    } else if (diagContainer) {
      diagContainer.insertBefore(koiMsgCard, diagContainer.firstChild);
    }
    // Animar barra del score
    setTimeout(() => {
      const fill = koiMsgCard.querySelector('.ksr-koi-msg-card__score-fill');
      if (fill) fill.style.width = fill.dataset.pct + '%';
    }, 500);
  }

  // ── 2. SCORES GRID ──────────────────────────────────────────────
  const gridEl = el('ksr-scores-grid');
  if (gridEl && vision.dimensiones) {
    gridEl.innerHTML = '';
    Object.entries(vision.dimensiones).forEach(([key, dim]) => {
      if (!dim) return;
      const meta = KSR_SCORE_META[key] || { icon: '📊', name: key };
      const scoreVal = typeof dim.score === 'number' ? dim.score : 0;
      const pct = (scoreVal / 10) * 100;
      const col = _ksrScoreColor(scoreVal);
      gridEl.innerHTML += `
        <div class="ksr-score-card ksr-animate-in">
          <div class="ksr-score-card__top">
            <div class="ksr-score-card__icon">${meta.icon}</div>
            <div class="ksr-score-card__val-badge" style="color:${col}">${scoreVal}/10</div>
          </div>
          <div class="ksr-score-card__name">${meta.name}</div>
          <div class="ksr-score-card__label">${escHtml(dim.label || '')}</div>
          <div class="ksr-score-card__bar-wrap">
            <div class="ksr-score-card__bar" data-pct="${pct}" style="background:linear-gradient(90deg,${col}99,${col})"></div>
          </div>
          <div class="ksr-score-card__detail">${escHtml(dim.detalle || '')}</div>
        </div>`;
    });
    setTimeout(() => {
      document.querySelectorAll('.ksr-score-card__bar').forEach(bar => {
        bar.style.width = bar.dataset.pct + '%';
      });
    }, 400);
  }

  // ── 3. ZONES ────────────────────────────────────────────────────
  const zonesEl = el('ksr-zones');
  if (zonesEl && vision.zonas) {
    zonesEl.innerHTML = '';
    Object.entries(vision.zonas).forEach(([key, text]) => {
      if (!text) return;
      const meta = KSR_ZONE_META[key] || { icon: '📍', name: key };
      zonesEl.innerHTML += `
        <div class="ksr-zone-item ksr-animate-in">
          <div class="ksr-zone-item__icon">${meta.icon}</div>
          <div>
            <div class="ksr-zone-item__name">${meta.name}</div>
            <div class="ksr-zone-item__text">${escHtml(text)}</div>
          </div>
        </div>`;
    });
  }

  // ── 4. CRITICAL POINTS ──────────────────────────────────────────
  const critEl = el('ksr-critical');
  if (critEl && vision.puntos_criticos && vision.puntos_criticos.length) {
    critEl.innerHTML = `<div class="ksr-critical__title">🔍 Critical Observations</div>`;
    vision.puntos_criticos.forEach((pt, i) => {
      critEl.innerHTML += `
        <div class="ksr-critical__item">
          <div class="ksr-critical__num">${i + 1}</div>
          <div>${escHtml(pt)}</div>
        </div>`;
    });
  } else if (critEl) {
    critEl.style.display = 'none';
  }

  // ── 5. URGENT PROTOCOL ──────────────────────────────────────────
  if (vision.protocolo_urgente) {
    const urgEl = el('ksr-urgent');
    if (urgEl) urgEl.removeAttribute('hidden');
    const urgTextEl = el('ksr-urgent-text');
    if (urgTextEl) urgTextEl.textContent = vision.protocolo_urgente;
  }

  // ── 6. METADATA: Edad biológica + Ajuste de perfil ──────────────
  // Crear el contenedor si no existe en el HTML
  let metaContainer = el('ksr-vision-meta');
  if (!metaContainer && secEl) {
    metaContainer = document.createElement('div');
    metaContainer.id = 'ksr-vision-meta';
    metaContainer.className = 'ksr-vmeta-grid ksr-animate-in';
    secEl.appendChild(metaContainer);
  }
  if (metaContainer) {
    metaContainer.innerHTML = '';
    if (vision.edad_biologica_estimada) {
      metaContainer.innerHTML += `
        <div class="ksr-vmeta-item">
          <span class="ksr-vmeta-item__icon">🔬</span>
          <div>
            <div class="ksr-vmeta-item__label">Estimated Biological Age</div>
            <div class="ksr-vmeta-item__val">${escHtml(vision.edad_biologica_estimada)}</div>
          </div>
        </div>`;
    }
    const perfilOk = vision.confirmacion_perfil;
    const ajuste   = vision.ajuste_perfil;
    const ajusteId = typeof ajuste === 'object' ? (ajuste?.nuevo_perfil_id || '') : (ajuste || '');
    if (ajusteId && ajusteId !== 'null') {
      metaContainer.innerHTML += `
        <div class="ksr-vmeta-item">
          <span class="ksr-vmeta-item__icon">${perfilOk ? '✅' : '⚠️'}</span>
          <div>
            <div class="ksr-vmeta-item__label">${perfilOk ? 'Profile Confirmed' : 'Profile Adjustment Detected'}</div>
            <div class="ksr-vmeta-item__val">${escHtml(ajusteId)}</div>
          </div>
        </div>`;
    }
    if (!metaContainer.innerHTML) metaContainer.style.display = 'none';
  }
}

/* ── RENDER ROUTINE ─────────────────────────────────────────────── */
function renderRoutine(data) {
  const prods = data.productosSeleccionados || [];

  const amProducts = prods.filter(p => p.momento === 'am' || p.momento === 'ambos' || p.momento === 'both' || !p.momento);
  const pmProducts = prods.filter(p => p.momento === 'pm' || p.momento === 'ambos' || p.momento === 'both' || !p.momento);

  renderPanel('ksr-panel-am', amProducts, 'am');
  renderPanel('ksr-panel-pm', pmProducts, 'pm');

  // Tab logic
  document.querySelectorAll('.ksr-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.ksr-tab').forEach(t => t.classList.remove('ksr-tab--active'));
      tab.classList.add('ksr-tab--active');
      const target = tab.dataset.tab;
      el('ksr-panel-am').setAttribute('hidden', '');
      el('ksr-panel-pm').setAttribute('hidden', '');
      el(`ksr-panel-${target}`).removeAttribute('hidden');
    });
  });
}

async function loadProductImages(products) {
  console.log('[KSR] loadProductImages — total productos:', products.length);
  await Promise.all(products.map(async (prod, i) => {
    const imgUrl = prod.imagen || '';
    console.log(`[KSR] prod[${i}] nombre="${prod.nombre}" handle="${prod.handle}" imagen="${imgUrl}"`);

    // ── Determinar si ya tenemos una imagen CDN real ──────────────
    const isRealCdnImage = imgUrl.includes('cdn.shopify.com') ||
      /\.(jpg|jpeg|png|gif|webp|avif)(\?|$)/i.test(imgUrl);
    if (isRealCdnImage) {
      console.log(`[KSR] prod[${i}] → ya tiene CDN image, skip`);
      return;
    }

    // ── Determinar el handle ──────────────────────────────────────
    let handle = prod.handle || '';
    if (!handle && imgUrl.includes('/products/')) {
      const match = imgUrl.match(/\/products\/([^/?#]+)/);
      if (match) { handle = match[1]; console.log(`[KSR] prod[${i}] → handle extraído de URL: "${handle}"`); }
    }

    if (!handle) {
      console.warn(`[KSR] prod[${i}] "${prod.nombre}" → SIN handle y SIN URL de producto. No se puede fetchear imagen.`);
      return;
    }

    console.log(`[KSR] prod[${i}] → fetchando /products/${handle}.js ...`);
    const img = await fetchProductImage(handle);
    if (img) {
        // Normalizar protocolo relativo //cdn.shopify.com → https://cdn.shopify.com
      const imgNorm = img.startsWith('//') ? 'https:' + img : img;
      console.log(`[KSR] prod[${i}] → imagen resuelta: ${imgNorm.substring(0,80)}`);
      prod.imagen = imgNorm;
    } else {
      console.warn(`[KSR] prod[${i}] → fetchProductImage("${handle}") devolvió null`);
    }
  }));
  console.log('[KSR] loadProductImages — COMPLETO');
}

function renderPanel(panelId, products, period) {
  const panel = el(panelId);
  if (!panel) return;

  if (!products || products.length === 0) {
    panel.innerHTML = `<p style="color:var(--ksr-muted); font-size:14px; padding: 20px 0;">No products assigned to this period.</p>`;
    return;
  }

  panel.innerHTML = '';
  products.forEach((prod, i) => {
    const how = inferHowToUse(prod);
    const wait = getWaitTime(prod);
    const stepId = `ksr-accordion-${period}-${i}`;
    const delay = 0.06 * i;

    const hasImg = prod.imagen && (prod.imagen.startsWith('http') || prod.imagen.startsWith('//'));
    const imgHtml = hasImg
      ? `<img src="${escHtml(prod.imagen)}" alt="${escHtml(prod.nombre)}" loading="lazy" onerror="this.parentElement.innerHTML='<span class=ksr-step__img-placeholder>🌸</span>'">`
      : `<span class="ksr-step__img-placeholder">🌸</span>`;

    panel.innerHTML += `
      <div class="ksr-step" style="animation-delay:${delay}s">
        <div class="ksr-step__number-col">
          <div class="ksr-step__num">${i + 1}</div>
          <div class="ksr-step__line"></div>
        </div>
        <div class="ksr-step__body">
          <div class="ksr-step__product-row">
            <div class="ksr-step__img-wrap">${imgHtml}</div>
            <div class="ksr-step__info">
              <div class="ksr-step__step-label">
                Step ${i + 1} · ${escHtml(prod.paso || (period === 'am' ? 'Morning' : 'Evening'))}
                ${wait ? `<span class="ksr-step__wait-badge">⏱ ${wait}</span>` : ''}
              </div>
              <div class="ksr-step__product-name">${escHtml(prod.nombre || '')}</div>
              ${prod.precio ? `<div class="ksr-step__price">${escHtml(prod.precio)}</div>` : ''}
              <div class="ksr-step__reason">
                ${prod.razon
                  ? escHtml(prod.razon)
                  : `Selected by KOI specifically for your skin profile — not a generic pick.`}
              </div>
              <button class="ksr-step__how-toggle" aria-expanded="false" data-target="${stepId}">
                How to use this product ▾
              </button>
            </div>
          </div>
          <div class="ksr-step__how-accordion" id="${stepId}">
            <div class="ksr-step__how-title">Application Method</div>
            <div class="ksr-step__how-text">${escHtml(how)}</div>
          </div>
        </div>
      </div>`;
  });

  // Accordion toggles
  panel.querySelectorAll('.ksr-step__how-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = el(btn.dataset.target);
      if (!target) return;
      const isOpen = target.classList.contains('open');
      target.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
      btn.textContent = !isOpen ? 'How to use this product ▴' : 'How to use this product ▾';
    });
  });
}

/* ── RENDER PRODUCTS GRID ───────────────────────────────────────── */
function renderProducts(data) {
  const prods = data.productosSeleccionados || [];
  const gridEl = el('ksr-products-grid');
  if (!gridEl) return;

  if (!prods.length) {
    gridEl.innerHTML = '<p style="color:var(--ksr-muted);">No products in your selection.</p>';
    return;
  }

  gridEl.innerHTML = '';
  prods.forEach((prod, i) => {
    const hasImg = prod.imagen && (prod.imagen.startsWith('http') || prod.imagen.startsWith('//'));
    const imgHtml = hasImg
      ? `<img src="${escHtml(prod.imagen)}" alt="${escHtml(prod.nombre)}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">`
      : '';

    const delay = 0.05 * i;

    gridEl.innerHTML += `
      <div class="ksr-product-card ksr-animate-in" style="animation-delay:${delay}s; transition-delay:${delay}s">
        <div class="ksr-product-card__img-wrap">
          ${imgHtml}
          ${!hasImg ? `<span class="ksr-product-card__placeholder">🌸</span>` : ''}
          ${!hasImg ? '' : `<span class="ksr-product-card__placeholder" style="display:none">🌸</span>`}
          <span class="ksr-product-card__badge">${getMomentoLabel(prod.momento)}</span>
        </div>
        <div class="ksr-product-card__body">
          <div class="ksr-product-card__step">${escHtml(prod.paso || 'Recommended by KOI')}</div>
          <div class="ksr-product-card__name">${escHtml(prod.nombre || '')}</div>
          <div class="ksr-product-card__desc">${
            prod.razon
              ? escHtml(prod.razon)
              : 'Selected by KOI for your specific skin profile and concerns.'
          }</div>
          <div class="ksr-product-card__footer">
            <div class="ksr-product-card__price">${prod.precio ? escHtml(prod.precio) : ''}</div>
            <div class="ksr-product-card__momento">${getMomentoLabel(prod.momento)}</div>
          </div>
        </div>
      </div>`;
  });
}

/* ── RENDER INGREDIENTS ─────────────────────────────────────────── */
function renderIngredients(data) {
  const perfilId = data.perfil?.id || 'default';
  const vision = data.visionAnalysis;

  const ingredientsEl = el('ksr-ingredients-grid');
  if (!ingredientsEl) return;

  // Use vision-detected priority ingredients if available, else fallback to profile map
  let ingredients = [];
  if (vision && vision.ingredientes_prioritarios && vision.ingredientes_prioritarios.length) {
    ingredients = vision.ingredientes_prioritarios.map(ing => ({
      icon: '🔬',
      name: ing.nombre,
      text: ing.razon,
    }));
  } else {
    ingredients = KSR_INGREDIENTS_BY_PROFILE[perfilId] || KSR_INGREDIENTS_BY_PROFILE['grasa_acne'];
  }

  ingredientsEl.innerHTML = '';
  ingredients.forEach(ing => {
    ingredientsEl.innerHTML += `
      <div class="ksr-ingredient-card ksr-animate-in">
        <div class="ksr-ingredient-card__icon">${ing.icon}</div>
        <div class="ksr-ingredient-card__name">${escHtml(ing.name)}</div>
        <div class="ksr-ingredient-card__text">${escHtml(ing.text)}</div>
      </div>`;
  });

  // Do Not Mix
  const doNotMix = KSR_DONOTMIX_BY_PROFILE[perfilId] || KSR_DONOTMIX_BY_PROFILE['default'];
  const doNotMixEl = el('ksr-donotmix-list');
  if (doNotMixEl) {
    doNotMixEl.innerHTML = doNotMix
      .map(item => `<div class="ksr-donotmix__item">⚠️ ${item}</div>`)
      .join('');
  }
}

/* ── RENDER TIMELINE ────────────────────────────────────────────── */
function renderTimeline(data) {
  const perfilId = data.perfil?.id || 'default';
  const timelineEl = el('ksr-timeline');
  if (!timelineEl) return;

  const timeline = KSR_TIMELINE_BY_PROFILE[perfilId] || KSR_TIMELINE_BY_PROFILE['default'];
  timelineEl.innerHTML = '';
  timeline.forEach(item => {
    timelineEl.innerHTML += `
      <div class="ksr-timeline-item">
        <div class="ksr-timeline-dot-col">
          <div class="ksr-timeline-dot"></div>
          <div class="ksr-timeline-connector"></div>
        </div>
        <div class="ksr-timeline-body">
          <div class="ksr-timeline-week">${escHtml(item.week)}</div>
          <div class="ksr-timeline-title">${escHtml(item.title)}</div>
          <div class="ksr-timeline-text">${escHtml(item.text)}</div>
        </div>
      </div>`;
  });
}

/* ── RENDER CTA ─────────────────────────────────────────────────── */
function renderCta(data) {
  const total = data.totalCarrito || 0;
  const cartUrl = data.cartUrl || data.reportUrl?.replace('/pages/skin-report', '/cart') || '/cart';

  const totalEl = el('ksr-cta-total');
  if (totalEl) totalEl.textContent = `$${parseFloat(total).toFixed(2)}`;

  const stickyTotalEl = el('ksr-sticky-total');
  if (stickyTotalEl) stickyTotalEl.textContent = `$${parseFloat(total).toFixed(2)}`;

  const cartBtn = el('ksr-cart-btn');
  if (cartBtn) cartBtn.href = cartUrl;

  const stickyBtn = el('ksr-sticky-btn');
  if (stickyBtn) stickyBtn.href = cartUrl;

  // If total is 0, change CTA copy
  if (!total || total === 0) {
    const ctaTitleEl = el('ksr-cta-title');
    if (ctaTitleEl) ctaTitleEl.textContent = 'Build your routine — start with the essentials';
    const ctaSubEl = el('ksr-cta-sub');
    if (ctaSubEl) ctaSubEl.textContent = 'Every product KOI selected is available at shatokb.com. Start with the first two steps of your routine and add the rest as you go.';
    if (cartBtn) { cartBtn.textContent = 'Shop my routine →'; cartBtn.href = 'https://shatokb.com'; }
    if (totalEl) totalEl.closest('.ksr-cta__total-wrap').style.display = 'none';
    const urgencyEl = el('ksr-urgency');
    if (urgencyEl) urgencyEl.style.display = 'none';
  }
}

/* ── RENDER GUIDE ───────────────────────────────────────────────── */
function renderGuide() {
  const guideEl = el('ksr-guide-grid');
  if (!guideEl) return;
  guideEl.innerHTML = KSR_GUIDE_ITEMS.map(item => `
    <div class="ksr-guide-item ksr-animate-in">
      <div class="ksr-guide-item__icon">${item.icon}</div>
      <div class="ksr-guide-item__title">${escHtml(item.title)}</div>
      <div class="ksr-guide-item__text">${escHtml(item.text)}</div>
    </div>`).join('');
}

/* ── SCROLL ANIMATIONS ──────────────────────────────────────────── */
function initScrollAnimations() {
  const obs = new IntersectionObserver(
    entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('ksr-visible');
        // Animate score bars when they appear
        entry.target.querySelectorAll('.ksr-score-card__bar').forEach(bar => {
          bar.style.width = bar.dataset.pct + '%';
        });
      }
    }),
    { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
  );

  document.querySelectorAll('.ksr-animate-in, .ksr-timeline-item').forEach(el => obs.observe(el));
}

/* ── STICKY BAR ─────────────────────────────────────────────────── */
function initStickyBar() {
  const bar = el('ksr-sticky-bar');
  if (!bar) return;

  const ctaSection = el('ksr-sec-cta');
  if (!ctaSection) return;

  bar.removeAttribute('hidden');

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        bar.classList.remove('ksr-sticky-bar--visible');
      } else {
        bar.classList.add('ksr-sticky-bar--visible');
      }
    });
  }, { threshold: 0.1 });

  obs.observe(ctaSection);
}

/* ── MAIN RENDER ────────────────────────────────────────────────── */
async function renderReport(reportData) {
  // Pre-cargar imágenes reales de Shopify antes de renderizar
  const prods = reportData.productosSeleccionados || [];
  if (prods.length) await loadProductImages(prods);

  renderHero(reportData);
  renderDiagnosis(reportData);
  renderRoutine(reportData);
  renderProducts(reportData);
  renderIngredients(reportData);
  renderTimeline(reportData);
  renderCta(reportData);
  renderGuide();
  showContent();
}

/* ── INIT ───────────────────────────────────────────────────────── */
async function ksrInit() {
  // ── CRÍTICO: forzar error oculto INMEDIATAMENTE al arrancar ──────
  // El CSS display:flex puede sobrescribir [hidden] si el stylesheet
  // viejo de Shopify aún no tiene el fix [hidden]{display:none!important}.
  // Este inline style es el escudo definitivo — tiene máxima especificidad.
  const errElInit = document.getElementById('ksr-error');
  if (errElInit) errElInit.style.display = 'none';

  const token = getParam('token');

  if (!token) {
    showError();
    return;
  }

  try {
    // ══════════════════════════════════════════════════════════════
    // ARQUITECTURA FINAL (Jun 2026):
    // Lee el reporte desde Cloudflare KV via el Worker endpoint
    // GET /report/:token → https://koi-proxy.luisfonse2010.workers.dev/report/:token
    //
    // El Worker guarda en KV cuando el usuario completa el quiz.
    // Esta página lee desde KV para renderizar el reporte.
    // ══════════════════════════════════════════════════════════════

    const workerBase = window.KSR_WORKER_URL || 'https://koi-proxy.luisfonse2010.workers.dev';
    let record = null;

    // ── Intento 1: GET desde Cloudflare KV via Worker ──
    try {
      const resKV = await fetch(`${workerBase}/report/${encodeURIComponent(token)}`);
      if (resKV.ok) {
        const kvData = await resKV.json();
        if (kvData && kvData.report_data) record = kvData;
      } else {
        console.warn('[KSR] Worker KV response:', resKV.status);
      }
    } catch (e) {
      console.warn('[KSR] Worker KV fetch error:', e.message);
    }

    if (!record) {
      console.warn('[KSR] No record found for token:', token);
      showError();
      return;
    }

    // Parse report_data
    let reportData;
    try {
      reportData = typeof record.report_data === 'string'
        ? JSON.parse(record.report_data)
        : record.report_data;
    } catch (e) {
      console.error('[KSR] Failed to parse report_data:', e);
      showError();
      return;
    }

    // Inject email from record if missing in reportData
    if (!reportData.email && record.email) reportData.email = record.email;
    if (!reportData.createdAt && record.created_at) reportData.createdAt = record.created_at;

    // ══════════════════════════════════════════════════════════════
    // ENRIQUECER CON CARRITO REAL DE SHOPIFY (fuente de verdad final)
    // ══════════════════════════════════════════════════════════════
    try {
      const cartRes = await fetch('/cart.js', { headers: { 'Accept': 'application/json' } });
      if (cartRes.ok) {
        const cartData = await cartRes.json();
        const cartItems = cartData.items || [];
        if (cartItems.length > 0) {
          const productosReporte = reportData.productosSeleccionados || [];
          const byHandle = {};
          productosReporte.forEach(p => { if (p.handle) byHandle[p.handle] = p; });
          const productosCarrito = cartItems.map((item, idx) => {
            const handle   = item.handle || '';
            const existing = byHandle[handle] || {};
            const imgRaw   = item.featured_image?.url || item.image || '';
            const imagen   = imgRaw.startsWith('//') ? 'https:' + imgRaw : imgRaw;
            return {
              nombre:  item.product_title || existing.nombre || item.title || '',
              precio:  existing.precio || (item.price ? (item.price / 100).toFixed(2) : ''),
              paso:    existing.paso    || `STEP ${idx + 1}`,
              id:      existing.id      || handle,
              handle,
              momento: existing.momento || 'ambos',
              razon:   existing.razon   || '',
              imagen,
              url:     handle ? `https://shatokb.com/products/${handle}` : '',
            };
          });
          const handlesReporte = productosReporte.map(p => p.handle).sort().join(',');
          const handlesCarrito = productosCarrito.map(p => p.handle).sort().join(',');
          if (handlesCarrito !== handlesReporte || !reportData.productos_actualizados) {
            reportData.productosSeleccionados = productosCarrito;
            const isAM = p => p.momento === 'am' || p.momento === 'ambos' || !p.momento;
            const isPM = p => p.momento === 'pm' || p.momento === 'ambos';
            const rutinaAMC = productosCarrito.filter(isAM).map(p => p.nombre).filter(Boolean);
            const rutinaPMC = productosCarrito.filter(isPM).map(p => p.nombre).filter(Boolean);
            if (rutinaAMC.length > 0) reportData.rutinaAM = rutinaAMC;
            if (rutinaPMC.length > 0) reportData.rutinaPM = rutinaPMC;
            reportData.totalCarrito = productosCarrito.reduce((s, p) => {
              return s + (parseFloat(String(p.precio || '0').replace(/[^0-9.]/g, '')) || 0);
            }, 0);
            console.log('[KSR] Productos actualizados desde carrito real ✅');
          }
        }
      }
    } catch (cartErr) {
      console.warn('[KSR] Cart enrichment skipped:', cartErr.message);
    }

    ksrData = reportData;
    renderReport(reportData);

  } catch (err) {
    console.error('[KSR] Init error:', err);
    showError();
  }
}

// Run
document.addEventListener('DOMContentLoaded', ksrInit);
