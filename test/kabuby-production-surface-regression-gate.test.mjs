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
  assert.equal(gate.version, 5);
  assert.match(gate.deployment_rule, /never sufficient/);
  assert.match(gate.failure_policy, /blocks certification/);
  assert.deepEqual(gate.surfaces.map(surface => surface.id), ['HOME', 'OPPORTUNITIES', 'SCOUT', 'SUPPLY', 'ECONOMICS_RISK']);
});

test('Scout owner host and compatibility route retain the functional runtime contract', () => {
  const scoutGate = gate.surfaces.find(surface => surface.id === 'SCOUT');
  assert.equal(scoutGate.owner_route, '#scout');
  assert.equal(scoutGate.compatibility_route, '/scout/');
  assert.equal(scoutGate.data_contract, 'SAME_ORIGIN_LEGACY_SCOUT_RUNTIME_AND_BROWSER_STORAGE');
  assert.equal(scoutGate.owner_runtime, 'NATIVE_SCOUT_FUNCTIONAL_MODULE_HOST');
  assert.match(scoutGate.required.join(' '), /one authenticated Kabuby shell/);
  assert.match(portal, /scout-functional-module/);
  assert.match(portal, /KABUBY_SCOUT_MODULE_HEIGHT/);
  assert.doesNotMatch(portal, /scout-product-card/);
  assert.doesNotMatch(portal, /readScoutOwnerSnapshot/);
  assert.match(portal, /legacyScoutImportTarget/);
  assert.match(portal, /window\.location\.replace\(legacyImportTarget\)/);
  assert.match(adapter, /const PRODUCT_KEY = 'shato_products'/);
  assert.match(adapter, /const DISPATCH_KEY = 'shato_despachos'/);
  assert.match(adapter, /owner_surface: '#scout'/);
  assert.match(scout, /localStorage\.getItem\('shato_products'\)/);
  assert.match(scout, /localStorage\.getItem\('shato_despachos'\)/);
  assert.match(scout, /SHATO_AMAZON_PRODUCT/);
  assert.match(scout, /productConsumed/);
  assert.match(scout, /window\.self !== window\.top/);
  assert.match(scout, /window\.top\.location\.origin === window\.location\.origin/);
  assert.doesNotMatch(adapter, /setItem\(|removeItem\(/);
});

test('the production regression gate forbids Scout storage mutation as part of smoke verification', () => {
  assert.equal(gate.data_safety, 'The gate never initializes, migrates, deletes, or writes Scout browser storage.');
  assert.match(gate.scout_owner_data_path_verification, /same origin/);
  assert.match(gate.scout_owner_data_path_verification, /not a seeded/);
});
