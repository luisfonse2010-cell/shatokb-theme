import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url));
const text = path => read(path).toString('utf8');
const app = text('kabuby/today/app.js');
const utf8Fixture = JSON.parse(text('kabuby/today/utf8-release-fixtures.json'));

test('secondary owner navigation keeps distinct certified product surfaces', () => {
  for (const label of [
    'Opportunity Radar', 'Amazon → eBay', 'Amazon → Mercado Libre', 'Product Discovery', 'My Opportunities',
    'Sources & suppliers', 'Availability', 'Source cost', 'Supplier monitor',
    'Economic truth', 'Target acquisition cost', 'Cost protection', 'Stress tests',
    'Sales Operations', 'Publication Center', 'Shadow Repricer', 'Fulfillment', 'Marketplace health & exceptions'
  ]) assert.match(app, new RegExp(label));
  assert.match(app, /const SECONDARY_SURFACES/);
  assert.match(app, /aria-current="page"/);
  assert.doesNotMatch(app, /Cazador de Arbitraje|Price Monitor|eBay Connect|Radar de Virales|Predicción IA|SaaS Platform/);
});

test('release sources are valid UTF-8 and retain accented Spanish and Portuguese without mojibake', () => {
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const sources = ['kabuby/today/index.html', 'kabuby/today/app.js', 'kabuby/today/data.js', 'kabuby/functions/api/v1/intelligence/physical.js', 'kabuby/today/utf8-release-fixtures.json'];
  const combined = sources.map(path => decoder.decode(read(path))).join('\n');
  for (const value of [...utf8Fixture.spanish, ...utf8Fixture.portuguese]) assert.match(combined, new RegExp(value));
  const renderedSources = sources.filter(path => !path.endsWith('utf8-release-fixtures.json')).map(path => decoder.decode(read(path))).join('\n');
  for (const value of utf8Fixture.forbidden_mojibake) assert.doesNotMatch(renderedSources, new RegExp(value));
  assert.match(text('kabuby/today/index.html'), /<meta charset="utf-8">/);
  assert.match(text('kabuby/today/projection-gateway.mjs'), /application\/json; charset=utf-8/);
});

test('safe release documentation rejects root DNS proxy toggling and requires a protected custom preview', () => {
  const document = text('kabuby/today/SAFE_RELEASE_ARCHITECTURE.md');
  assert.match(document, /permanently rejected/i);
  assert.match(document, /preview\.kabuby\.com/);
  assert.match(document, /PHYSICAL_PROJECTION/);
  assert.match(document, /shato-meli-connector/);
});
