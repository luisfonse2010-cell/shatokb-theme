import test from 'node:test';
import assert from 'node:assert/strict';
import {ownerRunHistory,ownerExecutiveView,ownerOperationalView} from '../kabuby/owner-operational-view.js';
import {fixture,NOW} from './fixtures/opportunity-executive-v1.mjs';
const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const visibleText=html=>html.replace(/<[^>]*>/g,' ');
test('Radar and Runs contain no raw object/code markup, even inside disclosure controls',()=>{
 const page=fixture();page.memory_changes.rows=[{label:'CHANGED',occurred_at:NOW,what_changed:['secret operation']}];
 for(const html of [ownerRunHistory(page,esc),ownerExecutiveView(page,esc)]){assert.doesNotMatch(html,/<pre|<code|mission_id|run_id|cohort_id|KEEPA_IDENTITY|provider_request_id|Experto · evidencia/);assert.doesNotMatch(visibleText(html),/parent:fixture|fixture:legacy|secret operation/);}
});
test('active runs lead completed cards and use an explicit live treatment',()=>{
 const page=fixture();page.runs.reverse();const html=ownerRunHistory(page,esc);
 assert.ok(html.indexOf('oe-run--active')<html.indexOf('oe-run--completed'));assert.match(html,/● EN CURSO/);assert.match(html,/999<\/strong> productos admitidos para análisis/);assert.match(html,/No necesitas intervenir/);assert.doesNotMatch(html,/999 productos nuevos/);
});
test('completed cards omit unconfirmed metrics rather than presenting a wall of unknowns',()=>{
 const html=ownerRunHistory({runs:[{state:'COMPLETED',run_id:'old',created_at:NOW,processed:100,opportunities_produced:null}]},esc);
 assert.match(html,/✓ COMPLETADA/);assert.match(html,/100<\/strong> productos analizados/);assert.match(html,/Ver resultados/);assert.doesNotMatch(html,/Por confirmar|oportunidades encontradas|Restantes|Solicitados/);
});
test('unknown active progress stays unknown; technical evidence requires an explicit separate audit action',()=>{
 const html=ownerRunHistory({runs:[{state:'ACTIVE',run_id:'private-run',processed:null,remaining:null,admitted_candidates:null,created_at:NOW}]},esc);
 assert.match(html,/Procesados<\/dt><dd>Por confirmar/);assert.match(html,/Restantes<\/dt><dd>Por confirmar/);assert.doesNotMatch(html,/<dd>0<\/dd>|<details[^>]*open|<pre/);assert.match(html,/target="_blank"/);assert.match(html,/Ver evidencia técnica/);assert.doesNotMatch(visibleText(html),/private-run/);
});
test('attention is strong only when owner intervention is explicit',()=>{
 const html=ownerRunHistory({runs:[{state:'PAUSED',run_id:'a',owner_action_required:false},{state:'OWNER_ACTION_REQUIRED',run_id:'b',owner_action_required:true}]},esc);
 assert.ok(html.indexOf('oe-run--attention')<html.indexOf('oe-run--neutral'));assert.match(html,/REQUIERE TU ATENCIÓN/);assert.match(html,/EN PAUSA/);
});
test('the reused product dossier also removes raw serialized objects from owner HTML',()=>{
 const page=fixture('one');const html=ownerOperationalView(page,esc,{asin:page.rows[0].asin,decision:'ALL'});assert.doesNotMatch(html,/<pre|<code|"run_id"|"economic_evaluation"/);assert.match(html,/Ver evidencia técnica/);
});
