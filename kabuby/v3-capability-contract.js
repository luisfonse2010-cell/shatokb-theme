// Presentation helpers for the certified Product Finder V3 owner surface.
// These functions never query providers and accept only exact persisted identity.
export const GOLDEN_V3_ASINS = Object.freeze([
  'B01F49C0QS','B0C7SZSM38','B0CKTZ2PDF','B0CN2Q2C5C','B0CRC73JTS',
  'B0CRC8MQZL','B0CRCB4FTM','B0CV1F1W7K','B0DR9GN2PM','B0DSWW84QJ'
]);

const asin = value => /^[A-Z0-9]{10}$/.test(String(value ?? '')) ? String(value) : null;
const gtin = value => /^\d{8,14}$/.test(String(value ?? '')) ? String(value) : null;
const ebayUrl = value => {
  try {
    const url = new URL(String(value));
    return url.protocol === 'https:' && /(^|\.)ebay\.com$/i.test(url.hostname) ? url.toString() : null;
  } catch { return null; }
};

export function exactAmazonProductNavigation(value) {
  const valueAsin = asin(value);
  return valueAsin ? `https://www.amazon.com/dp/${valueAsin}` : null;
}

export function ebayEvidenceNavigation(candidate = {}) {
  const exact = ebayUrl(candidate.ebay_exact_evidence_url ?? candidate.ebay_item_web_url ?? candidate.ebay_item_url);
  if (exact) return Object.freeze({ kind:'EXACT_EVIDENCE', url:exact, label:'View exact eBay evidence' });
  const valueGtin = gtin(candidate.gtin);
  return valueGtin ? Object.freeze({ kind:'EXACT_GTIN_SEARCH_NAVIGATION', url:`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(valueGtin)}`, label:'Search eBay by exact GTIN' }) : null;
}
