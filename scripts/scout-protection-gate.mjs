import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE_PATH = 'kabuby/scout-production-baseline-v1.json';
const SCOPE_EXCEPTION_PATH = 'kabuby/scout-scope-exception.json';
const fail = message => { throw new Error(message); };
const must = (value, message) => { if (!value) fail(message); };
const digest = value => createHash('sha256').update(value).digest('hex');
const fileHash = (root, relativePath) => digest(readFileSync(path.join(root, relativePath)));
const readJson = (root, relativePath) => JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));
const git = (root, ...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();

export function readBaseline(root = ROOT) {
  const baseline = readJson(root, BASELINE_PATH);
  must(baseline.baseline_id === 'SCOUT_CANONICAL_PRODUCTION_BASELINE_V1', 'SCOUT_BASELINE_ID_INVALID');
  must(baseline.owner_accepted === true, 'SCOUT_OWNER_ACCEPTANCE_REQUIRED');
  must(Array.isArray(baseline.protected_files) && baseline.protected_files.length > 0, 'SCOUT_PROTECTED_FILES_REQUIRED');
  must(Array.isArray(baseline.extension_contract) && baseline.extension_contract.length > 0, 'SCOUT_EXTENSION_CONTRACT_REQUIRED');
  return baseline;
}

export function validateGoldenContract(root = ROOT, baseline = readBaseline(root)) {
  for (const [relativePath, expectedHash] of Object.entries(baseline.asset_hashes || {})) {
    must(existsSync(path.join(root, relativePath)), `SCOUT_BASELINE_FILE_MISSING:${relativePath}`);
    must(fileHash(root, relativePath) === expectedHash, `SCOUT_BASELINE_HASH_DRIFT:${relativePath}`);
  }
  const portal = readFileSync(path.join(root, 'kabuby/app.js'), 'utf8');
  const runtime = readFileSync(path.join(root, 'kabuby/scout/index.html'), 'utf8');
  const owner = readFileSync(path.join(root, 'kabuby/scout-owner.js'), 'utf8');
  for (const marker of ['scout-functional-module', 'integratedScoutImportTarget', 'source.searchParams.set(\'shato_import\', \'1\')', 'history.replaceState']) must(portal.includes(marker), `SCOUT_OWNER_ROUTE_CONTRACT_MISSING:${marker}`);
  for (const marker of ['product-card-img', 'price-amazon', 'price-store', 'margin-badge', 'Ver detalle', 'f-category-amazon', 'showTab(\'pendientes\')', 'productConsumed', 'shato_products']) must(runtime.includes(marker), `SCOUT_NATIVE_RUNTIME_CONTRACT_MISSING:${marker}`);
  for (const marker of baseline.extension_contract) must(owner.includes(marker), `SCOUT_EXTENSION_CONTRACT_MISSING:${marker}`);
  must(!owner.includes("new URL('/scout/', current.origin)"), 'SCOUT_LEGACY_OWNER_REDIRECT_REINTRODUCED');
  return { status: 'PASS', baseline_id: baseline.baseline_id };
}

export function validateScopeException({ root = ROOT, baseline = readBaseline(root), base, changedFiles = null } = {}) {
  must(typeof base === 'string' && /^[0-9a-f]{7,64}$/i.test(base), 'SCOUT_GATE_BASE_REQUIRED');
  const changed = changedFiles || git(root, 'diff', '--name-only', `${base}..HEAD`).split('\n').filter(Boolean);
  const protectedChanges = changed.filter(file => baseline.protected_files.includes(file));
  if (!protectedChanges.length) return { status: 'PASS', protected_changes: [] };
  const exceptionPath = path.join(root, SCOPE_EXCEPTION_PATH);
  must(existsSync(exceptionPath), `SCOUT_SCOPE_EXCEPTION_REQUIRED:${protectedChanges.join(',')}`);
  const exception = readJson(root, SCOPE_EXCEPTION_PATH);
  for (const field of baseline.scope_exception.required_fields) must(exception[field], `SCOUT_SCOPE_EXCEPTION_FIELD_REQUIRED:${field}`);
  must(exception.base_commit === base, 'SCOUT_SCOPE_EXCEPTION_BASE_MISMATCH');
  const affected = new Set(exception.files_contracts_affected);
  for (const file of protectedChanges) {
    must(affected.has(file), `SCOUT_SCOPE_EXCEPTION_FILE_MISSING:${file}`);
    must(exception.source_fingerprints[file] === fileHash(root, file), `SCOUT_SCOPE_EXCEPTION_FINGERPRINT_MISMATCH:${file}`);
  }
  return { status: 'PASS', protected_changes: protectedChanges, exception_mission: exception.mission };
}

function main() {
  const args = process.argv.slice(2);
  const baseIndex = args.indexOf('--base');
  const base = baseIndex >= 0 ? args[baseIndex + 1] : '';
  const baseline = readBaseline();
  const golden = validateGoldenContract(ROOT, baseline);
  const scope = validateScopeException({ root: ROOT, baseline, base });
  console.log(JSON.stringify({ gate: 'SCOUT_PRODUCTION_REGRESSION_GATE', baseline: golden, scope, production_canary: baseline.production_canary }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
