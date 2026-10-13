import { DAYPARTS, NAVIGATION, PHYSICAL_PROJECTION_PATH } from './data.js';
import { readScoutOwnerSnapshot, SCOUT_COMPATIBILITY } from './scout-owner.js';

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
    'page.readOnly':'Certified read-only projection','page.scout':'Scout','page.scoutCopy':'Open the existing Scout workspace.','page.noData':'No canonical data is available for this surface yet. This is an explicit evidence state, not a zero or positive claim.','footer':'Certified read-only presentation · commercial authority NONE'
  }),
  es: Object.freeze({
    'nav.today':'Hoy','nav.opportunities':'Oportunidades','nav.scout':'Scout','nav.supply':'Suministro','nav.economics':'Economía y riesgo','nav.operations':'Operaciones de marketplace','nav.portfolio':'Portafolio','nav.learning':'Inteligencia y aprendizaje','nav.settings':'Configuración y políticas','nav.help':'Ayuda','nav.account':'Cuenta',
    'ask.label':'Preguntar a Kabuby','ask.placeholder':'Pregúntale a Kabuby…','ask.button':'Preguntar','status.loading':'Cargando inteligencia certificada','status.waiting':'Esperando evidencia certificada','status.available':'Read model certificado disponible','owner.greeting':'Intelligence OS','owner.name':'Vista del propietario',
    'hero.morning':'Buenos días, {name}.','hero.afternoon':'Buenas tardes, {name}.','hero.evening':'Buenas noches, {name}.','hero.night':'Buenas noches, {name}.','hero.summary':'Kabuby presenta evidencia certificada, excepciones y el siguiente paso seguro de investigación.','hero.emphasis':'No hay acciones comerciales habilitadas.',
    'today.top':'Oportunidad principal','today.attention':'Atención del propietario','today.glance':'Tu negocio de un vistazo','today.activity':'Actividad reciente','today.notAvailable':'No disponible','today.waiting':'Esperando proyección autenticada','today.noOpportunity':'No hay una oportunidad canónica lista para presentar','today.noOpportunityCopy':'Kabuby mantendrá los campos UNKNOWN visibles hasta que la evidencia canónica respalde una oportunidad.','today.noActivity':'No hay actividad canónica disponible para este período.','today.why':'Por qué importa','today.next':'Siguiente investigación permitida','today.seeWhy':'Ver por qué','today.security':'Las acciones comerciales continúan bloqueadas',
    'state.unknown':'DESCONOCIDO','state.waiting':'ESPERANDO EVIDENCIA','state.blocked':'BLOQUEADO','state.partial':'PARCIAL','state.stale':'OBSOLETO','state.notProven':'NO DEMOSTRADO','state.available':'DISPONIBLE','state.review':'SOLO REVISIÓN','label.opportunities':'Oportunidades','label.decisions':'Decisiones','label.marketplaces':'Salud de marketplaces','label.economics':'Economía','label.evidence':'Evidencia','label.freshness':'Frescura','label.provenance':'Procedencia','label.risk':'Riesgo principal','label.supply':'Suministro','label.demand':'Demanda','label.competition':'Competencia','label.price':'Vista económica','label.authority':'Autoridad','label.unknowns':'Campos desconocidos',
    'page.readOnly':'Proyección certificada de solo lectura','page.scout':'Scout','page.scoutCopy':'Abre el espacio de trabajo existente de Scout.','page.noData':'Todavía no hay datos canónicos disponibles para esta superficie. Es un estado explícito de evidencia, no un cero ni una afirmación positiva.','footer':'Presentación certificada de solo lectura · autoridad comercial NONE'
  }),
  pt: Object.freeze({
    'nav.today':'Hoje','nav.opportunities':'Oportunidades','nav.scout':'Scout','nav.supply':'Fornecimento','nav.economics':'Economia e risco','nav.operations':'Operações de marketplace','nav.portfolio':'Portfólio','nav.learning':'Inteligência e aprendizado','nav.settings':'Configurações e políticas','nav.help':'Ajuda','nav.account':'Conta',
    'ask.label':'Perguntar ao Kabuby','ask.placeholder':'Pergunte ao Kabuby…','ask.button':'Perguntar','status.loading':'Carregando inteligência certificada','status.waiting':'Aguardando evidência certificada','status.available':'Read model certificado disponível','owner.greeting':'Intelligence OS','owner.name':'Visão do proprietário',
    'hero.morning':'Bom dia, {name}.','hero.afternoon':'Boa tarde, {name}.','hero.evening':'Boa noite, {name}.','hero.night':'Boa noite, {name}.','hero.summary':'Kabuby mostra evidência certificada, exceções e a próxima etapa segura de pesquisa.','hero.emphasis':'Nenhuma ação comercial está habilitada.',
    'today.top':'Oportunidade principal','today.attention':'Atenção do proprietário','today.glance':'Seu negócio em resumo','today.activity':'Atividade recente','today.notAvailable':'Não disponível','today.waiting':'Aguardando projeção autenticada','today.noOpportunity':'Nenhuma oportunidade canônica está pronta para apresentação','today.noOpportunityCopy':'Kabuby manterá campos UNKNOWN visíveis até que a evidência canônica sustente uma oportunidade.','today.noActivity':'Nenhuma atividade canônica está disponível neste período.','today.why':'Por que importa','today.next':'Próxima pesquisa permitida','today.seeWhy':'Ver motivo','today.security':'As ações comerciais continuam bloqueadas',
    'state.unknown':'DESCONHECIDO','state.waiting':'AGUARDANDO EVIDÊNCIA','state.blocked':'BLOQUEADO','state.partial':'PARCIAL','state.stale':'DESATUALIZADO','state.notProven':'NÃO COMPROVADO','state.available':'DISPONÍVEL','state.review':'SOMENTE REVISÃO','label.opportunities':'Oportunidades','label.decisions':'Decisões','label.marketplaces':'Saúde dos marketplaces','label.economics':'Economia','label.evidence':'Evidência','label.freshness':'Atualidade','label.provenance':'Procedência','label.risk':'Risco principal','label.supply':'Fornecimento','label.demand':'Demanda','label.competition':'Concorrência','label.price':'Visão econômica','label.authority':'Autoridade','label.unknowns':'Campos desconhecidos',
    'page.readOnly':'Projeção certificada somente leitura','page.scout':'Scout','page.scoutCopy':'Abra o espaço de trabalho existente do Scout.','page.noData':'Ainda não há dados canônicos disponíveis para esta superfície. Este é um estado explícito de evidência, não zero ou uma alegação positiva.','footer':'Apresentação certificada somente leitura · autoridade comercial NONE'
  })
});

let locale = initialLocale();
let projection = null;
let authState = 'LOADING';
let lastError = null;
let selectedPeriod = '30D';

const AUTH_COPY = Object.freeze({
  AUTHENTICATED: ['available', 'Certified read model available'],
  LOADING: ['waiting', 'Loading certified intelligence'],
  AUTH_REQUIRED: ['waiting', 'Sign in required for Intelligence'],
  SESSION_EXPIRED: ['waiting', 'Intelligence session expired'],
  ACCESS_DENIED: ['blocked', 'Access denied'],
  PROJECTION_UNAVAILABLE: ['blocked', 'Certified projection unavailable'],
  NETWORK_ERROR: ['blocked', 'Connection to certified projection failed']
});

