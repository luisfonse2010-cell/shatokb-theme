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
  for (const section of ['Resumen ejecutivo', 'Necesita tu decisión', 'Investigación de Kabuby', 'Atención operativa', 'Oportunidades', 'Qué cambió', 'Resuelto', 'Lo que Kabuby necesita aprender', 'Cobertura del análisis']) assert.match(app, new RegExp(section));
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
test('Spanish presentation assigns owner and Kabuby responsibility clearly', () => {
  assert.doesNotMatch(app, /owner|Kabuby está investigando/i);
  for (const label of ['TU DECISIÓN', 'KABUBY', 'MONITOREO', 'AUTOMATIZACIÓN FUTURA', 'SIN ACCIÓN']) assert.match(app, new RegExp(label));
  assert.match(app, /Para ti/);
  assert.match(app, /Kabuby hará/);
  assert.match(fallback, /owner_next_action/);
  assert.match(fallback, /kabuby_next_action/);
});
test('partial evidence never presents global business health as established', () => {
  assert.match(fallback, /global_business_health: 'NOT_ESTABLISHED'/);
  assert.match(app, /Visión actual/);
  assert.match(app, /Atención necesaria/);
  assert.match(app, /Basado en la información disponible/);
  assert.match(app, /COBERTURA PARCIAL/);
  assert.doesNotMatch(app, /Estado del negocio/);
});
test('executive metrics are responsibility-oriented and data-driven', () => {
  for (const label of ['Necesita tu decisión', 'Kabuby pendiente', 'Atención operativa', 'Listo para acción']) assert.match(app, new RegExp(label));
  assert.match(app, /data\.needs_owner_decision/);
  assert.match(app, /data\.kabuby_investigating/);
  assert.match(app, /data\.operational_attention/);
  assert.match(app, /data\.opportunities/);
});
test('coverage and freshness remain explicit without invented denominator', () => {
  assert.match(fallback, /analysis_coverage/);
  assert.match(fallback, /catalog_total: null/);
  assert.match(fallback, /freshness/);
  assert.match(app, /Última actualización/);
  assert.match(app, /Fuente:/);
  assert.match(app, /Las conclusiones de Kabuby se limitan/);
});
test('confirmed and pending policy decisions are distinguished', () => {
  assert.match(app, /decisiones confirmadas en esta sesión · pendientes de registro/);
  assert.match(fallback, /Inventario y reposición/);
  assert.match(fallback, /Repricing automático dentro de política/);
  assert.doesNotMatch(fallback, /LOW STOCK|CRITICAL = 5/);
});
test('empty states are useful and do not create fake activity', () => {
  assert.match(app, /No necesito ninguna decisión tuya ahora/);
  assert.match(app, /No detecté problemas operativos que requieran tu atención/);
  assert.match(app, /No encontré oportunidades suficientemente respaldadas/);
  assert.match(app, /Sin nuevos asuntos resueltos/);
});
test('action controls are visually available but inert', () => {
  assert.match(app, /data-today-inert/);
  assert.doesNotMatch(app, /fetch\([^\n]+data-today-inert/);
});
test('desktop and mobile layouts are defined', () => {
  assert.match(css, /@media\(max-width:768px\)/);
  assert.match(css, /@media\(max-width:430px\)/);
});
