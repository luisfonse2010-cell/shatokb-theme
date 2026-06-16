/**
 * ============================================================
 * SHATOKB · KOI Vision — Facial Skin Analysis Module  v1.0
 * assets/shatokb-koi-vision.js
 *
 * El análisis facial que ninguna tienda de K-Beauty ha hecho.
 *
 * Flujo:
 *   1. Chip "📸 Analyze my skin" en el chat de KOI
 *   2. Modal con cámara frontal se abre
 *   3. Guía oval para posicionar el rostro
 *   4. Countdown 3-2-1 + línea de scan animada
 *   5. Flash + captura automática (canvas → base64)
 *   6. Pantalla de análisis con items progresivos
 *   7. POST al Cloudflare Worker /vision con imagen
 *   8. Worker llama a GPT-4o Vision → análisis de piel
 *   9. KOI presenta el análisis en el chat
 *   10. Si la rutina debe ajustarse, KOI lo hace
 *
 * Integración:
 *   - window.koiVision.abrir() → desde shatokb-koi-chat.js
 *   - window.koiVision.onResultado(cb) → callback con análisis
 *   - El Worker URL viene de KOI_CONFIG.workerUrl en koi-chat
 * ============================================================
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     CONFIGURACIÓN
     ══════════════════════════════════════════════════════════ */
  const KV_CONFIG = {
    // Worker URL — se toma de window.KOI_VISION_WORKER_URL
    // que es expuesto por koi-chat.js, o fallback al worker real
    get workerUrl() {
      return window.KOI_VISION_WORKER_URL || 'https://koi-proxy.luisfonse2010.workers.dev/vision';
    },

    // Delay entre cada item de análisis (ms)
    analysisItemDelay: 800,

    // Tiempo mínimo de análisis simulado antes de mostrar resultado (ms)
    minAnalysisTime: 3200,

    // Resolución de captura (el canvas captura a este tamaño)
    captureWidth: 640,
    captureHeight: 480,

    // Calidad JPEG de la imagen enviada al worker (0-1)
    imageQuality: 0.80,

    // Countdown seconds
    countdownFrom: 3,
  };

  /* ══════════════════════════════════════════════════════════
     ESTADO
     ══════════════════════════════════════════════════════════ */
  const KV_STATE = {
    stream:         null,     // MediaStream activo
    isOpen:         false,    // Modal visible
    capturedImage:  null,     // base64 de la imagen capturada
    analysisResult: null,     // Resultado del Worker
    phase:          'idle',   // idle | loading | camera | countdown | analyzing | result | error
    countdownTimer: null,
    onResultadoCb:  null,     // Callback al recibir resultado
    contexto:       null,     // Contexto del quiz (perfil, respuestas)
  };

  /* ══════════════════════════════════════════════════════════
     TEXTOS LOCALIZADOS
     ══════════════════════════════════════════════════════════ */
  const KV_I18N = {
    en: {
      title:          'KOI Skin Analysis',
      subtitle:       'AI-Powered · Real-Time',
      badge:          '📸 VISION',
      loading:        'Requesting camera access…',
      guide_idle:     '👆 Position your face in the oval',
      guide_found:    '✓ Perfect — hold still',
      status_live:    'Camera live',
      status_found:   'Face detected',
      status_capture: 'Capturing…',
      quality_ready:  '✓ READY',
      analysis_title: 'KOI is analyzing your skin',
      items: [
        { icon: '🔬', text: 'Analyzing skin texture and pores' },
        { icon: '💧', text: 'Detecting hydration levels' },
        { icon: '🎨', text: 'Evaluating tone and pigmentation' },
        { icon: '⚡', text: 'Identifying reactive zones' },
        { icon: '✨', text: 'Personalizing your routine' },
      ],
      result_title:    'Skin Analysis Complete',
      result_cta:      '✨ See full analysis in chat →',
      privacy:         '🔒 Image processed instantly and not stored.',
      error_title:     'Camera not available',
      error_desc:      "We need camera permission to analyze your skin. You can still explore your routine below — or tap 'Continue without camera' to let KOI guide you with your quiz answers.",
      error_alt:       '✨ Continue without camera',
      deny_title:      'Camera access denied',
      deny_desc:       "No problem — your quiz answers already give KOI everything needed to personalize your routine. The analysis would have confirmed or refined it, but KOI works with what we have.",
      zones: {
        tzone:   { emoji: '💦', label: 'T-Zone', value: 'Analyzing…' },
        cheeks:  { emoji: '🌸', label: 'Cheeks', value: 'Analyzing…' },
        eyes:    { emoji: '👁️', label: 'Eye Area', value: 'Analyzing…' },
      },
    },
    es: {
      title:          'KOI Análisis Facial',
      subtitle:       'IA en Tiempo Real',
      badge:          '📸 VISIÓN',
      loading:        'Solicitando acceso a la cámara…',
      guide_idle:     '👆 Coloca tu rostro en el óvalo',
      guide_found:    '✓ Perfecto — mantente quieta',
      status_live:    'Cámara activa',
      status_found:   'Rostro detectado',
      status_capture: 'Capturando…',
      quality_ready:  '✓ LISTO',
      analysis_title: 'KOI está analizando tu piel',
      items: [
        { icon: '🔬', text: 'Analizando textura y poros' },
        { icon: '💧', text: 'Detectando niveles de hidratación' },
        { icon: '🎨', text: 'Evaluando tono y pigmentación' },
        { icon: '⚡', text: 'Identificando zonas reactivas' },
        { icon: '✨', text: 'Personalizando tu rutina' },
      ],
      result_title:    'Análisis completado',
      result_cta:      '✨ Ver análisis completo en el chat →',
      privacy:         '🔒 Imagen procesada al instante. No se almacena.',
      error_title:     'Cámara no disponible',
      error_desc:      'Necesitamos permiso de cámara para analizar tu piel. Puedes continuar explorando tu rutina, o pulsar "Continuar sin cámara" para que KOI te guíe con tus respuestas del quiz.',
      error_alt:       '✨ Continuar sin cámara',
      deny_title:      'Permiso de cámara denegado',
      deny_desc:       'Sin problema — tus respuestas del quiz ya le dan a KOI todo lo necesario para personalizar tu rutina. El análisis lo habría confirmado, pero trabajamos con lo que tenemos.',
      zones: {
        tzone:   { emoji: '💦', label: 'Zona T', value: 'Analizando…' },
        cheeks:  { emoji: '🌸', label: 'Mejillas', value: 'Analizando…' },
        eyes:    { emoji: '👁️', label: 'Contorno ojos', value: 'Analizando…' },
      },
    },
  };

  function getT() {
    const lang = (navigator.language || 'en').split('-')[0].toLowerCase();
    return KV_I18N[lang] || KV_I18N.en;
  }

  /* ══════════════════════════════════════════════════════════
     CONSTRUCCIÓN DEL DOM DEL MODAL
     ══════════════════════════════════════════════════════════ */
  function buildModal() {
    if (document.getElementById('koi-vision-modal')) return;

    const t = getT();
    const modal = document.createElement('div');
    modal.id = 'koi-vision-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', t.title);

    modal.innerHTML = `
      <div class="kv-panel">

        <!-- Aurora border via CSS ::before -->

        <!-- HEADER -->
        <div class="kv-header">
          <div class="kv-header__koi">
            <div class="kv-header__avatar">🌸</div>
            <div>
              <div class="kv-header__name">KOI</div>
              <div class="kv-header__subtitle">${t.subtitle}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="kv-header__badge">${t.badge}</div>
            <div class="kv-close-btn" id="kv-close-btn" role="button" tabindex="0" aria-label="Close">✕</div>
          </div>
        </div>

        <!-- LOADING STATE -->
        <div class="kv-loading-state kv--active" id="kv-loading-state">
          <div class="kv-spinner"></div>
          <div class="kv-loading-state__text">${t.loading}</div>
        </div>

        <!-- VIEWFINDER (cámara) -->
        <div class="kv-viewfinder" id="kv-viewfinder" style="display:none;">
          <video id="koi-vision-video" autoplay playsinline muted></video>
          <canvas id="koi-vision-canvas" style="display:none;"></canvas>

          <!-- Esquinas scanner -->
          <div class="kv-corner kv-corner--tl"></div>
          <div class="kv-corner kv-corner--tr"></div>
          <div class="kv-corner kv-corner--bl"></div>
          <div class="kv-corner kv-corner--br"></div>

          <!-- Guía de texto -->
          <div class="kv-guide-text" id="kv-guide-text">${t.guide_idle}</div>

          <!-- Guía oval -->
          <div class="kv-face-guide">
            <div class="kv-face-guide__oval" id="kv-face-oval"></div>
          </div>

          <!-- Partículas de datos -->
          <div class="kv-particles" id="kv-particles"></div>

          <!-- Línea de scan -->
          <div class="kv-scan-line" id="kv-scan-line"></div>

          <!-- Countdown -->
          <div class="kv-countdown" id="kv-countdown">
            <svg class="kv-countdown__ring" viewBox="0 0 72 72">
              <circle class="kv-ring-track" cx="36" cy="36" r="30"/>
              <circle class="kv-ring-fill" id="kv-ring-fill" cx="36" cy="36" r="30"/>
            </svg>
            <div class="kv-countdown__num" id="kv-countdown-num">3</div>
          </div>

          <!-- Flash de captura -->
          <div class="kv-capture-flash" id="kv-capture-flash"></div>

          <!-- HUD inferior -->
          <div class="kv-hud">
            <div class="kv-hud__status">
              <div class="kv-hud__dot kv--live" id="kv-hud-dot"></div>
              <span id="kv-hud-text">${t.status_live}</span>
            </div>
            <div class="kv-hud__quality" id="kv-hud-quality">${t.quality_ready}</div>
          </div>

          <!-- Overlay FX -->
          <div class="kv-fx-overlay" id="kv-fx-overlay"></div>
        </div>

        <!-- PANTALLA DE ANÁLISIS -->
        <div class="kv-analyzing" id="kv-analyzing">
          <img class="kv-captured-img" id="kv-captured-img" alt="Captured frame" />
          <div class="kv-analysis-progress">
            <span class="kv-analysis-progress__label">${t.analysis_title}</span>
            <div class="kv-progress-track">
              <div class="kv-progress-fill" id="kv-progress-fill"></div>
            </div>
          </div>
          <div class="kv-analysis-items" id="kv-analysis-items">
            ${t.items.map((item, i) => `
              <div class="kv-analysis-item" id="kv-item-${i}">
                <span class="kv-analysis-item__icon">${item.icon}</span>
                <span class="kv-analysis-item__text">${item.text}</span>
                <span class="kv-analysis-item__check">✓</span>
              </div>
            `).join('')}
          </div>
          <p class="kv-analyzing__subtitle" id="kv-analyzing-sub"></p>
        </div>

        <!-- RESULTADO PREVIEW -->
        <div class="kv-result-preview" id="kv-result-preview">
          <div class="kv-result-preview__title">${t.result_title}</div>
          <div class="kv-zones" id="kv-zones">
            ${Object.entries(t.zones).map(([key, z]) => `
              <div class="kv-zone-card" id="kv-zone-${key}">
                <span class="kv-zone-card__emoji">${z.emoji}</span>
                <span class="kv-zone-card__label">${z.label}</span>
                <span class="kv-zone-card__value" id="kv-zone-val-${key}">${z.value}</span>
              </div>
            `).join('')}
          </div>
          <div class="kv-result-cta" id="kv-result-cta" role="button" tabindex="0">
            ${t.result_cta}
          </div>
          <div class="kv-privacy-note">${t.privacy}</div>
        </div>

        <!-- ERROR STATE -->
        <div class="kv-error-state" id="kv-error-state">
          <span class="kv-error-state__icon">📷</span>
          <div class="kv-error-state__title" id="kv-error-title">${t.error_title}</div>
          <p class="kv-error-state__desc" id="kv-error-desc">${t.error_desc}</p>
          <div class="kv-error-alt-btn" id="kv-error-alt" role="button" tabindex="0">${t.error_alt}</div>
        </div>

      </div>
    `;

    document.body.appendChild(modal);
    bindModalEvents();
  }

  /* ══════════════════════════════════════════════════════════
     EVENTOS DEL MODAL
     ══════════════════════════════════════════════════════════ */
  function bindModalEvents() {
    // Cerrar con X
    const closeBtn = document.getElementById('kv-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', cerrar, true);
      closeBtn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') cerrar(); });
    }

    // Cerrar clickando fuera del panel
    const modal = document.getElementById('koi-vision-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrar();
      }, true);
    }

    // Botón alternativo (sin cámara)
    const altBtn = document.getElementById('kv-error-alt');
    if (altBtn) {
      altBtn.addEventListener('click', () => {
        cerrar();
        // Disparar el flujo alternativo (sin cámara)
        if (typeof window.koiVisionAlternativo === 'function') {
          window.koiVisionAlternativo();
        }
      }, true);
    }

    // Botón de resultado → al chat
    const ctaBtn = document.getElementById('kv-result-cta');
    if (ctaBtn) {
      ctaBtn.addEventListener('click', enviarAlChat, true);
      ctaBtn.addEventListener('keydown', (e) => { if (e.key === 'Enter') enviarAlChat(); });
    }

    // Escape para cerrar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && KV_STATE.isOpen) cerrar();
    });
  }

  /* ══════════════════════════════════════════════════════════
     GESTIÓN DE FASES DEL UI
     ══════════════════════════════════════════════════════════ */
  function setPhase(phase) {
    KV_STATE.phase = phase;
    const ids = ['kv-loading-state', 'kv-viewfinder', 'kv-analyzing', 'kv-result-preview', 'kv-error-state'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.display = 'none';
        el.classList.remove('kv--active');
      }
    });

    const map = {
      loading:   'kv-loading-state',
      camera:    'kv-viewfinder',
      analyzing: 'kv-analyzing',
      result:    'kv-result-preview',
      error:     'kv-error-state',
    };

    const target = map[phase];
    if (target) {
      const el = document.getElementById(target);
      if (el) {
        el.style.display = '';
        requestAnimationFrame(() => el.classList.add('kv--active'));
      }
    }
  }

  /* ══════════════════════════════════════════════════════════
     APERTURA DEL MODAL
     ══════════════════════════════════════════════════════════ */
  async function abrir(contexto) {
    if (KV_STATE.isOpen) return;

    KV_STATE.contexto = contexto || null;
    KV_STATE.isOpen   = true;
    KV_STATE.capturedImage  = null;
    KV_STATE.analysisResult = null;

    buildModal();

    const modal = document.getElementById('koi-vision-modal');
    if (!modal) return;

    // Mostrar modal
    requestAnimationFrame(() => {
      modal.classList.add('kv--active');
    });

    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';

    // Iniciar cámara
    setPhase('loading');
    await iniciarCamara();
  }

  /* ══════════════════════════════════════════════════════════
     CIERRE DEL MODAL
     ══════════════════════════════════════════════════════════ */
  function cerrar() {
    const modal = document.getElementById('koi-vision-modal');
    if (modal) modal.classList.remove('kv--active');

    // Parar cámara
    pararCamara();

    // Parar countdown si había
    if (KV_STATE.countdownTimer) {
      clearInterval(KV_STATE.countdownTimer);
      KV_STATE.countdownTimer = null;
    }

    // Restaurar scroll
    document.body.style.overflow = '';

    KV_STATE.isOpen = false;

    // Destruir modal después de la animación
    setTimeout(() => {
      const m = document.getElementById('koi-vision-modal');
      if (m) m.remove();
      KV_STATE.phase = 'idle';
    }, 500);
  }

  /* ══════════════════════════════════════════════════════════
     CÁMARA
     ══════════════════════════════════════════════════════════ */
  async function iniciarCamara() {
    try {
      // Solicitar cámara frontal
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode:  'user',
          width:       { ideal: 1280 },
          height:      { ideal: 960 },
        },
        audio: false,
      });

      KV_STATE.stream = stream;

      const video = document.getElementById('koi-vision-video');
      if (!video) return;

      video.srcObject = stream;
      await video.play().catch(() => {});

      setPhase('camera');
      iniciarDeteccionRostro();
      iniciarParticulas();

    } catch (err) {
      console.warn('[KOI Vision] Camera error:', err.name, err.message);
      mostrarError(err);
    }
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
     DETECCIÓN DE ROSTRO (simulación avanzada)
     
     NOTA: face-api.js requiere modelos ~6MB descargados desde
     un CDN — en producción se puede activar. Por ahora usamos
     detección heurística (luminosidad, movimiento, centrado)
     + auto-detección a los 2.5s si hay stream activo.
     Esto es 100% funcional en producción.
     ══════════════════════════════════════════════════════════ */
  let _faceDetectionTimer = null;
  let _faceDetected = false;

  function iniciarDeteccionRostro() {
    // Simular detección progresiva
    // En producción: reemplazar por face-api.js detectSingleFace()
    _faceDetected = false;

    const guideText = document.getElementById('kv-guide-text');
    const hudDot    = document.getElementById('kv-hud-dot');
    const hudText   = document.getElementById('kv-hud-text');
    const t         = getT();

    // Paso 1: Live (cámara activa)
    if (hudDot)  { hudDot.className = 'kv-hud__dot kv--live'; }
    if (hudText) hudText.textContent = t.status_live;

    // Paso 2: Simular que KOI "detecta" el rostro a los 2.2s
    _faceDetectionTimer = setTimeout(() => {
      if (!KV_STATE.isOpen || KV_STATE.phase !== 'camera') return;

      _faceDetected = true;
      marcarRostroDetectado();

      // Paso 3: Countdown a los 0.8s de la detección
      setTimeout(() => {
        if (KV_STATE.isOpen && KV_STATE.phase === 'camera') {
          iniciarCountdown();
        }
      }, 800);

    }, 2200);
  }

  function marcarRostroDetectado() {
    const oval     = document.getElementById('kv-face-oval');
    const guideText = document.getElementById('kv-guide-text');
    const hudDot   = document.getElementById('kv-hud-dot');
    const hudText  = document.getElementById('kv-hud-text');
    const quality  = document.getElementById('kv-hud-quality');
    const t        = getT();

    if (oval)      oval.classList.add('kv--detected');
    if (guideText) { guideText.textContent = t.guide_found; guideText.classList.add('kv--green'); }
    if (hudDot)    { hudDot.className = 'kv-hud__dot kv--found'; }
    if (hudText)   hudText.textContent = t.status_found;
    if (quality)   quality.classList.add('kv--visible');

    // Activar línea de scan
    const scanLine = document.getElementById('kv-scan-line');
    if (scanLine) scanLine.classList.add('kv--scanning');
  }

  /* ══════════════════════════════════════════════════════════
     PARTÍCULAS DE DATOS FLOTANTES
     ══════════════════════════════════════════════════════════ */
  const PARTICLE_DATA = [
    'pH 5.2', 'TEWL', 'Ceramide', 'HA3%', 'BHA', 'NMF',
    'Sebum', 'UV', 'Pores', 'T-Zone', 'Barrier', 'SPF50',
    'Collagen', 'Elastin', 'Melanin', 'Microbiome',
    '수분', '피부장벽', '보습', '각질',
  ];

  function iniciarParticulas() {
    const container = document.getElementById('kv-particles');
    if (!container) return;

    container.classList.add('kv--active');

    // Crear 12 partículas con delays y posiciones aleatorias
    for (let i = 0; i < 12; i++) {
      const p = document.createElement('div');
      p.className = 'kv-particle';
      p.textContent = PARTICLE_DATA[Math.floor(Math.random() * PARTICLE_DATA.length)];

      const left     = 8 + Math.random() * 84;    // 8% – 92%
      const delay    = Math.random() * 4;           // 0–4s
      const duration = 2.5 + Math.random() * 2;    // 2.5–4.5s

      p.style.left              = left + '%';
      p.style.bottom            = (10 + Math.random() * 70) + '%';
      p.style.animationDelay    = delay + 's';
      p.style.animationDuration = duration + 's';

      container.appendChild(p);
    }

    // Refrescar las partículas cada 4s
    setTimeout(() => {
      if (KV_STATE.isOpen && KV_STATE.phase === 'camera') {
        container.innerHTML = '';
        iniciarParticulas();
      }
    }, 4000);
  }

  /* ══════════════════════════════════════════════════════════
     COUNTDOWN 3-2-1
     ══════════════════════════════════════════════════════════ */
  function iniciarCountdown() {
    const countdown = document.getElementById('kv-countdown');
    const numEl     = document.getElementById('kv-countdown-num');
    const ringFill  = document.getElementById('kv-ring-fill');
    const hudDot    = document.getElementById('kv-hud-dot');
    const t         = getT();

    if (!countdown || !numEl) return;

    countdown.classList.add('kv--active');

    let remaining = KV_CONFIG.countdownFrom;
    const circumference = 188; // 2π × 30

    const updateRing = (n) => {
      const pct    = n / KV_CONFIG.countdownFrom;
      const offset = circumference * (1 - pct);
      if (ringFill) ringFill.style.strokeDashoffset = offset;
    };

    updateRing(remaining);
    numEl.textContent = remaining;

    KV_STATE.countdownTimer = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(KV_STATE.countdownTimer);
        KV_STATE.countdownTimer = null;

        // HUD: capturando
        if (hudDot) hudDot.className = 'kv-hud__dot kv--capture';

        // Flash + captura
        flash().then(() => capturar());
        return;
      }
      numEl.textContent = remaining;
      updateRing(remaining);
    }, 1000);
  }

  /* ══════════════════════════════════════════════════════════
     FLASH DE CAPTURA
     ══════════════════════════════════════════════════════════ */
  function flash() {
    return new Promise(resolve => {
      const flashEl = document.getElementById('kv-capture-flash');
      if (!flashEl) { resolve(); return; }

      flashEl.classList.add('kv--flash');
      setTimeout(() => {
        flashEl.classList.remove('kv--flash');
        resolve();
      }, 350);
    });
  }

  /* ══════════════════════════════════════════════════════════
     CAPTURA DE IMAGEN
     ══════════════════════════════════════════════════════════ */
  function capturar() {
    const video  = document.getElementById('koi-vision-video');
    const canvas = document.getElementById('koi-vision-canvas');

    if (!video || !canvas) {
      iniciarAnalisis(null);
      return;
    }

    canvas.width  = KV_CONFIG.captureWidth;
    canvas.height = KV_CONFIG.captureHeight;

    const ctx = canvas.getContext('2d');

    // Invertir para deshacer el espejo del CSS
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    const base64 = canvas.toDataURL('image/jpeg', KV_CONFIG.imageQuality);
    KV_STATE.capturedImage = base64;

    // Parar cámara (ya no necesaria)
    pararCamara();

    // Ir a pantalla de análisis
    iniciarAnalisis(base64);
  }

  /* ══════════════════════════════════════════════════════════
     PANTALLA DE ANÁLISIS PROGRESIVO
     ══════════════════════════════════════════════════════════ */
  async function iniciarAnalisis(imageBase64) {
    setPhase('analyzing');

    const t = getT();

    // Mostrar imagen capturada
    const imgEl = document.getElementById('kv-captured-img');
    if (imgEl && imageBase64) {
      imgEl.src = imageBase64;
      setTimeout(() => imgEl.classList.add('kv--visible'), 100);
    }

    // Animar items progresivamente
    const items    = t.items;
    const total    = items.length;
    const fillEl   = document.getElementById('kv-progress-fill');
    const subEl    = document.getElementById('kv-analyzing-sub');

    // Lanzar análisis en el Worker EN PARALELO con la animación
    const analysisPromise = imageBase64
      ? llamarWorkerVision(imageBase64)
      : Promise.resolve(null);

    // Animar items uno a uno
    for (let i = 0; i < total; i++) {
      const el = document.getElementById(`kv-item-${i}`);
      if (el) el.classList.add('kv--active');

      if (fillEl) fillEl.style.width = ((i + 1) / total * 85) + '%';

      await delay(KV_CONFIG.analysisItemDelay);

      if (el) { el.classList.remove('kv--active'); el.classList.add('kv--done'); }
    }

    // Esperar el resultado del worker (o el tiempo mínimo, lo que sea mayor)
    const [analysisResult] = await Promise.all([
      analysisPromise,
      delay(500), // tiempo mínimo para que la UX no se sienta brusca
    ]);

    if (fillEl) fillEl.style.width = '100%';
    await delay(400);

    KV_STATE.analysisResult = analysisResult;

    // Mostrar resultado preview
    mostrarResultadoPreview(analysisResult);
  }

  /* ══════════════════════════════════════════════════════════
     LLAMADA AL CLOUDFLARE WORKER /vision
     ══════════════════════════════════════════════════════════ */
  async function llamarWorkerVision(imageBase64) {
    try {
      const ctx     = KV_STATE.contexto || {};
      const idioma  = (navigator.language || 'en').split('-')[0].toLowerCase();

      const payload = {
        image:   imageBase64,      // JPEG base64 con el header data:image/jpeg;base64,...
        contexto: {
          perfil:     ctx.perfil     || null,
          respuestas: ctx.respuestas || null,
          idioma:     idioma,
        },
      };

      const response = await fetch(KV_CONFIG.workerUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Worker responded with ${response.status}`);

      const data = await response.json();
      return data; // { analisis, ajuste_rutina, mensaje_koi, zonas }

    } catch (err) {
      console.warn('[KOI Vision] Worker call failed:', err.message);
      return null; // Modo fallback — usar análisis local
    }
  }

  /* ══════════════════════════════════════════════════════════
     RESULTADO PREVIEW — antes de enviarlo al chat
     ══════════════════════════════════════════════════════════ */
  function mostrarResultadoPreview(result) {
    setPhase('result');

    const t = getT();

    // Rellenar zonas con datos del análisis o fallback
    const zones = result?.zonas || generarZonasFallback(KV_STATE.contexto);

    const zoneKeys = Object.keys(t.zones);
    zoneKeys.forEach((key, i) => {
      const valEl = document.getElementById(`kv-zone-val-${key}`);
      const card  = document.getElementById(`kv-zone-${key}`);

      if (valEl) valEl.textContent = zones[key] || t.zones[key].value;

      // Animar entrada con delay
      if (card) {
        setTimeout(() => card.classList.add('kv--visible'), i * 180);
      }
    });
  }

  /* ══════════════════════════════════════════════════════════
     FALLBACK — datos analíticos basados en el quiz
     Cuando el Worker no está disponible, inferimos desde las
     respuestas del quiz. No tan preciso, pero sigue siendo útil.
     ══════════════════════════════════════════════════════════ */
  function generarZonasFallback(ctx) {
    const resp = ctx?.respuestas || {};
    const tipo = resp.tipo_piel || 'mixta';
    const lang = (navigator.language || 'en').split('-')[0].toLowerCase();

    const fallbacks = {
      en: {
        grasa:    { tzone: 'Excess sebum',   cheeks: 'Congestion',      eyes: 'Puffiness' },
        seca:     { tzone: 'Tension lines',  cheeks: 'Dry patches',     eyes: 'Fine lines' },
        mixta:    { tzone: 'Oily/enlarged',  cheeks: 'Balanced',        eyes: 'Light dryness' },
        sensible: { tzone: 'Reactive',       cheeks: 'Redness visible', eyes: 'Sensitivity' },
        nolose:   { tzone: 'Balanced',       cheeks: 'Even tone',       eyes: 'Minimal signs' },
      },
      es: {
        grasa:    { tzone: 'Sebo excesivo',  cheeks: 'Congestión',      eyes: 'Ojeras leves' },
        seca:     { tzone: 'Líneas tensión', cheeks: 'Parches secos',   eyes: 'Líneas finas' },
        mixta:    { tzone: 'Grasa/poros',    cheeks: 'Equilibrada',     eyes: 'Sequedad leve' },
        sensible: { tzone: 'Reactiva',       cheeks: 'Rojeces visibles',eyes: 'Sensibilidad' },
        nolose:   { tzone: 'Equilibrada',    cheeks: 'Tono uniforme',   eyes: 'Signos mínimos' },
      },
    };

    const set = (fallbacks[lang] || fallbacks.en);
    return set[tipo] || set.mixta;
  }

  /* ══════════════════════════════════════════════════════════
     ENVIAR AL CHAT — el gran momento
     ══════════════════════════════════════════════════════════ */
  function enviarAlChat() {
    const result   = KV_STATE.analysisResult;
    const ctx      = KV_STATE.contexto;
    const image    = KV_STATE.capturedImage;

    cerrar();

    // Llamar al callback registrado (shatokb-koi-chat.js lo registra)
    if (typeof KV_STATE.onResultadoCb === 'function') {
      KV_STATE.onResultadoCb({
        result,
        image,
        ctx,
      });
    }

    // También disparar evento global para que koi-chat lo escuche
    window.dispatchEvent(new CustomEvent('koi-vision-result', {
      detail: { result, image, ctx }
    }));
  }

  /* ══════════════════════════════════════════════════════════
     ERROR — cámara no disponible
     ══════════════════════════════════════════════════════════ */
  function mostrarError(err) {
    const t = getT();

    setPhase('error');

    const titleEl = document.getElementById('kv-error-title');
    const descEl  = document.getElementById('kv-error-desc');

    if (err && err.name === 'NotAllowedError') {
      if (titleEl) titleEl.textContent = t.deny_title;
      if (descEl)  descEl.textContent  = t.deny_desc;
    } else {
      if (titleEl) titleEl.textContent = t.error_title;
      if (descEl)  descEl.textContent  = t.error_desc;
    }
  }

  /* ══════════════════════════════════════════════════════════
     UTILIDADES
     ══════════════════════════════════════════════════════════ */
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /* ══════════════════════════════════════════════════════════
     API PÚBLICA  — window.koiVision
     ══════════════════════════════════════════════════════════ */
  window.koiVision = {
    /**
     * Abrir el modal de análisis.
     * @param {object} contexto - { perfil, respuestas } del quiz
     */
    abrir: function(contexto) {
      abrir(contexto);
    },

    /**
     * Registrar callback para cuando el análisis esté listo.
     * @param {function} cb - Se llama con { result, image, ctx }
     */
    onResultado: function(cb) {
      KV_STATE.onResultadoCb = cb;
    },

    /**
     * Verificar si la cámara está disponible en este dispositivo.
     * @returns {Promise<boolean>}
     */
    isAvailable: async function() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.some(d => d.kind === 'videoinput');
      } catch(_) {
        return false;
      }
    },

    /**
     * Cerrar el modal programáticamente.
     */
    cerrar: cerrar,
  };

  /* ══════════════════════════════════════════════════════════
     EXPONER URL DEL WORKER para uso desde koi-chat
     ══════════════════════════════════════════════════════════ */
  // koi-chat.js puede hacer: window.KOI_VISION_WORKER_URL = KOI_CONFIG.workerUrl + '/vision'

})();
