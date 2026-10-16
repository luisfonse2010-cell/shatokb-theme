import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { GOLDEN_V3_ASINS, exactAmazonProductNavigation, ebayEvidenceNavigation } from '../kabuby/v3-capability-contract.js';

const app = readFileSync(new URL('../kabuby/app.js', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../kabuby/styles.css', import.meta.url), 'utf8');
const expected = ['B01F49C0QS','B0C7SZSM38','B0CKTZ2PDF','B0CN2Q2C5C','B0CRC73JTS','B0CRC8MQZL','B0CRCB4FTM','B0CV1F1W7K','B0DR9GN2PM','B0DSWW84QJ'];

test('CERTIFIED_CAPABILITY_REGRESSION: V3 golden cohort has stable exact identity', () => {
  assert.deepEqual(GOLDEN_V3_ASINS, expected);
  assert.equal(new Set(GOLDEN_V3_ASINS).size, 10);
  for (const asin of GOLDEN_V3_ASINS) assert.equal(exactAmazonProductNavigation(asin), `https://www.amazon.com/dp/${asin}`);
  assert.equal(exactAmazonProductNavigation('title based lookup'), null);
});

test('CERTIFIED_CAPABILITY_REGRESSION: eBay links remain exact evidence or explicitly non-factual GTIN navigation', () => {
  const exact = ebayEvidenceNavigation({ gtin:'0123456789012', ebay_item_web_url:'https://www.ebay.com/itm/123' });
  assert.deepEqual(exact, { kind:'EXACT_EVIDENCE', url:'https://www.ebay.com/itm/123', label:'View exact eBay evidence' });
  const search = ebayEvidenceNavigation({ gtin:'0123456789012' });
  assert.equal(search.kind, 'EXACT_GTIN_SEARCH_NAVIGATION');
  assert.match(search.url, /_nkw=0123456789012/);
  assert.equal(ebayEvidenceNavigation({ title:'similar title only' }), null);
  assert.equal(ebayEvidenceNavigation({ gtin:'0123456789012', ebay_item_web_url:'https://untrusted.example/itm/1' }).kind, 'EXACT_GTIN_SEARCH_NAVIGATION');
});

test('CERTIFIED_CAPABILITY_REGRESSION: owner dossier preserves exact routing, navigation, factual boundaries and read-only safety', () => {
  for (const fragment of ['exactV3Candidate', 'ownerDossierParams', 'ownerEvidenceRows', 'ownerEvidenceNavigation', 'data-amazon-exact-navigation', 'data-ebay-navigation', 'navigation only, not listing evidence', 'commercial_opportunity_state', 'advanced-technical-evidence', 'READ ONLY · COMMERCIAL ACTIONS BLOCKED']) assert.match(app, new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(app, /candidate\.asin === 'B0CRC8MQZL'/);
  assert.match(styles, /owner-evidence-navigation/);
});

test('CERTIFIED_CAPABILITY_REGRESSION: V3 navigation cannot leak another product identity', () => {
  const left = exactAmazonProductNavigation(GOLDEN_V3_ASINS[0]);
  const right = exactAmazonProductNavigation(GOLDEN_V3_ASINS[1]);
  assert.notEqual(left, right);
  assert.ok(left.endsWith(GOLDEN_V3_ASINS[0]));
  assert.ok(right.endsWith(GOLDEN_V3_ASINS[1]));
});
