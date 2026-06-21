/**
 * ============================================================
 * SHATOKB · KOI Vision — BioScan Module  v4.0
 * assets/shatokb-koi-vision.js
 *
 * v4.0 — KOI BioScan: Korean clinical scanner experience
 *   • Grid holográfico + scan line animada CSS
 *   • 4 targeting corners (sin óvalo)
 *   • Métricas biométricas flotantes en tiempo real
 *   • FaceDetector API + fallback luminosidad central
 *   • Countdown automático 5→1 cuando detecta rostro
 *   • Si el rostro se pierde → cuenta se pausa
 *   • Pantalla de confirmación: "Perfect / Retake"
 *   • Sin botón manual de captura
 *   • Sin mensajes de iluminación
 *
 * Funciones críticas intactas (no modificadas):
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

    // Detección de presencia — umbral brillo zona central (0-255)
    presenceThreshold: 18,    // por encima → hay cara probable
    presenceCheckMs:   400,   // cada cuánto verificar

    // Countdown
    countdownFrom:     5,     // 5 → 1
    countdownStepMs:   1000,  // 1 segundo por número
  };

  /* ══════════════════════════════════════════════════════════
     ESTADO
     ══════════════════════════════════════════════════════════ */
  const KV_STATE = {
    stream:          null,
    isOpen:          false,
    capturedImage:   null,
    analysisResult:  null,
    phase:           'idle', // idle|loading|camera|confirm|analyzing|result|error
    onResultadoCb:   null,
    contexto:        null,

    // Detección y countdown
    faceDetector:    null,
    facePresent:     false,
    presenceTimer:   null,
    countdownTimer:  null,
    countdownVal:    0,
    scanPctTimer:    null,
    metricTimers:    [],
  };

  /* ══════════════════════════════════════════════════════════
     TEXTOS
     ══════════════════════════════════════════════════════════ */
  const T = {
    scanning:   'KOI BIOSCAN · SEARCHING',
    lock:       'FACE LOCKED · HOLD STILL',
    analysis_title: 'KOI is analyzing your skin',
    analysis_sub:   'Clinical analysis in progress',
    confirm_title:  'Use this photo?',
    confirm_yes:    '✓ Perfect — Analyze my skin',
    confirm_retry:  '↺ Retake photo',
    result_title:   'Analysis Complete ✓',
    result_cta:     '✨ See full analysis in chat →',
    privacy:        '🔒 Image processed instantly. Not stored.',
    error_title:    'Camera not available',
    error_desc:     "We need camera permission to analyze your skin. You can still explore your routine — tap below.",
    error_alt:      '✨ Continue without camera',
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
    error_retry:          '🔄 Try again',
    loading:        'Requesting camera access…',
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

        <!-- ─── HEADER flotante sobre la cámara ─── -->
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

          <!-- Video -->
          <video id="koi-vision-video" autoplay playsinline muted></video>
          <canvas id="koi-vision-canvas" style="display:none;"></canvas>

          <!-- Viñeta -->
          <div class="kv-vignette"></div>

          <!-- Grid holográfico CSS -->
          <div class="kv-bioscan-grid" aria-hidden="true"></div>

          <!-- Líneas de scan -->
          <div class="kv-bioscan-line"   aria-hidden="true"></div>
          <div class="kv-bioscan-line-2" aria-hidden="true"></div>

          <!-- Targeting corners -->
          <div class="kv-corners" id="kv-corners" aria-hidden="true">
            <div class="kv-corner kv-corner--tl"></div>
            <div class="kv-corner kv-corner--tr"></div>
            <div class="kv-corner kv-corner--bl"></div>
            <div class="kv-corner kv-corner--br"></div>
          </div>

          <!-- Puntos biométricos flotantes -->
          <div class="kv-bio-live" aria-hidden="true">
            <div class="kv-bio-dot" style="top:30%;left:50%"></div>
            <div class="kv-bio-dot" style="top:42%;left:34%"></div>
            <div class="kv-bio-dot" style="top:42%;left:66%"></div>
            <div class="kv-bio-dot" style="top:56%;left:30%"></div>
            <div class="kv-bio-dot" style="top:56%;left:70%"></div>
            <div class="kv-bio-dot" style="top:66%;left:50%"></div>
            <div class="kv-bio-dot" style="top:50%;left:50%"></div>
          </div>

          <!-- Métricas biométricas -->
          <div class="kv-metrics" aria-hidden="true">
            <div class="kv-metric kv-metric--tl">
              <div class="kv-metric__label">HYDRATION</div>
              <div class="kv-metric__value" id="kv-m-hydration">--</div>
              <div class="kv-metric__bar"><div class="kv-metric__bar-fill"></div></div>
            </div>
            <div class="kv-metric kv-metric--tr">
              <div class="kv-metric__label">MELANIN</div>
              <div class="kv-metric__value" id="kv-m-melanin">--</div>
              <div class="kv-metric__bar"><div class="kv-metric__bar-fill"></div></div>
            </div>
            <div class="kv-metric kv-metric--bl">
              <div class="kv-metric__label">BARRIER</div>
              <div class="kv-metric__value" id="kv-m-barrier">--</div>
              <div class="kv-metric__bar"><div class="kv-metric__bar-fill"></div></div>
            </div>
            <div class="kv-metric kv-metric--br">
              <div class="kv-metric__label">UV INDEX</div>
              <div class="kv-metric__value" id="kv-m-uv">--</div>
              <div class="kv-metric__bar"><div class="kv-metric__bar-fill"></div></div>
            </div>
          </div>

          <!-- HUD status -->
          <div class="kv-hud" aria-hidden="true">
            <div class="kv-hud__status">
              <div class="kv-hud__dot kv--live" id="kv-hud-dot"></div>
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

          <!-- Flash -->
          <div class="kv-capture-flash" id="kv-capture-flash"></div>

        </div>

        <!-- ─── CONFIRM SCREEN ─── -->
        <div class="kv-confirm" id="kv-confirm">
          <img class="kv-confirm__photo" id="kv-confirm-photo" alt="" />
          <div class="kv-confirm__overlay"></div>
          <div class="kv-confirm__content">
            <div class="kv-confirm__title">Use this <span>photo?</span></div>
            <div class="kv-confirm__subtitle">KOI BioScan · Capture Review</div>
            <div class="kv-confirm__btns">
              <button class="kv-confirm__btn-yes" id="kv-confirm-yes" type="button">
                ${T.confirm_yes}
              </button>
              <button class="kv-confirm__btn-retry" id="kv-confirm-retry" type="button">
                ${T.confirm_retry}
              </button>
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
                <div class="kv-scan-data__chip kv-scan-data__chip--tl">BIOSCAN</div>
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
          <div class="kv-result-cta" id="kv-result-cta" role="button" tabindex="0">
            ${T.result_cta}
          </div>
          <div class="kv-privacy-note">${T.privacy}</div>
        </div>

        <!-- ─── ERROR ─── -->
        <div class="kv-error-state" id="kv-error-state">
          <span class="kv-error-state__icon" id="kv-error-icon">📷</span>
          <div class="kv-error-state__title" id="kv-error-title">${T.error_title}</div>
          <p class="kv-error-state__desc" id="kv-error-desc">${T.error_desc}</p>
          <ol class="kv-error-steps" id="kv-error-steps" style="display:none;"></ol>
          <p class="kv-error-chrome-tip" id="kv-error-chrome" style="display:none;"></p>
          <button class="kv-error-retry-btn" id="kv-error-retry" type="button" style="display:none;">
            ${T.error_retry}
          </button>
          <div class="kv-error-alt-btn" id="kv-error-alt" role="button" tabindex="0">${T.error_alt}</div>
        </div>

      </div>
    `;

    document.body.appendChild(modal);
    bindEvents();
  }

  /* ══════════════════════════════════════════════════════════
     EVENTOS
     ══════════════════════════════════════════════════════════ */
  function bindEvents() {
    // Cerrar con X
    const closeBtn = document.getElementById('kv-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', cerrar, true);
      closeBtn.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') cerrar();
      });
    }

    // Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && KV_STATE.isOpen) cerrar();
    });

    // Confirm: sí, analizar
    const confirmYes = document.getElementById('kv-confirm-yes');
    if (confirmYes) {
      confirmYes.addEventListener('click', () => {
        setPhase('analyzing');
        iniciarAnalisis(KV_STATE.capturedImage);
      }, true);
    }

    // Confirm: repetir foto
    const confirmRetry = document.getElementById('kv-confirm-retry');
    if (confirmRetry) {
      confirmRetry.addEventListener('click', retake, true);
    }

    // Botón alternativo sin cámara
    const altBtn = document.getElementById('kv-error-alt');
    if (altBtn) {
      altBtn.addEventListener('click', () => {
        cerrar();
        if (typeof window.koiVisionAlternativo === 'function') {
          window.koiVisionAlternativo();
        }
      }, true);
    }

    // Reintentar cámara
    const retryBtn = document.getElementById('kv-error-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', async () => {
        retryBtn.disabled = true;
        retryBtn.textContent = '⏳ …';
        setPhase('loading');
        await iniciarCamara();
      }, true);
    }

    // CTA resultado
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
      'kv-loading-state',
      'kv-viewfinder',
      'kv-confirm',
      'kv-analyzing',
      'kv-result-preview',
      'kv-error-state',
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

    KV_STATE.contexto      = contexto || null;
    KV_STATE.isOpen        = true;
    KV_STATE.capturedImage = null;
    KV_STATE.analysisResult = null;
    KV_STATE.facePresent   = false;
    KV_STATE.countdownVal  = 0;

    buildModal();

    const modal = document.getElementById('koi-vision-modal');
    if (!modal) return;

    document.body.style.overflow = 'hidden';
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
      setTimeout(() => {
        if (modal.parentNode) modal.parentNode.removeChild(modal);
      }, 400);
    }

    document.body.style.overflow = '';
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
            err.name === 'NotFoundError'   || err.name === 'DevicesNotFoundError') {
          break;
        }
      }
    }

    if (!stream) {
      mostrarError(lastErr || new Error('Camera unavailable'));
      return;
    }

    KV_STATE.stream = stream;
    const video = document.getElementById('koi-vision-video');
    if (!video) return;
    video.srcObject = stream;
    await video.play().catch(() => {});

    // Inicializar FaceDetector si está disponible
    _initFaceDetector();

    setPhase('camera');
    _startScanEffects();
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
        KV_STATE.faceDetector = new window.FaceDetector({
          fastMode: true,
          maxDetectedFaces: 1,
        });
        console.log('[KOI BioScan] FaceDetector API disponible ✓');
      } catch (_) {
        KV_STATE.faceDetector = null;
      }
    } else {
      KV_STATE.faceDetector = null;
      console.log('[KOI BioScan] FaceDetector no disponible — usando luminosidad central');
    }
  }

  async function _detectFacePresence() {
    const video = document.getElementById('koi-vision-video');
    if (!video || !KV_STATE.stream) return false;

    // Método 1: FaceDetector API
    if (KV_STATE.faceDetector) {
      try {
        const faces = await KV_STATE.faceDetector.detect(video);
        return faces.length > 0;
      } catch (_) {
        // fallback
      }
    }

    // Método 2: luminosidad zona central (proxy de cara)
    const canvas = document.getElementById('koi-vision-canvas');
    if (!canvas) return false;

    // Analizar solo la zona central (donde estaría la cara)
    const cw = 60; const ch = 60;
    canvas.width  = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');

    try {
      // Capturar solo el centro del video
      const vw = video.videoWidth  || 320;
      const vh = video.videoHeight || 240;
      const sx = vw * 0.25; const sy = vh * 0.15;
      const sw = vw * 0.50; const sh = vh * 0.70;
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, cw, ch);
      const data = ctx.getImageData(0, 0, cw, ch).data;

      let sum = 0; let count = 0;
      for (let i = 0; i < data.length; i += 4) {
        sum += (data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114);
        count++;
      }
      const avg = count > 0 ? sum / count : 0;
      return avg >= KV_CONFIG.presenceThreshold;
    } catch (_) {
      return false;
    }
  }

  /* ══════════════════════════════════════════════════════════
     DETECCIÓN CONTINUA + COUNTDOWN
     ══════════════════════════════════════════════════════════ */
  function _startPresenceDetection() {
    _stopPresenceTimer();

    KV_STATE.presenceTimer = setInterval(async () => {
      if (KV_STATE.phase !== 'camera') {
        _stopPresenceTimer();
        return;
      }

      const present = await _detectFacePresence();

      if (present && !KV_STATE.facePresent) {
        // ROSTRO DETECTADO — iniciar countdown
        KV_STATE.facePresent = true;
        _onFaceLocked();
      } else if (!present && KV_STATE.facePresent) {
        // ROSTRO PERDIDO — pausar countdown
        KV_STATE.facePresent = false;
        _onFaceLost();
      }

    }, KV_CONFIG.presenceCheckMs);
  }

  function _onFaceLocked() {
    // Actualizar UI a estado LOCK
    const corners   = document.getElementById('kv-corners');
    const statusMsg = document.getElementById('kv-status-msg');
    const hudDot    = document.getElementById('kv-hud-dot');
    const hudText   = document.getElementById('kv-hud-text');

    if (corners)   corners.classList.add('kv--lock');
    if (statusMsg) { statusMsg.textContent = T.lock; statusMsg.classList.add('kv--lock'); }
    if (hudDot)    { hudDot.className = 'kv-hud__dot kv--lock'; }
    if (hudText)   hudText.textContent = 'LOCKED';

    // Activar métricas
    _startMetricAnimations();

    // Iniciar countdown
    _startCountdown();
  }

  function _onFaceLost() {
    // Resetear countdown
    _stopCountdown();

    const corners   = document.getElementById('kv-corners');
    const statusMsg = document.getElementById('kv-status-msg');
    const hudDot    = document.getElementById('kv-hud-dot');
    const hudText   = document.getElementById('kv-hud-text');
    const countdown = document.getElementById('kv-countdown');

    if (corners)   corners.classList.remove('kv--lock');
    if (statusMsg) { statusMsg.textContent = T.scanning; statusMsg.classList.remove('kv--lock'); }
    if (hudDot)    hudDot.className = 'kv-hud__dot kv--live';
    if (hudText)   hudText.textContent = 'LIVE';
    if (countdown) countdown.classList.remove('kv--active');
  }

  function _startCountdown() {
    _stopCountdown();
    KV_STATE.countdownVal = KV_CONFIG.countdownFrom;

    const countdownEl = document.getElementById('kv-countdown');
    if (countdownEl) countdownEl.classList.add('kv--active');

    _tickCountdown();
  }

  function _tickCountdown() {
    if (KV_STATE.phase !== 'camera' || !KV_STATE.facePresent) return;
    if (KV_STATE.countdownVal <= 0) {
      _dispararCaptura();
      return;
    }

    const numEl  = document.getElementById('kv-countdown-num');
    const ringEl = document.getElementById('kv-countdown-ring');

    if (numEl) {
      numEl.textContent = KV_STATE.countdownVal;
      // Resetear y re-aplicar animación
      numEl.classList.remove('kv--pop');
      void numEl.offsetWidth; // reflow
      numEl.classList.add('kv--pop');
    }

    if (ringEl) {
      ringEl.classList.remove('kv--pulse');
      void ringEl.offsetWidth;
      ringEl.classList.add('kv--pulse');
    }

    KV_STATE.countdownVal--;

    KV_STATE.countdownTimer = setTimeout(_tickCountdown, KV_CONFIG.countdownStepMs);
  }

  function _stopCountdown() {
    if (KV_STATE.countdownTimer) {
      clearTimeout(KV_STATE.countdownTimer);
      KV_STATE.countdownTimer = null;
    }
    KV_STATE.countdownVal = 0;
  }

  function _stopPresenceTimer() {
    if (KV_STATE.presenceTimer) {
      clearInterval(KV_STATE.presenceTimer);
      KV_STATE.presenceTimer = null;
    }
  }

  /* ══════════════════════════════════════════════════════════
     EFECTOS WOW — scan pct + métricas
     ══════════════════════════════════════════════════════════ */
  function _startScanEffects() {
    // Animar SCAN X%
    let pct = 0;
    KV_STATE.scanPctTimer = setInterval(() => {
      if (!KV_STATE.isOpen || KV_STATE.phase !== 'camera') {
        clearInterval(KV_STATE.scanPctTimer);
        return;
      }
      pct = (pct + Math.floor(Math.random() * 5 + 1)) % 101;
      const el = document.getElementById('kv-scan-pct');
      if (el) el.textContent = 'SCAN ' + pct + '%';
    }, 500);
  }

  function _startMetricAnimations() {
    // Datos simulados que "calculan" en tiempo real
    const metrics = [
      { id: 'kv-m-hydration', min: 42, max: 89, suffix: '%' },
      { id: 'kv-m-melanin',   min: 12, max: 68, suffix: '' },
      { id: 'kv-m-barrier',   min: 55, max: 96, suffix: '%' },
      { id: 'kv-m-uv',        min: 1,  max: 4,  suffix: '' },
    ];

    metrics.forEach(m => {
      const el = document.getElementById(m.id);
      if (!el) return;

      let current = m.min;
      const target = m.min + Math.floor(Math.random() * (m.max - m.min));

      const timer = setInterval(() => {
        if (!KV_STATE.isOpen || KV_STATE.phase !== 'camera') {
          clearInterval(timer);
          return;
        }
        if (current < target) {
          current += Math.ceil((target - current) / 4);
          el.textContent = current + m.suffix;
        } else {
          // Fluctuar levemente
          const delta = Math.floor(Math.random() * 5) - 2;
          current = Math.max(m.min, Math.min(m.max, current + delta));
          el.textContent = current + m.suffix;
        }
      }, 200);

      KV_STATE.metricTimers.push(timer);
    });
  }

  function _stopAllTimers() {
    _stopPresenceTimer();
    _stopCountdown();
    if (KV_STATE.scanPctTimer) { clearInterval(KV_STATE.scanPctTimer); KV_STATE.scanPctTimer = null; }
    KV_STATE.metricTimers.forEach(t => clearInterval(t));
    KV_STATE.metricTimers = [];
  }

  /* ══════════════════════════════════════════════════════════
     CAPTURA
     ══════════════════════════════════════════════════════════ */
  function _dispararCaptura() {
    if (KV_STATE.phase !== 'camera') return;

    _stopAllTimers();

    // Actualizar HUD
    const hudDot  = document.getElementById('kv-hud-dot');
    const hudText = document.getElementById('kv-hud-text');
    if (hudDot)  hudDot.className = 'kv-hud__dot kv--capture';
    if (hudText) hudText.textContent = 'CAPTURE';

    // Ocultar countdown
    const countdown = document.getElementById('kv-countdown');
    if (countdown) countdown.classList.remove('kv--active');

    // Flash
    const flashEl = document.getElementById('kv-capture-flash');
    if (flashEl) {
      flashEl.classList.add('kv--flash');
      setTimeout(() => flashEl.classList.remove('kv--flash'), 450);
    }

    // Pequeña pausa post-flash
    setTimeout(() => _tomarFoto(), 150);
  }

  function _tomarFoto() {
    const video  = document.getElementById('koi-vision-video');
    const canvas = document.getElementById('koi-vision-canvas');

    if (!video || !canvas) {
      _mostrarConfirm(null);
      return;
    }

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

    // NO parar la cámara aquí — la necesitamos si el usuario elige "Retake"
    _mostrarConfirm(base64);
  }

  /* ══════════════════════════════════════════════════════════
     CONFIRM SCREEN
     ══════════════════════════════════════════════════════════ */
  function _mostrarConfirm(base64) {
    const photoEl = document.getElementById('kv-confirm-photo');
    if (photoEl && base64) photoEl.src = base64;

    setPhase('confirm');
  }

  function retake() {
    // Volver a la cámara sin recargar el stream
    KV_STATE.capturedImage = null;
    KV_STATE.facePresent   = false;
    KV_STATE.countdownVal  = 0;

    // Resetear estado visual
    const corners   = document.getElementById('kv-corners');
    const statusMsg = document.getElementById('kv-status-msg');
    const hudDot    = document.getElementById('kv-hud-dot');
    const hudText   = document.getElementById('kv-hud-text');
    const countdown = document.getElementById('kv-countdown');

    if (corners)   corners.classList.remove('kv--lock');
    if (statusMsg) { statusMsg.textContent = T.scanning; statusMsg.classList.remove('kv--lock'); }
    if (hudDot)    hudDot.className = 'kv-hud__dot kv--live';
    if (hudText)   hudText.textContent = 'LIVE';
    if (countdown) countdown.classList.remove('kv--active');

    setPhase('camera');
    _startScanEffects();
    _startPresenceDetection();
  }

  /* ══════════════════════════════════════════════════════════
     ANÁLISIS PROGRESIVO — idéntico al original
     ══════════════════════════════════════════════════════════ */
  async function iniciarAnalisis(imageBase64) {
    // Parar cámara ahora que ya confirmamos
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

    const fillEl    = document.getElementById('kv-progress-fill');
    const pctLabel  = document.getElementById('kv-analysis-pct-label');
    const scanPct   = document.getElementById('kv-scan-pct-analysis');
    const items     = T.items;
    const total     = items.length;

    function setProgress(pct) {
      if (fillEl)   fillEl.style.width     = pct + '%';
      if (pctLabel) pctLabel.textContent   = Math.round(pct) + '%';
      if (scanPct)  scanPct.textContent    = Math.round(pct) + '%';
    }

    // Llamar al Worker EN PARALELO con la animación
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
      const idioma = (navigator.language || 'en').split('-')[0].toLowerCase();

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
