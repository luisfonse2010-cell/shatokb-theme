import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const sha256 = value => createHash('sha256').update(value).digest('hex');
const html = read('today/index.html');
const app = read('today/app.js');
const data = read('today/data.js');
const css = read('today/styles.css');
const manifest = JSON.parse(read('today/manifest.json'));

test('Pages Today is an executable Intelligence OS route with canonical Physical lineage', () => {
  assert.match(html, /Kabuby Intelligence OS/);
  assert.match(html, /\.\/app\.js/);
  assert.equal(manifest.source_lineage.physical_intelligence_commit, 'b97730a278521fa0ceb5bfcce6de11d1bf6d8b0e');
  assert.equal(manifest.projection.route, 'https://api.kabuby.com/api/v1/intelligence/physical');
  assert.equal(manifest.projection.commercial_authority, 'NONE');
  assert.equal(manifest.visual_reference.sha256, 'da406ca7d5e559c5f69ac29d0635f0d90342be09d65c15537e42abacbd3a2a49');
  assert.equal(manifest.visual_reference.dimensions, '1536x1024');
});

test('Today is browser-safe, authenticated read-only presentation with explicit evidence states', () => {
  assert.match(data, /https:\/\/api\.kabuby\.com\/api\/v1\/intelligence\/physical/);
  assert.match(app, /method:'GET'/);
  assert.match(app, /commercial_authority !== 'NONE'/);
  assert.match(app, /commercial_actions_enabled !== false/);
  assert.match(app, /WAITING_FOR_EVIDENCE/);
  assert.match(app, /UNKNOWN/);
  assert.match(app, /PARTIAL/);
  assert.match(app, /STALE/);
  assert.match(app, /BLOCKED/);
  assert.doesNotMatch(`${html}\n${app}\n${data}`, /KIL4B_REAL_VALIDATED_SNAPSHOT|18,427|\$4,289|\$2,450/);
  assert.doesNotMatch(`${html}\n${app}\n${data}`, /dataforseo|keepa|sociavault|ebay.*fetch|mercado.*fetch|shopify.*fetch/i);
});

test('Today preserves the required navigation, localization, accessibility, and responsive visual composition', () => {
  for (const label of ['Today', 'Opportunities', 'Scout', 'Supply', 'Economics & Risk', 'Marketplace Operations', 'Portfolio', 'Intelligence & Learning', 'Settings & Policies']) assert.match(`${data}\n${app}`, new RegExp(label));
  for (const locale of ['en:', 'es:', 'pt:']) assert.match(app, new RegExp(locale));
  assert.match(app, /Intl\.DateTimeFormat/);
  assert.match(app, /hourCycle:'h23'/);
  assert.match(html, /<main id="main-content"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(css, /@media\(max-width:860px\)/);
  assert.match(css, /@media\(max-width:620px\)/);
  assert.match(css, /grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/);
  assert.match(css, /overflow-x:hidden/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /visual-hero/);
  assert.match(css, /pulse-rail/);
});

test('Scout remains byte-identical and is only linked as the protected existing surface', () => {
  assert.equal(sha256(read('index.html')), '5b7fae2262c409021d7d251c5feca89abde9f7794c7a93eb7d043af525ad55eb');
  assert.equal(sha256(read('kabuby/index.html')), 'ee811b37c804f2cd7c397037c442ee608dc15f865e54ef7b3f2a0f5d9fb9664f');
  assert.equal(manifest.scout.state, 'PRESERVE_AS_IS_PROTECTED');
  assert.equal(manifest.scout.route, '/');
  assert.match(app, /href="\/"/);
  assert.equal(manifest.scout.source_changes, 0);
  assert.equal(manifest.scout.chrome_extension_changes, 0);
});
