/**
 * ============================================================
 * SHATOKB · KOI Vision — Facial Skin Analysis Module  v3.0
 * assets/shatokb-koi-vision.js
 *
 * v3.0 — Reescritura completa:
 *   • Óvalo SVG puro — siempre visible sobre el video
 *   • Botón de captura MANUAL — el usuario decide cuándo
 *   • Validación de luz en canvas antes de capturar
 *   • Feedback en tiempo real: OK / poca luz / mala posición
 *   • Sin face-api.js — sin simulaciones falsas
 *   • Sin overflow:hidden que tape el óvalo
 *
 * Flujo limpio:
 *   1. Chip "📸 Analiza mi piel" en el chat de KOI
 *   2. Modal: cámara activa + óvalo SVG siempre visible
 *   3. Feedback en tiempo real (luz, posición)
 *   4. Usuario hace click en "📸 Tomar foto ahora"
 *   5. Validación → si pasa → flash + captura
 *   6. Pantalla de análisis con progress clínico
 *   7. POST al Cloudflare Worker /vision
 *   8. GPT-4o Vision → análisis real de piel
 *   9. KOI presenta el resultado en el chat
 *
 * API pública: window.koiVision
 *   .abrir(contexto)      — abrir el modal
 *   .onResultado(cb)      — registrar callback
 *   .isAvailable()        — verificar cámara disponible
 *   .cerrar()             — cerrar programáticamente
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
    analysisItemDelay: 1800,   // ms por dimensión clínica
    minAnalysisTime:   3200,   // ms mínimo de análisis visual
    captureWidth:      640,
    captureHeight:     480,
    imageQuality:      0.85,   // JPEG calidad alta

    // Validación de luz — umbral de brillo medio del canvas (0-255)
    // Por debajo → advertencia. Por debajo de lowMin → no capturar.
    lightWarnThreshold: 55,    // advertencia amarilla
    lightMinThreshold:  28,    // bloqueo rojo

    // Frecuencia de análisis de luz (ms)
    lightCheckInterval: 800,
  };

  /* ══════════════════════════════════════════════════════════
     ESTADO
     ══════════════════════════════════════════════════════════ */
  const KV_STATE = {
    stream:         null,
    isOpen:         false,
    capturedImage:  null,
    analysisResult: null,
    phase:          'idle',   // idle | loading | camera | analyzing | result | error
    onResultadoCb:  null,
    contexto:       null,
    lightCheckTimer: null,
    lightLevel:     'unknown', // 'ok' | 'warn' | 'low' | 'unknown'
  };

  /* ══════════════════════════════════════════════════════════
     TEXTOS LOCALIZADOS
     ══════════════════════════════════════════════════════════ */
  const KV_I18N = {
    en: {
      title:           'KOI Skin Analysis',
      subtitle:        'AI · Real-Time',
      badge:           '📸 VISION',
      loading:         'Requesting camera access…',
      guide_position:  '👆 Center your face in the oval',
      guide_ok:        '✓ Perfect — tap the button when ready',
      guide_light_low: '💡 Find better lighting — move near a window',
      guide_light_warn:'⚡ A bit dark — more light will help',
      capture_btn:     '📸 Take photo now',
      capture_ready:   '📸 Perfect — take photo',
      capture_warn:    '💡 Improve lighting first',
      light_ok:        '☀️ Good light',
      light_warn:      '🌥️ Low light',
      light_low:       '🌑 Too dark',
      analysis_title:  'KOI is analyzing your skin',
      analysis_sub:    'Clinical analysis in progress',
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
      error_retry:          '🔄 Try again',
      zones: {
        tzone:   { emoji: '💦', label: 'T-Zone',    value: 'Analyzing…' },
        cheeks:  { emoji: '🌸', label: 'Cheeks',    value: 'Analyzing…' },
        eyes:    { emoji: '👁️', label: 'Eye Area',  value: 'Analyzing…' },
      },
    },
    es: {
      title:           'KOI Análisis Facial',
      subtitle:        'IA · Tiempo Real',
      badge:           '📸 VISIÓN',
      loading:         'Solicitando acceso a la cámara…',
      guide_position:  '👆 Centra tu rostro en el óvalo',
      guide_ok:        '✓ Perfecto — pulsa el botón cuando estés lista',
      guide_light_low: '💡 Busca más luz — acércate a una ventana',
      guide_light_warn:'⚡ Un poco oscuro — más luz te ayudará',
      capture_btn:     '📸 Tomar foto ahora',
      capture_ready:   '📸 Perfecto — tomar foto',
      capture_warn:    '💡 Mejora la iluminación primero',
      light_ok:        '☀️ Buena luz',
      light_warn:      '🌥️ Poca luz',
      light_low:       '🌑 Muy oscuro',
      analysis_title:  'KOI está analizando tu piel',
      analysis_sub:    'Análisis clínico en curso',
      items: [
        { icon: '💧', text: 'Hidratación',             dim: 'hidratacion'  },
        { icon: '🛡️', text: 'Barrera cutánea',         dim: 'barrera'      },
        { icon: '✨', text: 'Distribución sebácea',     dim: 'sebum'        },
        { icon: '🌗', text: 'Pigmentación y tono',      dim: 'pigmentacion' },
        { icon: '🔎', text: 'Textura y poros',          dim: 'textura'      },
        { icon: '❤️', text: 'Microcirculación',         dim: 'circulacion'  },
        { icon: '💪', text: 'Firmeza y elasticidad',    dim: 'firmeza'      },
        { icon: '🦠', text: 'Microbioma cutáneo',       dim: 'microbioma'   },
      ],
      result_title:    'Análisis completado ✓',
      result_cta:      '✨ Ver análisis completo en el chat →',
      privacy:         '🔒 Imagen procesada al instante. No se almacena.',
      error_title:     'Cámara no disponible',
      error_desc:      'Necesitamos permiso de cámara para analizar tu piel. Puedes continuar explorando tu rutina.',
      error_alt:       '✨ Continuar sin cámara',
      error_blocked_title: 'Cámara bloqueada por el navegador',
      error_blocked_desc:  'Tu navegador bloqueó el acceso a la cámara. Sigue estos pasos para permitirlo:',
      error_blocked_steps: [
        '🔒 Haz click en el ícono de <b>candado 🔒</b> en la barra de direcciones',
        '📷 Busca <b>Cámara</b> → cámbialo a <b>Permitir</b>',
        '🔄 Recarga la página y toca VISIÓN de nuevo',
      ],
      error_blocked_chrome: 'O en Chrome: <code>chrome://settings/content/camera</code>',
      error_notfound_title: 'No se encontró cámara',
      error_notfound_desc:  'No detectamos ninguna cámara en tu dispositivo. Puedes continuar explorando tu rutina.',
      error_retry:          '🔄 Reintentar',
      zones: {
        tzone:   { emoji: '💦', label: 'Zona T',         value: 'Analizando…' },
        cheeks:  { emoji: '🌸', label: 'Mejillas',        value: 'Analizando…' },
        eyes:    { emoji: '👁️', label: 'Contorno ojos',  value: 'Analizando…' },
      },
    },
    fr: {
      title:           'KOI Analyse Faciale',
      subtitle:        'IA · Temps Réel',
      badge:           '📸 VISION',
      loading:         'Demande d\'accès à la caméra…',
      guide_position:  '👆 Centrez votre visage dans l\'ovale',
      guide_ok:        '✓ Parfait — appuyez quand vous êtes prête',
      guide_light_low: '💡 Trouvez plus de lumière — approchez d\'une fenêtre',
      guide_light_warn:'⚡ Un peu sombre — plus de lumière aidera',
      capture_btn:     '📸 Prendre la photo maintenant',
      capture_ready:   '📸 Parfait — prendre la photo',
      capture_warn:    '💡 Améliorez l\'éclairage d\'abord',
      light_ok:        '☀️ Bonne lumière',
      light_warn:      '🌥️ Peu de lumière',
      light_low:       '🌑 Trop sombre',
      analysis_title:  'KOI analyse votre peau',
      analysis_sub:    'Analyse clinique en cours',
      items: [
        { icon: '💧', text: 'Niveaux d\'hydratation',    dim: 'hidratacion'  },
        { icon: '🛡️', text: 'Intégrité de la barrière', dim: 'barrera'      },
        { icon: '✨', text: 'Distribution sébacée',       dim: 'sebum'        },
        { icon: '🌗', text: 'Pigmentation et teint',      dim: 'pigmentacion' },
        { icon: '🔎', text: 'Texture et pores',           dim: 'textura'      },
        { icon: '❤️', text: 'Microcirculation',           dim: 'circulacion'  },
        { icon: '💪', text: 'Fermeté et élasticité',      dim: 'firmeza'      },
        { icon: '🦠', text: 'Équilibre du microbiome',    dim: 'microbioma'   },
      ],
      result_title:    'Analyse terminée ✓',
      result_cta:      '✨ Voir l\'analyse dans le chat →',
      privacy:         '🔒 Image traitée instantanément. Non stockée.',
      error_title:     'Caméra non disponible',
      error_desc:      'Nous avons besoin de l\'autorisation de la caméra pour analyser votre peau.',
      error_alt:       '✨ Continuer sans caméra',
      error_blocked_title: 'Caméra bloquée par le navigateur',
      error_blocked_desc:  'Votre navigateur a bloqué la caméra. Suivez ces étapes:',
      error_blocked_steps: [
        '🔒 Cliquez sur l\'icône de <b>cadenas 🔒</b> dans la barre d\'adresse',
        '📷 Trouvez <b>Caméra</b> → changez en <b>Autoriser</b>',
        '🔄 Rechargez la page et appuyez sur VISION',
      ],
      error_blocked_chrome: 'Ou dans Chrome: <code>chrome://settings/content/camera</code>',
      error_notfound_title: 'Aucune caméra trouvée',
      error_notfound_desc:  'Aucune caméra détectée sur votre appareil.',
      error_retry:          '🔄 Réessayer',
      zones: {
        tzone:   { emoji: '💦', label: 'Zone T',      value: 'Analyse…' },
        cheeks:  { emoji: '🌸', label: 'Joues',       value: 'Analyse…' },
        eyes:    { emoji: '👁️', label: 'Contour yeux', value: 'Analyse…' },
      },
    },
    pt: {
      title:           'KOI Análise Facial',
      subtitle:        'IA · Tempo Real',
      badge:           '📸 VISÃO',
      loading:         'Solicitando acesso à câmera…',
      guide_position:  '👆 Centralize seu rosto no oval',
      guide_ok:        '✓ Perfeito — toque no botão quando estiver pronta',
      guide_light_low: '💡 Procure mais luz — aproxime-se de uma janela',
      guide_light_warn:'⚡ Um pouco escuro — mais luz vai ajudar',
      capture_btn:     '📸 Tirar foto agora',
      capture_ready:   '📸 Perfeito — tirar foto',
      capture_warn:    '💡 Melhore a iluminação primeiro',
      light_ok:        '☀️ Boa luz',
      light_warn:      '🌥️ Pouca luz',
      light_low:       '🌑 Muito escuro',
      analysis_title:  'KOI está analisando sua pele',
      analysis_sub:    'Análise clínica em andamento',
      items: [
        { icon: '💧', text: 'Níveis de hidratação',     dim: 'hidratacion'  },
        { icon: '🛡️', text: 'Integridade da barreira',  dim: 'barrera'      },
        { icon: '✨', text: 'Distribuição sebácea',      dim: 'sebum'        },
        { icon: '🌗', text: 'Pigmentação e tom',         dim: 'pigmentacion' },
        { icon: '🔎', text: 'Textura e poros',           dim: 'textura'      },
        { icon: '❤️', text: 'Microcirculação',           dim: 'circulacion'  },
        { icon: '💪', text: 'Firmeza e elasticidade',    dim: 'firmeza'      },
        { icon: '🦠', text: 'Equilíbrio do microbioma',  dim: 'microbioma'   },
      ],
      result_title:    'Análise completa ✓',
      result_cta:      '✨ Ver análise completa no chat →',
      privacy:         '🔒 Imagem processada instantaneamente. Não armazenada.',
      error_title:     'Câmera não disponível',
      error_desc:      'Precisamos de permissão da câmera para analisar sua pele.',
      error_alt:       '✨ Continuar sem câmera',
      error_blocked_title: 'Câmera bloqueada pelo navegador',
      error_blocked_desc:  'Seu navegador bloqueou o acesso à câmera. Siga estes passos:',
      error_blocked_steps: [
        '🔒 Clique no ícone de <b>cadeado 🔒</b> na barra de endereços',
        '📷 Encontre <b>Câmera</b> → mude para <b>Permitir</b>',
        '🔄 Recarregue a página e toque em VISÃO novamente',
      ],
      error_blocked_chrome: 'Ou no Chrome: <code>chrome://settings/content/camera</code>',
      error_notfound_title: 'Nenhuma câmera encontrada',
      error_notfound_desc:  'Nenhuma câmera detectada no seu dispositivo.',
      error_retry:          '🔄 Tentar novamente',
      zones: {
        tzone:   { emoji: '💦', label: 'Zona T',        value: 'Analisando…' },
        cheeks:  { emoji: '🌸', label: 'Bochechas',      value: 'Analisando…' },
        eyes:    { emoji: '👁️', label: 'Área dos olhos', value: 'Analisando…' },
      },
    },
    de: {
      title:           'KOI Hautanalyse',
      subtitle:        'KI · Echtzeit',
      badge:           '📸 VISION',
      loading:         'Kamerazugriff wird angefordert…',
      guide_position:  '👆 Platziere dein Gesicht im Oval',
      guide_ok:        '✓ Perfekt — drücke den Button wenn du bereit bist',
      guide_light_low: '💡 Suche besseres Licht — gehe ans Fenster',
      guide_light_warn:'⚡ Etwas dunkel — mehr Licht hilft',
      capture_btn:     '📸 Foto jetzt aufnehmen',
      capture_ready:   '📸 Perfekt — Foto aufnehmen',
      capture_warn:    '💡 Erst Beleuchtung verbessern',
      light_ok:        '☀️ Gutes Licht',
      light_warn:      '🌥️ Wenig Licht',
      light_low:       '🌑 Zu dunkel',
      analysis_title:  'KOI analysiert deine Haut',
      analysis_sub:    'Klinische Analyse läuft',
      items: [
        { icon: '💧', text: 'Feuchtigkeitslevel',     dim: 'hidratacion'  },
        { icon: '🛡️', text: 'Hautbarriere',           dim: 'barrera'      },
        { icon: '✨', text: 'Talgverteilung',          dim: 'sebum'        },
        { icon: '🌗', text: 'Pigmentierung & Ton',     dim: 'pigmentacion' },
        { icon: '🔎', text: 'Textur & Poren',          dim: 'textura'      },
        { icon: '❤️', text: 'Mikrozirkulation',        dim: 'circulacion'  },
        { icon: '💪', text: 'Festigkeit & Elastizität',dim: 'firmeza'      },
        { icon: '🦠', text: 'Mikrobiom-Gleichgewicht', dim: 'microbioma'   },
      ],
      result_title:    'Analyse abgeschlossen ✓',
      result_cta:      '✨ Vollständige Analyse im Chat →',
      privacy:         '🔒 Bild sofort verarbeitet. Nicht gespeichert.',
      error_title:     'Kamera nicht verfügbar',
      error_desc:      'Wir benötigen Kameraberechtigungen zur Hautanalyse.',
      error_alt:       '✨ Ohne Kamera fortfahren',
      error_blocked_title: 'Kamera vom Browser gesperrt',
      error_blocked_desc:  'Dein Browser hat den Kamerazugriff blockiert. Folge diesen Schritten:',
      error_blocked_steps: [
        '🔒 Klicke auf das <b>Schloss-Symbol 🔒</b> in der Adressleiste',
        '📷 Finde <b>Kamera</b> → ändere auf <b>Zulassen</b>',
        '🔄 Lade die Seite neu und tippe wieder auf VISION',
      ],
      error_blocked_chrome: 'Oder in Chrome: <code>chrome://settings/content/camera</code>',
      error_notfound_title: 'Keine Kamera gefunden',
      error_notfound_desc:  'Kein Kameragerät auf deinem Gerät erkannt.',
      error_retry:          '🔄 Erneut versuchen',
      zones: {
        tzone:   { emoji: '💦', label: 'T-Zone',   value: 'Analysiert…' },
        cheeks:  { emoji: '🌸', label: 'Wangen',   value: 'Analysiert…' },
        eyes:    { emoji: '👁️', label: 'Augenpartie', value: 'Analysiert…' },
      },
    },
    it: {
      title:           'KOI Analisi Facciale',
      subtitle:        'IA · Tempo Reale',
      badge:           '📸 VISIONE',
      loading:         'Richiesta accesso alla fotocamera…',
      guide_position:  '👆 Centra il tuo viso nell\'ovale',
      guide_ok:        '✓ Perfetto — premi il pulsante quando sei pronta',
      guide_light_low: '💡 Trova più luce — avvicinati a una finestra',
      guide_light_warn:'⚡ Un po\' buio — più luce aiuterà',
      capture_btn:     '📸 Scatta foto ora',
      capture_ready:   '📸 Perfetto — scatta foto',
      capture_warn:    '💡 Migliora prima l\'illuminazione',
      light_ok:        '☀️ Buona luce',
      light_warn:      '🌥️ Poca luce',
      light_low:       '🌑 Troppo buio',
      analysis_title:  'KOI sta analizzando la tua pelle',
      analysis_sub:    'Analisi clinica in corso',
      items: [
        { icon: '💧', text: 'Livelli di idratazione',   dim: 'hidratacion'  },
        { icon: '🛡️', text: 'Integrità della barriera', dim: 'barrera'      },
        { icon: '✨', text: 'Distribuzione sebacea',     dim: 'sebum'        },
        { icon: '🌗', text: 'Pigmentazione e tono',      dim: 'pigmentacion' },
        { icon: '🔎', text: 'Texture e pori',            dim: 'textura'      },
        { icon: '❤️', text: 'Microcircolazione',         dim: 'circulacion'  },
        { icon: '💪', text: 'Tonicità ed elasticità',    dim: 'firmeza'      },
        { icon: '🦠', text: 'Equilibrio del microbioma', dim: 'microbioma'   },
      ],
      result_title:    'Analisi completata ✓',
      result_cta:      '✨ Vedi analisi completa nella chat →',
      privacy:         '🔒 Immagine elaborata istantaneamente. Non conservata.',
      error_title:     'Fotocamera non disponibile',
      error_desc:      'Abbiamo bisogno del permesso della fotocamera per analizzare la tua pelle.',
      error_alt:       '✨ Continua senza fotocamera',
      zones: {
        tzone:   { emoji: '💦', label: 'Zona T',     value: 'Analisi…' },
        cheeks:  { emoji: '🌸', label: 'Guance',     value: 'Analisi…' },
        eyes:    { emoji: '👁️', label: 'Contorno occhi', value: 'Analisi…' },
      },
    },
  };

  function getT() {
    const lang = (navigator.language || 'en').split('-')[0].toLowerCase();
    return KV_I18N[lang] || KV_I18N.en;
  }

  /* ══════════════════════════════════════════════════════════
     CONSTRUCCIÓN DEL DOM
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
          <div style="display:flex;align-items:center;gap:8px;">
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

          <!-- Video de la cámara -->
          <video id="koi-vision-video" autoplay playsinline muted></video>
          <canvas id="koi-vision-canvas" style="display:none;"></canvas>

          <!-- Viñeta ambiental -->
          <div class="kv-vignette"></div>

          <!-- ══ ÓVALO SVG — siempre visible, no depende de z-index sobre video ══ -->
          <svg class="kv-oval-svg" id="kv-oval-svg"
               viewBox="0 0 400 300"
               preserveAspectRatio="xMidYMid meet"
               xmlns="http://www.w3.org/2000/svg">

            <!-- Arco dashed exterior giratorio -->
            <ellipse class="kv-oval-arc"
              cx="200" cy="150" rx="100" ry="128"/>

            <!-- Óvalo principal — siempre visible en rosa -->
            <ellipse class="kv-oval-ellipse" id="kv-oval-ellipse"
              cx="200" cy="150" rx="90" ry="118"/>

            <!-- 4 puntos en los extremos del óvalo -->
            <circle class="kv-oval-dot" cx="200" cy="32"  r="3"/>
            <circle class="kv-oval-dot" cx="290" cy="150" r="3"/>
            <circle class="kv-oval-dot" cx="200" cy="268" r="3"/>
            <circle class="kv-oval-dot" cx="110" cy="150" r="3"/>
          </svg>

          <!-- Texto guía -->
          <div class="kv-guide-text" id="kv-guide-text">${t.guide_position}</div>

          <!-- HUD: estado cámara -->
          <div class="kv-hud">
            <div class="kv-hud__status">
              <div class="kv-hud__dot kv--live" id="kv-hud-dot"></div>
              <span id="kv-hud-text">LIVE</span>
            </div>
          </div>

          <!-- HUD: indicador de luz — esquina superior derecha -->
          <div class="kv-hud__light" id="kv-light-indicator">
            <span class="kv-hud__light-icon">☀️</span>
            <span id="kv-light-label">${t.light_ok}</span>
          </div>

          <!-- Flash de captura -->
          <div class="kv-capture-flash" id="kv-capture-flash"></div>

          <!-- ══ BOTÓN DE CAPTURA MANUAL ══ -->
          <div class="kv-capture-btn-wrap">
            <button class="kv-capture-btn" id="kv-capture-btn" type="button">
              <span class="kv-capture-btn__icon">📸</span>
              <span class="kv-capture-btn__label" id="kv-capture-btn-label">${t.capture_btn}</span>
            </button>
          </div>

        </div>

        <!-- ─── PANTALLA DE ANÁLISIS ─── -->
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
                <div class="kv-scan-data__chip kv-scan-data__chip--tl">SCAN</div>
                <div class="kv-scan-data__chip kv-scan-data__chip--br" id="kv-scan-pct">0%</div>
              </div>
              <div class="kv-photo-corner kv-photo-corner--tl"></div>
              <div class="kv-photo-corner kv-photo-corner--tr"></div>
              <div class="kv-photo-corner kv-photo-corner--bl"></div>
              <div class="kv-photo-corner kv-photo-corner--br"></div>
            </div>

            <div class="kv-analyzing-info">
              <div class="kv-analysis-progress">
                <div class="kv-analysis-header">
                  <span class="kv-analysis-progress__label">${t.analysis_title}</span>
                  <span class="kv-analysis-pct" id="kv-analysis-pct-label">0%</span>
                </div>
                <div class="kv-progress-track">
                  <div class="kv-progress-fill" id="kv-progress-fill"></div>
                </div>
                <div class="kv-analysis-progress__sub">${t.analysis_sub}</div>
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
          <span class="kv-error-state__icon" id="kv-error-icon">📷</span>
          <div class="kv-error-state__title" id="kv-error-title">${t.error_title}</div>
          <p class="kv-error-state__desc" id="kv-error-desc">${t.error_desc}</p>

          <!-- Pasos para desbloquear — solo visibles en NotAllowedError -->
          <ol class="kv-error-steps" id="kv-error-steps" style="display:none;">
          </ol>
          <p class="kv-error-chrome-tip" id="kv-error-chrome" style="display:none;"></p>

          <!-- Botón reintentar — solo visible en NotAllowedError -->
          <button class="kv-error-retry-btn" id="kv-error-retry" type="button" style="display:none;">
            🔄 Reintentar
          </button>

          <div class="kv-error-alt-btn" id="kv-error-alt" role="button" tabindex="0">${t.error_alt}</div>
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

    // Cerrar clickando el backdrop
    const modal = document.getElementById('koi-vision-modal');
    if (modal) {
      modal.addEventListener('click', e => {
        if (e.target === modal) cerrar();
      }, true);
    }

    // Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && KV_STATE.isOpen) cerrar();
    });

    // Botón alternativo (sin cámara)
    const altBtn = document.getElementById('kv-error-alt');
    if (altBtn) {
      altBtn.addEventListener('click', () => {
        cerrar();
        if (typeof window.koiVisionAlternativo === 'function') {
          window.koiVisionAlternativo();
        }
      }, true);
    }

    // Botón reintentar — vuelve a pedir permisos
    const retryBtn = document.getElementById('kv-error-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', async () => {
        retryBtn.disabled = true;
        retryBtn.textContent = '⏳ …';
        setPhase('loading');
        await iniciarCamara();
      }, true);
    }

    // CTA del resultado → enviar al chat
    const ctaBtn = document.getElementById('kv-result-cta');
    if (ctaBtn) {
      ctaBtn.addEventListener('click', enviarAlChat, true);
      ctaBtn.addEventListener('keydown', e => { if (e.key === 'Enter') enviarAlChat(); });
    }

    // ══ BOTÓN DE CAPTURA MANUAL ══
    const captureBtn = document.getElementById('kv-capture-btn');
    if (captureBtn) {
      captureBtn.addEventListener('click', intentarCaptura, true);
    }
  }

  /* ══════════════════════════════════════════════════════════
     GESTIÓN DE FASES
     ══════════════════════════════════════════════════════════ */
  function setPhase(phase) {
    KV_STATE.phase = phase;

    const sections = [
      'kv-loading-state',
      'kv-viewfinder',
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
    KV_STATE.lightLevel     = 'unknown';

    buildModal();

    const modal = document.getElementById('koi-vision-modal');
    if (!modal) return;

    // Prevenir scroll
    document.body.style.overflow = 'hidden';

    // Mostrar modal con animación
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

    // Parar análisis de luz
    detenerAnalisisLuz();

    // Parar cámara
    pararCamara();

    // Ocultar modal
    const modal = document.getElementById('koi-vision-modal');
    if (modal) {
      modal.classList.remove('kv--active');
      setTimeout(() => {
        if (modal.parentNode) modal.parentNode.removeChild(modal);
      }, 500);
    }

    // Restaurar scroll
    document.body.style.overflow = '';
  }

  /* ══════════════════════════════════════════════════════════
     CÁMARA
     ══════════════════════════════════════════════════════════ */
  async function iniciarCamara() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width:      { ideal: 1280 },
          height:     { ideal: 960 },
        },
        audio: false,
      });

      KV_STATE.stream = stream;

      const video = document.getElementById('koi-vision-video');
      if (!video) return;

      video.srcObject = stream;
      await video.play().catch(() => {});

      setPhase('camera');
      iniciarAnalisisLuz();

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
     ANÁLISIS DE LUZ EN TIEMPO REAL
     Lee el brillo del canvas cada 800ms y actualiza la UI.
     Esto es 100% real — no simulado.
     ══════════════════════════════════════════════════════════ */
  function iniciarAnalisisLuz() {
    detenerAnalisisLuz(); // Limpiar cualquier timer previo
    actualizarEstadoLuz(); // Primera lectura inmediata
    KV_STATE.lightCheckTimer = setInterval(actualizarEstadoLuz, KV_CONFIG.lightCheckInterval);
  }

  function detenerAnalisisLuz() {
    if (KV_STATE.lightCheckTimer) {
      clearInterval(KV_STATE.lightCheckTimer);
      KV_STATE.lightCheckTimer = null;
    }
  }

  function medirBrillo() {
    const video  = document.getElementById('koi-vision-video');
    const canvas = document.getElementById('koi-vision-canvas');
    if (!video || !canvas || !KV_STATE.stream) return null;

    // Captura pequeña (80×60) para medir brillo sin sobrecargar
    canvas.width  = 80;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');

    try {
      ctx.drawImage(video, 0, 0, 80, 60);
      const data = ctx.getImageData(0, 0, 80, 60).data;

      let sum = 0;
      const pixelCount = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        // Luminancia percibida: 0.299R + 0.587G + 0.114B
        sum += (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      }
      return sum / pixelCount; // 0-255
    } catch (_) {
      return null;
    }
  }

  function actualizarEstadoLuz() {
    if (KV_STATE.phase !== 'camera') return;

    const t = getT();
    const brillo = medirBrillo();

    const lightEl     = document.getElementById('kv-light-indicator');
    const lightLabel  = document.getElementById('kv-light-label');
    const captureBtn  = document.getElementById('kv-capture-btn');
    const captureLbl  = document.getElementById('kv-capture-btn-label');
    const guideText   = document.getElementById('kv-guide-text');
    const ovalSvg     = document.getElementById('kv-oval-svg');

    if (brillo === null) return; // Video aún no listo

    let newLevel;
    if (brillo >= KV_CONFIG.lightWarnThreshold) {
      newLevel = 'ok';
    } else if (brillo >= KV_CONFIG.lightMinThreshold) {
      newLevel = 'warn';
    } else {
      newLevel = 'low';
    }

    if (newLevel === KV_STATE.lightLevel) return; // Sin cambios
    KV_STATE.lightLevel = newLevel;

    // ── Actualizar indicador de luz ──
    if (lightEl) {
      lightEl.className = 'kv-hud__light';
      if (newLevel === 'ok')   lightEl.classList.add('kv--light-ok');
      if (newLevel === 'warn') lightEl.classList.add('kv--light-low');
      if (newLevel === 'low')  lightEl.classList.add('kv--light-low');
    }
    if (lightLabel) {
      lightLabel.textContent = newLevel === 'ok'   ? t.light_ok
                             : newLevel === 'warn'  ? t.light_warn
                             :                       t.light_low;
    }

    // ── Actualizar botón de captura ──
    if (captureBtn && captureLbl) {
      captureBtn.className = 'kv-capture-btn';
      captureBtn.disabled  = false;

      if (newLevel === 'ok') {
        captureBtn.classList.add('kv--ready');
        captureLbl.textContent = t.capture_ready;
      } else if (newLevel === 'warn') {
        captureBtn.classList.add('kv--warn');
        captureLbl.textContent = t.capture_warn;
      } else {
        captureBtn.classList.add('kv--warn');
        captureLbl.textContent = t.capture_warn;
        captureBtn.disabled = true; // Demasiado oscuro — bloquear
      }
    }

    // ── Actualizar texto guía ──
    if (guideText) {
      guideText.className = 'kv-guide-text';
      if (newLevel === 'ok') {
        guideText.textContent = t.guide_ok;
        guideText.classList.add('kv--ok');
      } else if (newLevel === 'warn') {
        guideText.textContent = t.guide_light_warn;
        guideText.classList.add('kv--warn');
      } else {
        guideText.textContent = t.guide_light_low;
        guideText.classList.add('kv--warn');
      }
    }

    // ── Actualizar estado del óvalo SVG ──
    if (ovalSvg) {
      ovalSvg.className = 'kv-oval-svg';
      if (newLevel === 'ok')   ovalSvg.classList.add('kv--ok');
      if (newLevel === 'warn') ovalSvg.classList.add('kv--warn');
    }
  }

  /* ══════════════════════════════════════════════════════════
     INTENTO DE CAPTURA — validar antes de disparar
     ══════════════════════════════════════════════════════════ */
  function intentarCaptura() {
    if (KV_STATE.phase !== 'camera') return;

    const brillo = medirBrillo();

    // Bloquear si está demasiado oscuro
    if (brillo !== null && brillo < KV_CONFIG.lightMinThreshold) {
      // Vibrar el botón para indicar que no se puede
      const btn = document.getElementById('kv-capture-btn');
      if (btn) {
        btn.style.animation = 'none';
        btn.style.transform = 'translateX(-4px)';
        setTimeout(() => { btn.style.transform = 'translateX(4px)'; }, 80);
        setTimeout(() => { btn.style.transform = 'translateX(0)';   }, 160);
        setTimeout(() => { btn.style.animation = ''; }, 240);
      }
      return;
    }

    // Todo OK — capturar
    capturar();
  }

  /* ══════════════════════════════════════════════════════════
     FLASH + CAPTURA
     ══════════════════════════════════════════════════════════ */
  function capturar() {
    // Deshabilitar botón inmediatamente
    const btn = document.getElementById('kv-capture-btn');
    if (btn) btn.disabled = true;

    // Parar análisis de luz
    detenerAnalisisLuz();

    // Flash
    const flashEl = document.getElementById('kv-capture-flash');
    if (flashEl) {
      flashEl.classList.add('kv--flash');
      setTimeout(() => flashEl.classList.remove('kv--flash'), 450);
    }

    // Pequeña pausa post-flash para naturalidad
    setTimeout(() => {
      tomarFoto();
    }, 150);
  }

  function tomarFoto() {
    const video  = document.getElementById('koi-vision-video');
    const canvas = document.getElementById('koi-vision-canvas');

    if (!video || !canvas) {
      iniciarAnalisis(null);
      return;
    }

    // Captura a resolución completa
    canvas.width  = KV_CONFIG.captureWidth;
    canvas.height = KV_CONFIG.captureHeight;

    const ctx = canvas.getContext('2d');

    // Deshacer espejo del video para enviar foto correcta al Worker
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    const base64 = canvas.toDataURL('image/jpeg', KV_CONFIG.imageQuality);
    KV_STATE.capturedImage = base64;

    // Parar cámara — ya no la necesitamos
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

    // Mostrar imagen con saturación progresiva
    const imgEl = document.getElementById('kv-captured-img');
    if (imgEl && imageBase64) {
      imgEl.src = imageBase64;
      setTimeout(() => {
        imgEl.classList.add('kv--visible');
        let sat = 0;
        const saturateTimer = setInterval(() => {
          sat = Math.min(sat + 5, 100);
          imgEl.style.filter = `saturate(${sat}%) brightness(${0.50 + (sat / 100) * 0.50})`;
          if (sat >= 100) clearInterval(saturateTimer);
        }, 40);
      }, 200);
    }

    // Beam scanner
    const beamEl = document.getElementById('kv-scan-beam');
    if (beamEl) setTimeout(() => beamEl.classList.add('kv--active'), 500);

    // Puntos biométricos con stagger
    const bioPts = document.querySelectorAll('.kv-bio-pt');
    bioPts.forEach((pt, i) => {
      setTimeout(() => pt.classList.add('kv--visible'), 700 + i * 200);
    });

    // Elementos de progreso
    const fillEl   = document.getElementById('kv-progress-fill');
    const pctLabel = document.getElementById('kv-analysis-pct-label');
    const scanPct  = document.getElementById('kv-scan-pct');
    const items    = t.items;
    const total    = items.length;

    function setProgress(pct) {
      if (fillEl)   fillEl.style.width       = pct + '%';
      if (pctLabel) pctLabel.textContent     = Math.round(pct) + '%';
      if (scanPct)  scanPct.textContent      = Math.round(pct) + '%';
    }

    // Llamar al Worker EN PARALELO con la animación
    const analysisPromise = imageBase64
      ? llamarWorkerVision(imageBase64)
      : Promise.resolve(null);

    // Animar las 8 dimensiones clínicas
    for (let i = 0; i < total; i++) {
      const el = document.getElementById(`kv-item-${i}`);
      if (el) el.classList.add('kv--active');

      const pctStart = (i / total) * 85;
      const pctEnd   = ((i + 1) / total) * 85;
      setProgress(pctStart);

      // Avance gradual dentro del delay del item
      const steps     = 8;
      const stepDelay = KV_CONFIG.analysisItemDelay / steps;
      for (let s = 1; s <= steps; s++) {
        await delay(stepDelay);
        setProgress(pctStart + (pctEnd - pctStart) * (s / steps));
      }

      if (el) { el.classList.remove('kv--active'); el.classList.add('kv--done'); }
    }

    // Esperar resultado del Worker
    const [analysisResult] = await Promise.all([
      analysisPromise,
      delay(300),
    ]);

    // Completar al 100%
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
     LLAMADA AL CLOUDFLARE WORKER /vision
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
     RESULTADO PREVIEW
     ══════════════════════════════════════════════════════════ */
  function mostrarResultadoPreview(result) {
    setPhase('result');

    const t = getT();

    // Zonas con datos reales o fallback basado en el quiz
    const zones = result?.zonas || generarZonasFallback(KV_STATE.contexto);

    Object.keys(t.zones).forEach((key, i) => {
      const valEl = document.getElementById(`kv-zone-val-${key}`);
      const card  = document.getElementById(`kv-zone-${key}`);

      if (valEl) valEl.textContent = zones[key] || t.zones[key].value;
      if (card)  setTimeout(() => card.classList.add('kv--visible'), i * 200);
    });
  }

  /* ══════════════════════════════════════════════════════════
     FALLBACK DE ZONAS — basado en respuestas del quiz
     Solo se usa si el Worker no devuelve datos de zonas.
     ══════════════════════════════════════════════════════════ */
  function generarZonasFallback(ctx) {
    const resp = ctx?.respuestas || {};
    const tipo = resp.tipo_piel || 'mixta';
    const lang = (navigator.language || 'en').split('-')[0].toLowerCase();

    const fallbacks = {
      en: {
        grasa:    { tzone: 'Excess sebum visible',  cheeks: 'Congestion',       eyes: 'Slight puffiness' },
        seca:     { tzone: 'Tension lines',         cheeks: 'Dry patches',      eyes: 'Fine lines' },
        mixta:    { tzone: 'Oily, enlarged pores',  cheeks: 'Balanced',         eyes: 'Light dryness' },
        sensible: { tzone: 'Reactive zone',         cheeks: 'Visible redness',  eyes: 'Sensitivity' },
        nolose:   { tzone: 'Balanced',              cheeks: 'Even tone',        eyes: 'Minimal signs' },
      },
      es: {
        grasa:    { tzone: 'Sebo excesivo',         cheeks: 'Congestión leve',  eyes: 'Ojeras leves' },
        seca:     { tzone: 'Líneas de tensión',     cheeks: 'Parches secos',    eyes: 'Líneas finas' },
        mixta:    { tzone: 'Poros dilatados',       cheeks: 'Equilibrada',      eyes: 'Sequedad leve' },
        sensible: { tzone: 'Zona reactiva',         cheeks: 'Rojeces visibles', eyes: 'Sensibilidad' },
        nolose:   { tzone: 'Equilibrada',           cheeks: 'Tono uniforme',    eyes: 'Signos mínimos' },
      },
    };

    const set = (fallbacks[lang] || fallbacks.en);
    return set[tipo] || set.mixta;
  }

  /* ══════════════════════════════════════════════════════════
     ENVIAR RESULTADO AL CHAT
     ══════════════════════════════════════════════════════════ */
  function enviarAlChat() {
    const result = KV_STATE.analysisResult;
    const image  = KV_STATE.capturedImage;
    const ctx    = KV_STATE.contexto;

    cerrar();

    // Callback registrado por koi-chat.js
    if (typeof KV_STATE.onResultadoCb === 'function') {
      KV_STATE.onResultadoCb({ result, image, ctx });
    }

    // Evento global como alternativa
    window.dispatchEvent(new CustomEvent('koi-vision-result', {
      detail: { result, image, ctx }
    }));
  }

  /* ══════════════════════════════════════════════════════════
     ERROR — cámara no disponible
     Distingue 3 casos:
       NotAllowedError  → permiso bloqueado (muestra pasos + reintentar)
       NotFoundError    → no hay cámara físicamente
       Otros            → error genérico
     ══════════════════════════════════════════════════════════ */
  function mostrarError(err) {
    const t = getT();
    setPhase('error');

    const iconEl   = document.getElementById('kv-error-icon');
    const titleEl  = document.getElementById('kv-error-title');
    const descEl   = document.getElementById('kv-error-desc');
    const stepsEl  = document.getElementById('kv-error-steps');
    const chromeEl = document.getElementById('kv-error-chrome');
    const retryBtn = document.getElementById('kv-error-retry');

    const errName = err ? err.name : '';

    // ── Caso 1: Permiso bloqueado ──────────────────────────────
    if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
      if (iconEl)  iconEl.textContent      = '🔒';
      if (titleEl) titleEl.textContent     = t.error_blocked_title || t.error_title;
      if (descEl)  descEl.textContent      = t.error_blocked_desc  || t.error_desc;

      // Mostrar pasos numerados
      if (stepsEl && t.error_blocked_steps) {
        stepsEl.innerHTML = t.error_blocked_steps
          .map(step => `<li>${step}</li>`)
          .join('');
        stepsEl.style.display = 'block';
      }

      // Mostrar tip de Chrome
      if (chromeEl && t.error_blocked_chrome) {
        chromeEl.innerHTML     = t.error_blocked_chrome;
        chromeEl.style.display = 'block';
      }

      // Mostrar botón reintentar
      if (retryBtn) {
        retryBtn.textContent    = t.error_retry || '🔄 Reintentar';
        retryBtn.style.display  = 'block';
        retryBtn.disabled       = false;
      }

    // ── Caso 2: No hay cámara física ──────────────────────────
    } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
      if (iconEl)  iconEl.textContent  = '📵';
      if (titleEl) titleEl.textContent = t.error_notfound_title || t.error_title;
      if (descEl)  descEl.textContent  = t.error_notfound_desc  || t.error_desc;

    // ── Caso 3: Error genérico (NotReadableError, etc.) ───────
    } else {
      if (iconEl)  iconEl.textContent  = '📷';
      if (titleEl) titleEl.textContent = t.error_title;
      if (descEl)  descEl.textContent  = t.error_desc;

      // Reintentar disponible igualmente por si es un error transitorio
      if (retryBtn) {
        retryBtn.textContent   = t.error_retry || '🔄 Reintentar';
        retryBtn.style.display = 'block';
        retryBtn.disabled      = false;
      }
    }

    console.warn('[KOI Vision] Error type:', errName, '| message:', err?.message);
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
    abrir: function(contexto) { abrir(contexto); },

    onResultado: function(cb) { KV_STATE.onResultadoCb = cb; },

    isAvailable: async function() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.some(d => d.kind === 'videoinput');
      } catch(_) { return false; }
    },

    cerrar: cerrar,
  };

})();
