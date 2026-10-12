// Compatibility adapter for the pre-existing Chrome Scout import contract.
// It does not persist, normalize, or consume product data. It only keeps the
// existing one-shot query marker intact while the same-origin Scout iframe
// starts, then lets the preserved Scout runtime own the intake.
export const SCOUT_IMPORT_MAX_PAYLOAD_BYTES = 128 * 1024;

export function scoutImportFromSearch(search) {
  const params = new URLSearchParams(search || '');
  if (params.get('shato_import') !== '1') return null;
  const forwarded = new URLSearchParams({ shato_import: '1' });
  const product = params.get('shato_data');
  if (product) {
    if (product.length > SCOUT_IMPORT_MAX_PAYLOAD_BYTES) return null;
    forwarded.set('shato_data', product);
  }
  return forwarded;
}

export function scoutImportSnapshot(search, now = Date.now()) {
  const pending = scoutImportFromSearch(search);
  if (!pending) return null;
  return Object.freeze({ createdAt: now, search: `?${pending.toString()}` });
}

export function restoreScoutImport(snapshot, now = Date.now(), ttlMs = 10 * 60 * 1000) {
  if (!snapshot || typeof snapshot !== 'object' || !Number.isFinite(snapshot.createdAt)) return null;
  if (snapshot.createdAt > now || now - snapshot.createdAt > ttlMs) return null;
  return scoutImportFromSearch(snapshot.search);
}

// The preserved Scout runtime uses this exact query decoding contract. The
// shell only uses it to request its pre-existing same-origin acknowledgement;
// it never logs, persists server-side, or normalizes the product.
export function decodeScoutImportPayload(pendingImport) {
  const encoded = pendingImport?.get?.('shato_data');
  if (!encoded || encoded.length > SCOUT_IMPORT_MAX_PAYLOAD_BYTES) return null;
  try {
    const product = JSON.parse(decodeURIComponent(escape(atob(encoded))));
    return product && typeof product === 'object' && (product.asin || product.title) ? product : null;
  } catch {
    return null;
  }
}

export function routeWithScoutImport(hash, pendingImport) {
  if (pendingImport) return { page: 'scout', params: new URLSearchParams({ view: 'pendientes' }) };
  const [page = 'today', query = ''] = String(hash || '').replace(/^#/, '').split('?');
  return { page: page || 'today', params: new URLSearchParams(query) };
}

export function embeddedScoutSource(pendingImport) {
  const params = new URLSearchParams({ embedded: '1' });
  if (pendingImport) {
    params.set('shato_import', '1');
    const product = pendingImport.get('shato_data');
    if (product) params.set('shato_data', product);
  }
  return `/scout/?${params.toString()}`;
}

export function isExtensionProductMessage(event, origin) {
  return Boolean(
    event &&
    event.origin === origin &&
    event.source === window &&
    event.data &&
    event.data.type === 'SHATO_AMAZON_PRODUCT' &&
    event.data.product
  );
}

export function isScoutProductReceipt(event, origin, source) {
  return Boolean(
    event &&
    event.origin === origin &&
    event.source === source &&
    event.data?.type === 'SHATO_PRODUCT_RECEIVED' &&
    event.data.ok === true
  );
}
