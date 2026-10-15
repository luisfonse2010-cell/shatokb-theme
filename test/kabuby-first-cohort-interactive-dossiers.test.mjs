import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../kabuby/home-opportunities-interactive.js', import.meta.url), 'utf8');
const app = readFileSync(new URL('../kabuby/app.js', import.meta.url), 'utf8');
const baseline = JSON.parse(readFileSync(new URL('../kabuby/scout-production-baseline-v1.json', import.meta.url), 'utf8'));

test('first cohort interaction exposes the fixed owner filters and all ten dossiers without a browser economics engine', () => {
  for (const marker of ['ALL', 'VALIDATE', 'REJECTED_ECONOMICS', 'BLOCKED_EBAY_FEE_CATEGORY_UNRESOLVED', 'WHITE_SPACE', 'ECONOMICS_COMPLETE', 'cohort_size: 10', 'filters: Object.freeze({ ALL: 10, VALIDATE: 5, REJECTED_ECONOMICS: 2, BLOCKED: 3, WHITE_SPACE: 3, ECONOMICS_COMPLETE: 7 })']) assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(source, /data-interactive-dossier-open/);
  assert.match(source, /B0006N5S1C/);
  assert.match(source, /ACTIVE LISTING PRICE — NOT SOLD PRICE/);
  assert.match(source, /DEMAND UNPROVEN/);
  assert.match(source, /ORGANIC, PROMOTED 8%, and PROMOTED 10%/);
  assert.match(source, /UNKNOWN/);
});

test('interaction uses only the existing browser read model and never adds enrichment or commercial transport', () => {
  for (const forbidden of ['fetch(', 'XMLHttpRequest', 'api.ebay', 'keepa', 'localStorage.setItem', 'POST']) assert.equal(source.includes(forbidden), false, `forbidden interactive transport marker: ${forbidden}`);
  assert.match(source, /data_source: 'CERTIFIED_BROWSER_READ_MODEL_ONLY'/);
  assert.match(source, /heavy_content_calls: 0/);
  assert.match(source, /provider_calls: 0/);
  assert.match(source, /commercial_mutations: 0/);
});

test('Scout baseline source remains untouched while Home and Opportunities gain progressive disclosure', () => {
  assert.equal(baseline.asset_hashes['kabuby/app.js'], '9a5a7be28ca0322dccf2638fbf26816030c8e1de6956ac30f141ff84b5c799d5');
  assert.match(app, /const SCOUT_VIEWS/);
  assert.match(source, /scout_runtime: 'UNTOUCHED'/);
  assert.equal(source.includes('#scout'), false);
});
