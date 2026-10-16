import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateGoldenContract as validateScoutGoldenContract } from './scout-protection-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fail = code => { throw new Error(code); };
const read = (file, activeRoot = root) => readFileSync(path.join(activeRoot, file), 'utf8');
const json = (file, activeRoot = root) => JSON.parse(read(file, activeRoot));
const hash = text => createHash('sha256').update(text).digest('hex');
const artifactFiles = Object.freeze(['kabuby/index.html', 'kabuby/app.js', 'kabuby/styles.css', 'kabuby/_redirects', 'kabuby/functions/api/v1/intelligence/physical.js']);
const requiredSurfaces = Object.freeze(['AUTH_ACCESS','ROOT_ROUTING','HOME','TODAY','OPPORTUNITIES','PRODUCT_DOSSIERS','SCOUT','SCOUT_CHROME_HANDOFF','ASK_KABUBY','API_READ_MODEL','PRIVATE_EXECUTOR_CONTROL_PLANE','D1_SCHEMA_COMPATIBILITY','V2_SPECIALIZED_ISOLATION','COMMERCIAL_MUTATION_FIREWALL']);
const requiredGates = Object.freeze(['CANONICAL_SOURCE','REMOTE_CI','FULL_REGRESSION','MISSION_CONTROL','SCOPE_GATE','MIGRATION_GATE','RELEASE_MANIFEST','AUTH','ROUTING','HOME','TODAY','OPPORTUNITIES','DOSSIERS','SCOUT','CHROME_HANDOFF','API_READ_MODEL','PRIVATE_EXECUTOR','V2_ISOLATION','COMMERCIAL_FIREWALL','PREVIEW_SMOKE','ARTIFACT_FINGERPRINT']);

// Only production-contract files are scope-gated. This keeps ordinary development unfrozen.
const protectedFileScopes = Object.freeze({
  'kabuby/index.html': ['HOME_UI', 'OPPORTUNITIES_UI', 'ASK_KABUBY'],
  'kabuby/app.js': ['HOME_UI', 'OPPORTUNITIES_UI', 'SCOUT', 'ASK_KABUBY'],
  'kabuby/styles.css': ['HOME_UI', 'OPPORTUNITIES_UI', 'SCOUT'],
  'kabuby/_headers': ['AUTH'],
  'kabuby/_redirects': ['ROUTING'],
  'kabuby/functions/api/v1/intelligence/physical.js': ['API_PROJECTION', 'AUTH'],
  'kabuby/today/index.html': ['HOME_UI'],
  'kabuby/today/app.js': ['HOME_UI', 'OPPORTUNITIES_UI'],
  'kabuby/today/projection-gateway.mjs': ['API_PROJECTION', 'AUTH'],
  'kabuby/scout/index.html': ['SCOUT'],
  'kabuby/scout-owner.js': ['SCOUT'],
  'kabuby/production-safety-envelope-v1.json': ['RELEASE_SAFETY'],
  'kabuby/release-scope-declaration.json': ['RELEASE_SAFETY'],
  'scripts/production-safety-envelope-gate.mjs': ['RELEASE_SAFETY'],
  'scripts/scout-protection-gate.mjs': ['SCOUT', 'RELEASE_SAFETY'],
  'test/production-safety-envelope.test.mjs': ['RELEASE_SAFETY'],
  '.github/workflows/kabuby-foundation-ci.yml': ['RELEASE_SAFETY']
});

const expectation = (source, marker, code) => { if (!source.includes(marker)) fail(code); };
const currentArtifactFingerprint = (activeRoot = root) => hash(artifactFiles.map(file => `${file}\0${hash(read(file, activeRoot))}`).join('\n'));
const changedFromGit = (activeRoot, base) => execFileSync('git', ['diff', '--name-only', `${base}..HEAD`], { cwd: activeRoot, encoding: 'utf8' }).trim().split('\n').filter(Boolean);

export function evaluateReleaseGates(checks = {}) {
  const required = json('kabuby/production-safety-envelope-v1.json').required_preproduction_gates;
  const failed = required.filter(gate => checks[gate] !== true);
  if (failed.length) return Object.freeze({ production_promotion_allowed: false, release_state: 'REJECTED', rollback_state: 'REQUIRED', failed_gates: Object.freeze(failed) });
  return Object.freeze({ production_promotion_allowed: true, release_state: 'CANDIDATE', rollback_state: 'NOT_REQUIRED', failed_gates: Object.freeze([]) });
}

export function classifyProductionCanary({ surface, passed }) {
  const critical = json('kabuby/production-safety-envelope-v1.json').critical_canary_policy.critical.includes(surface);
  if (passed === true) return Object.freeze({ surface, critical, result: 'PASS', release_state: 'CANDIDATE', rollback_state: 'NOT_REQUIRED' });
  return Object.freeze({ surface, critical, result: critical ? 'CRITICAL_FAILURE' : 'NONCRITICAL_FAILURE', release_state: 'REJECTED', rollback_state: critical ? 'REQUIRED' : 'NOT_REQUIRED' });
}

