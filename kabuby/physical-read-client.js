(function () {
  'use strict';
  const ENDPOINT = 'https://api.kabuby.com/api/v1/intelligence/physical';
  const STATES = new Set(['loading', 'loaded', 'empty', 'partial', 'stale', 'blocked', 'error', 'unauthorized', 'unknown']);
  const safeState = value => STATES.has(value) ? value : 'unknown';
  const isObject = value => value && typeof value === 'object' && !Array.isArray(value);
  const noWrite = value => value?.commercial_authority === 'NONE' && value?.commercial_mutations === 0 && value?.commercial_actions_enabled === false;
  function validate(payload) {
    const physical = payload?.physical;
    if (!isObject(physical) || physical.schema_version !== 'kabuby-physical-read-only-projection/v1' || !noWrite(physical)) throw new Error('PHYSICAL_READ_MODEL_CONTRACT_REJECTED');
    return Object.freeze(physical);
  }
  async function read(options) {
    const signal = options?.signal;
    try {
      const response = await fetch(ENDPOINT, { method: 'GET', credentials: 'include', headers: { Accept: 'application/json' }, signal });
      if (response.status === 401 || response.status === 403) return Object.freeze({ state: 'unauthorized', data: null, error: 'AUTHENTICATION_REQUIRED' });
      if (!response.ok) return Object.freeze({ state: 'error', data: null, error: `HTTP_${response.status}` });
      const data = validate(await response.json());
      const empty = data.physical_command_center?.status === 'NO_EXECUTIVE_DECISION_PACKAGES' && data.supply_intelligence?.status === 'NO_SUPPLY_INTELLIGENCE';
      return Object.freeze({ state: empty ? 'empty' : 'loaded', data, error: null });
    } catch (error) {
      return Object.freeze({ state: safeState(error?.name === 'AbortError' ? 'error' : 'partial'), data: null, error: 'READ_ONLY_PROJECTION_UNAVAILABLE' });
    }
  }
  window.KabubyPhysicalRead = Object.freeze({ endpoint: ENDPOINT, read, states: Object.freeze([...STATES]), mode: 'READ_ONLY_AUTHENTICATED' });
}());
