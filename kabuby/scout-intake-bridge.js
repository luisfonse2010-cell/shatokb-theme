// Compatibility adapter for the pre-existing Chrome Scout import contract.
// It does not persist, normalize, or consume product data. It only keeps the
// existing one-shot query marker intact while the same-origin Scout iframe
// starts, then lets the preserved Scout runtime own the intake.
export function scoutImportFromSearch(search) {
  const params = new URLSearchParams(search || '');
  if (params.get('shato_import') !== '1') return null;
  const forwarded = new URLSearchParams({ shato_import: '1' });
  const product = params.get('shato_data');
  if (product) forwarded.set('shato_data', product);
  return forwarded;
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
