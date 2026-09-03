/* ── KABUBY v2.0 — App Principal ── */

let vistaActual = 'cazador';
let candidatos = [];
let resultadosAnalisis = [];

// ── NAVEGACIÓN ──
function navegar(vista) {
  vistaActual = vista;
  document.querySelectorAll('.sidebar-item').forEach(el => {
    el.classList.toggle('active', el.dataset.vista === vista);
  });
  renderVista();
}

function renderVista() {
  const main = document.getElementById('main-content');
  switch(vistaActual) {
    case 'cazador':    main.innerHTML = renderCazador(); bindCazador(); break;
    case 'resultados': main.innerHTML = renderResultados(); break;
    case 'portafolio': main.innerHTML = renderPortafolio(); bindPortafolio(); break;
    case 'alertas':    main.innerHTML = renderAlertas(); break;
    case 'calculadora':main.innerHTML = renderCalculadora(); bindCalculadora(); break;
    default: main.innerHTML = renderCazador(); bindCazador();
  }
  actualizarStats();
}

// ── STATS HEADER ──
function actualizarStats() {
  const portfolio = dbGet(DB_PORTFOLIO);
  const ops = dbGet(DB_OPORTUNIDADES);
  const activos = portfolio.filter(p => p.fase !== 'cerrado' && p.fase !== 'pausado');
  const ganancias = portfolio.reduce((s, p) => s + (p.ganancia_total || 0), 0);
  const alertas = portfolio.filter(p => p.alerta && p.alerta !== '').length;

  const el = id => document.getElementById(id);
  if (el('stat-activos')) el('stat-activos').textContent = activos.length;
  if (el('stat-oportunidades')) el('stat-oportunidades').textContent = ops.filter(o => o.estado === 'nueva').length;
  if (el('stat-ganancias')) el('stat-ganancias').textContent = fmt(ganancias);
  if (el('stat-alertas')) el('stat-alertas').textContent = alertas;

  // Badge sidebar alertas
  const badgeAlertas = document.getElementById('badge-alertas');
  if (badgeAlertas) badgeAlertas.textContent = alertas || '';
}

