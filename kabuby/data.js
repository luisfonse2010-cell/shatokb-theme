/**
 * Presentation-only configuration. Business values are loaded exclusively from
 * GET /api/v1/intelligence/physical; this file intentionally contains no
 * operational snapshot, fallback metrics, opportunity, or marketplace data.
 */
import './home-opportunities-interactive.js';
import './b0006-commercial-dossier.js';

export const PHYSICAL_PROJECTION_PATH = '/api/v1/intelligence/physical';
export const PROJECTION_UI_CONTRACT = Object.freeze({
  source: 'CERTIFIED_PHYSICAL_READ_ONLY_PROJECTION',
  route: PHYSICAL_PROJECTION_PATH,
  method: 'GET',
  authentication: 'GATE1_CF_ACCESS_SAME_ORIGIN_READ_ONLY',
  gateway: 'PAGES_FUNCTION_TO_PRIVATE_WORKER_SERVICE_BINDING',
  commercial_authority: 'NONE',
  commercial_actions_enabled: false,
  provider_calls: 0,
  commercial_mutations: 0,
  raw_provider_payloads_exposed: false,
  scout_boundary: 'INTEGRATED_OWNER_SURFACE_COMPATIBILITY_RUNTIME_PRESERVED'
});

export const NAVIGATION = Object.freeze([
  ['today', 'nav.today', '⌂'],
  ['opportunities', 'nav.opportunities', '◇'],
  ['scout', 'nav.scout', '⌁'],
  ['supply', 'nav.supply', '▣'],
  ['economics', 'nav.economics', '⌁'],
  ['operations', 'nav.operations', '⌘'],
  ['portfolio', 'nav.portfolio', '◇'],
  ['learning', 'nav.learning', '◎'],
  ['settings', 'nav.settings', '⚙']
]);

export const DAYPARTS = Object.freeze({
  MORNING: Object.freeze({ start: 6, end: 11, key: 'morning' }),
  AFTERNOON: Object.freeze({ start: 12, end: 17, key: 'afternoon' }),
  EVENING: Object.freeze({ start: 18, end: 21, key: 'evening' }),
  NIGHT: Object.freeze({ start: 22, end: 5, key: 'night' })
});
