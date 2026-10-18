import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  handlePhysicalProjectionGateway,
  PHYSICAL_PROJECTION_BINDING,
  PHYSICAL_PROJECTION_PATH
} from '../kabuby/today/projection-gateway.mjs';

const assertion = 'access-assertion-is-never-returned';
const request = (path = PHYSICAL_PROJECTION_PATH, init = {}) => {
  const { headers = {}, ...rest } = init;
  return new Request(`https://kabuby.com${path}`, {
    method: 'GET',
    headers: { 'cf-access-jwt-assertion': assertion, ...headers },
    ...rest
  });
};
const certifiedPhysical = Object.freeze({
  commercial_authority: 'NONE',
  commercial_actions_enabled: false,
  physical_command_center: { status: 'NO_CANONICAL_DECISION_PACKAGE_AVAILABLE' }
});
const upstream = (body = { ok: true, data: { physical: certifiedPhysical } }, init = {}) => new Response(JSON.stringify(body), {
  status: 200,
  headers: { 'content-type': 'application/json', ...init.headers },
  ...init
});

test('same-origin gateway is GET-only, parameter-free, and requires the Access assertion', async () => {
  const calls = [];
  const binding = { fetch: async value => { calls.push(value); return upstream(); } };
  for (const value of [
    new Request('https://kabuby.com/api/v1/intelligence/physical', { method: 'POST' }),
    request('/api/v1/intelligence/physical?provider=keepa'),
    new Request('https://kabuby.com/api/v1/intelligence/physical')
  ]) {
    const result = await handlePhysicalProjectionGateway({ request: value, binding });
    assert.notEqual(result.status, 200);
  }
  assert.equal(calls.length, 0);
});

test('gateway forwards only the Access assertion to a fixed private service target', async () => {
  let forwarded;
  const result = await handlePhysicalProjectionGateway({
    request: request(PHYSICAL_PROJECTION_PATH, { headers: { cookie: 'must-not-forward', authorization: 'must-not-forward' } }),
    binding: { fetch: async value => { forwarded = value; return upstream(); } }
  });
  assert.equal(result.status, 200);
  assert.equal(forwarded.method, 'GET');
  assert.equal(new URL(forwarded.url).hostname, 'physical-projection.internal');
  assert.equal(new URL(forwarded.url).pathname, PHYSICAL_PROJECTION_PATH);
  assert.equal(forwarded.headers.get('cf-access-jwt-assertion'), assertion);
  assert.equal(forwarded.headers.get('cookie'), null);
  assert.equal(forwarded.headers.get('authorization'), null);
  const text = await result.text();
  assert.equal(text.includes(assertion), false);
  assert.deepEqual(JSON.parse(text), { ok: true, data: { physical: certifiedPhysical } });
});

test('gateway preserves private upstream Access failure states and fails closed for unavailable or malformed projection data', async () => {
  for (const [status, code] of [[401, 'UPSTREAM_AUTH_REQUIRED'], [419, 'SESSION_EXPIRED'], [403, 'ACCESS_DENIED'], [500, 'PROJECTION_UNAVAILABLE']]) {
    const result = await handlePhysicalProjectionGateway({ request: request(), binding: { fetch: async () => new Response('ignored', { status }) } });
    assert.equal(result.status, status === 500 ? 503 : status);
    assert.equal((await result.json()).error.code, code);
  }
  for (const response of [upstream({ ok: true, data: {} }), undefined]) {
    const result = await handlePhysicalProjectionGateway({ request: request(), binding: response ? { fetch: async () => response } : undefined });
    assert.equal(result.status, response ? 502 : 503);
  }
});

test('Pages Function keeps the binding server-side and exposes no arbitrary proxy input', () => {
  const source = readFileSync(new URL('../kabuby/functions/api/v1/intelligence/physical.js', import.meta.url), 'utf8');
  assert.match(source, new RegExp(PHYSICAL_PROJECTION_BINDING));
  assert.doesNotMatch(source, /api\.kabuby\.com|Authorization|Cookie|secret|token/i);
  assert.match(source, /onRequestGet/);
});


test('Pages configuration declares only the fixed private Physical service binding', () => {
  const config = readFileSync(new URL('../kabuby/wrangler.toml', import.meta.url), 'utf8');
  assert.match(config, /^name = "kabuby"$/m);
  assert.match(config, /^pages_build_output_dir = "\."$/m);
  assert.match(config, /^binding = "PHYSICAL_PROJECTION"$/m);
  assert.match(config, /^service = "shato-meli-connector"$/m);
  assert.doesNotMatch(config, /routes|workers_dev|vars|secrets|token/i);
});


test('production rollback baseline records the retained production deployment and unmet security gates', () => {
  const baseline = JSON.parse(readFileSync(new URL('../kabuby/today/production-release-baseline.json', import.meta.url), 'utf8'));
  assert.equal(baseline.current_production.deployment_id, 'f777e9e9-4fc6-42a9-b0d8-377b66fd3e93');
  assert.equal(baseline.current_production.source_commit, 'e1d43d6');
  assert.equal(baseline.rollback.target_deployment_id, baseline.current_production.deployment_id);
  assert.equal(baseline.recorded_observation.promotion_permitted_at_capture, false);
  assert.equal(baseline.required_pre_promotion_gates.kabuby_com_cloudflare_access, 'REQUIRED');
  assert.equal(baseline.commercial_authority, 'NONE');
});

test('bounded owner filters stay on the same private authenticated GET route',async()=>{
 let target;
 const result=await handlePhysicalProjectionGateway({request:request('/api/v1/intelligence/physical?decision=HOLD&limit=20&offset=20&category=Accessories'),binding:{fetch:async value=>{target=value;return upstream();}}});
 assert.equal(result.status,200);const url=new URL(target.url);assert.equal(url.hostname,'physical-projection.internal');assert.equal(url.searchParams.get('decision'),'HOLD');assert.equal(url.searchParams.get('offset'),'20');assert.equal(target.headers.get('cf-access-jwt-assertion'),assertion);assert.equal(target.headers.get('authorization'),null);
 const duplicate=await handlePhysicalProjectionGateway({request:request('/api/v1/intelligence/physical?run=a&run=b'),binding:{fetch:async()=>{throw Error('must not reach upstream');}}});assert.equal(duplicate.status,400);
});