// ════════════════════════════════════════
// MÓDULO 1 — CAZADOR DE OPORTUNIDADES
// ════════════════════════════════════════
function renderCazador() {
  return `
  <div class="card">
    <div class="card-header">
      <div>
        <div class="card-title">🎯 Cazador de Oportunidades</div>
        <div class="card-subtitle">Pega los productos que viste en TikTok, Amazon o donde sea — Kabuby analiza todo LATAM</div>
      </div>
      <div style="display:flex;gap:8px">
        <a href="https://ads.tiktok.com/business/creativecenter/inspiration/topproducts/pc/en" target="_blank" class="btn btn-secondary btn-sm">🎵 TikTok Trends</a>
        <a href="https://www.amazon.com/gp/movers-and-shakers/" target="_blank" class="btn btn-secondary btn-sm">📦 Amazon Movers</a>
      </div>
    </div>

    <div class="grid-2">
      <div>
        <div class="input-label">📋 Productos candidatos (uno por línea)</div>
        <div class="candidato-list" id="candidatos-list"></div>
        <button class="btn btn-secondary btn-sm w-full" onclick="agregarCandidato()">+ Agregar producto</button>
      </div>
      <div>
        <div class="input-group">
          <label class="input-label">💰 Tu ganancia deseada por venta (USD)</label>
          <input class="input" type="number" id="inp-ganancia" value="20" min="5" max="200" placeholder="20">
        </div>
        <div class="input-group">
          <label class="input-label">⚖️ Peso estimado del producto</label>
          <select class="input" id="inp-peso">
            <option value="150">Muy liviano — sobres, cremas pequeñas (&lt;200g)</option>
            <option value="350" selected>Liviano — frascos, suplementos (200-500g)</option>
            <option value="750">Medio — kits, sets (500g-1kg)</option>
            <option value="1500">Pesado — más de 1kg</option>
          </select>
        </div>
        <div class="input-group">
          <label class="input-label">📦 Fuente donde lo encontraste</label>
          <select class="input" id="inp-fuente">
            ${FUENTES.map(f => `<option value="${f.id}">${f.icon} ${f.nombre}</option>`).join('')}
          </select>
        </div>
        <div class="input-group">
          <label class="input-label">🏷️ Categoría</label>
          <select class="input" id="inp-categoria">
            ${CATEGORIAS.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <div class="input-group">
          <label class="input-label">🌎 Países a verificar</label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:4px" id="paises-check">
            ${PAISES.map(p => `
              <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;padding:6px 8px;background:var(--bg3);border-radius:6px">
                <input type="checkbox" value="${p.id}" checked style="accent-color:var(--accent)">
                ${p.flag} ${p.nombre}
              </label>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

    <div style="margin-top:16px;display:flex;gap:10px;align-items:center">
      <button class="btn btn-primary" onclick="analizarCandidatos()" id="btn-analizar">
        🚀 Analizar en todos los países
      </button>
      <button class="btn btn-secondary" onclick="limpiarCandidatos()">🗑️ Limpiar</button>
      <span class="text-muted text-sm" id="analisis-status"></span>
    </div>
  </div>

  <div id="resultados-inline"></div>
  `;
}

function bindCazador() {
  // Restaurar candidatos existentes
  if (candidatos.length === 0) candidatos = [''];
  renderCandidatosList();
}

function renderCandidatosList() {
  const list = document.getElementById('candidatos-list');
  if (!list) return;
  list.innerHTML = candidatos.map((c, i) => `
    <div class="candidato-item">
      <input class="candidato-input" type="text" value="${c}"
        placeholder="ej: cerave moisturizing cream, magnesium glycinate..."
        oninput="candidatos[${i}]=this.value"
        onkeydown="if(event.key==='Enter'){agregarCandidato()}"
      >
      <button class="candidato-remove" onclick="quitarCandidato(${i})" title="Quitar">✕</button>
    </div>
  `).join('');
}

function agregarCandidato() {
  candidatos.push('');
  renderCandidatosList();
  const inputs = document.querySelectorAll('.candidato-input');
  if (inputs.length) inputs[inputs.length-1].focus();
}

function quitarCandidato(i) {
  candidatos.splice(i, 1);
  if (candidatos.length === 0) candidatos = [''];
  renderCandidatosList();
}

function limpiarCandidatos() {
  candidatos = [''];
  renderCandidatosList();
  document.getElementById('resultados-inline').innerHTML = '';
}

async function analizarCandidatos() {
  const nombres = candidatos.filter(c => c.trim().length > 0);
  if (nombres.length === 0) {
    alert('Agrega al menos un producto para analizar');
    return;
  }

  const ganancia = parseFloat(document.getElementById('inp-ganancia').value) || 20;
  const peso = parseInt(document.getElementById('inp-peso').value) || 350;
  const fuente = document.getElementById('inp-fuente').value;
  const categoria = document.getElementById('inp-categoria').value;
  const paisesSeleccionados = [...document.querySelectorAll('#paises-check input:checked')].map(el => el.value);

  const btn = document.getElementById('btn-analizar');
  const status = document.getElementById('analisis-status');
  btn.disabled = true;
  btn.textContent = '⏳ Analizando...';

  const container = document.getElementById('resultados-inline');
  container.innerHTML = `<div class="loading"><div class="spinner"></div> Consultando Mercado Libre en ${paisesSeleccionados.length} países para ${nombres.length} producto(s)...</div>`;

  resultadosAnalisis = [];

  for (let i = 0; i < nombres.length; i++) {
    const nombre = nombres[i].trim();
    status.textContent = `(${i+1}/${nombres.length}) Analizando: ${nombre}...`;

    const resultado = await analizarProducto(nombre, ganancia, peso, fuente, categoria, paisesSeleccionados);
    resultadosAnalisis.push(resultado);
  }

  resultadosAnalisis.sort((a, b) => b.scoreMax - a.scoreMax);

  btn.disabled = false;
  btn.textContent = '🚀 Analizar en todos los países';
  status.textContent = `✅ ${nombres.length} producto(s) analizados`;

  container.innerHTML = renderResultadosInline(resultadosAnalisis);
}

async function analizarProducto(nombre, ganancia, peso, fuente, categoria, paises) {
  const paisesData = {};
  let scoreMax = 0;
  let mejorPais = null;

  for (const paisId of paises) {
    const pais = PAISES.find(p => p.id === paisId);
    if (!pais) continue;

    // Consultar ML
    let vendedores = null;
    let precioPromedio = 0;

    try {
      const url = `https://api.mercadolibre.com/sites/ML${paisId}/search?q=${encodeURIComponent(nombre)}&limit=10`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const data = await res.json();
        vendedores = data.paging?.total || 0;
        const items = data.results || [];
        if (items.length > 0) {
          const precios = items.map(it => it.price).filter(p => p > 0);
          precioPromedio = precios.length > 0 ? precios.reduce((a,b)=>a+b,0)/precios.length : 0;
        }
      }
    } catch(e) { vendedores = null; }

    const margen = calcularMargen(ganancia * 1.5, ganancia, paisId);
    const score = vendedores !== null ? calcularScore(vendedores, precioPromedio, margen.precioML, 80, 500) : 0;

    if (score > scoreMax) { scoreMax = score; mejorPais = paisId; }

    paisesData[paisId] = {
      vendedores,
      precioPromedio: Math.round(precioPromedio * 100) / 100,
      margen,
      score,
      urlML: pais.ml + encodeURIComponent(nombre),
    };
  }

  // Tipo de demanda estimado (sin API de Trends real, usamos heurística)
  const totalVendedores = Object.values(paisesData).reduce((s, p) => s + (p.vendedores || 0), 0);
  const demanda = clasificarDemanda(80, false, 500, totalVendedores);
  const ventana = estimarVentana(totalVendedores, 80, demanda.tipo);

  return { nombre, ganancia, peso, fuente, categoria, paises: paisesData, demanda, ventana, scoreMax, mejorPais, totalVendedores };
}

