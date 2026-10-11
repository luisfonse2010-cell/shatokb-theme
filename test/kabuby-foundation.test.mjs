import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const html=readFileSync(new URL('../kabuby/index.html',import.meta.url),'utf8');
const today=readFileSync(new URL('../kabuby/kabuby-today.js',import.meta.url),'utf8');
const fallback=readFileSync(new URL('../kabuby/kabuby-today-fallback.js',import.meta.url),'utf8');
const safety=readFileSync(new URL('../kabuby/physical-safety.js',import.meta.url),'utf8');
const client=readFileSync(new URL('../kabuby/physical-read-client.js',import.meta.url),'utf8');
const arbitrage=readFileSync(new URL('../kabuby/arbitrage/app.js',import.meta.url),'utf8');

test('protected Scout source regions remain byte-identical to the audited baseline',()=>{
  const baseline=execFileSync('git',['show','17b65b2d8dc4f480751378ea419113e80f052021:kabuby/index.html'],{encoding:'utf8'});
  for(const [start,end] of [['<!-- ══ LOGIN','<!-- ══ NOTIFICATIONS'],['<!-- Módulo 1: Kabuby Scout ✅ ACTIVO','<!-- Módulo Cazador de Arbitraje']]){
    const part=value=>value.slice(value.indexOf(start),value.indexOf(end,value.indexOf(start)));
    assert.ok(part(baseline).length>0);assert.equal(part(html),part(baseline));
  }
});

test('legacy modules are hidden or rendered as truthful non-connected states outside Scout',()=>{
  for(const id of ['nav-mod-arbitrage','nav-mod-prices','nav-mod-ebay','nav-mod-ia','nav-mod-saas']) assert.match(safety,new RegExp(id));
  assert.match(safety,/NOT_CONNECTED/);assert.match(safety,/LEGACY_NOT_CONNECTED/);assert.match(safety,/COMING_LATER/);
  assert.match(arbitrage,/Cazador histórico — no conectado/);
  assert.doesNotMatch(arbitrage,/case 'cazador':\s+main\.innerHTML = renderCazador/);
});

test('browser inference and historical MeLi cache are not active truth',()=>{
  assert.doesNotMatch(html,/api\.openai\.com/);assert.doesNotMatch(html,/kabuby_oai_key/);assert.doesNotMatch(html,/raw\.githubusercontent\.com\/luisfonse2010-cell\/shatokb-theme\/main\/kabuby\/meli-data/);
  assert.match(html,/Historical cache is not active Kabuby truth/);
});

test('Today does not retain stale executive data as current state',()=>{
  assert.match(fallback,/STALE_FALLBACK_NOT_CURRENT/);assert.match(fallback,/NO_CURRENT_CERTIFIED_EXECUTIVE_TRUTH/);assert.match(fallback,/writes_allowed: false/);
  assert.doesNotMatch(today,/localStorage\.setItem/);assert.doesNotMatch(today,/last_valid_v1/);assert.match(today,/no cached operational state is presented/);
});

test('shared Physical client is authenticated GET-only and validates read-only authority',()=>{
  assert.match(client,/method: 'GET'/);assert.match(client,/credentials: 'include'/);assert.doesNotMatch(client,/method: '(POST|PUT|PATCH|DELETE)'/);assert.match(client,/PHYSICAL_READ_MODEL_CONTRACT_REJECTED/);assert.match(client,/commercial_authority === 'NONE'/);assert.match(client,/loading.*loaded.*empty.*partial.*stale.*blocked.*error.*unauthorized.*unknown/);
});

test('release governance keeps legacy MeLi refresh archival and records the single Pages path',()=>{
  const workflow=readFileSync(new URL('../.github/workflows/fetch-meli-data.yml',import.meta.url),'utf8');
  const governance=JSON.parse(readFileSync(new URL('../development/frontend-foundation/KABUBY_PAGES_RELEASE_GOVERNANCE_V1.json',import.meta.url),'utf8'));
  assert.doesNotMatch(workflow,/schedule:|contents: write|fetch-meli\.js|git push/);
  assert.deepEqual(governance.authoritative_path,['GITHUB_SOURCE_OF_TRUTH','KABUBY_FOUNDATION_CI','CLOUDFLARE_PAGES_PREVIEW','VALIDATION','EXPLICIT_PRODUCTION_PROMOTION']);
  assert.equal(governance.github_actions_pages_deploy,'NEUTRALIZED_TO_CERTIFICATION_ONLY');
});

test('i18n foundation is loaded without changing protected Scout source',()=>{
  assert.match(html,/<script type="module" src="\.\/i18n\.js"><\/script>/);
});


test('locked Physical product requirements retain specialized Amazon paths and actionable Pages administration steps',()=>{
  const requirements=readFileSync(new URL('../development/frontend-foundation/KABUBY_PHYSICAL_PRODUCT_REQUIREMENTS_V1.md',import.meta.url),'utf8');
  const runbook=readFileSync(new URL('../development/frontend-foundation/KABUBY_PAGES_ADMIN_RUNBOOK_V1.md',import.meta.url),'utf8');
  assert.match(requirements,/Amazon → eBay/);assert.match(requirements,/Amazon → Mercado Libre/);assert.match(requirements,/AUTONOMOUS_PRODUCT_DISCOVERY_24X7 = REQUIRED/);
  assert.match(runbook,/Workers & Pages → Pages/);assert.match(runbook,/Builds & deployments/);assert.match(runbook,/Git integration/);assert.match(runbook,/Deployments/);assert.match(runbook,/Promote/);
});