function initialLocale() { try { const saved = localStorage.getItem('kabuby-intelligence-locale'); return ['en','es','pt','auto'].includes(saved) ? saved : 'auto'; } catch { return 'auto'; } }
function activeLocale() { if (locale !== 'auto') return locale; const value = (navigator.language || 'en').toLowerCase(); return value.startsWith('pt') ? 'pt' : value.startsWith('es') ? 'es' : 'en'; }
function t(key, values = {}) { return (COPY[activeLocale()][key] || COPY.en[key] || key).replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? '')); }
function esc(value) { return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char])); }
function arr(value) { return Array.isArray(value) ? value : []; }
function object(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
function state(value, fallback = 'UNKNOWN') { return typeof value === 'string' && value.trim() ? value.trim() : fallback; }
function stateLabel(value) { const raw = state(value); const normalized = raw.toLowerCase().replace(/[^a-z0-9]+/g, ''); const accessStates = { authrequired:'AUTH REQUIRED', sessionexpired:'SESSION EXPIRED', accessdenied:'ACCESS DENIED', projectionunavailable:'PROJECTION UNAVAILABLE', networkerror:'NETWORK ERROR' }; if (accessStates[normalized]) return accessStates[normalized]; if (/unknown|no.*(canonical|reviewed|executive|supply|intelligence)|not.*available/.test(normalized)) return t('state.unknown'); if (/waiting|evidence|required|deferred/.test(normalized)) return t('state.waiting'); if (/block|denied|failed/.test(normalized)) return t('state.blocked'); if (/partial/.test(normalized)) return t('state.partial'); if (/stale/.test(normalized)) return t('state.stale'); if (/available|reviewed|complete|ready/.test(normalized)) return t('state.available'); return raw.replace(/[_-]+/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase()); }
function badge(value) { return `<span class="state-pill" data-state="${esc(state(value))}">${esc(stateLabel(value))}</span>`; }
function number(value) { return Number.isFinite(value) ? new Intl.NumberFormat(activeLocale()).format(value) : '—'; }
function relativeDate(value) { if (!value || !Number.isFinite(Date.parse(value))) return t('today.notAvailable'); try { return new Intl.DateTimeFormat(activeLocale(), { dateStyle:'medium', timeStyle:'short' }).format(new Date(value)); } catch { return value; } }
function daypart() { let hour = new Date().getHours(); try { hour = Number(new Intl.DateTimeFormat(undefined, { hour:'numeric', hourCycle:'h23' }).format(new Date())); } catch {} if (hour >= DAYPARTS.MORNING.start && hour <= DAYPARTS.MORNING.end) return 'morning'; if (hour >= DAYPARTS.AFTERNOON.start && hour <= DAYPARTS.AFTERNOON.end) return 'afternoon'; if (hour >= DAYPARTS.EVENING.start && hour <= DAYPARTS.EVENING.end) return 'evening'; return 'night'; }
function daypartGreeting() { return t(`hero.${daypart()}`, { name:'Luis' }); }
function tell(message) { notice.textContent = message; notice.classList.add('visible'); clearTimeout(tell.timer); tell.timer = setTimeout(() => notice.classList.remove('visible'), 4200); }
function route() { const [page = 'today', query = ''] = location.hash.replace(/^#/, '').split('?'); return { page: page || 'today', params: new URLSearchParams(query) }; }
function go(page, params = {}) { const query = new URLSearchParams(params).toString(); location.hash = `#${page}${query ? `?${query}` : ''}`; }

function createNavigation() {
  nav.innerHTML = NAVIGATION.map(([key, label, icon]) => `<a href="#${key}" data-page="${key}"><span aria-hidden="true">${icon}</span><span>${esc(t(label))}</span></a>`).join('');
}
function updateStaticCopy() {
  document.documentElement.lang = activeLocale();
  document.querySelectorAll('[data-i18n]').forEach(node => { node.textContent = t(node.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(node => { node.placeholder = t(node.dataset.i18nPlaceholder); });
  localeButton.textContent = locale === 'auto' ? 'AUTO' : locale.toUpperCase();
  localeButton.setAttribute('aria-label', `Language: ${locale === 'auto' ? 'AUTO' : locale.toUpperCase()}`);
}
function setAuthState(next, detail = null) {
  authState = next; lastError = detail;
  const [tone, fallback] = AUTH_COPY[next] || AUTH_COPY.PROJECTION_UNAVAILABLE;
  systemStatus.dataset.state = tone;
  systemStatus.querySelector('span').textContent = next === 'AUTHENTICATED' ? t('status.available') : fallback;
  systemStatus.setAttribute('title', detail || fallback);
}
function classifyResponse(response) {
  if (response.status === 401 || response.redirected) return 'AUTH_REQUIRED';
  if (response.status === 419) return 'SESSION_EXPIRED';
  if (response.status === 403) return 'ACCESS_DENIED';
  return 'PROJECTION_UNAVAILABLE';
}
async function loadProjection() {
  setAuthState('LOADING');
  try {
    // GET-only, same-origin Cloudflare Access session only. The browser never
    // receives or stores a token, and never calls an external upstream directly.
    const response = await fetch(PHYSICAL_PROJECTION_PATH, { method:'GET', credentials:'same-origin', headers:{ Accept:'application/json' } });
    if (!response.ok) throw Object.assign(new Error(`PROJECTION_HTTP_${response.status}`), { authState: classifyResponse(response) });
    const payload = await response.json();
    const physical = payload?.data?.physical;
    if (!physical || typeof physical !== 'object' || physical.commercial_authority !== 'NONE' || physical.commercial_actions_enabled !== false) throw Object.assign(new Error('PROJECTION_CONTRACT_DENIED'), { authState:'ACCESS_DENIED' });
    projection = physical;
    setAuthState('AUTHENTICATED');
  } catch (error) {
    projection = null;
    // Cross-origin Access redirects can be hidden by browser CORS. Keep that distinct from evidence.
    const next = error?.authState || (navigator.onLine ? 'AUTH_REQUIRED' : 'NETWORK_ERROR');
    setAuthState(next, error?.message || 'PROJECTION_UNAVAILABLE');
  }
}
function model() {
  const source = object(projection);
  const command = object(source.physical_command_center);
  return { generatedAt:source.generated_at ?? null, command, memory:object(command.canonical_intelligence_memory), radar:object(source.product_opportunity_radar), supply:object(source.supply_intelligence), economics:object(source.economics_and_channel_matrix), operations:object(source.marketplace_operations), portfolio:object(source.portfolio), learning:object(source.outcome_learning), settings:object(source.settings_policies), states:object(source.source_states), isAvailable:authState === 'AUTHENTICATED', authority:source.commercial_authority === 'NONE' ? 'NONE' : 'NONE' };
}
function noDataCard(title = t('today.notAvailable'), detail = t('page.noData')) { return `<div class="empty-state"><span aria-hidden="true">◇</span><div><strong>${esc(title)}</strong><p>${esc(detail)}</p></div></div>`; }
function authDescription() {
  const descriptions = {
    AUTH_REQUIRED:['Sign in to Kabuby Intelligence', 'Your browser must have a Cloudflare Access session for the certified projection. This is not an evidence state.'],
    SESSION_EXPIRED:['Kabuby Intelligence session expired', 'Renew the secure Cloudflare Access session, then refresh this read-only view.'],
    ACCESS_DENIED:['Kabuby Intelligence access denied', 'The signed-in identity lacks access to the certified read-only projection.'],
    PROJECTION_UNAVAILABLE:['Certified projection unavailable', 'The authenticated projection cannot be reached right now. No evidence was inferred.'],
    NETWORK_ERROR:['Connection needs verification', 'The browser could not verify the protected projection. Connect to Kabuby Intelligence or check your network.'],
    LOADING:['Loading certified projection', 'Kabuby is checking the secure read-only projection.'],
    AUTHENTICATED:['Certified projection connected', 'Read-only data is available. Commercial authority remains NONE.']
  };
  return descriptions[authState] || descriptions.PROJECTION_UNAVAILABLE;
}
function authBanner() {
  if (authState === 'AUTHENTICATED') return '';
  const [title, detail] = authDescription();
  const canConnect = ['AUTH_REQUIRED','SESSION_EXPIRED','NETWORK_ERROR'].includes(authState);
  return `<section class="auth-banner" data-auth-state="${esc(authState)}"><div><p>SECURE READ-ONLY ACCESS</p><h2>${esc(title)}</h2><span>${esc(detail)}</span></div><div class="auth-banner-actions">${canConnect ? `<button type="button" class="primary-link" data-action="connect-access">Connect / sign in</button>` : ''}<button type="button" data-action="reload-projection">Retry projection</button></div></section>`;
}
function topCandidate(m) {
  const decision = arr(m.command.decision_packages)[0]; const opportunity = arr(m.radar.rows)[0] || arr(m.command.opportunities?.rows)[0];
  if (decision) return { kind:'decision', title:decision.subject_id || t('today.notAvailable'), category:decision.recommendation_status, copy:decision.primary_reason || t('page.noData'), demand:'UNKNOWN', competition:decision.risk_state, economics:decision.economics_state, recommendation:decision.recommendation, confidence:decision.confidence, next:decision.next_permitted_action, risk:decision.risk_state, provenance:decision.provenance, freshness:decision.freshness, unknowns:arr(decision.critical_unknowns), id:decision.decision_package_id };
  if (opportunity) return { kind:'opportunity', title:opportunity.need_or_search || opportunity.opportunity_id, category:opportunity.classification, copy:`${t('label.evidence')}: ${opportunity.evidence_level}`, demand:opportunity.factual_demand, competition:'UNKNOWN', economics:'UNKNOWN', recommendation:opportunity.classification, confidence:opportunity.evidence_level, next:opportunity.next_research_action, risk:arr(opportunity.contradictions).length ? 'CONTRADICTIONS_PRESENT' : 'UNKNOWN', provenance:opportunity.opportunity_id, freshness:'UNKNOWN', unknowns:arr(opportunity.unknown_fields), id:opportunity.opportunity_id };
  const planes = object(object(m.states.autonomous_runtime).control_planes);
  const physical = object(planes.specialized_amazon);
  if (physical.state === 'QUEUE_CONSUMER_RECEIPT_PENDING') return { kind:'runtime', title:'El ciclo privado anterior no tiene recibo del consumidor', category:'ESTADO OPERATIVO FACTUAL', copy:'La solicitud se encoló, pero no hay un recibo canónico del consumidor para ese ciclo. Kabuby no infiere resultados ni candidatos.', demand:'UNKNOWN', competition:'UNKNOWN', economics:'UNKNOWN', recommendation:'EVIDENCIA DE EJECUCIÓN PENDIENTE', confidence:'0', next:'Esperar el próximo ciclo natural', risk:'UNKNOWN', provenance:'d1:physical_autonomous:aggregate', freshness:physical.observed_at || 'UNKNOWN', unknowns:['resultado del consumidor','candidatos evaluados','demanda factual'], id:'runtime:physical-queue-consumer' };
  const need = object(planes.global_need_first);
  if (need.state === 'NO_NATURAL_CYCLE_RECEIPT' || need.state === 'CYCLE_RECEIPT_PENDING') return { kind:'runtime', title:'Need-First espera su primer ciclo natural', category:'ESTADO OPERATIVO FACTUAL', copy:'No existe un recibo continuo que permita evaluar señales, oportunidades o productos. Los campos de demanda permanecen UNKNOWN.', demand:'UNKNOWN', competition:'UNKNOWN', economics:'UNKNOWN', recommendation:'CICLO NATURAL PENDIENTE', confidence:'0', next:'Esperar el ciclo privado programado', risk:'UNKNOWN', provenance:'d1:need_first:aggregate', freshness:need.observed_at || 'UNKNOWN', unknowns:['señales','oportunidades','demanda factual'], id:'runtime:need-first' };
  const shadow = object(planes.shadow_repricing);
  if (shadow.state === 'NO_NATURAL_RUN_RECEIPT' || shadow.state === 'RUN_RECEIPT_PENDING') return { kind:'runtime', title:'Shadow Repricer espera su primer ciclo natural', category:'ESTADO OPERATIVO FACTUAL', copy:'No existe una ejecución shadow certificada. Kabuby no propone ni escribe precios sin pares factuales elegibles.', demand:'UNKNOWN', competition:'UNKNOWN', economics:'UNKNOWN', recommendation:'CICLO SHADOW PENDIENTE', confidence:'0', next:'Esperar el ciclo privado programado', risk:'UNKNOWN', provenance:'d1:repricer_shadow:aggregate', freshness:shadow.observed_at || 'UNKNOWN', unknowns:['pares elegibles','recomendaciones','precio factual'], id:'runtime:shadow-repricer' };
  return null;
}
function bars(tone = '') { return `<span class="bar-set" aria-hidden="true">${Array.from({length:9}, (_, i) => `<i class="${i < 5 ? `active ${tone}` : ''}"></i>`).join('')}</span>`; }
function pulseRail(m) { const commandState=m.command.status||'NO_CANONICAL_COMMAND_CENTER'; const memoryState=m.memory.status||commandState; const opportunityState=m.radar.status||m.command.opportunities?.status||'UNKNOWN'; const supplyState=m.supply.status||'UNKNOWN'; const statusCopy=m.isAvailable ? stateLabel(memoryState) : authDescription()[0]; const ownerStateSummary=[memoryState,opportunityState,supplyState].map(stateLabel).join('; '); return `<section class="pulse-rail" aria-label="Kabuby Pulse"><div class="pulse-head"><span><i></i>Kabuby Pulse</span><b>${m.isAvailable ? 'LIVE READ' : 'ACCESS'}</b></div><div class="pulse-orb" aria-hidden="true"></div><div class="pulse-status">${esc(statusCopy)}</div><p class="pulse-copy">${esc(m.isAvailable ? t('status.available') : authDescription()[1])}</p><div class="pulse-metrics"><div><span>${esc(t('label.opportunities'))}</span>${bars('')}</div><div><span>${esc(t('label.evidence'))}</span>${bars('good')}</div><div><span>${esc(t('label.supply'))}</span>${bars('')}</div><div><span>${esc(t('label.risk'))}</span>${bars('risk')}</div></div><div class="pulse-quote">${esc(t('hero.summary'))}<small>KABUBY</small></div><div class="sr-only">${esc(ownerStateSummary)}</div></section>`; }
function topOpportunity(candidate) {
  const pendingState = authState === 'AUTHENTICATED' ? t('today.waiting') : authDescription()[0];
  const competitionState = authState === 'AUTHENTICATED' ? t('state.waiting') : pendingState;
  if (!candidate) return `<section class="section top-opportunity-section"><div class="section-heading"><div><p>${esc(t('today.top'))}</p><h2>${esc(authState === 'AUTHENTICATED' ? t('today.notAvailable') : pendingState)}</h2></div>${badge(authState === 'AUTHENTICATED' ? 'WAITING_FOR_EVIDENCE' : authState)}</div><article class="top-opportunity top-opportunity-empty"><div class="opportunity-media opportunity-media-empty" aria-hidden="true"><span>◇</span></div><div class="opportunity-copy"><p class="eyebrow">${esc(t('today.top'))}</p><h3>${esc(t('today.noOpportunity'))}</h3><p>${esc(t('today.noOpportunityCopy'))}</p><div class="signal-list"><div><i>+</i><span><strong>${esc(t('state.unknown'))}</strong><small>${esc(t('label.demand'))}</small></span></div><div><i>◇</i><span><strong>${esc(competitionState)}</strong><small>${esc(t('label.competition'))}</small></span></div><div><i>◉</i><span><strong>${esc(t('state.notProven'))}</strong><small>${esc(t('label.price'))}</small></span></div></div></div><aside class="opportunity-action"><small>${esc(t('today.next'))}</small><strong>${esc(pendingState)}</strong><div class="confidence-ring"><i>—</i><span>${esc(t('label.evidence'))}</span></div><span class="authority-badge">${esc(t('state.review'))}</span><button type="button" data-action="explain-evidence">${esc(t('today.seeWhy'))}</button></aside></article></section>`;
  return `<section class="section"><div class="section-heading"><div><p>${esc(t('today.top'))}</p><h2>${esc(candidate.category)}</h2></div>${badge(candidate.recommendation)}</div><article class="top-opportunity"><div class="opportunity-media" aria-hidden="true"><span>Ｋ</span></div><div class="opportunity-copy"><p class="eyebrow">${esc(candidate.kind === 'decision' ? t('today.top') : t('nav.opportunities'))}</p><h3>${esc(candidate.title)}</h3><p>${esc(candidate.copy)}</p><div class="signal-list"><div><i>+</i><span><strong>${esc(stateLabel(candidate.demand))}</strong><small>${esc(t('label.demand'))}</small></span></div><div><i>◇</i><span><strong>${esc(stateLabel(candidate.competition))}</strong><small>${esc(t('label.competition'))}</small></span></div><div><i>◉</i><span><strong>${esc(stateLabel(candidate.economics))}</strong><small>${esc(t('label.price'))}</small></span></div></div></div><aside class="opportunity-action"><small>${esc(t('today.next'))}</small><strong>${esc(candidate.next || t('state.review'))}</strong><div class="confidence-ring"><i>${esc(candidate.confidence || '—')}</i><span>${esc(t('label.evidence'))}</span></div><span class="authority-badge">${esc(t('state.review'))}</span><button type="button" data-action="explain-evidence">${esc(t('today.seeWhy'))}</button></aside></article></section>`;
}
function attentionTiles(m, candidate) { const packages=arr(m.command.decision_packages); const attention=arr(m.memory.owner_attention); const securityState = m.isAvailable ? candidate?.risk || m.memory.status || 'WAITING_FOR_EVIDENCE' : authState; const rows=[['⌁',number(packages.length),t('label.decisions'),'attention'],['△',number(attention.length),t('today.attention'),'attention'],['◉',number(arr(m.radar.rows).length),t('label.opportunities'),'opportunities'],['✓',stateLabel(securityState),t('today.security'),'explain-evidence']]; return `<section class="attention-row" aria-label="${esc(t('today.attention'))}">${rows.map(([icon,value,label,action]) => action === 'explain-evidence' || attention.length || packages.length ? `<button class="attention-tile" type="button" data-action="${action}"><span class="tile-icon" aria-hidden="true">${icon}</span><span><strong>${esc(value)}</strong><small>${esc(label)}</small></span></button>` : `<article class="attention-tile" aria-label="${esc(`${label}: ${value}`)}"><span class="tile-icon" aria-hidden="true">${icon}</span><span><strong>${esc(value)}</strong><small>${esc(label)}</small></span></article>`).join('')}</section>`; }
function glance(m) { const data=[[t('label.opportunities'),arr(m.radar.rows).length,m.radar.status],[t('label.decisions'),arr(m.command.decision_packages).length,m.command.status],[t('label.marketplaces'),arr(m.operations.rows).length,m.operations.status],[t('label.economics'),null,object(m.economics.economics).status||m.economics.status],[t('nav.portfolio'),arr(m.portfolio.rows).length,m.portfolio.status],[t('label.evidence'),Number(object(m.memory.coverage).records)||0,m.memory.status||m.learning.status]]; return `<section class="section glance"><div class="section-heading"><div><p>${esc(t('page.readOnly'))}</p><h2>${esc(t('today.glance'))}</h2></div><div class="period-control" role="group" aria-label="Read-only time range">${['7D','30D','90D','1Y'].map(period => `<button type="button" class="${selectedPeriod===period?'active':''}" data-period="${period}" aria-pressed="${selectedPeriod===period}">${period}</button>`).join('')}</div></div><div class="metric-grid">${data.map(([label,value,status]) => `<article class="metric"><small>${esc(label)}</small><strong class="${value===null?'unknown':''}">${value===null?'—':number(value)}</strong><span>${esc(stateLabel(status))}</span></article>`).join('')}</div><div class="chart chart-empty" role="img" aria-label="Read-only evidence trend has no canonical series"><span class="chart-label">${esc(selectedPeriod)}</span><div><b>${esc(t('state.notProven'))}</b><small>${esc(t('page.noData'))}</small></div></div></section>`; }
function activities(m) { const rows=arr(m.memory.recent_activity).slice(0,5); const emptyTitle=m.isAvailable ? t('today.noActivity') : authDescription()[0]; const emptyDetail=m.isAvailable ? t('page.noData') : authDescription()[1]; const activityState=m.isAvailable ? stateLabel(m.memory.status||'WAITING_FOR_EVIDENCE') : authDescription()[0]; return `<section class="recent-activity"><div class="section-heading"><div><p>${esc(t('page.readOnly'))}</p><h2>${esc(t('today.activity'))}</h2></div><a href="#learning?view=changes">View all</a></div><div class="activity-feed">${rows.length ? rows.map(item => `<article class="activity-item"><span class="activity-icon">◎</span><div><h3>${esc(item.change_type||'CANONICAL_EVENT')}</h3><p>${esc(item.current_lifecycle_status||t('state.unknown'))}</p></div><time>${esc(relativeDate(item.occurred_at))}</time></article>`).join('') : noDataCard(emptyTitle,emptyDetail)}</div><a class="learning-card" href="#learning?view=changes"><span aria-hidden="true">◉</span><div><b>${esc(activityState)}</b><p>${esc(t('today.security'))}</p></div></a></section>`; }
function technicalDetails(m, candidate) { return `<details class="technical-details"><summary>${esc(t('today.seeWhy'))} · ${esc(t('label.evidence'))}</summary><dl><div><dt>${esc(t('label.provenance'))}</dt><dd>${esc(candidate?.provenance||t('today.notAvailable'))}</dd></div><div><dt>${esc(t('label.freshness'))}</dt><dd>${esc(candidate?.freshness||t('today.notAvailable'))}</dd></div><div><dt>${esc(t('label.unknowns'))}</dt><dd>${esc(arr(candidate?.unknowns).join(', ')||t('state.unknown'))}</dd></div><div><dt>${esc(t('label.authority'))}</dt><dd>NONE · ${esc(t('state.review'))}</dd></div></dl></details>`; }
function todayView() { const m=model(); const candidate=topCandidate(m); shell.dataset.daypart=daypart(); return `${authBanner()}<div class="dashboard-grid"><div class="center-workspace"><section class="visual-hero"><div class="hero-content"><div><p class="hero-kicker"><i></i>${esc(t('page.readOnly'))}</p><h1 class="hero-title">${esc(daypartGreeting())}</h1><p class="hero-subtitle">${esc(t('hero.summary'))} <strong>${esc(t('hero.emphasis'))}</strong></p><div class="hero-actions"><button type="button" data-route="opportunities">${esc(t('nav.opportunities'))}</button><button type="button" data-action="attention">${esc(t('today.attention'))}</button><button type="button" data-route="economics">${esc(t('nav.economics'))}</button><button type="button" data-action="summary">${esc(t('today.glance'))}</button></div></div></div><span class="hero-wordmark" aria-hidden="true">DISCOVER<br>ANALYZE<br>DECIDE<br>EXECUTE<br>LEARN<br>A FREER TOMORROW</span></section>${topOpportunity(candidate)}${attentionTiles(m,candidate)}${glance(m)}${technicalDetails(m,candidate)}</div><aside class="right-intelligence-rail">${pulseRail(m)}${activities(m)}</aside></div>`; }
function sectionRows(rows, label) { return rows.length ? rows.map((row,index) => `<article class="list-row"><div><strong>${esc(row.need_or_search||row.subject_id||row.subject_type||row.channel_id||row.policy_id||row.outcome_id||`${label} ${index+1}`)}</strong><span>${esc(stateLabel(row.classification||row.status||row.learning_status||row.state||t('state.unknown')))}</span></div>${badge(row.freshness?.status||row.evidence_level||row.status||row.state||'UNKNOWN')}</article>`).join('') : noDataCard(t('today.notAvailable'),t('page.noData')); }
function amazonEbayDossiers(m) {
  const engine = object(object(m.states.discovery_engines).engine_b);
  const candidates = arr(engine.amazon_ebay_candidates);
  if (!candidates.length) return noDataCard('No structured Amazon→eBay candidates are available.', 'The read model preserves this as a factual empty state.');
  return `<section class="section"><div class="section-heading"><div><p>AMAZON → EBAY · READ-ONLY</p><h2>Owner-visible economics dossiers</h2></div>${badge(engine.state || 'UNKNOWN')}</div><div class="detail-grid">${candidates.map(candidate => {
    const activePrice = object(candidate.ebay_active_listing_price_evidence);
    const activeRange = Number.isFinite(activePrice.low) && Number.isFinite(activePrice.high) ? `${activePrice.currency || 'UNKNOWN'} ${activePrice.low}–${activePrice.high} · ${activePrice.semantics || 'UNKNOWN'}` : 'UNKNOWN';
    const knownCosts = Object.entries(object(candidate.known_costs)).map(([key, value]) => `${key}: ${value?.currency || 'UNKNOWN'} ${value?.amount ?? 'UNKNOWN'} · ${value?.semantics || 'UNKNOWN'}`);
    return `<article class="detail-card"><p class="eyebrow">FACTUAL READ-ONLY · ${esc(candidate.asin || 'ASIN UNKNOWN')}</p><h3>${esc(candidate.title || candidate.asin)}</h3><p>${esc(candidate.brand || 'Brand UNKNOWN')} · ${esc(candidate.category || 'Category UNKNOWN')}</p><dl><div><dt>Exact identity</dt><dd>${esc(candidate.identity || 'UNKNOWN')}${candidate.gtin ? ` · ${esc(candidate.gtin)}` : ''}</dd></div><div><dt>Amazon observed price</dt><dd>${candidate.amazon_price === null ? 'UNKNOWN' : esc(`${candidate.currency || 'UNKNOWN'} ${candidate.amazon_price}`)}</dd></div><div><dt>Amazon availability / evidence</dt><dd>${esc(candidate.amazon_availability || 'UNKNOWN')} · ${esc(candidate.amazon_demand || 'UNKNOWN')}</dd></div><div><dt>eBay market / competition</dt><dd>${esc(candidate.ebay_market || 'UNKNOWN')} · ${esc(candidate.ebay_competition || 'UNKNOWN')}</dd></div><div><dt>eBay active price evidence</dt><dd>${esc(activeRange)}</dd></div><div><dt>eBay demand / white space</dt><dd>${esc(candidate.ebay_demand || 'UNKNOWN')} · ${esc(candidate.white_space || 'UNKNOWN')}</dd></div><div><dt>Known costs</dt><dd>${esc(knownCosts.join('; ') || 'UNKNOWN')}</dd></div><div><dt>Packaging policy</dt><dd>${candidate.packaging_cost?.amount === 0.75 ? `USD ${candidate.packaging_cost.amount} · ${candidate.packaging_cost.provenance || 'OWNER_CERTIFIED_OPERATIONAL_POLICY'}` : 'UNKNOWN'}</dd></div><div><dt>Outbound shipping</dt><dd>${esc(candidate.outbound_shipping || 'UNKNOWN')}</dd></div><div><dt>Promotion scenarios</dt><dd>${esc(arr(candidate.promotion_scenarios).map(scenario => `${scenario.id || 'UNKNOWN'} ${Number.isInteger(scenario.advertising_rate_bps) ? `${scenario.advertising_rate_bps / 100}%` : 'UNKNOWN'} · ANALYSIS ONLY`).join('; ') || 'UNKNOWN')}</dd></div><div><dt>Break-even price</dt><dd>${esc(candidate.break_even_price || 'UNKNOWN')}</dd></div><div><dt>Net profit / margin / ROI / TAC</dt><dd>${esc([candidate.net_profit, candidate.margin, candidate.roi, candidate.tac].join(' · '))}</dd></div><div><dt>Material unknowns</dt><dd>${esc(arr(candidate.unknown_costs).join(', ') || 'UNKNOWN')}</dd></div><div><dt>Risk / decision</dt><dd>${esc(candidate.risk || 'UNKNOWN')} · ${esc(candidate.decision || candidate.economics || 'UNKNOWN')}</dd></div></dl><span class="authority-badge">RESEARCH ONLY · COMMERCIAL ACTIONS BLOCKED</span></article>`;
  }).join('')}</div></section>`;
}
const SECONDARY_SURFACES = Object.freeze({
  opportunities: Object.freeze([
    ['radar','Opportunity Radar','Need-first opportunities with factual evidence, uncertainty, risk, and the next permitted research step.', m => arr(m.radar.rows), m => m.radar.status],
    ['amazon-ebay','Amazon → eBay','A specialized, identity-first marketplace path. Results stay empty until exact identity and certified evidence exist.', m => arr(m.radar.amazon_ebay_rows), m => m.radar.amazon_ebay_status],
    ['amazon-meli','Amazon → Mercado Libre','A specialized Colombia marketplace path. Site, currency, identity, evidence, and risk remain explicit.', m => arr(m.radar.amazon_meli_rows), m => m.radar.amazon_meli_status],
    ['product-discovery','Product Discovery','Research requests are separate from opportunities and do not select a product automatically.', m => arr(m.command.product_discovery_requests), m => m.command.product_discovery_status],
    ['my-opportunities','My Opportunities','Owner workspace for canonical opportunity states. Nothing is hidden when evidence is insufficient.', m => arr(m.memory.opportunities), m => m.memory.status]
  ]),
  supply: Object.freeze([
    ['sources','Sources & suppliers','Certified sources and suppliers only. Missing supplier evidence remains unknown.', m => arr(m.supply.rows), m => m.supply.status],
    ['availability','Availability','Observed availability is distinct from exact stock.', m => arr(m.supply.availability_rows), m => m.supply.availability_status],
    ['cost','Source cost','Source cost, currency, and unknown material costs remain separate from landed cost.', m => arr(m.supply.cost_rows), m => m.supply.cost_status],
    ['freshness','Freshness','Evidence freshness and provenance are shown without inventing refreshes.', m => arr(m.supply.freshness_rows), m => m.supply.freshness_status],
    ['monitor','Supplier monitor','Read-only supplier monitoring and exceptions.', m => arr(m.supply.monitor_rows), m => m.supply.monitor_status],
    ['exceptions','Exceptions','Only certified sourcing exceptions appear here.', m => arr(m.supply.exception_rows), m => m.supply.exception_status]
  ]),
  economics: Object.freeze([
    ['truth','Economic truth','Certified economic evidence only; the browser does not calculate economics.', m => arr(m.economics.rows), m => object(m.economics.economics).status || m.economics.status],
    ['kil8','KIL8','Economic truth remains evidence-bound and fail-closed.', m => arr(m.economics.kil8_rows), m => m.economics.kil8_status],
    ['tac','Target acquisition cost','TAC is distinct from supplier price and remains unknown without material economics.', m => arr(m.economics.tac_rows), m => m.economics.tac_status],
    ['cost-protection','Cost protection','Cost protections and material unknowns remain visible.', m => arr(m.economics.cost_protection_rows), m => m.economics.cost_protection_status],
    ['stress','Stress tests','Stress results appear only when certified.', m => arr(m.economics.stress_rows), m => m.economics.stress_status],
    ['risk','Risk','Economic and capital risk stays separate from authorization.', m => arr(m.economics.risk_rows), m => m.economics.risk_status]
  ]),
  operations: Object.freeze([
    ['sales','Sales Operations','Read-only lifecycle visibility from a factual sale through reconciliation.', m => arr(m.operations.sales_rows), m => m.operations.sales_status],
    ['publication','Publication Center','Candidates, review state, readiness, and blockers. Publication remains disabled.', m => arr(m.operations.publication_rows), m => m.operations.publication_status],
    ['shadow-repricer','Shadow Repricer','Recommendations are advisory, never authorized or executed price changes.', m => arr(m.operations.shadow_reprice_rows), m => m.operations.shadow_reprice_status],
    ['fulfillment','Fulfillment','Source to owner hub, inspection, outbound delivery, and reconciliation are read-only.', m => arr(m.operations.fulfillment_rows), m => m.operations.fulfillment_status],
    ['exceptions','Marketplace health & exceptions','Marketplace state and exceptions by certified channel.', m => arr(m.operations.rows), m => m.operations.status]
  ]),
  portfolio: Object.freeze([
    ['capital','Capital allocation','Recommended capital is distinct from authorized or spent capital.', m => arr(m.portfolio.rows), m => m.portfolio.status]
  ]),
  learning: Object.freeze([
    ['outcomes','Outcome learning','Certified outcomes and evidence freshness.', m => arr(m.learning.rows), m => m.learning.status],
    ['counterfactuals','Counterfactual learning','Counterfactual learning appears only when certified.', m => arr(m.learning.counterfactual_rows), m => m.learning.counterfactual_status],
    ['calibration','Calibration','Calibration is visible only from the certified read model.', m => arr(m.learning.calibration_rows), m => m.learning.calibration_status],
    ['changes','What changed','Change summaries require canonical evidence.', m => arr(m.learning.change_rows), m => m.learning.change_status]
  ]),
  settings: Object.freeze([
    ['profile','Business profile','Read-only owner business profile.', m => arr(m.settings.profiles), m => m.settings.status],
    ['marketplaces','Marketplace policies','Read-only marketplace policies never enable execution.', m => arr(m.settings.policy_artifacts), m => m.settings.status],
    ['pricing','Pricing policy','Pricing policy is informational; no price write is enabled.', m => arr(m.settings.policy_artifacts), m => m.settings.status],
    ['inventory','Inventory policy','Inventory policy is informational; no inventory write is enabled.', m => arr(m.settings.policy_artifacts), m => m.settings.status],
    ['authority','Commercial authority','Current commercial authority and safety boundaries.', m => arr(m.settings.profiles), m => m.settings.status],
    ['language','Language & timezone','Language and timezone preferences remain separate from marketplace context.', () => [], () => 'AVAILABLE']
  ])
});
function surfaceFor(page, requested) { const entries=SECONDARY_SURFACES[page] || []; return entries.find(([id]) => id === requested) || entries[0] || null; }
function surfaceTabs(page, requested) { const entries=SECONDARY_SURFACES[page] || []; return entries.length ? `<nav class="surface-tabs" aria-label="${esc(page)} sections">${entries.map(([id,label]) => `<a href="#${page}?view=${id}"${id === requested ? ' aria-current="page"' : ''}>${esc(label)}</a>`).join('')}</nav>` : ''; }
function dataPage(page) { const m=model(); const {params}=route(); const surface=surfaceFor(page,params.get('view')); const titles={opportunities:t('nav.opportunities'),supply:t('nav.supply'),economics:t('nav.economics'),operations:t('nav.operations'),portfolio:t('nav.portfolio'),learning:t('nav.learning'),settings:t('nav.settings')}; const [id,label,description,rowSource,statusSource] = surface || ['overview',titles[page],t('page.noData'),() => [],() => 'UNKNOWN']; const rows=rowSource(m); const status=statusSource(m)||'UNKNOWN'; const lifecycle=page==='operations' && id==='sales' ? salesLifecycle() : ''; const dossiers=page==='opportunities' && id==='amazon-ebay' ? amazonEbayDossiers(m) : ''; return `${authBanner()}<section class="page-head"><p class="eyebrow">${esc(titles[page])}</p><h1>${esc(label)}</h1><p>${esc(description)}</p>${surfaceTabs(page,id)}</section><section class="section"><div class="section-heading"><div><p>${esc(label)}</p><h2>${esc(stateLabel(status))}</h2></div>${badge(status)}</div><div class="detail-grid">${sectionRows(rows,label)}</div></section>${dossiers}${lifecycle}${lockedActions()}${technicalDetails(m,null)}`; }
function salesLifecycle() { const stages=['SALE_RECEIVED','PURCHASE_REQUIRED','PURCHASED','INBOUND_IN_TRANSIT','RECEIVED_AT_HUB','INSPECTED','READY_FOR_OUTBOUND','SHIPPED_TO_CUSTOMER','DELIVERED','RECONCILED']; return `<section class="section"><div class="section-heading"><div><p>${esc(t('nav.operations'))}</p><h2>Sales lifecycle</h2></div></div><div class="detail-grid">${stages.map(stage => `<article class="detail-card"><span class="state-pill" data-state="UNKNOWN">${esc(stage)}</span><p>${esc(t('state.unknown'))}</p></article>`).join('')}</div></section>`; }
function lockedActions() { return `<section class="section"><div class="section-heading"><div><p>${esc(t('label.authority'))}</p><h2>${esc(t('today.security'))}</h2></div></div><div class="locked-actions"><button disabled title="Commercial authority is NONE">BUY · BLOCKED</button><button disabled title="Commercial authority is NONE">PUBLISH · BLOCKED</button><button disabled title="Commercial authority is NONE">REPRICE · BLOCKED</button><button disabled title="Commercial authority is NONE">INVENTORY WRITE · BLOCKED</button></div></section>`; }
const SCOUT_VIEWS = Object.freeze([
  ['dashboard', 'Dashboard'], ['pendientes', 'Pendientes'], ['despachos', 'Despachos'], ['inventario', 'Inventario'], ['categorias', 'Categorías'], ['configuracion', 'Configuración']
]);
function scoutRows(rows, empty, row) {
  return rows.length ? `<div class="detail-grid">${rows.map(row).join('')}</div>` : noDataCard('No hay registros locales disponibles', empty);
}
function scoutView() {
  const { params } = route();
  const requested = params.get('view') || 'dashboard';
  const view = SCOUT_VIEWS.some(([id]) => id === requested) ? requested : 'dashboard';
  const snapshot = authState === 'AUTHENTICATED' ? readScoutOwnerSnapshot() : null;
  const tabs = `<nav class="surface-tabs" aria-label="Scout views">${SCOUT_VIEWS.map(([id, label]) => `<a href="#scout?view=${id}"${id === view ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>`;
  const auth = authBanner();
  const unavailable = `<section class="section"><div class="section-heading"><div><p>SCOUT</p><h2>Acceso autenticado requerido</h2></div>${badge(authState)}</div>${noDataCard('Scout protege sus registros locales', 'Inicia la sesión de Cloudflare Access de Kabuby para ver el estado de Scout sin usar una segunda contraseña.')}</section>`;
  if (!snapshot) return `${auth}<section class="page-head"><p class="eyebrow">SCOUT · INTEGRADO</p><h1>Scout dentro de Kabuby Intelligence OS</h1><p>La navegación y la sesión del propietario son las del portal canónico. El runtime de compatibilidad de la extensión permanece aislado.</p>${tabs}</section>${unavailable}`;
  const productCard = item => `<article class="detail-card scout-record"><span>${esc(item.status)}</span><h3>${esc(item.title || item.asin || item.id)}</h3><p>ASIN: ${esc(item.asin || 'UNKNOWN')} · ${esc(item.category || 'UNKNOWN')}</p></article>`;
  const dispatchCard = item => `<article class="detail-card scout-record"><span>${esc(item.status)}</span><h3>${esc(item.id || 'Despacho')}</h3><p>Canal: ${esc(item.channel || 'UNKNOWN')}</p></article>`;
  const dashboard = `<section class="section scout-summary"><div class="section-heading"><div><p>SCOUT · PANEL INTEGRADO</p><h2>Estado local compatible</h2></div>${badge(snapshot.state)}</div><div class="metric-grid"><article class="metric"><small>Pendientes</small><strong>${number(snapshot.counts.pending)}</strong><span>intake existente</span></article><article class="metric"><small>Inventario</small><strong>${number(snapshot.counts.inventory)}</strong><span>sin escritura habilitada</span></article><article class="metric"><small>Despachos</small><strong>${number(snapshot.counts.dispatches)}</strong><span>solo lectura</span></article><article class="metric"><small>Categorías</small><strong>${number(snapshot.categories.length)}</strong><span>derivadas de intake</span></article></div></section>`;
  const content = view === 'dashboard' ? `${dashboard}${scoutRows(snapshot.products.slice(0, 6), 'Los productos recibidos por el intake existente aparecerán aquí.', productCard)}`
    : view === 'pendientes' ? scoutRows(snapshot.products.filter(item => item.status.toLowerCase() === 'pending'), 'No hay productos pendientes en el store existente.', productCard)
    : view === 'despachos' ? scoutRows(snapshot.dispatches, 'No hay despachos locales disponibles.', dispatchCard)
    : view === 'inventario' ? scoutRows(snapshot.products.filter(item => !['pending', 'rejected'].includes(item.status.toLowerCase())), 'No hay inventario local disponible.', productCard)
    : view === 'categorias' ? scoutRows(snapshot.categories.map(category => ({ category })), 'No hay categorías derivadas del intake local.', item => `<article class="detail-card scout-record"><span>CATEGORÍA</span><h3>${esc(item.category)}</h3><p>Derivada de productos existentes; no se infiere demanda.</p></article>`)
    : `<section class="section"><div class="section-heading"><div><p>SCOUT</p><h2>Configuración</h2></div>${badge(snapshot.configuration.available ? 'AVAILABLE' : 'UNKNOWN')}</div>${noDataCard('Configuración protegida', snapshot.configuration.available ? 'Existe configuración local. Sus valores, tokens y credenciales no se muestran en Kabuby Intelligence OS.' : 'No hay configuración local disponible para presentar.')}</section>`;
  return `${auth}<section class="page-head"><p class="eyebrow">SCOUT · INTEGRADO</p><h1>Scout dentro de Kabuby Intelligence OS</h1><p>Dashboard, intake, inventario y despachos usan únicamente el store existente en modo lectura. Las acciones comerciales permanecen bloqueadas.</p>${tabs}</section>${content}<section class="section scout-compatibility"><div class="section-heading"><div><p>COMPATIBILIDAD</p><h2>Runtime y extensión preservados</h2></div>${badge('AVAILABLE')}</div><div class="detail-grid"><article class="detail-card"><h3>Chrome Extension</h3><p>Los contratos ${esc(SCOUT_COMPATIBILITY.contracts.join(', '))} continúan en la ruta de compatibilidad sin cambios de schema.</p></article><article class="detail-card"><h3>Product intake</h3><p>Los productos recibidos se conservan en el store existente y aparecen aquí cuando la sesión canónica está autenticada.</p></article><article class="detail-card"><h3>Autoridad comercial</h3><p>Compra, publicación, precios, inventario y fulfillment no se habilitan desde Scout integrado.</p></article></div></section>${lockedActions()}`;
}
function capabilityStatus(m, value) { return state(value || (m.isAvailable ? 'WAITING_FOR_EVIDENCE' : authState)); }
function capabilityInventory(m) {
  const rows = [
    ['Opportunity Radar', 'Prioritized evidence-backed opportunities and their explicit unknowns.', 'Opportunities', m.radar.status],
    ['Amazon → eBay', 'Specialized identity-first marketplace research path.', 'Opportunities', m.radar.amazon_ebay_status],
    ['Amazon → Mercado Libre', 'Specialized Colombia marketplace research path.', 'Opportunities', m.radar.amazon_meli_status],
    ['Product Discovery', 'Research requests derived from certified opportunities.', 'Opportunities', m.command.product_discovery_status],
    ['My Opportunities', 'Owner-facing canonical opportunity states.', 'Opportunities', m.memory.status],
    ['Supply Intelligence', 'Read-only source, availability, cost, freshness, and exceptions evidence.', 'Supply', m.supply.status],
    ['Supplier Monitor', 'Read-only supplier monitoring and certified exceptions.', 'Supply', m.supply.monitor_status],
    ['Economic Truth', 'Evidence-bound economics with material unknowns preserved.', 'Economics & Risk', object(m.economics.economics).status || m.economics.status],
    ['KIL8', 'Certified economic-truth evaluation.', 'Economics & Risk', m.economics.kil8_status],
    ['Target Acquisition Cost', 'TAC separated from supplier price and incomplete material costs.', 'Economics & Risk', m.economics.tac_status],
    ['Cost Protection', 'Cost protections and uncertainty boundaries.', 'Economics & Risk', m.economics.cost_protection_status],
    ['Stress Tests', 'Certified stress evidence when available.', 'Economics & Risk', m.economics.stress_status],
    ['Sales Operations', 'Read-only sale lifecycle visibility.', 'Marketplace Operations', m.operations.sales_status],
    ['Publication Center', 'Candidate and review visibility; publication stays disabled.', 'Marketplace Operations', m.operations.publication_status],
    ['Shadow Repricer', 'Advisory shadow pricing only; no price update is authorized.', 'Marketplace Operations', m.operations.shadow_reprice_status],
    ['Fulfillment', 'Read-only source-to-owner-hub lifecycle visibility.', 'Marketplace Operations', m.operations.fulfillment_status],
    ['Marketplace Health', 'Certified marketplace state and exceptions.', 'Marketplace Operations', m.operations.status],
    ['Portfolio Brain', 'Capital and opportunity allocation evidence.', 'Portfolio', m.portfolio.status],
    ['Outcome Learning', 'Certified outcome and evidence-freshness learning.', 'Intelligence & Learning', m.learning.status],
    ['Counterfactual Learning', 'Certified counterfactual evaluation when evidence exists.', 'Intelligence & Learning', m.learning.counterfactual_status],
    ['Calibration', 'Read-only calibration evidence.', 'Intelligence & Learning', m.learning.calibration_status],
    ['Decision Memory', 'Canonical decision packages and owner attention.', 'Intelligence & Learning', m.command.status],
    ['Evidence & Freshness', 'Provenance and freshness attached to canonical evidence.', 'Intelligence & Learning', m.memory.status]
  ];
  return `<section class="section capability-inventory"><div class="section-heading"><div><p>READ-ONLY PRODUCT INVENTORY</p><h2>Kabuby Capabilities</h2></div><span>${rows.length} capabilities</span></div><p class="inventory-intro">Each capability states its factual read-model condition. Absence of evidence is never presented as a completed result.</p><div class="capability-grid">${rows.map(([name, description, area, rawStatus]) => { const current = capabilityStatus(m, rawStatus); const observed = m.generatedAt ? relativeDate(m.generatedAt) : t('today.notAvailable'); return `<article class="capability-card"><p>${esc(area)}</p><h3>${esc(name)}</h3><span>${esc(description)}</span>${badge(current)}<dl><div><dt>Last execution</dt><dd>${esc(observed)}</dd></div><div><dt>Next execution</dt><dd>${esc(current === 'AVAILABLE' ? 'Read-only refresh when canonical evidence changes' : stateLabel(current))}</dd></div><div><dt>Data / evidence</dt><dd>${esc(stateLabel(current))}</dd></div><div><dt>Current blocker</dt><dd>${esc(current === 'AVAILABLE' ? 'No certified blocker recorded' : stateLabel(current))}</dd></div></dl></article>`; }).join('')}</div></section>`;
}
function simpleView(page) { if(page==='account') return `${authBanner()}<section class="page-head"><p class="eyebrow">KABUBY INTELLIGENCE OS</p><h1>${esc(t('nav.account'))}</h1><p>Session management stays with Cloudflare Access. Kabuby does not collect credentials.</p><p><button type="button" class="primary-link" data-action="connect-access">Connect / sign in to Kabuby Intelligence</button></p></section>`; if(page==='help') { const m=model(); return `${authBanner()}<section class="page-head"><p class="eyebrow">KABUBY INTELLIGENCE OS</p><h1>${esc(t('nav.help'))}</h1><p>Today is a certified read-only presentation. Unknown, blocked, stale, and unavailable states are never positive business claims.</p><p><a href="/privacy.html">Privacy</a> · <a href="/terms.html">Terms</a> · <a href="#settings">Settings & Policies</a></p></section>${capabilityInventory(m)}`; } return `<section class="page-head"><h1>${esc(t('today.notAvailable'))}</h1><p>${esc(t('page.noData'))}</p></section>`; }
function searchView(query) { const m=model(); const normalized=query.trim().toLowerCase(); const rows=[...arr(m.radar.rows),...arr(m.command.decision_packages),...arr(m.supply.rows),...arr(m.learning.rows)]; const matches=normalized ? rows.filter(row => JSON.stringify(row).toLowerCase().includes(normalized)) : []; return `<section class="page-head"><p class="eyebrow">READ-ONLY SEARCH</p><h1>Ask Kabuby</h1><p>${normalized ? `Results from existing certified read models for “${esc(query)}”.` : 'Enter a question to search the certified read models. Kabuby does not generate an ungrounded answer.'}</p></section><section class="section"><div class="section-heading"><div><p>Certified read-only data</p><h2>${esc(normalized ? `${matches.length} matching records` : 'Search ready')}</h2></div></div><div class="detail-grid">${normalized ? sectionRows(matches,'Result') : noDataCard('Ask Kabuby is search, not a fake assistant','Use a factual term present in certified projection data.')}</div></section>`; }
function notificationView() { const m=model(); const rows=[...arr(m.command.decision_packages),...arr(m.memory.owner_attention)]; return `<section class="page-head"><p class="eyebrow">OWNER ATTENTION</p><h1>${esc(t('today.attention'))}</h1><p>Only certified decision packages and canonical evidence exceptions appear here. Empty means no canonical owner-attention item is available.</p></section><section class="section"><div class="section-heading"><div><p>CANONICAL OWNER ATTENTION</p><h2>${esc(stateLabel(m.memory.status||m.command.status))}</h2></div></div><div class="detail-grid">${sectionRows(rows,'Attention')}</div></section>`; }
function render() { const {page,params}=route(); document.querySelectorAll('[data-page]').forEach(link => link.classList.toggle('active',link.dataset.page===page)); app.setAttribute('aria-busy',authState==='LOADING'?'true':'false'); app.innerHTML = page==='today'?todayView():page==='scout'?scoutView():page==='search'?searchView(params.get('q')||''):page==='attention'?notificationView():['opportunities','supply','economics','operations','portfolio','learning','settings'].includes(page)?dataPage(page):simpleView(page); wireRenderedControls(); }
function focusSummary() { document.querySelector('.glance')?.scrollIntoView({behavior:'smooth',block:'start'}); }
function wireRenderedControls() {
  app.querySelectorAll('[data-route]').forEach(button => button.addEventListener('click', () => go(button.dataset.route)));
  app.querySelectorAll('[data-period]').forEach(button => button.addEventListener('click', () => { selectedPeriod=button.dataset.period; render(); tell(`Read-only range: ${selectedPeriod}`); }));
  app.querySelectorAll('[data-action]').forEach(control => control.addEventListener('click', event => { const action=control.dataset.action; if(action==='reload-projection') { loadProjection().finally(render); return; } if(action==='connect-access') { window.location.assign(`${window.location.pathname}${window.location.search}${window.location.hash}`); return; } if(action==='attention') return go('attention'); if(action==='summary') return focusSummary(); if(action==='explain-evidence') { document.querySelector('.technical-details')?.setAttribute('open',''); document.querySelector('.technical-details')?.scrollIntoView({behavior:'smooth',block:'start'}); return; } }));
}
function cycleLocale() { locale = locale==='auto'?'en':locale==='en'?'es':locale==='es'?'pt':'auto'; try { localStorage.setItem('kabuby-intelligence-locale',locale); } catch {} createNavigation(); updateStaticCopy(); render(); }
function setLocale(next) { locale=next; try { localStorage.setItem('kabuby-intelligence-locale',locale); } catch {} createNavigation(); updateStaticCopy(); render(); document.querySelector('#locale-menu').hidden=true; }

document.querySelector('#ask-kabuby').addEventListener('submit', event => { event.preventDefault(); const query=document.querySelector('#ask-input').value.trim(); go('search',query?{q:query}:{}); });
localeButton.addEventListener('click', () => { const menu=document.querySelector('#locale-menu'); menu.hidden=!menu.hidden; });
document.querySelectorAll('[data-locale]').forEach(button=>button.addEventListener('click',()=>setLocale(button.dataset.locale)));
document.querySelector('#notification-button').addEventListener('click',()=>go('attention'));
document.querySelector('#owner-account').addEventListener('click',()=>go('account'));
window.addEventListener('hashchange',render);
createNavigation(); updateStaticCopy(); render(); loadProjection().finally(render);
