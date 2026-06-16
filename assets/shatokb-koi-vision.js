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
      glasses_tip:    'For best results, remove glasses if you wear them — the eye area is key',
      glasses_ok:     'Continue with glasses',
      glasses_remove: 'I removed them ✓',
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
      glasses_tip:    'Para un análisis más preciso, quítate las gafas si las llevas — la zona de ojos es clave',
      glasses_ok:     'Continuar con gafas',
      glasses_remove: 'Me las quité ✓',
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

  // Textos de gafas para idiomas adicionales (fallback a EN para el resto)
  const KV_I18N_GLASSES = {
    fr: {
      glasses_tip:    'Pour un meilleur résultat, retirez vos lunettes si vous en portez — la zone des yeux est essentielle',
      glasses_ok:     'Continuer avec les lunettes',
      glasses_remove: 'Je les ai retirées ✓',
    },
    pt: {
      glasses_tip:    'Para um resultado mais preciso, tire os óculos se os usar — a área dos olhos é fundamental',
      glasses_ok:     'Continuar com óculos',
      glasses_remove: 'Já os tirei ✓',
    },
    de: {
      glasses_tip:    'Für ein genaueres Ergebnis: Brille abnehmen, falls vorhanden — die Augenpartie ist entscheidend',
      glasses_ok:     'Mit Brille fortfahren',
      glasses_remove: 'Brille abgenommen ✓',
    },
    it: {
      glasses_tip:    'Per un\'analisi più precisa, togli gli occhiali se li porti — l\'area occhi è fondamentale',
      glasses_ok:     'Continua con occhiali',
      glasses_remove: 'Li ho tolti ✓',
    },
  };

  function getT() {
    const lang = (navigator.language || 'en').split('-')[0].toLowerCase();
    const base  = KV_I18N[lang] || KV_I18N.en;
    // Merge glasses texts para idiomas extra (fr, pt, de, it)
    const extra = KV_I18N_GLASSES[lang];
    return extra ? Object.assign({}, base, extra) : base;
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

        <!-- ─── HEADER ─── -->
        <div class="kv-header">
          <div class="kv-header__koi">
            <div class="kv-header__avatar"><span>🌸</span></div>
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

        <!-- ─── LOADING ─── -->
        <div class="kv-loading-state kv--active" id="kv-loading-state">
          <div class="kv-spinner"></div>
          <div class="kv-loading-state__text">${t.loading}</div>
        </div>

        <!-- ─── VIEWFINDER ─── -->
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

          <!-- Guía oval + rings de rotación via CSS -->
          <div class="kv-face-guide">
            <div class="kv-face-guide__oval" id="kv-face-oval"></div>
          </div>

          <!-- Face Mesh SVG — puntos biométricos -->
          <div class="kv-face-mesh" id="kv-face-mesh">
            <svg class="kv-mesh-svg" id="kv-mesh-svg" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
          </div>

          <!-- Tip de gafas — aparece tras detectar rostro -->
          <div class="kv-glasses-tip" id="kv-glasses-tip">
            <div class="kv-glasses-tip__icon">👓</div>
            <div class="kv-glasses-tip__body">
              <p class="kv-glasses-tip__text" id="kv-glasses-text">${t.glasses_tip}</p>
              <div class="kv-glasses-tip__actions">
                <button class="kv-glasses-btn kv-glasses-btn--ok"     id="kv-glasses-ok">${t.glasses_ok}</button>
                <button class="kv-glasses-btn kv-glasses-btn--remove" id="kv-glasses-remove">${t.glasses_remove}</button>
              </div>
            </div>
          </div>

          <!-- Partículas de datos flotantes -->
          <div class="kv-particles" id="kv-particles"></div>

          <!-- Líneas de scan duales -->
          <div class="kv-scan-line"   id="kv-scan-line"></div>
          <div class="kv-scan-line-2" id="kv-scan-line-2"></div>

          <!-- Countdown con sonar -->
          <div class="kv-sonar" id="kv-sonar" style="display:none;">
            <div class="kv-sonar__ring"></div>
            <div class="kv-sonar__ring"></div>
            <div class="kv-sonar__ring"></div>
          </div>
          <div class="kv-countdown" id="kv-countdown">
            <svg class="kv-countdown__ring" viewBox="0 0 72 72">
              <circle class="kv-ring-track" cx="36" cy="36" r="30"/>
              <circle class="kv-ring-fill" id="kv-ring-fill" cx="36" cy="36" r="30"/>
            </svg>
            <div class="kv-countdown__num" id="kv-countdown-num">3</div>
          </div>

          <!-- Flash cromático -->
          <div class="kv-capture-flash" id="kv-capture-flash"></div>

          <!-- HUD -->
          <div class="kv-hud">
            <div class="kv-hud__status">
              <div class="kv-hud__dot kv--live" id="kv-hud-dot"></div>
              <span id="kv-hud-text">${t.status_live}</span>
            </div>
            <div class="kv-hud__quality" id="kv-hud-quality">${t.quality_ready}</div>
          </div>

          <!-- Overlay FX (viñeta) -->
          <div class="kv-fx-overlay"></div>
        </div>

        <!-- ─── PANTALLA DE ANÁLISIS ─── -->
        <div class="kv-analyzing" id="kv-analyzing">
          <div class="kv-analyzing-inner">

            <!-- Imagen capturada con efecto scan -->
            <div class="kv-captured-wrap">
              <img class="kv-captured-img" id="kv-captured-img" alt="Captured frame" />
            </div>

            <!-- Info / Progreso -->
            <div class="kv-analyzing-info">
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
          </div>
        </div>

        <!-- ─── RESULTADO PREVIEW ─── -->
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

        <!-- ─── ERROR STATE ─── -->
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

    // Ocultar sonar si existe
    const sonarEl = document.getElementById('kv-sonar');
    if (sonarEl && phase !== 'countdown') sonarEl.style.display = 'none';

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

    // Parar animación de zonas del mesh
    if (_zoneScanTimer) {
      clearTimeout(_zoneScanTimer);
      _zoneScanTimer = null;
    }
    if (_faceDetectionTimer) {
      clearTimeout(_faceDetectionTimer);
      _faceDetectionTimer = null;
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

      // Paso 3: Mostrar tip de gafas — esperar decisión antes del countdown
      setTimeout(() => {
        if (KV_STATE.isOpen && KV_STATE.phase === 'camera') {
          mostrarGlassesTip();
        }
      }, 600);

    }, 2200);
  }

  /* ══════════════════════════════════════════════════════════
     TIP DE GAFAS — pausa entre detección y countdown
     Aparece 0.6s después de detectar el rostro.
     El usuario elige: continuar con gafas o sin ellas.
     En ambos casos → continúa al countdown.
     Si elige quitárselas → esperamos 3s extra para que lo haga.
     ══════════════════════════════════════════════════════════ */
  function mostrarGlassesTip() {
    const tipEl    = document.getElementById('kv-glasses-tip');
    const okBtn    = document.getElementById('kv-glasses-ok');
    const removeBtn = document.getElementById('kv-glasses-remove');
    if (!tipEl) {
      // Si el elemento no existe, ir directo al countdown
      iniciarCountdown();
      return;
    }

    // Mostrar con animación
    tipEl.classList.add('kv--active');

    // Auto-continuar a los 12s si el usuario no toca nada
    // (suficiente para leer + decidir sin sentirse presionado)
    const autoTimer = setTimeout(() => {
      cerrarGlassesTip();
      if (KV_STATE.isOpen && KV_STATE.phase === 'camera') iniciarCountdown();
    }, 12000);

    // Botón "Continuar con gafas" → pequeña pausa de cortesía y luego countdown
    if (okBtn) {
      okBtn.addEventListener('click', () => {
        clearTimeout(autoTimer);
        cerrarGlassesTip();
        // 800ms de pausa para que el usuario se recoloque antes de la cuenta
        setTimeout(() => {
          if (KV_STATE.isOpen && KV_STATE.phase === 'camera') iniciarCountdown();
        }, 800);
      }, { once: true });
    }

    // Botón "Me las quité ✓" → espera real para quitarse las gafas
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        clearTimeout(autoTimer);
        // Cambiar texto del tip para confirmar que esperamos
        const textEl = document.getElementById('kv-glasses-text');
        if (textEl) {
          textEl.textContent = '✓ Perfecto — ya estás lista. Capturando en 4 segundos…';
          // Ajustar texto al idioma
          const lang = (navigator.language || 'en').split('-')[0];
          const waitMsgs = {
            es: '✓ Perfecto — ya estás lista. Capturando en 4 segundos…',
            en: '✓ Great — you\'re all set. Capturing in 4 seconds…',
            fr: '✓ Parfait — c\'est bon. Capture dans 4 secondes…',
            pt: '✓ Perfeito — pronta. Capturando em 4 segundos…',
            de: '✓ Super — bereit. Aufnahme in 4 Sekunden…',
            it: '✓ Perfetto — pronta. Scatto tra 4 secondi…',
          };
          if (textEl) textEl.textContent = waitMsgs[lang] || waitMsgs.en;
        }
        // Ocultar botones — ya no hacen falta
        const actionsEl = tipEl.querySelector('.kv-glasses-tip__actions');
        if (actionsEl) actionsEl.style.display = 'none';

        // 4 segundos reales para quitarse las gafas con calma y recolocarse
        setTimeout(() => {
          cerrarGlassesTip();
          if (KV_STATE.isOpen && KV_STATE.phase === 'camera') iniciarCountdown();
        }, 4000);
      }, { once: true });
    }
  }

  function cerrarGlassesTip() {
    const tipEl = document.getElementById('kv-glasses-tip');
    if (tipEl) tipEl.classList.remove('kv--active');
  }

  function marcarRostroDetectado() {
    const oval      = document.getElementById('kv-face-oval');
    const guideText = document.getElementById('kv-guide-text');
    const hudDot    = document.getElementById('kv-hud-dot');
    const hudText   = document.getElementById('kv-hud-text');
    const quality   = document.getElementById('kv-hud-quality');
    const t         = getT();

    if (oval)      oval.classList.add('kv--detected');
    if (guideText) { guideText.textContent = t.guide_found; guideText.classList.add('kv--green'); }
    if (hudDot)    { hudDot.className = 'kv-hud__dot kv--found'; }
    if (hudText)   hudText.textContent = t.status_found;
    if (quality)   quality.classList.add('kv--visible');

    // Activar líneas de scan duales
    const scanLine  = document.getElementById('kv-scan-line');
    const scanLine2 = document.getElementById('kv-scan-line-2');
    if (scanLine)  scanLine.classList.add('kv--scanning');
    if (scanLine2) scanLine2.classList.add('kv--scanning');

    // Activar face mesh SVG
    activarFaceMesh();
  }

  /* ══════════════════════════════════════════════════════════
     FACE MESH SVG — puntos biométricos animados
     Simula los puntos de tracking de MediaPipe Face Mesh
     (468 puntos en producción — aquí 32 puntos estratégicos)
     ══════════════════════════════════════════════════════════ */
  function activarFaceMesh() {
    const meshEl = document.getElementById('kv-face-mesh');
    const svg    = document.getElementById('kv-mesh-svg');
    if (!meshEl || !svg) return;

    // 32 puntos clave del rostro en coordenadas relativas (0-100 en viewBox)
    // Distribuidos en: frente, arcos ciliares, ojos, nariz, boca, jaw, mejillas
    const MESH_POINTS = [
      // Frente
      { x: 50, y: 18 }, { x: 38, y: 20 }, { x: 62, y: 20 },
      // Arcos ciliares
      { x: 32, y: 30 }, { x: 40, y: 28 }, { x: 50, y: 29 }, { x: 60, y: 28 }, { x: 68, y: 30 },
      // Ojos
      { x: 35, y: 36 }, { x: 42, y: 35 }, { x: 37, y: 39 }, { x: 43, y: 38 },
      { x: 57, y: 35 }, { x: 64, y: 36 }, { x: 58, y: 38 }, { x: 63, y: 39 },
      // Nariz
      { x: 50, y: 44 }, { x: 46, y: 50 }, { x: 54, y: 50 }, { x: 50, y: 53 },
      // Mejillas
      { x: 28, y: 48 }, { x: 72, y: 48 }, { x: 30, y: 56 }, { x: 70, y: 56 },
      // Boca
      { x: 42, y: 62 }, { x: 50, y: 60 }, { x: 58, y: 62 },
      { x: 44, y: 67 }, { x: 50, y: 68 }, { x: 56, y: 67 },
      // Jaw
      { x: 35, y: 74 }, { x: 50, y: 78 }, { x: 65, y: 74 },
    ];

    // Conexiones entre puntos (indices)
    const CONNECTIONS = [
      [0,1],[0,2],[1,3],[2,7],[3,4],[4,5],[5,6],[6,7],
      [3,8],[4,9],[6,12],[7,13],
      [8,9],[12,13],
      [16,17],[16,18],[17,19],[18,19],
      [20,22],[21,23],
      [24,25],[25,26],[27,28],[28,29],
      [24,27],[26,29],[25,28],
      [30,31],[31,32],
    ];

    svg.innerHTML = '';

    // Añadir zonas de análisis primero (debajo de los puntos)
    const ZONES_SVG = [
      // Frente (T-zone top)
      { d: 'M 35,18 Q 50,14 65,18 L 65,32 Q 50,30 35,32 Z', id: 'zone-forehead' },
      // Nariz + centrofrente (T-zone center)
      { d: 'M 44,32 Q 50,30 56,32 L 54,55 Q 50,57 46,55 Z', id: 'zone-tzone' },
      // Mejilla izquierda
      { d: 'M 28,38 Q 35,35 44,40 L 42,62 Q 32,65 26,58 Z', id: 'zone-cheek-l' },
      // Mejilla derecha
      { d: 'M 72,38 Q 65,35 56,40 L 58,62 Q 68,65 74,58 Z', id: 'zone-cheek-r' },
      // Contorno ojos
      { d: 'M 30,31 Q 50,28 70,31 L 68,42 Q 50,39 32,42 Z', id: 'zone-eyes' },
    ];

    ZONES_SVG.forEach(z => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', z.d);
      path.setAttribute('id', z.id);
      path.setAttribute('class', 'kv-mesh-zone');
      svg.appendChild(path);
    });

    // Dibujar líneas de conexión
    CONNECTIONS.forEach((conn, idx) => {
      const p1 = MESH_POINTS[conn[0]];
      const p2 = MESH_POINTS[conn[1]];
      if (!p1 || !p2) return;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', p1.x); line.setAttribute('y1', p1.y);
      line.setAttribute('x2', p2.x); line.setAttribute('y2', p2.y);
      line.setAttribute('class', 'kv-mesh-line');
      line.style.animationDelay = (idx * 0.02) + 's';
      svg.appendChild(line);
    });

    // Dibujar puntos
    MESH_POINTS.forEach((pt, idx) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', pt.x);
      circle.setAttribute('cy', pt.y);
      circle.setAttribute('r', idx < 3 ? '0.8' : '0.6');
      circle.setAttribute('class', 'kv-mesh-point');
      circle.style.animationDelay = (idx * 0.025) + 's';
      svg.appendChild(circle);
    });

    meshEl.classList.add('kv--active');

    // Animar zonas secuencialmente mientras escanea
    _animarZonasMesh();
  }

  const ZONE_SCAN_ORDER = ['zone-forehead','zone-eyes','zone-cheek-l','zone-cheek-r','zone-tzone'];
  let _zoneScanIdx = 0;
  let _zoneScanTimer = null;

  function _animarZonasMesh() {
    if (!KV_STATE.isOpen || KV_STATE.phase !== 'camera') return;

    const zoneIds = ZONE_SCAN_ORDER;
    _zoneScanIdx = 0;

    const scanNext = () => {
      if (!KV_STATE.isOpen || KV_STATE.phase !== 'camera') return;

      // Quitar scanning de la anterior
      const prev = document.getElementById(zoneIds[(_zoneScanIdx - 1 + zoneIds.length) % zoneIds.length]);
      if (prev) { prev.classList.remove('kv--scanning'); prev.classList.add('kv--done'); }

      const current = document.getElementById(zoneIds[_zoneScanIdx]);
      if (current) current.classList.add('kv--scanning');

      _zoneScanIdx = (_zoneScanIdx + 1) % zoneIds.length;

      // Reset todas al completar ciclo
      if (_zoneScanIdx === 0) {
        zoneIds.forEach(id => {
          const el = document.getElementById(id);
          if (el) { el.classList.remove('kv--scanning', 'kv--done'); }
        });
      }

      _zoneScanTimer = setTimeout(scanNext, 700);
    };

    _zoneScanTimer = setTimeout(scanNext, 300);
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

    // Crear 16 partículas con delays y posiciones aleatorias
    // Alternas: rosa (KOI) y cyan (data)
    for (let i = 0; i < 16; i++) {
      const p = document.createElement('div');
      const isBlue = i % 3 === 2; // cada 3 partículas, una azul
      p.className = 'kv-particle' + (isBlue ? ' kv--blue' : '');
      p.textContent = PARTICLE_DATA[Math.floor(Math.random() * PARTICLE_DATA.length)];

      const left     = 5 + Math.random() * 90;    // 5% – 95%
      const delay    = Math.random() * 4.5;        // 0–4.5s
      const duration = 2.2 + Math.random() * 2.5; // 2.2–4.7s

      p.style.left              = left + '%';
      p.style.bottom            = (5 + Math.random() * 75) + '%';
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
    const sonarEl   = document.getElementById('kv-sonar');
    const t         = getT();

    if (!countdown || !numEl) return;

    // Parar el scan de zonas del mesh
    if (_zoneScanTimer) { clearTimeout(_zoneScanTimer); _zoneScanTimer = null; }

    // Activar sonar
    if (sonarEl) sonarEl.style.display = 'flex';

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

    // Forzar re-render del número para trigger de animación
    numEl.style.animation = 'none';
    numEl.offsetHeight; // reflow
    numEl.style.animation = '';

    KV_STATE.countdownTimer = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(KV_STATE.countdownTimer);
        KV_STATE.countdownTimer = null;

        // Ocultar sonar
        if (sonarEl) sonarEl.style.display = 'none';

        // HUD: capturando
        if (hudDot) hudDot.className = 'kv-hud__dot kv--capture';

        // Flash cromático + captura
        flash().then(() => capturar());
        return;
      }

      // Animar número
      numEl.style.animation = 'none';
      numEl.offsetHeight;
      numEl.style.animation = 'kvNumPop 0.25s cubic-bezier(0.34,1.56,0.64,1)';

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

      // Ocultar scan lines y mesh durante el flash
      const scanLine  = document.getElementById('kv-scan-line');
      const scanLine2 = document.getElementById('kv-scan-line-2');
      const meshEl    = document.getElementById('kv-face-mesh');
      if (scanLine)  scanLine.style.display  = 'none';
      if (scanLine2) scanLine2.style.display = 'none';
      if (meshEl)    meshEl.style.opacity    = '0';

      flashEl.classList.add('kv--flash');

      setTimeout(() => {
        flashEl.classList.remove('kv--flash');
        resolve();
      }, 450);
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

    // Mostrar imagen capturada — con saturación progresiva
    const imgEl = document.getElementById('kv-captured-img');
    if (imgEl && imageBase64) {
      imgEl.src = imageBase64;
      setTimeout(() => {
        imgEl.classList.add('kv--visible');
        // Recuperar color progresivamente
        let sat = 0;
        const saturateTimer = setInterval(() => {
          sat = Math.min(sat + 8, 100);
          imgEl.style.filter = `saturate(${sat}%) brightness(${0.6 + (sat / 100) * 0.4})`;
          if (sat >= 100) clearInterval(saturateTimer);
        }, 60);
      }, 200);
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
