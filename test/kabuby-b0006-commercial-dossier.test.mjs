import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../kabuby/b0006-commercial-dossier.js', import.meta.url), 'utf8');
const baseline = JSON.parse(readFileSync(new URL('../kabuby/scout-production-baseline-v1.json', import.meta.url), 'utf8'));

test('B0006N5S1C has a focused commercial dossier using only certified dossier fields', () => {
  for (const marker of ['B0006N5S1C', 'Primary image unavailable', 'Ver en Amazon', 'Revisar mercado eBay', 'COMMERCIAL SUMMARY', 'PRE-TAX', 'Break-even / target / TAC', 'KABUBY DECISION', 'RISK / EVIDENCE', 'Ver evidencia detallada', 'ACTIVE LISTING PRICE — NOT SOLD PRICE', 'UNPROVEN']) assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(source, /https:\/\/www\.amazon\.com\/dp\/\$\{PRODUCT_ASIN\}/);
  assert.match(source, /https:\/\/www\.ebay\.com\/sch\/i\.html/);
});

test('B0006 commercial presentation does not add heavy enrichment, providers, or commercial writes', () => {
  for (const forbidden of ['fetch(', 'XMLHttpRequest', 'api.ebay', 'keepa', 'localStorage.setItem', 'POST']) assert.equal(source.includes(forbidden), false, `forbidden transport marker: ${forbidden}`);
  assert.match(source, /primary_image: 'UNAVAILABLE_NO_FACTUAL_ASSET'/);
  assert.match(source, /heavy_content_calls: 0/);
  assert.match(source, /provider_calls: 0/);
  assert.match(source, /commercial_mutations: 0/);
});

test('the B0006 view is explicitly isolated and leaves the Scout baseline untouched', () => {
  assert.match(source, /params\.get\('asin'\) !== PRODUCT_ASIN/);
  assert.match(source, /scout_runtime: 'UNTOUCHED'/);
  assert.equal(baseline.asset_hashes['kabuby/app.js'], '9a5a7be28ca0322dccf2638fbf26816030c8e1de6956ac30f141ff84b5c799d5');
  assert.equal(source.includes('#scout'), false);
});
