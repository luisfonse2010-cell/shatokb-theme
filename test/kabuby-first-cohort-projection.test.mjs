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

test('owner-facing state is derived from the canonical decision contract, not an ASIN list', () => {
  for (const label of [
    "['VALIDATED','HOLD','REJECTED'].includes(candidate?.commercial_opportunity_state)",
    'Certified category or fee evidence is unresolved. Further research spending is stopped.',
    'Certified market evidence rejected this exact product. Do not resume without new certified evidence.'
  ]) assert.match(app, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(app, /candidate\.asin === 'B0CRC8MQZL'/);
  assert.doesNotMatch(app, /candidate\.asin === 'B0CRCB4FTM'/);
  assert.doesNotMatch(app, /candidate\.asin === 'B0CKTZ2PDF'/);
  assert.doesNotMatch(app, /ZERO SALES/);
});

test('the root preserves commercial and Scout boundaries', () => {
  for (const label of ['BUY · BLOCKED', 'PUBLISH · BLOCKED', 'REPRICE · BLOCKED', 'INVENTORY WRITE · BLOCKED']) assert.match(app, new RegExp(label));
  assert.doesNotMatch(app, /access_token|refresh_token|KABUBY_COMMERCE_DB|INSERT |UPDATE |DELETE /);
});
