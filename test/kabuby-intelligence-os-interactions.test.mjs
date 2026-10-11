import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const app = readFileSync(new URL('../kabuby/today/app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../kabuby/today/index.html', import.meta.url), 'utf8');
const data = readFileSync(new URL('../kabuby/today/data.js', import.meta.url), 'utf8');
const inventory = JSON.parse(readFileSync(new URL('../kabuby/today/interaction-inventory.json', import.meta.url), 'utf8'));

const buttonTags = [...`${html}\n${app}`.matchAll(/<button\b[^>]*>/g)].map(match => match[0]);

test('every rendered button has behavior or an explicit disabled commercial boundary', () => {
  assert.ok(buttonTags.length > 12, 'interaction inventory unexpectedly shrank');
  for (const tag of buttonTags) {
    assert.match(tag, /(disabled|type="submit"|data-action=|data-route=|data-period=|data-locale=|id="(?:locale-button|notification-button|owner-account)")/, `dead button: ${tag}`);
  }
  assert.match(app, /function wireRenderedControls\(\)/);
  assert.match(app, /addEventListener\('submit'/);
  assert.match(app, /notification-button.*addEventListener/s);
  assert.match(app, /owner-account.*addEventListener/s);
});

test('authenticated projection and evidence are separate semantic states', () => {
  for (const state of ['AUTHENTICATED','AUTH_REQUIRED','SESSION_EXPIRED','ACCESS_DENIED','PROJECTION_UNAVAILABLE','NETWORK_ERROR']) assert.match(app, new RegExp(state));
  assert.match(app, /Connect \/ sign in/);
  assert.match(app, /credentials:'include'/);
  assert.match(app, /commercial_authority !== 'NONE'/);
  assert.match(app, /commercial_actions_enabled !== false/);
  const authBlock = app.slice(app.indexOf('function authDescription'), app.indexOf('function authBanner'));
  assert.doesNotMatch(authBlock, /today\.waiting/);
  assert.match(app, /authrequired:'AUTH REQUIRED'/);
  assert.match(app, /const securityState = m\.isAvailable/);
  assert.match(app, /const activityState=m\.isAvailable/);
});

test('all safe shell controls have a concrete read-only destination', () => {
  for (const id of ['today','opportunities','supply','economics','operations','portfolio','learning','settings']) assert.match(data, new RegExp(`\\['${id}'`));
  assert.match(app, /href="\/"/); // Scout remains its protected existing surface.
  assert.match(app, /go\('attention'\)/);
  assert.match(app, /go\('account'\)/);
  assert.match(app, /href="#learning"/);
  assert.match(app, /surfaceTabs\(page\)/);
  assert.match(app, /function searchView\(query\)/);
});

test('durable interaction inventory records the read-only control contract', () => {
  assert.equal(inventory.rule, 'ZERO_DEAD_CONTROLS');
  assert.ok(inventory.elements.length >= 20);
  assert.ok(inventory.elements.every(entry => entry.state !== 'PLACEHOLDER'));
  assert.ok(inventory.elements.some(entry => entry.id === 'commercial-actions' && entry.state === 'DISABLED_WITH_EXPLICIT_REASON'));
});
