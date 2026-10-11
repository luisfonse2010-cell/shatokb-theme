const LANGUAGE_AUTO = 'AUTO';
const SUPPORTED_LANGUAGES = Object.freeze(['en', 'es', 'pt']);
const PREFERENCE_KEY = 'kabuby_ui_language_preference_v1';

const COPY = Object.freeze({
  en: Object.freeze({
    OWNER_ACTION_REQUIRED: 'Needs your decision', UNKNOWN: 'Unknown', STALE: 'Stale', PARTIAL: 'Partial', BLOCKED: 'Blocked', WAITING_FOR_EVIDENCE: 'Waiting for evidence', NOT_PROVEN: 'Not proven',
    MORNING: 'Good morning, {firstName}.', AFTERNOON: 'Good afternoon, {firstName}.', EVENING: 'Good evening, {firstName}.', NIGHT: 'Good night, {firstName}.'
  }),
  es: Object.freeze({
    OWNER_ACTION_REQUIRED: 'Requiere tu decisión', UNKNOWN: 'Sin confirmar', STALE: 'Desactualizado', PARTIAL: 'Parcial', BLOCKED: 'Bloqueado', WAITING_FOR_EVIDENCE: 'Esperando evidencia', NOT_PROVEN: 'No demostrado',
    MORNING: 'Buenos días, {firstName}.', AFTERNOON: 'Buenas tardes, {firstName}.', EVENING: 'Buenas noches, {firstName}.', NIGHT: 'Buenas noches, {firstName}.'
  }),
  pt: Object.freeze({
    OWNER_ACTION_REQUIRED: 'Requer sua decisão', UNKNOWN: 'Desconhecido', STALE: 'Desatualizado', PARTIAL: 'Parcial', BLOCKED: 'Bloqueado', WAITING_FOR_EVIDENCE: 'Aguardando evidência', NOT_PROVEN: 'Não comprovado',
    MORNING: 'Bom dia, {firstName}.', AFTERNOON: 'Boa tarde, {firstName}.', EVENING: 'Boa noite, {firstName}.', NIGHT: 'Boa noite, {firstName}.'
  })
});

const asString = value => typeof value === 'string' ? value.trim() : '';
export function normalizeLanguage(value) {
  const normalized = asString(value).toLowerCase();
  if (!normalized || normalized === LANGUAGE_AUTO.toLowerCase()) return LANGUAGE_AUTO;
  const base = normalized.split('-')[0];
  return SUPPORTED_LANGUAGES.includes(base) ? base : LANGUAGE_AUTO;
}
export function detectLanguage(userLocale = '') {
  const base = asString(userLocale).toLowerCase().split('-')[0];
  return SUPPORTED_LANGUAGES.includes(base) ? base : 'en';
}
export function resolveLanguage({ preference = LANGUAGE_AUTO, userLocale = '' } = {}) {
  const requested = normalizeLanguage(preference);
  return requested === LANGUAGE_AUTO ? detectLanguage(userLocale) : requested;
}
export function createPresentationContext({ uiLanguage = LANGUAGE_AUTO, userLocale = '', timezone = null, country = null, marketplace = null, marketplaceGeography = null, currency = null } = {}) {
  return Object.freeze({
    ui_language: resolveLanguage({ preference: uiLanguage, userLocale }),
    ui_language_preference: normalizeLanguage(uiLanguage),
    user_locale: asString(userLocale) || null,
    timezone: asString(timezone) || null,
    country: asString(country) || null,
    marketplace: asString(marketplace) || null,
    marketplace_geography: asString(marketplaceGeography) || null,
    currency: asString(currency) || null
  });
}
export function message(key, context = {}, values = {}) {
  const language = resolveLanguage({ preference: context.ui_language ?? context.uiLanguage, userLocale: context.user_locale ?? context.userLocale });
  const template = COPY[language]?.[key] ?? COPY.en[key] ?? key;
  return template.replace(/\{([A-Za-z]+)\}/g, (_match, name) => asString(values[name]) || '');
}
export function daypart({ date = new Date(), timezone = null } = {}) {
  const value = date instanceof Date && Number.isFinite(date.valueOf()) ? date : new Date(date);
  if (!Number.isFinite(value.valueOf())) return 'NIGHT';
  let hour = value.getHours();
  const zone = asString(timezone);
  if (zone) {
    try {
      const part = new Intl.DateTimeFormat('en-US', { hour: '2-digit', hourCycle: 'h23', timeZone: zone }).formatToParts(value).find(item => item.type === 'hour');
      if (part && /^\d{2}$/.test(part.value)) hour = Number(part.value);
    } catch { /* Invalid timezone intentionally falls back to local time. */ }
  }
  if (hour >= 6 && hour < 12) return 'MORNING';
  if (hour >= 12 && hour < 18) return 'AFTERNOON';
  if (hour >= 18 && hour < 22) return 'EVENING';
  return 'NIGHT';
}
export function greeting({ firstName = '', context = {}, date = new Date() } = {}) {
  return message(daypart({ date, timezone: context.timezone }), context, { firstName });
}
export function formatNumber(value, context = {}, options = {}) {
  if (!Number.isFinite(value)) return message('UNKNOWN', context);
  return new Intl.NumberFormat(context.user_locale || undefined, options).format(value);
}
export function formatCurrency(value, currency, context = {}) {
  if (!Number.isFinite(value) || !/^[A-Z]{3}$/.test(asString(currency))) return message('UNKNOWN', context);
  return new Intl.NumberFormat(context.user_locale || undefined, { style: 'currency', currency }).format(value);
}
export function readLanguagePreference(storage = globalThis.localStorage) {
  try { return normalizeLanguage(storage?.getItem(PREFERENCE_KEY)); } catch { return LANGUAGE_AUTO; }
}
export function writeLanguagePreference(preference, storage = globalThis.localStorage) {
  const value = normalizeLanguage(preference);
  try { storage?.setItem(PREFERENCE_KEY, value); } catch { return LANGUAGE_AUTO; }
  return value;
}

export const KabubyI18n = Object.freeze({ LANGUAGE_AUTO, SUPPORTED_LANGUAGES, COPY, normalizeLanguage, detectLanguage, resolveLanguage, createPresentationContext, message, daypart, greeting, formatNumber, formatCurrency, readLanguagePreference, writeLanguagePreference });
if (typeof window !== 'undefined') window.KabubyI18n = KabubyI18n;
