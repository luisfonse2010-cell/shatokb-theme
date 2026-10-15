/*
 * B0006N5S1C owner dossier presentation.
 *
 * This layer only reorganizes the existing certified browser read model for
 * one owner-approved product. It does not fetch content, calculate economics,
 * mutate decisions, or touch Scout.
 */

const PRODUCT_ASIN = 'B0006N5S1C';
const app = document.querySelector('#app');
let queued = false;

function route() {
  const [page = 'today', query = ''] = location.hash.replace(/^#/, '').split('?');
  return { page: page || 'today', params: new URLSearchParams(query) };
}

function valueFor(card, label) {
  const definition = Array.from(card.querySelectorAll('dt')).find(node => node.textContent?.trim() === label)?.parentElement;
  return definition?.querySelector('dd')?.textContent?.trim() || 'UNKNOWN';
}

function installStyles() {
  if (document.querySelector('#b0006-commercial-dossier-styles')) return;
  const style = document.createElement('style');
  style.id = 'b0006-commercial-dossier-styles';
  style.textContent = `
    .b0006-commercial-dossier{border-color:rgba(255,198,91,.55)!important;background:linear-gradient(145deg,rgba(6,27,44,.98),rgba(2,17,29,.98))!important}.b0006-commercial-dossier .interactive-dossier-content{padding:0}.commercial-dossier{display:grid;gap:16px;padding:16px}.commercial-product-header{display:grid;grid-template-columns:minmax(190px,260px) minmax(0,1fr);gap:18px;align-items:stretch;padding:17px;border:1px solid rgba(255,198,91,.34);border-radius:12px;background:linear-gradient(115deg,rgba(7,35,56,.98),rgba(4,20,33,.88))}.commercial-image-unavailable{display:grid;place-items:center;min-height:190px;padding:20px;border:1px dashed rgba(132,184,224,.42);border-radius:10px;background:linear-gradient(145deg,rgba(8,37,60,.76),rgba(2,16,28,.94));color:#c4d7e8;text-align:center}.commercial-image-unavailable span{display:block;margin-bottom:9px;color:#ffc65b;font-size:28px}.commercial-image-unavailable small{max-width:23ch;line-height:1.45}.commercial-header-copy{display:grid;align-content:start;gap:10px;min-width:0}.commercial-header-copy p{margin:0;color:#93b3cf;font-size:11px;line-height:1.45}.commercial-header-copy h2{margin:0;color:#f6f9ff;font-size:clamp(21px,2.35vw,32px);line-height:1.07;letter-spacing:-.035em}.commercial-asin{display:inline-flex;width:max-content;padding:5px 8px;border:1px solid rgba(116,190,241,.28);border-radius:99px;color:#8ac8f3;font:800 10px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace}.commercial-decision-line{display:flex;flex-wrap:wrap;align-items:center;gap:8px}.commercial-confidence{color:#b9cfdf!important}.commercial-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:3px}.commercial-actions a,.commercial-actions button{display:inline-flex;align-items:center;justify-content:center;min-height:37px;padding:9px 12px;border:1px solid rgba(126,190,238,.5);border-radius:8px;color:#e7f4ff;background:rgba(4,25,42,.72);font-size:11px;font-weight:800;text-decoration:none;cursor:pointer}.commercial-actions a.primary{border-color:#ffc65b;background:linear-gradient(135deg,#ffc95f,#e99f32);color:#101a24}.commercial-actions a:hover,.commercial-actions a:focus-visible,.commercial-actions button:hover,.commercial-actions button:focus-visible{outline:0;border-color:#ffc65b;color:#ffc65b}.commercial-actions a.primary:hover,.commercial-actions a.primary:focus-visible{color:#101a24;filter:brightness(1.07)}.commercial-summary{display:grid;gap:10px;padding:16px;border:1px solid rgba(94,170,228,.26);border-radius:12px;background:rgba(3,20,33,.78)}.commercial-summary-head{display:flex;flex-wrap:wrap;align-items:end;justify-content:space-between;gap:8px}.commercial-summary h3,.commercial-decision-panel h3,.commercial-section h3{margin:0;color:#f5f9ff;font-size:16px}.commercial-summary-head p,.commercial-decision-panel>p,.commercial-section>p{margin:0;color:#9fb8cd;font-size:11px;line-height:1.45}.commercial-profit-strip{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px}.commercial-profit-strip div{display:grid;gap:5px;min-width:0;padding:11px;border:1px solid rgba(100,176,230,.16);border-radius:8px;background:rgba(5,29,47,.78)}.commercial-profit-strip small,.commercial-costs th,.commercial-costs td small{color:#8ba8bf;font-size:9px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}.commercial-profit-strip strong{color:#eaf5ff;font-size:15px;line-height:1.15;overflow-wrap:anywhere}.commercial-profit-strip .scenario strong{color:#ffc65b}.commercial-decision-panel{display:grid;gap:10px;padding:16px;border:1px solid rgba(69,206,168,.32);border-radius:12px;background:linear-gradient(135deg,rgba(4,44,51,.68),rgba(4,27,43,.92))}.commercial-decision-panel dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:0}.commercial-decision-panel div{padding:10px;border-radius:8px;background:rgba(3,19,30,.48)}.commercial-decision-panel dt{color:#7ed9c1;font-size:9px;font-weight:800;letter-spacing:.09em}.commercial-decision-panel dd{margin:5px 0 0;color:#e3f1f7;font-size:12px;line-height:1.4}.commercial-grid{display:grid;grid-template-columns:1.06fr .94fr;gap:14px}.commercial-section{display:grid;gap:12px;padding:16px;border:1px solid rgba(92,169,226,.22);border-radius:12px;background:rgba(3,20,33,.76)}.commercial-costs{width:100%;border-collapse:collapse}.commercial-costs th,.commercial-costs td{padding:9px 6px;border-bottom:1px solid rgba(105,177,232,.14);text-align:left;vertical-align:top}.commercial-costs th{width:37%;color:#c5d9e9;font-size:11px}.commercial-costs td{color:#edf6fc;font-size:11px;line-height:1.4}.truth-factual{color:#77d5fe}.truth-policy{color:#ffc65b}.truth-scenario{color:#a7cbff}.truth-unknown{color:#ffbdc7}.commercial-scenarios{display:grid;gap:8px}.commercial-scenario{padding:11px;border:1px solid rgba(100,176,230,.16);border-radius:8px;background:rgba(5,29,47,.7)}.commercial-scenario h4{margin:0 0 5px;color:#dceeff;font-size:11px}.commercial-scenario p{margin:0;color:#adc5d8;font-size:10px;line-height:1.45}.commercial-risk-list{display:grid;gap:8px;margin:0;padding:0;list-style:none}.commercial-risk-list li{padding:10px;border-left:3px solid #f0a646;border-radius:0 8px 8px 0;background:rgba(64,41,20,.29);color:#d8e6f1;font-size:11px;line-height:1.4}.commercial-risk-list strong{display:block;color:#ffc65b;font-size:10px;letter-spacing:.06em}.commercial-advanced{border:1px solid rgba(106,181,232,.23);border-radius:10px;background:rgba(3,17,29,.72)}.commercial-advanced>summary{padding:13px 15px;color:#cde9ff;cursor:pointer;font-size:11px;font-weight:800}.commercial-advanced-body{padding:0 16px 16px}.commercial-advanced .interactive-dossier-sections{gap:10px}.commercial-advanced .authority-badge{display:inline-flex;margin-top:10px}
    @media(max-width:860px){.commercial-product-header{grid-template-columns:1fr}.commercial-image-unavailable{min-height:120px}.commercial-profit-strip{grid-template-columns:repeat(2,minmax(0,1fr))}.commercial-grid{grid-template-columns:1fr}.commercial-decision-panel dl{grid-template-columns:1fr}}@media(max-width:520px){.commercial-profit-strip{grid-template-columns:1fr}.commercial-costs th{width:43%}.commercial-actions>*{width:100%}}
  `;
  document.head.append(style);
}

function truthClass(value) {
  const text = String(value || '');
  if (/UNKNOWN|UNPROVEN|UNRESOLVED/.test(text)) return 'truth-unknown';
  if (/OWNER POLICY|CONFIGURED/.test(text)) return 'truth-policy';
  if (/SCENARIO|ACTIVE LISTING/.test(text)) return 'truth-scenario';
  return 'truth-factual';
}

function costRow(label, value, truth) {
  return `<tr><th>${label}</th><td>${value}<br><small class="${truthClass(truth)}">${truth}</small></td></tr>`;
}

function scenarioCard(name, content) {
  return `<article class="commercial-scenario"><h4>${name}</h4><p>${content === 'UNKNOWN' ? 'UNKNOWN — no certified scenario row is available in this dossier.' : content}</p></article>`;
}

function commercialPresentation(card) {
  const existing = card.querySelector('.interactive-dossier-content');
  if (!existing || existing.dataset.commercialPresentation === 'true') return;
  const title = card.querySelector('h3')?.textContent?.trim() || PRODUCT_ASIN;
  const decision = card.querySelector('.state-pill')?.dataset.state || 'VALIDATE';
  const strategic = valueFor(card, 'Decision / strategic potential');
  const acquisition = valueFor(card, 'Amazon purchasable acquisition price');
  const amazonShipping = valueFor(card, 'Amazon shipping / tax / landed cost');
  const history = valueFor(card, 'Amazon price history / confidence');
  const outbound = valueFor(card, 'Outbound shipping / packaging / handling');
  const returns = valueFor(card, 'Returns reserve');
  const ebayFee = valueFor(card, 'eBay category / official fee');
  const market = valueFor(card, 'Active listing range / competition');
  const demand = valueFor(card, 'Demand / white space');
  const scenarios = valueFor(card, 'Organic / promoted scenarios');
  const economics = valueFor(card, 'Pre-tax profit / margin / ROI');
  const pricing = valueFor(card, 'Break-even / target price / TAC');
  const blockers = valueFor(card, 'Exact remaining blocker / confidence');
  const previous = document.createElement('div');
  previous.className = 'commercial-advanced-body';
  while (existing.firstChild) previous.append(existing.firstChild);
  const amazonUrl = `https://www.amazon.com/dp/${PRODUCT_ASIN}`;
  const ebaySearch = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(title)}`;
  const product = document.createElement('div');
  // Keep the host class expected by the existing progressive-dossier layer so
  // a later DOM refresh continues to treat this as the same read-only card.
  product.className = 'commercial-dossier interactive-dossier-content';
  product.innerHTML = `
    <section class="commercial-product-header" aria-label="B0006N5S1C product overview">
      <div class="commercial-image-unavailable"><div><span aria-hidden="true">◇</span><strong>Primary image unavailable</strong><small>No factual primary image is present in the certified dossier. Kabuby did not fetch or generate one.</small></div></div>
      <div class="commercial-header-copy"><p>AMAZON → EBAY · CERTIFIED READ-ONLY DOSSIER</p><h2>${title}</h2><span class="commercial-asin">ASIN ${PRODUCT_ASIN}</span><div class="commercial-decision-line"><span class="state-pill" data-state="${decision}">${decision}</span><span class="state-pill" data-state="SCENARIO">ACTIVE LISTING SCENARIO</span></div><p class="commercial-confidence">Market state: ${market}<br>Evidence confidence: ${history}</p><div class="commercial-actions"><a class="primary" href="${amazonUrl}" target="_blank" rel="noopener noreferrer">Ver en Amazon</a><a href="${ebaySearch}" target="_blank" rel="noopener noreferrer">Revisar mercado eBay</a><button type="button" data-commercial-evidence>Ver evidencia detallada</button><button type="button" data-commercial-back>Volver a oportunidades</button></div></div>
    </section>
    <section class="commercial-summary"><div class="commercial-summary-head"><div><p>COMMERCIAL SUMMARY · CERTIFIED SCENARIO</p><h3>Cost → market → potential profit</h3></div><span class="state-pill" data-state="SCENARIO">PRE-TAX</span></div><div class="commercial-profit-strip"><div><small>Amazon purchase</small><strong>${acquisition.split(' · ')[0] || 'UNKNOWN'}</strong></div><div><small>eBay reference price</small><strong class="scenario">${market.split(' · ')[0] || 'UNKNOWN'}</strong></div><div><small>Pre-tax profit</small><strong>${economics.split(' · ')[0] || 'UNKNOWN'}</strong></div><div><small>Margin / ROI</small><strong>${economics.split(' · ').slice(1).join(' · ') || 'UNKNOWN'}</strong></div><div><small>Break-even / target / TAC</small><strong>${pricing}</strong></div></div><p>ACTIVE LISTING PRICE — NOT SOLD PRICE. This is a <strong>PRE-TAX SCENARIO</strong>, not a guaranteed profit or demand claim.</p></section>
    <section class="commercial-decision-panel"><p>KABUBY DECISION</p><h3>${decision}</h3><dl><div><dt>WHY</dt><dd>${strategic}. The existing economics scenario is positive; owner review remains required.</dd></div><div><dt>COMPETITION</dt><dd>${market}</dd></div><div><dt>DEMAND</dt><dd>${demand}. Demand is not inferred from listings.</dd></div><div><dt>NEXT STEP</dt><dd>Review the certified dossier and validate the remaining factual unknowns before any commercial action.</dd></div></dl></section>
    <div class="commercial-grid"><section class="commercial-section"><p>COST STACK · READ ONLY</p><h3>What the scenario includes</h3><table class="commercial-costs"><tbody>${costRow('Amazon acquisition', acquisition, 'FACTUAL · existing purchasable offer')}${costRow('Amazon shipping / purchase tax', amazonShipping, 'FACTUAL where observed · UNKNOWN preserved')}${costRow('Outbound shipping / packaging / handling', outbound, 'OWNER POLICY / configured shipping estimate')}${costRow('Returns reserve', returns, 'OWNER POLICY')}${costRow('eBay base fee / fixed order fee', ebayFee, 'FACTUAL · OFFICIAL EBAY FEE')}${costRow('Promotion', scenarios, 'SCENARIO · UNKNOWN when not certified')}</tbody></table></section><section class="commercial-section"><p>ECONOMICS · PROGRESSIVE DISCLOSURE</p><h3>Available scenario views</h3><div class="commercial-scenarios">${scenarioCard('Organic', scenarios)}${scenarioCard('Promoted 8%', scenarios)}${scenarioCard('Promoted 10%', scenarios)}</div><p>Scenario rows are shown only from the existing dossier. UNKNOWN is not converted into an estimate.</p></section></div>
    <section class="commercial-section"><p>RISK / EVIDENCE</p><h3>What still needs proof</h3><ul class="commercial-risk-list"><li><strong>Amazon purchase tax</strong>UNKNOWN</li><li><strong>Demand</strong>UNPROVEN — active listings are not sales.</li><li><strong>Seller performance surcharge</strong>UNKNOWN</li><li><strong>Remaining canonical blockers</strong>${blockers}</li></ul></section>
    <details class="commercial-advanced"><summary>Ver evidencia detallada</summary></details>
  `;
  const advanced = product.querySelector('.commercial-advanced');
  advanced.append(previous);
  existing.replaceWith(product);
  product.dataset.commercialPresentation = 'true';
}

function enhance() {
  queued = false;
  if (!app) return;
  installStyles();
  const { page, params } = route();
  if (page !== 'opportunities' || params.get('view') !== 'amazon-ebay' || params.get('asin') !== PRODUCT_ASIN) return;
  const card = app.querySelector(`.cohort-dossier[data-dossier-asin="${PRODUCT_ASIN}"][data-dossier-open="true"]`);
  if (!card) return;
  card.classList.add('b0006-commercial-dossier');
  commercialPresentation(card);
}

function enqueue() {
  if (queued) return;
  queued = true;
  queueMicrotask(enhance);
}

if (app) {
  app.addEventListener('click', event => {
    const evidence = event.target.closest('[data-commercial-evidence]');
    if (evidence) {
      event.preventDefault();
      const details = app.querySelector('.b0006-commercial-dossier .commercial-advanced');
      details?.setAttribute('open', '');
      details?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      return;
    }
    if (event.target.closest('[data-commercial-back]')) {
      event.preventDefault();
      location.hash = '#opportunities?view=amazon-ebay&cohort=VALIDATE';
    }
  }, true);
  new MutationObserver(enqueue).observe(app, { childList: true, subtree: true });
  window.addEventListener('hashchange', enqueue);
  enqueue();
}

export const B0006_COMMERCIAL_DOSSIER_CONTRACT = Object.freeze({
  asin: PRODUCT_ASIN,
  source: 'CERTIFIED_BROWSER_READ_MODEL_ONLY',
  primary_image: 'UNAVAILABLE_NO_FACTUAL_ASSET',
  amazon_navigation: 'DETERMINISTIC_ASIN_ONLY',
  ebay_navigation: 'CERTIFIED_IDENTITY_SEARCH_REVIEW_ONLY',
  heavy_content_calls: 0,
  provider_calls: 0,
  commercial_mutations: 0,
  scout_runtime: 'UNTOUCHED'
});
