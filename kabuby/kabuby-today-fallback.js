(function () {
  'use strict';
  window.KABUBY_TODAY_VALIDATED_FALLBACK = Object.freeze({
    contract_version: 'kabuby-executive-today-read/v1',
    business: 'SHATO', source: 'HISTORICAL_FALLBACK_NOT_CURRENT', source_mode: 'STALE_FALLBACK_NOT_CURRENT',
    data_state: 'STALE', data_completeness: 'NO_CURRENT_CERTIFIED_EXECUTIVE_TRUTH', last_valid_observation_at: null,
    business_health: 'UNKNOWN', global_business_health: 'NOT_ESTABLISHED',
    executive_summary: { raw_recommendations: 0, executive_groups: 0, owner_decisions: 0, investigations: 0, operational_attention: 0, ready_for_plan: 0, brief: 'No hay un resumen ejecutivo certificado y vigente disponible localmente.' },
    needs_owner_decision: [], confirmed_owner_decisions: [], kabuby_investigating: [], operational_attention: [], opportunities: [],
    what_changed: { new: 0, ongoing: 0, changed: 0, resolved: 0, awaiting_evidence: 0, reappeared: 0 }, results: [], knowledge_gaps: [],
    owner_next_action: 'Inicia sesión para consultar la proyección autenticada actual.', kabuby_next_action: 'Esperar evidencia certificada antes de presentar recomendaciones.', next_best_action: 'Conecta la lectura autenticada de Kabuby Physical.',
    analysis_coverage: { status: 'STALE', products_analyzed: null, catalog_total: null, marketplaces_observed: [], sources_used: [], disclosure: 'No se usa este fallback como evidencia operacional actual.' },
    freshness: { state: 'STALE', updated_at: null, source: 'HISTORICAL_FALLBACK_NOT_CURRENT' }, repricer_roadmap: [],
    authority: { action_buttons_executable: false, arm_allowed: false, execute_allowed: false, writes_allowed: false }, writes: 0
  });
}());
