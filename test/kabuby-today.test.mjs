import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../kabuby/index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../kabuby/kabuby-today.js', import.meta.url), 'utf8');
const fallback = readFileSync(new URL('../kabuby/kabuby-today-fallback.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../kabuby/kabuby-today.css', import.meta.url), 'utf8');

test('existing Kabuby modules and shell remain present', () => {
  for (const label of ['Kabuby Scout', 'Cazador de Arbitraje', 'Price Monitor', 'eBay Connect', 'Radar de Virales', 'Predicción IA', 'SaaS Platform']) assert.match(html, new RegExp(label));
  assert.match(html, /class="sidebar"/);
});
test('Today assets are integrated into the existing home', () => {
  for (const asset of ['kabuby-today.css', 'kabuby-today-fallback.js', 'kabuby-today.js']) assert.match(html, new RegExp(asset));
  for (const section of ['Resumen ejecutivo', 'Necesita tu decisión', 'Kabuby está investigando', 'Atención operativa', 'Oportunidades', 'Qué cambió', 'Resultados / resuelto', 'Lo que Kabuby necesita aprender']) assert.match(app, new RegExp(section));
});
test('frontend transport is GET-only and carries credentials', () => {
  assert.match(app, /method: 'GET'/);
  assert.match(app, /credentials: 'include'/);
  assert.doesNotMatch(app, /method: '(POST|PUT|PATCH|DELETE)'/);
});
test('all required frontend states are explicit', () => {
  for (const state of ['loading', 'loaded', 'partial', 'stale', 'error', 'unauthorized']) assert.match(app, new RegExp(`['\"]${state}['\"]`));
  assert.match(app, /last_valid_observation_at/);
});
test('fallback is labeled and cannot claim write authority', () => {
  assert.match(fallback, /KIL4B_REAL_VALIDATED_SNAPSHOT/);
  assert.match(fallback, /VALIDATED_FALLBACK/);
  assert.match(fallback, /writes_allowed: false/);
  assert.match(fallback, /writes: 0/);
});
test('action controls are visually available but inert', () => {
  assert.match(app, /data-today-inert/);
  assert.doesNotMatch(app, /fetch\([^\n]+data-today-inert/);
});
test('desktop and mobile layouts are defined', () => {
  assert.match(css, /@media\(max-width:768px\)/);
  assert.match(css, /@media\(max-width:430px\)/);
});
