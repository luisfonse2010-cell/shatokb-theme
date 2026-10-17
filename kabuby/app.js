import { DAYPARTS, NAVIGATION, PHYSICAL_PROJECTION_PATH } from './data.js';
import { integratedScoutImportTarget } from './scout-owner.js';
import { exactAmazonProductNavigation, ebayEvidenceNavigation } from './v3-capability-contract.js';

const app = document.querySelector('#app');
const nav = document.querySelector('#primary-navigation');
const shell = document.querySelector('.app-shell');
const notice = document.querySelector('#notice');
const localeButton = document.querySelector('#locale-button');
const systemStatus = document.querySelector('#system-status');
const postCaptureTarget = integratedScoutImportTarget(window.location.href);
const icons = Object.freeze({ today: '⌂', opportunities: '◇', scout: '⌁', supply: '▣', economics: '⌁', operations: '⌘', portfolio: '◇', learning: '◎', settings: '⚙' });

const V3_COPY = Object.freeze({
  en: Object.freeze({
    back:'Back to Product Finder V3', dossier:'Product dossier', currentDecision:'Current decision', why:'Why this state', identity:'Exact marketplace identity', marketplace:'Amazon US → eBay US', amazonEvidence:'Amazon evidence', ebayEvidence:'eBay evidence', economics:'Economics', materialUnknowns:'Material unknowns', risks:'Risks', nextStep:'Next permitted research', advanced:'Advanced technical evidence', factual:'FACTUAL', estimate:'ESTIMATE', scenario:'SCENARIO', unknown:'UNKNOWN', activeNotSold:'Active listings — not sold prices', noEconomicEvidence:'No complete certified economic scenario is available.', imageUnavailable:'Factual primary image is not available.', exactIdentity:'Exact ASIN and GTIN identity', noProduct:'The requested product is not in the current certified V3 cohort.', amazonPrice:'Amazon price', acquisitionPrice:'Amazon acquisition price', shippingTax:'Amazon shipping / tax', demandEstimate:'Amazon demand estimate', salesRank:'Amazon sales rank', activeListings:'eBay exact active listings', activePriceRange:'eBay active price range', ebayDemand:'eBay demand', ebayCategory:'eBay category', outboundPackaging:'Outbound shipping / packaging', landedCost:'Estimated landed cost', breakEvenTarget:'Break-even / target price', profitMarginRoi:'Net profit / margin / ROI', targetAcquisitionCost:'Target acquisition cost', amazonSourceShipping:'Amazon source shipping', amazonTax:'Amazon purchase tax', currentSalesRank:'Current Amazon sales rank', avg90SalesRank:'Amazon Avg90 sales rank', ebayBaseFee:'eBay base final value fee', ebayFixedFee:'eBay per-order fixed fee', ebaySurcharge:'eBay performance surcharge', observed:'Observed', notReturned:'Not returned by certified evidence', commercialBlocked:'Commercial execution remains blocked.', noneRecorded:'NONE RECORDED', unresolvedInputs:'{count} unresolved input(s)', noAdditionalUnknowns:'No additional owner-decision material unknowns recorded.', noRiskNarrative:'No additional certified risk narrative is available.', brandUnknown:'Brand UNKNOWN'
  }),
  es: Object.freeze({
    back:'Volver a Product Finder V3', dossier:'Dossier del producto', currentDecision:'Decisión actual', why:'Por qué tiene este estado', identity:'Identidad exacta de marketplace', marketplace:'Amazon EE. UU. → eBay EE. UU.', amazonEvidence:'Evidencia de Amazon', ebayEvidence:'Evidencia de eBay', economics:'Economía', materialUnknowns:'Desconocidos materiales', risks:'Riesgos', nextStep:'Siguiente investigación permitida', advanced:'Evidencia técnica avanzada', factual:'FACTUAL', estimate:'ESTIMACIÓN', scenario:'ESCENARIO', unknown:'DESCONOCIDO', activeNotSold:'Listados activos — no precios vendidos', noEconomicEvidence:'No hay un escenario económico certificado completo disponible.', imageUnavailable:'La imagen primaria factual no está disponible.', exactIdentity:'Identidad exacta de ASIN y GTIN', noProduct:'El producto solicitado no está en la cohorte V3 certificada actual.', amazonPrice:'Precio de Amazon', acquisitionPrice:'Precio de adquisición de Amazon', shippingTax:'Envío / impuesto de Amazon', demandEstimate:'Estimación de demanda de Amazon', salesRank:'Ranking de ventas de Amazon', activeListings:'Listados activos exactos de eBay', activePriceRange:'Rango de precios activos de eBay', ebayDemand:'Demanda de eBay', ebayCategory:'Categoría de eBay', outboundPackaging:'Envío de salida / embalaje', landedCost:'Costo puesto estimado', breakEvenTarget:'Equilibrio / precio objetivo', profitMarginRoi:'Ganancia neta / margen / ROI', targetAcquisitionCost:'Costo de adquisición objetivo', amazonSourceShipping:'Envío de origen de Amazon', amazonTax:'Impuesto de compra de Amazon', currentSalesRank:'Ranking actual de ventas de Amazon', avg90SalesRank:'Ranking promedio 90 días de Amazon', ebayBaseFee:'Tarifa base por valor final de eBay', ebayFixedFee:'Tarifa fija por pedido de eBay', ebaySurcharge:'Recargo por desempeño de eBay', observed:'Observado', notReturned:'No fue devuelto por la evidencia certificada', commercialBlocked:'La ejecución comercial permanece bloqueada.', noneRecorded:'NINGUNO REGISTRADO', unresolvedInputs:'{count} entrada(s) sin resolver', noAdditionalUnknowns:'No se registran otros desconocidos materiales para la decisión del propietario.', noRiskNarrative:'No hay una narrativa de riesgo certificada adicional disponible.', brandUnknown:'Marca DESCONOCIDA'
  }),
  pt: Object.freeze({
    back:'Voltar ao Product Finder V3', dossier:'Dossiê do produto', currentDecision:'Decisão atual', why:'Por que tem este estado', identity:'Identidade exata do marketplace', marketplace:'Amazon EUA → eBay EUA', amazonEvidence:'Evidência da Amazon', ebayEvidence:'Evidência do eBay', economics:'Economia', materialUnknowns:'Desconhecidos materiais', risks:'Riscos', nextStep:'Próxima pesquisa permitida', advanced:'Evidência técnica avançada', factual:'FATUAL', estimate:'ESTIMATIVA', scenario:'CENÁRIO', unknown:'DESCONHECIDO', activeNotSold:'Listagens ativas — não preços vendidos', noEconomicEvidence:'Não há cenário econômico certificado completo disponível.', imageUnavailable:'A imagem primária factual não está disponível.', exactIdentity:'Identidade exata de ASIN e GTIN', noProduct:'O produto solicitado não está na coorte V3 certificada atual.', amazonPrice:'Preço da Amazon', acquisitionPrice:'Preço de aquisição da Amazon', shippingTax:'Frete / imposto da Amazon', demandEstimate:'Estimativa de demanda da Amazon', salesRank:'Classificação de vendas da Amazon', activeListings:'Listagens ativas exatas do eBay', activePriceRange:'Faixa de preço ativo do eBay', ebayDemand:'Demanda do eBay', ebayCategory:'Categoria do eBay', outboundPackaging:'Frete de saída / embalagem', landedCost:'Custo total estimado', breakEvenTarget:'Equilíbrio / preço-alvo', profitMarginRoi:'Lucro líquido / margem / ROI', targetAcquisitionCost:'Custo de aquisição-alvo', amazonSourceShipping:'Frete de origem da Amazon', amazonTax:'Imposto de compra da Amazon', currentSalesRank:'Ranking atual de vendas da Amazon', avg90SalesRank:'Ranking médio de 90 dias da Amazon', ebayBaseFee:'Taxa base de valor final do eBay', ebayFixedFee:'Taxa fixa por pedido do eBay', ebaySurcharge:'Sobretaxa de desempenho do eBay', observed:'Observado', notReturned:'Não retornado pela evidência certificada', commercialBlocked:'A execução comercial permanece bloqueada.', noneRecorded:'NENHUM REGISTRADO', unresolvedInputs:'{count} entrada(s) não resolvida(s)', noAdditionalUnknowns:'Não há outros desconhecidos materiais registrados para a decisão do proprietário.', noRiskNarrative:'Não há narrativa de risco certificada adicional disponível.', brandUnknown:'Marca DESCONHECIDA'
  })
});

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
let cohortFilter = 'ALL';

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
function v3(key, values = {}) { return (V3_COPY[activeLocale()][key] || V3_COPY.en[key] || key).replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? '')); }
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