function renderResultadosInline(resultados) {
  if (resultados.length === 0) return '';

  return `
  <div class="card">
    <div class="card-header">
      <div class="card-title">📊 Resultados del Análisis</div>
      <span class="text-muted text-sm">${resultados.length} producto(s) — ordenados por oportunidad</span>
    </div>
    ${resultados.map((r, idx) => renderProductoCard(r, idx)).join('')}
  </div>
  `;
}

function renderProductoCard(r, idx) {
  const nivel = r.scoreMax >= 70 ? 'oportunidad-alta' : r.scoreMax >= 40 ? 'oportunidad-media' : 'oportunidad-baja';
  const scoreClase = r.scoreMax >= 70 ? 'score-high' : r.scoreMax >= 40 ? 'score-mid' : 'score-low';
  const medallones = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];

  const paisesHtml = Object.entries(r.paises).map(([paisId, data]) => {
    const pais = PAISES.find(p => p.id === paisId);
    const v = data.vendedores;
    const vStr = v === null ? '?' : v;
    const vClase = v === null ? 'text-muted' : colorVendedores(v);
    const status = v === null ? '—' : v === 0 ? '🔥 Nadie' : v <= 4 ? '✅ Entrar' : v <= 12 ? '⚡ Pronto' : '⚠️ Vigilar';
    return `
      <div class="pais-item">
        <span class="pais-flag">${pais.flag}</span>
        <div class="pais-nombre">${pais.nombre}</div>
        <div class="pais-vendedores ${vClase}">${vStr}</div>
        <div class="pais-precio">${data.precioPromedio > 0 ? fmt(data.precioPromedio) : '—'}</div>
        <div class="pais-status" style="color:${v===0?'var(--green)':v<=4?'var(--yellow)':v<=12?'var(--orange)':'var(--red)'}">${status}</div>
      </div>
    `;
  }).join('');

  // Mejor país para margen
  const mejorData = r.mejorPais ? r.paises[r.mejorPais] : null;
  const mg = mejorData ? mejorData.margen : null;

  const ventanaColor = r.ventana.estado === 'abierta' ? 'var(--green)' : r.ventana.estado === 'cerrando' ? 'var(--yellow)' : 'var(--red)';

  return `
  <div class="producto-card ${nivel}" style="margin-bottom:16px">
    <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px">
      <div class="score-badge ${scoreClase}">${r.scoreMax}</div>
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span style="font-size:16px">${medallones[idx] || '•'}</span>
          <span class="producto-nombre">${r.nombre}</span>
          <span class="tag ${r.demanda.clase}">${r.demanda.label}</span>
        </div>
        <div class="producto-meta">
          <span class="text-sm text-muted">📦 ${r.categoria}</span>
          <span class="text-sm text-muted">⚖️ ~${r.peso}g</span>
          <span class="text-sm text-muted">🌎 ${Object.keys(r.paises).length} países analizados</span>
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:11px;color:var(--muted);margin-bottom:4px">VENTANA</div>
        <div style="font-size:14px;font-weight:800;color:${ventanaColor}">${r.ventana.semanas} sem.</div>
      </div>
    </div>

    <!-- Países -->
    <div style="font-size:10px;font-weight:700;color:var(--muted);letter-spacing:1px;margin-bottom:8px">VENDEDORES EN MERCADO LIBRE POR PAÍS</div>
    <div class="paises-grid" style="grid-template-columns:repeat(${Object.keys(r.paises).length},1fr)">
      ${paisesHtml}
    </div>

    <!-- Ventana -->
    <div class="ventana-bar">
      <div class="ventana-label">⏱️ Ventana de oportunidad — ${r.demanda.duracion}</div>
      <div class="ventana-track"><div class="ventana-fill ${r.ventana.estado}" style="width:${r.ventana.pct}%"></div></div>
      <div class="ventana-texto" style="color:${ventanaColor}">${r.ventana.estado === 'abierta' ? '🟢 VENTANA ABIERTA' : r.ventana.estado === 'cerrando' ? '🟡 CERRANDO — actuar pronto' : '🔴 VENTANA CERRADA'}</div>
    </div>

    <!-- Margen por fase -->
    ${mg ? `
    <div style="font-size:10px;font-weight:700;color:var(--muted);letter-spacing:1px;margin-bottom:8px;margin-top:12px">TU MARGEN POR FASE — ${PAISES.find(p=>p.id===r.mejorPais)?.flag} ${PAISES.find(p=>p.id===r.mejorPais)?.nombre}</div>
    <div class="margen-row">
      <div class="margen-item">
        <div class="margen-fase">FASE 1 · AMAZON</div>
        <div class="margen-valor" style="color:${mg.f1.pct>=15?'var(--green)':mg.f1.pct>=5?'var(--yellow)':'var(--red)'}">${fmt(mg.f1.margen)}</div>
        <div class="margen-detalle">${mg.f1.pct}% margen · Costo ${fmt(mg.f1.costo)}</div>
        <div class="margen-detalle">Precio cliente: ${fmt(mg.precioCliente)}</div>
      </div>
      <div class="margen-item">
        <div class="margen-fase">FASE 2 · MAYORISTA</div>
        <div class="margen-valor" style="color:${mg.f2.pct>=20?'var(--green)':'var(--yellow)'}">${fmt(mg.f2.margen)}</div>
        <div class="margen-detalle">${mg.f2.pct}% margen · Costo ${fmt(mg.f2.costo)}</div>
      </div>
      <div class="margen-item">
        <div class="margen-fase">FASE 3 · IMPORTAR</div>
        <div class="margen-valor" style="color:var(--green)">${fmt(mg.f3.margen)}</div>
        <div class="margen-detalle">${mg.f3.pct}% margen · Costo ${fmt(mg.f3.costo)}</div>
      </div>
    </div>
    ` : ''}

    <!-- Plan de acción -->
    <div style="background:rgba(108,142,255,.04);border:1px solid rgba(108,142,255,.15);border-radius:10px;padding:12px;margin-top:12px">
      <div style="font-size:11px;font-weight:700;color:var(--accent);margin-bottom:6px">💡 ESTRATEGIA RECOMENDADA</div>
      <div style="font-size:12px;color:var(--text2);line-height:1.6">${r.demanda.estrategia}</div>
    </div>

    <!-- Acciones -->
    <div class="acciones-row">
      <button class="btn btn-success btn-sm" onclick="guardarEnPortafolio('${encodeURIComponent(JSON.stringify(r))}')">
        ✅ Guardar en Portafolio
      </button>
      ${Object.entries(r.paises).slice(0,3).map(([paisId, data]) => `
        <a href="${data.urlML}" target="_blank" class="btn btn-secondary btn-sm">
          ${PAISES.find(p=>p.id===paisId)?.flag} Ver en ML ${paisId}
        </a>
      `).join('')}
      <a href="https://www.amazon.com/s?k=${encodeURIComponent(r.nombre)}" target="_blank" class="btn btn-secondary btn-sm">
        📦 Amazon
      </a>
      <a href="https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(r.nombre)}" target="_blank" class="btn btn-secondary btn-sm">
        🏭 Alibaba
      </a>
    </div>
  </div>
  `;
}

