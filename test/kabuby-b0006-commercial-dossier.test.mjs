import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../kabuby/b0006-commercial-dossier.js', import.meta.url), 'utf8');
const baseline = JSON.parse(readFileSync(new URL('../kabuby/scout-production-baseline-v1.json', import.meta.url), 'utf8'));

test('B0006 uses an isolated dedicated dossier view instead of the cohort grid', () => {
  for (const marker of ['DEDICATED_OWNER_DECISION_VIEW', 'b0006-dedicated-section', 'b0006-hidden-for-dedicated-view', 'b0006-owner-decision-card', '← Volver a oportunidades', "params.delete('asin')", "params.delete('focus')"]) assert.ok(source.includes(marker), marker);
  assert.match(source, /node\.hidden = node !== card/);
  assert.match(source, /querySelector\('\.page-head'\).*b0006-hidden-for-dedicated-view/);
  assert.match(source, /max-width:none!important/);
});

test('B0006 presents the owner commercial hero from certified dossier fields', () => {
  for (const marker of ['AMAZON → EBAY · OWNER DECISION DOSSIER', 'Amazon cost', 'eBay reference', 'Pre-tax profit', 'Margin', 'ROI', 'Break-even', 'Target price', 'TAC', 'ACTIVE LISTING PRICE SCENARIO · NOT SOLD PRICE · DEMAND UNPROVEN', 'WHY KABUBY SAYS VALIDATE', 'WHAT STILL NEEDS PROOF', 'Ver evidencia técnica', 'Ver en Amazon', 'Revisar mercado eBay']) assert.ok(source.includes(marker), marker);
  assert.match(source, /marketMedian\(market\)/);
  assert.match(source, /overflow-wrap:anywhere/);
});

test('B0006 retains evidence in collapsed advanced evidence and forbids enrichment', () => {
  assert.match(source, /<details class="b0006-advanced">/);
  for (const forbidden of ['fetch(', 'XMLHttpRequest', 'api.ebay', 'localStorage.setItem', 'POST']) assert.equal(source.includes(forbidden), false, forbidden);
  assert.match(source, /primary_image: 'UNAVAILABLE_NO_FACTUAL_ASSET'/);
  assert.match(source, /KEEPA_PRODUCT_LOOKUP_REQUIRES_SEPARATE_PROVIDER_CALL/);
  assert.match(source, /provider_calls: 0/);
  assert.match(source, /commercial_mutations: 0/);
});

test('the B0006 presentation remains isolated from Scout', () => {
  assert.match(source, /scout_runtime: 'UNTOUCHED'/);
  assert.equal(baseline.asset_hashes['kabuby/app.js'], '9a5a7be28ca0322dccf2638fbf26816030c8e1de6956ac30f141ff84b5c799d5');
  assert.equal(source.includes('#scout'), false);
});
