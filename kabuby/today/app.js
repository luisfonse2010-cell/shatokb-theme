import { DAYPARTS, NAVIGATION, PHYSICAL_PROJECTION_PATH, PROJECTION_UI_CONTRACT } from './data.js';
import { COMMAND_CENTER_PROJECTION_CONTRACT } from './command-center-data.js';

const app = document.querySelector('#app');
const nav = document.querySelector('#primary-navigation');
const shell = document.querySelector('.app-shell');
const notice = document.querySelector('#notice');
const localeButton = document.querySelector('#locale-button');
const systemStatus = document.querySelector('#system-status');
const icons = Object.freeze({ today: '⌂', opportunities: '◇', scout: '⌁', supply: '▣', economics: '⌁', operations: '⌘', portfolio: '◇', learning: '◎', settings: '⚙' });

const COPY = Object.freeze({
  en: Object.freeze({
    'nav.today':'Today','nav.opportunities':'Opportunities','nav.scout':'Scout','nav.supply':'Supply','nav.economics':'Economics & Risk','nav.operations':'Marketplace Operations','nav.portfolio':'Portfolio','nav.learning':'Intelligence & Learning','nav.settings':'Settings & Policies','nav.help':'Help','nav.account':'Account',
    'ask.label':'Ask Kabuby','ask.placeholder':'Ask Kabuby anything…','ask.button':'Ask','status.loading':'Loading certified intelligence','status.waiting':'Waiting for certified evidence','status.available':'Certified read model available','owner.greeting':'Intelligence OS','owner.name':'Owner view',
    'hero.morning':'Good morning, {name}.','hero.afternoon':'Good afternoon, {name}.','hero.evening':'Good evening, {name}.','hero.night':'Good night, {name}.','hero.summary':'Kabuby presents certified evidence, exceptions, and the next safe research step.','hero.emphasis':'No commercial action is enabled.',
    'today.top':'Top opportunity','today.attention':'Owner attention','today.glance':'Your business at a glance','today.activity':'Recent activity','today.notAvailable':'Not available','today.waiting':'Waiting for authenticated projection','today.noOpportunity':'No canonical opportunity is ready to present','today.noOpportunityCopy':'Kabuby will keep unknown fields visible until canonical evidence supports an opportunity.','today.noActivity':'No canonical activity is available for this period.','today.why':'Why it matters','today.next':'Next permitted research','today.seeWhy':'See why','today.security':'Commercial actions remain blocked',
    'state.unknown':'UNKNOWN','state.waiting':'WAITING FOR EVIDENCE','state.blocked':'BLOCKED','state.partial':'PARTIAL','state.stale':'STALE','state.notProven':'NOT PROVEN','state.available':'AVAILABLE','state.review':'REVIEW ONLY','label.opportunities':'Opportunities','label.decisions':'Decisions','label.marketplaces':'Marketplace health','label.economics':'Economics','label.evidence':'Evidence','label.freshness':'Freshness','label.provenance':'Provenance','label.risk':'Main risk','label.supply':'Supply','label.demand':'Demand','label.competition':'Competition','label.price':'Economic view','label.authority':'Authority','label.unknowns':'Unknown fields',
    'page.readOnly':'Certified read-only projection','page.scout':'Scout is a protected existing surface','page.scoutCopy':'The Intelligence OS shell links around Scout. Its routes, contracts, runtime, and Chrome extension integration remain unchanged.','page.noData':'No canonical data is available for this surface yet. This is an explicit evidence state, not a zero or positive claim.','footer':'Certified read-only presentation · commercial authority NONE'
  }),
  es: Object.freeze({
    'nav.today':'Hoy','nav.opportunities':'Oportunidades','nav.scout':'Scout','nav.supply':'Suministro','nav.economics':'Economía y riesgo','nav.operations':'Operaciones de marketplace','nav.portfolio':'Portafolio','nav.learning':'Inteligencia y aprendizaje','nav.settings':'Configuración y políticas','nav.help':'Ayuda','nav.account':'Cuenta',
    'ask.label':'Preguntar a Kabuby','ask.placeholder':'Pregúntale a Kabuby…','ask.button':'Preguntar','status.loading':'Cargando inteligencia certificada','status.waiting':'Esperando evidencia certificada','status.available':'Read model certificado disponible','owner.greeting':'Intelligence OS','owner.name':'Vista del propietario',
    'hero.morning':'Buenos días, {name}.','hero.afternoon':'Buenas tardes, {name}.','hero.evening':'Buenas noches, {name}.','hero.night':'Buenas noches, {name}.','hero.summary':'Kabuby presenta evidencia certificada, excepciones y el siguiente paso seguro de investigación.','hero.emphasis':'No hay acciones comerciales habilitadas.',
    'today.top':'Oportunidad principal','today.attention':'Atención del propietario','today.glance':'Tu negocio de un vistazo','today.activity':'Actividad reciente','today.notAvailable':'No disponible','today.waiting':'Esperando proyección autenticada','today.noOpportunity':'No hay una oportunidad canónica lista para presentar','today.noOpportunityCopy':'Kabuby mantendrá los campos UNKNOWN visibles hasta que la evidencia canónica respalde una oportunidad.','today.noActivity':'No hay actividad canónica disponible para este período.','today.why':'Por qué importa','today.next':'Siguiente investigación permitida','today.seeWhy':'Ver por qué','today.security':'Las acciones comerciales continúan bloqueadas',
    'state.unknown':'DESCONOCIDO','state.waiting':'ESPERANDO EVIDENCIA','state.blocked':'BLOQUEADO','state.partial':'PARCIAL','state.stale':'OBSOLETO','state.notProven':'NO DEMOSTRADO','state.available':'DISPONIBLE','state.review':'SOLO REVISIÓN','label.opportunities':'Oportunidades','label.decisions':'Decisiones','label.marketplaces':'Salud de marketplaces','label.economics':'Economía','label.evidence':'Evidencia','label.freshness':'Frescura','label.provenance':'Procedencia','label.risk':'Riesgo principal','label.supply':'Suministro','label.demand':'Demanda','label.competition':'Competencia','label.price':'Vista económica','label.authority':'Autoridad','label.unknowns':'Campos desconocidos',
    'page.readOnly':'Proyección certificada de solo lectura','page.scout':'Scout es una superficie existente protegida','page.scoutCopy':'El shell de Intelligence OS se adapta alrededor de Scout. Sus rutas, contratos, runtime e integración con la extensión de Chrome permanecen sin cambios.','page.noData':'Todavía no hay datos canónicos disponibles para esta superficie. Es un estado explícito de evidencia, no un cero ni una afirmación positiva.','footer':'Presentación certificada de solo lectura · autoridad comercial NONE'
  }),
  pt: Object.freeze({
    'nav.today':'Hoje','nav.opportunities':'Oportunidades','nav.scout':'Scout','nav.supply':'Fornecimento','nav.economics':'Economia e risco','nav.operations':'Operações de marketplace','nav.portfolio':'Portfólio','nav.learning':'Inteligência e aprendizado','nav.settings':'Configurações e políticas','nav.help':'Ajuda','nav.account':'Conta',
    'ask.label':'Perguntar ao Kabuby','ask.placeholder':'Pergunte ao Kabuby…','ask.button':'Perguntar','status.loading':'Carregando inteligência certificada','status.waiting':'Aguardando evidência certificada','status.available':'Read model certificado disponível','owner.greeting':'Intelligence OS','owner.name':'Visão do proprietário',
    'hero.morning':'Bom dia, {name}.','hero.afternoon':'Boa tarde, {name}.','hero.evening':'Boa noite, {name}.','hero.night':'Boa noite, {name}.','hero.summary':'Kabuby mostra evidência certificada, exceções e a próxima etapa segura de pesquisa.','hero.emphasis':'Nenhuma ação comercial está habilitada.',
    'today.top':'Oportunidade principal','today.attention':'Atenção do proprietário','today.glance':'Seu negócio em resumo','today.activity':'Atividade recente','today.notAvailable':'Não disponível','today.waiting':'Aguardando projeção autenticada','today.noOpportunity':'Nenhuma oportunidade canônica está pronta para apresentação','today.noOpportunityCopy':'Kabuby manterá campos UNKNOWN visíveis até que a evidência canônica sustente uma oportunidade.','today.noActivity':'Nenhuma atividade canônica está disponível neste período.','today.why':'Por que importa','today.next':'Próxima pesquisa permitida','today.seeWhy':'Ver motivo','today.security':'As ações comerciais continuam bloqueadas',
    'state.unknown':'DESCONHECIDO','state.waiting':'AGUARDANDO EVIDÊNCIA','state.blocked':'BLOQUEADO','state.partial':'PARCIAL','state.stale':'DESATUALIZADO','state.notProven':'NÃO COMPROVADO','state.available':'DISPONÍVEL','state.review':'SOMENTE REVISÃO','label.opportunities':'Oportunidades','label.decisions':'Decisões','label.marketplaces':'Saúde dos marketplaces','label.economics':'Economia','label.evidence':'Evidência','label.freshness':'Atualidade','label.provenance':'Procedência','label.risk':'Risco principal','label.supply':'Fornecimento','label.demand':'Demanda','label.competition':'Concorrência','label.price':'Visão econômica','label.authority':'Autoridade','label.unknowns':'Campos desconhecidos',
    'page.readOnly':'Projeção certificada somente leitura','page.scout':'Scout é uma superfície existente protegida','page.scoutCopy':'O shell do Intelligence OS se adapta ao redor do Scout. Rotas, contratos, runtime e integração com a extensão Chrome permanecem inalterados.','page.noData':'Ainda não há dados canônicos disponíveis para esta superfície. Este é um estado explícito de evidência, não zero ou uma alegação positiva.','footer':'Apresentação certificada somente leitura · autoridade comercial NONE'
  })
});

