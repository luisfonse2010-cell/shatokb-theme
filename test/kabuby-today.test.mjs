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

test('Scout is preserved byte-for-byte at its dedicated portal route', () => {
  assert.equal(hash('kabuby/scout/index.html'), 'ee811b37c804f2cd7c397037c442ee608dc15f865e54ef7b3f2a0f5d9fb9664f');
  for (const label of ['Kabuby Scout', 'Cazador de Arbitraje', 'Price Monitor', 'eBay Connect', 'Radar de Virales', 'Predicción IA', 'SaaS Platform']) assert.match(scout, new RegExp(label));
  assert.match(portalApp, /href="\/scout\/"/);
});

test('portal capability inventory is read-only and does not manufacture evidence', () => {
  for (const label of ['Last execution', 'Next execution', 'Data / evidence', 'Current blocker']) assert.match(portalApp, new RegExp(label));
  assert.doesNotMatch(portalApp, /dataforseo|keepa|sociavault|ebay.*fetch|mercado.*fetch|shopify.*fetch/i);
  assert.match(portalApp, /m\.generatedAt/);
  assert.match(portalApp, /t\('today\.notAvailable'\)/);
});
