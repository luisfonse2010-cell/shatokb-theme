/*
 * V3 owner dossier interaction layer.
 * app.js is the sole canonical projection. This module only makes each
 * rendered dossier progressively disclosable and never mutates Scout, calls a
 * provider, or derives commercial evidence in the browser.
 */
const app = document.querySelector('#app');
let pendingRefresh = false;
let lastFocusedDossier = '';

function currentRoute() {
  const [page = 'today', query = ''] = location.hash.replace(/^#/, '').split('?');
  return { page: page || 'today', params: new URLSearchParams(query) };
}
function candidateAsin(card) { return (card.textContent.match(/\bB[0-9A-Z]{9}\b/) || [])[0] || ''; }
function currentFilter() { return currentRoute().params.get('cohort') || 'ALL'; }
function moveToCohort(filter = 'ALL', asin = '') {
  const params = new URLSearchParams({ view:'amazon-ebay', cohort:filter });
  if (asin) params.set('asin', asin);
  location.hash = `#opportunities?${params.toString()}`;
}
function installStyles() {
  if (document.querySelector('#v3-owner-dossier-styles')) return;
  const style=document.createElement('style'); style.id='v3-owner-dossier-styles';
  style.textContent=`
  .owner-product-card{display:grid;gap:14px;padding:18px}.owner-product-hero{display:grid;grid-template-columns:112px minmax(0,1fr);gap:15px;align-items:center}.owner-product-hero img,.product-image-placeholder{width:112px;height:112px;border-radius:10px;object-fit:contain;background:#071b2a;border:1px solid rgba(114,182,233,.22)}.product-image-placeholder{display:grid;place-items:center;align-content:center;gap:7px;color:#93b4cf}.product-image-placeholder span{font-size:29px;color:#ffc65b}.product-image-placeholder small{font-size:10px;text-align:center}.owner-product-hero h3{margin:3px 0 6px;font-size:18px}.owner-product-hero p{margin:0;color:#9fb8cd;font-size:12px}.owner-state-row{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}.owner-state,.owner-path{border-radius:99px;padding:5px 8px;font-size:10px;font-weight:800;letter-spacing:.05em}.owner-state{background:#173855;color:#d7eaff}.owner-state-rejected{background:#482333;color:#ffc0c9}.owner-state-hold{background:#56421a;color:#ffe09a}.owner-path{background:#0b263a;color:#83c8f5}.owner-why,.owner-next{margin:0;color:#d6e6f4;line-height:1.5}.owner-assisted-evidence{margin:0;padding:10px;border-left:3px solid #ffc65b;background:rgba(255,198,91,.08);color:#ffe4ab;font-size:12px}.owner-evidence-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:0}.owner-evidence-grid div,.owner-material-risk{border:1px solid rgba(105,177,232,.18);border-radius:8px;padding:9px;background:rgba(2,17,29,.5)}.owner-evidence-grid dt,.advanced-technical-evidence dt{color:#84a4bf;font-size:9px;letter-spacing:.06em;text-transform:uppercase}.owner-evidence-grid dd,.advanced-technical-evidence dd{margin:5px 0 0;color:#edf5fc;font-size:11px;line-height:1.4}.owner-material-risk{display:grid;gap:4px;color:#cce0f1;font-size:12px}.owner-material-risk strong{color:#ffc65b;font-size:10px;letter-spacing:.08em;text-transform:uppercase}.advanced-technical-evidence{border:1px solid rgba(105,177,232,.22);border-radius:8px;padding:10px;color:#a9c4d9}.advanced-technical-evidence summary{cursor:pointer;color:#9fd4f4;font-size:11px;font-weight:800}.advanced-technical-evidence dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:10px 0 0}.interactive-dossier-summary{width:100%;border:0;padding:0;background:none;color:inherit;text-align:left;cursor:pointer}.interactive-dossier-content{padding-top:13px}.interactive-dossier-content[hidden]{display:none}@media(max-width:760px){.owner-evidence-grid,.advanced-technical-evidence dl{grid-template-columns:repeat(2,minmax(0,1fr))}.owner-product-hero{grid-template-columns:84px minmax(0,1fr)}.owner-product-hero img,.product-image-placeholder{width:84px;height:84px}}
  `; document.head.append(style);
}
function decorateDossier(card, selectedAsin) {
  const asin=candidateAsin(card); if(!asin || card.querySelector('.interactive-dossier-summary')) return;
  card.dataset.dossierAsin=asin; card.classList.add('interactive-dossier');
  const content=document.createElement('div'); content.className='interactive-dossier-content';
  while(card.firstChild) content.append(card.firstChild);
  const title=content.querySelector('h3')?.textContent?.trim() || asin;
  const state=card.dataset.ownerState || 'CONTINUE_RESEARCH';
  const summary=document.createElement('button'); summary.type='button'; summary.className='interactive-dossier-summary'; summary.dataset.interactiveDossierOpen=asin;
  summary.innerHTML=`<span class="eyebrow">ASIN ${asin} · ${state.replaceAll('_',' ')}</span><h3>${title}</h3><span class="interactive-dossier-open">Open dossier →</span>`;
  card.append(summary,content);
  const selected=selectedAsin===asin; content.hidden=!selected; card.dataset.dossierOpen=String(selected);
  if(selected && lastFocusedDossier!==asin){lastFocusedDossier=asin;requestAnimationFrame(()=>card.scrollIntoView({block:'start',behavior:'smooth'}));}
}
function enhanceOpportunities(){const {page,params}=currentRoute();if(page!=='opportunities'||params.get('view')!=='amazon-ebay')return;for(const card of app.querySelectorAll('.cohort-dossier'))decorateDossier(card,params.get('asin')||'');}
function refresh(){pendingRefresh=false;if(!app)return;installStyles();enhanceOpportunities();}
function queueRefresh(){if(pendingRefresh)return;pendingRefresh=true;queueMicrotask(refresh);}
if(app){app.addEventListener('click',event=>{const filter=event.target.closest('[data-interactive-cohort-filter]');if(filter){moveToCohort(filter.dataset.interactiveCohortFilter);event.preventDefault();return;}const dossier=event.target.closest('[data-interactive-dossier-open]');if(dossier){moveToCohort(currentFilter(),dossier.dataset.interactiveDossierOpen);event.preventDefault();}},true);new MutationObserver(queueRefresh).observe(app,{childList:true,subtree:true});window.addEventListener('hashchange',queueRefresh);queueRefresh();}
export const FIRST_COHORT_INTERACTION_CONTRACT=Object.freeze({data_source:'CERTIFIED_BROWSER_READ_MODEL_ONLY',provider_calls:0,commercial_mutations:0,scout_runtime:'UNTOUCHED'});
