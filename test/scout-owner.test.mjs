import assert from 'node:assert/strict';
import test from 'node:test';
import { legacyScoutImportTarget, readScoutOwnerSnapshot, SCOUT_COMPATIBILITY } from '../kabuby/scout-owner.js';

function storage(values) {
  const reads = [];
  const writes = [];
  return {
    reads, writes,
    getItem(key) { reads.push(key); return values[key] ?? null; },
    setItem(...args) { writes.push(args); },
    removeItem(...args) { writes.push(args); }
  };
}

test('Scout owner adapter reads only the existing sanitized compatibility stores', () => {
  const local = storage({
    shato_products: JSON.stringify([
      { id: 'p-1', asin: 'B012345678', titleAmazon: 'Verified product', status: 'pending', categoryAmazon: 'Skin care', image: 'https://example.test/image.png', priceAmazon: '12.50', priceStore: 24, shipping: 3, stock: 4, sold: 2, buyerName: 'private', apiToken: 'private' },
      { id: 'p-2', titleStore: 'Store product', status: 'approved', nicho: 'Beauty' }
    ]),
    shato_despachos: JSON.stringify([{ id: 'd-1', status: 'queued', channel: 'shopify', customerEmail: 'private' }]),
    shato_config: JSON.stringify({ apiToken: 'private' })
  });
  const snapshot = readScoutOwnerSnapshot(local);
  assert.equal(snapshot.state, 'LOCAL_COMPATIBILITY_READ_ONLY');
  assert.deepEqual(snapshot.counts, { products: 2, pending: 1, inventory: 1, dispatches: 1 });
  assert.deepEqual(snapshot.categories, ['Beauty', 'Skin care']);
  assert.equal(snapshot.products[0].image, 'https://example.test/image.png');
  assert.equal(snapshot.products[0].priceAmazon, 12.5);
  assert.equal(snapshot.products[0].priceStore, 24);
  assert.equal(snapshot.products[0].shipping, 3);
  assert.equal(snapshot.products[0].buyerName, undefined);
  assert.equal(snapshot.products[0].apiToken, undefined);
  assert.equal(snapshot.dispatches[0].customerEmail, undefined);
  assert.deepEqual(local.writes, []);
  assert.deepEqual(local.reads.sort(), ['shato_config', 'shato_despachos', 'shato_products']);
});

test('Scout compatibility contracts retain the legacy endpoint while the owner uses the OS route', () => {
  assert.equal(SCOUT_COMPATIBILITY.route, '/scout/');
  assert.equal(SCOUT_COMPATIBILITY.owner_surface, '#scout');
  assert.deepEqual(SCOUT_COMPATIBILITY.contracts, ['SHATO_AMAZON_PRODUCT', 'chrome.storage.local', 'productConsumed', 'Pendientes handoff']);
});

test('extension imports are deterministically handed to the same-origin legacy runtime', () => {
  const target = legacyScoutImportTarget('https://kabuby.com/?shato_import=1&t=123&shato_data=opaque#scout');
  assert.equal(target, 'https://kabuby.com/scout/?shato_import=1&t=123&shato_data=opaque#pendientes');
  assert.equal(legacyScoutImportTarget('https://kabuby.com/#scout'), null);
});
