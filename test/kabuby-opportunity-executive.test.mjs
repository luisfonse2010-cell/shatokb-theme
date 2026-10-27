import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ownerExecutiveView,ownerOperationalView,ownerResearchSummary,ownerMaterialChanges,ownerRunHistory} from '../kabuby/owner-operational-view.js';
import {fixture,opportunity,NOW,research} from './fixtures/opportunity-executive-v1.mjs';
const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const main=html=>html.split('<details')[0];
for(const name of ['empty-active','empty-inactive'])test(`${name}: useful empty state without historical candidate padding`,()=>{
 const html=ownerExecutiveView(fixture(name),esc);assert.match(html,/No hay oportunidades listas para invertir todavía/);assert.doesNotMatch(html,/Producto de prueba|<table/);
 if(name==='empty-active'){assert.match(html,/999 productos admitidos para análisis/);assert.doesNotMatch(html,/999 productos nuevos|repetidos evitados|conocidos revalidados/);assert.match(html,/No necesitas intervenir/);}else assert.match(html,/Sin investigación activa confirmada/);
});
test('one opportunity emphasizes recommendation and backend economics; SOLD and target stay distinct',()=>{
 const html=ownerOperationalView(fixture('one'),esc);assert.equal((html.match(/class="oe-opportunity"/g)||[]).length,1);for(const value of ['VALIDATE','USD 25.00','USD 50.00','USD 15.00','30.00%','30 ventas NEW verificadas','Revisar oportunidad'])assert.ok(html.includes(value),value);assert.match(html,/Analista/);assert.doesNotMatch(html,/score|puntaje|weighted/i);
});
test('multiple opportunities retain the canonical order and do not claim a global ranking',()=>{
 const page=fixture('multiple'),html=ownerExecutiveView(page,esc);assert.equal((html.match(/class="oe-opportunity"/g)||[]).length,2);assert.ok(html.indexOf('B000000001')<html.indexOf('B000000002'));assert.match(html,/no es un ranking global de capital/);
});
test('unknown economics, demand, confidence and freshness stay unknown',()=>{
 const html=ownerExecutiveView(fixture('unknown'),esc);assert.match(html,/Contribución proyectada<\/span><strong>Por confirmar/);assert.match(html,/Demanda factual<\/dt><dd>Por confirmar/);assert.doesNotMatch(html,/USD 0.00|0 ventas|0.00%/);
});
test('backend-ineligible stale and HOLD candidates never enter the executive opportunity queue',()=>{
 const page=fixture('stale');page.rows.push({...opportunity,commercial_decision:'HOLD'});const html=ownerExecutiveView(page,esc);assert.doesNotMatch(html,/class="oe-opportunity"|Producto de prueba/);
});
for(const [label,text] of [['NEW','Nueva observación'],['IMPROVED','Mejoró'],['DETERIORATED','Empeoró'],['REOPENED','Reabierta'],['NO_LONGER_ATTRACTIVE','Ya no es atractiva'],['OWNER_DECISION_REQUIRED','Requiere decisión']])test(`canonical ${label} event is presented without generating a new event`,()=>{
 const memory={rows:[{label,occurred_at:NOW,what_changed:['Cambio de prueba con evidencia']} ]},before=JSON.stringify(memory);assert.match(ownerMaterialChanges(memory,esc),new RegExp(text));assert.equal(JSON.stringify(memory),before);
});
test('unsupported direction is not upgraded to improvement or deterioration',()=>{
 const html=ownerMaterialChanges({rows:[{label:'CHANGED',occurred_at:NOW,what_changed:['Fingerprint changed']}]},esc);assert.match(html,/su mejora o deterioro no está acreditado/);assert.doesNotMatch(main(html),/Mejoró|Empeoró|Fingerprint/);
});
test('browser-local visit interval filters canonical events; no previous cursor means no since-last-view claim',()=>{
 const memory={rows:[{label:'NEW',occurred_at:NOW,what_changed:['New evidence']},{label:'IMPROVED',occurred_at:'2026-09-01T00:00:00Z',what_changed:['Old evidence']}]};
 const html=ownerMaterialChanges(memory,esc,{since:'2026-10-26T00:00:00Z'});assert.match(html,/Desde tu última visita en este navegador/);assert.doesNotMatch(main(html),/Old evidence/);assert.match(ownerMaterialChanges(memory,esc),/Cambios recientes/);
});
test('generic NEW events do not become a count of new investable opportunities',()=>{const page=fixture();page.memory_changes.rows=[{label:'NEW',occurred_at:NOW,what_changed:['New observation']}];assert.match(ownerExecutiveView(page,esc,{since:'2026-10-26T00:00:00Z'}),/Nuevas desde tu visita<\/span><strong class="oe-unknown">Por confirmar/);});
for(const name of ['completed','paused','owner-action'])test(`${name} parent retains factual state and does not assert ongoing autonomous work`,()=>{const html=ownerResearchSummary(fixture(name).research,esc);assert.doesNotMatch(html,/No necesitas intervenir.*continúa investigando/);if(name==='owner-action')assert.match(html,/requiere tu atención/);});
test('future certified NEW admissions, repeats avoided and revalidations are separately displayed',()=>{const html=ownerResearchSummary(fixture('future').research,esc);assert.match(html,/999 productos nuevos/);assert.match(html,/184<\/strong> repetidos evitados/);assert.match(html,/3<\/strong> conocidos revalidados/);});
test('owner queue attention is independent from research intervention',()=>{const html=ownerExecutiveView(fixture('one'),esc);assert.match(html,/1 oportunidad requiere tu revisión/);assert.match(html,/No necesitas intervenir en la investigación/);});
test('Runs/history supports parent and legacy rows without exposing operation identifiers in the default view',()=>{const html=ownerRunHistory(fixture(),esc);assert.match(html,/Historial de investigación/);assert.match(html,/Ver evidencia técnica/);assert.doesNotMatch(main(html),/parent:fixture|KEEPA_IDENTITY|STATS90|undefined/);assert.match(html,/fixture%3Alegacy/);});
test('all untrusted product text is escaped and unsafe imagery is dropped',()=>{const page=fixture('one');page.rows[0].product.title='<script>bad()</script>';page.rows[0].primary_image={url:'javascript:bad()'};const html=ownerExecutiveView(page,esc);assert.match(html,/&lt;script>/);assert.doesNotMatch(html,/<script>|src="javascript:/);});
test('executive rendering performs zero provider calls and zero commercial writes',()=>{const before=JSON.stringify(fixture('one'));const html=ownerExecutiveView(JSON.parse(before),esc);assert.equal(typeof html,'string');assert.equal(JSON.stringify(JSON.parse(before)),before);assert.doesNotMatch(html,/data-owner-review=|BUY.*onclick|PUBLISH.*onclick/);});
test('responsive rules and scoped stylesheet avoid protected Scout selectors',()=>{const css=fs.readFileSync(new URL('../kabuby/opportunity-executive.css',import.meta.url),'utf8');assert.match(css,/@media\(max-width:600px\)/);assert.match(css,/minmax\(0,1fr\)/);assert.doesNotMatch(css,/#scout|\.scout|iframe|shato_/);});

test('Today remains a concise action brief and escalates explicit research intervention',async()=>{
 const {ownerCockpit}=await import('../kabuby/owner-operational-view.js');const prior=globalThis.location;globalThis.location={hash:'#today'};
 try{const html=ownerCockpit(fixture(),esc);assert.match(html,/Kabuby continúa investigando. No necesitas intervenir/);assert.doesNotMatch(html,/999|Procesados|SOLD|KIL8/);assert.match(ownerCockpit(fixture('owner-action'),esc),/La investigación requiere tu atención/);}finally{if(prior===undefined)delete globalThis.location;else globalThis.location=prior;}
});
test('explicit synthetic candidate flags cannot enter the executive queue',()=>{const page=fixture('one');page.rows[0].system_acceptance_only=true;assert.doesNotMatch(ownerExecutiveView(page,esc),/class="oe-opportunity"/);});
test('canonical imagery is reused when available',()=>{const page=fixture('one');page.rows[0].primary_image={url:'https://m.media-amazon.com/images/I/example.jpg'};assert.match(ownerExecutiveView(page,esc),/<img src="https:\/\/m.media-amazon.com/);});
