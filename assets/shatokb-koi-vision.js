/**
 * ============================================================
 * SHATOKB · KOI Vision — BioScan Module  v5.0
 * assets/shatokb-koi-vision.js
 *
 * v5.0 — "Clinical AI Scanner" — Experiencia sin precedente
 *   • Facial mesh 68 puntos conectados (posicionado en %)
 *   • Termografía falsa por zona (flash de color por área)
 *   • Brackets de zona con label "ANALYZING..." animado
 *   • Línea de scan horizontal sincronizada con countdown
 *   • HUD cockpit con prefijos SYS:// BIO:// SCAN://
 *   • ECG lateral "SKIN FREQ." animado en canvas
 *   • DNA helix en canvas lateral
 *   • Glitch RGB en captura + scanlines TV + texto "CAPTURE COMPLETE"
 *   • Confirm screen rediseñada con datos biométricos + wireframe mesh
 *   • Barra de progreso de zona 1/5 → 5/5
 *   • Valores HUD que "scramblean" antes de estabilizarse
 *
 * Funciones críticas INTACTAS (no modificadas):
 *   llamarWorkerVision() · iniciarAnalisis() · enviarAlChat()
 *   mostrarError()       · pararCamara()
 *
 * API pública: window.koiVision
 *   .abrir(contexto)   — abrir el modal
 *   .onResultado(cb)   — registrar callback
 *   .isAvailable()     — verificar cámara disponible
 *   .cerrar()          — cerrar programáticamente
 * ============================================================
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     CONFIGURACIÓN
     ══════════════════════════════════════════════════════════ */
  const KV_CONFIG = {
    get workerUrl() {
      return window.KOI_VISION_WORKER_URL || 'https://koi-proxy.luisfonse2010.workers.dev/vision';
    },
    analysisItemDelay: 1800,
    minAnalysisTime:   3200,
    captureWidth:      640,
    captureHeight:     480,
    imageQuality:      0.85,

    // Detección de presencia
    presenceThreshold: 18,
    presenceCheckMs:   400,

    // Countdown
    countdownFrom:    5,
    countdownStepMs:  1000,
  };

  /* ══════════════════════════════════════════════════════════
     ESTADO
     ══════════════════════════════════════════════════════════ */
  const KV_STATE = {
    stream:          null,
    isOpen:          false,
    capturedImage:   null,
    analysisResult:  null,
    phase:           'idle',
    onResultadoCb:   null,
    contexto:        null,

    faceDetector:    null,
    facePresent:     false,
    presenceTimer:   null,
    countdownTimer:  null,
    countdownVal:    0,
    scanPctTimer:    null,
    metricTimers:    [],

    // v5.0 — nuevos timers
    ecgTimer:        null,
    dnaTimer:        null,
    meshActive:      false,
  };

  /* ══════════════════════════════════════════════════════════
     TEXTOS
     ══════════════════════════════════════════════════════════ */
  const T = {
    scanning:        'SYS:// SEARCHING BIOMETRIC SIGNAL',
    lock:            'BIO:// FACE LOCKED · HOLD STILL',
    analysis_title:  'KOI is analyzing your skin',
    analysis_sub:    'Clinical analysis in progress',
    confirm_title:   'Scan <span>complete</span>',
    confirm_yes:     '⬡ INITIALIZE ANALYSIS',
    confirm_retry:   '↺ RETAKE SCAN',
    result_title:    'Analysis Complete ✓',
    result_cta:      '✨ See full analysis in chat →',
    privacy:         '🔒 Image processed instantly. Not stored.',
    error_title:     'Camera not available',
    error_desc:      "We need camera permission to analyze your skin. You can still explore your routine — tap below.",
    error_alt:       '✨ Continue without camera',
    error_blocked_title: 'Camera blocked by browser',
    error_blocked_desc:  'Your browser blocked camera access. Follow these steps:',
    error_blocked_steps: [
      '🔒 Click the <b>lock icon</b> in the address bar',
      '📷 Find <b>Camera</b> → change to <b>Allow</b>',
      '🔄 Reload the page and tap VISION again',
    ],
    error_blocked_chrome: 'Or in Chrome: <code>chrome://settings/content/camera</code>',
    error_notfound_title: 'No camera found',
    error_notfound_desc:  'No camera detected on your device. You can still explore your routine.',
    error_retry:     '🔄 Try again',
    loading:         'SYS:// REQUESTING CAMERA ACCESS…',
    items: [
      { icon: '💧', text: 'Hydration levels',        dim: 'hidratacion'  },
      { icon: '🛡️', text: 'Skin barrier integrity',  dim: 'barrera'      },
      { icon: '✨', text: 'Sebum distribution',       dim: 'sebum'        },
      { icon: '🌗', text: 'Pigmentation & tone',      dim: 'pigmentacion' },
      { icon: '🔎', text: 'Texture & pore structure', dim: 'textura'      },
      { icon: '❤️', text: 'Microcirculation',         dim: 'circulacion'  },
      { icon: '💪', text: 'Firmness & elasticity',    dim: 'firmeza'      },
      { icon: '🦠', text: 'Microbiome balance',       dim: 'microbioma'   },
    ],
    zones: {
      tzone:  { emoji: '💦', label: 'T-Zone',   value: 'Analyzing…' },
      cheeks: { emoji: '🌸', label: 'Cheeks',   value: 'Analyzing…' },
      eyes:   { emoji: '👁️', label: 'Eye Area', value: 'Analyzing…' },
    },
  };

  /* ══════════════════════════════════════════════════════════
     DATOS FACIAL MESH — 68 puntos en % (x, y)
     Distribuidos sobre cara estándar en encuadre portrait
     ══════════════════════════════════════════════════════════ */
  const MESH_POINTS = [
    // Contorno jawline (17 puntos)
    [18,82],[21,76],[23,68],[26,61],[30,56],[35,53],[41,52],
    [50,51],[59,52],[65,53],[70,56],[74,61],[77,68],[79,76],[82,82],[84,88],[50,90],
    // Ceja izquierda (5 puntos)
    [27,35],[31,31],[37,29],[43,30],[47,34],
    // Ceja derecha (5 puntos)
    [53,34],[57,29],[63,31],[69,31],[73,35],
    // Nariz bridge (4 puntos)
    [50,37],[49,42],[49,47],[50,52],
    // Nariz base (5 puntos)
    [42,55],[45,57],[50,59],[55,57],[58,55],
    // Ojo izquierdo (6 puntos)
    [28,39],[33,37],[38,37],[42,39],[38,42],[33,42],
    // Ojo derecho (6 puntos)
    [58,39],[62,37],[67,37],[72,39],[67,42],[62,42],
    // Boca exterior (12 puntos)
    [38,68],[42,65],[47,64],[50,65],[53,64],[58,65],[62,68],
    [58,73],[53,75],[50,76],[47,75],[42,73],
    // Boca interior (8 puntos)
    [41,68],[47,66],[50,67],[53,66],[59,68],[54,72],[50,73],[46,72],
  ];

  /* Conexiones para el wireframe SVG — pares de índice */
  const MESH_EDGES = [
    // Jawline
    [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,13],[13,14],[14,15],[15,16],
    // Cejas
    [17,18],[18,19],[19,20],[20,21],
    [22,23],[23,24],[24,25],[25,26],
    // Nariz
    [27,28],[28,29],[29,30],[30,34],[34,33],[33,32],[32,31],[31,30],
    // Ojo izq
    [35,36],[36,37],[37,38],[38,40],[40,39],[39,35],
    // Ojo der
    [41,42],[42,43],[43,44],[44,46],[46,45],[45,41],
    // Boca exterior
    [47,48],[48,49],[49,50],[50,51],[51,52],[52,53],[53,54],[54,55],[55,56],[56,57],[57,58],[58,47],
  ];

  /* Mapa: countdown step (5→1) → nombre zona */
  const ZONE_SEQUENCE = {
    5: 'forehead',
    4: 'left',
    3: 'right',
    2: 'nose',
    1: 'chin',
  };

  /* ══════════════════════════════════════════════════════════
     CONSTRUCCIÓN DEL DOM
     ══════════════════════════════════════════════════════════ */
  function buildModal() {
    if (document.getElementById('koi-vision-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'koi-vision-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'KOI BioScan');

    modal.innerHTML = `
      <div class="kv-panel">

        <!-- ─── HEADER ─── -->
        <div class="kv-header">
          <div class="kv-header__koi">
            <div class="kv-header__avatar"><span>🌸</span></div>
            <div>
              <div class="kv-header__name">KOI</div>
              <div class="kv-header__subtitle">BIOSCAN · AI</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <div class="kv-header__badge">📡 VISION</div>
            <div class="kv-close-btn" id="kv-close-btn" role="button" tabindex="0" aria-label="Close">✕</div>
          </div>
        </div>

        <!-- ─── LOADING ─── -->
        <div class="kv-loading-state kv--active" id="kv-loading-state">
          <div class="kv-spinner"></div>
          <div class="kv-loading-state__text">${T.loading}</div>
        </div>

        <!-- ─── VIEWFINDER ─── -->
        <div class="kv-viewfinder" id="kv-viewfinder" style="display:none;">

          <!-- Video + canvas -->
          <video id="koi-vision-video" autoplay playsinline muted></video>
          <canvas id="koi-vision-canvas" style="display:none;"></canvas>

          <!-- Viñeta -->
          <div class="kv-vignette"></div>

          <!-- Grid holográfico -->
          <div class="kv-bioscan-grid" aria-hidden="true"></div>

          <!-- Scan lines globales -->
          <div class="kv-bioscan-line"   aria-hidden="true"></div>
          <div class="kv-bioscan-line-2" aria-hidden="true"></div>

          <!-- Targeting corners -->
          <div class="kv-corners" id="kv-corners" aria-hidden="true">
            <div class="kv-corner kv-corner--tl"></div>
            <div class="kv-corner kv-corner--tr"></div>
            <div class="kv-corner kv-corner--bl"></div>
            <div class="kv-corner kv-corner--br"></div>
          </div>

          <!-- ─── FACIAL MESH ─── -->
          <div class="kv-mesh-layer" id="kv-mesh-layer" aria-hidden="true">
            <svg class="kv-mesh-svg" id="kv-mesh-svg" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
            ${MESH_POINTS.map((p, i) =>
              `<div class="kv-mesh-dot" id="kv-mdot-${i}" style="left:${p[0]}%;top:${p[1]}%"></div>`
            ).join('')}
          </div>

          <!-- ─── ZONE BRACKETS ─── -->
          <div class="kv-zone-brackets" id="kv-zone-brackets" aria-hidden="true">
            <div class="kv-zone-bracket kv-zone-bracket--forehead" id="kv-bracket-forehead">
              <span class="kv-zone-label">FOREHEAD ANALYZING</span>
            </div>
            <div class="kv-zone-bracket kv-zone-bracket--left" id="kv-bracket-left">
              <span class="kv-zone-label">CHEEK L ANALYZING</span>
            </div>
            <div class="kv-zone-bracket kv-zone-bracket--right" id="kv-bracket-right">
              <span class="kv-zone-label">CHEEK R ANALYZING</span>
            </div>
            <div class="kv-zone-bracket kv-zone-bracket--nose" id="kv-bracket-nose">
              <span class="kv-zone-label">NOSE ANALYZING</span>
            </div>
            <div class="kv-zone-bracket kv-zone-bracket--chin" id="kv-bracket-chin">
              <span class="kv-zone-label">CHIN ANALYZING</span>
            </div>
          </div>

          <!-- ─── TERMOGRAFÍA ─── -->
          <div class="kv-thermo-layer" id="kv-thermo-layer" aria-hidden="true">
            <div class="kv-thermo-zone kv-thermo-zone--forehead" id="kv-thermo-forehead"></div>
            <div class="kv-thermo-zone kv-thermo-zone--left"     id="kv-thermo-left"></div>
            <div class="kv-thermo-zone kv-thermo-zone--right"    id="kv-thermo-right"></div>
            <div class="kv-thermo-zone kv-thermo-zone--nose"     id="kv-thermo-nose"></div>
            <div class="kv-thermo-zone kv-thermo-zone--chin"     id="kv-thermo-chin"></div>
          </div>

          <!-- ─── ZONE SCANLINE ─── -->
          <div class="kv-zone-scanline" id="kv-zone-scanline" aria-hidden="true"></div>

          <!-- ─── BARRA PROGRESO ZONA ─── -->
          <div class="kv-zone-progress" id="kv-zone-progress" aria-hidden="true">
            <div class="kv-zone-progress__label" id="kv-zone-progress-label">ANALYZING ZONE 1/5</div>
            <div class="kv-zone-progress__blocks">
              <div class="kv-zone-progress__block" id="kv-zpb-0"></div>
              <div class="kv-zone-progress__block" id="kv-zpb-1"></div>
              <div class="kv-zone-progress__block" id="kv-zpb-2"></div>
              <div class="kv-zone-progress__block" id="kv-zpb-3"></div>
              <div class="kv-zone-progress__block" id="kv-zpb-4"></div>
            </div>
          </div>

          <!-- ─── PUNTOS BIO FLOTANTES ─── -->
          <div class="kv-bio-live" aria-hidden="true">
            <div class="kv-bio-dot" style="top:30%;left:50%"></div>
            <div class="kv-bio-dot" style="top:42%;left:34%"></div>
            <div class="kv-bio-dot" style="top:42%;left:66%"></div>
            <div class="kv-bio-dot" style="top:56%;left:30%"></div>
            <div class="kv-bio-dot" style="top:56%;left:70%"></div>
            <div class="kv-bio-dot" style="top:66%;left:50%"></div>
            <div class="kv-bio-dot" style="top:50%;left:50%"></div>
          </div>

          <!-- ─── MÉTRICAS ─── -->
          <div class="kv-metrics" aria-hidden="true">
            <div class="kv-metric kv-metric--tl">
              <div class="kv-metric__prefix">BIO://</div>
              <div class="kv-metric__label">HYDRATION</div>
              <div class="kv-metric__value" id="kv-m-hydration">--</div>
              <div class="kv-metric__bar"><div class="kv-metric__bar-fill"></div></div>
            </div>
            <div class="kv-metric kv-metric--tr">
              <div class="kv-metric__prefix">BIO://</div>
              <div class="kv-metric__label">MELANIN</div>
              <div class="kv-metric__value" id="kv-m-melanin">--</div>
              <div class="kv-metric__bar"><div class="kv-metric__bar-fill"></div></div>
            </div>
            <div class="kv-metric kv-metric--bl">
              <div class="kv-metric__prefix">SYS://</div>
              <div class="kv-metric__label">BARRIER</div>
              <div class="kv-metric__value" id="kv-m-barrier">--</div>
              <div class="kv-metric__bar"><div class="kv-metric__bar-fill"></div></div>
            </div>
            <div class="kv-metric kv-metric--br">
              <div class="kv-metric__prefix">UV://</div>
              <div class="kv-metric__label">UV INDEX</div>
              <div class="kv-metric__value" id="kv-m-uv">--</div>
              <div class="kv-metric__bar"><div class="kv-metric__bar-fill"></div></div>
            </div>
          </div>

          <!-- ─── ECG LATERAL ─── -->
          <div class="kv-ecg" id="kv-ecg" aria-hidden="true">
            <div class="kv-ecg__label">SKIN FREQ.</div>
            <canvas class="kv-ecg__canvas" id="kv-ecg-canvas" width="20" height="90"></canvas>
          </div>

          <!-- ─── HUD STATUS ─── -->
          <div class="kv-hud" aria-hidden="true">
            <div class="kv-hud__status">
              <div class="kv-hud__dot kv--live" id="kv-hud-dot"></div>
              <span class="kv-hud__prefix" id="kv-hud-prefix">SYS://</span>
              <span id="kv-hud-text">LIVE</span>
            </div>
            <div class="kv-hud__scan" id="kv-scan-pct">SCAN 0%</div>
          </div>

          <!-- Status message -->
          <div class="kv-status-msg" id="kv-status-msg">${T.scanning}</div>

          <!-- Countdown -->
          <div class="kv-countdown" id="kv-countdown">
            <div class="kv-countdown__ring" id="kv-countdown-ring"></div>
            <div class="kv-countdown__number" id="kv-countdown-num">5</div>
          </div>

          <!-- Glitch layers -->
          <div class="kv-capture-flash" id="kv-capture-flash"></div>
          <div class="kv-glitch-lines"  id="kv-glitch-lines"></div>
          <div class="kv-capture-text"  id="kv-capture-text">
            <div class="kv-capture-text__inner">CAPTURE COMPLETE<br>PROCESSING…</div>
          </div>

        </div>

        <!-- ─── CONFIRM SCREEN ─── -->
        <div class="kv-confirm" id="kv-confirm">
          <img class="kv-confirm__photo" id="kv-confirm-photo" alt="" />
          <div class="kv-confirm__overlay"></div>
          <!-- Wireframe mesh encima de foto -->
          <svg class="kv-confirm__mesh" id="kv-confirm-mesh" viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;"></svg>
          <div class="kv-confirm__content">
            <!-- Datos biométricos escaneados -->
            <div class="kv-confirm__biodata" id="kv-confirm-biodata">
              <div class="kv-confirm__biorow">
                <div class="kv-confirm__biokey">HYDRATION</div>
                <div class="kv-confirm__bioval" id="kv-cval-hydration">--</div>
              </div>
              <div class="kv-confirm__biorow">
                <div class="kv-confirm__biokey">MELANIN INDEX</div>
                <div class="kv-confirm__bioval kv--pink" id="kv-cval-melanin">--</div>
              </div>
              <div class="kv-confirm__biorow">
                <div class="kv-confirm__biokey">BARRIER</div>
                <div class="kv-confirm__bioval kv--green" id="kv-cval-barrier">--</div>
              </div>
              <div class="kv-confirm__biorow">
                <div class="kv-confirm__biokey">UV EXPOSURE</div>
                <div class="kv-confirm__bioval" id="kv-cval-uv">--</div>
              </div>
              <div class="kv-confirm__biorow">
                <div class="kv-confirm__biokey">SCAN QUALITY</div>
                <div class="kv-confirm__bioval kv--green" id="kv-cval-quality">OPTIMAL</div>
              </div>
              <div class="kv-confirm__biorow">
                <div class="kv-confirm__biokey">ZONES MAPPED</div>
                <div class="kv-confirm__bioval" id="kv-cval-zones">5/5</div>
              </div>
            </div>
            <div class="kv-confirm__title">${T.confirm_title}</div>
            <div class="kv-confirm__subtitle">KOI BioScan v5.0 · Biometric Capture</div>
            <div class="kv-confirm__btns">
              <button class="kv-confirm__btn-yes"   id="kv-confirm-yes"   type="button">${T.confirm_yes}</button>
              <button class="kv-confirm__btn-retry" id="kv-confirm-retry" type="button">${T.confirm_retry}</button>
            </div>
          </div>
        </div>

        <!-- ─── ANÁLISIS ─── -->
        <div class="kv-analyzing" id="kv-analyzing">
          <div class="kv-analyzing-inner">
            <div class="kv-captured-wrap">
              <img class="kv-captured-img" id="kv-captured-img" alt="" />
              <div class="kv-scan-beam" id="kv-scan-beam"></div>
              <div class="kv-bio-points" id="kv-bio-points">
                <div class="kv-bio-pt" style="top:28%;left:50%"></div>
                <div class="kv-bio-pt" style="top:52%;left:28%"></div>
                <div class="kv-bio-pt" style="top:52%;left:72%"></div>
                <div class="kv-bio-pt" style="top:38%;left:34%"></div>
                <div class="kv-bio-pt" style="top:38%;left:66%"></div>
                <div class="kv-bio-pt" style="top:74%;left:50%"></div>
                <div class="kv-bio-pt" style="top:50%;left:50%"></div>
              </div>
              <div class="kv-scan-data">
                <div class="kv-scan-data__chip kv-scan-data__chip--tl">BIOSCAN v5.0</div>
                <div class="kv-scan-data__chip kv-scan-data__chip--br" id="kv-scan-pct-analysis">0%</div>
              </div>
              <div class="kv-photo-corner kv-photo-corner--tl"></div>
              <div class="kv-photo-corner kv-photo-corner--tr"></div>
              <div class="kv-photo-corner kv-photo-corner--bl"></div>
              <div class="kv-photo-corner kv-photo-corner--br"></div>
            </div>
            <div class="kv-analyzing-info">
              <div class="kv-analysis-progress">
                <div class="kv-analysis-header">
                  <span class="kv-analysis-progress__label">${T.analysis_title}</span>
                  <span class="kv-analysis-pct" id="kv-analysis-pct-label">0%</span>
                </div>
                <div class="kv-progress-track">
                  <div class="kv-progress-fill" id="kv-progress-fill"></div>
                </div>
                <div class="kv-analysis-progress__sub">${T.analysis_sub}</div>
              </div>
              <div class="kv-analysis-items" id="kv-analysis-items">
                ${T.items.map((item, i) => `
                  <div class="kv-analysis-item" id="kv-item-${i}">
                    <span class="kv-analysis-item__icon">${item.icon}</span>
                    <span class="kv-analysis-item__text">${item.text}</span>
                    <span class="kv-analysis-item__check">✓</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- ─── RESULTADO ─── -->
        <div class="kv-result-preview" id="kv-result-preview">
          <div class="kv-result-preview__title">${T.result_title}</div>
          <div class="kv-zones" id="kv-zones">
            ${Object.entries(T.zones).map(([key, z]) => `
              <div class="kv-zone-card" id="kv-zone-${key}">
                <span class="kv-zone-card__emoji">${z.emoji}</span>
                <span class="kv-zone-card__label">${z.label}</span>
                <span class="kv-zone-card__value" id="kv-zone-val-${key}">${z.value}</span>
              </div>
            `).join('')}
          </div>
          <div class="kv-result-cta" id="kv-result-cta" role="button" tabindex="0">${T.result_cta}</div>
          <div class="kv-privacy-note">${T.privacy}</div>
        </div>

        <!-- ─── ERROR ─── -->
        <div class="kv-error-state" id="kv-error-state">
          <span class="kv-error-state__icon" id="kv-error-icon">📷</span>
          <div class="kv-error-state__title" id="kv-error-title">${T.error_title}</div>
          <p class="kv-error-state__desc" id="kv-error-desc">${T.error_desc}</p>
          <ol class="kv-error-steps" id="kv-error-steps" style="display:none;"></ol>
          <p class="kv-error-chrome-tip" id="kv-error-chrome" style="display:none;"></p>
          <button class="kv-error-retry-btn" id="kv-error-retry" type="button" style="display:none;">${T.error_retry}</button>
          <div class="kv-error-alt-btn" id="kv-error-alt" role="button" tabindex="0">${T.error_alt}</div>
        </div>

      </div>
    `;

    document.body.appendChild(modal);
    _buildMeshSVG();
    bindEvents();
  }

  /* ══════════════════════════════════════════════════════════
     CONSTRUIR SVG MESH — líneas de conexión
     ══════════════════════════════════════════════════════════ */
  function _buildMeshSVG() {
    const svg = document.getElementById('kv-mesh-svg');
    if (!svg) return;

    const lines = MESH_EDGES.map(([a, b]) => {
      const pa = MESH_POINTS[a];
      const pb = MESH_POINTS[b];
      if (!pa || !pb) return '';
      return `<line x1="${pa[0]}" y1="${pa[1]}" x2="${pb[0]}" y2="${pb[1]}" stroke="rgba(0,255,231,0.18)" stroke-width="0.3"/>`;
    }).join('');

    svg.innerHTML = lines;

    // También construir el SVG del confirm mesh
    const confirmSvg = document.getElementById('kv-confirm-mesh');
    if (confirmSvg) {
      const confirmLines = MESH_EDGES.map(([a, b]) => {
        const pa = MESH_POINTS[a];
        const pb = MESH_POINTS[b];
        if (!pa || !pb) return '';
        return `<line x1="${pa[0]}" y1="${pa[1]}" x2="${pb[0]}" y2="${pb[1]}" stroke="rgba(0,255,231,0.22)" stroke-width="0.35"/>`;
      }).join('');
      const confirmDots = MESH_POINTS.map(p =>
        `<circle cx="${p[0]}" cy="${p[1]}" r="0.5" fill="rgba(0,255,231,0.45)"/>`
      ).join('');
      confirmSvg.innerHTML = confirmLines + confirmDots;
    }
  }

  /* ══════════════════════════════════════════════════════════
     EVENTOS
     ══════════════════════════════════════════════════════════ */
  function bindEvents() {
    const closeBtn = document.getElementById('kv-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', cerrar, true);
      closeBtn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') cerrar(); });
    }

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && KV_STATE.isOpen) cerrar();
    });

    const confirmYes = document.getElementById('kv-confirm-yes');
    if (confirmYes) {
      confirmYes.addEventListener('click', () => {
        setPhase('analyzing');
        iniciarAnalisis(KV_STATE.capturedImage);
      }, true);
    }

    const confirmRetry = document.getElementById('kv-confirm-retry');
    if (confirmRetry) {
      confirmRetry.addEventListener('click', retake, true);
    }

    const altBtn = document.getElementById('kv-error-alt');
    if (altBtn) {
      altBtn.addEventListener('click', () => {
        cerrar();
        if (typeof window.koiVisionAlternativo === 'function') window.koiVisionAlternativo();
      }, true);
    }

    const retryBtn = document.getElementById('kv-error-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', async () => {
        retryBtn.disabled = true;
        retryBtn.textContent = '⏳ …';
        setPhase('loading');
        await iniciarCamara();
      }, true);
    }

    const ctaBtn = document.getElementById('kv-result-cta');
    if (ctaBtn) {
      ctaBtn.addEventListener('click', enviarAlChat, true);
      ctaBtn.addEventListener('keydown', e => { if (e.key === 'Enter') enviarAlChat(); });
    }
  }

  /* ══════════════════════════════════════════════════════════
     FASES
     ══════════════════════════════════════════════════════════ */
  function setPhase(phase) {
    KV_STATE.phase = phase;

    const sections = [
      'kv-loading-state', 'kv-viewfinder', 'kv-confirm',
      'kv-analyzing', 'kv-result-preview', 'kv-error-state',
    ];

    sections.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.display = 'none';
      el.classList.remove('kv--active');
    });

    const map = {
      loading:   'kv-loading-state',
      camera:    'kv-viewfinder',
      confirm:   'kv-confirm',
      analyzing: 'kv-analyzing',
      result:    'kv-result-preview',
      error:     'kv-error-state',
    };

    const targetId = map[phase];
    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) {
        el.style.display = '';
        requestAnimationFrame(() => el.classList.add('kv--active'));
      }
    }
  }

  /* ══════════════════════════════════════════════════════════
     APERTURA
     ══════════════════════════════════════════════════════════ */
  async function abrir(contexto) {
    if (KV_STATE.isOpen) return;

    KV_STATE.contexto       = contexto || null;
    KV_STATE.isOpen         = true;
    KV_STATE.capturedImage  = null;
    KV_STATE.analysisResult = null;
    KV_STATE.facePresent    = false;
    KV_STATE.countdownVal   = 0;
    KV_STATE.meshActive     = false;

    buildModal();

    const modal = document.getElementById('koi-vision-modal');
    if (!modal) return;

    document.body.style.overflow = 'hidden';
    document.body.classList.add('kv--vision-open');
    requestAnimationFrame(() => modal.classList.add('kv--active'));

    setPhase('loading');
    await iniciarCamara();
  }

  /* ══════════════════════════════════════════════════════════
     CIERRE
     ══════════════════════════════════════════════════════════ */
  function cerrar() {
    KV_STATE.isOpen = false;
    KV_STATE.phase  = 'idle';

    _stopAllTimers();
    pararCamara();

    const modal = document.getElementById('koi-vision-modal');
    if (modal) {
      modal.classList.remove('kv--active');
      setTimeout(() => { if (modal.parentNode) modal.parentNode.removeChild(modal); }, 400);
    }

    document.body.style.overflow = '';
    document.body.classList.remove('kv--vision-open');
  }

  /* ══════════════════════════════════════════════════════════
     CÁMARA
     ══════════════════════════════════════════════════════════ */
  async function iniciarCamara() {
    const constraints = [
      { video: { facingMode: { ideal: 'user' }, width: { ideal: 640 }, height: { ideal: 480 } }, audio: false },
      { video: { facingMode: 'user' }, audio: false },
      { video: true, audio: false },
    ];

    let stream = null;
    let lastErr = null;

    for (let i = 0; i < constraints.length; i++) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints[i]);
        break;
      } catch (err) {
        lastErr = err;
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' ||
            err.name === 'NotFoundError'   || err.name === 'DevicesNotFoundError') break;
      }
    }

    if (!stream) { mostrarError(lastErr || new Error('Camera unavailable')); return; }

    KV_STATE.stream = stream;
    const video = document.getElementById('koi-vision-video');
    if (!video) return;
    video.srcObject = stream;
    await video.play().catch(() => {});

    _initFaceDetector();

    setPhase('camera');
    _startScanEffects();
    _startECG();
    _startPresenceDetection();
  }

  function pararCamara() {
    if (KV_STATE.stream) {
      KV_STATE.stream.getTracks().forEach(t => t.stop());
      KV_STATE.stream = null;
    }
    const video = document.getElementById('koi-vision-video');
    if (video) video.srcObject = null;
  }

  /* ══════════════════════════════════════════════════════════
     FACEDETECTOR — con fallback a luminosidad central
     ══════════════════════════════════════════════════════════ */
  function _initFaceDetector() {
    if ('FaceDetector' in window) {
      try {
        KV_STATE.faceDetector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
        console.log('[KOI BioScan v5.0] FaceDetector API disponible ✓');
      } catch (_) { KV_STATE.faceDetector = null; }
    } else {
      KV_STATE.faceDetector = null;
      console.log('[KOI BioScan v5.0] Usando luminosidad central como fallback');
    }
  }

  async function _detectFacePresence() {
    const video = document.getElementById('koi-vision-video');
    if (!video || !KV_STATE.stream) return false;

    if (KV_STATE.faceDetector) {
      try {
        const faces = await KV_STATE.faceDetector.detect(video);
        return faces.length > 0;
      } catch (_) { /* fallback */ }
    }

    const canvas = document.getElementById('koi-vision-canvas');
    if (!canvas) return false;

    const cw = 60; const ch = 60;
    canvas.width  = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');

    try {
      const vw = video.videoWidth  || 320;
      const vh = video.videoHeight || 240;
      ctx.drawImage(video, vw*0.25, vh*0.15, vw*0.50, vh*0.70, 0, 0, cw, ch);
      const data = ctx.getImageData(0, 0, cw, ch).data;
      let sum = 0; let count = 0;
      for (let i = 0; i < data.length; i += 4) {
        sum += (data[i]*0.299 + data[i+1]*0.587 + data[i+2]*0.114);
        count++;
      }
      return (count > 0 ? sum / count : 0) >= KV_CONFIG.presenceThreshold;
    } catch (_) { return false; }
  }

  /* ══════════════════════════════════════════════════════════
     DETECCIÓN CONTINUA + COUNTDOWN
     ══════════════════════════════════════════════════════════ */
  function _startPresenceDetection() {
    _stopPresenceTimer();

    KV_STATE.presenceTimer = setInterval(async () => {
      if (KV_STATE.phase !== 'camera') { _stopPresenceTimer(); return; }

      const present = await _detectFacePresence();

      if (present && !KV_STATE.facePresent) {
        KV_STATE.facePresent = true;
        _onFaceLocked();
      } else if (!present && KV_STATE.facePresent) {
        KV_STATE.facePresent = false;
        _onFaceLost();
      }
    }, KV_CONFIG.presenceCheckMs);
  }

  function _onFaceLocked() {
    const corners   = document.getElementById('kv-corners');
    const statusMsg = document.getElementById('kv-status-msg');
    const hudDot    = document.getElementById('kv-hud-dot');
    const hudText   = document.getElementById('kv-hud-text');
    const hudPrefix = document.getElementById('kv-hud-prefix');

    if (corners)   corners.classList.add('kv--lock');
    if (statusMsg) { statusMsg.textContent = T.lock; statusMsg.classList.add('kv--lock'); }
    if (hudDot)    { hudDot.className = 'kv-hud__dot kv--lock'; }
    if (hudText)   hudText.textContent = 'LOCKED';
    if (hudPrefix) hudPrefix.textContent = 'BIO://';

    // Activar mesh facial
    _activateMesh();

    // Mostrar zona progress
    const zp = document.getElementById('kv-zone-progress');
    if (zp) zp.classList.add('kv--visible');

    // Activar métricas y ECG
    _startMetricAnimations();

    // Mostrar ECG y DNA
    const ecg = document.getElementById('kv-ecg');
    if (ecg) ecg.classList.add('kv--active');
    const dna = document.getElementById('kv-dna');
    if (dna) dna.classList.add('kv--active');

    // Iniciar countdown
    _startCountdown();
  }

  function _onFaceLost() {
    _stopCountdown();
    _deactivateMesh();
    _hideAllBrackets();

    const corners   = document.getElementById('kv-corners');
    const statusMsg = document.getElementById('kv-status-msg');
    const hudDot    = document.getElementById('kv-hud-dot');
    const hudText   = document.getElementById('kv-hud-text');
    const hudPrefix = document.getElementById('kv-hud-prefix');
    const countdown = document.getElementById('kv-countdown');
    const zp        = document.getElementById('kv-zone-progress');

    if (corners)   corners.classList.remove('kv--lock');
    if (statusMsg) { statusMsg.textContent = T.scanning; statusMsg.classList.remove('kv--lock'); }
    if (hudDot)    hudDot.className = 'kv-hud__dot kv--live';
    if (hudText)   hudText.textContent = 'LIVE';
    if (hudPrefix) hudPrefix.textContent = 'SYS://';
    if (countdown) countdown.classList.remove('kv--active');
    if (zp)        zp.classList.remove('kv--visible');
  }

  /* ══════════════════════════════════════════════════════════
     FACIAL MESH — activar / desactivar puntos
     ══════════════════════════════════════════════════════════ */
  function _activateMesh() {
    KV_STATE.meshActive = true;
    MESH_POINTS.forEach((_, i) => {
      const dot = document.getElementById(`kv-mdot-${i}`);
      if (dot) {
        setTimeout(() => {
          if (KV_STATE.meshActive) dot.classList.add('kv--active');
        }, i * 12);
      }
    });
  }

  function _deactivateMesh() {
    KV_STATE.meshActive = false;
    MESH_POINTS.forEach((_, i) => {
      const dot = document.getElementById(`kv-mdot-${i}`);
      if (dot) dot.classList.remove('kv--active', 'kv--zone-active');
    });
  }

  function _highlightZoneMeshDots(zoneName) {
    // Índices de puntos por zona
    const zoneMap = {
      forehead: [0,1,2,3,4,5,14,15,16,17,18,19,20,21,22,23,24,25,26],
      left:     [0,1,2,3,4,5,35,36,37,38,39,40],
      right:    [8,9,10,11,12,13,41,42,43,44,45,46],
      nose:     [27,28,29,30,31,32,33,34],
      chin:     [6,7,8,15,16],
    };

    // Reset todos
    MESH_POINTS.forEach((_, i) => {
      const dot = document.getElementById(`kv-mdot-${i}`);
      if (dot) dot.classList.remove('kv--zone-active');
    });

    const indices = zoneMap[zoneName] || [];
    indices.forEach(i => {
      const dot = document.getElementById(`kv-mdot-${i}`);
      if (dot) dot.classList.add('kv--zone-active');
    });
  }

  /* ══════════════════════════════════════════════════════════
     ZONE BRACKETS — mostrar / ocultar
     ══════════════════════════════════════════════════════════ */
  function _hideAllBrackets() {
    ['forehead','left','right','nose','chin'].forEach(z => {
      const b = document.getElementById(`kv-bracket-${z}`);
      if (b) { b.classList.remove('kv--visible', 'kv--analyzing'); }
    });
  }

  function _activateZoneBracket(zoneName) {
    _hideAllBrackets();

    // Mostrar todos como visible
    ['forehead','left','right','nose','chin'].forEach(z => {
      const b = document.getElementById(`kv-bracket-${z}`);
      if (b) b.classList.add('kv--visible');
    });

    // El actual en modo analyzing
    const active = document.getElementById(`kv-bracket-${zoneName}`);
    if (active) active.classList.add('kv--analyzing');
  }

  /* ══════════════════════════════════════════════════════════
     TERMOGRAFÍA — flash de color por zona
     ══════════════════════════════════════════════════════════ */
  function _flashThermoZone(zoneName) {
    const el = document.getElementById(`kv-thermo-${zoneName}`);
    if (!el) return;
    el.classList.remove('kv--flash');
    void el.offsetWidth; // reflow
    el.classList.add('kv--flash');
    setTimeout(() => el.classList.remove('kv--flash'), 900);
  }

  /* ══════════════════════════════════════════════════════════
     ZONA SCANLINE — sincronizada con countdown
     ══════════════════════════════════════════════════════════ */
  function _fireZoneScanline(zoneName) {
    const sl = document.getElementById('kv-zone-scanline');
    if (!sl) return;

    // Posición y tamaño de la zona
    const zonePos = {
      forehead: { top: '18%', travel: '14%' },
      left:     { top: '35%', travel: '20%' },
      right:    { top: '35%', travel: '20%' },
      nose:     { top: '40%', travel: '18%' },
      chin:     { top: '78%', travel: '8%'  },
    };
    const pos = zonePos[zoneName] || { top: '20%', travel: '15%' };

    sl.classList.remove('kv--scanning');
    sl.style.top = pos.top;
    sl.style.setProperty('--kv-zone-scan-dur', '0.9s');
    sl.style.setProperty('--kv-zone-scan-travel', pos.travel);
    void sl.offsetWidth;
    sl.classList.add('kv--scanning');
    setTimeout(() => sl.classList.remove('kv--scanning'), 950);
  }

  /* ══════════════════════════════════════════════════════════
     BARRA PROGRESO DE ZONA
     ══════════════════════════════════════════════════════════ */
  function _updateZoneProgress(step) {
    // step: 5=zona1, 4=zona2, ..., 1=zona5
    const idx = 5 - step; // 0..4

    const label = document.getElementById('kv-zone-progress-label');
    if (label) label.textContent = `ANALYZING ZONE ${idx + 1}/5`;

    for (let i = 0; i < 5; i++) {
      const block = document.getElementById(`kv-zpb-${i}`);
      if (!block) continue;
      block.classList.remove('kv--done', 'kv--active');
      if (i < idx)  block.classList.add('kv--done');
      if (i === idx) block.classList.add('kv--active');
    }
  }

  /* ══════════════════════════════════════════════════════════
     COUNTDOWN
     ══════════════════════════════════════════════════════════ */
  function _startCountdown() {
    _stopCountdown();
    KV_STATE.countdownVal = KV_CONFIG.countdownFrom;

    const countdownEl = document.getElementById('kv-countdown');
    if (countdownEl) countdownEl.classList.add('kv--active');

    _tickCountdown();
  }

  function _tickCountdown() {
    if (KV_STATE.phase !== 'camera' || !KV_STATE.facePresent) return;
    if (KV_STATE.countdownVal <= 0) { _dispararCaptura(); return; }

    const numEl  = document.getElementById('kv-countdown-num');
    const ringEl = document.getElementById('kv-countdown-ring');
    const step   = KV_STATE.countdownVal;

    if (numEl) {
      numEl.textContent = step;
      numEl.classList.remove('kv--pop');
      void numEl.offsetWidth;
      numEl.classList.add('kv--pop');
    }
    if (ringEl) {
      ringEl.classList.remove('kv--pulse');
      void ringEl.offsetWidth;
      ringEl.classList.add('kv--pulse');
    }

    // Acciones visuales por zona
    const zoneName = ZONE_SEQUENCE[step];
    if (zoneName) {
      _activateZoneBracket(zoneName);
      _flashThermoZone(zoneName);
      _fireZoneScanline(zoneName);
      _highlightZoneMeshDots(zoneName);
      _updateZoneProgress(step);
    }

    KV_STATE.countdownVal--;
    KV_STATE.countdownTimer = setTimeout(_tickCountdown, KV_CONFIG.countdownStepMs);
  }

  function _stopCountdown() {
    if (KV_STATE.countdownTimer) { clearTimeout(KV_STATE.countdownTimer); KV_STATE.countdownTimer = null; }
    KV_STATE.countdownVal = 0;
  }

  function _stopPresenceTimer() {
    if (KV_STATE.presenceTimer) { clearInterval(KV_STATE.presenceTimer); KV_STATE.presenceTimer = null; }
  }

  /* ══════════════════════════════════════════════════════════
     ECG CANVAS — "SKIN FREQ."
     ══════════════════════════════════════════════════════════ */
  function _startECG() {
    const canvas = document.getElementById('kv-ecg-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    let t = 0;

    function drawECG() {
      if (!KV_STATE.isOpen || KV_STATE.phase !== 'camera') return;

      ctx.clearRect(0, 0, W, H);

      // Scroll vertical del ECG
      ctx.strokeStyle = 'rgba(0,255,136,0.70)';
      ctx.lineWidth = 1;
      ctx.beginPath();

      for (let y = 0; y < H; y++) {
        const norm = y / H;
        const phase = norm * 4 * Math.PI + t;
        // Forma tipo ECG: onda sinusoidal con spike
        let val = Math.sin(phase) * 0.3;
        // Spike periódico
        const mod = (phase % (2 * Math.PI)) / (2 * Math.PI);
        if (mod > 0.45 && mod < 0.50) val += (mod - 0.45) / 0.05 * 1.2;
        if (mod > 0.50 && mod < 0.55) val -= (mod - 0.50) / 0.05 * 1.0;
        const x = W / 2 + val * (W * 0.6);
        if (y === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      t += 0.12;
      KV_STATE.ecgTimer = requestAnimationFrame(drawECG);
    }

    drawECG();
  }

  /* ══════════════════════════════════════════════════════════
     EFECTOS SCAN — pct + métricas con scramble
     ══════════════════════════════════════════════════════════ */
  function _startScanEffects() {
    let pct = 0;
    KV_STATE.scanPctTimer = setInterval(() => {
      if (!KV_STATE.isOpen || KV_STATE.phase !== 'camera') { clearInterval(KV_STATE.scanPctTimer); return; }
      pct = (pct + Math.floor(Math.random() * 5 + 1)) % 101;
      const el = document.getElementById('kv-scan-pct');
      if (el) el.textContent = 'SCAN ' + pct + '%';
    }, 500);
  }

  function _startMetricAnimations() {
    const metrics = [
      { id: 'kv-m-hydration', min: 42, max: 89, suffix: '%',  confirmId: 'kv-cval-hydration', confirmSuffix: '%'  },
      { id: 'kv-m-melanin',   min: 12, max: 68, suffix: '',   confirmId: 'kv-cval-melanin',   confirmSuffix: ' IU' },
      { id: 'kv-m-barrier',   min: 55, max: 96, suffix: '%',  confirmId: 'kv-cval-barrier',   confirmSuffix: '%'  },
      { id: 'kv-m-uv',        min: 1,  max: 4,  suffix: '',   confirmId: 'kv-cval-uv',        confirmSuffix: ' UV' },
    ];

    metrics.forEach(m => {
      const el = document.getElementById(m.id);
      if (!el) return;

      let current = m.min;
      const target = m.min + Math.floor(Math.random() * (m.max - m.min));

      // Fase scramble inicial
      let scrambleCount = 0;
      el.classList.add('kv--scramble');

      const scramble = setInterval(() => {
        if (scrambleCount++ > 8) {
          clearInterval(scramble);
          el.classList.remove('kv--scramble');
        }
        el.textContent = Math.floor(Math.random() * (m.max - m.min) + m.min) + m.suffix;
      }, 80);

      setTimeout(() => {
        const timer = setInterval(() => {
          if (!KV_STATE.isOpen || KV_STATE.phase !== 'camera') { clearInterval(timer); return; }
          if (current < target) {
            current += Math.ceil((target - current) / 4);
            el.textContent = current + m.suffix;
          } else {
            const delta = Math.floor(Math.random() * 5) - 2;
            current = Math.max(m.min, Math.min(m.max, current + delta));
            el.textContent = current + m.suffix;
          }
        }, 200);
        KV_STATE.metricTimers.push(timer);

        // Guardar valor para confirm screen
        KV_STATE[m.id + '_val'] = target;
      }, 700);
    });
  }

  function _stopAllTimers() {
    _stopPresenceTimer();
    _stopCountdown();
    if (KV_STATE.scanPctTimer) { clearInterval(KV_STATE.scanPctTimer); KV_STATE.scanPctTimer = null; }
    if (KV_STATE.ecgTimer)     { cancelAnimationFrame(KV_STATE.ecgTimer); KV_STATE.ecgTimer = null; }
    KV_STATE.metricTimers.forEach(t => clearInterval(t));
    KV_STATE.metricTimers = [];
  }

  /* ══════════════════════════════════════════════════════════
     CAPTURA — con glitch RGB
     ══════════════════════════════════════════════════════════ */
  function _dispararCaptura() {
    if (KV_STATE.phase !== 'camera') return;

    _stopAllTimers();
    _hideAllBrackets();
    _deactivateMesh();

    const hudDot  = document.getElementById('kv-hud-dot');
    const hudText = document.getElementById('kv-hud-text');
    const hudPrefix = document.getElementById('kv-hud-prefix');
    if (hudDot)    hudDot.className = 'kv-hud__dot kv--capture';
    if (hudText)   hudText.textContent = 'CAPTURE';
    if (hudPrefix) hudPrefix.textContent = 'SCAN://';

    const countdown = document.getElementById('kv-countdown');
    if (countdown) countdown.classList.remove('kv--active');

    // Marcar última zona como completada
    for (let i = 0; i < 5; i++) {
      const block = document.getElementById(`kv-zpb-${i}`);
      if (block) { block.classList.remove('kv--active'); block.classList.add('kv--done'); }
    }

    // GLITCH RGB
    const flashEl   = document.getElementById('kv-capture-flash');
    const linesEl   = document.getElementById('kv-glitch-lines');
    const textEl    = document.getElementById('kv-capture-text');

    if (flashEl) {
      flashEl.classList.add('kv--flash');
      setTimeout(() => flashEl.classList.remove('kv--flash'), 600);
    }
    if (linesEl) {
      linesEl.classList.add('kv--active');
      setTimeout(() => linesEl.classList.remove('kv--active'), 600);
    }
    if (textEl) {
      textEl.classList.add('kv--active');
      setTimeout(() => textEl.classList.remove('kv--active'), 600);
    }

    // Foto post-glitch
    setTimeout(() => _tomarFoto(), 200);
  }

  function _tomarFoto() {
    const video  = document.getElementById('koi-vision-video');
    const canvas = document.getElementById('koi-vision-canvas');

    if (!video || !canvas) { _mostrarConfirm(null); return; }

    canvas.width  = KV_CONFIG.captureWidth;
    canvas.height = KV_CONFIG.captureHeight;
    const ctx = canvas.getContext('2d');

    // Deshacer espejo para enviar foto correcta al Worker
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    const base64 = canvas.toDataURL('image/jpeg', KV_CONFIG.imageQuality);
    KV_STATE.capturedImage = base64;

    // NO parar la cámara — necesaria para retake
    _mostrarConfirm(base64);
  }

  /* ══════════════════════════════════════════════════════════
     CONFIRM SCREEN — con datos biométricos
     ══════════════════════════════════════════════════════════ */
  function _mostrarConfirm(base64) {
    const photoEl = document.getElementById('kv-confirm-photo');
    if (photoEl && base64) photoEl.src = base64;

    // Transferir métricas a la confirm screen
    const metricMap = [
      { src: 'kv-m-hydration', dst: 'kv-cval-hydration', suffix: '' },
      { src: 'kv-m-melanin',   dst: 'kv-cval-melanin',   suffix: '' },
      { src: 'kv-m-barrier',   dst: 'kv-cval-barrier',   suffix: '' },
      { src: 'kv-m-uv',        dst: 'kv-cval-uv',        suffix: ' UV' },
    ];
    metricMap.forEach(m => {
      const srcEl = document.getElementById(m.src);
      const dstEl = document.getElementById(m.dst);
      if (srcEl && dstEl) dstEl.textContent = srcEl.textContent + m.suffix;
    });

    setPhase('confirm');
  }

  function retake() {
    KV_STATE.capturedImage = null;
    KV_STATE.facePresent   = false;
    KV_STATE.countdownVal  = 0;
    KV_STATE.meshActive    = false;

    const corners   = document.getElementById('kv-corners');
    const statusMsg = document.getElementById('kv-status-msg');
    const hudDot    = document.getElementById('kv-hud-dot');
    const hudText   = document.getElementById('kv-hud-text');
    const hudPrefix = document.getElementById('kv-hud-prefix');
    const countdown = document.getElementById('kv-countdown');
    const zp        = document.getElementById('kv-zone-progress');
    const ecg       = document.getElementById('kv-ecg');

    if (corners)   corners.classList.remove('kv--lock');
    if (statusMsg) { statusMsg.textContent = T.scanning; statusMsg.classList.remove('kv--lock'); }
    if (hudDot)    hudDot.className = 'kv-hud__dot kv--live';
    if (hudText)   hudText.textContent = 'LIVE';
    if (hudPrefix) hudPrefix.textContent = 'SYS://';
    if (countdown) countdown.classList.remove('kv--active');
    if (zp)        zp.classList.remove('kv--visible');
    if (ecg)       ecg.classList.remove('kv--active');

    _hideAllBrackets();

    // Reset zona progress blocks
    for (let i = 0; i < 5; i++) {
      const b = document.getElementById(`kv-zpb-${i}`);
      if (b) b.classList.remove('kv--done', 'kv--active');
    }

    // Reset métricas
    ['kv-m-hydration','kv-m-melanin','kv-m-barrier','kv-m-uv'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '--';
    });

    setPhase('camera');
    _startScanEffects();
    _startECG();
    _startPresenceDetection();
  }

  /* ══════════════════════════════════════════════════════════
     ANÁLISIS PROGRESIVO — INTACTO
     ══════════════════════════════════════════════════════════ */
  async function iniciarAnalisis(imageBase64) {
    pararCamara();
    setPhase('analyzing');

    const imgEl = document.getElementById('kv-captured-img');
    if (imgEl && imageBase64) {
      imgEl.src = imageBase64;
      setTimeout(() => {
        imgEl.classList.add('kv--visible');
        let sat = 0;
        const saturateTimer = setInterval(() => {
          sat = Math.min(sat + 5, 100);
          imgEl.style.filter = `saturate(${sat}%) brightness(${0.50 + (sat/100)*0.50})`;
          if (sat >= 100) clearInterval(saturateTimer);
        }, 40);
      }, 200);
    }

    const beamEl = document.getElementById('kv-scan-beam');
    if (beamEl) setTimeout(() => beamEl.classList.add('kv--active'), 500);

    const bioPts = document.querySelectorAll('.kv-bio-pt');
    bioPts.forEach((pt, i) => {
      setTimeout(() => pt.classList.add('kv--visible'), 700 + i * 200);
    });

    const fillEl   = document.getElementById('kv-progress-fill');
    const pctLabel = document.getElementById('kv-analysis-pct-label');
    const scanPct  = document.getElementById('kv-scan-pct-analysis');
    const items    = T.items;
    const total    = items.length;

    function setProgress(pct) {
      if (fillEl)   fillEl.style.width   = pct + '%';
      if (pctLabel) pctLabel.textContent = Math.round(pct) + '%';
      if (scanPct)  scanPct.textContent  = Math.round(pct) + '%';
    }

    // Llamar Worker EN PARALELO con la animación
    const analysisPromise = imageBase64
      ? llamarWorkerVision(imageBase64)
      : Promise.resolve(null);

    for (let i = 0; i < total; i++) {
      const el = document.getElementById(`kv-item-${i}`);
      if (el) el.classList.add('kv--active');

      const pctStart = (i / total) * 85;
      const pctEnd   = ((i+1) / total) * 85;
      setProgress(pctStart);

      const steps     = 8;
      const stepDelay = KV_CONFIG.analysisItemDelay / steps;
      for (let s = 1; s <= steps; s++) {
        await delay(stepDelay);
        setProgress(pctStart + (pctEnd - pctStart) * (s / steps));
      }

      if (el) { el.classList.remove('kv--active'); el.classList.add('kv--done'); }
    }

    const [analysisResult] = await Promise.all([analysisPromise, delay(300)]);

    setProgress(100);
    if (beamEl) {
      beamEl.classList.remove('kv--active');
      beamEl.classList.add('kv--complete');
      setTimeout(() => beamEl.classList.remove('kv--complete'), 600);
    }

    await delay(500);

    KV_STATE.analysisResult = analysisResult;
    mostrarResultadoPreview(analysisResult);
  }

  /* ══════════════════════════════════════════════════════════
     LLAMADA AL CLOUDFLARE WORKER /vision — INTACTA
     ══════════════════════════════════════════════════════════ */
  async function llamarWorkerVision(imageBase64) {
    try {
      const ctx    = KV_STATE.contexto || {};
      const idioma = 'en'; // Hardcoded EN — USA audience only. Fixed 2026-07.

      const payload = {
        image:   imageBase64,
        contexto: {
          perfil:     ctx.perfil     || null,
          respuestas: ctx.respuestas || null,
          idioma:     idioma,
        },
      };

      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 45000);

      let response;
      try {
        response = await fetch(KV_CONFIG.workerUrl, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
          signal:  controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) throw new Error(`Worker ${response.status}`);

      const data = await response.json();
      return data;

    } catch (err) {
      console.warn('[KOI Vision] Worker error:', err.message);
      const isAbort = err.name === 'AbortError';
      return {
        _error:      true,
        _error_type: isAbort ? 'timeout' : 'network_error',
        zonas:       {},
        dimensiones: {},
        mensaje_koi: null,
      };
    }
  }

  /* ══════════════════════════════════════════════════════════
     RESULTADO PREVIEW — INTACTA
     ══════════════════════════════════════════════════════════ */
  function mostrarResultadoPreview(result) {
    setPhase('result');

    const zones = result?.zonas || generarZonasFallback(KV_STATE.contexto);

    Object.keys(T.zones).forEach((key, i) => {
      const valEl = document.getElementById(`kv-zone-val-${key}`);
      const card  = document.getElementById(`kv-zone-${key}`);
      if (valEl) valEl.textContent = zones[key] || T.zones[key].value;
      if (card)  setTimeout(() => card.classList.add('kv--visible'), i * 200);
    });
  }

  /* ══════════════════════════════════════════════════════════
     FALLBACK ZONAS — INTACTA
     ══════════════════════════════════════════════════════════ */
  function generarZonasFallback(ctx) {
    const resp = ctx?.respuestas || {};
    const tipo = resp.tipo_piel || 'mixta';
    const fallbacks = {
      grasa:    { tzone: 'Excess sebum visible',  cheeks: 'Congestion',      eyes: 'Slight puffiness' },
      seca:     { tzone: 'Tension lines',         cheeks: 'Dry patches',     eyes: 'Fine lines' },
      mixta:    { tzone: 'Oily, enlarged pores',  cheeks: 'Balanced',        eyes: 'Light dryness' },
      sensible: { tzone: 'Reactive zone',         cheeks: 'Visible redness', eyes: 'Sensitivity' },
      nolose:   { tzone: 'Balanced',              cheeks: 'Even tone',       eyes: 'Minimal signs' },
    };
    return fallbacks[tipo] || fallbacks.mixta;
  }

  /* ══════════════════════════════════════════════════════════
     ENVIAR AL CHAT — INTACTA
     ══════════════════════════════════════════════════════════ */
  function enviarAlChat() {
    const result = KV_STATE.analysisResult;
    const image  = KV_STATE.capturedImage;
    const ctx    = KV_STATE.contexto;

    cerrar();

    if (typeof KV_STATE.onResultadoCb === 'function') {
      KV_STATE.onResultadoCb({ result, image, ctx });
    }

    window.dispatchEvent(new CustomEvent('koi-vision-result', {
      detail: { result, image, ctx }
    }));
  }

  /* ══════════════════════════════════════════════════════════
     ERROR — INTACTA
     ══════════════════════════════════════════════════════════ */
  function mostrarError(err) {
    setPhase('error');

    const iconEl   = document.getElementById('kv-error-icon');
    const titleEl  = document.getElementById('kv-error-title');
    const descEl   = document.getElementById('kv-error-desc');
    const stepsEl  = document.getElementById('kv-error-steps');
    const chromeEl = document.getElementById('kv-error-chrome');
    const retryBtn = document.getElementById('kv-error-retry');

    const errName = err ? err.name : '';

    if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
      if (iconEl)  iconEl.textContent  = '🔒';
      if (titleEl) titleEl.textContent = T.error_blocked_title;
      if (descEl)  descEl.textContent  = T.error_blocked_desc;
      if (stepsEl && T.error_blocked_steps) {
        stepsEl.innerHTML = T.error_blocked_steps.map(s => `<li>${s}</li>`).join('');
        stepsEl.style.display = 'block';
      }
      if (chromeEl) { chromeEl.innerHTML = T.error_blocked_chrome; chromeEl.style.display = 'block'; }
      if (retryBtn) { retryBtn.textContent = T.error_retry; retryBtn.style.display = 'block'; retryBtn.disabled = false; }
    } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
      if (iconEl)  iconEl.textContent  = '📵';
      if (titleEl) titleEl.textContent = T.error_notfound_title;
      if (descEl)  descEl.textContent  = T.error_notfound_desc;
    } else {
      if (iconEl)  iconEl.textContent  = '📷';
      if (titleEl) titleEl.textContent = T.error_title;
      if (descEl)  descEl.textContent  = T.error_desc;
      if (retryBtn) { retryBtn.textContent = T.error_retry; retryBtn.style.display = 'block'; retryBtn.disabled = false; }
    }

    console.warn('[KOI Vision] Error:', errName, err?.message);
  }

  /* ══════════════════════════════════════════════════════════
     UTILIDADES
     ══════════════════════════════════════════════════════════ */
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /* ══════════════════════════════════════════════════════════
     API PÚBLICA — window.koiVision
     ══════════════════════════════════════════════════════════ */
  window.koiVision = {
    abrir:       function(contexto) { abrir(contexto); },
    onResultado: function(cb)       { KV_STATE.onResultadoCb = cb; },
    cerrar:      cerrar,
    isAvailable: async function() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.some(d => d.kind === 'videoinput');
      } catch (_) { return false; }
    },
  };

})();
