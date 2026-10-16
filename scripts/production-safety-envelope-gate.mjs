import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fail = code => { throw new Error(code); };
const read = file => readFileSync(path.join(root, file), 'utf8');
const json = file => JSON.parse(read(file));
const hash = text => createHash('sha256').update(text).digest('hex');
const allowed = new Map([
  ['kabuby/app.js', 'OPPORTUNITIES_UI'],
  ['kabuby/functions/api/v1/intelligence/physical.js', 'API_PROJECTION'],
  ['kabuby/_redirects', 'ROUTING'],
  ['kabuby/index.html', 'HOME'],
  ['kabuby/scout/index.html', 'SCOUT'],
  ['kabuby/scout-owner.js', 'SCOUT'],
  ['kabuby/production-safety-envelope-v1.json', 'RELEASE_SAFETY'],
  ['kabuby/release-scope-declaration.json', 'RELEASE_SAFETY'],
  ['scripts/production-safety-envelope-gate.mjs', 'RELEASE_SAFETY'],
  ['.github/workflows/kabuby-foundation-ci.yml', 'RELEASE_SAFETY']
]);

export function validateProductionSafetyEnvelope({ base = null } = {}) {
  const envelope = json('kabuby/production-safety-envelope-v1.json');
  const scope = json('kabuby/release-scope-declaration.json');
  if (envelope.release_contract !== 'KABUBY_PRODUCTION_SAFETY_ENVELOPE_V1' || envelope.version !== 1) fail('RELEASE_ENVELOPE_INVALID');
  for (const key of ['AUTH_ACCESS','ROOT_ROUTING','HOME','TODAY','OPPORTUNITIES','PRODUCT_DOSSIERS','SCOUT','SCOUT_CHROME_HANDOFF','API_READ_MODEL','PRIVATE_EXECUTOR_CONTROL_PLANE','D1_SCHEMA_COMPATIBILITY','V2_SPECIALIZED_ISOLATION','COMMERCIAL_MUTATION_FIREWALL']) if (!envelope.protected_surfaces.includes(key)) fail(`PROTECTED_SURFACE_MISSING:${key}`);
  for (const key of ['CI','FULL_REGRESSION','MISSION_CONTROL','SCOPE_GATE','MIGRATION_GATE','PREVIEW_SMOKE','ARTIFACT_FINGERPRINT']) if (!envelope.required_preproduction_gates.includes(key)) fail(`PREPRODUCTION_GATE_MISSING:${key}`);
  if (envelope.rollback.automatic !== false || envelope.rollback.on_critical_canary_failure !== 'ROLLBACK_REQUIRED') fail('ROLLBACK_POLICY_UNSAFE');
  if (!Array.isArray(scope.allowed_change_scope) || !scope.owner_authorization) fail('SCOPE_DECLARATION_INVALID');
  if (base) {
    const changed = execFileSync('git', ['diff', '--name-only', `${base}..HEAD`], { cwd:root, encoding:'utf8' }).trim().split('\n').filter(Boolean);
    for (const file of changed) {
      const requiredScope = allowed.get(file);
      if (requiredScope && !scope.allowed_change_scope.includes(requiredScope)) fail(`DEPLOYMENT_DENIED_UNAUTHORIZED_SCOPE_CHANGE:${file}`);
    }
  }
  const artifact = hash(['kabuby/index.html','kabuby/app.js','kabuby/styles.css','kabuby/_redirects','kabuby/functions/api/v1/intelligence/physical.js'].map(file => `${file}\0${hash(read(file))}`).join('\n'));
  return Object.freeze({ status:'PASS', artifact_fingerprint:artifact, rollback:'ROLLBACK_REQUIRED', protected_surfaces:envelope.protected_surfaces.length });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const baseIndex = process.argv.indexOf('--base');
  const base = baseIndex >= 0 ? process.argv[baseIndex + 1] : null;
  console.log(JSON.stringify(validateProductionSafetyEnvelope({ base }), null, 2));
}
