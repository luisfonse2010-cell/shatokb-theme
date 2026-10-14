import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const home = await readFile(new URL('../kabuby/index.html', import.meta.url), 'utf8');
const portalApp = await readFile(new URL('../kabuby/app.js', import.meta.url), 'utf8');
const privacy = await readFile(new URL('../kabuby/privacy.html', import.meta.url), 'utf8');
const terms = await readFile(new URL('../kabuby/terms.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../kabuby/compliance.css', import.meta.url), 'utf8');
const redirects = await readFile(new URL('../kabuby/_redirects', import.meta.url), 'utf8');

test('portal keeps public privacy and terms reachable from Help while disclosures remain in policy documents', () => {
  assert.match(home, /Kabuby Intelligence OS/);
  assert.match(portalApp, /href="\/privacy\.html"/);
  assert.match(portalApp, /href="\/terms\.html"/);
  assert.match(privacy, /YouTube API Services as one independent source of public-data research/);
  assert.match(privacy, /not endorsed or approved by YouTube or Google/);
});

test('privacy policy states the exact current read-only YouTube boundary', () => {
  for (const statement of [
    'YouTube Data API v3',
    'does not currently use YouTube OAuth',
    'does not upload, edit, delete or manage YouTube content',
    'deleted or refreshed within 30 calendar days',
    'Expanded YouTube-derived metrics are not currently enabled'
  ]) assert.match(privacy, new RegExp(statement.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('privacy policy discloses the exact current eBay read-only OAuth boundary', () => {
  for (const statement of [
    'eBay OAuth',
    'read-only eBay Sell Account and Sell Finances scopes',
    'does not receive, request, or store the owner’s eBay password',
    'OAuth access and refresh tokens are stored only in Kabuby’s server-side credential storage',
    'does not persist raw eBay responses, buyer personal information, or order identifiers',
    'does not use this connection to publish listings, change prices or inventory, place orders, fulfill orders'
  ]) assert.match(privacy, new RegExp(statement.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(privacy, /Effective October 14, 2026/);
});

test('official YouTube and Google policy links are present', () => {
  for (const document of [privacy, terms]) {
    assert.match(document, /https:\/\/www\.youtube\.com\/t\/terms/);
    assert.match(document, /https:\/\/developers\.google\.com\/youtube\/terms\/api-services-terms-of-service/);
    assert.match(document, /https:\/\/developers\.google\.com\/youtube\/terms\/developer-policies/);
    assert.match(document, /https:\/\/policies\.google\.com\/privacy/);
  }
});

test('terms preserve development, ownership, disclaimer and no-endorsement truth', () => {
  assert.match(terms, /internal tool/);
  assert.match(terms, /does not offer public user accounts/);
  assert.match(terms, /does not claim ownership of YouTube videos/);
  assert.match(terms, /not represented as sponsored, approved or endorsed/);
  assert.match(terms, /not legal, financial, investment, tax or professional advice/);
});

test('compliance pages are responsive and contain no credential-shaped material', () => {
  assert.match(css, /@media \(max-width: 640px\)/);
  for (const document of [privacy, terms, css]) {
    assert.doesNotMatch(document, /AIza[0-9A-Za-z_-]{30,}/);
    assert.doesNotMatch(document, /(?:api[_-]?key|client[_-]?secret|authorization|password)\s*[:=]\s*["'][^"']+/i);
  }
});

test('legacy /kabuby paths redirect to the canonical portal before relative assets can break', () => {
  assert.match(redirects, /^\/kabuby\s+\/\s+301$/m);
  assert.match(redirects, /^\/kabuby\/\s+\/\s+301$/m);
  assert.match(redirects, /^\/kabuby\/\*\s+\/\s+301$/m);
});