function guardarEnPortafolio(dataEncoded) {
  try {
    const r = JSON.parse(decodeURIComponent(dataEncoded));
    const vendedoresPorPais = {};
    Object.entries(r.paises).forEach(([k, v]) => { vendedoresPorPais['v_'+k.toLowerCase()] = v.vendedores || 0; });

    const item = {
      nombre: r.nombre,
      categoria: r.categoria,
      peso: r.peso,
      fuente: r.fuente,
      tipo_demanda: r.demanda.tipo,
      fase_actual: 'prueba',
      ganancia_deseada: r.ganancia,
      score_inicial: r.scoreMax,
      ventana_semanas: r.ventana.semanas,
      ventas_total: 0,
      ganancia_total: 0,
      alerta: '',
      ...vendedoresPorPais,
      paises_activos: Object.keys(r.paises),
    };

    dbAdd(DB_PORTFOLIO, item);
    alert(`✅ "${r.nombre}" guardado en tu portafolio en Fase 1 — Prueba`);
    actualizarStats();
  } catch(e) { alert('Error al guardar: ' + e.message); }
}

// ════════════════════════════════════════
// MÓDULO 2 — PORTAFOLIO
// ════════════════════════════════════════
function renderPortafolio() {
  const items = dbGet(DB_PORTFOLIO);

  const activos = items.filter(p => p.fase_actual !== 'cerrado');
  const cerrados = items.filter(p => p.fase_actual === 'cerrado');

  return `
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
    <div>
      <div style="font-size:20px;font-weight:800">📋 Mi Portafolio</div>
      <div class="text-muted text-sm">${activos.length} productos activos · ${cerrados.length} cerrados</div>
    </div>
    <button class="btn btn-primary" onclick="navegar('cazador')">+ Buscar Oportunidad</button>
  </div>

  ${activos.length === 0 ? `
    <div class="empty-state">
      <div class="empty-icon">📦</div>
      <div class="empty-title">Portafolio vacío</div>
      <div class="empty-desc">Usa el Cazador para encontrar oportunidades<br>y guardarlas aquí para seguimiento.</div>
      <button class="btn btn-primary" style="margin-top:16px" onclick="navegar('cazador')">🎯 Ir al Cazador</button>
    </div>
  ` : `
    <div class="tabs">
      <button class="tab active" onclick="filtrarPortafolio('todos',this)">Todos (${activos.length})</button>
      <button class="tab" onclick="filtrarPortafolio('prueba',this)">⚗️ Prueba (${activos.filter(p=>p.fase_actual==='prueba').length})</button>
      <button class="tab" onclick="filtrarPortafolio('escalar',this)">📈 Escalar (${activos.filter(p=>p.fase_actual==='escalar').length})</button>
      <button class="tab" onclick="filtrarPortafolio('optimizar',this)">🚀 Optimizar (${activos.filter(p=>p.fase_actual==='optimizar').length})</button>
    </div>
    <div id="portfolio-list">
      ${activos.map(p => renderPortafolioItem(p)).join('')}
    </div>
  `}
  `;
}

