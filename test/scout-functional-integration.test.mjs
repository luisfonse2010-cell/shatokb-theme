import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const app = read('kabuby/app.js');
const scout = read('kabuby/scout/index.html');

test('the canonical owner route mounts the original Scout runtime only after the Access projection is authenticated', () => {
  assert.match(app, /authState !== 'AUTHENTICATED'/);
  assert.match(app, /src="\/scout\/\?embedded=1"/);
  assert.match(app, /KABUBY_SCOUT_OWNER_SESSION/);
  assert.match(app, /location\.origin/);
  assert.doesNotMatch(app, /href="\/scout\/"/);
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