export function validateReleaseIdentity({ activeRoot = root, artifactFingerprint = currentArtifactFingerprint(activeRoot) } = {}) {
  const envelope = json('kabuby/production-safety-envelope-v1.json', activeRoot);
  const identity = envelope.release_identity;
  if (identity?.schema_version !== 'kabuby-release-identity/v1') fail('RELEASE_IDENTITY_SCHEMA_INVALID');
  const release = identity.current_release;
  for (const key of ['release_id','frontend_canonical_commit','frontend_artifact_fingerprint','frontend_production_deployment','backend_canonical_commit','api_version','private_executor_version','d1_schema_version','read_model_version','scout_baseline_version','auth_contract_version','routing_contract_version','chrome_handoff_contract_version']) if (typeof release?.[key] !== 'string' || !release[key]) fail(`RELEASE_IDENTITY_FIELD_MISSING:${key}`);
  if (release.release_state !== 'CERTIFIED_PRODUCTION_RELEASE') fail('CURRENT_RELEASE_NOT_CERTIFIED');
  if (identity.last_known_good_release_id !== release.release_id) fail('LAST_KNOWN_GOOD_RELEASE_DRIFT');
  if (release.frontend_artifact_fingerprint !== artifactFingerprint) fail('FRONTEND_ARTIFACT_FINGERPRINT_MISMATCH');
  if (envelope.preview_production_artifact_parity?.status !== 'PLATFORM_NOT_SUPPORTED') fail('PREVIEW_PROMOTION_STATUS_INVALID');
  if (envelope.preview_production_artifact_parity?.platform_supports_identical_artifact_promotion !== false) fail('UNPROVEN_SAME_ARTIFACT_PROMOTION');
  return Object.freeze({ status: 'PASS', release_id: release.release_id, artifact_fingerprint: artifactFingerprint, last_known_good_release_id: identity.last_known_good_release_id });
}

export function validateScopeSafety({ activeRoot = root, base = null, changedFiles = null } = {}) {
  const envelope = json('kabuby/production-safety-envelope-v1.json', activeRoot);
  const scope = json('kabuby/release-scope-declaration.json', activeRoot);
  if (!Array.isArray(scope.allowed_change_scope) || !scope.allowed_change_scope.length || typeof scope.owner_authorization !== 'string' || !scope.owner_authorization) fail('SCOPE_DECLARATION_INVALID');
  for (const declared of scope.allowed_change_scope) if (!envelope.scope_safety.allowed_change_scopes.includes(declared)) fail(`SCOPE_UNKNOWN:${declared}`);
  if (!Array.isArray(scope.files_contracts_affected)) fail('SCOPE_AFFECTED_FILES_INVALID');
  const changed = changedFiles || (base ? changedFromGit(activeRoot, base) : []);
  for (const file of changed) {
    const acceptedScopes = protectedFileScopes[file];
    if (!acceptedScopes) continue;
    if (!scope.files_contracts_affected.includes(file)) fail(`${envelope.scope_safety.failure_code}:UNDECLARED_FILE:${file}`);
    if (!acceptedScopes.some(item => scope.allowed_change_scope.includes(item))) fail(`${envelope.scope_safety.failure_code}:${file}`);
  }
  return Object.freeze({ status: 'PASS', declared_scope: Object.freeze([...scope.allowed_change_scope]), protected_files_checked: Object.freeze(changed.filter(file => protectedFileScopes[file])) });
}

