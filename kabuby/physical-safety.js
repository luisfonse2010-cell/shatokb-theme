(function () {
  'use strict';
  const legacyModules = [
    ['nav-mod-arbitrage', 'tab-arbitrage', 'Cazador de Arbitraje'],
    ['nav-mod-prices', 'tab-price-monitor', 'Price Monitor'],
    ['nav-mod-ebay', 'tab-ebay-connect', 'eBay Connect'],
    ['nav-mod-ia', 'tab-prediccion-ia', 'Predicción IA'],
    ['nav-mod-saas', 'tab-saas-platform', 'SaaS Platform']
  ];
  const status = (name, state, detail) => `<section class="kabuby-legacy-state" role="status"><p class="kabuby-legacy-kicker">${state}</p><h2>${name}</h2><p>${detail}</p><p>Esta superficie conserva su historial, pero no está conectada a evidencia física certificada.</p><p class="kabuby-legacy-boundary">Solo lectura · sin compras · sin publicaciones · sin cambios de precio o inventario</p></section>`;
  function removeFromPrimaryNavigation(id) {
    const node = document.getElementById(id);
    if (!node) return;
    node.hidden = true;
    node.setAttribute('aria-hidden', 'true');
    node.removeAttribute('onclick');
  }
  function makeReadOnlyStatus(tabId, name, state, detail) {
    const tab = document.getElementById(tabId);
    if (tab) tab.innerHTML = status(name, state, detail);
  }
  function interceptRadar() {
    const node = document.getElementById('nav-mod-radar');
    if (!node) return;
    node.querySelector('.modulo-desc')?.replaceChildren(document.createTextNode('Lectura futura · sin conexión'));
    const badge = node.querySelector('.modulo-badge-fase');
    if (badge) { badge.textContent = 'NOT_CONNECTED'; badge.style.background = 'rgba(251,191,36,.15)'; badge.style.color = '#fbbf24'; }
    node.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      makeReadOnlyStatus('tab-radar-virales', 'Radar de oportunidades', 'NOT_CONNECTED', 'Las señales heredadas, caches y puntuaciones no son la verdad de oportunidades de Kabuby. La futura conexión consumirá exclusivamente product-opportunity-radar-read-model.');
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
      document.getElementById('tab-radar-virales')?.classList.add('active');
    }, true);
  }
  function install() {
    for (const [nav, tab, name] of legacyModules) {
      removeFromPrimaryNavigation(nav);
      makeReadOnlyStatus(tab, name, nav === 'nav-mod-ia' || nav === 'nav-mod-saas' ? 'COMING_LATER' : 'LEGACY_NOT_CONNECTED', 'No se presenta como una capacidad operacional, económica o comercial actual.');
    }
    interceptRadar();
  }
  document.addEventListener('DOMContentLoaded', install, { once: true });
}());
