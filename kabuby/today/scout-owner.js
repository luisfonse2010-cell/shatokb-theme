// Owner-facing Scout presentation adapter.
//
// This module deliberately reads the established Scout browser stores without
// writing to them. The legacy runtime at /scout/ remains the compatibility
// endpoint for the Chrome extension and its SHATO_* contracts.
const PRODUCT_KEY = 'shato_products';
const DISPATCH_KEY = 'shato_despachos';
const CONFIG_KEY = 'shato_config';

// The Chrome extension sends an import to the public owner route.  Only the
// established legacy Scout runtime is allowed to consume and persist it; the
// Intelligence OS is deliberately a read-only projection.
export function legacyScoutImportTarget(currentHref) {
  const current = new URL(currentHref);
  if (current.searchParams.get('shato_import') !== '1') return null;
  const target = new URL('/scout/', current.origin);
  target.search = current.search;
  target.hash = '#pendientes';
  return target.toString();
}

const text = (value, limit = 180) => typeof value === 'string' ? value.trim().slice(0, limit) : '';
const list = (storage, key) => {
  try {
    const value = JSON.parse(storage?.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch { return []; }
};
const object = (storage, key) => {
  try {
    const value = JSON.parse(storage?.getItem(key) || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch { return {}; }
};
const numeric = value => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};
const firstImage = value => Array.isArray(value?.images) ? value.images.find(entry => typeof entry === 'string' && entry.trim()) : '';
const product = value => ({
  id: text(value?.id, 80),
  asin: text(value?.asin, 32),
  title: text(value?.titleStore || value?.titleAmazon || value?.title),
  status: text(value?.status, 48) || 'UNKNOWN',
  category: text(value?.categoryAmazon || value?.nicho, 96),
  niche: text(value?.nicho, 64),
  image: text(value?.image || firstImage(value), 600),
  priceAmazon: numeric(value?.priceAmazon),
  priceStore: numeric(value?.priceStore),
  shipping: numeric(value?.shipping),
  stock: numeric(value?.stock),
  sold: numeric(value?.sold),
  description: text(value?.description || value?.desc, 600),
  createdAt: text(value?.createdAt, 48)
});
const dispatch = value => ({
  id: text(value?.id || value?.orderId, 80), status: text(value?.status, 48) || 'UNKNOWN', channel: text(value?.channel, 48), createdAt: text(value?.createdAt || value?.dispatchedAt, 48)
});

export function readScoutOwnerSnapshot(storage = globalThis.localStorage) {
  const products = list(storage, PRODUCT_KEY).map(product).filter(row => row.title || row.asin || row.id);
  const dispatches = list(storage, DISPATCH_KEY).map(dispatch).filter(row => row.id || row.channel);
  const config = object(storage, CONFIG_KEY);
  const categories = [...new Set(products.map(row => row.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  return Object.freeze({
    state: 'LOCAL_COMPATIBILITY_READ_ONLY',
    products: Object.freeze(products),
    dispatches: Object.freeze(dispatches),
    categories: Object.freeze(categories),
    counts: Object.freeze({
      products: products.length,
      pending: products.filter(row => row.status.toLowerCase() === 'pending').length,
      inventory: products.filter(row => !['pending', 'rejected'].includes(row.status.toLowerCase())).length,
      dispatches: dispatches.length
    }),
    configuration: Object.freeze({ available: Object.keys(config).length > 0 })
  });
}

export const SCOUT_COMPATIBILITY = Object.freeze({
  route: '/scout/',
  contracts: Object.freeze(['SHATO_AMAZON_PRODUCT', 'chrome.storage.local', 'productConsumed', 'Pendientes handoff']),
  owner_surface: '#scout'
});
