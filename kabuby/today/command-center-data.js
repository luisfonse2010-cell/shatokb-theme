/**
 * Compatibility export for the former command-center fixture. It is a UI
 * contract only: no decision, count, product, or commercial value lives here.
 * Canonical read-model data is requested at runtime by app.js.
 */
export const COMMAND_CENTER_PROJECTION_CONTRACT = Object.freeze({
  source: 'GET /api/v1/intelligence/physical',
  mode: 'SERVER_SIDE_READ_ONLY_PROJECTION',
  persistence: 'NONE',
  commercial_authority: 'NONE',
  commercial_mutations: 0,
  provider_calls: 0,
  scout: 'PRESERVE_AS_IS_PROTECTED',
  fallback: 'EXPLICIT_WAITING_FOR_AUTHENTICATED_PROJECTION'
});
