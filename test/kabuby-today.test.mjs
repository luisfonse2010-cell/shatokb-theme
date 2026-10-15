import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const hash = path => createHash('sha256').update(readFileSync(new URL(`../${path}`, import.meta.url))).digest('hex');
const portal = read('kabuby/index.html');
const portalApp = read('kabuby/app.js');
const scout = read('kabuby/scout/index.html');

test('Kabuby.com is the Intelligence OS portal and retains the reviewed visual entry point', () => {
  assert.match(portal, /Kabuby Intelligence OS/);
  assert.match(portal, /src="\/app\.js"/);
  assert.match(portal, /assets\/kabuby-reference-logo-mark-v1\.png/);
  assert.match(portalApp, /Kabuby Capabilities/);
  assert.match(portalApp, /Opportunity Radar/);
  assert.match(portalApp, /Shadow Repricer/);
  assert.match(portalApp, /commercial_authority !== 'NONE'/);
});

test('Scout owner route hosts the native functional runtime without a second shell or login', () => {
  for (const runtimeCapability of ['product-card-img', 'price-amazon', 'editProduct', 'f-category-amazon', 'publishToShopify', 'SHATO_AMAZON_PRODUCT', 'shato_import']) assert.match(scout, new RegExp(runtimeCapability));
  assert.match(portalApp, /scout-functional-module/);
  assert.match(portalApp, /data-scout-module="functional-runtime"/);
  assert.match(portalApp, /integrated/);
  assert.doesNotMatch(portalApp, /scout-product-card/);
  assert.doesNotMatch(portalApp, /readScoutOwnerSnapshot/);
  assert.match(scout, /window\.self !== window\.top/);
  assert.match(scout, /window\.top\.location\.origin === window\.location\.origin/);
  assert.match(scout, /body\.scout-module-host \.sidebar/);
  assert.match(scout, /body\.scout-module-host #login-screen/);
});

test('portal capability inventory is read-only and does not manufacture evidence', () => {
  for (const label of ['Last execution', 'Next execution', 'Data / evidence', 'Current blocker']) assert.match(portalApp, new RegExp(label));
  assert.doesNotMatch(portalApp, /dataforseo|keepa|sociavault|ebay.*fetch|mercado.*fetch|shopify.*fetch/i);
  assert.match(portalApp, /m\.generatedAt/);
  assert.match(portalApp, /t\('today\.notAvailable'\)/);
});