function renderPortafolioItem(p) {
  const dias = diasDesde(p.fecha);
  const faseColor = { prueba:'var(--purple)', escalar:'var(--yellow)', optimizar:'var(--green)', pausado:'var(--muted)' };

  return `
  <div class="producto-card" id="pi-${p.id}">
    <div style="display:flex;align-items:flex-start;gap:12px">
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">
          <span class="producto-nombre">${p.nombre}</span>
          <span class="tag tag-${p.tipo_demanda||'tendencia'}">${p.tipo_demanda==='viral'?'⚡ VIRAL':p.tipo_demanda==='evergreen'?'🌳 EVERGREEN':'📈 TENDENCIA'}</span>
          <span class="tag tag-${p.fase_actual}">${p.fase_actual?.toUpperCase()}</span>
        </div>
        <div class="text-muted text-sm">${p.categoria || '—'} · ${dias} días en portafolio · Meta: ${fmt(p.ganancia_deseada || 20)}/venta</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:20px;font-weight:900;color:var(--green)">${fmt(p.ganancia_total || 0)}</div>
        <div class="text-muted text-sm">ganado total</div>
        <div style="font-size:14px;font-weight:700;color:var(--accent);margin-top:2px">${p.ventas_total || 0} ventas</div>
      </div>
    </div>

    <!-- Fase actual -->
    <div style="display:flex;gap:6px;margin:12px 0">
      ${['prueba','escalar','optimizar','pausado','cerrado'].map(f => `
        <button onclick="cambiarFase('${p.id}','${f}')"
          class="btn btn-xs ${p.fase_actual===f?'btn-primary':'btn-secondary'}"
          style="${p.fase_actual===f?'':'opacity:.6'}">
          ${f==='prueba'?'⚗️':f==='escalar'?'📈':f==='optimizar'?'🚀':f==='pausado'?'⏸️':'✅'} ${f}
        </button>
      `).join('')}
    </div>

    <!-- Registrar venta -->
    <div style="background:var(--bg3);border-radius:8px;padding:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <span style="font-size:12px;font-weight:600;color:var(--text2)">📦 Registrar venta:</span>
      <input type="number" class="input" style="width:100px;padding:6px 10px;font-size:12px"
        placeholder="Ganancia $" id="venta-${p.id}" value="${p.ganancia_deseada||20}">
      <button class="btn btn-success btn-sm" onclick="registrarVenta('${p.id}')">+ Registrar</button>
      <span style="font-size:11px;color:var(--muted)" id="venta-status-${p.id}"></span>
    </div>

    <!-- Notas -->
    <div style="margin-top:10px">
      <textarea class="input" style="font-size:11px;min-height:50px" placeholder="Notas, observaciones, proveedor, etc..."
        onchange="actualizarNota('${p.id}',this.value)">${p.notas||''}</textarea>
    </div>

    <!-- Acciones -->
    <div class="acciones-row">
      ${(p.paises_activos||['BR','MX']).slice(0,3).map(paisId => {
        const pais = PAISES.find(pp=>pp.id===paisId);
        return pais ? `<a href="${pais.ml}${encodeURIComponent(p.nombre)}" target="_blank" class="btn btn-secondary btn-xs">${pais.flag} ML ${paisId}</a>` : '';
      }).join('')}
      <a href="https://www.amazon.com/s?k=${encodeURIComponent(p.nombre)}" target="_blank" class="btn btn-secondary btn-xs">📦 Amazon</a>
      <button class="btn btn-danger btn-xs" onclick="eliminarProducto('${p.id}')">🗑️ Eliminar</button>
    </div>
  </div>
  `;
}

