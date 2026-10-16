import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  classifyProductionCanary,
  evaluateReleaseGates,
  validateGoldenContracts,
  validateProductionSafetyEnvelope,
  validateReleaseIdentity,
  validateScopeSafety
} from '../scripts/production-safety-envelope-gate.mjs';

const envelope = JSON.parse(readFileSync(new URL('../kabuby/production-safety-envelope-v1.json', import.meta.url), 'utf8'));

const requiredSurfaces = ['AUTH_ACCESS','ROOT_ROUTING','HOME','TODAY','OPPORTUNITIES','PRODUCT_DOSSIERS','SCOUT','SCOUT_CHROME_HANDOFF','ASK_KABUBY','API_READ_MODEL','PRIVATE_EXECUTOR_CONTROL_PLANE','D1_SCHEMA_COMPATIBILITY','V2_SPECIALIZED_ISOLATION','COMMERCIAL_MUTATION_FIREWALL'];

test('production safety envelope defines a complete system-level release identity and result contract', () => {
  const result = validateProductionSafetyEnvelope();
  assert.equal(result.status, 'PASS');
  assert.equal(result.protected_surfaces, requiredSurfaces.length);
  assert.equal(result.release_id, envelope.release_identity.current_release.release_id);
  assert.equal(result.candidate_release_id, envelope.release_identity.candidate_release.release_id);
  assert.equal(result.last_known_good_release_id, result.release_id);
  assert.match(result.artifact_fingerprint, /^[a-f0-9]{64}$/);
  assert.equal(result.rollback, 'ROLLBACK_REQUIRED');
  assert.equal(envelope.release_result_contract.prohibit_generic_deployed, true);
  assert.deepEqual(envelope.preview_production_artifact_parity.status, 'PLATFORM_NOT_SUPPORTED');
});

test('every current protected surface has a behavioral golden contract', () => {
  const golden = validateGoldenContracts();
  assert.equal(golden.status, 'PASS');
  assert.deepEqual(Object.keys(golden.contracts).sort(), requiredSurfaces.sort());
  for (const contract of Object.values(golden.contracts)) assert.equal(contract.status, 'PASS');
});

test('scope safety fails closed for protected cross-scope changes but does not freeze unrelated files', () => {
  assert.deepEqual(
    validateScopeSafety({ changedFiles: ['README.md'] }).status,
    'PASS'
  );
});

test('release identity fails closed on an artifact fingerprint mismatch', () => {
  assert.throws(() => validateReleaseIdentity({ artifactFingerprint: '0'.repeat(64) }), /FRONTEND_ARTIFACT_FINGERPRINT_MISMATCH/);
});

test('failure injection rejects every critical system-level gate without touching production', () => {
  const allPass = Object.fromEntries(envelope.required_preproduction_gates.map(gate => [gate, true]));
  assert.equal(evaluateReleaseGates(allPass).production_promotion_allowed, true);
  const cases = ['SCOUT','HOME','TODAY','OPPORTUNITIES','API_READ_MODEL','ROUTING','AUTH','ARTIFACT_FINGERPRINT','MIGRATION_GATE','COMMERCIAL_FIREWALL'];
  for (const gate of cases) {
    const result = evaluateReleaseGates({ ...allPass, [gate]: false });
    assert.equal(result.production_promotion_allowed, false, gate);
    assert.equal(result.release_state, 'REJECTED', gate);
    assert.equal(result.rollback_state, 'REQUIRED', gate);
    assert.deepEqual(result.failed_gates, [gate], gate);
  }
  const missing = evaluateReleaseGates({ ...allPass, PREVIEW_SMOKE: undefined });
  assert.equal(missing.production_promotion_allowed, false);
  assert.deepEqual(missing.failed_gates, ['PREVIEW_SMOKE']);
});

test('critical canaries select rollback-required while noncritical presentation defects do not auto-rollback', () => {
  const scout = classifyProductionCanary({ surface: 'SCOUT', passed: false });
  assert.equal(scout.result, 'CRITICAL_FAILURE');
  assert.equal(scout.rollback_state, 'REQUIRED');
  const ask = classifyProductionCanary({ surface: 'ASK_KABUBY', passed: false });
  assert.equal(ask.result, 'NONCRITICAL_FAILURE');
  assert.equal(ask.rollback_state, 'NOT_REQUIRED');
});
