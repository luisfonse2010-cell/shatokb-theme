(function () {
  'use strict';
  window.KABUBY_TODAY_VALIDATED_FALLBACK = Object.freeze({
    contract_version: 'kabuby-executive-today-read/v1',
    business: 'SHATO',
    source: 'KIL4B_REAL_VALIDATED_SNAPSHOT',
    source_mode: 'VALIDATED_FALLBACK',
    data_state: 'PARTIAL',
    data_completeness: 'PARTIAL_VALIDATED_FALLBACK',
    last_valid_observation_at: '2026-09-11T00:00:00.000Z',
    business_health: 'ATTENTION_NEEDED',
    executive_summary: { raw_recommendations: 14, executive_groups: 9, owner_decisions: 2, investigations: 3, operational_attention: 2, ready_for_plan: 0, brief: 'La evidencia disponible muestra asuntos que necesitan atención, pero no indica que todo el negocio esté en riesgo.' },
    needs_owner_decision: [
      { key: 'inventory_policy', title: 'Inventario y reposición', detail: 'Definir cobertura, lead time, velocidad y stock de seguridad.' },
      { key: 'automatic_repricing_policy', title: 'Cambio automático de precio', detail: 'Definir el cambio máximo permitido dentro de política.' }
    ],
    confirmed_owner_decisions: [
      { label: 'Moneda base', value: 'USD' },
      { label: 'Objetivos comerciales', value: 'Ventas rentables · cobertura · margen · disponibilidad · calidad' },
      { label: 'Estrategia de canales', value: 'Shopify: catálogo, datos e inventario · Mercado Libre y eBay: ventas prioritarias · Amazon: proveedor y validación' },
      { label: 'Política de margen', value: 'Mínimo 20% · objetivo 30% o más' }
    ],
    kabuby_investigating: [
      { title: 'Evidencia económica de Mercado Libre', detail: 'Falta información oficial para 3 productos.', status: 'Investigando' },
      { title: 'Mapping de catálogo', detail: 'Hay que revisar el mapping de 2 productos.', status: 'Revisión' },
      { title: 'Observaciones vigentes', detail: 'Falta una observación actual para 3 productos.', status: 'Monitoreando' }
    ],
    operational_attention: [
      { title: 'Comisiones de Mercado Libre', detail: '3 productos · evidencia insuficiente', risk: 'Bloqueado', confidence: 'Confianza baja' },
      { title: 'Mapping de productos', detail: '2 productos requieren revisión', risk: 'Bloqueado', confidence: 'Confianza alta' }
    ],
    opportunities: [],
    what_changed: { new: 6, ongoing: 5, changed: 0, resolved: 0, awaiting_evidence: 3, reappeared: 0 },
    results: [],
    knowledge_gaps: [
      { title: 'Inventario y reposición', detail: 'Cobertura, lead time, velocidad y stock de seguridad.' },
      { title: 'Repricing automático', detail: 'Cambio máximo permitido dentro de política.' }
    ],
    next_best_action: 'Investigar primero la información económica oficial de Mercado Libre pendiente para tres productos.',
    repricer_roadmap: ['Supplier Monitor', 'Cost Change', 'Recalculate Economics', 'Margin Protection', 'Competitive Price', 'Automatic Repricing Within Policy', 'Verification'],
    authority: { action_buttons_executable: false, arm_allowed: false, execute_allowed: false, writes_allowed: false },
    writes: 0
  });
}());
