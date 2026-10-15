/*
 * B0006N5S1C owner-decision dossier: a presentation-only dedicated view
 * over the certified browser read model. It performs no I/O or mutation.
 */
const PRODUCT_ASIN = 'B0006N5S1C';
const app = document.querySelector('#app');
let queued = false;

function route() {
  const [page = 'today', query = ''] = location.hash.replace(/^#/, '').split('?');
  return { page: page || 'today', params: new URLSearchParams(query) };
}
function esc(value) {
  return String(value ?? 'UNKNOWN').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}
function valueFor(card, label) {
  const row = Array.from(card.querySelectorAll('dt')).find(node => node.textContent?.trim() === label)?.parentElement;
  return row?.querySelector('dd')?.textContent?.trim() || 'UNKNOWN';
}
function first(value) { return String(value || 'UNKNOWN').split(' · ')[0].trim() || 'UNKNOWN'; }
function part(value, index) { return String(value || 'UNKNOWN').split(' · ')[index]?.trim() || 'UNKNOWN'; }
function marketMedian(value) {
  const values = first(value).split('/').map(entry => entry.trim()).filter(Boolean);
  return values[1] || values[0] || 'UNKNOWN';
}
function plainDemand(value) {
  return /UNPROVEN/i.test(value) ? 'Demand remains unproven. Active listings are not sales.' : String(value || 'UNKNOWN');
}
function plainDecision(value) {
  return /VALIDATE/i.test(value) ? 'The current certified scenario merits validation; it is not ready for commercial execution.' : String(value || 'UNKNOWN');
}
function shortFee(value) { return [part(value, 0), part(value, 1), part(value, 2)].filter(item => item !== 'UNKNOWN').join(' · ') || 'UNKNOWN'; }
function shortShipping(value) { return [part(value, 0), part(value, 1), part(value, 2)].join(' · '); }
function installStyles() {
  if (document.querySelector('#b0006-owner-decision-dossier-styles')) return;
  const style = document.createElement('style');
  style.id = 'b0006-owner-decision-dossier-styles';
  style.textContent = [
    '.b0006-hidden-for-dedicated-view{display:none!important}',
    '#app:has(.b0006-dedicated-section)>.page-head{display:none!important}',
    '.b0006-dedicated-section{max-width:none!important;width:100%!important}',
    '.b0006-dedicated-section>.section-heading,.b0006-dedicated-section>.interactive-cohort-filters{display:none!important}',
    '.b0006-dedicated-section>.detail-grid{display:block!important;max-width:none!important;width:100%!important}',
    '.b0006-dedicated-section>.detail-grid>.cohort-dossier{display:none!important}',
    '.b0006-dedicated-section>.detail-grid>.cohort-dossier.b0006-owner-decision-card{display:block!important;max-width:none!important;width:100%!important;min-width:0!important;margin:0!important;border:0!important;background:transparent!important;overflow:visible!important}',
    '.b0006-owner-decision-card>.interactive-dossier-summary{display:none!important}.b0006-owner-decision-card>.interactive-dossier-content{display:block!important;padding:0!important}',
    '.b0006-owner-decision{display:grid;gap:18px;max-width:1360px;margin:0 auto;padding:8px 0 36px;min-width:0}',
    '.b0006-back{justify-self:start;padding:0;border:0;background:transparent;color:#9ed8ff;font:800 12px/1.3 system-ui,sans-serif;cursor:pointer}.b0006-back:hover,.b0006-back:focus-visible{color:#ffc65b;outline:0}',
    '.b0006-hero{display:grid;grid-template-columns:minmax(180px,240px) minmax(0,1fr);gap:24px;padding:24px;border:1px solid rgba(255,198,91,.42);border-radius:16px;background:linear-gradient(135deg,rgba(8,35,57,.98),rgba(2,17,29,.98));min-width:0}',
    '.b0006-image-state{display:grid;place-items:center;min-height:214px;padding:22px;border:1px dashed rgba(144,196,234,.38);border-radius:12px;background:linear-gradient(145deg,rgba(6,37,59,.82),rgba(2,16,28,.95));text-align:center;color:#c5d7e6}.b0006-image-state strong{display:block;margin:10px 0 7px;color:#edf6fd;font-size:14px}.b0006-image-state small{max-width:24ch;line-height:1.5}.b0006-image-mark{color:#ffc65b;font-size:32px}',
    '.b0006-hero-copy{display:grid;align-content:start;gap:12px;min-width:0}.b0006-eyebrow{margin:0;color:#8fc9ef;font-size:10px;font-weight:900;letter-spacing:.14em}.b0006-hero h1{margin:0;color:#f8fbff;font-size:clamp(28px,3.25vw,48px);line-height:1.05;letter-spacing:-.045em;overflow-wrap:anywhere;word-break:normal}.b0006-asin{color:#9fcae8;font:800 11px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace}.b0006-decision{display:inline-flex;align-items:center;width:max-content;gap:8px;padding:7px 10px;border:1px solid rgba(91,217,176,.52);border-radius:99px;color:#91efd0;background:rgba(5,71,65,.42);font-size:11px;font-weight:900;letter-spacing:.07em}',
    '.b0006-hero-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:2px}.b0006-hero-actions a,.b0006-evidence-button{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:10px 14px;border:1px solid rgba(132,199,241,.5);border-radius:9px;background:rgba(3,25,42,.78);color:#eaf6ff;font-size:12px;font-weight:850;text-decoration:none;cursor:pointer}.b0006-hero-actions a.primary{border-color:#ffc65b;background:linear-gradient(135deg,#ffd06b,#e99b30);color:#15202a}.b0006-hero-actions a:hover,.b0006-hero-actions a:focus-visible,.b0006-evidence-button:hover,.b0006-evidence-button:focus-visible{outline:0;border-color:#ffc65b;color:#ffc65b}.b0006-hero-actions a.primary:hover,.b0006-hero-actions a.primary:focus-visible{color:#15202a;filter:brightness(1.06)}',
    '.b0006-commercial-hero{display:grid;gap:14px;padding:20px;border:1px solid rgba(100,182,233,.27);border-radius:15px;background:rgba(3,20,33,.83)}.b0006-commercial-hero>div:first-child{display:flex;align-items:end;justify-content:space-between;gap:12px}.b0006-commercial-hero h2,.b0006-owner-section h2{margin:0;color:#f4f9fd;font-size:19px}.b0006-commercial-hero p,.b0006-owner-section>p{margin:4px 0 0;color:#9db7cc;font-size:12px;line-height:1.5}',
    '.b0006-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.b0006-metric{display:grid;gap:5px;min-width:0;padding:14px;border:1px solid rgba(113,187,234,.2);border-radius:10px;background:rgba(6,30,48,.88)}.b0006-metric small,.b0006-pricing small{color:#8cacc5;font-size:9px;font-weight:900;letter-spacing:.09em;text-transform:uppercase}.b0006-metric strong{color:#eff8ff;font-size:clamp(17px,1.65vw,23px);line-height:1.1;overflow-wrap:anywhere}.b0006-metric.market strong{color:#ffcc67}.b0006-pricing{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.b0006-pricing div{padding:11px;border-left:3px solid #2f91e3;background:rgba(8,38,60,.62)}.b0006-pricing strong{display:block;margin-top:4px;color:#dff1ff;font-size:15px;overflow-wrap:anywhere}.b0006-scenario-note{margin:0!important;padding:10px 12px;border-radius:9px;background:rgba(91,65,22,.24);color:#ffe0a3!important}',
    '.b0006-owner-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:16px}.b0006-owner-section{display:grid;gap:13px;padding:19px;border:1px solid rgba(96,172,222,.24);border-radius:14px;background:rgba(3,20,33,.8);min-width:0}.b0006-why,.b0006-risks{display:grid;gap:8px;margin:0;padding:0;list-style:none}.b0006-why li{padding:11px 12px;border-left:3px solid #48c8a7;border-radius:0 8px 8px 0;background:rgba(6,58,61,.34);color:#d7e9f4;font-size:12px;line-height:1.48}.b0006-why strong{color:#a6efdc}.b0006-risks li{padding:11px 12px;border-left:3px solid #edac4d;border-radius:0 8px 8px 0;background:rgba(81,48,19,.29);color:#dbe9f4;font-size:12px;line-height:1.45}.b0006-risks strong{display:block;color:#ffcb6b}',
    '.b0006-cost-stack{width:100%;border-collapse:collapse}.b0006-cost-stack th,.b0006-cost-stack td{padding:9px 7px;border-bottom:1px solid rgba(112,180,226,.15);text-align:left;vertical-align:top}.b0006-cost-stack th{width:43%;color:#c9dcea;font-size:11px}.b0006-cost-stack td{color:#eff8ff;font-size:11px;line-height:1.4}.b0006-factual{color:#83d7ff}.b0006-policy{color:#ffcb6b}.b0006-scenario{color:#a9c8ff}.b0006-unknown{color:#ffbdc6}',
    '.b0006-scenarios{display:grid;gap:8px}.b0006-scenario-row{padding:11px;border:1px solid rgba(108,178,226,.18);border-radius:9px;background:rgba(6,31,49,.72)}.b0006-scenario-row strong{color:#e4f2fb;font-size:12px}.b0006-scenario-row p{margin:5px 0 0;color:#afc6d8;font-size:11px}.b0006-advanced{border:1px solid rgba(105,181,231,.25);border-radius:12px;background:rgba(3,17,29,.75)}.b0006-advanced summary{padding:15px 17px;color:#d7efff;font-size:12px;font-weight:900;cursor:pointer}.b0006-advanced-body{padding:0 17px 17px}.b0006-advanced .interactive-dossier-sections{gap:10px}',
    '@media(max-width:960px){.b0006-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}.b0006-owner-grid{grid-template-columns:1fr}}@media(max-width:680px){.b0006-hero{grid-template-columns:1fr;padding:16px}.b0006-image-state{min-height:130px}.b0006-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.b0006-pricing{grid-template-columns:1fr}.b0006-owner-decision{gap:13px}.b0006-hero h1{font-size:29px}.b0006-hero-actions>*{width:100%}}@media(max-width:420px){.b0006-metrics{grid-template-columns:1fr}.b0006-owner-section,.b0006-commercial-hero{padding:14px}.b0006-cost-stack th{width:47%}}'
  ].join('');
  document.head.append(style);
}
function costRow(label, value, state) {
  const name = state === 'factual' ? 'FACTUAL' : state === 'policy' ? 'OWNER POLICY' : state === 'scenario' ? 'SCENARIO' : 'UNKNOWN';
  return '<tr><th>' + esc(label) + '</th><td>' + esc(value) + '<br><small class="b0006-' + state + '">' + name + '</small></td></tr>';
}
function restoreCohort() {
  const { params } = route();
  params.delete('asin');
  params.delete('focus');
  const query = params.toString();
  location.hash = '#opportunities?' + (query || 'view=amazon-ebay');
}
function dedicatedPresentation(card) {
  const existing = card.querySelector('.interactive-dossier-content');
  if (!existing || existing.dataset.ownerDecisionDossier === 'true') return;
  const title = card.querySelector('h3')?.textContent?.trim() || PRODUCT_ASIN;
  const decision = card.querySelector('.state-pill')?.dataset.state || 'VALIDATE';
  const acquisition = valueFor(card, 'Amazon purchasable acquisition price');
  const amazonShipping = valueFor(card, 'Amazon shipping / tax / landed cost');
  const outbound = valueFor(card, 'Outbound shipping / packaging / handling');
  const returns = valueFor(card, 'Returns reserve');
  const ebayFee = valueFor(card, 'eBay category / official fee');
  const market = valueFor(card, 'Active listing range / competition');
  const demand = valueFor(card, 'Demand / white space');
  const scenarios = valueFor(card, 'Organic / promoted scenarios');
  const economics = valueFor(card, 'Pre-tax profit / margin / ROI');
  const minimumViable = valueFor(card, 'Minimum viable price');
  const trueBreakEven = valueFor(card, 'True break-even');
  const targetAcquisition = valueFor(card, 'Target acquisition cost');
  const maximumViable = valueFor(card, 'Maximum viable acquisition cost');
  const headlineScenario = valueFor(card, 'Headline scenario');
  const strategic = valueFor(card, 'Decision / strategic potential');
  const advanced = document.createElement('div');
  advanced.className = 'b0006-advanced-body';
  while (existing.firstChild) advanced.append(existing.firstChild);
  const product = document.createElement('article');
  product.className = 'b0006-owner-decision interactive-dossier-content';
  const scenarioText = scenarios === 'UNKNOWN' ? 'UNKNOWN — no certified scenario is available.' : scenarios;
  product.innerHTML =
    '<button class="b0006-back" type="button" data-owner-decision-back>← Volver a oportunidades</button>' +
    '<section class="b0006-hero"><div class="b0006-image-state"><div><span class="b0006-image-mark" aria-hidden="true">◇</span><strong>Primary image unavailable</strong><small>No factual image exists in Kabuby’s certified read model, Scout intake, persisted marketplace metadata, or cached assets. No provider was called.</small></div></div>' +
    '<div class="b0006-hero-copy"><p class="b0006-eyebrow">AMAZON → EBAY · OWNER DECISION DOSSIER</p><h1>' + esc(title) + '</h1><span class="b0006-asin">ASIN ' + PRODUCT_ASIN + '</span><span class="b0006-decision">' + esc(decision) + ' · DO NOT BUY YET</span>' +
    '<div class="b0006-hero-actions"><a class="primary" href="https://www.amazon.com/dp/' + PRODUCT_ASIN + '" target="_blank" rel="noopener noreferrer">Ver en Amazon</a><a href="https://www.ebay.com/sch/i.html?_nkw=' + encodeURIComponent(title) + '" target="_blank" rel="noopener noreferrer">Revisar mercado eBay</a><button class="b0006-evidence-button" type="button" data-owner-decision-evidence>Ver evidencia técnica</button></div></div></section>' +
    '<section class="b0006-commercial-hero"><div><div><p class="b0006-eyebrow">COMMERCIAL SCENARIO · PRE-TAX</p><h2>What the current evidence supports</h2></div><span class="b0006-decision">' + esc(decision) + '</span></div>' +
    '<div class="b0006-metrics"><div class="b0006-metric"><small>Amazon cost</small><strong>' + esc(first(acquisition)) + '</strong></div><div class="b0006-metric market"><small>eBay reference</small><strong>' + esc(marketMedian(market)) + '</strong></div><div class="b0006-metric"><small>Pre-tax profit</small><strong>' + esc(first(economics)) + '</strong></div><div class="b0006-metric"><small>Margin</small><strong>' + esc(part(economics, 1)) + '</strong></div><div class="b0006-metric"><small>ROI</small><strong>' + esc(part(economics, 2)) + '</strong></div></div>' +
    '<div class="b0006-pricing"><div><small>Minimum viable price</small><strong>' + esc(first(minimumViable)) + '</strong><small>20% margin floor</small></div><div><small>Max viable cost</small><strong>' + esc(first(maximumViable)) + '</strong><small>20% minimum margin</small></div><div><small>Target acquisition cost</small><strong>' + esc(first(targetAcquisition)) + '</strong><small>30% target margin</small></div></div><p class="b0006-scenario-note"><strong>' + esc(headlineScenario) + ' · DEMAND UNPROVEN.</strong> ' + esc(market) + '</p></section>' +
    '<div class="b0006-owner-grid"><section class="b0006-owner-section"><p class="b0006-eyebrow">WHY KABUBY SAYS VALIDATE</p><h2>Viable at the minimum, not at the target</h2><ul class="b0006-why"><li><strong>DO NOT BUY YET.</strong> Current Amazon cost ' + esc(first(acquisition)) + ' is below the ' + esc(first(maximumViable)) + ' maximum viable cost, but above the ' + esc(first(targetAcquisition)) + ' target acquisition cost.</li><li><strong>Economics:</strong> The certified pre-tax organic scenario shows ' + esc(first(economics)) + ' profit, ' + esc(part(economics, 1)) + ' margin, and ' + esc(part(economics, 2)) + ' ROI.</li><li><strong>Competition:</strong> ' + esc(first(market)) + '. This is active-listing context, never a sold-price claim.</li><li><strong>Market evidence:</strong> ' + esc(plainDemand(demand)) + '</li></ul></section>' +
    '<section class="b0006-owner-section"><p class="b0006-eyebrow">COST STACK</p><h2>Inputs behind the scenario</h2><table class="b0006-cost-stack"><tbody>' +
    costRow('Amazon purchase', first(acquisition), 'factual') + costRow('Amazon shipping / purchase tax', shortShipping(amazonShipping), 'unknown') + costRow('Outbound shipping / packaging / handling', first(outbound) + ' · packaging USD 0.75 · handling USD 0.00', 'policy') + costRow('Returns reserve', first(returns) + ' · used as BASE RETURNS 3%', 'policy') + costRow('eBay fee / fixed order fee', shortFee(ebayFee), 'factual') + costRow('Promotion', headlineScenario, 'scenario') + costRow('ROI basis', 'Amazon purchase + packaging · USD 4.75', 'scenario') + costRow('True break-even', trueBreakEven, 'unknown') +
    '</tbody></table></section></div>' +
    '<div class="b0006-owner-grid"><section class="b0006-owner-section"><p class="b0006-eyebrow">WHAT STILL NEEDS PROOF</p><h2>Material uncertainties</h2><p><strong>USD 3.86 is a pre-tax certified scenario result, not guaranteed realized profit.</strong></p><ul class="b0006-risks"><li><strong>Amazon purchase tax</strong>It remains unknown and is not added to the scenario.</li><li><strong>Demand</strong>It is unproven; active listings are not sales.</li><li><strong>Seller performance surcharge</strong>Account-specific surcharge remains unknown.</li><li><strong>Buyer-collected shipping</strong>It remains unknown and is not represented as revenue.</li></ul></section><section class="b0006-owner-section"><p class="b0006-eyebrow">NEXT STEP</p><h2>Validate before any purchase</h2><ol class="b0006-risks"><li>Validate real demand and sold-price evidence.</li><li>Resolve Amazon purchase tax.</li><li>Resolve seller-performance surcharge.</li><li>Resolve buyer-collected-shipping treatment.</li><li>Seek acquisition cost at or below ' + esc(first(targetAcquisition)) + ' for target economics.</li></ol><p>Commercial execution remains blocked.</p></section>' +
    '<section class="b0006-owner-section"><p class="b0006-eyebrow">ECONOMICS</p><h2>Certified scenario availability</h2><div class="b0006-scenarios"><div class="b0006-scenario-row"><strong>Organic</strong><p>' + esc(scenarioText) + '</p></div><div class="b0006-scenario-row"><strong>Promoted 8%</strong><p>' + esc(scenarioText) + '</p></div><div class="b0006-scenario-row"><strong>Promoted 10%</strong><p>' + esc(scenarioText) + '</p></div></div></section></div>' +
    '<details class="b0006-advanced"><summary>Ver evidencia técnica</summary></details>';
  product.querySelector('.b0006-advanced').append(advanced);
  existing.replaceWith(product);
  product.dataset.ownerDecisionDossier = 'true';
}
function isolateDedicatedView(card) {
  const section = card.closest('section.section');
  if (!section) return;
  app.querySelector('.page-head')?.classList.add('b0006-hidden-for-dedicated-view');
  app.querySelectorAll('section.section').forEach(node => {
    if (node !== section) node.classList.add('b0006-hidden-for-dedicated-view');
  });
  section.classList.add('b0006-dedicated-section');
  section.querySelectorAll('.cohort-dossier').forEach(node => {
    node.hidden = node !== card;
    node.classList.toggle('b0006-owner-decision-card', node === card);
  });
}
function enhance() {
  queued = false;
  if (!app) return;
  installStyles();
  const { page, params } = route();
  if (page !== 'opportunities' || params.get('view') !== 'amazon-ebay' || params.get('asin') !== PRODUCT_ASIN) return;
  const card = app.querySelector('.cohort-dossier[data-dossier-asin="' + PRODUCT_ASIN + '"][data-dossier-open="true"]');
  if (!card) return;
  isolateDedicatedView(card);
  dedicatedPresentation(card);
  requestAnimationFrame(() => card.scrollIntoView({ block: 'start', behavior: 'auto' }));
}
function enqueue() {
  if (queued) return;
  queued = true;
  queueMicrotask(enhance);
}
if (app) {
  app.addEventListener('click', event => {
    if (event.target.closest('[data-owner-decision-back]')) {
      event.preventDefault();
      restoreCohort();
    } else if (event.target.closest('[data-owner-decision-evidence]')) {
      event.preventDefault();
      const details = app.querySelector('.b0006-owner-decision .b0006-advanced');
      details?.setAttribute('open', '');
      details?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }, true);
  new MutationObserver(enqueue).observe(app, { childList: true, subtree: true });
  window.addEventListener('hashchange', enqueue);
  enqueue();
}
export const B0006_OWNER_DECISION_DOSSIER_V2_CONTRACT = Object.freeze({
  asin: PRODUCT_ASIN,
  view: 'DEDICATED_OWNER_DECISION_VIEW',
  source: 'CERTIFIED_BROWSER_READ_MODEL_ONLY',
  primary_image: 'UNAVAILABLE_NO_FACTUAL_ASSET',
  primary_image_source: 'NO_EXISTING_CERTIFIED_ASSET',
  existing_provider_image_mechanism: 'KEEPA_PRODUCT_LOOKUP_REQUIRES_SEPARATE_PROVIDER_CALL',
  provider_calls: 0,
  commercial_mutations: 0,
  scout_runtime: 'UNTOUCHED'
});
