import test from 'node:test';
import assert from 'node:assert/strict';
import { createPresentationContext, daypart, formatCurrency, greeting, message, resolveLanguage, writeLanguagePreference } from '../kabuby/i18n.js';

test('i18n keeps UI language, marketplace geography, and currency independent', () => {
  const context = createPresentationContext({ uiLanguage: 'es', userLocale: 'es-CO', timezone: 'America/Bogota', country: 'CO', marketplace: 'MERCADO_LIBRE', marketplaceGeography: 'BR', currency: 'BRL' });
  assert.equal(context.ui_language, 'es');
  assert.equal(context.marketplace_geography, 'BR');
  assert.equal(context.currency, 'BRL');
  assert.equal(message('OWNER_ACTION_REQUIRED', context), 'Requiere tu decisión');
  assert.match(formatCurrency(12.5, 'BRL', context), /12,50|12\.50/);
});

test('AUTO detects supported browser language and preference overrides it', () => {
  assert.equal(resolveLanguage({ preference: 'AUTO', userLocale: 'pt-BR' }), 'pt');
  assert.equal(resolveLanguage({ preference: 'en', userLocale: 'pt-BR' }), 'en');
  const store = new Map();
  assert.equal(writeLanguagePreference('es', { setItem: (key, value) => store.set(key, value) }), 'es');
  assert.equal(store.get('kabuby_ui_language_preference_v1'), 'es');
});

test('time-aware greetings use supplied name and timezone without hardcoding an owner', () => {
  const context = createPresentationContext({ uiLanguage: 'pt', userLocale: 'pt-BR', timezone: 'America/Sao_Paulo' });
  assert.equal(daypart({ date: '2026-10-10T12:00:00.000Z', timezone: 'America/Sao_Paulo' }), 'MORNING');
  assert.equal(greeting({ firstName: 'Ana', context, date: '2026-10-10T12:00:00.000Z' }), 'Bom dia, Ana.');
});
