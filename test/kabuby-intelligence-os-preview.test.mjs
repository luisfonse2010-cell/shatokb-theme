import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const sha256 = value => createHash('sha256').update(value).digest('hex');
const html = read('kabuby/today/index.html');
const app = read('kabuby/today/app.js');
const data = read('kabuby/today/data.js');
const css = read('kabuby/today/styles.css');
const manifest = JSON.parse(read('kabuby/today/manifest.json'));

test('Pages Today is an executable Intelligence OS route with canonical Physical lineage', () => {
  assert.match(html, /Kabuby Intelligence OS/);
  assert.match(html, /\.\/app\.js/);
  assert.equal(manifest.source_lineage.physical_intelligence_commit, 'b97730a278521fa0ceb5bfcce6de11d1bf6d8b0e');
  assert.equal(manifest.projection.route, '/api/v1/intelligence/physical');
  assert.equal(manifest.projection.commercial_authority, 'NONE');
  assert.equal(manifest.projection.credentials, 'same-origin');
  assert.equal(manifest.projection.gateway.binding, 'PHYSICAL_PROJECTION');
  assert.equal(manifest.visual_reference.sha256, 'da406ca7d5e559c5f69ac29d0635f0d90342be09d65c15537e42abacbd3a2a49');
  assert.equal(manifest.visual_reference.dimensions, '1536x1024');
  assert.equal(manifest.visual_assets.owner_reference_logo_mark.path, './assets/kabuby-reference-logo-mark-v1.png');
  assert.equal(manifest.visual_assets.canonical_favicon, './favicon.png');
  assert.match(html, /rel="icon" type="image\/png" href="\.\/favicon\.png"/);
  assert.equal(sha256(readFileSync(new URL('../kabuby/today/favicon.png', import.meta.url))), manifest.visual_assets.owner_reference_logo_mark.sha256);
  assert.equal(manifest.visual_assets.owner_reference_logo_mark.sha256, '06c278b04a4addc637a931e4c93e4346440b33959ba46abb4203ee5abb087680');
  assert.equal(manifest.visual_assets.owner_daypart_reference_images.selection, 'LOCAL_DAYPART_ONLY');
  assert.equal(Object.keys(manifest.visual_assets.owner_daypart_reference_images.crops).length, 4);
});

test('Today is browser-safe, authenticated read-only presentation with explicit evidence states', () => {
  assert.match(data, /'\/api\/v1\/intelligence\/physical'/);
  assert.doesNotMatch(data, /api\.kabuby\.com/);
  assert.match(app, /method:'GET'/);
  assert.match(app, /credentials:'same-origin'/);
  assert.match(app, /payload\?\.data\?\.physical/);
  assert.doesNotMatch(app, /target="_blank"[^>]*data-action="connect-access"/);
  assert.match(app, /commercial_authority !== 'NONE'/);
  assert.match(app, /commercial_actions_enabled !== false/);
  assert.match(app, /WAITING_FOR_EVIDENCE/);
  assert.match(app, /UNKNOWN/);
  assert.match(app, /PARTIAL/);
  assert.match(app, /STALE/);
  assert.match(app, /BLOCKED/);
  assert.doesNotMatch(`${html}\n${app}\n${data}`, /KIL4B_REAL_VALIDATED_SNAPSHOT|18,427|\$4,289|\$2,450/);
  assert.doesNotMatch(`${html}\n${app}\n${data}`, /dataforseo|keepa|sociavault|ebay.*fetch|mercado.*fetch|shopify.*fetch/i);
  assert.match(app, /const ownerStateSummary=\[commandState,opportunityState,supplyState\]\.map\(stateLabel\)\.join/);
  assert.match(app, /no\.\*\(canonical\|reviewed\|executive\|supply\|intelligence\)/);
  assert.doesNotMatch(app, /\$\{esc\(`\$\{commandState\}; \$\{opportunityState\}; \$\{supplyState\}`\)\}/);
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
  assert.match(css, /dashboard-grid/);
  assert.match(css, /right-intelligence-rail/);
  for (const asset of ['morning-owner-reference.png', 'afternoon-owner-reference.png', 'evening-owner-reference.png', 'night-owner-reference.png']) assert.match(css, new RegExp(asset));
  assert.match(css, /data-daypart=\"morning\"/);
  assert.match(css, /@media \(min-width: 861px\)/);
  assert.match(html, /assets\/kabuby-reference-logo-mark-v1\.png/);
});

test('Today keeps the approved desktop geometry when evidence is unavailable', () => {
  assert.match(app, /top-opportunity-empty/);
  assert.match(app, /chart-empty/);
  assert.doesNotMatch(app, /<path d="M0,78 C80,72/);
  assert.match(app, /WAITING_FOR_EVIDENCE/);
  assert.match(app, /commercial_actions_enabled !== false/);
});

test('Scout remains byte-identical and is linked without engineering-governance UI', () => {
  assert.equal(sha256(read('index.html')), '5b7fae2262c409021d7d251c5feca89abde9f7794c7a93eb7d043af525ad55eb');
  assert.equal(sha256(read('kabuby/index.html')), 'ee811b37c804f2cd7c397037c442ee608dc15f865e54ef7b3f2a0f5d9fb9664f');
  assert.equal(manifest.scout.state, 'PRESERVE_AS_IS_PROTECTED');
  assert.equal(manifest.scout.route, '/');
  assert.match(app, /href="\/"/);
  assert.doesNotMatch(app, /PRESERVE_AS_IS_PROTECTED|PROTECTED CONTRACT|nav-lock/);
  assert.doesNotMatch(app, /<dt>Projection<\/dt>/);
  assert.doesNotMatch(app, /COMMAND_CENTER_PROJECTION_CONTRACT|PROJECTION_UI_CONTRACT|GATE1_CF_ACCESS/);
  assert.equal(manifest.scout.source_changes, 0);
  assert.equal(manifest.scout.chrome_extension_changes, 0);
});