function bindPortafolio() {}

function filtrarPortafolio(fase, btn) {
  document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');

  const items = dbGet(DB_PORTFOLIO);
  const filtrados = fase === 'todos' ? items.filter(p=>p.fase_actual!=='cerrado') : items.filter(p=>p.fase_actual===fase);
  const list = document.getElementById('portfolio-list');
  if (list) list.innerHTML = filtrados.map(p => renderPortafolioItem(p)).join('') || `<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">Sin productos en esta fase</div></div>`;
}

function cambiarFase(id, fase) {
  dbUpdate(DB_PORTFOLIO, id, { fase_actual: fase });
  renderVista();
}

function registrarVenta(id) {
  const input = document.getElementById('venta-' + id);
  const ganancia = parseFloat(input?.value) || 0;
  if (ganancia <= 0) return;

  const items = dbGet(DB_PORTFOLIO);
  const item = items.find(p => p.id === id);
  if (!item) return;

  dbUpdate(DB_PORTFOLIO, id, {
    ventas_total: (item.ventas_total || 0) + 1,
    ganancia_total: (item.ganancia_total || 0) + ganancia,
  });

  const status = document.getElementById('venta-status-' + id);
  if (status) { status.textContent = `✅ +${fmt(ganancia)} registrado`; setTimeout(() => { status.textContent=''; }, 3000); }

  actualizarStats();
}

function actualizarNota(id, nota) {
  dbUpdate(DB_PORTFOLIO, id, { notas: nota });
}

function eliminarProducto(id) {
  if (!confirm('¿Eliminar este producto del portafolio?')) return;
  dbDelete(DB_PORTFOLIO, id);
  renderVista();
}

// ════════════════════════════════════════
// MÓDULO 3 — CALCULADORA DE ARBITRAJE
// ════════════════════════════════════════
function renderCalculadora() {
  return `
  <div class="card">
    <div class="card-header">
      <div class="card-title">💰 Calculadora de Arbitraje Miami → LATAM</div>
      <div class="card-subtitle">Calcula tu ganancia neta real antes de publicar</div>
    </div>

    <div class="grid-2">
      <div>
        <div class="input-group">
          <label class="input-label">🛒 Precio del producto en Amazon/Miami (USD)</label>
          <input class="input" type="number" id="calc-costo" placeholder="18.99" oninput="calcularLive()">
        </div>
        <div class="input-group">
          <label class="input-label">💵 Precio que quieres publicar en ML (USD)</label>
          <input class="input" type="number" id="calc-precio-ml" placeholder="45.00" oninput="calcularLive()">
        </div>
        <div class="input-group">
          <label class="input-label">🌎 País destino</label>
          <select class="input" id="calc-pais" onchange="calcularLive()">
            ${PAISES.map(p => `<option value="${p.id}">${p.flag} ${p.nombre}</option>`).join('')}
          </select>
        </div>
        <div class="input-group">
          <label class="input-label">⚖️ Fase de compra</label>
          <select class="input" id="calc-fase" onchange="calcularLive()">
            <option value="1">Fase 1 — Amazon retail (precio lleno)</option>
            <option value="2">Fase 2 — Mayorista USA (~25% menos)</option>
            <option value="3">Fase 3 — Import directo (~55% menos)</option>
          </select>
        </div>
      </div>
      <div id="calc-resultado" style="background:var(--bg3);border-radius:12px;padding:20px">
        <div class="text-muted text-sm" style="text-align:center;padding:40px 0">
          Ingresa los datos para calcular →
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-title" style="margin-bottom:16px">📊 Comparador de productos</div>
    <div class="text-muted text-sm mb-16">Compara hasta 3 productos para ver cuál tiene mejor margen</div>
    <div id="comparador-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
      ${[1,2,3].map(n => `
        <div style="background:var(--bg3);border-radius:10px;padding:14px">
          <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:10px">Producto ${n}</div>
          <input class="input" style="margin-bottom:8px;font-size:12px" placeholder="Nombre" id="cmp-nombre-${n}">
          <input class="input" style="margin-bottom:8px;font-size:12px" type="number" placeholder="Costo Amazon $" id="cmp-costo-${n}">
          <input class="input" style="margin-bottom:8px;font-size:12px" type="number" placeholder="Precio ML $" id="cmp-ml-${n}">
          <div id="cmp-resultado-${n}" style="margin-top:8px;font-size:12px"></div>
        </div>
      `).join('')}
    </div>
    <button class="btn btn-primary" style="margin-top:12px" onclick="compararProductos()">⚖️ Comparar</button>
  </div>
  `;
}

