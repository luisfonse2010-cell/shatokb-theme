import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { ROOT, readBaseline, validateGoldenContract, validateScopeException } from '../scripts/scout-protection-gate.mjs';

test('SCOUT_CANONICAL_PRODUCTION_BASELINE_V1 pins the owner-approved native runtime and routing contract', () => {
  const baseline = readBaseline(ROOT);
  assert.equal(baseline.baseline_commit, '84db665ab3d6f9f5dbbd2595df767b42aa63882d');
  assert.equal(baseline.baseline_deployment, '81d08b94-ff8f-4f5f-b0c2-26eb49642e1a');
  assert.equal(baseline.routes.owner_shell, '/#scout?view=pendientes');
  assert.equal(baseline.invariants.global_shell_count, 1);
  assert.equal(baseline.invariants.global_navigation_count, 1);
  assert.equal(baseline.invariants.owner_session_count, 1);
  assert.equal(baseline.invariants.second_login_required, false);
  assert.equal(baseline.invariants.legacy_owner_redirect, false);
  assert.deepEqual(validateGoldenContract(ROOT, baseline), { status: 'PASS', baseline_id: 'SCOUT_CANONICAL_PRODUCTION_BASELINE_V1' });
});

test('Scout scope exceptions fail closed unless every protected change is explicit and content-addressed', () => {
  const baseline = readBaseline(ROOT);
  const base = JSON.parse(readFileSync(new URL('../kabuby/scout-scope-exception.json', import.meta.url), 'utf8')).base_commit;
  assert.throws(() => validateScopeException({ root: ROOT, baseline, base, changedFiles: ['kabuby/scout/index.html'] }), /SCOUT_SCOPE_EXCEPTION_FILE_MISSING/);
  assert.deepEqual(validateScopeException({ root: ROOT, baseline, base, changedFiles: ['kabuby/data.js'] }), { status: 'PASS', protected_changes: [] });
});
