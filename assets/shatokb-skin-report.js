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
    return data.featured_image || (data.images && data.images[0]) || null;
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
  if (!momento || momento === 'ambos') return 'AM + PM';
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
  const errEl = el('ksr-error');
  if (errEl) errEl.removeAttribute('hidden');
}

function showContent() {
  hideLoading();
  const contentEl = el('ksr-content');
  if (contentEl) contentEl.removeAttribute('hidden');
  initScrollAnimations();
  initStickyBar();
}

/* ── RENDER HERO ────────────────────────────────────────────────── */
function renderHero(data) {
  const perfil = data.perfil || {};

  // Date
  const dateEl = el('ksr-date');
  if (dateEl) dateEl.textContent = formatDate(data.createdAt);

  // Profile name — gradient title
  const titleEl = el('ksr-profile-name');
  if (titleEl) titleEl.textContent = perfil.nombre || 'Your Skin Report';

  // Subtitle
  const subtitleEl = el('ksr-hero__subtitle') || document.querySelector('.ksr-hero__subtitle');
  if (subtitleEl) subtitleEl.textContent = perfil.descripcion || 'A complete, personalized analysis prepared exclusively for your skin.';
  const descEl = el('ksr-profile-desc');
  if (descEl) descEl.textContent = perfil.descripcion || '';

  // Tags
  const tagsEl = el('ksr-profile-tags');
  if (tagsEl && perfil.tags && perfil.tags.length) {
    tagsEl.innerHTML = perfil.tags
      .map(t => `<span class="ksr-tag">${escHtml(t)}</span>`)
      .join('');
  }

  // Email badge
  const emailEl = el('ksr-email-badge');
  if (emailEl && data.email) {
    emailEl.textContent = `Prepared for ${data.email}`;
  }

  // Score ring (from vision analysis)
  const vision = data.visionAnalysis;
  if (vision && typeof vision.score_global === 'number') {
    const ringWrap = el('ksr-score-ring-wrap');
    if (ringWrap) ringWrap.removeAttribute('hidden');
    const scoreEl = el('ksr-ring-score');
    if (scoreEl) scoreEl.textContent = vision.score_global.toFixed(1);
    // Animate ring after a short delay
    setTimeout(() => {
      const fillEl = el('ksr-ring-fill');
      if (fillEl) {
        const circumference = 326.7;
        const pct = (vision.score_global / 10) * circumference;
        fillEl.style.strokeDashoffset = (circumference - pct).toFixed(1);
      }
    }, 600);
  }

  // Routine profile name in routine section
  const rpEl = el('ksr-routine-profile-name');
  if (rpEl) rpEl.textContent = perfil.nombre || 'your skin';
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

  // KOI message
  const msgEl = el('ksr-mensaje-koi');
  if (msgEl && vision.mensaje_koi) msgEl.textContent = vision.mensaje_koi;

  // Scores
  const gridEl = el('ksr-scores-grid');
  if (gridEl && vision.dimensiones) {
    gridEl.innerHTML = '';
    Object.entries(vision.dimensiones).forEach(([key, dim]) => {
      if (!dim) return;
      const meta = KSR_SCORE_META[key] || { icon: '📊', name: key };
      const scoreVal = typeof dim.score === 'number' ? dim.score : 0;
      const pct = (scoreVal / 10) * 100;
      gridEl.innerHTML += `
        <div class="ksr-score-card ksr-animate-in">
          <div class="ksr-score-card__icon">${meta.icon}</div>
          <div class="ksr-score-card__name">${meta.name}</div>
          <div class="ksr-score-card__label">${escHtml(dim.label || '')}</div>
          <div class="ksr-score-card__bar-wrap">
            <div class="ksr-score-card__bar" data-pct="${pct}"></div>
          </div>
          <div class="ksr-score-card__val">${scoreVal}/10</div>
          <div class="ksr-score-card__detail">${escHtml(dim.detalle || '')}</div>
        </div>`;
    });
    // Animate bars after paint
    setTimeout(() => {
      document.querySelectorAll('.ksr-score-card__bar').forEach(bar => {
        bar.style.width = bar.dataset.pct + '%';
      });
    }, 400);
  }

  // Zones
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

  // Critical points
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

  // Urgent protocol
  if (vision.protocolo_urgente) {
    const urgEl = el('ksr-urgent');
    if (urgEl) urgEl.removeAttribute('hidden');
    const urgTextEl = el('ksr-urgent-text');
    if (urgTextEl) urgTextEl.textContent = vision.protocolo_urgente;
  }
}

/* ── RENDER ROUTINE ─────────────────────────────────────────────── */
function renderRoutine(data) {
  const prods = data.productosSeleccionados || [];

  const amProducts = prods.filter(p => p.momento === 'am' || p.momento === 'ambos' || !p.momento);
  const pmProducts = prods.filter(p => p.momento === 'pm' || p.momento === 'ambos');

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
  await Promise.all(products.map(async prod => {
    if (prod.imagen && prod.imagen.startsWith('http') && !prod.imagen.includes('/products/') || prod.imagen?.includes('cdn.shopify')) return;
    if (prod.handle) {
      const img = await fetchProductImage(prod.handle);
      if (img) prod.imagen = img;
    }
  }));
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

    const hasImg = prod.imagen && prod.imagen.startsWith('http');
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
    const hasImg = prod.imagen && prod.imagen.startsWith('http');
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

    ksrData = reportData;
    renderReport(reportData);

  } catch (err) {
    console.error('[KSR] Init error:', err);
    showError();
  }
}

// Run
document.addEventListener('DOMContentLoaded', ksrInit);
