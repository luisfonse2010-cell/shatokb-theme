import assert from 'node:assert/strict';
import test from 'node:test';
import { validateProductionSafetyEnvelope } from '../scripts/production-safety-envelope-gate.mjs';

test('production safety envelope protects critical contracts and binds an immutable frontend artifact', () => {
  const result = validateProductionSafetyEnvelope();
  assert.equal(result.status, 'PASS');
  assert.match(result.artifact_fingerprint, /^[a-f0-9]{64}$/);
  assert.equal(result.rollback, 'ROLLBACK_REQUIRED');
  assert.ok(result.protected_surfaces >= 13);
});
