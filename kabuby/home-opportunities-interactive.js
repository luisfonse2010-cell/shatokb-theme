/*
 * First-cohort interaction layer.
 *
 * This is deliberately DOM-only: app.js remains the single certified read
 * model renderer, and this module only adds navigation and progressive
 * disclosure to the already-rendered Home and Opportunities surfaces.  It
 * does not call a provider, fetch data, calculate economics, or run on Scout.
 */

const COHORT_FILTERS = Object.freeze([
  ['ALL', 'All', '10'],
  ['VALIDATE', 'Validate', '5'],
  ['REJECTED_ECONOMICS', 'Rejected', '2'],
  ['BLOCKED_EBAY_FEE_CATEGORY_UNRESOLVED', 'Blocked', '3'],
  ['WHITE_SPACE', 'White space', '3'],
  ['ECONOMICS_COMPLETE', 'Economics complete', '7']
]);

const VALID_FILTERS = new Set(COHORT_FILTERS.map(([id]) => id));
const app = document.querySelector('#app');
let pendingRefresh = false;
let lastFocusedDossier = '';

function currentRoute() {
  const [page = 'today', query = ''] = location.hash.replace(/^#/, '').split('?');
  return { page: page || 'today', params: new URLSearchParams(query) };
}

function currentFilter() {
  const { params } = currentRoute();
  const requested = params.get('cohort') || 'ALL';
  return VALID_FILTERS.has(requested) ? requested : 'ALL';
}

function moveToCohort(filter = 'ALL', asin = '', focus = '') {
  const params = new URLSearchParams({ view: 'amazon-ebay', cohort: VALID_FILTERS.has(filter) ? filter : 'ALL' });
  if (asin) params.set('asin', asin);
  if (focus) params.set('focus', focus);
  location.hash = `#opportunities?${params.toString()}`;
}

function candidateAsin(card) {
  const text = card.querySelector('.eyebrow')?.textContent || '';
  return (text.match(/\bB[0-9A-Z]{9}\b/) || [])[0] || '';
}

function definitionValue(card, label) {
  const pair = Array.from(card.querySelectorAll('dl > div')).find(row => row.querySelector('dt')?.textContent?.trim() === label);
  return pair?.querySelector('dd')?.textContent?.trim() || 'UNKNOWN';
}

function decisionFor(card) {
  return card.querySelector('.state-pill')?.dataset.state || 'UNKNOWN';
}

function isWhiteSpace(card) {
  return definitionValue(card, 'Demand / white space').includes('VERIFIED_EBAY_WHITE_SPACE');
}

function isEconomicsComplete(card) {
  const decision = decisionFor(card);
  return decision === 'VALIDATE' || decision === 'REJECTED_ECONOMICS';
}

function matchesFilter(card, filter) {
  if (filter === 'ALL') return true;
  if (filter === 'WHITE_SPACE') return isWhiteSpace(card);
  if (filter === 'ECONOMICS_COMPLETE') return isEconomicsComplete(card);
  return decisionFor(card) === filter;
}

function installStyles() {
  if (document.querySelector('#first-cohort-interaction-styles')) return;
  const style = document.createElement('style');
  style.id = 'first-cohort-interaction-styles';
  style.textContent = `
    .first-cohort-interactive{cursor:pointer}.first-cohort-interactive:focus-visible{outline:2px solid #ffc65b;outline-offset:3px}
    .interactive-cohort-filters{display:flex;flex-wrap:wrap;gap:8px;margin:0 13px 14px}.interactive-cohort-filters button{border:1px solid rgba(113,183,234,.32);border-radius:99px;padding:8px 11px;color:#cde3f7;background:rgba(4,25,42,.68);font:700 11px/1 system-ui,sans-serif;cursor:pointer}.interactive-cohort-filters button.active,.interactive-cohort-filters button:hover,.interactive-cohort-filters button:focus-visible{outline:0;color:#071827;background:#ffc65b;border-color:#ffc65b}
    .cohort-dossier.interactive-dossier{display:grid;gap:12px;padding:0;overflow:hidden}.interactive-dossier-summary{display:grid;gap:11px;padding:16px;border:0;color:inherit;background:linear-gradient(135deg,rgba(8,31,50,.98),rgba(4,21,35,.97));text-align:left;cursor:pointer}.interactive-dossier-summary:hover,.interactive-dossier-summary:focus-visible{outline:0;background:linear-gradient(135deg,rgba(12,45,71,.98),rgba(4,25,42,.98))}.interactive-dossier-summary-top{display:flex;align-items:center;justify-content:space-between;gap:12px}.interactive-dossier-summary h3{margin:0;color:#f5f8fd;font-size:16px}.interactive-dossier-summary .state-pill{flex:none}.interactive-dossier-summary-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.interactive-dossier-summary-grid span{display:grid;gap:3px;min-width:0;color:#d7e5f2;font-size:11px;line-height:1.35}.interactive-dossier-summary-grid b{color:#7fa9ce;font-size:9px;letter-spacing:.08em;text-transform:uppercase}.interactive-dossier-open{display:inline-flex;align-items:center;width:max-content;color:#ffc65b;font-size:11px;font-weight:800}.interactive-dossier-content{padding:0 16px 16px}.interactive-dossier-content[hidden]{display:none}.interactive-dossier-sections{display:grid;gap:10px}.interactive-dossier-section{padding:12px;border:1px solid rgba(105,177,232,.2);border-radius:9px;background:rgba(2,17,29,.66)}.interactive-dossier-section h4{margin:0 0 8px;color:#8ec9f1;font-size:10px;letter-spacing:.11em}.interactive-dossier-section dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:0}.interactive-dossier-section dt{color:#84a4bf;font-size:9px;letter-spacing:.05em}.interactive-dossier-section dd{margin:4px 0 0;color:#edf5fc;font-size:11px;line-height:1.45}.interactive-dossier-note{margin:9px 0 0;color:#b7cbe0;font-size:10px;line-height:1.45}.interactive-dossier-note strong{color:#ffc65b}.interactive-dossier-disclosure{margin:0 0 10px;color:#ffc65b;font-size:10px;font-weight:800;letter-spacing:.06em}.interactive-home-open{margin-top:7px}
    @media(max-width:760px){.interactive-dossier-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.interactive-dossier-section dl{grid-template-columns:1fr}}
  `;
  document.head.append(style);
}

function makeFocusable(node, filter) {
  node.classList.add('first-cohort-interactive');
  node.dataset.homeCohort = filter;
  node.setAttribute('role', 'button');
  node.tabIndex = 0;
}

function enhanceHome() {
  const { page } = currentRoute();
  if (page !== 'today') return;
  const top = app.querySelector('.top-opportunity');
  if (top && top.textContent.includes('B0006N5S1C')) {
    top.dataset.homeDossier = 'B0006N5S1C';
    top.setAttribute('role', 'link');
    top.tabIndex = 0;
    const action = top.querySelector('.opportunity-action');
    if (action && !action.querySelector('[data-interactive-home-open]')) {
      const open = document.createElement('button');
      open.type = 'button';
      open.className = 'interactive-home-open';
      open.dataset.interactiveHomeOpen = 'B0006N5S1C';
      open.textContent = 'Open certified dossier';
      action.append(open);
    }
  }
  for (const tile of app.querySelectorAll('.attention-tile')) {
    const text = tile.textContent.toLowerCase();
    if (text.includes('validate')) makeFocusable(tile, 'VALIDATE');
    else if (text.includes('rejected economics')) makeFocusable(tile, 'REJECTED_ECONOMICS');
    else if (text.includes('products evaluated')) makeFocusable(tile, 'ALL');
  }
  for (const metric of app.querySelectorAll('.glance .metric')) {
    const text = metric.textContent.toLowerCase();
    if (text.includes('opportunities')) makeFocusable(metric, 'ALL');
    else if (text.includes('decisions')) makeFocusable(metric, 'VALIDATE');
    else if (text.includes('economics')) makeFocusable(metric, 'ECONOMICS_COMPLETE');
    else if (text.includes('portfolio')) makeFocusable(metric, 'BLOCKED_EBAY_FEE_CATEGORY_UNRESOLVED');
    else if (text.includes('evidence')) makeFocusable(metric, 'WHITE_SPACE');
  }
}

function sectionFor(label) {
  const normalized = label.toLowerCase();
  if (normalized.startsWith('decision')) return 'Decision';
  if (normalized.startsWith('amazon purchasable') || normalized.startsWith('amazon shipping') || normalized.startsWith('amazon price history') || normalized.startsWith('package weight')) return 'Amazon acquisition';
  if (normalized.startsWith('outbound shipping') || normalized.startsWith('returns reserve')) return 'Cost stack';
  if (normalized.startsWith('ebay category') || normalized.startsWith('active listing') || normalized.startsWith('demand / white')) return 'eBay market';
  if (normalized.startsWith('organic') || normalized.startsWith('break-even') || normalized.startsWith('pre-tax')) return 'Economics';
  return 'Risk / evidence';
}

function sectionNote(title) {
  if (title === 'eBay market') return '<p class="interactive-dossier-note"><strong>ACTIVE LISTING PRICE — NOT SOLD PRICE.</strong> DEMAND UNPROVEN unless certified evidence explicitly says otherwise.</p>';
  if (title === 'Cost stack') return '<p class="interactive-dossier-note">Known costs remain separate from <strong>OWNER POLICY</strong>; Amazon purchase tax stays <strong>UNKNOWN</strong> when unobserved.</p>';
  if (title === 'Economics') return '<p class="interactive-dossier-note">ORGANIC, PROMOTED 8%, and PROMOTED 10% are labeled scenarios. No single scenario is presented as a factual sold-price result.</p>';
  if (title === 'Risk / evidence') return '<p class="interactive-dossier-note"><strong>FACTUAL</strong>, <strong>OWNER POLICY</strong>, <strong>SCENARIO</strong>, and <strong>UNKNOWN</strong> remain distinct.</p>';
  return '';
}

function buildDossierSections(content) {
  if (content.querySelector('.interactive-dossier-sections')) return;
  const source = content.querySelector('dl');
  if (!source) return;
  const groups = new Map();
  for (const row of Array.from(source.children)) {
    const title = sectionFor(row.querySelector('dt')?.textContent || '');
    if (!groups.has(title)) groups.set(title, []);
    groups.get(title).push(row);
  }
  const sections = document.createElement('div');
  sections.className = 'interactive-dossier-sections';
  for (const title of ['Decision', 'Amazon acquisition', 'eBay market', 'Cost stack', 'Economics', 'Risk / evidence']) {
    const rows = groups.get(title);
    if (!rows?.length) continue;
    const section = document.createElement('section');
    section.className = 'interactive-dossier-section';
    section.dataset.dossierSection = title.toLowerCase().replaceAll(' ', '-').replaceAll('/', '');
    section.innerHTML = `<h4>${title}</h4><dl></dl>${sectionNote(title)}`;
    const list = section.querySelector('dl');
    rows.forEach(row => list.append(row));
    sections.append(section);
  }
  source.replaceWith(sections);
}

function decorateDossier(card, selectedAsin) {
  const asin = candidateAsin(card);
  if (!asin) return;
  card.dataset.dossierAsin = asin;
  card.classList.add('interactive-dossier');
  if (!card.querySelector('.interactive-dossier-summary')) {
    const title = card.querySelector('h3')?.textContent?.trim() || asin;
    const decision = decisionFor(card);
    const market = definitionValue(card, 'Active listing range / competition');
    const acquisition = definitionValue(card, 'Amazon purchasable acquisition price');
    const economics = definitionValue(card, 'Pre-tax profit / margin / ROI');
    const blocker = definitionValue(card, 'Exact remaining blocker / confidence');
    const content = document.createElement('div');
    content.className = 'interactive-dossier-content';
    while (card.firstChild) content.append(card.firstChild);
    buildDossierSections(content);
    const summary = document.createElement('button');
    summary.type = 'button';
    summary.className = 'interactive-dossier-summary';
    summary.dataset.interactiveDossierOpen = asin;
    summary.innerHTML = `<span class="interactive-dossier-summary-top"><span><small>ASIN ${asin}</small><h3>${title}</h3></span><span class="state-pill" data-state="${decision}">${decision.replaceAll('_', ' ')}</span></span><span class="interactive-dossier-summary-grid"><span><b>Market state</b>${market}</span><span><b>Amazon acquisition</b>${acquisition}</span><span><b>Economics</b>${economics}</span><span><b>Blocker</b>${blocker}</span></span><span class="interactive-dossier-open">Open dossier →</span>`;
    card.append(summary, content);
  }
  const content = card.querySelector('.interactive-dossier-content');
  const isSelected = selectedAsin === asin;
  content.hidden = !isSelected;
  card.dataset.dossierOpen = String(isSelected);
  if (isSelected && lastFocusedDossier !== asin) {
    lastFocusedDossier = asin;
    requestAnimationFrame(() => card.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  }
}

function enhanceOpportunities() {
  const { page, params } = currentRoute();
  if (page !== 'opportunities' || params.get('view') !== 'amazon-ebay') return;
  const section = Array.from(app.querySelectorAll('section.section')).find(node => node.textContent.includes('First cohort dossiers'));
  if (!section) return;
  const filter = currentFilter();
  const filters = section.querySelector('.cohort-filters');
  if (filters) {
    filters.className = 'interactive-cohort-filters';
    filters.innerHTML = COHORT_FILTERS.map(([id, label, count]) => `<button type="button" data-interactive-cohort-filter="${id}" class="${filter === id ? 'active' : ''}" aria-pressed="${filter === id}">${label} (${count})</button>`).join('');
  }
  const cards = Array.from(section.querySelectorAll('.cohort-dossier'));
  cards.forEach(card => {
    card.hidden = !matchesFilter(card, filter);
    decorateDossier(card, params.get('asin') || '');
  });
}

function refresh() {
  pendingRefresh = false;
  if (!app) return;
  installStyles();
  enhanceHome();
  enhanceOpportunities();
}

function queueRefresh() {
  if (pendingRefresh) return;
  pendingRefresh = true;
  queueMicrotask(refresh);
}

function activateFromTarget(target) {
  const filterTarget = target.closest('[data-interactive-cohort-filter]');
  if (filterTarget) {
    moveToCohort(filterTarget.dataset.interactiveCohortFilter);
    return true;
  }
  const dossierTarget = target.closest('[data-interactive-dossier-open]');
  if (dossierTarget) {
    moveToCohort(currentFilter(), dossierTarget.dataset.interactiveDossierOpen, 'decision');
    return true;
  }
  const homeOpen = target.closest('[data-interactive-home-open]');
  if (homeOpen) {
    moveToCohort('VALIDATE', homeOpen.dataset.interactiveHomeOpen, 'decision');
    return true;
  }
  const seeWhy = target.closest('.top-opportunity [data-action="explain-evidence"]');
  if (seeWhy && seeWhy.closest('[data-home-dossier]')) {
    moveToCohort('VALIDATE', 'B0006N5S1C', 'evidence');
    return true;
  }
  const homeCohort = target.closest('[data-home-cohort]');
  if (homeCohort) {
    moveToCohort(homeCohort.dataset.homeCohort);
    return true;
  }
  const card = target.closest('.top-opportunity[data-home-dossier]');
  if (card && !target.closest('button,a')) {
    moveToCohort('VALIDATE', card.dataset.homeDossier, 'decision');
    return true;
  }
  return false;
}

if (app) {
  app.addEventListener('click', event => {
    if (activateFromTarget(event.target)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
  app.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && activateFromTarget(event.target)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
  new MutationObserver(queueRefresh).observe(app, { childList: true, subtree: true });
  window.addEventListener('hashchange', queueRefresh);
  queueRefresh();
}

export const FIRST_COHORT_INTERACTION_CONTRACT = Object.freeze({
  cohort_size: 10,
  filters: Object.freeze({ ALL: 10, VALIDATE: 5, REJECTED_ECONOMICS: 2, BLOCKED: 3, WHITE_SPACE: 3, ECONOMICS_COMPLETE: 7 }),
  data_source: 'CERTIFIED_BROWSER_READ_MODEL_ONLY',
  heavy_content_calls: 0,
  provider_calls: 0,
  commercial_mutations: 0,
  scout_runtime: 'UNTOUCHED'
});
