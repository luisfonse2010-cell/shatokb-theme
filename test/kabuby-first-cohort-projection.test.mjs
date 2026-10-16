import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const app = readFileSync(new URL('../kabuby/app.js', import.meta.url), 'utf8');
const functionSource = readFileSync(new URL('../kabuby/functions/api/v1/intelligence/physical.js', import.meta.url), 'utf8');

test('the production root is wired to the same certified V3 read-only projection', () => {
  assert.match(app, /fetch\(PHYSICAL_PROJECTION_PATH/);
  assert.match(app, /credentials:'same-origin'/);
  assert.match(functionSource, /handlePhysicalProjectionGateway/);
  assert.match(functionSource, /PHYSICAL_PROJECTION_BINDING/);
  assert.match(app, /amazon_ebay_candidates/);
  assert.match(app, /cohortSummary/);
});

test('V3 owner cards use factual identity and current, derived filter semantics', () => {
  for (const label of ['Product Finder V3 owner dossiers', 'CONTINUE_RESEARCH', 'Verified eBay supply gap', 'Existing eBay market', 'Amazon strength supported', 'ownerFilterDefinitions', 'candidates.length']) assert.match(app, new RegExp(label));
  assert.match(app, /candidate\.title/);
  assert.match(app, /candidate\.brand/);
  assert.match(app, /candidate\.asin/);
  assert.doesNotMatch(app, /\['VALIDATE','Economic validate'\]/);
  assert.doesNotMatch(app, /\['WHITE_SPACE','White space supply only'\]/);
});

test('primary V3 cards keep raw blockers in collapsed advanced evidence', () => {
  assert.match(app, /advanced-technical-evidence/);
  assert.match(app, /Raw material blockers/);
  assert.match(app, /Economics incomplete —/);
  assert.match(app, /imageUnavailable/);
  assert.doesNotMatch(app, /Exact remaining blocker \/ confidence/);
});

test('three closed product states have exact owner-safe language', () => {
  for (const label of [
    'Strong Amazon product, but observed eBay pricing does not support viable Amazon→eBay economics.',
    'No sold results returned in the owner-observed official eBay Product Research searches during the selected 90-day window.',
    'eBay category conflict leaves the applicable fee unresolved. Further spending is stopped.',
    'B0CRC8MQZL', 'B0CRCB4FTM', 'B0CKTZ2PDF'
  ]) assert.match(app, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(app, /ZERO SALES/);
});

test('the root preserves commercial and Scout boundaries', () => {
  for (const label of ['BUY · BLOCKED', 'PUBLISH · BLOCKED', 'REPRICE · BLOCKED', 'INVENTORY WRITE · BLOCKED']) assert.match(app, new RegExp(label));
  assert.doesNotMatch(app, /access_token|refresh_token|KABUBY_COMMERCE_DB|INSERT |UPDATE |DELETE /);
});
