(function () {
  'use strict';
  const ENDPOINT = 'https://api.kabuby.com/api/v1/intelligence/today';
  const CACHE_KEY = 'kabuby_today_last_valid_v1';
  const fallback = window.KABUBY_TODAY_VALIDATED_FALLBACK;
  const forcedState = new URLSearchParams(location.search).get('today_state');
  const allowedStates = new Set(['loading', 'loaded', 'partial', 'stale', 'error', 'unauthorized']);

  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  const button = label => `<button class="today-action" type="button" data-today-inert>${escapeHtml(label)} <span aria-hidden="true">→</span></button>`;
  const empty = (title, detail) => `<div class="today-empty"><span>◇</span><strong>${escapeHtml(title)}</strong><p>${escapeHtml(detail)}</p></div>`;
  const formatObservedAt = value => value ? new Intl.DateTimeFormat('es-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Sin observación válida';

  function normalize(payload) {
    return payload?.data?.executive_today || payload?.executive_today || payload;
  }

  function statusCopy(state) {
    return {
      loaded: ['Actualizado', 'Datos del modelo KIL en vivo'],
      partial: ['Vista parcial', 'Snapshot validado KIL4B; no es tiempo real'],
      stale: ['Datos desactualizados', 'Se conserva la última observación válida'],
      error: ['Sin actualización', 'No fue posible refrescar; se muestra la última observación válida'],
      unauthorized: ['Acceso requerido', 'Inicia sesión mediante Cloudflare Access para ver datos actuales'],
      loading: ['Actualizando', 'Consultando la inteligencia ejecutiva de Kabuby']
    }[state] || ['Vista parcial', 'Evidencia limitada'];
  }

  function renderShell(data, state) {
    const root = document.getElementById('tab-home');
    if (!root) return;
    const summary = data.executive_summary || {};
    const changed = data.what_changed || {};
    const [status, detail] = statusCopy(state);
    const visibleDetail = data.source_mode === 'QA_STATE_PREVIEW' ? 'Vista local de validación; no es una fuente de negocio' : detail;
    root.innerHTML = `<div class="today-page" data-today-state="${state}">
      <header class="today-header">
        <div><p class="today-eyebrow">Centro de decisiones</p><h1>KABUBY <span>— HOY</span></h1><p class="today-lede">Lo importante para dirigir Shato hoy, con evidencia y sin ejecutar cambios.</p></div>
        <div class="today-freshness ${state}"><i></i><div><strong>${status}</strong><span>${visibleDetail}</span><small>Última observación válida: ${escapeHtml(formatObservedAt(data.last_valid_observation_at))}</small></div></div>
      </header>
      <section class="today-hero">
        <article class="today-brief"><p class="today-eyebrow">Resumen ejecutivo</p><h2>Hay <em>${summary.operational_attention ?? 0} temas</em> que necesitan atención operativa.</h2><p>${escapeHtml(summary.brief)}</p><div class="today-recommendation"><span>Recomendación para hoy</span><strong>${escapeHtml(data.next_best_action)}</strong></div></article>
        <aside class="today-health"><span>Estado del negocio</span><div class="today-orbit"><strong>Atención</strong><small>evidencia disponible</small></div><dl><div><dt>${summary.raw_recommendations ?? 0}</dt><dd>recomendaciones</dd></div><div><dt>${summary.executive_groups ?? 0}</dt><dd>temas ejecutivos</dd></div></dl></aside>
      </section>
      ${section('Decisiones del owner', 'Necesita tu decisión', data.needs_owner_decision, item => `<article class="today-decision"><span>!</span><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.detail)}</p></div>${button('Responder')}</article>`, `${data.needs_owner_decision?.length ?? 0} pendientes`)}
      <details class="today-confirmed"><summary>${data.confirmed_owner_decisions?.length ?? 0} decisiones confirmadas conceptualmente</summary>${(data.confirmed_owner_decisions || []).map(item => `<div><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(typeof item.value === 'string' ? item.value : JSON.stringify(item.value))}</span></div>`).join('')}</details>
      ${section('En segundo plano', 'Kabuby está investigando', data.kabuby_investigating, item => `<article class="today-row"><span class="today-row-icon">⌁</span><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.detail)}</p></div><b>${escapeHtml(item.status)}</b>${button('Ver evidencia')}</article>`, 'En curso')}
      <section class="today-split">
        <div>${section('Requiere revisión', 'Atención operativa', data.operational_attention, item => `<article class="today-row attention"><span class="today-row-icon">⚑</span><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.detail)}</p><small>${escapeHtml(item.risk)} · ${escapeHtml(item.confidence)}</small></div>${button('Investigar')}</article>`)}</div>
        <div>${section('Crecimiento', 'Oportunidades', data.opportunities, item => `<article class="today-row"><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.detail)}</p></div>${button('Revisar')}</article>`) || empty('Nada listo para actuar', `Hay ${summary.raw_recommendations ?? 0} recomendaciones, pero ninguna tiene evidencia suficiente para preparar una acción comercial.`)}</div>
      </section>
      <section class="today-section"><div class="today-section-head"><div><p class="today-eyebrow">Desde la última revisión</p><h2>Qué cambió</h2></div></div><div class="today-changes">${[['Nuevas', changed.new], ['En curso', changed.ongoing], ['Cambiadas', changed.changed], ['Resueltas', changed.resolved], ['Esperando evidencia', changed.awaiting_evidence], ['Reaparecidas', changed.reappeared]].map(([label, value]) => `<article><strong>${value ?? 0}</strong><span>${label}</span></article>`).join('')}</div></section>
      <section class="today-split today-bottom"><article class="today-panel"><p class="today-eyebrow">Cerrado</p><h2>Resultados / resuelto</h2>${data.results?.length ? data.results.map(item => `<p>${escapeHtml(item.title || item)}</p>`).join('') : empty('Sin resultados atribuidos', 'Este snapshot todavía no contiene resultados confirmados.')}</article><article class="today-panel knowledge"><p class="today-eyebrow">Política pendiente</p><h2>Lo que Kabuby necesita aprender</h2>${(data.knowledge_gaps || []).map((item, index) => `<div><b>0${index + 1}</b><p><strong>${escapeHtml(item.title)}</strong><br>${escapeHtml(item.detail)}</p></div>`).join('')}</article></section>
      <section class="today-repricer"><p class="today-eyebrow">Dirección del repricer automático</p><h2>El owner aprueba la política. Kabuby opera dentro de ella.</h2><div>${(data.repricer_roadmap || []).map((step, index) => `<span>${escapeHtml(step)}${index < data.repricer_roadmap.length - 1 ? '<i>→</i>' : ''}</span>`).join('')}</div><p>Las excepciones escalan; no se requiere aprobación por SKU dentro de la política aprobada.</p></section>
      <footer class="today-footer"><span>Fuente: ${escapeHtml(data.source_mode || data.source)}</span><span>Solo lectura · ARM desactivado · ejecución desactivada · escrituras 0</span></footer>
    </div>`;
    bindInertActions();
  }

  function section(kicker, title, items = [], itemRenderer, badge = '') {
    if (!items.length && title === 'Oportunidades') return '';
    return `<section class="today-section"><div class="today-section-head"><div><p class="today-eyebrow">${kicker}</p><h2>${title}</h2></div>${badge ? `<span>${badge}</span>` : ''}</div><div class="today-list">${items.map(itemRenderer).join('')}</div></section>`;
  }

  function bindInertActions() {
    document.querySelectorAll('[data-today-inert]').forEach(element => element.addEventListener('click', () => {
      if (typeof window.showNotif === 'function') window.showNotif('Vista de solo lectura — ninguna acción fue ejecutada.', 'info');
    }));
  }

  function renderLoading() {
    const root = document.getElementById('tab-home');
    if (root) root.innerHTML = '<div class="today-page"><div class="today-loading"><i></i><p>Preparando tu resumen de hoy…</p><span>Consultando evidencia sin ejecutar cambios.</span></div></div>';
  }

  async function load() {
    renderLoading();
    if (forcedState && allowedStates.has(forcedState)) {
      if (forcedState === 'loading') return;
      renderShell(forcedState === 'loaded' ? { ...fallback, source_mode: 'QA_STATE_PREVIEW' } : fallback, forcedState);
      return;
    }
    try {
      const response = await fetch(ENDPOINT, { method: 'GET', credentials: 'include', headers: { Accept: 'application/json' } });
      if (response.status === 401 || response.status === 403) return renderShell(fallback, 'unauthorized');
      if (!response.ok) throw new Error(`Executive Today HTTP ${response.status}`);
      const data = normalize(await response.json());
      if (!data || data.writes !== 0) throw new Error('Executive Today contract rejected');
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      renderShell(data, data.data_state?.toLowerCase() || 'loaded');
    } catch (error) {
      let cached = null;
      try { cached = JSON.parse(localStorage.getItem(CACHE_KEY)); } catch (_) { cached = null; }
      renderShell(cached || fallback, cached ? 'error' : 'partial');
      console.info('[Kabuby Today] Read-only refresh unavailable; preserving explicit fallback state.');
    }
  }

  function installNavigation() {
    const modulesTitle = document.querySelector('.sidebar-section-title.with-icon');
    if (modulesTitle && !document.getElementById('nav-home')) modulesTitle.insertAdjacentHTML('beforebegin', '<div class="sidebar-item today-nav active" onclick="showTab(\'home\')" id="nav-home"><i class="icon fas fa-sun"></i><span>Hoy</span></div>');
    const topbar = document.querySelector('.topbar > div');
    if (topbar && !document.getElementById('today-mobile-menu')) topbar.insertAdjacentHTML('afterbegin', '<button type="button" id="today-mobile-menu" aria-label="Abrir navegación"><i class="fas fa-bars"></i></button>');
    document.getElementById('today-mobile-menu')?.addEventListener('click', () => document.querySelector('.sidebar')?.classList.toggle('open'));
  }

  document.addEventListener('DOMContentLoaded', () => { installNavigation(); load(); });
  window.KabubyToday = Object.freeze({ reload: load, endpoint: ENDPOINT });
}());