function bindCalculadora() {}

function calcularLive() {
  const costo = parseFloat(document.getElementById('calc-costo')?.value) || 0;
  const precioML = parseFloat(document.getElementById('calc-precio-ml')?.value) || 0;
  const paisId = document.getElementById('calc-pais')?.value || 'BR';
  const fase = parseInt(document.getElementById('calc-fase')?.value) || 1;

  if (costo <= 0 || precioML <= 0) return;

  const pais = PAISES.find(p => p.id === paisId);
  const costoReal = fase === 1 ? costo : fase === 2 ? costo * 0.75 : costo * 0.45;
  const comision = precioML * pais.comision;
  const envio = pais.envio;
  const precioCliente = precioML + (precioML * pais.importacion);
  const ganancia = precioML - costoReal - comision - envio;
  const margenPct = (ganancia / precioML) * 100;
  const color = margenPct >= 25 ? 'var(--green)' : margenPct >= 10 ? 'var(--yellow)' : 'var(--red)';

  document.getElementById('calc-resultado').innerHTML = `
    <div style="text-align:center;margin-bottom:16px">
      <div style="font-size:40px;font-weight:900;color:${color}">${fmt(ganancia)}</div>
      <div style="font-size:14px;color:${color};font-weight:700">${margenPct.toFixed(1)}% de margen neto</div>
      <div class="text-muted text-sm">ganancia por venta</div>
    </div>
    <hr class="divider">
    <div style="display:flex;flex-direction:column;gap:8px;font-size:12px">
      <div style="display:flex;justify-content:space-between"><span class="text-muted">Precio ML (tú publicas):</span><span class="font-bold">${fmt(precioML)}</span></div>
      <div style="display:flex;justify-content:space-between"><span class="text-muted">Precio total al cliente:</span><span class="font-bold text-yellow">${fmt(precioCliente)}</span></div>
      <hr class="divider" style="margin:4px 0">
      <div style="display:flex;justify-content:space-between"><span class="text-muted">- Costo producto (F${fase}):</span><span class="text-red">-${fmt(costoReal)}</span></div>
      <div style="display:flex;justify-content:space-between"><span class="text-muted">- Comisión ML (${(pais.comision*100).toFixed(0)}%):</span><span class="text-red">-${fmt(comision)}</span></div>
      <div style="display:flex;justify-content:space-between"><span class="text-muted">- Envío Miami→${pais.nombre}:</span><span class="text-red">-${fmt(envio)}</span></div>
      <hr class="divider" style="margin:4px 0">
      <div style="display:flex;justify-content:space-between;font-size:14px"><span class="font-bold">= Tu ganancia neta:</span><span class="font-bold" style="color:${color}">${fmt(ganancia)}</span></div>
    </div>
    ${ganancia < 10 ? `<div class="alerta alerta-urgente" style="margin-top:12px;font-size:11px">⚠️ Margen muy bajo. Sube el precio ML o busca otro proveedor.</div>` : ''}
    ${margenPct >= 30 ? `<div class="alerta alerta-success" style="margin-top:12px;font-size:11px">✅ Excelente margen. Vale la pena publicar.</div>` : ''}
  `;
}

