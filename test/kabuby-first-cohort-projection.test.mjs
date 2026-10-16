import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const app = readFileSync(new URL('../kabuby/app.js', import.meta.url), 'utf8');
const functionSource = readFileSync(new URL('../kabuby/functions/api/v1/intelligence/physical.js', import.meta.url), 'utf8');

test('the production root is wired to the same certified first-cohort read-only projection', () => {
  assert.match(app, /fetch\(PHYSICAL_PROJECTION_PATH/);
  assert.match(app, /credentials:'same-origin'/);
  assert.match(functionSource, /handlePhysicalProjectionGateway/);
  assert.match(functionSource, /PHYSICAL_PROJECTION_BINDING/);
  assert.match(app, /amazon_ebay_candidates/);
  assert.match(app, /cohortSummary/);
  assert.match(app, /base_official_fee_scenario_economics_complete/);
  assert.match(app, /economics_reassessment/);
  assert.match(app, /Number\(reassessment\.net_profit\) < 0/);
});

test('the root projects canonical cohort states without a browser economics engine', () => {
  for (const state of ['VALIDATE', 'REJECTED_ECONOMICS', 'BLOCKED_EBAY_FEE_CATEGORY_UNRESOLVED', 'VERIFIED_EBAY_WHITE_SPACE']) assert.match(app, new RegExp(state));
  for (const label of ['Products evaluated', 'Economics complete', 'First cohort dossiers', 'ACTIVE LISTING PRICE SCENARIO', 'NOT SOLD PRICE', 'DEMAND UNPROVEN', 'PRE-TAX', 'OFFICIAL EBAY FEE', 'OWNER POLICY', 'Amazon observed price', 'Amazon commercial strength / provider estimate', 'Official eBay Product Research', 'No sold results returned']) assert.match(app, new RegExp(label));
  assert.match(app, /data-cohort-filter/);
  assert.match(app, /cohortFilter/);
  assert.match(app, /usdMinor/);
  assert.match(app, /tac\.conservative_minor/);
  assert.doesNotMatch(app, /api\.ebay|keepa|dataforseo|calculateCommercialScenario|createKil8/);
});

test('the current specialized cohort cannot promote economics, active listings, or white space into a top commercial opportunity', () => {
  for (const marker of ['commercial_opportunity_state === \'VALIDATED\'', 'MARGIN_ONLY_RESEARCH_CANDIDATE', 'Economic scenarios are not commercial opportunities', 'Economic validation never validates commercial demand.', 'CURRENT SPECIALIZED RESEARCH · NOT A COMMERCIAL OPPORTUNITY', 'Hold / conflict']) assert.match(app, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(app, /find\(row => cohortDecision\(row\) === 'VALIDATE'\)/);
});

test('the root preserves commercial and Scout boundaries', () => {
  for (const label of ['BUY · BLOCKED', 'PUBLISH · BLOCKED', 'REPRICE · BLOCKED', 'INVENTORY WRITE · BLOCKED']) assert.match(app, new RegExp(label));
  assert.doesNotMatch(app, /access_token|refresh_token|KABUBY_COMMERCE_DB|INSERT |UPDATE |DELETE /);
});
