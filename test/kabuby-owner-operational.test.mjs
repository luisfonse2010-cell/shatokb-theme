import test from 'node:test';
import assert from 'node:assert/strict';
import { ownerCockpit, ownerOperationalView } from '../kabuby/owner-operational-view.js';
const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
test('owner cockpit has no investment-ready or routine HOLD owner tasks',()=>{const html=ownerCockpit({ready_for_owner_review_count:0,summary:{VALIDATE:0,HOLD:95,REJECTED:5,CONTINUE_RESEARCH:0,DO_NOT_SPEND:0,verified_new_sold:32}},esc);assert.match(html,/Todavía no hay candidatos listos para invertir/);assert.match(html,/No necesitas actuar sobre los productos en investigación/);assert.match(html,/Listos para revisar<\/small><strong>0/);assert.match(html,/Listos para publicar<\/small><strong>Por confirmar/);const unknown=ownerCockpit({summary:{VALIDATE:null,HOLD:null,CONTINUE_RESEARCH:null,REJECTED:null,DO_NOT_SPEND:null}},esc);assert.match(unknown,/Preparación de inversión por confirmar/);assert.doesNotMatch(unknown,/<strong>0<\/strong>/);});
test('current unavailable state never renders historical product fallback',()=>{const html=ownerOperationalView(null,esc);assert.match(html,/Current opportunities unavailable/);assert.doesNotMatch(html,/Product Finder V3 owner dossiers/);});
test('operational detail retains blockers, next action, UNKNOWN economics and escaped evidence',()=>{const row={asin:'B01F49C0QS',commercial_decision:'HOLD',decision_next_action:'RECONCILE_NATIVE_GTIN_VARIANT_CONFLICT',decision_material_blockers:['EBAY_NATIVE_GTIN_VARIANT_CONFLICT'],product:{title:'<unsafe>'},economic_evaluation:{net_profit:'UNKNOWN',margin:'UNKNOWN',roi:'UNKNOWN',input_evidence:{native_product_research:{state:'VERIFIED_EXACT_NEW_SOLD_REFERENCE',sold_count:3}}}};const page={status:'AVAILABLE',run:{},summary:{total:1},rows:[row]};const html=ownerOperationalView(page,esc,{asin:row.asin});assert.match(html,/&lt;unsafe>/);assert.doesNotMatch(html,/<unsafe>/);assert.match(html,/RECONCILE_NATIVE_GTIN_VARIANT_CONFLICT/);assert.match(html,/Details \/ technical dossier \/ KIL8 \/ TAC \/ evidence/);assert.match(html,/Economía incompleta/);assert.doesNotMatch(html.split('<details class="technical-details">')[0],/RECONCILE_NATIVE_GTIN_VARIANT_CONFLICT|VERIFIED_EXACT_NEW_SOLD_REFERENCE|UNKNOWN/);assert.match(html,/3 ventas NEW verificadas/);assert.match(html,/https:\/\/www.amazon.com\/dp\/B01F49C0QS/);});

test('primary list uses existing safe marketplace helpers, one incomplete economics state and no internal enums',()=>{
 const row={asin:'B01F49C0QS',gtin:'0868453000202',commercial_decision:'HOLD',decision_next_action:'RESEARCH_IN_FUTURE_AUTHORIZED_RUN',decision_material_blockers:['OFFERS20_BUDGET_EXHAUSTED'],product:{title:'Product'},economic_evaluation:{net_profit:'UNKNOWN',margin:'UNKNOWN',roi:'UNKNOWN',risk_state:'RISK_UNKNOWN',input_evidence:{native_product_research:{state:'VERIFIED_EXACT_NEW_SOLD_REFERENCE',sold_count:1}}}};
 const html=ownerOperationalView({status:'AVAILABLE',run:{run_id:'real'},ready_for_owner_review_count:0,summary:{total:100,VALIDATE:0,HOLD:95,REJECTED:5},rows:[row],limit:20,offset:0,total_filtered:95,diversity:{total_asins:100,top_brand:'Owala',top_brand_count:99,top_brand_share_percent:99,unique_parent_groups:3}},esc,{decision:'ALL'});
 assert.match(html,/99 de 100 ASINs son Owala/);assert.match(html,/1 venta NEW verificada/);assert.match(html,/Buscar en eBay por GTIN/);assert.match(html,/_nkw=0868453000202/);assert.match(html,/noopener noreferrer/);assert.doesNotMatch(html,/<td>[^]*?(?:OFFERS20_BUDGET_EXHAUSTED|RESEARCH_IN_FUTURE_AUTHORIZED_RUN|UNKNOWN)/);assert.equal((html.match(/Economía incompleta/g)||[]).length,1);assert.match(html,/No necesitas actuar/);
});

test('unavailable bounds are not advertised as supported ranges and known metrics retain units',()=>{
 const row={asin:'B01F49C0QS',commercial_decision:'HOLD',product:{title:'Real identity'},economic_evaluation:{net_profit:'UNKNOWN',reference_economic_upper_bound:{state:'REFERENCE_UPPER_BOUND_UNAVAILABLE'}}};
 const page={status:'AVAILABLE',run:{},summary:{},rows:[row]};const show=()=>ownerOperationalView(page,esc,{asin:row.asin});
 assert.doesNotMatch(show(),/Límite sustentado/);
 row.economic_evaluation.reference_economic_upper_bound={pre_unknown_cost_profit_upper_minor:-1234};assert.match(show(),/como máximo USD -12.34/);
 row.economic_evaluation.net_profit=1234;row.economic_evaluation.roi=2500;assert.match(show(),/Beneficio USD 12.34/);assert.match(show(),/ROI sobre costo 25.00%/);
});

test('a negative decision never claims active background research',()=>{
 for(const decision of ['REJECTED','DO_NOT_SPEND']){
 const row={asin:'B01F49C0QS',commercial_decision:decision,product:{title:'Persisted negative candidate'},economic_evaluation:{net_profit:'UNKNOWN'}};
 const html=ownerOperationalView({status:'AVAILABLE',run:{},summary:{},rows:[row]},esc,{asin:row.asin});
 assert.match(html,/No necesitas actuar — no continuar con este candidato/);assert.doesNotMatch(html,/investigación en segundo plano/);
 }
});

test('normal owner queue never pads zero eligible opportunities with HOLD/rejected products',()=>{
 const rows=['HOLD','CONTINUE_RESEARCH','REJECTED','DO_NOT_SPEND','INCOMPLETE'].map(commercial_decision=>({asin:'B01F49C0QS',commercial_decision,product:{title:'Background candidate'}}));
 const html=ownerOperationalView({status:'AVAILABLE',run:{},ready_for_owner_review_count:0,summary:{total:100,VALIDATE:0,HOLD:95,REJECTED:5},rows},esc);
 assert.match(html,/Ninguna oportunidad ha superado/);assert.match(html,/100 candidatos analizados/);assert.match(html,/No necesitas actuar/);assert.doesNotMatch(html,/Background candidate|<table/);assert.match(html,/Investigación y auditoría/);
});
