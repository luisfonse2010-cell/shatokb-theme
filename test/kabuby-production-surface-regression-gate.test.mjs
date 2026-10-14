import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const gate = JSON.parse(read('kabuby/production-surface-regression-gate.json'));
const portal = read('kabuby/app.js');
const adapter = read('kabuby/scout-owner.js');
const scout = read('kabuby/scout/index.html');

test('CERTIFIED_EXISTING_SURFACE_PRODUCTION_REGRESSION_GATE covers the certified owner surfaces', () => {
  assert.equal(gate.gate, 'CERTIFIED_EXISTING_SURFACE_PRODUCTION_REGRESSION_GATE');
  assert.equal(gate.version, 1);
  assert.match(gate.deployment_rule, /never sufficient/);
  assert.match(gate.failure_policy, /blocks certification/);
  assert.deepEqual(gate.surfaces.map(surface => surface.id), ['HOME', 'OPPORTUNITIES', 'SCOUT', 'SUPPLY', 'ECONOMICS_RISK']);
});

test('Scout owner and compatibility surfaces retain the same read-only browser-store contract', () => {
  const scoutGate = gate.surfaces.find(surface => surface.id === 'SCOUT');
  assert.equal(scoutGate.owner_route, '#scout');
  assert.equal(scoutGate.compatibility_route, '/scout/');
  assert.equal(scoutGate.data_contract, 'SAME_ORIGIN_LOCAL_STORAGE_SHATO_PRODUCTS_READ_ONLY');
  assert.match(portal, /readScoutOwnerSnapshot/);
  assert.match(adapter, /const PRODUCT_KEY = 'shato_products'/);
  assert.match(adapter, /const DISPATCH_KEY = 'shato_despachos'/);
  assert.match(adapter, /owner_surface: '#scout'/);
  assert.match(scout, /localStorage\.getItem\('shato_products'\)/);
  assert.match(scout, /localStorage\.getItem\('shato_despachos'\)/);
  assert.match(scout, /SHATO_AMAZON_PRODUCT/);
  assert.match(scout, /productConsumed/);
  assert.doesNotMatch(adapter, /setItem\(|removeItem\(/);
});

test('the production regression gate forbids Scout storage mutation as part of smoke verification', () => {
  assert.equal(gate.data_safety, 'The gate never initializes, migrates, deletes, or writes Scout browser storage.');
});