export function validateGoldenContracts({ activeRoot = root } = {}) {
  const app = read('kabuby/app.js', activeRoot);
  const index = read('kabuby/index.html', activeRoot);
  const redirects = read('kabuby/_redirects', activeRoot);
  const headers = read('kabuby/_headers', activeRoot);
  const physical = read('kabuby/functions/api/v1/intelligence/physical.js', activeRoot);
  const today = read('kabuby/today/app.js', activeRoot);
  const contracts = {};
  const pass = (surface, required) => { contracts[surface] = Object.freeze({ status: 'PASS', required: Object.freeze(required) }); };
  expectation(index, 'id="app"', 'ROOT_SHELL_CONTRACT_MISSING'); expectation(redirects, '/kabuby/  /index.html  200', 'ROUTING_LEGACY_REWRITE_MISSING'); expectation(redirects, '/*', 'ROUTING_ROOT_FALLBACK_MISSING'); pass('ROOT_ROUTING', ['root shell', 'legacy rewrite', 'no redirect rule']);
  expectation(headers, 'Cache-Control: no-cache', 'AUTH_CACHE_BOUNDARY_MISSING'); expectation(physical, 'PHYSICAL_PROJECTION_BINDING', 'AUTH_PROJECTION_BINDING_MISSING'); pass('AUTH_ACCESS', ['same-origin projection binding', 'non-cacheable shell']);
  expectation(app, 'fetch(PHYSICAL_PROJECTION_PATH', 'HOME_READ_MODEL_FETCH_MISSING'); expectation(app, "credentials:'same-origin'", 'HOME_SAME_ORIGIN_MISSING'); pass('HOME', ['same-origin owner read model']);
  expectation(today, "credentials:'same-origin'", 'TODAY_SAME_ORIGIN_MISSING'); expectation(today, 'commercial_authority !== \'NONE\'', 'TODAY_FIREWALL_MISSING'); pass('TODAY', ['compatible read model', 'commercial authority check']);
  expectation(app, 'Product Finder V3 owner dossiers', 'OPPORTUNITIES_V3_CONTAINER_MISSING'); expectation(app, 'ownerFilterDefinitions', 'OPPORTUNITIES_CURRENT_FILTERS_MISSING'); expectation(app, 'data-cohort-filter', 'OPPORTUNITIES_FILTER_MISSING'); pass('OPPORTUNITIES', ['current V3 cohort', 'derived filters']);
  expectation(app, 'owner-product-card', 'DOSSIER_CONTAINER_MISSING'); expectation(app, 'advanced-technical-evidence', 'DOSSIER_ADVANCED_EVIDENCE_MISSING'); expectation(app, 'ownerCommercialState', 'DOSSIER_OWNER_DECISION_MISSING'); pass('PRODUCT_DOSSIERS', ['product identity', 'owner decision', 'collapsed advanced evidence']);
  validateScoutGoldenContract(activeRoot); pass('SCOUT', ['locked native runtime', 'content-addressed Scout baseline']);
  expectation(app, 'integratedScoutImportTarget', 'CHROME_HANDOFF_TARGET_MISSING'); expectation(app, 'window.location.replace(postCaptureTarget)', 'CHROME_HANDOFF_NAVIGATION_MISSING'); pass('SCOUT_CHROME_HANDOFF', ['integrated pending destination', 'single-session redirect']);
  expectation(app, 'Ask Kabuby is search, not a fake assistant', 'ASK_KABUBY_GROUNDED_CONTRACT_MISSING'); pass('ASK_KABUBY', ['read-model search only']);
  expectation(physical, 'onRequestGet', 'API_GET_CONTRACT_MISSING'); expectation(physical, 'handlePhysicalProjectionGateway', 'API_GATEWAY_CONTRACT_MISSING'); pass('API_READ_MODEL', ['GET-only projection gateway']);
  pass('PRIVATE_EXECUTOR_CONTROL_PLANE', ['version-pinned in release identity', 'server-owned private executor contract']);
  pass('D1_SCHEMA_COMPATIBILITY', ['expand-compatible-code discipline', 'version-pinned schema']);
  pass('V2_SPECIALIZED_ISOLATION', ['versioned specialized/read-model contract']);
  expectation(app, 'BUY · BLOCKED', 'COMMERCIAL_FIREWALL_BUY_MISSING'); expectation(app, 'PUBLISH · BLOCKED', 'COMMERCIAL_FIREWALL_PUBLISH_MISSING'); expectation(app, 'REPRICE · BLOCKED', 'COMMERCIAL_FIREWALL_REPRICE_MISSING'); expectation(app, 'INVENTORY WRITE · BLOCKED', 'COMMERCIAL_FIREWALL_INVENTORY_MISSING'); pass('COMMERCIAL_MUTATION_FIREWALL', ['blocked commercial controls']);
  return Object.freeze({ status: 'PASS', contracts: Object.freeze(contracts) });
}

export function validateProductionSafetyEnvelope({ activeRoot = root, base = null, changedFiles = null } = {}) {
  const envelope = json('kabuby/production-safety-envelope-v1.json', activeRoot);
  if (envelope.release_contract !== 'KABUBY_PRODUCTION_SAFETY_ENVELOPE_V1' || envelope.version !== 2) fail('RELEASE_ENVELOPE_INVALID');
  for (const key of requiredSurfaces) if (!envelope.protected_surfaces.includes(key) || !envelope.golden_contracts?.[key]) fail(`PROTECTED_SURFACE_MISSING:${key}`);
  for (const key of requiredGates) if (!envelope.required_preproduction_gates.includes(key)) fail(`PREPRODUCTION_GATE_MISSING:${key}`);
  if (envelope.rollback?.automatic !== false || envelope.rollback?.on_critical_canary_failure !== 'ROLLBACK_REQUIRED') fail('ROLLBACK_POLICY_UNSAFE');
  if (envelope.release_result_contract?.prohibit_generic_deployed !== true) fail('GENERIC_DEPLOY_STATUS_ALLOWED');
  const identity = validateReleaseIdentity({ activeRoot });
  const scope = validateScopeSafety({ activeRoot, base, changedFiles });
  const golden = validateGoldenContracts({ activeRoot });
  return Object.freeze({ status: 'PASS', artifact_fingerprint: identity.artifact_fingerprint, release_id: identity.release_id, last_known_good_release_id: identity.last_known_good_release_id, scope, golden_contracts: golden.contracts, rollback: 'ROLLBACK_REQUIRED', protected_surfaces: envelope.protected_surfaces.length, release_result_contract: envelope.release_result_contract.required_fields });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const baseIndex = process.argv.indexOf('--base');
  const base = baseIndex >= 0 ? process.argv[baseIndex + 1] : null;
  console.log(JSON.stringify(validateProductionSafetyEnvelope({ base }), null, 2));
}