let locale = initialLocale();
let projection = null;
let projectionStatus = 'loading';
let lastError = null;

function initialLocale() {
  try {
    const saved = localStorage.getItem('kabuby-intelligence-locale');
    if (['en', 'es', 'pt', 'auto'].includes(saved)) return saved;
  } catch { /* preference storage is optional */ }
  return 'auto';
}
function activeLocale() {
  if (locale !== 'auto') return locale;
  const value = (navigator.language || 'en').toLowerCase();
  return value.startsWith('pt') ? 'pt' : value.startsWith('es') ? 'es' : 'en';
}
function t(key, values = {}) {
  const text = COPY[activeLocale()][key] || COPY.en[key] || key;
  return text.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));
}
function esc(value) { return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char])); }
function arr(value) { return Array.isArray(value) ? value : []; }
function object(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
function state(value, fallback = 'UNKNOWN') { return typeof value === 'string' && value.trim() ? value.trim() : fallback; }
function stateLabel(value) {
  const normalized = state(value).toLowerCase().replace(/[^a-z0-9]+/g, '');
  if (/unknown|no.*canonical|no.*reviewed|not.*available/.test(normalized)) return t('state.unknown');
  if (/waiting|evidence|required|deferred/.test(normalized)) return t('state.waiting');
  if (/block|denied|failed/.test(normalized)) return t('state.blocked');
  if (/partial/.test(normalized)) return t('state.partial');
  if (/stale/.test(normalized)) return t('state.stale');
  if (/available|reviewed|complete|ready/.test(normalized)) return t('state.available');
  return state(value);
}
function badge(value) { return `<span class="state-pill" data-state="${esc(state(value))}">${esc(stateLabel(value))}</span>`; }
function number(value) { return Number.isFinite(value) ? new Intl.NumberFormat(activeLocale()).format(value) : '—'; }
function relativeDate(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return t('today.notAvailable');
  const date = new Date(value);
  try { return new Intl.DateTimeFormat(activeLocale(), { dateStyle:'medium', timeStyle:'short' }).format(date); } catch { return date.toISOString(); }
}
function daypart() {
  let hour = new Date().getHours();
  try { hour = Number(new Intl.DateTimeFormat(undefined, { hour:'numeric', hourCycle:'h23' }).format(new Date())); } catch { /* local hour is safe fallback */ }
  if (hour >= DAYPARTS.MORNING.start && hour <= DAYPARTS.MORNING.end) return 'morning';
  if (hour >= DAYPARTS.AFTERNOON.start && hour <= DAYPARTS.AFTERNOON.end) return 'afternoon';
  if (hour >= DAYPARTS.EVENING.start && hour <= DAYPARTS.EVENING.end) return 'evening';
  return 'night';
}
function daypartGreeting() { return t(`hero.${daypart()}`, { name: 'Luis' }); }
function tell(message) { notice.textContent = message; notice.classList.add('visible'); clearTimeout(tell.timer); tell.timer = setTimeout(() => notice.classList.remove('visible'), 3800); }

function createNavigation() {
  nav.innerHTML = NAVIGATION.map(([key, label, icon]) => {
    if (key === 'scout') return `<a class="scout-route" href="/" data-page="scout"><span aria-hidden="true">${icon}</span><span>${esc(t(label))}</span><b class="nav-lock">PROTECTED</b></a>`;
    return `<a href="#${key}" data-page="${key}"><span aria-hidden="true">${icon}</span><span>${esc(t(label))}</span></a>`;
  }).join('');
}
function updateStaticCopy() {
  document.documentElement.lang = activeLocale();
  document.querySelectorAll('[data-i18n]').forEach(node => { node.textContent = t(node.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(node => { node.placeholder = t(node.dataset.i18nPlaceholder); });
  localeButton.textContent = locale === 'auto' ? activeLocale().toUpperCase() : locale.toUpperCase();
  localeButton.setAttribute('aria-label', `Language: ${locale === 'auto' ? 'AUTO' : locale.toUpperCase()}`);
}
function setProjectionStatus(next) {
  projectionStatus = next;
  const states = { available:['available',t('status.available')], loading:['waiting',t('status.loading')], unavailable:['waiting',t('status.waiting')], blocked:['blocked',t('state.blocked')] };
  const [className, copy] = states[next] || states.unavailable;
  systemStatus.dataset.state = className;
  systemStatus.querySelector('span').textContent = copy;
}
async function loadProjection() {
  setProjectionStatus('loading');
  try {
    const response = await fetch(PHYSICAL_PROJECTION_PATH, { method:'GET', credentials:'same-origin', headers:{ Accept:'application/json' } });
    if (!response.ok) throw new Error(`PROJECTION_HTTP_${response.status}`);
    const payload = await response.json();
    if (!payload || typeof payload !== 'object' || payload.commercial_authority !== 'NONE' || payload.commercial_actions_enabled !== false) throw new Error('PROJECTION_CONTRACT_DENIED');
    projection = payload;
    lastError = null;
    setProjectionStatus('available');
  } catch (error) {
    projection = null;
    lastError = error?.message || 'PROJECTION_UNAVAILABLE';
    setProjectionStatus('unavailable');
  }
}
function model() {
  const source = object(projection);
  return {
    generatedAt: source.generated_at ?? null,
    command: object(source.physical_command_center),
    radar: object(source.product_opportunity_radar),
    supply: object(source.supply_intelligence),
    economics: object(source.economics_and_channel_matrix),
    operations: object(source.marketplace_operations),
    portfolio: object(source.portfolio),
    learning: object(source.outcome_learning),
    settings: object(source.settings_policies),
    states: object(source.source_states),
    isAvailable: Boolean(projection),
    authority: source.commercial_authority === 'NONE' ? 'NONE' : 'NONE'
  };
}
function noDataCard(title = t('today.waiting'), detail = t('page.noData')) {
  return `<div class="empty-state"><span aria-hidden="true">◇</span><div><strong>${esc(title)}</strong><p>${esc(detail)}</p></div></div>`;
}
function readOnlyButton(label) { return `<button type="button" data-read-only>${esc(label)}</button>`; }
function topCandidate(m) {
  const decision = arr(m.command.decision_packages)[0];
  const opportunity = arr(m.radar.rows)[0] || arr(m.command.opportunities?.rows)[0];
  if (decision) return {
    kind:'decision', title: decision.subject_id || t('today.notAvailable'), category: decision.recommendation_status, copy: decision.primary_reason || t('page.noData'), demand: 'UNKNOWN', competition: decision.risk_state, economics: decision.economics_state, recommendation: decision.recommendation, confidence: decision.confidence, next: decision.next_permitted_action, risk: decision.risk_state, provenance: decision.provenance, freshness: decision.freshness, unknowns: arr(decision.critical_unknowns), id: decision.decision_package_id
  };
  if (opportunity) return {
    kind:'opportunity', title: opportunity.need_or_search || opportunity.opportunity_id, category: opportunity.classification, copy: `${t('label.evidence')}: ${opportunity.evidence_level}`, demand: opportunity.factual_demand, competition: 'UNKNOWN', economics: 'UNKNOWN', recommendation: opportunity.classification, confidence: opportunity.evidence_level, next: opportunity.next_research_action, risk: arr(opportunity.contradictions).length ? 'CONTRADICTIONS_PRESENT' : 'UNKNOWN', provenance: opportunity.opportunity_id, freshness: 'UNKNOWN', unknowns: arr(opportunity.unknown_fields), id: opportunity.opportunity_id
  };
  return null;
}
function bars(tone = '') { return `<span class="bar-set" aria-hidden="true">${Array.from({ length:9 }, (_, index) => `<i class="${index < 5 ? `active ${tone}` : ''}"></i>`).join('')}</span>`; }
function pulseRail(m) {
  const commandState = m.command.status || 'NO_CANONICAL_COMMAND_CENTER';
  const opportunityState = m.radar.status || m.command.opportunities?.status || 'UNKNOWN';
  const supplyState = m.supply.status || 'UNKNOWN';
  const statusCopy = m.isAvailable ? stateLabel(commandState) : t('state.waiting');
  return `<aside class="pulse-rail" aria-label="Kabuby Pulse">
    <div class="pulse-head"><span><i></i>Kabuby Pulse</span><b>${m.isAvailable ? 'LIVE READ' : 'WAITING'}</b></div>
    <div class="pulse-orb" aria-hidden="true"></div>
    <div class="pulse-status">${esc(statusCopy)}</div>
    <p class="pulse-copy">${esc(m.isAvailable ? t('status.available') : t('today.waiting'))}</p>
    <div class="pulse-metrics">
      <div><span>${esc(t('label.opportunities'))}</span>${bars('')}</div>
      <div><span>${esc(t('label.evidence'))}</span>${bars('good')}</div>
      <div><span>${esc(t('label.supply'))}</span>${bars('')}</div>
      <div><span>${esc(t('label.risk'))}</span>${bars('risk')}</div>
    </div>
    <div class="pulse-quote">${esc(t('hero.summary'))}<small>KABUBY</small></div>
    <div class="sr-only">${esc(`${commandState}; ${opportunityState}; ${supplyState}`)}</div>
  </aside>`;
}
function topOpportunity(candidate) {
  if (!candidate) return `<section class="section"><div class="section-heading"><div><p>${esc(t('today.top'))}</p><h2>${esc(t('today.waiting'))}</h2></div>${badge('WAITING_FOR_EVIDENCE')}</div><div class="top-opportunity">${noDataCard(t('today.noOpportunity'), t('today.noOpportunityCopy'))}</div></section>`;
  return `<section class="section"><div class="section-heading"><div><p>${esc(t('today.top'))}</p><h2>${esc(candidate.category)}</h2></div>${badge(candidate.recommendation)}</div>
    <article class="top-opportunity">
      <div class="opportunity-media" aria-hidden="true"><span>Ｋ</span></div>
      <div class="opportunity-copy"><p class="eyebrow">${esc(candidate.kind === 'decision' ? t('today.top') : t('nav.opportunities'))}</p><h3>${esc(candidate.title)}</h3><p>${esc(candidate.copy)}</p>
      <div class="signal-list"><div><i>+</i><span><strong>${esc(stateLabel(candidate.demand))}</strong><small>${esc(t('label.demand'))}</small></span></div><div><i>◇</i><span><strong>${esc(stateLabel(candidate.competition))}</strong><small>${esc(t('label.competition'))}</small></span></div><div><i>◉</i><span><strong>${esc(stateLabel(candidate.economics))}</strong><small>${esc(t('label.price'))}</small></span></div></div></div>
      <aside class="opportunity-action"><small>${esc(t('today.next'))}</small><strong>${esc(candidate.next || t('state.review'))}</strong><div class="confidence-ring"><i>${esc(candidate.confidence || '—')}</i><span>${esc(t('label.evidence'))}</span></div><span class="authority-badge">${esc(t('state.review'))}</span>${readOnlyButton(t('today.seeWhy'))}</aside>
    </article></section>`;
}
function attentionTiles(m, candidate) {
  const packages = arr(m.command.decision_packages);
  const blocked = packages.filter(value => object(value.owner_attention).attention_state === 'BLOCKED_EXTERNAL').length;
  const decisions = packages.length;
  const rows = [
    ['⌁', `${number(decisions)}`, t('label.decisions'), decisions ? 'risk' : ''],
    ['△', `${number(blocked)}`, t('today.attention'), blocked ? 'risk' : ''],
    ['◉', `${number(arr(m.radar.rows).length)}`, t('label.opportunities'), ''],
    ['✓', stateLabel(candidate?.risk || 'WAITING_FOR_EVIDENCE'), t('today.security'), 'good']
  ];
  return `<section class="attention-row" aria-label="${esc(t('today.attention'))}">${rows.map(([icon, value, label, tone]) => `<article class="attention-tile" data-tone="${tone}"><span class="tile-icon" aria-hidden="true">${icon}</span><div><strong>${esc(value)}</strong><span>${esc(label)}</span></div></article>`).join('')}</section>`;
}
function glance(m) {
  const data = [
    [t('label.opportunities'), arr(m.radar.rows).length, m.radar.status],
    [t('label.decisions'), arr(m.command.decision_packages).length, m.command.status],
    [t('label.marketplaces'), arr(m.operations.channels).length, m.operations.status],
    [t('label.economics'), null, object(m.economics.economics).status || m.economics.status],
    [t('nav.portfolio'), arr(m.portfolio.rows).length, m.portfolio.status],
    [t('label.evidence'), arr(m.learning.rows).length, m.learning.status]
  ];
  return `<section class="section glance"><div class="section-heading"><div><p>${esc(t('page.readOnly'))}</p><h2>${esc(t('today.glance'))}</h2></div>${badge(m.isAvailable ? 'AVAILABLE' : 'WAITING_FOR_EVIDENCE')}</div><div class="metric-grid">${data.map(([label, value, status]) => `<article class="metric"><small>${esc(label)}</small><strong class="${value === null ? 'unknown' : ''}">${value === null ? '—' : number(value)}</strong><span>${esc(stateLabel(status))}</span></article>`).join('')}</div><div class="chart" role="img" aria-label="Read-only evidence trend is unavailable until canonical time series is provided"><span class="chart-label">${esc(t('state.notProven'))}</span><svg viewBox="0 0 700 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0,78 C80,72 100,64 180,69 C250,76 284,48 349,60 C420,71 485,44 550,54 C610,65 655,39 700,49 L700,100 L0,100Z"/><path class="line-gold" d="M0,68 C75,45 130,55 180,43 C248,55 275,35 345,42 C427,28 475,44 543,27 C608,21 648,35 700,24"/></svg></div></section>`;
}
function activities(m) {
  const rows = arr(m.learning.rows).slice(0, 5);
  return `<section class="section"><div class="section-heading"><div><p>${esc(t('page.readOnly'))}</p><h2>${esc(t('today.activity'))}</h2></div></div><div class="activity-layout"><div class="activity-feed">${rows.length ? rows.map(item => `<article class="activity-item"><span class="activity-icon">◎</span><div><h3>${esc(item.outcome_type || 'CANONICAL_EVENT')}</h3><p>${esc(item.learning_status || t('state.unknown'))}</p></div><time>${esc(relativeDate(item.observed_at))}</time></article>`).join('') : noDataCard(t('today.noActivity'), t('page.noData'))}</div><aside class="detail-card"><p class="eyebrow">${esc(t('label.authority'))}</p><h3>NONE</h3><p>${esc(t('today.security'))}</p></aside></div></section>`;
}
function todayView() {
  const m = model();
  const candidate = topCandidate(m);
  shell.dataset.daypart = daypart();
  return `<section class="visual-hero"><div class="hero-content"><div><p class="hero-kicker"><i></i>${esc(t('page.readOnly'))}</p><h1 class="hero-title">${esc(daypartGreeting())}</h1><p class="hero-subtitle">${esc(t('hero.summary'))} <strong>${esc(t('hero.emphasis'))}</strong></p><div class="hero-actions"><button type="button" data-safe-view="opportunities">${esc(t('nav.opportunities'))}</button><button type="button" data-safe-view="attention">${esc(t('today.attention'))}</button><button type="button" data-safe-view="risk">${esc(t('nav.economics'))}</button><button type="button" data-safe-view="summary">${esc(t('today.glance'))}</button></div></div></div><span class="hero-wordmark" aria-hidden="true">DISCOVER<br>ANALYZE<br>DECIDE<br>EXECUTE<br>LEARN<br>A FREER TOMORROW</span>${pulseRail(m)}</section>${topOpportunity(candidate)}${attentionTiles(m,candidate)}${glance(m)}${activities(m)}${technicalDetails(m,candidate)}<footer class="sr-only">${esc(t('footer'))}</footer>`;
}
function technicalDetails(m, candidate) {
  const source = m.isAvailable ? PROJECTION_UI_CONTRACT.source : COMMAND_CENTER_PROJECTION_CONTRACT.fallback;
  return `<details class="technical-details"><summary>${esc(t('today.seeWhy'))} · ${esc(t('label.evidence'))}</summary><dl><div><dt>${esc(t('label.provenance'))}</dt><dd>${esc(candidate?.provenance || source)}</dd></div><div><dt>${esc(t('label.freshness'))}</dt><dd>${esc(candidate?.freshness || stateLabel(m.command.status))}</dd></div><div><dt>${esc(t('label.unknowns'))}</dt><dd>${esc(arr(candidate?.unknowns).join(', ') || t('state.unknown'))}</dd></div><div><dt>${esc(t('label.authority'))}</dt><dd>NONE · ${esc(t('state.review'))}</dd></div><div><dt>Projection</dt><dd>${esc(PHYSICAL_PROJECTION_PATH)}</dd></div><div><dt>Scout</dt><dd>PRESERVE_AS_IS_PROTECTED</dd></div></dl></details>`;
}
function sectionRows(rows, label) {
  if (!rows.length) return noDataCard(t('today.notAvailable'), t('page.noData'));
  return rows.map((row, index) => `<article class="list-row"><div><strong>${esc(row.need_or_search || row.subject_id || row.subject_type || row.channel_id || row.policy_id || row.outcome_id || `${label} ${index + 1}`)}</strong><span>${esc(row.classification || row.status || row.learning_status || row.state || t('state.unknown'))}</span></div>${badge(row.freshness?.status || row.evidence_level || row.status || row.state || 'UNKNOWN')}</article>`).join('');
}
function dataPage(page) {
  const m = model();
  const descriptions = {
    opportunities:'OPPORTUNITY RADAR · AMAZON → EBAY · AMAZON → MERCADO LIBRE · PRODUCT DISCOVERY · MY OPPORTUNITIES',
    supply:'Simple executive sourcing states with evidence, freshness, TAC relationship, and exceptions.',
    economics:'Certified economic truth, KIL8, TAC, stress, and risk — presented without a browser calculator.',
    operations:'Read-only marketplace and sales operations lifecycle. No publication, order, inventory, or price write is enabled.',
    portfolio:'Capital recommendation is distinct from capital authorization and capital spent.',
    learning:'Reviewed outcomes, evidence freshness, and calibration state.',
    settings:'Read-only policies and execution boundaries. Frontend defaults cannot activate commercial authority.'
  };
  const titles = { opportunities:t('nav.opportunities'),supply:t('nav.supply'),economics:t('nav.economics'),operations:t('nav.operations'),portfolio:t('nav.portfolio'),learning:t('nav.learning'),settings:t('nav.settings') };
  const rows = page === 'opportunities' ? arr(m.radar.rows) : page === 'supply' ? arr(m.supply.rows) : page === 'operations' ? arr(m.operations.channels) : page === 'portfolio' ? arr(m.portfolio.rows) : page === 'learning' ? arr(m.learning.rows) : page === 'settings' ? arr(m.settings.profiles) : [];
  const status = page === 'economics' ? object(m.economics.economics).status || m.economics.status : (page === 'opportunities' ? m.radar.status : object({ supply:m.supply,operations:m.operations,portfolio:m.portfolio,learning:m.learning,settings:m.settings })[page].status);
  if (page === 'economics') rows.push({ subject_id:'KIL8 / TAC / stress test', status: status || 'UNKNOWN' });
  return `<section class="page-head"><p class="eyebrow">${esc(t('page.readOnly'))}</p><h1>${esc(titles[page])}</h1><p>${esc(descriptions[page])}</p></section><section class="section"><div class="section-heading"><div><p>${esc(t('label.evidence'))}</p><h2>${esc(stateLabel(status))}</h2></div>${badge(status)}</div><div class="detail-grid">${sectionRows(rows, titles[page])}</div></section>${page === 'operations' ? salesLifecycle() : ''}${lockedActions()}${technicalDetails(m, null)}`;
}
function salesLifecycle() { const stages = ['SALE_RECEIVED','PURCHASE_REQUIRED','PURCHASED','INBOUND_IN_TRANSIT','RECEIVED_AT_HUB','INSPECTED','READY_FOR_OUTBOUND','SHIPPED_TO_CUSTOMER','DELIVERED','RECONCILED']; return `<section class="section"><div class="section-heading"><div><p>${esc(t('nav.operations'))}</p><h2>Sales lifecycle</h2></div></div><div class="detail-grid">${stages.map(stage => `<article class="detail-card"><span class="state-pill" data-state="UNKNOWN">${esc(stage)}</span><p>${esc(t('state.unknown'))}</p></article>`).join('')}</div></section>`; }
function lockedActions() { return `<section class="section"><div class="section-heading"><div><p>${esc(t('label.authority'))}</p><h2>${esc(t('today.security'))}</h2></div></div><div class="locked-actions"><button disabled>BUY · BLOCKED</button><button disabled>PUBLISH · BLOCKED</button><button disabled>REPRICE · BLOCKED</button><button disabled>INVENTORY WRITE · BLOCKED</button></div></section>`; }
function scoutView() { return `<section class="page-head"><p class="eyebrow">SCOUT</p><h1>${esc(t('page.scout'))}</h1><p>${esc(t('page.scoutCopy'))}</p></section><section class="section"><div class="section-heading"><div><p>PROTECTED CONTRACT</p><h2>PRESERVE_AS_IS_PROTECTED</h2></div>${badge('AVAILABLE')}</div><div class="detail-grid"><article class="detail-card"><h3>Existing Scout surface</h3><p>${esc(t('page.scoutCopy'))}</p></article><article class="detail-card"><h3>Chrome extension</h3><p>PROTECTED · no schema, authentication, or route changes in this mission.</p></article><article class="detail-card"><h3>Navigation</h3><p><a href="/">Open Scout</a></p></article></div></section>`; }
function simpleView(page) { const label = page === 'help' ? t('nav.help') : t('nav.account'); return `<section class="page-head"><p class="eyebrow">KABUBY INTELLIGENCE OS</p><h1>${esc(label)}</h1><p>${esc(t('page.noData'))}</p></section>`; }
function render() {
  const page = location.hash.slice(1) || 'today';
  document.querySelectorAll('[data-page]').forEach(link => link.classList.toggle('active', link.dataset.page === page));
  app.setAttribute('aria-busy', projectionStatus === 'loading' ? 'true' : 'false');
  app.innerHTML = page === 'today' ? todayView() : page === 'scout' ? scoutView() : ['opportunities','supply','economics','operations','portfolio','learning','settings'].includes(page) ? dataPage(page) : simpleView(page);
  document.querySelectorAll('[data-read-only]').forEach(button => button.addEventListener('click', () => tell(t('today.security'))));
  document.querySelectorAll('[data-safe-view]').forEach(button => button.addEventListener('click', () => { location.hash = button.dataset.safeView === 'opportunities' ? 'opportunities' : 'today'; tell(t('state.review')); }));
}
function cycleLocale() {
  locale = locale === 'auto' ? 'en' : locale === 'en' ? 'es' : locale === 'es' ? 'pt' : 'auto';
  try { localStorage.setItem('kabuby-intelligence-locale', locale); } catch { /* optional preference */ }
  createNavigation(); updateStaticCopy(); render();
}

document.querySelector('#ask-kabuby').addEventListener('submit', event => { event.preventDefault(); tell('Ask Kabuby is available only through authorized, certified intelligence reads. No response was generated.'); });
localeButton.addEventListener('click', cycleLocale);
document.querySelector('#notification-button').addEventListener('click', () => tell(t('today.security')));
window.addEventListener('hashchange', render);
createNavigation();
updateStaticCopy();
render();
loadProjection().finally(render);
