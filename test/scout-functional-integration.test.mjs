import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { embeddedScoutSource, isExtensionProductMessage, routeWithScoutImport, scoutImportFromSearch } from '../kabuby/scout-intake-bridge.js';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const app = read('kabuby/app.js');
const scout = read('kabuby/scout/index.html');

test('the canonical owner route mounts the original Scout runtime only after the Access projection is authenticated', () => {
  assert.match(app, /authState !== 'AUTHENTICATED'/);
  assert.match(app, /embeddedScoutSource\(pendingScoutImport\)/);
  assert.match(app, /KABUBY_SCOUT_OWNER_SESSION/);
  assert.match(app, /location\.origin/);
  assert.doesNotMatch(app, /href="\/scout\/"/);
});

test('the owner shell preserves the extension import marker through the same-origin Scout iframe and then clears only the shell URL', () => {
  const bridge = read('kabuby/scout-intake-bridge.js');
  assert.match(bridge, /params\.get\('shato_import'\) !== '1'/);
  assert.match(bridge, /forwarded\.set\('shato_data', product\)/);
  assert.match(bridge, /return `\/scout\/\?\$\{params\.toString\(\)\}`/);
  assert.match(app, /data-scout-import/);
  assert.match(app, /history\.replaceState\(\{\}, document\.title, `\$\{location\.pathname\}#scout\?view=pendientes`\)/);
  assert.match(app, /pendingScoutImport = null/);
});

test('the shell relays only same-origin extension product messages to the embedded Scout runtime', () => {
  const bridge = read('kabuby/scout-intake-bridge.js');
  assert.match(bridge, /event\.origin === origin/);
  assert.match(bridge, /event\.source === window/);
  assert.match(bridge, /event\.data\.type === 'SHATO_AMAZON_PRODUCT'/);
  assert.match(app, /scoutFrame\.contentWindow\.postMessage\(event\.data, location\.origin\)/);
});

test('query imports force the integrated Scout pending view and retain only the existing import contract for the child frame', () => {
  const pending = scoutImportFromSearch('?shato_import=1&shato_data=synthetic-payload');
  assert.equal(pending.get('shato_import'), '1');
  assert.equal(pending.get('shato_data'), 'synthetic-payload');
  assert.deepEqual(routeWithScoutImport('#today', pending), { page: 'scout', params: new URLSearchParams({ view: 'pendientes' }) });
  assert.equal(embeddedScoutSource(pending), '/scout/?embedded=1&shato_import=1&shato_data=synthetic-payload');
});

test('ordinary hash routing remains unchanged and marker-only compatibility imports remain supported', () => {
  assert.equal(scoutImportFromSearch('?shato_import=0'), null);
  assert.deepEqual(routeWithScoutImport('#scout?view=inventario', null), { page: 'scout', params: new URLSearchParams({ view: 'inventario' }) });
  const markerOnly = scoutImportFromSearch('?shato_import=1');
  assert.equal(embeddedScoutSource(markerOnly), '/scout/?embedded=1&shato_import=1');
});

test('only a same-origin top-window Chrome product event can be relayed', () => {
  const originalWindow = globalThis.window;
  const shellWindow = {};
  globalThis.window = shellWindow;
  try {
    const accepted = { origin: 'https://kabuby.com', source: shellWindow, data: { type: 'SHATO_AMAZON_PRODUCT', product: { asin: 'SYNTHETIC' } } };
    assert.equal(isExtensionProductMessage(accepted, 'https://kabuby.com'), true);
    assert.equal(isExtensionProductMessage({ ...accepted, origin: 'https://elsewhere.example' }, 'https://kabuby.com'), false);
    assert.equal(isExtensionProductMessage({ ...accepted, source: {} }, 'https://kabuby.com'), false);
    assert.equal(isExtensionProductMessage({ ...accepted, data: { type: 'OTHER', product: {} } }, 'https://kabuby.com'), false);
  } finally {
    globalThis.window = originalWindow;
  }
});

test('preserved Scout intake keeps query, legacy extension-stage acknowledgement, normalization, and Pendientes handoff distinct', () => {
  assert.match(scout, /function checkShatoDataParam\(\)/);
  assert.match(scout, /window\._shato_pending_product = product/);
  assert.match(scout, /agregarProductoAlPortal\(rawProd\)/);
  assert.match(scout, /chrome\.storage\.local\.get\(\['shato_pending_product'\]/);
  assert.match(scout, /chrome\.runtime\.sendMessage\(\{ action: 'productConsumed' \}\)/);
  assert.match(scout, /agregarProductoAlPortal\(product\)/);
  assert.match(scout, /showTab\('pendientes'\)/);
});

test('embedded Scout removes only its legacy shell and requires a same-origin parent session handshake', () => {
  assert.match(scout, /SCOUT_EMBED_MODE/);
  assert.match(scout, /data-scout-embedded/);
  assert.match(scout, /\.sidebar,\nhtml\[data-scout-embedded="1"\] \.topbar/);
  assert.match(scout, /event\.origin !== location\.origin/);
  assert.match(scout, /event\.source !== window\.parent/);
  assert.match(scout, /KABUBY_SCOUT_OWNER_SESSION/);
  assert.match(scout, /sessionStorage\.setItem\('shato_auth', '1'\)/);
  assert.match(scout, /!SCOUT_EMBED_MODE && sessionStorage\.getItem\('shato_auth'\)/);
});

test('Scout functional core and Chrome extension contracts remain in the preserved runtime', () => {
  for (const contract of ['SHATO_AMAZON_PRODUCT', 'chrome.storage.local', 'productConsumed', 'shato_products', 'shato_despachos', 'publishToShopify', 'renderPendientes', 'renderInventario', 'renderDespachos', 'saveConfig', 'showNicho']) {
    assert.match(scout, new RegExp(contract.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(scout, /function doLogin\(\)/); // compatibility route retains its historic auth boundary.
});
