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
  assert.match(portal, /\.\/app\.js/);
  assert.match(portal, /assets\/kabuby-reference-logo-mark-v1\.png/);
  assert.match(portalApp, /Kabuby Capabilities/);
  assert.match(portalApp, /Opportunity Radar/);
  assert.match(portalApp, /Shadow Repricer/);
  assert.match(portalApp, /commercial_authority !== 'NONE'/);
});

test('Scout functional runtime is retained with a constrained embedded presentation adapter while the owner route stays in Intelligence OS', () => {
  assert.equal(hash('kabuby/scout/index.html'), 'e9320a045dd8c19a3ecab2041c607d52b1869c628940eab028aefb711dbc39e2');
  for (const label of ['Kabuby Scout', 'Cazador de Arbitraje', 'Price Monitor', 'eBay Connect', 'Radar de Virales', 'Predicción IA', 'SaaS Platform']) assert.match(scout, new RegExp(label));
  assert.match(portalApp, /href="#\$\{key\}"/);
  assert.match(portalApp, /scout-runtime-frame/);
  assert.match(portalApp, /KABUBY_SCOUT_OWNER_SESSION/);
  assert.doesNotMatch(portalApp, /href="\/scout\/"/);
});

test('portal capability inventory is read-only and does not manufacture evidence', () => {
  for (const label of ['Last execution', 'Next execution', 'Data / evidence', 'Current blocker']) assert.match(portalApp, new RegExp(label));
  assert.doesNotMatch(portalApp, /dataforseo|keepa|sociavault|ebay.*fetch|mercado.*fetch|shopify.*fetch/i);
  assert.match(portalApp, /m\.generatedAt/);
  assert.match(portalApp, /t\('today\.notAvailable'\)/);
});
