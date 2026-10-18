// Presentation only: certified decisions, evidence and navigation remain canonical.
import { exactAmazonProductNavigation, ebayEvidenceNavigation } from './v3-capability-contract.js';
const decisions={VALIDATE:'Lista para revisión',HOLD:'En investigación',CONTINUE_RESEARCH:'En investigación',REJECTED:'Descartada',DO_NOT_SPEND:'No invertir',INCOMPLETE:'Evaluación pendiente',CURRENT:'Oportunidades listas para revisión',ALL:'Todos',ACTIONABLE:'Lista para revisión'};
const explanations={
 AMAZON_PURCHASE_PRICE_UNKNOWN:'Falta confirmar el costo actual en Amazon.',
 AMAZON_PURCHASE_TAX_UNKNOWN:'El impuesto de compra todavía puede cambiar la rentabilidad.',
 AMAZON_TO_OWNER_SHIPPING_UNKNOWN:'Falta confirmar el envío desde Amazon.',
 INBOUND_SHIPPING_UNKNOWN:'Falta confirmar el envío de compra.',
 UNIT_ACQUISITION_COST_UNKNOWN:'El costo total de adquisición está pendiente.',
 EBAY_CATEGORY_CONFLICT:'Kabuby necesita confirmar la categoría correcta de eBay.',
 RESOLVE_EXACT_EBAY_CATEGORY_CONFLICT:'Confirmar la categoría correcta de eBay.',
 EBAY_NATIVE_GTIN_VARIANT_CONFLICT:'Las referencias de eBay tienen un conflicto de variante.',
 RECONCILE_NATIVE_GTIN_VARIANT_CONFLICT:'Comprobar que la variante de eBay sea la misma.',
 OFFERS20_BUDGET_EXHAUSTED:'La investigación adicional quedó pendiente para otro ciclo autorizado.',
 RESEARCH_IN_FUTURE_AUTHORIZED_RUN:'Esperar otro ciclo de investigación autorizado.',
 EBAY_DEMAND_UNPROVEN:'Todavía no hay ventas verificadas suficientes.',
 EBAY_EXPECTED_SOLD_PRICE_UNKNOWN:'Falta una referencia de venta verificable en eBay.',
 PROPOSED_SELLING_PRICE_UNKNOWN:'El precio de venta todavía no está sustentado.',
 EBAY_SELLER_PERFORMANCE_SURCHARGE_UNKNOWN:'Falta confirmar el recargo de eBay de la cuenta.',
 OTHER_SUPPORTED_COSTS_UNKNOWN:'Quedan costos materiales por confirmar.',
 EBAY_FEE_PROFILE_UNKNOWN:'Falta confirmar las comisiones de eBay.',
 MARKETPLACE_FEE_BASIS_POINTS_UNKNOWN:'La comisión aplicable está pendiente.',
 PAYMENT_FEE_UNKNOWN:'Falta confirmar la comisión de pago.',
 RETURNS_RESERVE_UNKNOWN:'La reserva por devoluciones está pendiente.',
 EBAY_CHARGEABLE_ORDER_TOTAL_REQUIRED:'Falta el total del pedido sujeto a comisiones.',
 EBAY_FEE_SCENARIO_BASIS_REQUIRED:'Falta confirmar la base de las comisiones.',
 AMAZON_COMMERCIAL_STRENGTH_NOT_SUPPORTED:'La evidencia actual no justifica continuar con este producto.',
 AMAZON_COMMERCIAL_STRENGTH_SUPPORTED_AND_EBAY_MARKET_EVALUATION_REQUIRED:'Falta completar la evaluación del mercado eBay.',
 RESOLVE_AMAZON_COMMERCIAL_STRENGTH:'Completar la evaluación comercial de Amazon.',
 RESEARCH_EXACT_AMAZON_PURCHASABLE_OFFER:'Confirmar una oferta exacta disponible para compra en Amazon.',
 RESEARCH_AMAZON_PURCHASE_TAX:'Confirmar el impuesto de compra.',
 RESOLVE_EXACT_PRODUCT_IDENTITY:'Confirmar la identidad exacta del producto.',
 CURRENT_QUOTE_AND_SOLD_REFERENCE_BELOW_MINIMUM_MARGIN:'El costo observado y la referencia de venta no alcanzan el margen requerido.',
 OWNER_RESEARCH_STOP_SPENDING:'La política de investigación indica no gastar más.',
 NO_FURTHER_RESEARCH:'Sin investigación adicional para este candidato.',
 NO_FURTHER_RESEARCH_CURRENT_QUOTE_AND_REFERENCE:'No continuar con el costo y referencia actuales.',
 NO_PURCHASABLE_NEW_OFFER_OBSERVED:'No se observó una oferta nueva disponible para compra.',
 UNIVERSAL_IDENTIFIER_UNKNOWN:'Falta confirmar el identificador del producto.',
 OUTBOUND_SHIPPING_UNKNOWN:'Falta confirmar el envío al comprador.',
 OWNER_TO_EBAY_BUYER_SHIPPING_UNKNOWN:'Falta confirmar el envío al comprador.',
 FACTUAL_ECONOMICS_AND_MATERIAL_GATES_VALIDATED:'Superó los filtros factuales de economía, demanda, identidad y riesgo. Requiere revisión; no garantiza beneficio.',
 REVIEW_CONTROLLED_VALIDATION:'Revisar si preparar una validación comercial controlada.',
 MATERIAL_EVIDENCE_NOT_CERTIFIED:'La evidencia material todavía está incompleta.'
};
export const ownerExplanation=code=>explanations[code] || 'Kabuby necesita completar una verificación; consulta el detalle técnico.';
export function ownerOperationalView(page, esc, query = {}) {
 if (!page || page.status !== 'AVAILABLE') return `<section class="section"><h2>Current opportunities unavailable</h2><p>No hay un run canónico disponible.</p><a href="#opportunities?view=amazon-ebay&archive=1">Archivo histórico</a></section>`;
 const safe=v=>esc(v===null||v===undefined?'No confirmado':typeof v==='object'?JSON.stringify(v):String(v));
 const money=v=>typeof v==='number'&&Number.isFinite(v)?`USD ${(v/100).toFixed(2)}`:'Por confirmar';
 const link=patch=>'#opportunities?'+new URLSearchParams({view:'amazon-ebay',run:page.run.run_id,...query,...patch});
 const s=page.summary || {}, rows=page.rows || [],d=page.diversity,readyCount=page.ready_for_owner_review_count ?? 'UNKNOWN';
 const reviewActions=r=>r.commercial_decision==='VALIDATE'&&r.review_eligible===true&&page.review_actions_available?`<div class="owner-review-actions">${[['APPROVE','Aprobar preparación'],['WATCH','Observar'],['REJECT','Descartar']].map(([action,label])=>`<button type="button" data-owner-review="${action}" data-review-asin="${safe(r.asin)}">${label}</button>`).join('')}<small>Usa tu sesión humana del API; la vista del portal sigue siendo de solo lectura. <a href="https://api.kabuby.com/api/v1/intelligence/physical?limit=1" target="_blank" rel="noopener noreferrer">Verificar sesión del API</a></small></div>`:'';
 const navigation=r=>{const a=exactAmazonProductNavigation(r.asin),b=ebayEvidenceNavigation(r);return `<nav class="owner-evidence-navigation" aria-label="Marketplaces">${a?`<a data-amazon-exact-navigation href="${safe(a)}" target="_blank" rel="noopener noreferrer">Ver en Amazon ↗</a>`:''}${b?`<a data-ebay-navigation href="${safe(b.url)}" target="_blank" rel="noopener noreferrer">${b.kind==='EXACT_EVIDENCE'?'Ver evidencia eBay':'Buscar en eBay por GTIN'} ↗</a>`:''}</nav>`;};
 const native=r=>r.economic_evaluation?.input_evidence?.native_product_research || {};
 const demand=r=>{const n=native(r);return n.state==='VERIFIED_EXACT_NEW_SOLD_REFERENCE'&&Number.isInteger(n.sold_count)&&n.sold_count>0?`${n.sold_count} ${n.sold_count===1?'venta NEW verificada':'ventas NEW verificadas'}`:'Sin ventas verificadas todavía';};
 const primaryBlockers={RECONCILE_NATIVE_GTIN_VARIANT_CONFLICT:'EBAY_NATIVE_GTIN_VARIANT_CONFLICT',RESOLVE_EXACT_EBAY_CATEGORY_CONFLICT:'EBAY_CATEGORY_CONFLICT',RESEARCH_IN_FUTURE_AUTHORIZED_RUN:'OFFERS20_BUDGET_EXHAUSTED',RESEARCH_EXACT_AMAZON_PURCHASABLE_OFFER:'AMAZON_PURCHASE_PRICE_UNKNOWN',RESEARCH_AMAZON_PURCHASE_TAX:'AMAZON_PURCHASE_TAX_UNKNOWN'};
 const blocker=r=>ownerExplanation(r.decision_material_blockers?.includes(primaryBlockers[r.decision_next_action])?primaryBlockers[r.decision_next_action]:r.decision_material_blockers?.[0] || r.decision_reason);
 const next=r=>ownerExplanation(r.decision_next_action);
 const percent=v=>typeof v==='number'&&Number.isFinite(v)?safe((v/100).toFixed(2))+'%':'Por confirmar';
 const economics=r=>{const e=r.economic_evaluation || {},b=e.input_evidence?.supported_economic_bounds;
  if(typeof e.net_profit==='number'&&Number.isFinite(e.net_profit))return `<strong>Beneficio ${money(e.net_profit)}</strong><small>Margen ${percent(e.margin)}</small><small>ROI sobre costo ${percent(e.roi)}</small>`;
  if(Number.isFinite(b?.profit_minor?.low)&&Number.isFinite(b?.profit_minor?.high))return `<strong>Beneficio sustentado ${money(b.profit_minor.low)} – ${money(b.profit_minor.high)}</strong><small>Rango sustentado; no beneficio exacto.</small><small>Margen ${percent(b.margin_basis_points?.low)} – ${percent(b.margin_basis_points?.high)}</small>`;
  return '<strong>Economía incompleta</strong>';
 };

 const risk=r=>r.economic_evaluation?.risk_state==='RISK_ACCEPTABLE'?'Riesgo evaluado':r.economic_evaluation?.risk_state==='RISK_BLOCKED'?'Riesgo bloqueante':'Riesgo pendiente de evaluar';
 const attention=r=>r.commercial_decision==='VALIDATE'?'Requiere tu revisión.':['REJECTED','DO_NOT_SPEND'].includes(r.commercial_decision)?'No necesitas actuar — no continuar con este candidato.':'No necesitas actuar — investigación en segundo plano.';
 const normalQueue=!query.decision || ['CURRENT','VALIDATE','ACTIONABLE'].includes(query.decision);
 const queueHeader=`<section class="section owner-operational owner-ready-queue"><p class="eyebrow">OPORTUNIDADES PARA REVISIÓN COMERCIAL</p><h2>${readyCount===0?'Ninguna oportunidad ha superado todavía todos los filtros comerciales.':'Oportunidades listas para tu revisión'}</h2><p><strong>${safe(readyCount)} oportunidades listas para revisión.</strong></p><p>Última ejecución: <strong>${safe(s.total)} candidatos analizados.</strong> ${safe(s.HOLD)} siguen sin demostrar viabilidad comercial o están bloqueados; ${safe(s.REJECTED)} se descartaron.</p><p><strong>${readyCount===0?'No necesitas actuar. Kabuby conserva la investigación en segundo plano.':'Revisa la evidencia y decide si preparar el siguiente paso.'}</strong></p><p>Una recomendación sustentada no garantiza beneficio. No se habilitan compras ni publicaciones.</p><a href="${safe(link({decision:'ALL',offset:'0',asin:''}))}">Investigación y auditoría · superficie secundaria</a> · <a href="#opportunities?view=runs">Historial de ejecuciones</a></section>`;
 const header=`<section class="section owner-operational"><p class="eyebrow">COHORT ACTUAL · SOLO LECTURA</p><h2>Amazon → eBay</h2><p><strong>${safe(s.total)} ASINs</strong> · ${safe(s.VALIDATE)} listas para revisión · ${safe(s.HOLD)} en investigación · ${safe(s.REJECTED)} descartadas</p>${d?`<p class="owner-concentration"><strong>Concentración: ${safe(d.top_brand_count)} de ${safe(d.total_asins)} ASINs son ${safe(d.top_brand)} (${safe(d.top_brand_share_percent)}%).</strong> ${safe(d.unique_parent_groups)} grupos padre Amazon; no equivalen a familias comerciales intercambiables. Tamaño y configuración pendientes de verificar.</p>`:''}<div class="cohort-filters" aria-label="Filtros comerciales">${['CURRENT','ALL','VALIDATE','HOLD','REJECTED'].map(k=>`<a href="${safe(link({decision:k,offset:'0',asin:''}))}"${(query.decision || 'CURRENT')===k?' aria-current="true"':''}>${safe(decisions[k])}${s[k]!==undefined?` (${safe(s[k])})`:''}</a>`).join('')}<a href="${safe(link({demand:'VERIFIED_NEW_SOLD',offset:'0',asin:''}))}">Ventas NEW verificadas (${safe(s.verified_new_sold)})</a><a href="${safe(link({demand:'ALL',offset:'0',asin:''}))}">Toda la evidencia</a></div><p role="status"><strong>${safe(page.total_filtered)} coinciden</strong> · ${safe(decisions[query.decision || 'CURRENT'])}</p><details><summary>Contexto, categorías y procedencia</summary><p>Orden parcial: decisión, ventas NEW verificadas y ASIN para desempatar. Sin ranking de capital certificado.</p>${page.categories?.map(c=>`<a href="${safe(link({category:c.category,offset:'0',asin:''}))}">${safe(c.category)} (${safe(c.total)})</a>`).join(' · ') || ''}<a href="${safe(link({category:'',offset:'0',asin:''}))}">Todas las categorías</a><p>${safe(page.run.run_id)}<br>${safe(page.run.cohort_id)}</p>${d?`<pre>${safe(JSON.stringify(d,null,2))}</pre>`:''}</details><a href="#opportunities?view=runs">Runs / archivo</a></section>`;
 if(normalQueue && !query.asin && !rows.some(r=>r.commercial_decision==='VALIDATE'&&r.review_eligible===true)) return queueHeader;
 if(query.asin){
  const r=rows.find(r=>r.asin===query.asin);if(!r)return header+'<section class="section">Producto fuera del run o de los filtros seleccionados.</section>';
  const e=r.economic_evaluation || {},i=e.input_evidence || {},n=native(r);
  return `<section class="section owner-product-summary"><a href="${safe(link({asin:''}))}">← Volver a la lista</a><p class="eyebrow">${safe(decisions[r.commercial_decision] || decisions.INCOMPLETE)}</p>${r.primary_image?.url?`<img class="owner-product-image" src="${safe(r.primary_image.url)}" alt="${safe(r.product?.title || r.asin)}">`:''}<h2>${safe(r.product?.title || r.asin)}</h2><p>${safe(r.source_product_identity?.brand || '')} · ASIN ${safe(r.asin)}</p><small>Evaluado ${safe(r.decision_at?.slice(0,10))}. Vigencia de costos y evidencia pendiente de verificar.</small><h3>Resumen comercial</h3><p>${blocker(r)}</p><p><strong>${attention(r)}</strong></p>${navigation(r)}${reviewActions(r)}<h3>Qué falta y qué sigue</h3><p>${next(r)}</p><details><summary>Otras verificaciones pendientes (${r.decision_material_blockers?.length || 0})</summary><ul>${(r.decision_material_blockers || []).map(b=>`<li>${safe(ownerExplanation(b))}</li>`).join('')}</ul></details><h3>Economía</h3><div class="owner-economics-summary">${economics(r)}<p>Amazon observado: ${money(i.amazon_acquisition_price_minor)} · eBay: ${money(n.reference_item_price_minor)} (referencia observada).</p></div>${Number.isFinite(e.reference_economic_upper_bound?.pre_unknown_cost_profit_upper_minor)?`<details><summary>Límite sustentado — no es beneficio exacto</summary><p>Beneficio: como máximo ${money(e.reference_economic_upper_bound.pre_unknown_cost_profit_upper_minor)} con el costo y la referencia observados. Quedan costos adicionales pendientes. No es un pronóstico de ventas.</p></details>`:''}<h3>Demanda y evidencia de mercado</h3><p>${demand(r)}. Muestra observada, no pronóstico de ventas.</p><h3>Riesgo</h3><p>${risk(r)}. ${blocker(r)}</p><details class="technical-details"><summary>Details / technical dossier / KIL8 / TAC / evidence</summary><pre>${safe(JSON.stringify(r,null,2))}</pre></details><p>La revisión no autoriza compra ni publicación. Las mutaciones comerciales permanecen bloqueadas.</p></section>`;
 }
 return (normalQueue?queueHeader:header)+`<section class="section owner-operational"><div class="owner-table-wrap"><table class="owner-table"><thead><tr>${['Producto','Estado comercial','Costo observado y referencia','Economía','Demanda y riesgo','Qué falta / siguiente paso'].map(t=>`<th scope="col">${t}</th>`).join('')}</tr></thead><tbody>${rows.filter(r=>!normalQueue || r.commercial_decision==='VALIDATE'&&r.review_eligible===true).map(r=>{const i=r.economic_evaluation?.input_evidence || {},n=native(r);return `<tr><td>${r.primary_image?.url?`<img class="owner-product-thumb" src="${safe(r.primary_image.url)}" alt="" loading="lazy">`:''}<a class="owner-product-name" href="${safe(link({asin:r.asin,...(r.run_id?{run:r.run_id}:{}),decision:'ALL'}))}">${safe(r.product?.title || r.asin)}</a><small>${safe(r.source_product_identity?.brand || '')} · ${safe(r.asin)}</small>${navigation(r)}${reviewActions(r)}</td><td><span class="state-pill">${safe(decisions[r.commercial_decision] || decisions.INCOMPLETE)}</span><small>${attention(r)}</small></td><td>Amazon observado <strong>${money(i.amazon_acquisition_price_minor)}</strong><small>eBay referencia <strong>${money(n.reference_item_price_minor)}</strong></small></td><td>${economics(r)}</td><td title="Muestra observada; no es un pronóstico de ventas.">${demand(r)}<small>Evidencia material ${r.economic_evaluation?.material_blockers?.length?'incompleta':'por confirmar'}</small><small>${risk(r)}</small></td><td>${safe(blocker(r))}<small><strong>${safe(next(r))}</strong></small><a href="${safe(link({asin:r.asin,...(r.run_id?{run:r.run_id}:{}),decision:'ALL'}))}">Ver detalle y evidencia →</a></td></tr>`;}).join('')}</tbody></table></div><p>${safe(page.total_filtered)} coinciden · página ${Math.floor(page.offset/page.limit)+1} · máximo ${safe(page.limit)} productos por página</p><nav aria-label="Opportunity pages">${page.offset>0?`<a href="${safe(link({offset:String(Math.max(0,page.offset-page.limit))}))}">← Anterior</a>`:''} ${page.has_more?`<a href="${safe(link({offset:String(page.offset+page.limit)}))}">Siguiente →</a>`:''}</nav>${rows.length?'':'<p>No hay candidatos coincidentes. Sin datos de sustitución.</p>'}</section>`;
}
export function ownerRunHistory(page, esc) {
  return `<section class="section"><h2>Runs / execution history</h2>${page?.run?`<details open><summary>Selected run: ${esc(page.run.cohort_id)}</summary><p>Processed ${esc(String(page.summary?.total ?? 'UNKNOWN'))} · decisions ${esc(JSON.stringify(page.summary))}</p><p>Provider receipts / calls / tokens: ${esc(JSON.stringify(page.run.provider_consumption ?? 'UNKNOWN'))}</p><p>USD cost: UNKNOWN. Receipt counts are not physical HTTP counts; null tokens mean UNKNOWN.</p></details>`:''}<p>Execution history is separate from current opportunities. Provider consumption is UNKNOWN unless projected from its canonical receipts.</p>${(page?.runs || []).map(r=>`<article class="detail-card"><h3>${esc(r.cohort_id)}</h3><p>${esc(r.run_id)} · ${esc(r.state)} · target ${r.target} · processed ${page?.run?.run_id===r.run_id?esc(String(page.summary?.total ?? 'UNKNOWN')):'UNKNOWN'} · decision distribution ${page?.run?.run_id===r.run_id?esc(JSON.stringify(page.summary)):'UNKNOWN — inspect exact run'}</p><p>${esc(r.created_at)} → ${esc(r.updated_at)} · ${esc(r.stop_reason || r.next_stage)}</p><a href="#opportunities?view=amazon-ebay&run=${encodeURIComponent(r.run_id)}">Inspect exact run</a></article>`).join('')}<a href="#opportunities?view=amazon-ebay&archive=1">Historical Product Finder / Pilot dossiers (archive)</a></section>`;
}
export function ownerCockpit(page, esc) {
  if (!page?.summary) return '';
  const s={...page.summary,VALIDATE:page.ready_for_owner_review_count ?? 'UNKNOWN'};
  const sumKnown=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)?a+b:'UNKNOWN';
  return `<section class="section owner-cockpit"><p class="eyebrow">ESTADO COMERCIAL ACTUAL · AMAZON → EBAY</p><h2>${Number.isFinite(s.VALIDATE)?(s.VALIDATE===0?'Todavía no hay candidatos listos para invertir':'Candidatos listos para tu revisión'):'Preparación de inversión por confirmar'}</h2><div class="metric-grid">${[['Requieren tu atención',s.VALIDATE],['Listos para revisar',s.VALIDATE],['Listos para publicar','Por confirmar'],['Investigación de fondo',sumKnown(s.HOLD,s.CONTINUE_RESEARCH)],['Descartados / no invertir',sumKnown(s.REJECTED,s.DO_NOT_SPEND)],['Con ventas NEW verificadas',s.verified_new_sold]].map(([label,value])=>`<article class="metric"><small>${label}</small><strong>${esc(value===null||value===undefined?'UNKNOWN':String(value))}</strong></article>`).join('')}</div><p>No necesitas actuar sobre los productos en investigación. La revisión prepara un candidato; publicar sigue bloqueado.</p><a href="#opportunities?view=amazon-ebay">Ver oportunidades listas para revisión</a> · <a href="#opportunities?view=runs">Runs / archive</a></section>`;
}

