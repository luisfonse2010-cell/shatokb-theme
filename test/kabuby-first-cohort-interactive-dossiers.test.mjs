import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import test from 'node:test';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const app = read('kabuby/app.js');
const data = read('kabuby/data.js');
const index = read('kabuby/index.html');
const scope = JSON.parse(read('kabuby/release-scope-declaration.json'));
const scoutScope = JSON.parse(read('kabuby/scout-scope-exception.json'));

const escaped = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('each V3 card has a native exact-ASIN dossier route and keyboard-equivalent navigation', () => {
  for (const marker of ['data-owner-dossier', 'role="link"', 'tabindex="0"', 'openOwnerDossier', "event.key === 'Enter'", "event.key === ' '", 'ownerDossierParams', "view:'amazon-ebay', cohort:filter, asin"]) {
    assert.match(app, new RegExp(escaped(marker)));
  }
  assert.match(app, /exactV3Candidate\(m, asin\)/);
  assert.match(app, /\^\[A-Z0-9\]\{10\}\$/);
  assert.match(app, /candidate\?\.asin === exact/);
  assert.doesNotMatch(app, /find\(candidate => candidate\?\.title/);
  assert.doesNotMatch(app, /similarity|nearest|index ===/i);
});

test('the dedicated dossier preserves context and never reuses a generic card by position', () => {
  for (const marker of ['data-owner-dossier-view', "params.get('asin')", "params.get('cohort')", "new URLSearchParams({ view:'amazon-ebay', cohort:filter })", 'ownerDossier(exact, filter)', 'noProduct']) {
    assert.match(app, new RegExp(escaped(marker)));
  }
  assert.match(app, /requested \? \(exact \? ownerDossier\(exact, filter\)/);
});

test('V3 dossiers render owner-decision evidence with explicit truth states and collapsed technical material', () => {
  for (const marker of ['Current decision', 'Why this state', 'Amazon evidence', 'eBay evidence', 'Material unknowns', 'Risks', 'Next permitted research', 'Advanced technical evidence', 'FACTUAL', 'ESTIMATE', 'SCENARIO', 'UNKNOWN', 'READ ONLY · COMMERCIAL ACTIONS BLOCKED']) {
    assert.match(app, new RegExp(escaped(marker)));
  }
  for (const marker of ['amazon_price', 'selected_acquisition_price', 'amazon_purchasable_offer', 'PURCHASABLE_NEW_OFFER_CONFIRMED', 'pre_tax_acquisition_cost', 'ebay_active_listing_price_evidence', 'outbound_shipping_policy', 'packaging_cost', 'estimated_landed_cost', 'tac']) assert.match(app, new RegExp(escaped(marker)));
  assert.match(app, /activeNotSold/);
  assert.match(app, /Number\.isFinite\(amount\(acquisitionPrice\)\) \? `\$\{acquisitionPrice\.currency/);
  assert.match(app, /UNKNOWN\|UNPROVEN\|NOT_PROVEN/);
});

test('the root cache-bust reference is the exact V3 module bytes', () => {
  const appHash = createHash('sha256').update(app).digest('hex');
  assert.match(index, new RegExp(`/app\\.js\\?v=${appHash}`));
});

test('the generic legacy Amazon-to-eBay projection is removed from the native page and legacy adapter is gone', () => {
  assert.doesNotMatch(data, /home-opportunities-interactive/);
  assert.match(app, /if \(page === 'opportunities' && id === 'amazon-ebay'\)/);
  assert.match(app, /return `\$\{authBanner\(\)\}.*\$\{content\}.*\$\{lockedActions\(\)\}/s);
  assert.match(app, /return `\$\{authBanner\(\)\}.*\$\{sectionRows\(rows,label\)\}/s);
  assert.match(scope.files_contracts_affected.join('\n'), /kabuby\/home-opportunities-interactive\.js/);
});

test('the narrowly declared scope preserves Scout and forbids provider or commercial work', () => {
  assert.equal(scoutScope.mission, 'KABUBY_PRODUCTION_TRUTH_RECONCILIATION');
  assert.deepEqual(scoutScope.files_contracts_affected.sort(), ['.github/workflows/kabuby-foundation-ci.yml', 'kabuby/app.js', 'kabuby/index.html', 'kabuby/styles.css', 'test/kabuby-scout-production-baseline.test.mjs']);
  assert.match(data, /b0006-commercial-dossier/);
  assert.doesNotMatch(app, /api\.ebay|keepa|dataforseo|fetch\([^)]*(?:POST|PUT|PATCH|DELETE)/i);
  assert.match(app, /BUY · BLOCKED/);
  assert.match(app, /PUBLISH · BLOCKED/);
});

test('owner dossier keeps distinct source shipping, tax, rank, fee, and field-level lineage without inventing a complete commercial outcome', () => {
  for (const marker of ['amazonSourceShipping', 'amazonTax', 'currentSalesRank', 'avg90SalesRank', 'ebayBaseFee', 'ebayFixedFee', 'ebaySurcharge', 'evidenceObserved', 'Amazon purchasable offer observation', 'eBay category observation', 'eBay active-market observation', 'eBay base-fee policy']) {
    assert.match(app, new RegExp(escaped(marker)));
  }
  assert.doesNotMatch(app, /\[v3\('shippingTax'\),/);
  assert.match(app, /cohortDecision\(candidate\) === 'REJECTED_ECONOMICS'/);
  assert.match(app, /No comprar: solo revisar si aparece evidencia nueva de costo, precio vendido o demanda/);
  assert.match(app, /Recargo por desempeño del vendedor desconocido/);
});

test('Spanish owner dossiers keep rank context and unresolved evidence readable without exposing codes', () => {
  for (const marker of ['salesRankContext', 'No fue devuelto por la evidencia certificada', 'Conflicto de categoría exacta', 'Investigación asistida sin resultados certificados', 'SOLO LECTURA · ACCIONES COMERCIALES BLOQUEADAS']) {
    assert.match(app, new RegExp(escaped(marker)));
  }
  assert.match(app, /activeMoney\(active\.median\)/);
  assert.match(app, /UNKNOWN\|UNPROVEN\|NOT_PROVEN\|NOT_VALIDATED/);
  assert.match(app, /ownerEvidenceValue\(candidate\.ebay_category/);
});

test('Spanish V3 route copy localizes marketplace navigation without changing the exact destination', () => {
  for (const marker of ['Buscar en eBay por GTIN exacto', 'Ruta especializada de marketplace con identidad primero', 'localizedDescription']) {
    assert.match(app, new RegExp(escaped(marker)));
  }
  assert.match(app, /ebay\.url/);
  assert.match(app, /data-ebay-navigation/);
});