function compararProductos() {
  for (let n = 1; n <= 3; n++) {
    const costo = parseFloat(document.getElementById(`cmp-costo-${n}`)?.value) || 0;
    const ml = parseFloat(document.getElementById(`cmp-ml-${n}`)?.value) || 0;
    const el = document.getElementById(`cmp-resultado-${n}`);
    if (!el) continue;
    if (costo <= 0 || ml <= 0) { el.innerHTML = ''; continue; }

    const comision = ml * 0.17;
    const ganancia = ml - costo - comision - 8;
    const pct = (ganancia/ml*100).toFixed(1);
    const color = ganancia >= 15 ? 'var(--green)' : ganancia >= 5 ? 'var(--yellow)' : 'var(--red)';

    el.innerHTML = `
      <div style="text-align:center;padding:10px;background:rgba(0,0,0,.2);border-radius:8px">
        <div style="font-size:22px;font-weight:900;color:${color}">${fmt(ganancia)}</div>
        <div style="font-size:11px;color:${color}">${pct}% margen</div>
      </div>
    `;
  }
}

// ════════════════════════════════════════
// MÓDULO 4 — ALERTAS
// ════════════════════════════════════════
function renderAlertas() {
  const items = dbGet(DB_PORTFOLIO).filter(p => p.fase_actual !== 'cerrado');
  const alertas = [];

  items.forEach(p => {
    const dias = diasDesde(p.fecha);
    if (p.tipo_demanda === 'viral' && dias > 21) {
      alertas.push({ tipo:'urgente', icono:'⚡', titulo:'Producto viral acercándose al límite', desc:`"${p.nombre}" lleva ${dias} días. Los virales duran 2-6 semanas. Considera cerrar posición.`, producto: p });
    }
    if (p.fase_actual === 'prueba' && (p.ventas_total||0) >= 5) {
      alertas.push({ tipo:'success', icono:'🎯', titulo:'¡Listo para escalar!', desc:`"${p.nombre}" tiene ${p.ventas_total} ventas confirmadas. Es momento de pasar a Fase 2 — comprar stock mayorista.`, producto: p });
    }
    if (p.fase_actual === 'prueba' && dias > 14 && (p.ventas_total||0) === 0) {
      alertas.push({ tipo:'warning', icono:'⚠️', titulo:'Sin ventas después de 2 semanas', desc:`"${p.nombre}" no ha generado ventas en ${dias} días. Revisa precio, fotos o considera descartarlo.`, producto: p });
    }
    if (p.fase_actual === 'escalar' && (p.ventas_total||0) >= 20) {
      alertas.push({ tipo:'success', icono:'🚀', titulo:'¡Listo para optimizar!', desc:`"${p.nombre}" tiene ${p.ventas_total} ventas. Considera importar directo para maximizar margen.`, producto: p });
    }
  });

  return `
  <div style="font-size:20px;font-weight:800;margin-bottom:20px">🔔 Centro de Alertas</div>

  ${alertas.length === 0 ? `
    <div class="empty-state">
      <div class="empty-icon">✅</div>
      <div class="empty-title">Todo en orden</div>
      <div class="empty-desc">No hay alertas activas.<br>Las alertas aparecen cuando tus productos necesitan atención.</div>
    </div>
  ` : alertas.map(a => `
    <div class="alerta alerta-${a.tipo==='urgente'?'urgente':a.tipo==='success'?'success':'warning'}">
      <span style="font-size:20px">${a.icono}</span>
      <div>
        <div style="font-weight:700;margin-bottom:4px">${a.titulo}</div>
        <div style="color:var(--text2);font-size:11px">${a.desc}</div>
        <div style="margin-top:8px;display:flex;gap:8px">
          <button class="btn btn-xs btn-secondary" onclick="navegar('portafolio')">Ver portafolio</button>
        </div>
      </div>
    </div>
  `).join('')}

  <div class="card" style="margin-top:20px">
    <div class="card-title" style="margin-bottom:12px">📅 Recordatorios de seguimiento</div>
    ${items.length === 0 ? '<div class="text-muted text-sm">Sin productos en portafolio</div>' :
      `<div style="display:flex;flex-direction:column;gap:8px">
        ${items.map(p => {
          const dias = diasDesde(p.fecha);
          return `
          <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--bg3);border-radius:8px">
            <span class="tag tag-${p.fase_actual}">${p.fase_actual}</span>
            <span style="flex:1;font-size:12px;font-weight:600">${p.nombre}</span>
            <span class="text-muted text-sm">${dias} días · ${p.ventas_total||0} ventas · ${fmt(p.ganancia_total||0)}</span>
            <span class="tag tag-${p.tipo_demanda}">${p.tipo_demanda}</span>
          </div>
        `}).join('')}
      </div>`
    }
  </div>
  `;
}

// ════════════════════════════════════════
// INIT
// ════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  navegar('cazador');
});