// Existing human-API Decision Memory authority. The portal's read-only binding
// and Access scope are deliberately unchanged. No commercial endpoint is used.
export async function submitOwnerOpportunityReview(row,action,{fetchImpl=fetch,uuid=()=>crypto.randomUUID()}={}) {
 const types={APPROVE:'APPROVE_PLAN_PREPARATION',WATCH:'WATCH',REJECT:'REJECT'};
 if(row?.commercial_decision!=='VALIDATE'||row.review_eligible!==true||!types[action]||!row.run_id||!row.cohort_id||!row.gtin||!row.decision_at)throw new Error('OWNER_REVIEW_NOT_ELIGIBLE');
 const facts={run_id:row.run_id,cohort_id:row.cohort_id,gtin:row.gtin,decision_at:row.decision_at};
 const body={stage:'OWNER_OPPORTUNITY_REVIEW',client_event_id:uuid(),event_type:types[action],identity:{candidate_id:`scale-opportunity:${row.run_id}:${row.asin}:${row.decision_at}`,asin:row.asin,source_system:'AMAZON_EBAY_SCALE',source_external_id:row.run_id},facts};
 const response=await fetchImpl('https://api.kabuby.com/api/v1/memory/decisions',{method:'POST',credentials:'include',redirect:'error',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 if(!response.ok)throw new Error('OWNER_REVIEW_NOT_CONFIRMED');
 const payload=await response.json(),event=payload?.data?.decision_event ?? payload?.decision_event;
 if(!event?.event_id||event.stage!==body.stage||event.event_type!==body.event_type||Object.entries(facts).some(([k,v])=>event.facts?.[k]!==v)||event.facts.publication_authorized!==false||event.facts.commercial_mutations!==0)throw new Error('OWNER_REVIEW_RECEIPT_DENIED');
 return event;
}
export function ownerPreparationView(page,esc) {
 const rows=(page?.reviewed_opportunities || []).filter(r=>r.owner_review_state==='APPROVE_PLAN_PREPARATION');
 return `<section class="section"><h2>Preparación de publicación</h2><p>Las oportunidades aprobadas salen de la cola comercial y pasan al borrador de preparación. La evidencia de listing se valida antes de cualquier avance; aprobar no compra ni publica.</p>${rows.length?rows.map(r=>`<article class="detail-card"><h3>ASIN ${esc(r.asin)}</h3><p>Preparar el paquete de listing. Contenido, atributos, derechos de imágenes, envío y elegibilidad todavía deben acreditarse.</p><p>Borrador · sin autorización de publicación.</p><a href="#opportunities?view=amazon-ebay&decision=ALL&run=${encodeURIComponent(r.run_id || page.run.run_id)}&asin=${encodeURIComponent(r.asin)}">Detalle y evidencia</a></article>`).join(''):'<p>No hay oportunidades aprobadas pendientes de preparación.</p>'}</section>`;
}