// The browser only classifies pre-computed, canonical decisions. It never
// calculates economics or changes admission status.
function cohortCandidates(m) {
  return arr(object(object(m.states.discovery_engines).engine_b).amazon_ebay_candidates);
}
function cohortDecision(candidate) {
  if (candidate?.commercial_opportunity_state === 'HOLD') return 'HOLD';
  if (candidate?.commercial_opportunity_state === 'REJECTED') return 'REJECTED';
  const raw = state(candidate?.decision || candidate?.economics, 'UNKNOWN');
  if (raw === 'REJECTED_ECONOMICS') return 'REJECTED_ECONOMICS';
  // The API stores this canonical, already-calculated base scenario alongside
  // the candidate.  Some legacy candidate rows retained their pre-economics
  // VALIDATE state; use the persisted canonical outcome instead of deriving
  // a new calculation in the browser.
  const reassessment = object(candidate?.economics_reassessment);
  if (reassessment.base_official_fee_scenario_economics_complete === true && Number(reassessment.net_profit) < 0) return 'REJECTED_ECONOMICS';
  if (raw === 'VALIDATE' || raw === 'VALIDATE_WHITE_SPACE') return 'VALIDATE';
  if (raw === 'BLOCKED_EBAY_FEE_CATEGORY_UNRESOLVED' || (raw.startsWith('BLOCKED') && arr(candidate?.unknown_costs).includes('EBAY_FEE_CATEGORY_UNRESOLVED'))) return 'BLOCKED_EBAY_FEE_CATEGORY_UNRESOLVED';
  return raw;
}
function cohortSummary(m) {
  const candidates = cohortCandidates(m);
  const engine = object(object(m.states.discovery_engines).engine_b);
  const evaluated = candidates.length;
  const economicsComplete = candidates.filter(candidate => candidate?.economics_reassessment?.base_official_fee_scenario_economics_complete === true).length;
  const marginOnly = candidates.filter(candidate => candidate?.commercial_opportunity_classification === 'MARGIN_ONLY_RESEARCH_CANDIDATE').length;
  const commerciallyValidated = candidates.filter(candidate => candidate?.commercial_opportunity_state === 'VALIDATED').length;
  const rejected = candidates.filter(candidate => candidate?.commercial_opportunity_classification === 'REJECTED_ECONOMICS_RISK' || cohortDecision(candidate) === 'REJECTED_ECONOMICS').length;
  const insufficientEvidence = candidates.filter(candidate => candidate?.commercial_opportunity_classification === 'INSUFFICIENT_EVIDENCE_CANDIDATE').length;
  const whiteSpace = candidates.filter(candidate => candidate?.white_space === 'VERIFIED_EBAY_WHITE_SPACE').length;
  const hold = candidates.filter(candidate => candidate?.commercial_opportunity_state === 'HOLD').length;
  const rejectedCommercial = candidates.filter(candidate => candidate?.commercial_opportunity_state === 'REJECTED').length;
  return Object.freeze({ candidates, evaluated, economicsComplete, marginOnly, commerciallyValidated, rejected, rejectedCommercial, hold, insufficientEvidence, whiteSpace, cohort:state(engine.cohort, 'LEGACY_COHORT') });
}
function usd(value) {
  return Number.isFinite(value) ? `USD ${Number(value).toFixed(2)}` : 'UNKNOWN';
}
function usdMinor(value) {
  return Number.isFinite(value) ? usd(Number(value) / 100) : 'UNKNOWN';
}
function bps(value) {
  return Number.isInteger(value) ? `${(value / 100).toFixed(2)}%` : 'UNKNOWN';
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
  const cohort = cohortSummary(m);
  // Economic scenarios, active listings, and white-space observations cannot
  // become the Today surface's top opportunity. Only the server-projected
  // independent commercial gate can do so.
  const candidate = cohort.candidates.find(row => row?.commercial_opportunity_state === 'VALIDATED');
  if (candidate) return { kind:'commercial-opportunity', title:candidate.title || candidate.asin, category:'AMAZON → EBAY · COMMERCIAL VALIDATION', copy:`${candidate.asin} · ${candidate.commercial_opportunity_classification} · ${candidate.commercial_action}`, demand:candidate.ebay_demand || 'UNKNOWN', competition:candidate.ebay_competition || 'UNKNOWN', economics:candidate.economic_validation_state || candidate.economics || 'UNKNOWN', recommendation:candidate.commercial_opportunity_state, confidence:candidate.amazon_cost?.price_confidence || 'CERTIFIED_READ_MODEL', next:'Owner review of validated commercial evidence', risk:candidate.risk || 'UNKNOWN', provenance:candidate.commercial_lineage?.why_selected || candidate.asin, freshness:candidate.observed_at || m.generatedAt, unknowns:arr(candidate.unknown_costs), id:`amazon-ebay:${candidate.asin}` };
  const current = cohort.candidates.find(row => row?.commercial_opportunity_state === 'HOLD' || row?.commercial_opportunity_state === 'REJECTED') || cohort.candidates[0];
  if (current) return { kind:'research-status', title:current.title || current.asin, category:'CURRENT SPECIALIZED RESEARCH · NOT A COMMERCIAL OPPORTUNITY', copy:`${current.asin} · ${current.decision || current.commercial_opportunity_classification || 'INSUFFICIENT_EVIDENCE'} · ${current.commercial_action || 'DO_NOT_BUY'}`, demand:current.ebay_demand || 'UNKNOWN', competition:current.ebay_competition || 'UNKNOWN', economics:current.economic_validation_state || current.economics || 'UNKNOWN', recommendation:current.commercial_opportunity_state || 'RESEARCH_ONLY', confidence:current.amazon_cost?.price_confidence || 'CERTIFIED_READ_MODEL', next:current.commercial_action === 'STOP_SPENDING' ? 'No further spend permitted for this product' : 'Review the current factual evidence', risk:current.risk || 'UNKNOWN', provenance:current.commercial_lineage?.why_selected || current.asin, freshness:current.observed_at || m.generatedAt, unknowns:arr(current.unknown_costs), id:`amazon-ebay:${current.asin}` };
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
  const heading = candidate.kind === 'research-status' ? 'Current research status' : t('today.top');
  return `<section class="section"><div class="section-heading"><div><p>${esc(heading)}</p><h2>${esc(candidate.category)}</h2></div>${badge(candidate.recommendation)}</div><article class="top-opportunity"><div class="opportunity-media" aria-hidden="true"><span>Ｋ</span></div><div class="opportunity-copy"><p class="eyebrow">${esc(candidate.kind === 'research-status' ? 'CURRENT FACTUAL RESEARCH' : candidate.kind === 'decision' ? t('today.top') : t('nav.opportunities'))}</p><h3>${esc(candidate.title)}</h3><p>${esc(candidate.copy)}</p><div class="signal-list"><div><i>+</i><span><strong>${esc(stateLabel(candidate.demand))}</strong><small>${esc(t('label.demand'))}</small></span></div><div><i>◇</i><span><strong>${esc(stateLabel(candidate.competition))}</strong><small>${esc(t('label.competition'))}</small></span></div><div><i>◉</i><span><strong>${esc(stateLabel(candidate.economics))}</strong><small>${esc(t('label.price'))}</small></span></div></div></div><aside class="opportunity-action"><small>${esc(t('today.next'))}</small><strong>${esc(candidate.next || t('state.review'))}</strong><div class="confidence-ring"><i>${esc(candidate.confidence || '—')}</i><span>${esc(t('label.evidence'))}</span></div><span class="authority-badge">${esc(t('state.review'))}</span><button type="button" data-action="explain-evidence">${esc(t('today.seeWhy'))}</button></aside></article></section>`;
}
function attentionTiles(m, candidate) { const cohort=cohortSummary(m); const packages=arr(m.command.decision_packages); const attention=arr(m.memory.owner_attention); const securityState = m.isAvailable ? candidate?.risk || m.memory.status || 'WAITING_FOR_EVIDENCE' : authState; const rows=[['⌁',number(cohort.commerciallyValidated || packages.length),'Commercially validated','opportunities'],['△',number(cohort.hold + cohort.rejectedCommercial || cohort.marginOnly || attention.length),'Hold / rejected research','opportunities'],['◉',number(cohort.evaluated || arr(m.radar.rows).length),'Current specialized cohort','opportunities'],['✓',stateLabel(securityState),t('today.security'),'explain-evidence']]; return `<section class="attention-row" aria-label="${esc(t('today.attention'))}">${rows.map(([icon,value,label,action]) => `<button class="attention-tile" type="button" data-action="${action}"><span class="tile-icon" aria-hidden="true">${icon}</span><span><strong>${esc(value)}</strong><small>${esc(label)}</small></span></button>`).join('')}</section>`; }
function glance(m) { const cohort=cohortSummary(m); const data=[[t('label.opportunities'),cohort.commerciallyValidated || arr(m.radar.rows).length,cohort.commerciallyValidated ? 'AVAILABLE' : m.radar.status],[t('label.decisions'),cohort.marginOnly || arr(m.command.decision_packages).length,cohort.marginOnly ? 'RESEARCH_ONLY' : m.command.status],[t('label.marketplaces'),arr(m.operations.rows).length,m.operations.status],[t('label.economics'),cohort.economicsComplete || null,cohort.economicsComplete ? 'AVAILABLE' : object(m.economics.economics).status||m.economics.status],[t('nav.portfolio'),cohort.insufficientEvidence || arr(m.portfolio.rows).length,cohort.insufficientEvidence ? 'INSUFFICIENT_EVIDENCE' : m.portfolio.status],[t('label.evidence'),cohort.whiteSpace || Number(object(m.memory.coverage).records)||0,cohort.whiteSpace ? 'ACTIVE_SUPPLY_ONLY' : m.memory.status||m.learning.status]]; return `<section class="section glance"><div class="section-heading"><div><p>${esc(t('page.readOnly'))}</p><h2>${esc(t('today.glance'))}</h2></div><div class="period-control" role="group" aria-label="Read-only time range">${['7D','30D','90D','1Y'].map(period => `<button type="button" class="${selectedPeriod===period?'active':''}" data-period="${period}" aria-pressed="${selectedPeriod===period}">${period}</button>`).join('')}</div></div><div class="metric-grid">${data.map(([label,value,status]) => `<article class="metric"><small>${esc(label)}</small><strong class="${value===null?'unknown':''}">${value===null?'—':number(value)}</strong><span>${esc(stateLabel(status))}</span></article>`).join('')}</div><div class="chart chart-empty" role="img" aria-label="Read-only evidence trend has no canonical series"><span class="chart-label">${esc(selectedPeriod)}</span><div><b>${esc(t('state.notProven'))}</b><small>${esc(t('page.noData'))}</small></div></div></section>`; }
function activities(m) { const rows=arr(m.memory.recent_activity).slice(0,5); const emptyTitle=m.isAvailable ? t('today.noActivity') : authDescription()[0]; const emptyDetail=m.isAvailable ? t('page.noData') : authDescription()[1]; const activityState=m.isAvailable ? stateLabel(m.memory.status||'WAITING_FOR_EVIDENCE') : authDescription()[0]; return `<section class="recent-activity"><div class="section-heading"><div><p>${esc(t('page.readOnly'))}</p><h2>${esc(t('today.activity'))}</h2></div><a href="#learning?view=changes">View all</a></div><div class="activity-feed">${rows.length ? rows.map(item => `<article class="activity-item"><span class="activity-icon">◎</span><div><h3>${esc(item.change_type||'CANONICAL_EVENT')}</h3><p>${esc(item.current_lifecycle_status||t('state.unknown'))}</p></div><time>${esc(relativeDate(item.occurred_at))}</time></article>`).join('') : noDataCard(emptyTitle,emptyDetail)}</div><a class="learning-card" href="#learning?view=changes"><span aria-hidden="true">◉</span><div><b>${esc(activityState)}</b><p>${esc(t('today.security'))}</p></div></a></section>`; }
function technicalDetails(m, candidate) { return `<details class="technical-details"><summary>${esc(t('today.seeWhy'))} · ${esc(t('label.evidence'))}</summary><dl><div><dt>${esc(t('label.provenance'))}</dt><dd>${esc(candidate?.provenance||t('today.notAvailable'))}</dd></div><div><dt>${esc(t('label.freshness'))}</dt><dd>${esc(candidate?.freshness||t('today.notAvailable'))}</dd></div><div><dt>${esc(t('label.unknowns'))}</dt><dd>${esc(arr(candidate?.unknowns).join(', ')||t('state.unknown'))}</dd></div><div><dt>${esc(t('label.authority'))}</dt><dd>NONE · ${esc(t('state.review'))}</dd></div></dl></details>`; }
function todayView() { const m=model(); const candidate=topCandidate(m); shell.dataset.daypart=daypart(); return `${authBanner()}<div class="dashboard-grid"><div class="center-workspace"><section class="visual-hero"><div class="hero-content"><div><p class="hero-kicker"><i></i>${esc(t('page.readOnly'))}</p><h1 class="hero-title">${esc(daypartGreeting())}</h1><p class="hero-subtitle">${esc(t('hero.summary'))} <strong>${esc(t('hero.emphasis'))}</strong></p><div class="hero-actions"><button type="button" data-route="opportunities">${esc(t('nav.opportunities'))}</button><button type="button" data-action="attention">${esc(t('today.attention'))}</button><button type="button" data-route="economics">${esc(t('nav.economics'))}</button><button type="button" data-action="summary">${esc(t('today.glance'))}</button></div></div></div><span class="hero-wordmark" aria-hidden="true">DISCOVER<br>ANALYZE<br>DECIDE<br>EXECUTE<br>LEARN<br>A FREER TOMORROW</span></section>${topOpportunity(candidate)}${attentionTiles(m,candidate)}${glance(m)}${technicalDetails(m,candidate)}</div><aside class="right-intelligence-rail">${pulseRail(m)}${activities(m)}</aside></div>`; }
function sectionRows(rows, label) { return rows.length ? rows.map((row,index) => `<article class="list-row"><div><strong>${esc(row.need_or_search||row.subject_id||row.subject_type||row.channel_id||row.policy_id||row.outcome_id||`${label} ${index+1}`)}</strong><span>${esc(stateLabel(row.classification||row.status||row.learning_status||row.state||t('state.unknown')))}</span></div>${badge(row.freshness?.status||row.evidence_level||row.status||row.state||'UNKNOWN')}</article>`).join('') : noDataCard(t('today.notAvailable'),t('page.noData')); }
function cohortOverview(m) {
  const summary = cohortSummary(m);
  if (!summary.evaluated) return noDataCard('No structured Amazon→eBay candidates are available.', 'The certified projection has no cohort rows to present.');
  const metrics = [
    ['Products evaluated', summary.evaluated, 'CERTIFIED FIXED COHORT'],
    ['Economics complete', summary.economicsComplete, 'PRE-TAX SCENARIOS'],
    ['Margin-only research', summary.marginOnly, 'NOT A COMMERCIAL OPPORTUNITY'],
    ['Commercially validated', summary.commerciallyValidated, 'INDEPENDENT DEMAND EVIDENCE REQUIRED'],
    ['Rejected / hold', summary.rejectedCommercial + summary.hold + summary.rejected, 'STOP SPENDING OR ECONOMIC REJECTION'],
    ['Insufficient evidence', summary.insufficientEvidence, 'DEMAND OR TRANSFERABILITY REQUIRED'],
    ['White space', summary.whiteSpace, 'ACTIVE SUPPLY CONTEXT ONLY']
  ];
  return `<section class="section cohort-overview"><div class="section-heading"><div><p>AMAZON → EBAY · ${esc(summary.cohort)}</p><h2>Economic scenarios are not commercial opportunities</h2></div>${badge('AVAILABLE')}</div><p>All values are existing server-side read-model facts. PRE-TAX, ACTIVE LISTING PRICE SCENARIO, NOT SOLD PRICE, and DEMAND UNPROVEN remain explicit. Economic validation never validates commercial demand.</p><div class="metric-grid">${metrics.map(([label,value,detail]) => `<article class="metric"><small>${esc(label)}</small><strong>${number(value)}</strong><span>${esc(detail)}</span></article>`).join('')}</div><p class="cohort-first-complete">Current cohort: <strong>research and hold states are not commercial opportunities.</strong></p></section>`;
}
function scenarioRows(candidate) {
  const rows = arr(candidate.active_market_scenarios).filter(row => row?.position === 'ACTIVE_MEDIAN_PRICE_SCENARIO');
  if (candidate.asin === 'B0006N5S1C') {
    const owner = object(object(candidate.economics_reassessment).owner_decision_economics);
    const headline = object(owner.headline_scenario);
    return headline.promotion_id ? [`${headline.promotion_id} · ${headline.returns_scenario_id} · PRE-TAX · ACTIVE LISTING SCENARIO · NOT SOLD PRICE`] : [];
  }
  return rows.slice(0, 6).map(row => {
    const economics = object(row.economics);
    return `${row.promotion_id || 'UNKNOWN'} · ${row.returns_scenario_id || 'UNKNOWN'} · minimum viable price ${usd(economics.minimum_viable_selling_price_minor / 100)} · profit ${usd(economics.contribution_profit_minor / 100)} · margin ${bps(economics.contribution_margin_basis_points)} · ROI ${bps(economics.markup_basis_points)}`;
  });
}
function ownerCommercialState(candidate) {
  if (['VALIDATED','HOLD','REJECTED'].includes(candidate?.commercial_opportunity_state)) return candidate.commercial_opportunity_state;
  // A pre-tax scenario may reject the economics while the commercial firewall
  // correctly keeps the product out of the commercial-opportunity lifecycle.
  // Surface that rejection to the owner without changing its admission state.
  if (cohortDecision(candidate) === 'REJECTED_ECONOMICS') return 'REJECTED';
  return 'CONTINUE_RESEARCH';
}
function ownerPath(candidate) {
  return candidate.white_space === 'VERIFIED_EBAY_WHITE_SPACE'
    ? { id:'PATH_B', label:activeLocale() === 'es' ? 'Brecha de oferta verificada en eBay' : 'Verified eBay supply gap', detail:activeLocale() === 'es' ? 'La demanda de eBay sigue sin demostrarse.' : 'eBay demand is still unproven.' }
    : { id:'PATH_A', label:activeLocale() === 'es' ? 'Mercado existente de eBay' : 'Existing eBay market', detail:activeLocale() === 'es' ? 'Los listados activos exactos observan oferta; no demuestran ventas ni demanda.' : 'Exact active listings are a supply observation, not sold-demand proof.' };
}
function ownerMaterialUnknowns(candidate) {
  const labels = activeLocale() === 'es' ? {
    EBAY_DEMAND_UNPROVEN:'Demanda de eBay aún no demostrada', EBAY_FEE_PROFILE_UNKNOWN:'Base de tarifas de eBay sin resolver',
    EBAY_FEE_CATEGORY_UNRESOLVED:'Categoría/tarifa de eBay sin resolver', AMAZON_PURCHASE_TAX_UNKNOWN:'Impuesto de compra de Amazon aún no resuelto',
    ACCOUNT_PERFORMANCE_SURCHARGE_UNKNOWN:'Recargo por desempeño del vendedor desconocido', BUYER_COLLECTED_SHIPPING_UNKNOWN:'Envío cobrado al comprador desconocido',
    EBAY_ACTIVE_PRICE_NOT_SOLD_PRICE_SCENARIO_ONLY:'El precio activo de eBay es solo un escenario, no una venta', AMAZON_SELECTED_ACQUISITION_PRICE_UNKNOWN:'Precio de adquisición de Amazon desconocido', AMAZON_TO_OWNER_SHIPPING_UNKNOWN:'Envío de Amazon al propietario desconocido'
  } : {
    EBAY_DEMAND_UNPROVEN:'eBay demand not yet proven', EBAY_FEE_PROFILE_UNKNOWN:'eBay fee basis unresolved',
    EBAY_FEE_CATEGORY_UNRESOLVED:'eBay category and fee basis unresolved', AMAZON_PURCHASE_TAX_UNKNOWN:'Amazon purchase tax not yet resolved',
    ACCOUNT_PERFORMANCE_SURCHARGE_UNKNOWN:'Seller performance surcharge unknown', BUYER_COLLECTED_SHIPPING_UNKNOWN:'Buyer-collected shipping unknown',
    EBAY_ACTIVE_PRICE_NOT_SOLD_PRICE_SCENARIO_ONLY:'eBay active price is a scenario, not a sale', AMAZON_SELECTED_ACQUISITION_PRICE_UNKNOWN:'Amazon acquisition price unknown', AMAZON_TO_OWNER_SHIPPING_UNKNOWN:'Amazon-to-owner shipping unknown'
  };
  return [...new Set(arr(candidate.unknown_costs).map(value => labels[value]).filter(Boolean))];
}
function ownerNarrative(candidate, state) {
  const es=activeLocale() === 'es';
  if (state === 'HOLD') return es ? 'La evidencia certificada de categoría o tarifa sigue sin resolverse. Se detuvo el gasto de investigación adicional.' : 'Certified category or fee evidence is unresolved. Further research spending is stopped.';
  if (state === 'REJECTED' && cohortDecision(candidate) === 'REJECTED_ECONOMICS') return es ? 'El escenario pre-impuesto con tarifa base oficial resulta económicamente inviable al precio activo observado. No es una autorización comercial.' : 'The pre-tax official-base-fee scenario is economically implausible at the observed active price. This is not commercial authorization.';
  if (state === 'REJECTED') return es ? 'La evidencia certificada de mercado rechazó este producto exacto. No se reanuda sin evidencia nueva certificada.' : 'Certified market evidence rejected this exact product. Do not resume without new certified evidence.';
  if (state === 'VALIDATED') return es ? 'El contrato certificado admite el producto para revisión del propietario; las acciones comerciales siguen bloqueadas.' : 'The certified decision contract admits this product for owner review; commercial actions remain blocked.';
  return es ? 'Hay evidencia de Amazon, pero aún falta evidencia material de mercado o economía para una decisión comercial.' : 'Amazon evidence is available, but material market or economic evidence still needs research.';
}
function ownerNextStep(candidate, state) {
  const es=activeLocale() === 'es';
  if (state === 'HOLD') return es ? 'Mantener en espera: no invertir hasta resolver la categoría o tarifa certificada.' : 'Hold — do not spend until the certified category or fee evidence is resolved.';
  if (state === 'REJECTED' && cohortDecision(candidate) === 'REJECTED_ECONOMICS') return es ? 'No comprar: solo revisar si aparece evidencia nueva de costo, precio vendido o demanda.' : 'Do not buy: revisit only with new cost, sold-price, or demand evidence.';
  if (state === 'REJECTED') return es ? 'Rechazado: no reanudar sin nueva evidencia de mercado certificada.' : 'Rejected — do not resume without new certified market evidence.';
  if (state === 'VALIDATED') return es ? 'Revisar la evidencia certificada antes de cualquier acción comercial autorizada por separado.' : 'Review the certified decision evidence before any separately authorized commercial action.';
  return es ? 'Revisar la evidencia material antes de cualquier investigación adicional permitida.' : 'Review the material evidence before any further permitted research.';
}
function ownerEvidenceValue(value) {
  const code = String(value || 'UNKNOWN');
  const spanish = {
    EBAY_DEMAND_UNPROVEN:'Demanda de eBay aún no demostrada', EBAY_DEMAND_UNKNOWN:'Demanda de eBay desconocida',
    UNKNOWN_NO_FACTUAL_EVIDENCE:'Sin evidencia factual certificada', MATERIAL_TWO_LEG_COSTS_UNKNOWN:'Faltan costos materiales de las dos etapas',
    MATERIAL_ECONOMIC_OR_MARKET_UNKNOWN:'Falta evidencia económica o de mercado material', UNKNOWN_MATERIAL_COSTS:'Costos materiales sin resolver',
    NOT_VALIDATED:'Aún no validado comercialmente', NOT_VALIDATED_OWNER_ASSISTED_NO_RESULTS:'Investigación asistida sin resultados certificados',
    CATEGORY_CONFLICT:'Conflicto de categoría exacta', NOT_RETURNED:'No fue devuelto por la evidencia certificada',
    UNKNOWN:'Sin evidencia factual certificada', SUPPORTED:'Respaldada por evidencia certificada', CONTINUE_RESEARCH:'Continuar investigación',
    BASE_OFFICIAL_FEE_PRETAX_SCENARIO_ECONOMICS:'Escenario pre-impuesto con tarifa oficial base'
  };
  if (activeLocale() === 'es') return spanish[code] || code;
  return code;
}
function ownerStateLabel(state) {
  if (activeLocale() !== 'es') return String(state || 'UNKNOWN').replaceAll('_',' ');
  return ({ CONTINUE_RESEARCH:'Continuar investigación', HOLD:'En espera', REJECTED:'Rechazado', VALIDATED:'Validado' })[state] || String(state || 'DESCONOCIDO').replaceAll('_',' ');
}
function ownerMaterialRiskText(unknowns) {
  if (!unknowns.length) return v3('noAdditionalUnknowns');
  return activeLocale() === 'es'
    ? `La economía sigue incompleta: ${unknowns.length} entrada${unknowns.length === 1 ? '' : 's'} material${unknowns.length === 1 ? '' : 'es'} sin resolver: ${unknowns.join('; ')}`
    : `Economics incomplete — ${unknowns.length} material input${unknowns.length === 1 ? '' : 's'} unresolved: ${unknowns.join('; ')}`;
}
function ownerFilterDefinitions(candidates) {
  const count = predicate => candidates.filter(predicate).length;
  return [
    ['ALL',activeLocale() === 'es' ? 'Todos los productos' : 'All products',candidates.length],
    ['CONTINUE_RESEARCH',activeLocale() === 'es' ? 'Continuar investigación' : 'Continue research',count(candidate => ownerCommercialState(candidate) === 'CONTINUE_RESEARCH')],
    ['HOLD',activeLocale() === 'es' ? 'En espera' : 'Hold',count(candidate => ownerCommercialState(candidate) === 'HOLD')],
    ['REJECTED',activeLocale() === 'es' ? 'Rechazados' : 'Rejected',count(candidate => ownerCommercialState(candidate) === 'REJECTED')],
    ['PATH_A',activeLocale() === 'es' ? 'Mercado existente de eBay' : 'Existing eBay market',count(candidate => ownerPath(candidate).id === 'PATH_A')],
    ['PATH_B',activeLocale() === 'es' ? 'Brecha de oferta' : 'Supply gap',count(candidate => ownerPath(candidate).id === 'PATH_B')],
    ['AMAZON_STRENGTH_SUPPORTED',activeLocale() === 'es' ? 'Fortaleza Amazon respaldada' : 'Amazon strength supported',count(candidate => candidate.amazon_commercial_strength === 'SUPPORTED')]
  ];
}
function ownerMatchesFilter(candidate, filter) {
  if (filter === 'ALL') return true;
  if (filter === 'PATH_A' || filter === 'PATH_B') return ownerPath(candidate).id === filter;
  if (filter === 'AMAZON_STRENGTH_SUPPORTED') return candidate.amazon_commercial_strength === 'SUPPORTED';
  return ownerCommercialState(candidate) === filter;
}
function productImage(candidate) {
  const image = object(candidate.primary_image);
  if (image.state === 'AVAILABLE' && /^https:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9._%-]+$/.test(image.url || '')) return `<img src="${esc(image.url)}" alt="${esc(candidate.title || candidate.asin)}" loading="lazy">`;
  return `<div class="product-image-placeholder" aria-label="${esc(v3('imageUnavailable'))}"><span>◇</span><small>${esc(v3('imageUnavailable'))}</small></div>`;
}
function evidenceObserved(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) ? value.replace('T', ' ').replace('.000Z', ' UTC').replace('Z', ' UTC') : v3('notReturned');
}
function advancedEvidence(candidate) {
  const raw = arr(candidate.unknown_costs).join(', ') || 'NONE_RECORDED';
  const offer = object(candidate.amazon_purchasable_offer);
  const category = object(candidate.ebay_category_resolution);
  const active = object(candidate.ebay_active_listing_price_evidence);
  const economics = object(candidate.economics_reassessment);
  const fee = object(object(economics.economic_input_policy || candidate.economic_input_policy).ebay_fee);
  const provenance = typeof candidate.provenance === 'string' && candidate.provenance ? candidate.provenance : 'NOT_AVAILABLE';
  const freshness = typeof candidate.freshness === 'string' && candidate.freshness ? candidate.freshness : 'NOT_AVAILABLE';
  return `<details class="advanced-technical-evidence"><summary>${esc(v3('advanced'))}</summary><dl><div><dt>Raw material blockers</dt><dd>${esc(raw)}</dd></div><div><dt>Canonical cohort state</dt><dd>${esc(candidate.candidate_state || 'UNKNOWN')}</dd></div><div><dt>Product observation provenance</dt><dd data-owner-evidence-provenance>${esc(provenance)}</dd></div><div><dt>Product observation freshness</dt><dd data-owner-evidence-freshness>${esc(freshness)}</dd></div><div><dt>Amazon purchasable offer observation</dt><dd>${esc(evidenceObserved(offer.offer_price?.observed_at))} · ${esc(offer.state || 'NOT_AVAILABLE')}</dd></div><div><dt>eBay category observation</dt><dd>${esc(evidenceObserved(category.observed_at))} · ${esc(category.state || 'NOT_AVAILABLE')}</dd></div><div><dt>eBay active-market observation</dt><dd>${esc(evidenceObserved(active.observed_at || candidate.market_observed_at))} · ${esc(active.semantics || 'NOT_AVAILABLE')}</dd></div><div><dt>eBay base-fee policy</dt><dd>${esc(fee.source?.version || fee.source || 'NOT_AVAILABLE')} · ${esc(fee.state || 'NOT_AVAILABLE')}</dd></div><div><dt>Read-model lineage</dt><dd>${esc(candidate.commercial_lineage?.why_this_product || 'UNKNOWN')}</dd></div><div><dt>Image evidence state</dt><dd>${candidate.primary_image?.state === 'AVAILABLE' ? 'PERSISTED_PRIMARY_IMAGE' : 'IMAGE_ENRICHMENT_REQUIRED'}</dd></div></dl></details>`;
}
function ownerDossierParams(filter, asin) { return { view:'amazon-ebay', cohort:filter, asin }; }
function exactV3Candidate(m, asin) {
  const exact = typeof asin === 'string' && /^[A-Z0-9]{10}$/.test(asin) ? asin : null;
  return exact ? cohortCandidates(m).find(candidate => candidate?.asin === exact) || null : null;
}
function ownerEvidenceRows(candidate) {
  const active = object(candidate.ebay_active_listing_price_evidence);
  const economics = object(candidate.economics_reassessment);
  const cost = object(candidate.amazon_cost);
  const policy = object(economics.economic_input_policy || candidate.economic_input_policy);
  const fee = object(policy.ebay_fee);
  const price = Number.isFinite(candidate.amazon_price) ? usd(candidate.amazon_price) : v3('unknown');
  const activeMoney = value => Number.isFinite(value) ? usd(value) : v3('unknown');
  const activeRange = Number.isFinite(active.low) ? `${activeMoney(active.low)} / ${activeMoney(active.median)} / ${activeMoney(active.high)} · ${v3('activeNotSold')}` : v3('unknown');
  const selected = object(cost.selected_acquisition_price);
  const offer = object(candidate.amazon_purchasable_offer);
  const confirmedOffer = offer.state === 'PURCHASABLE_NEW_OFFER_CONFIRMED' ? offer : {};
  const offerPreTax = object(confirmedOffer.pre_tax_acquisition_cost);
  const offerShipping = object(confirmedOffer.amazon_shipping);
  const landed = object(cost.estimated_landed_cost);
  const amazonShipping = object(cost.shipping);
  const amount = value => Number.isFinite(value?.value) ? value.value : (Number.isFinite(value?.amount) ? value.amount : null);
  const acquisitionPrice = Number.isFinite(amount(offerPreTax)) ? offerPreTax : selected;
  const sourceShipping = Number.isFinite(amount(offerShipping)) ? offerShipping : amazonShipping;
  const amazonTax = object(cost.tax);
  const outbound = object(candidate.outbound_shipping_policy);
  const packaging = object(candidate.packaging_cost);
  const tac = object(candidate.tac);
  const economicsReady = economics.base_official_fee_scenario_economics_complete === true;
  const minorOrUnknown = value => Number.isFinite(value) ? usdMinor(value) : v3('unknown');
  const rateOrUnknown = value => Number.isFinite(value) ? `${(value / 100).toFixed(2)}%` : v3('unknown');
  const fixedScenario = arr(candidate.active_market_scenarios).find(row => row?.position === 'ACTIVE_MEDIAN_PRICE_SCENARIO' && row?.promotion_id === 'ORGANIC' && row?.returns_scenario_id === 'BASE_RETURNS_3');
  const feeRate = Number.isFinite(fee.rate_basis_points) ? rateOrUnknown(fee.rate_basis_points) : v3('unknown');
  const surcharge = object(fee.performance_surcharge);
  const salesRankContext = typeof candidate.amazon_sales_rank_category === 'string' && candidate.amazon_sales_rank_category.trim() ? candidate.amazon_sales_rank_category.trim() : null;
  const currentSalesRank = Number.isInteger(candidate.amazon_sales_rank) && salesRankContext ? `${candidate.amazon_sales_rank} · ${salesRankContext}` : v3('notReturned');
  return [
    [v3('identity'), candidate.gtin ? `${candidate.asin} · GTIN ${candidate.gtin}` : `${candidate.asin} · GTIN ${v3('unknown')}`, v3('factual')],
    [v3('amazonPrice'), price, Number.isFinite(candidate.amazon_price) ? v3('factual') : v3('unknown')],
    [v3('acquisitionPrice'), Number.isFinite(amount(acquisitionPrice)) ? `${acquisitionPrice.currency || 'USD'} ${amount(acquisitionPrice)} · ${v3('observed')} ${evidenceObserved(confirmedOffer.offer_price?.observed_at || cost.price_observed_at)}` : v3('unknown'), Number.isFinite(amount(acquisitionPrice)) ? v3('factual') : v3('unknown')],
    [v3('amazonSourceShipping'), Number.isFinite(amount(sourceShipping)) ? `${sourceShipping.currency || 'USD'} ${amount(sourceShipping)}` : v3('unknown'), Number.isFinite(amount(sourceShipping)) ? v3('factual') : v3('unknown')],
    [v3('amazonTax'), ownerEvidenceValue(amazonTax.truth_level || candidate.amazon_purchasable_offer?.tax?.truth_level || v3('unknown')), v3('unknown')],
    [v3('demandEstimate'), `${candidate.amazon_monthly_sold_estimate ?? v3('unknown')} · ${activeLocale() === 'es' ? 'estimación del proveedor' : 'provider estimate'}`, Number.isInteger(candidate.amazon_monthly_sold_estimate) ? v3('estimate') : v3('unknown')],
    [v3('currentSalesRank'), currentSalesRank, salesRankContext ? v3('factual') : v3('unknown')],
    [v3('avg90SalesRank'), candidate.amazon_avg90_rank ?? v3('notReturned'), Number.isInteger(candidate.amazon_avg90_rank) ? v3('factual') : v3('unknown')],
    [v3('activeListings'), candidate.exact_active_listings ?? v3('unknown'), Number.isInteger(candidate.exact_active_listings) ? v3('factual') : v3('unknown')],
    [v3('activePriceRange'), activeRange, Number.isFinite(active.low) ? v3('factual') : v3('unknown')],
    [v3('ebayDemand'), ownerEvidenceValue(candidate.ebay_demand || v3('unknown')), /UNKNOWN|UNPROVEN|NOT_PROVEN|NOT_VALIDATED/.test(String(candidate.ebay_demand || 'UNKNOWN')) ? v3('unknown') : v3('factual')],
    [v3('ebayCategory'), ownerEvidenceValue(candidate.ebay_category?.name || candidate.ebay_category_resolution?.state || v3('unknown')), candidate.ebay_category?.name ? v3('factual') : v3('unknown')],
    [v3('ebayBaseFee'), feeRate, Number.isFinite(fee.rate_basis_points) ? v3('factual') : v3('unknown')],
    [v3('ebayFixedFee'), Number.isInteger(fixedScenario?.fixed_order_fee_minor) ? usdMinor(fixedScenario.fixed_order_fee_minor) : v3('unknown'), Number.isInteger(fixedScenario?.fixed_order_fee_minor) ? v3('factual') : v3('unknown')],
    [v3('ebaySurcharge'), ownerEvidenceValue(surcharge.state || v3('unknown')), v3('unknown')],
    [v3('outboundPackaging'), `${Number.isFinite(amount(outbound)) ? `${outbound.currency || 'USD'} ${amount(outbound).toFixed(2)}` : v3('unknown')} · ${Number.isFinite(amount(packaging)) ? `${packaging.currency || 'USD'} ${amount(packaging).toFixed(2)}` : v3('unknown')}`, v3('scenario')],
    [v3('landedCost'), Number.isFinite(amount(landed)) ? `${landed.currency || 'USD'} ${amount(landed)}` : v3('unknown'), landed.truth_level || v3('unknown')],
    [v3('breakEvenTarget'), `${minorOrUnknown(candidate.break_even_price)} · ${minorOrUnknown(candidate.target_price)}`, economicsReady ? v3('scenario') : v3('unknown')],
    [v3('profitMarginRoi'), `${minorOrUnknown(candidate.net_profit)} · ${rateOrUnknown(candidate.margin)} · ${rateOrUnknown(candidate.roi)}`, economicsReady ? v3('scenario') : v3('unknown')],
    [v3('targetAcquisitionCost'), Number.isInteger(tac.conservative_minor) ? usdMinor(tac.conservative_minor) : v3('unknown'), economicsReady ? v3('scenario') : v3('unknown')]
  ];
}
function ownerEvidenceNavigation(candidate) {
  const amazon = exactAmazonProductNavigation(candidate.asin);
  const ebay = ebayEvidenceNavigation(candidate);
  const amazonLabel = activeLocale() === 'es' ? 'Abrir producto exacto de Amazon' : 'Open exact Amazon product';
  const ebaySuffix = ebay?.kind === 'EXACT_GTIN_SEARCH_NAVIGATION' ? (activeLocale() === 'es' ? ' · solo navegación, no evidencia de listado' : ' · navigation only, not listing evidence') : '';
  const amazonLink = amazon ? `<a data-amazon-exact-navigation href="${esc(amazon)}" target="_blank" rel="noopener noreferrer">${esc(amazonLabel)}</a>` : '';
  const ebayLink = ebay ? `<a data-ebay-navigation data-ebay-navigation-kind="${esc(ebay.kind)}" href="${esc(ebay.url)}" target="_blank" rel="noopener noreferrer">${esc(ebay.label)}${esc(ebaySuffix)}</a>` : '';
  return `<nav class="owner-evidence-navigation" aria-label="${esc(activeLocale() === 'es' ? 'Navegación exacta de marketplaces' : 'Exact marketplace navigation')}">${amazonLink}${ebayLink}</nav>`;
}
function ownerDossier(candidate, filter) {
  const state = ownerCommercialState(candidate);
  const path = ownerPath(candidate);
  const unknowns = ownerMaterialUnknowns(candidate);
  const evidence = ownerEvidenceRows(candidate);
  const economicState = candidate.economics || candidate.economic_validation_state || 'UNKNOWN';
  const next = ownerNextStep(candidate, state);
  return `<section class="owner-dossier-page" data-owner-dossier-view="${esc(candidate.asin)}"><a class="owner-dossier-back" href="#opportunities?${new URLSearchParams({ view:'amazon-ebay', cohort:filter }).toString()}">← ${esc(v3('back'))}</a><article class="owner-dossier"><header class="owner-dossier-hero"><div class="owner-dossier-media">${productImage(candidate)}</div><div><p class="eyebrow">${esc(v3('dossier'))} · ${esc(v3('marketplace'))}</p><h1>${esc(candidate.title || candidate.asin)}</h1><p>${esc(candidate.brand || v3('brandUnknown'))} · ASIN ${esc(candidate.asin)}${candidate.gtin ? ` · GTIN ${esc(candidate.gtin)}` : ''}</p><div class="owner-state-row"><span class="owner-state owner-state-${state.toLowerCase()}">${esc(ownerStateLabel(state))}</span><span class="owner-path">${esc(path.label)}</span></div></div></header><section class="owner-dossier-section"><p class="eyebrow">${esc(v3('currentDecision'))}</p><h2>${esc(ownerStateLabel(state))}</h2><p>${esc(ownerNarrative(candidate, state))}</p></section><section class="owner-dossier-section"><p class="eyebrow">${esc(v3('why'))}</p><h2>${esc(path.label)}</h2><p>${esc(path.detail)}</p></section><section class="owner-dossier-section"><p class="eyebrow">${esc(v3('amazonEvidence'))} · ${esc(v3('ebayEvidence'))} · ${esc(v3('economics'))}</p><div class="owner-dossier-evidence">${evidence.map(([label,value,truth]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd><small>${esc(truth)}</small></div>`).join('')}</div>${economicState === 'UNKNOWN_MATERIAL_COSTS' ? `<p class="owner-dossier-note">${esc(v3('noEconomicEvidence'))}</p>` : ''}</section><section class="owner-dossier-grid"><section class="owner-dossier-section"><p class="eyebrow">${esc(v3('materialUnknowns'))}</p><h2>${esc(unknowns.length ? v3('unresolvedInputs', { count:unknowns.length }) : v3('noneRecorded'))}</h2><p>${esc(unknowns.length ? unknowns.join('; ') : v3('noAdditionalUnknowns'))}</p></section><section class="owner-dossier-section"><p class="eyebrow">${esc(v3('risks'))}</p><h2>${esc(ownerEvidenceValue(candidate.risk || 'UNKNOWN'))}</h2><p>${esc(ownerEvidenceValue(candidate.commercial_lineage?.risk_state || v3('noRiskNarrative')))}</p></section><section class="owner-dossier-section"><p class="eyebrow">${esc(v3('nextStep'))}</p><h2>${esc(next)}</h2><p>${esc(v3('commercialBlocked'))}</p></section></section>${ownerEvidenceNavigation(candidate)}${advancedEvidence(candidate)}<span class="authority-badge">${esc(activeLocale() === 'es' ? 'SOLO LECTURA · ACCIONES COMERCIALES BLOQUEADAS' : 'READ ONLY · COMMERCIAL ACTIONS BLOCKED')}</span></article></section>`;
}
function amazonEbayDossiers(m) {
  const engine = object(object(m.states.discovery_engines).engine_b);
  const summary = cohortSummary(m);
  if (!summary.candidates.length) return noDataCard('No structured Amazon→eBay candidates are available.', 'The read model preserves this as a factual empty state.');
  const allowedFilters = new Set(ownerFilterDefinitions(summary.candidates).map(([id]) => id));
  const filter = allowedFilters.has(cohortFilter) ? cohortFilter : 'ALL';
  const candidates = summary.candidates.filter(candidate => ownerMatchesFilter(candidate, filter));
  const filters = ownerFilterDefinitions(summary.candidates);
  const cards = candidates.length ? candidates.map(candidate => {
    const state = ownerCommercialState(candidate);
    const path = ownerPath(candidate);
    const active = object(candidate.ebay_active_listing_price_evidence);
    const unknowns = ownerMaterialUnknowns(candidate);
    const marketMoney = value => Number.isFinite(value) ? usd(value) : v3('unknown');
    const marketRange = Number.isFinite(active.low) ? `${marketMoney(active.low)} / ${marketMoney(active.median)} / ${marketMoney(active.high)} · ${v3('activeNotSold')}` : (activeLocale() === 'es' ? 'No hay rango factual de precios activos disponible' : 'No factual active-price range available');
    const strength = ownerEvidenceValue(candidate.amazon_commercial_strength || 'UNKNOWN');
    const economic = ownerEvidenceValue(state === 'HOLD' ? 'NOT_VALIDATED' : candidate.economics || candidate.economic_validation_state || 'UNKNOWN');
    const observedPrice = Number.isFinite(candidate.amazon_price) ? usd(candidate.amazon_price) : v3('unknown');
    return `<article class="detail-card cohort-dossier owner-product-card" role="link" tabindex="0" data-owner-dossier="${esc(candidate.asin)}" data-owner-state="${state}" data-owner-path="${path.id}" data-amazon-strength="${esc(candidate.amazon_commercial_strength || 'UNKNOWN')}" aria-label="${esc(`${candidate.title || candidate.asin} · ${candidate.asin}`)}"><div class="owner-product-hero">${productImage(candidate)}<div><p class="eyebrow">${esc(path.label)}</p><h3>${esc(candidate.title || candidate.asin)}</h3><p>${esc(candidate.brand || 'Brand not available')} · ASIN ${esc(candidate.asin || 'UNKNOWN')}${candidate.gtin ? ` · GTIN ${esc(candidate.gtin)}` : ''}</p><div class="owner-state-row"><span class="owner-state owner-state-${state.toLowerCase()}">${esc(ownerStateLabel(state))}</span><span class="owner-path">${esc(path.label)}</span></div></div></div><p class="owner-why">${esc(ownerNarrative(candidate, state))}</p><dl class="owner-evidence-grid"><div><dt>${esc(activeLocale() === 'es' ? 'Fortaleza comercial de Amazon' : 'Amazon strength')}</dt><dd>${esc(strength)}</dd></div><div><dt>${esc(v3('amazonPrice'))}</dt><dd>${esc(observedPrice)}</dd></div><div><dt>${esc(v3('demandEstimate'))}</dt><dd>${esc(candidate.amazon_monthly_sold_estimate ?? v3('unknown'))} · ${esc(activeLocale() === 'es' ? 'estimación del proveedor' : 'provider estimate')}</dd></div><div><dt>${esc(v3('activePriceRange'))}</dt><dd>${esc(marketRange)}</dd></div><div><dt>${esc(activeLocale() === 'es' ? 'Estado económico' : 'Economic state')}</dt><dd>${esc(economic)}</dd></div></dl><div class="owner-material-risk"><strong>${esc(v3('materialUnknowns'))}</strong><span>${esc(ownerMaterialRiskText(unknowns))}</span></div><p class="owner-next"><strong>${esc(v3('nextStep'))}</strong> ${esc(ownerNextStep(candidate, state))}</p><span class="owner-card-open">${esc(v3('dossier'))} →</span></article>`;
  }).join('') : noDataCard('No products match this current V3 filter.', 'Filtering changes no factual state.');
  const es = activeLocale() === 'es';
  return `<section class="section owner-v3-overview"><div class="section-heading"><div><p>AMAZON → EBAY · ${esc(es ? 'V3 ACTUAL · SOLO LECTURA' : 'CURRENT V3 · READ ONLY')}</p><h2>${esc(es ? 'Dossiers de propietario de Product Finder V3' : 'Product Finder V3 owner dossiers')}</h2></div>${badge(engine.state || 'UNKNOWN')}</div><p>${esc(es ? 'Los productos siguen siendo candidatos de investigación salvo que una puerta comercial certificada indique lo contrario. Los listados activos de eBay no demuestran ventas ni demanda.' : 'Products remain research candidates unless a certified commercial gate says otherwise. Active eBay listings do not establish sales or demand.')}</p><div class="cohort-filters" role="group" aria-label="${esc(es ? 'Filtros actuales de productos V3' : 'Current V3 product filters')}">${filters.map(([id,label,count]) => `<button type="button" class="${filter === id ? 'active' : ''}" data-cohort-filter="${id}" aria-pressed="${filter === id}">${esc(label)} (${number(count)})</button>`).join('')}</div><div class="detail-grid">${cards}</div></section>`;
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
function dataPage(page) { const m=model(); const {params}=route(); const surface=surfaceFor(page,params.get('view')); const titles={opportunities:t('nav.opportunities'),supply:t('nav.supply'),economics:t('nav.economics'),operations:t('nav.operations'),portfolio:t('nav.portfolio'),learning:t('nav.learning'),settings:t('nav.settings')}; const [id,label,description,rowSource,statusSource] = surface || ['overview',titles[page],t('page.noData'),() => [],() => 'UNKNOWN']; const rows=rowSource(m); const status=statusSource(m)||'UNKNOWN'; const lifecycle=page==='operations' && id==='sales' ? salesLifecycle() : ''; if (page === 'opportunities' && id === 'amazon-ebay') { const requested = params.get('asin'); const exact = exactV3Candidate(m, requested); const filter = new Set(ownerFilterDefinitions(cohortCandidates(m)).map(([key]) => key)).has(params.get('cohort')) ? params.get('cohort') : 'ALL'; const content = requested ? (exact ? ownerDossier(exact, filter) : noDataCard(v3('noProduct'), v3('noProduct'))) : amazonEbayDossiers(m); return `${authBanner()}<section class="page-head"><p class="eyebrow">${esc(titles[page])}</p><h1>${esc(label)}</h1><p>${esc(description)}</p>${surfaceTabs(page,id)}</section>${content}${lockedActions()}${technicalDetails(m,exact)}`; } return `${authBanner()}<section class="page-head"><p class="eyebrow">${esc(titles[page])}</p><h1>${esc(label)}</h1><p>${esc(description)}</p>${surfaceTabs(page,id)}</section><section class="section"><div class="section-heading"><div><p>${esc(label)}</p><h2>${esc(stateLabel(status))}</h2></div>${badge(status)}</div><div class="detail-grid">${sectionRows(rows,label)}</div></section>${lifecycle}${lockedActions()}${technicalDetails(m,null)}`; }
function salesLifecycle() { const stages=['SALE_RECEIVED','PURCHASE_REQUIRED','PURCHASED','INBOUND_IN_TRANSIT','RECEIVED_AT_HUB','INSPECTED','READY_FOR_OUTBOUND','SHIPPED_TO_CUSTOMER','DELIVERED','RECONCILED']; return `<section class="section"><div class="section-heading"><div><p>${esc(t('nav.operations'))}</p><h2>Sales lifecycle</h2></div></div><div class="detail-grid">${stages.map(stage => `<article class="detail-card"><span class="state-pill" data-state="UNKNOWN">${esc(stage)}</span><p>${esc(t('state.unknown'))}</p></article>`).join('')}</div></section>`; }
function lockedActions() { return `<section class="section"><div class="section-heading"><div><p>${esc(t('label.authority'))}</p><h2>${esc(t('today.security'))}</h2></div></div><div class="locked-actions"><button disabled title="Commercial authority is NONE">BUY · BLOCKED</button><button disabled title="Commercial authority is NONE">PUBLISH · BLOCKED</button><button disabled title="Commercial authority is NONE">REPRICE · BLOCKED</button><button disabled title="Commercial authority is NONE">INVENTORY WRITE · BLOCKED</button></div></section>`; }
const SCOUT_VIEWS = Object.freeze([
  ['dashboard', 'Dashboard'], ['pendientes', 'Pendientes'], ['despachos', 'Despachos'], ['inventario', 'Inventario'], ['categorias', 'Categorías'], ['config', 'Configuración']
]);
function scoutModuleSource(view, params) {
  const source = new URL('/scout/', window.location.origin);
  source.searchParams.set('integrated', '1');
  source.searchParams.set('view', view);
  if (params.get('shato_import') === '1') {
    source.searchParams.set('shato_import', '1');
    for (const key of ['t', 'shato_data']) {
      const value = params.get(key);
      if (value) source.searchParams.set(key, value);
    }
  }
  return source.pathname + source.search;
}
function scoutView() {
  const { params } = route();
  const requested = params.get('view') || 'pendientes';
  const view = SCOUT_VIEWS.some(([id]) => id === requested) ? requested : 'pendientes';
  const postCaptureImport = params.get('shato_import') === '1';
  const tabs = `<nav class="surface-tabs scout-module-tabs" aria-label="Scout module navigation">${SCOUT_VIEWS.map(([id, label]) => `<a href="#scout?view=${id}"${id === view ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>`;
  if (postCaptureImport) queueMicrotask(() => history.replaceState({}, document.title, `${location.pathname}${location.search}#scout?view=pendientes`));
  return `${authBanner()}<section class="page-head scout-module-heading"><p class="eyebrow">SCOUT</p><h1>Scout</h1><p>El módulo funcional existente se ejecuta dentro de la sesión autenticada de Kabuby. La ruta directa de compatibilidad conserva su límite de autenticación independiente.</p>${tabs}</section><section class="scout-module-host" aria-label="Scout functional workspace"><iframe id="scout-functional-module" class="scout-module-frame" title="Scout" src="${esc(scoutModuleSource(view, params))}" data-scout-module="functional-runtime" referrerpolicy="same-origin"></iframe></section>`;
}
function receiveScoutModuleMessage(event) {
  if (event.origin !== window.location.origin || event.data?.type !== 'KABUBY_SCOUT_MODULE_HEIGHT') return;
  const frame = document.querySelector('#scout-functional-module');
  if (!frame || event.source !== frame.contentWindow) return;
  const height = Number(event.data.height);
  if (Number.isFinite(height) && height >= 640 && height <= 20000) frame.style.height = `${Math.ceil(height)}px`;
}
window.addEventListener('message', receiveScoutModuleMessage);

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
function render() { const {page,params}=route(); if (page === 'opportunities' && params.get('view') === 'amazon-ebay') cohortFilter = params.get('cohort') || 'ALL'; document.querySelectorAll('[data-page]').forEach(link => link.classList.toggle('active',link.dataset.page===page)); app.setAttribute('aria-busy',authState==='LOADING'?'true':'false'); app.innerHTML = page==='today'?todayView():page==='scout'?scoutView():page==='search'?searchView(params.get('q')||''):page==='attention'?notificationView():['opportunities','supply','economics','operations','portfolio','learning','settings'].includes(page)?dataPage(page):simpleView(page); wireRenderedControls(); }
function focusSummary() { document.querySelector('.glance')?.scrollIntoView({behavior:'smooth',block:'start'}); }
function wireRenderedControls() {
  app.querySelectorAll('[data-route]').forEach(button => button.addEventListener('click', () => go(button.dataset.route)));
  app.querySelectorAll('[data-period]').forEach(button => button.addEventListener('click', () => { selectedPeriod=button.dataset.period; render(); tell(`Read-only range: ${selectedPeriod}`); }));
  app.querySelectorAll('[data-cohort-filter]').forEach(button => button.addEventListener('click', () => { go('opportunities', { view:'amazon-ebay', cohort:button.dataset.cohortFilter }); }));
  const openOwnerDossier = card => { const asin = card.dataset.ownerDossier; if (/^[A-Z0-9]{10}$/.test(asin || '')) go('opportunities', ownerDossierParams(cohortFilter, asin)); };
  app.querySelectorAll('[data-owner-dossier]').forEach(card => { card.addEventListener('click', event => { if (!event.target.closest('details,button,a,input')) openOwnerDossier(card); }); card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openOwnerDossier(card); } }); });
  app.querySelectorAll('[data-action]').forEach(control => control.addEventListener('click', event => { const action=control.dataset.action; if(action==='reload-projection') { loadProjection().finally(render); return; } if(action==='connect-access') { window.location.assign(`${window.location.pathname}${window.location.search}${window.location.hash}`); return; } if(action==='attention') return go('attention'); if(action==='summary') return focusSummary(); if(action==='explain-evidence') { document.querySelector('.technical-details')?.setAttribute('open',''); document.querySelector('.technical-details')?.scrollIntoView({behavior:'smooth',block:'start'}); return; } }));
}
function cycleLocale() { locale = locale==='auto'?'en':locale==='en'?'es':locale==='es'?'pt':'auto'; try { localStorage.setItem('kabuby-intelligence-locale',locale); } catch {} createNavigation(); updateStaticCopy(); render(); }
function setLocale(next) { locale=next; try { localStorage.setItem('kabuby-intelligence-locale',locale); } catch {} createNavigation(); updateStaticCopy(); render(); document.querySelector('#locale-menu').hidden=true; }

if (postCaptureTarget) {
  window.location.replace(postCaptureTarget);
} else {
  document.querySelector('#ask-kabuby').addEventListener('submit', event => { event.preventDefault(); const query=document.querySelector('#ask-input').value.trim(); go('search',query?{q:query}:{}); });
  localeButton.addEventListener('click', () => { const menu=document.querySelector('#locale-menu'); menu.hidden=!menu.hidden; });
  document.querySelectorAll('[data-locale]').forEach(button=>button.addEventListener('click',()=>setLocale(button.dataset.locale)));
  document.querySelector('#notification-button').addEventListener('click',()=>go('attention'));
  document.querySelector('#owner-account').addEventListener('click',()=>go('account'));
  window.addEventListener('hashchange',render);
  createNavigation(); updateStaticCopy(); render(); loadProjection().finally(render);
}
