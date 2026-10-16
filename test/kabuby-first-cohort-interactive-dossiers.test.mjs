import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../kabuby/home-opportunities-interactive.js', import.meta.url), 'utf8');
const app = readFileSync(new URL('../kabuby/app.js', import.meta.url), 'utf8');
const baseline = JSON.parse(readFileSync(new URL('../kabuby/scout-production-baseline-v1.json', import.meta.url), 'utf8'));

test('V3 interaction preserves app.js as the current filter and dossier source', () => {
  for (const marker of ['data-interactive-dossier-open', 'currentFilter()', 'CERTIFIED_BROWSER_READ_MODEL_ONLY', 'provider_calls:0', 'commercial_mutations:0']) assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(source, /cohort_size:/);
  assert.doesNotMatch(source, /ECONOMICS_COMPLETE/);
  assert.doesNotMatch(source, /REJECTED_ECONOMICS/);
});

test('interaction has no transport, economics engine, or Scout integration change', () => {
  for (const forbidden of ['fetch(', 'XMLHttpRequest', 'api.ebay', 'keepa', 'localStorage.setItem', 'POST']) assert.equal(source.includes(forbidden), false, `forbidden interactive transport marker: ${forbidden}`);
  assert.match(source, /scout_runtime:'UNTOUCHED'/);
  assert.equal(source.includes('#scout'), false);
});

test('Scout baseline source remains untouched', () => {
  assert.equal(baseline.asset_hashes['kabuby/app.js'], '9a5a7be28ca0322dccf2638fbf26816030c8e1de6956ac30f141ff84b5c799d5');
  assert.match(app, /const SCOUT_VIEWS/);
});
