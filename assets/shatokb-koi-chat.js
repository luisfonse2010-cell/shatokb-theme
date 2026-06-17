/**
 * ============================================================
 * SHATOKB · KOI — Experta K-Beauty con IA
 * Archivo: assets/shatokb-koi-chat.js
 * Version: 2.0 — "The Reveal" flow: blur → insight → email gate → reveal
 *
 * Arquitectura:
 *   - Este archivo corre en el browser (Shopify)
 *   - Las llamadas a OpenAI van a través del Cloudflare Worker
 *     (nunca directamente — la API key es privada)
 *   - El contexto del quiz se inyecta automáticamente
 *     desde window.SHATOKB_RESULTADO (shatokb-quiz.js)
 * ============================================================
 */

(function () {
  'use strict';

  /* ── Configuración ──────────────────────────────────────── */
  const KOI_CONFIG = {
    // Cloudflare Worker URL — secured proxy to OpenAI
    workerUrl:  'https://koi-proxy.luisfonse2010.workers.dev/chat',
    reportUrl:  'https://koi-proxy.luisfonse2010.workers.dev/report',

    // URL base del sitio (para construir el link del reporte)
    siteUrl:    'https://shatokb.com',

    // URL de la tabla API (para guardar el reporte)
    // ⚠️ Reemplazar con la URL real de la tabla API del proyecto
    tableApiUrl: window.location.origin,

    // Límite de mensajes en el historial (memoria de conversación)
    maxHistory: 20,

    // Delay antes de que KOI aparezca (ms)
    appearDelay: 1800,

    // Delay antes del primer mensaje de KOI (ms)
    firstMsgDelay: 600,
  };

  /* ── Estado global de KOI ───────────────────────────────── */
  const KOI_STATE = {
    historial:      [],     // [{role, content}]
    contexto:       null,   // perfil del quiz
    isTyping:       false,  // KOI está escribiendo
    isReady:        false,  // chat inicializado
    msgCount:       0,      // contador de mensajes enviados
    // ── The Reveal ──
    revealPhase:    'insight', // 'insight' | 'email' | 'revealed'
    emailCaptured:  '',     // email capturado en el chat
  };

  /* ── Chips localizados por idioma ───────────────────────── */
  const KOI_CHIPS_I18N = {
    en: {
      // ── The Reveal: bifurcación inicial ──
      reveal:      ['📸 Analyze my skin first', '✨ Reveal my routine'],
      // ── Post-cámara: después del mensaje persuasivo ──
      post_camara: ['📸 Yes, analyze my face', '✨ Show me my routine'],
      // ── Post-visión: después del análisis facial, solo reveal ──
      post_vision: ['✨ Show me my routine now'],
      // ── Post-reveal: explorar rutina ──
      bienvenida:  ['Walk me through my routine', 'Why these specific products?', 'Explain the key ingredients', 'How long until I see results?'],
      post_rutina: ['What order do I apply them?', 'AM vs PM — what changes?', 'Are any of these pregnancy-safe?', 'Which one should I start with?'],
      objeciones:  ['Which product matters most?', "I've never tried K-Beauty", 'Can I combine these ingredients?', 'I have a different question'],
    },
    es: {
      reveal:      ['📸 Analiza mi piel primero', '✨ Descubre mi rutina'],
      post_camara: ['📸 Sí, analiza mi rostro', '✨ Ver mi rutina ya'],
      post_vision: ['✨ Muéstrame mi rutina ahora'],
      bienvenida:  ['Explícame mi rutina paso a paso', '¿Por qué estos productos?', 'Explícame los ingredientes clave', '¿Cuánto tiempo hasta ver resultados?'],
      post_rutina: ['¿En qué orden los aplico?', 'AM vs PM — ¿qué cambia?', '¿Son seguros en el embarazo?', '¿Con cuál empiezo?'],
      objeciones:  ['¿Cuál es el producto más importante?', 'Nunca he probado K-Beauty', '¿Puedo combinar estos ingredientes?', 'Tengo otra pregunta'],
    },
    fr: {
      reveal:      ['📸 Analyser ma peau d\'abord', '✨ Révéler ma routine'],
      post_camara: ['📸 Oui, analyser mon visage', '✨ Voir ma routine'],
      post_vision: ['✨ Montrez-moi ma routine maintenant'],
      bienvenida:  ['Expliquez-moi ma routine', 'Pourquoi ces produits ?', 'Expliquez les ingrédients clés', 'Combien de temps pour voir les résultats ?'],
      post_rutina: ['Dans quel ordre les appliquer ?', 'Matin vs soir — qu\'est-ce qui change ?', 'Sont-ils sûrs pendant la grossesse ?', 'Par lequel commencer ?'],
      objeciones:  ['Quel produit est le plus important ?', "Je n'ai jamais essayé la K-Beauty", 'Puis-je combiner ces ingrédients ?', "J'ai une autre question"],
    },
    pt: {
      reveal:      ['📸 Analisar minha pele primeiro', '✨ Revelar minha rotina'],
      post_camara: ['📸 Sim, analise meu rosto', '✨ Ver minha rotina agora'],
      post_vision: ['✨ Mostre-me minha rotina agora'],
      bienvenida:  ['Explique minha rotina passo a passo', 'Por que esses produtos?', 'Explique os ingredientes principais', 'Quanto tempo para ver resultados?'],
      post_rutina: ['Em que ordem aplicar?', 'AM vs PM — o que muda?', 'São seguros na gravidez?', 'Com qual devo começar?'],
      objeciones:  ['Qual produto é mais importante?', 'Nunca experimentei K-Beauty', 'Posso combinar esses ingredientes?', 'Tenho outra pergunta'],
    },
    de: {
      reveal:      ['📸 Zuerst meine Haut analysieren', '✨ Meine Routine enthüllen'],
      post_camara: ['📸 Ja, analysiere mein Gesicht', '✨ Routine jetzt anzeigen'],
      post_vision: ['✨ Zeig mir meine Routine jetzt'],
      bienvenida:  ['Erkläre mir meine Routine', 'Warum genau diese Produkte?', 'Erkläre die wichtigsten Inhaltsstoffe', 'Wann sehe ich erste Ergebnisse?'],
      post_rutina: ['In welcher Reihenfolge auftragen?', 'Morgen vs. Abend — was ändert sich?', 'Sind sie in der Schwangerschaft sicher?', 'Mit welchem soll ich anfangen?'],
      objeciones:  ['Welches Produkt ist am wichtigsten?', 'Ich habe K-Beauty noch nie ausprobiert', 'Kann ich diese Inhaltsstoffe kombinieren?', 'Ich habe eine andere Frage'],
    },
    it: {
      reveal:      ['📸 Analizza prima la mia pelle', '✨ Rivela la mia routine'],
      post_camara: ['📸 Sì, analizza il mio viso', '✨ Mostrami la mia routine'],
      post_vision: ['✨ Mostrami la mia routine adesso'],
      bienvenida:  ['Spiegami la mia routine', 'Perché questi prodotti?', 'Spiegami gli ingredienti chiave', 'Quanto tempo per vedere i risultati?'],
      post_rutina: ['In che ordine applicarli?', 'Mattina vs sera — cosa cambia?', 'Sono sicuri in gravidanza?', 'Da quale inizio?'],
      objeciones:  ['Qual è il prodotto più importante?', 'Non ho mai provato la K-Beauty', 'Posso combinare questi ingredienti?', 'Ho un\'altra domanda'],
    },
  };

  /* ── Chips de respuesta rápida por situación (con i18n) ─── */
  const KOI_CHIPS = {
    bienvenida:  [],
    post_rutina: [],
    objeciones:  [],
  };

  /* ══════════════════════════════════════════════════════════
     INICIALIZACIÓN
     ══════════════════════════════════════════════════════════ */

  /**
   * Punto de entrada principal.
   * Llamado desde shatokb-quiz.js cuando se muestra el resultado.
   */
  window.shatokbIniciarKOI = function (contextoQuiz) {
    // Guard anti-duplicación: bloquea cualquier segunda llamada
    // (el quiz dispara CustomEvent + intentarKOI en paralelo).
    // Se activa AQUÍ, inmediatamente, antes de cualquier setTimeout.
    if (KOI_STATE.isReady) return;
    KOI_STATE.isReady = true; // ← marcar YA, no esperar al setTimeout

    // Guardar contexto del quiz
    KOI_STATE.contexto = contextoQuiz || obtenerContextoLocal();

    // Crear y montar el DOM del chat
    const wrapper = crearDOM();
    if (!wrapper) return;

    // Animar entrada después del delay
    setTimeout(() => {
      wrapper.classList.add('koi--visible');

      // Primer mensaje proactivo de KOI
      setTimeout(() => {
        enviarMensajeKOI_proactivo();
      }, KOI_CONFIG.firstMsgDelay);
    }, KOI_CONFIG.appearDelay);
  };

  /* ── Obtener contexto del localStorage como fallback ────── */
  /* ── Guardar historial en localStorage para KOI Cart ── */
  function guardarHistorialLocal () {
    try {
      // Guardar solo los últimos 20 mensajes para no sobrecargar
      const slice = KOI_STATE.historial.slice(-20);
      localStorage.setItem('shatokb_historial', JSON.stringify(slice));
    } catch(_) {}
  }

  function obtenerContextoLocal () {
    try {
      const raw = localStorage.getItem('shatokb_resultado');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  /* ══════════════════════════════════════════════════════════
     CONSTRUCCIÓN DEL DOM
     ══════════════════════════════════════════════════════════ */
  function crearDOM () {
    // Buscar el contenedor del resultado del quiz
    const resultado = document.querySelector('.shatokb-resultado__inner')
                   || document.querySelector('.shatokb-resultado')
                   || document.querySelector('#shatokb-resultado');

    if (!resultado) {
      console.warn('[KOI] Could not find the quiz result container.');
      return null;
    }

    // Evitar duplicados
    if (document.getElementById('shatokb-koi-wrapper')) return null;

    const wrapper = document.createElement('div');
    wrapper.id = 'shatokb-koi-wrapper';
    // Textos de UI localizados
    const idioma = detectarIdioma();
    const uiText = {
      es: { status: 'En línea · Especialista K-Beauty',    placeholder: 'Pregúntale algo a KOI...',     footer: '🔒 KOI ofrece orientación cosmética experta, no asesoramiento médico. Para condiciones dermatológicas diagnosticadas, consulta a un dermatólogo.' },
      en: { status: 'Online · Senior K-Beauty Specialist', placeholder: 'Ask KOI anything...',          footer: '🔒 KOI provides expert cosmetic guidance — not medical advice. For diagnosed skin conditions, consult a dermatologist.' },
      fr: { status: 'En ligne · Spécialiste K-Beauty',     placeholder: 'Posez une question à KOI...', footer: '🔒 KOI fournit des conseils cosmétiques experts — pas des avis médicaux. Pour des conditions dermatologiques, consultez un dermatologue.' },
      pt: { status: 'Online · Especialista K-Beauty',      placeholder: 'Pergunte algo à KOI...',      footer: '🔒 KOI oferece orientação cosmética especializada — não conselho médico. Para condições dermatológicas, consulte um dermatologista.' },
      de: { status: 'Online · K-Beauty-Spezialistin',      placeholder: 'Frage KOI etwas...',          footer: '🔒 KOI bietet kosmetische Fachberatung — keine medizinischen Ratschläge. Bei Hauterkrankungen einen Dermatologen aufsuchen.' },
      it: { status: 'Online · Specialista K-Beauty',       placeholder: 'Chiedi qualcosa a KOI...',    footer: '🔒 KOI fornisce consulenza cosmetica esperta — non consigli medici. Per condizioni dermatologiche, consulta un dermatologo.' },
    };
    const ui = uiText[idioma] || uiText['en'];

    wrapper.innerHTML = `
      <div class="koi-panel">

        <!-- Header -->
        <div class="koi-header">
          <div class="koi-header__avatar">🌸</div>
          <div class="koi-header__info">
            <div class="koi-header__name">
              KOI
              <span class="koi-header__status">
                <span class="koi-status-dot"></span>
                ${ui.status}
              </span>
            </div>
          </div>
          <div class="koi-header__badge">AI · shatokb</div>
        </div>

        <!-- Mensajes -->
        <div class="koi-messages" id="koi-messages"></div>

        <!-- Chips de respuesta rápida -->
        <div class="koi-chips" id="koi-chips"></div>

        <!-- Input -->
        <div class="koi-input-area">
          <textarea
            class="koi-input"
            id="koi-input"
            placeholder="${ui.placeholder}"
            rows="1"
            maxlength="500"
          ></textarea>
          <button class="koi-send-btn" id="koi-send-btn" title="Send">
            ➤
          </button>
        </div>

        <!-- Footer -->
        <div class="koi-footer">
          <p>${ui.footer}</p>
        </div>

      </div>
    `;

    // Insertar después del resultado
    resultado.appendChild(wrapper);

    // Vincular eventos
    vincularEventos();

    return wrapper;
  }

  /* ══════════════════════════════════════════════════════════
     EVENTOS
     ══════════════════════════════════════════════════════════ */
  function vincularEventos () {
    const input   = document.getElementById('koi-input');
    const sendBtn = document.getElementById('koi-send-btn');

    if (!input || !sendBtn) return;

    // Enviar con Enter (Shift+Enter = nueva línea)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarMensajeUsuario();
      }
    });

    // Auto-resize del textarea
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });

    // Botón enviar
    sendBtn.addEventListener('click', enviarMensajeUsuario);
  }

  /* ══════════════════════════════════════════════════════════
     CHIPS DE RESPUESTA RÁPIDA
     ══════════════════════════════════════════════════════════ */
  function mostrarChips (tipo) {
    const container = document.getElementById('koi-chips');
    if (!container) return;

    // Chips localizados según el idioma detectado del navegador
    const idioma     = detectarIdioma();
    const setIdioma  = KOI_CHIPS_I18N[idioma] || KOI_CHIPS_I18N['en'];
    const chips      = setIdioma[tipo] || setIdioma.bienvenida;
    container.innerHTML = '';

    chips.forEach(texto => {
      const btn = document.createElement('button');
      btn.className = 'koi-chip';
      btn.textContent = texto;
      btn.addEventListener('click', () => {
        container.innerHTML = '';
        enviarDesdeChip(texto);
      });
      container.appendChild(btn);
    });
  }

  function ocultarChips () {
    const container = document.getElementById('koi-chips');
    if (container) container.innerHTML = '';
  }

  /* ══════════════════════════════════════════════════════════
     RENDERIZADO DE MENSAJES
     ══════════════════════════════════════════════════════════ */

  /**
   * Añade un mensaje al chat.
   * @param {string} rol - 'koi' | 'user'
   * @param {string} texto - contenido del mensaje
   * @param {boolean} esWelcome - aplica estilo de bienvenida
   * @returns {HTMLElement} - el elemento burbuja para streaming
   */
  function agregarMensaje (rol, texto, esWelcome = false) {
    const container = document.getElementById('koi-messages');
    if (!container) return null;

    const msg = document.createElement('div');
    msg.className = `koi-msg koi-msg--${rol}${esWelcome ? ' koi-msg--welcome' : ''}`;

    const avatarEmoji = rol === 'koi' ? '🌸' : '👤';
    const hora = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit'
    });

    msg.innerHTML = `
      <div class="koi-msg__avatar">${avatarEmoji}</div>
      <div class="koi-msg__bubble">
        <p class="koi-msg__text"></p>
        <span class="koi-msg__time">${hora}</span>
      </div>
    `;

    container.appendChild(msg);

    // Escribir texto (con efecto si es KOI, directo si es usuario)
    const textEl = msg.querySelector('.koi-msg__text');
    if (rol === 'user') {
      textEl.textContent = texto;
    } else {
      // El texto se llenará con streaming o efecto de escritura
      textEl.textContent = '';
    }

    scrollAlFinal();
    return textEl;
  }

  /**
   * Muestra el indicador de "escribiendo..."
   */
  function mostrarTyping () {
    const container = document.getElementById('koi-messages');
    if (!container || KOI_STATE.isTyping) return;

    KOI_STATE.isTyping = true;

    const typing = document.createElement('div');
    typing.className = 'koi-typing';
    typing.id = 'koi-typing-indicator';
    typing.innerHTML = `
      <div class="koi-msg__avatar">🌸</div>
      <div class="koi-typing__bubble">
        <span class="koi-typing__dot"></span>
        <span class="koi-typing__dot"></span>
        <span class="koi-typing__dot"></span>
      </div>
    `;

    container.appendChild(typing);
    scrollAlFinal();
  }

  function ocultarTyping () {
    const typing = document.getElementById('koi-typing-indicator');
    if (typing) typing.remove();
    KOI_STATE.isTyping = false;
  }

  function scrollAlFinal () {
    const container = document.getElementById('koi-messages');
    if (container) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 50);
    }
  }

  /* ══════════════════════════════════════════════════════════
     DETECTAR IDIOMA DEL NAVEGADOR
     Devuelve el idioma primario (ej: "es", "en", "fr", "pt")
     ══════════════════════════════════════════════════════════ */
  function detectarIdioma () {
    const lang = (navigator.language || navigator.userLanguage || 'en').split('-')[0].toLowerCase();
    const soportados = ['es','en','fr','pt','de','it','ko','ja','zh','ar','nl','pl','ru'];
    return soportados.includes(lang) ? lang : 'en';
  }

  /* ══════════════════════════════════════════════════════════
     THE REVEAL — MENSAJE DE APERTURA
     KOI aparece ANTES de los productos con un insight
     poderoso y específico al perfil. No saluda — entra
     directo. Luego ofrece los dos chips de bifurcación.
     ══════════════════════════════════════════════════════════ */
  async function enviarMensajeKOI_proactivo () {
    const ctx          = KOI_STATE.contexto;
    const perfilId     = ctx?.perfil?.id     || '';
    const perfilNombre = ctx?.perfil?.nombre || 'your skin profile';
    const idioma       = detectarIdioma();

    const nombreIdioma = {
      es: 'Spanish', en: 'English', fr: 'French', pt: 'Portuguese',
      de: 'German',  it: 'Italian', ko: 'Korean', ja: 'Japanese',
      zh: 'Chinese', ar: 'Arabic', nl: 'Dutch',  pl: 'Polish', ru: 'Russian'
    }[idioma] || 'English';

    // ── Insights fallback por perfil de piel ─────────────────
    // Uno por perfil — específicos, no genéricos. Si el Worker
    // falla, estos garantizan que la experiencia sea poderosa.
    const insightsFallback = {
      es: {
        grasa:        `Revisé tus respuestas. Tu perfil es **${perfilNombre}**.\n\nHay algo que la industria hace mal con tu tipo de piel constantemente: sobre-limpiar. La mayoría cree que necesita eliminar todo el sebo — y ese error es exactamente lo que hace que la piel produzca *más* grasa como respuesta.\n\nTu rutina está diseñada para romper ese ciclo. Tengo algo más que mostrarte antes de dártela.`,
        seca:         `Revisé tus respuestas. Tu perfil es **${perfilNombre}**.\n\nEl error más común con tu tipo de piel: confundir sequedad con deshidratación. Son condiciones distintas con soluciones opuestas — y aplicar más crema a piel seca estructuralmente no resuelve nada, puede empeorar la barrera.\n\nTu rutina ataca la causa real. Tengo algo más que mostrarte antes de dártela.`,
        mixta:        `Revisé tus respuestas. Tu perfil es **${perfilNombre}**.\n\nLa industria comete un error fundamental contigo todos los días: crear productos "para piel mixta" que intentan hacer dos cosas a la vez y no hacen ninguna bien. Tu zona T y tus mejillas necesitan estrategias diferentes.\n\nTu rutina está construida exactamente así. Tengo algo más que mostrarte antes de dártela.`,
        sensible:     `Revisé tus respuestas. Tu perfil es **${perfilNombre}**.\n\nLo que la mayoría no entiende: la piel sensible no es un tipo de piel permanente — es una barrera comprometida. Y la causa número uno son los productos con demasiados activos que el mercado vende como "suaves".\n\nTu rutina prioriza reconstruir la barrera antes que todo. Tengo algo más que mostrarte antes de dártela.`,
        deshidratada: `Revisé tus respuestas. Tu perfil es **${perfilNombre}**.\n\nAlgo importante: la deshidratación ocurre en cualquier tipo de piel, incluso en la grasa. Lo que sientes no es falta de aceite — es falta de agua en las capas superficiales. Aplicar más cremas ricas puede bloquear la hidratación que necesitas.\n\nTu rutina trabaja de adentro hacia afuera. Tengo algo más que mostrarte antes de dártela.`,
        acne:         `Revisé tus respuestas. Tu perfil es **${perfilNombre}**.\n\nLo que más daña la piel con acné no es el acné en sí — es la respuesta agresiva. Exfoliantes fuertes, secantes, ácidos al máximo. Todo eso destruye la barrera justo cuando más la necesitas y prolonga los ciclos.\n\nTu rutina es efectiva sin ser agresiva. Tengo algo más que mostrarte antes de dártela.`,
        madura:       `Revisé tus respuestas. Tu perfil es **${perfilNombre}**.\n\nEl error más caro en el skincare antiedad: perseguir el colágeno cuando el problema real es la pérdida de hidratación y la degradación de la barrera. La mayoría de los productos "lifting" tratan el síntoma, no la causa.\n\nTu rutina actúa en las tres capas correctas. Tengo algo más que mostrarte antes de dártela.`,
        manchas:      `Revisé tus respuestas. Tu perfil es **${perfilNombre}**.\n\nAlgo que pocas marcas te dicen: aclarar manchas sin protección solar es trabajo perdido. La hiperpigmentación se reactiva con cada exposición UV, sin importar qué tan potente sea tu sérum.\n\nTu rutina cierra ese ciclo correctamente. Tengo algo más que mostrarte antes de dártela.`,
        default:      `Revisé tus respuestas. Tu perfil es **${perfilNombre}**.\n\nHay algo específico sobre tu tipo de piel que quiero que sepas: la mayoría de los productos del mercado no están diseñados para lo que tu piel realmente necesita. Los que elegí para ti sí lo están.\n\nTengo algo más que mostrarte antes de dártela.`,
      },
      en: {
        grasa:        `I've reviewed your answers. Your profile is **${perfilNombre}**.\n\nHere's what the skincare industry consistently gets wrong with your skin type: over-cleansing. Most people think they need to strip every trace of sebum — and that's exactly the mistake that makes skin produce *more* oil in response.\n\nYour routine is designed to break that cycle. I have one more thing to show you before I hand it over.`,
        seca:         `I've reviewed your answers. Your profile is **${perfilNombre}**.\n\nThe most common mistake with your skin type: confusing dryness with dehydration. These are different conditions with opposite solutions — adding more moisturizer to structurally dry skin doesn't fix it, it can compromise your barrier further.\n\nYour routine addresses the real cause. I have one more thing to show you before I hand it over.`,
        mixta:        `I've reviewed your answers. Your profile is **${perfilNombre}**.\n\nThe industry makes a fundamental error with combination skin every day: creating "combination skin" products that try to do two things at once and do neither well. Your T-zone and cheeks need different strategies.\n\nYour routine is built exactly that way. I have one more thing to show you before I hand it over.`,
        sensible:     `I've reviewed your answers. Your profile is **${perfilNombre}**.\n\nWhat most people miss: sensitive skin isn't a permanent skin type — it's a compromised barrier. And the number one cause is products with too many actives marketed as "gentle."\n\nYour routine prioritizes rebuilding the barrier before anything else. I have one more thing to show you before I hand it over.`,
        deshidratada: `I've reviewed your answers. Your profile is **${perfilNombre}**.\n\nImportant: dehydration can occur in any skin type — including oily skin. What you're feeling isn't a lack of oil, it's a lack of water in the surface layers. Applying rich creams can actually block the hydration you need.\n\nYour routine works from the inside out. I have one more thing to show you before I hand it over.`,
        acne:         `I've reviewed your answers. Your profile is **${perfilNombre}**.\n\nWhat damages acne-prone skin most isn't the acne itself — it's the aggressive response to it. Strong exfoliants, harsh drying agents, maximum-strength acids. All of that destroys your barrier exactly when you need it most.\n\nYour routine is effective without being harsh. I have one more thing to show you before I hand it over.`,
        madura:       `I've reviewed your answers. Your profile is **${perfilNombre}**.\n\nThe most expensive mistake in anti-aging skincare: chasing collagen when the real problem is hydration loss and barrier degradation. Most "lifting" products treat the symptom, not the cause.\n\nYour routine works at the three correct layers. I have one more thing to show you before I hand it over.`,
        manchas:      `I've reviewed your answers. Your profile is **${perfilNombre}**.\n\nSomething most brands won't tell you: fading dark spots without sun protection is wasted effort. Hyperpigmentation reactivates with every UV exposure, no matter how potent your serum.\n\nYour routine closes that cycle correctly. I have one more thing to show you before I hand it over.`,
        default:      `I've reviewed your answers. Your profile is **${perfilNombre}**.\n\nThere's something specific about your skin type I want you to know — most products on the market aren't designed for what your skin actually needs. The ones I selected for you are.\n\nI have one more thing to show you before I hand it over.`,
      },
    };

    // ── Prompt para GPT-4o — The Reveal version ──────────────
    const mensajeInterno = `[SYSTEM: THE REVEAL — Generate KOI's opening message. This is the most important message in the entire user experience.]

Browser language: ${nombreIdioma}. Respond ENTIRELY in ${nombreIdioma}.
Skin profile ID: ${perfilId}
Skin profile name: ${perfilNombre}

RULES — READ CAREFULLY:
1. Do NOT introduce yourself by name first. Do NOT say "Hello" or "Hi". Enter the subject directly.
2. Start with: "I reviewed your answers." (or equivalent in the target language)
3. State the user's profile name clearly.
4. Give ONE powerful, specific insight about a mistake the skincare industry makes with this exact skin type. This must be concrete, not generic. Something that makes the user think "how does she know that?"
5. The insight must create a contrast: "most products do X wrong — yours does Y right."
6. End with EXACTLY this (adapted to the language): "Your routine is designed for this. I have one more thing to show you before I hand it over." — Do NOT say the routine is ready to view. Do NOT ask if they want to see it. Just create anticipation.
7. Maximum 90 words. No filler. No corporate language. No excessive emojis.
8. NEVER say "30 years", "decades" or any years number. If you mention experience, say "9+ years".
9. Tone: a seasoned dermatology-trained esthetician — precise, warm, direct.`;

    mostrarTyping();

    try {
      const payload = {
        mensaje:   mensajeInterno,
        historial: [],
        contexto:  construirContexto(),
      };

      const response = await fetch(KOI_CONFIG.workerUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      const data       = await response.json();
      const mensajeKOI = data.respuesta || data.content || '';

      ocultarTyping();

      const textEl = agregarMensaje('koi', '', true);
      if (textEl && mensajeKOI) {
        await escribirConEfecto(textEl, mensajeKOI);
      }

      KOI_STATE.historial.push({ role: 'assistant', content: mensajeKOI });
      guardarHistorialLocal();

    } catch (err) {
      console.warn('[KOI] The Reveal greeting failed, using local fallback:', err);
      ocultarTyping();

      // Fallback local por perfil e idioma
      const setIdioma = insightsFallback[idioma] || insightsFallback['en'];
      const mensaje   = setIdioma[perfilId] || setIdioma['default'];
      const textEl    = agregarMensaje('koi', '', true);
      if (textEl) await escribirConEfecto(textEl, mensaje);
      KOI_STATE.historial.push({ role: 'assistant', content: mensaje });
      guardarHistorialLocal();
    }

    // ── Segundo mensaje: persuasivo de cámara, directo después del insight
    // Pequeña pausa para que se sienta como una conversación natural
    setTimeout(async () => {
      const mensajesCamara = {
        es: `Puedo armar tu rutina solo con el quiz — y ya lo hice.\n\nPero hay algo que el texto no me da: la textura real de tu piel ahora mismo, cómo están tus poros hoy, si hay enrojecimiento que quizás tú misma no has notado todavía.\n\nEl análisis facial me permite afinar cada producto a lo que tu piel *realmente* necesita hoy, no solo en teoría.\n\nSon 10 segundos. ¿Lo intentamos? O si prefieres, te doy la rutina solo con el quiz.`,
        en: `I can build your routine from the quiz alone — and I already did.\n\nBut there's something text can't give me: your skin's actual texture right now, how your pores look today, whether there's redness you might not have noticed yourself.\n\nFacial analysis lets me fine-tune every product to what your skin *actually* needs today — not just in theory.\n\nTen seconds. Shall we? Or I can show you the quiz-only routine right now.`,
        fr: `Je peux construire votre routine uniquement avec le quiz — et c'est déjà fait.\n\nMais il y a quelque chose que le texte ne me donne pas : la texture réelle de votre peau en ce moment, l'état de vos pores aujourd'hui, une rougeur que vous n'auriez peut-être pas remarquée.\n\nL'analyse faciale me permet d'affiner chaque produit à ce que votre peau *vraiment* besoin aujourd'hui — pas seulement en théorie.\n\nDix secondes. On essaie ? Ou je vous montre la routine quiz tout de suite.`,
        pt: `Posso montar sua rotina só com o quiz — e já fiz isso.\n\nMas há algo que o texto não me dá: a textura real da sua pele agora, como estão seus poros hoje, se há vermelhidão que talvez você mesma não tenha notado ainda.\n\nA análise facial me permite afinar cada produto ao que sua pele *realmente* precisa hoje — não só na teoria.\n\nSão 10 segundos. Vamos tentar? Ou se preferir, te mostro a rotina só com o quiz agora.`,
        de: `Ich kann deine Routine allein aus dem Quiz zusammenstellen — und das habe ich bereits getan.\n\nAber es gibt etwas, das mir Text nicht geben kann: die tatsächliche Textur deiner Haut gerade, wie deine Poren heute aussehen, ob es Rötungen gibt, die du vielleicht selbst nicht bemerkt hast.\n\nDie Gesichtsanalyse ermöglicht es mir, jedes Produkt auf das abzustimmen, was deine Haut *wirklich* heute braucht — nicht nur in der Theorie.\n\nZehn Sekunden. Sollen wir? Oder ich zeige dir jetzt die Quiz-Routine.`,
        it: `Posso creare la tua routine solo con il quiz — e l'ho già fatto.\n\nMa c'è qualcosa che il testo non mi dà: la texture reale della tua pelle adesso, come appaiono i tuoi pori oggi, se c'è arrossamento che forse non hai ancora notato.\n\nL'analisi facciale mi permette di affinare ogni prodotto a ciò di cui la tua pelle *ha davvero* bisogno oggi — non solo in teoria.\n\nDieci secondi. Proviamo? Oppure ti mostro subito la routine solo dal quiz.`,
      };

      const msg2   = mensajesCamara[idioma] || mensajesCamara['en'];
      mostrarTyping();
      await new Promise(r => setTimeout(r, 900));
      ocultarTyping();
      const textEl2 = agregarMensaje('koi', '');
      if (textEl2) await escribirConEfecto(textEl2, msg2);
      KOI_STATE.historial.push({ role: 'assistant', content: msg2 });
      guardarHistorialLocal();

      // Chips: analizar primero o ver rutina directamente
      KOI_STATE.revealPhase = 'camara';
      setTimeout(() => mostrarChips('post_camara'), 400);
    }, 1200);
  }

  /* ══════════════════════════════════════════════════════════
     THE REVEAL — CHIPS HANDLER
     Intercepta los chips de bifurcación y ejecuta la lógica
     correspondiente (email gate o cámara).
     ══════════════════════════════════════════════════════════ */
  function esChipReveal (texto) {
    // Detecta si el chip es de bifurcación (reveal o cámara)
    const t = texto.toLowerCase();
    return t.includes('reveal') || t.includes('descubre') || t.includes('révéler') ||
           t.includes('revelar') || t.includes('enthüllen') || t.includes('rivela') ||
           t.includes('analyz') || t.includes('analiza') || t.includes('analyser') ||
           t.includes('analisar') || t.includes('analysier') || t.includes('analizza');
  }

  function esChipCamara (texto) {
    const t = texto.toLowerCase();
    return t.includes('📸') || t.includes('analyz') || t.includes('analiza') ||
           t.includes('analyser') || t.includes('analisar') || t.includes('analysier') ||
           t.includes('analizza') || t.includes('skin') && t.includes('first');
  }

  async function manejarChipReveal (texto) {
    const idioma = detectarIdioma();
    ocultarChips();

    if (esChipCamara(texto)) {
      // Marcar fase → los chips post_camara no serán interceptados por esChipReveal
      KOI_STATE.revealPhase = 'camara';
      // ── Cámara — mensaje persuasivo con psicología de curiosidad + autoridad
      const mensajesCamara = {
        es: `Tus respuestas ya me dicen mucho — lo suficiente para armarte una rutina sólida.

Pero hay algo que no puedo ver solo con texto: la textura real de tu piel en este momento, cómo están tus poros, si hay enrojecimiento que quizás tú misma no has notado aún.

El análisis facial me permite ir **una capa más profundo**. No es obligatorio — tu rutina ya está lista de cualquier forma.

¿Quieres intentarlo? Son unos 10 segundos.`,
        en: `Your quiz answers already tell me a lot — enough to build you a solid routine.

But there's something I can't see from text alone: your skin's actual texture right now, how your pores look today, whether there's redness you might not have noticed yourself.

Facial analysis lets me go **one layer deeper**. It's completely optional — your routine is ready either way.

Want to try it? It takes about 10 seconds.`,
        fr: `Vos réponses m'en disent déjà beaucoup — assez pour construire une routine solide.

Mais il y a des choses que je ne peux pas voir avec du texte seul : la texture réelle de votre peau en ce moment, l'état de vos pores, une rougeur que vous n'auriez peut-être pas remarquée.

L'analyse faciale me permet d'aller **une couche plus loin**. C'est totalement optionnel — votre routine est prête de toute façon.

Vous voulez essayer ? Ça prend environ 10 secondes.`,
        pt: `Suas respostas já me dizem muito — o suficiente para montar uma rotina sólida.

Mas há algo que não consigo ver só com texto: a textura real da sua pele agora, como estão seus poros hoje, se há vermelhidão que talvez você mesma não tenha notado.

A análise facial me permite ir **uma camada mais fundo**. É completamente opcional — sua rotina já está pronta de qualquer jeito.

Quer tentar? Leva uns 10 segundos.`,
        de: `Deine Antworten sagen mir schon viel — genug, um eine solide Routine für dich zu erstellen.

Aber es gibt Dinge, die ich nur aus Text nicht sehen kann: die tatsächliche Textur deiner Haut gerade jetzt, wie deine Poren heute aussehen, ob es Rötungen gibt, die du vielleicht selbst nicht bemerkt hast.

Die Gesichtsanalyse lässt mich **eine Schicht tiefer** gehen. Völlig optional — deine Routine ist so oder so fertig.

Möchtest du es versuchen? Es dauert etwa 10 Sekunden.`,
        it: `Le tue risposte mi dicono già molto — abbastanza per costruire una routine solida.

Ma c'è qualcosa che non riesco a vedere solo dal testo: la texture reale della tua pelle in questo momento, come appaiono i tuoi pori oggi, se c'è arrossamento che forse non hai ancora notato.

L'analisi facciale mi permette di andare **un livello più in profondità**. È completamente opzionale — la tua routine è pronta in ogni caso.

Vuoi provare? Ci vogliono circa 10 secondi.`,
      };
      const msg    = mensajesCamara[idioma] || mensajesCamara['en'];
      const textEl = agregarMensaje('koi', '');
      if (textEl) await escribirConEfecto(textEl, msg);
      KOI_STATE.historial.push({ role: 'assistant', content: msg });
      guardarHistorialLocal();

      // Chips post-cámara: analizar o ver rutina directamente
      setTimeout(() => mostrarChips('post_camara'), 400);

    } else {
      // ── Reveal directo — sin gate de email
      await revelarRutinaConKOI('');
    }
  }

  /* ══════════════════════════════════════════════════════════
     THE REVEAL — WOW EMAIL GATE v7.0
     5 momentos cinematográficos en lugar de un formulario
     estático. KOI "prepara" el reporte, luego pide el email
     con una envelope card animada.
     ══════════════════════════════════════════════════════════ */

  /* ── Momento 1: KOI está preparando tu Skin Report ──────── */
  async function pedirEmailEnChat () {
    KOI_STATE.revealPhase = 'email';
    setInputHabilitado(false);

    // Pequeña pausa → typing visible
    mostrarTyping();
    await new Promise(r => setTimeout(r, 600));
    ocultarTyping();

    // Inyectar la tarjeta de preparación en el chat
    _inyectarPreparandoCard();
  }

  function _inyectarPreparandoCard () {
    const container = document.getElementById('koi-messages');
    if (!container || document.getElementById('koi-preparing-card')) return;

    const idioma = detectarIdioma();

    const LABELS = {
      es: {
        title:  'KOI está preparando tu Skin Report…',
        steps: [
          { icon: '🔍', text: 'Analizando tu perfil de piel' },
          { icon: '📋', text: 'Documentando tus productos' },
          { icon: '✍️', text: 'Escribiendo tu manual de uso' },
        ],
      },
      en: {
        title:  'KOI is preparing your Skin Report…',
        steps: [
          { icon: '🔍', text: 'Analyzing your skin profile' },
          { icon: '📋', text: 'Documenting your products' },
          { icon: '✍️', text: 'Writing your usage manual' },
        ],
      },
      fr: {
        title:  'KOI prépare votre Skin Report…',
        steps: [
          { icon: '🔍', text: 'Analyse de votre profil de peau' },
          { icon: '📋', text: 'Documentation de vos produits' },
          { icon: '✍️', text: 'Rédaction de votre manuel' },
        ],
      },
      pt: {
        title:  'KOI está preparando seu Skin Report…',
        steps: [
          { icon: '🔍', text: 'Analisando seu perfil de pele' },
          { icon: '📋', text: 'Documentando seus produtos' },
          { icon: '✍️', text: 'Escrevendo seu manual de uso' },
        ],
      },
      de: {
        title:  'KOI bereitet deinen Skin Report vor…',
        steps: [
          { icon: '🔍', text: 'Analyse deines Hautprofils' },
          { icon: '📋', text: 'Dokumentation deiner Produkte' },
          { icon: '✍️', text: 'Schreiben deines Anwendungshandbuchs' },
        ],
      },
      it: {
        title:  'KOI sta preparando il tuo Skin Report…',
        steps: [
          { icon: '🔍', text: 'Analisi del tuo profilo pelle' },
          { icon: '📋', text: 'Documentazione dei tuoi prodotti' },
          { icon: '✍️', text: 'Scrittura del tuo manuale di utilizzo' },
        ],
      },
    };
    const lbl = LABELS[idioma] || LABELS['en'];

    const card = document.createElement('div');
    card.id        = 'koi-preparing-card';
    card.className = 'koi-preparing-card';
    card.innerHTML = `
      <div class="koi-preparing__title">${lbl.title}</div>
      <ul class="koi-preparing__steps">
        ${lbl.steps.map((s, i) => `
          <li class="koi-preparing__step" data-idx="${i}">
            <span class="koi-preparing__step-icon">${s.icon}</span>
            <span class="koi-preparing__step-text">${s.text}</span>
            <span class="koi-preparing__step-check">✓</span>
          </li>`).join('')}
      </ul>
    `;

    container.appendChild(card);
    scrollAlFinal();

    // Animar pasos uno a uno (800ms c/u)
    const stepEls = card.querySelectorAll('.koi-preparing__step');
    let delay = 200;
    stepEls.forEach((el, i) => {
      setTimeout(() => {
        el.classList.add('koi-preparing__step--active');
        scrollAlFinal();
      }, delay);
      delay += 800;
      setTimeout(() => {
        el.classList.add('koi-preparing__step--done');
        scrollAlFinal();
      }, delay);
      delay += 200;
    });

    // Cuando todos terminan → morph a envelope card (~3400ms)
    const totalDelay = 200 + (3 * 800) + (3 * 200) + 400;
    setTimeout(() => _morfar_a_envelope(card), totalDelay);
  }

  /* ── Momento 2: Envelope card con checkmarks + email input ─ */
  function _morfar_a_envelope (preparandoCard) {
    preparandoCard.classList.add('koi-preparing-card--out');
    setTimeout(() => {
      if (preparandoCard.parentNode) preparandoCard.remove();
      _inyectarEnvelopeCard();
    }, 350);
  }

  function _inyectarEnvelopeCard () {
    const container = document.getElementById('koi-messages');
    if (!container || document.getElementById('koi-email-gate')) return;

    const idioma = detectarIdioma();

    const LABELS = {
      es: {
        title:       '📩 Tu Skin Report está listo',
        checks: [
          'Rutina AM/PM personalizada',
          'Por qué cada producto fue elegido',
          'Orden de aplicación + tips',
          'Guía de ingredientes clave',
        ],
        subtitle:    '¿A dónde te lo envío?',
        placeholder: 'tu@email.com',
        btn:         'Enviar mi rutina →',
        note:        '🔒 Solo para enviarte tu rutina. Sin spam.',
      },
      en: {
        title:       '📩 Your Skin Report is ready',
        checks: [
          'Personalized AM/PM routine',
          'Why each product was chosen',
          'Application order + tips',
          'Key ingredients guide',
        ],
        subtitle:    'Where should I send it?',
        placeholder: 'you@email.com',
        btn:         'Send my routine →',
        note:        '🔒 Only to send you your routine. No spam.',
      },
      fr: {
        title:       '📩 Votre Skin Report est prêt',
        checks: [
          'Routine AM/PM personnalisée',
          'Pourquoi chaque produit a été choisi',
          'Ordre d\'application + conseils',
          'Guide des ingrédients clés',
        ],
        subtitle:    'Où dois-je vous l\'envoyer ?',
        placeholder: 'vous@email.com',
        btn:         'Envoyer ma routine →',
        note:        '🔒 Uniquement pour votre routine.',
      },
      pt: {
        title:       '📩 Seu Skin Report está pronto',
        checks: [
          'Rotina AM/PM personalizada',
          'Por que cada produto foi escolhido',
          'Ordem de aplicação + dicas',
          'Guia de ingredientes principais',
        ],
        subtitle:    'Para onde envio?',
        placeholder: 'voce@email.com',
        btn:         'Enviar minha rotina →',
        note:        '🔒 Apenas para sua rotina. Sem spam.',
      },
      de: {
        title:       '📩 Dein Skin Report ist fertig',
        checks: [
          'Personalisierte AM/PM-Routine',
          'Warum jedes Produkt gewählt wurde',
          'Anwendungsreihenfolge + Tipps',
          'Leitfaden für wichtige Inhaltsstoffe',
        ],
        subtitle:    'Wohin soll ich es schicken?',
        placeholder: 'du@email.com',
        btn:         'Routine senden →',
        note:        '🔒 Nur für deine Routine. Kein Spam.',
      },
      it: {
        title:       '📩 Il tuo Skin Report è pronto',
        checks: [
          'Routine AM/PM personalizzata',
          'Perché ogni prodotto è stato scelto',
          'Ordine di applicazione + consigli',
          'Guida agli ingredienti chiave',
        ],
        subtitle:    'Dove te lo mando?',
        placeholder: 'tu@email.com',
        btn:         'Invia la mia routine →',
        note:        '🔒 Solo per inviarti la tua routine.',
      },
    };
    const lbl = LABELS[idioma] || LABELS['en'];

    const gate = document.createElement('div');
    gate.id        = 'koi-email-gate';
    gate.className = 'koi-email-gate koi-email-gate--wow';
    gate.innerHTML = `
      <div class="koi-envelope__title">${lbl.title}</div>
      <ul class="koi-envelope__checks">
        ${lbl.checks.map(c => `<li class="koi-envelope__check"><span class="koi-envelope__check-icon">✓</span><span>${c}</span></li>`).join('')}
      </ul>
      <div class="koi-envelope__subtitle">${lbl.subtitle}</div>
      <input
        type="email"
        id="koi-email-input"
        class="koi-email-input"
        placeholder="${lbl.placeholder}"
        autocomplete="email"
        inputmode="email"
      />
      <button class="koi-email-btn" id="koi-email-btn">${lbl.btn}</button>
      <p class="koi-email-note">${lbl.note}</p>
    `;

    container.appendChild(gate);
    scrollAlFinal();

    // Animar checkmarks con stagger 200ms
    const checkEls = gate.querySelectorAll('.koi-envelope__check');
    checkEls.forEach((el, i) => {
      setTimeout(() => el.classList.add('koi-envelope__check--visible'), 150 + i * 200);
    });

    // Foco automático en desktop (después del stagger)
    setTimeout(() => {
      const inp = document.getElementById('koi-email-input');
      if (inp && window.innerWidth > 768) inp.focus();
    }, 150 + 4 * 200 + 100);

    // Eventos
    const inp = document.getElementById('koi-email-input');
    const btn = document.getElementById('koi-email-btn');
    if (btn) btn.addEventListener('click', confirmarEmail);
    if (inp) inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); confirmarEmail(); }
    });
  }

  /* ── Confirmar email + Momento 3: cart CTA inmediato ───── */
  async function confirmarEmail () {
    const inp = document.getElementById('koi-email-input');
    const gate = document.getElementById('koi-email-gate');
    if (!inp || !gate) return;

    const email = inp.value.trim();
    const idioma = detectarIdioma();

    // Validación simple
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      inp.classList.add('koi-email-input--error');
      setTimeout(() => inp.classList.remove('koi-email-input--error'), 800);
      return;
    }

    // Guardar email
    KOI_STATE.emailCaptured = email;

    // Quitar el gate con animación
    gate.classList.add('koi-email-gate--confirmed');
    setTimeout(() => { if (gate.parentNode) gate.remove(); }, 400);

    // Mostrar email del usuario como mensaje en el chat
    agregarMensaje('user', email);

    // Re-habilitar input
    setInputHabilitado(true);

    // Guardar email en localStorage
    try { localStorage.setItem('shatokb_email', email); } catch (_) {}

    // Enviar email a Shopify /contact (silencioso, sin redirigir)
    shatokbEnviarEmailShopify(email);

    // KOI confirma y revela (incluye Momentos 3, 4, 5)
    await revelarRutinaConKOI(email);
  }



  function shatokbEnviarEmailShopify (email) {
    // POST silencioso al endpoint de Shopify /contact
    // Mismo mecanismo que el email gate original del quiz
    const ctx  = KOI_STATE.contexto;
    const body = new URLSearchParams({
      'form_type':   'customer',
      'utf8':        '✓',
      'contact[email]': email,
      'contact[body]':  `[KOI The Reveal] Perfil: ${ctx?.perfil?.nombre || ''} | Productos: ${(ctx?.productos || []).map(p => p.nombre).join(', ')}`,
      'contact[tags]':  'koi-lead, quiz-completed',
    });

    fetch('/contact', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    body.toString(),
    }).catch(() => {}); // silencioso — no interrumpir la experiencia
  }

  /* ══════════════════════════════════════════════════════════
     SKIN REPORT — Guarda el reporte en la tabla API y
     dispara el evento en Klaviyo via el Worker.
     Se llama silenciosamente al capturar el email en el
     interceptor del carrito.
     ══════════════════════════════════════════════════════════ */
  async function enviarSkinReport (email) {
    const ctx    = KOI_STATE.contexto;
    if (!ctx || !email) return;

    // Construir los productos seleccionados actualmente
    // (los que el usuario eligió en los cards de la rutina)
    const productosSeleccionados = (ctx.productos || []).map(p => ({
      nombre:  p.nombre,
      precio:  p.precio,
      paso:    p.paso,
      id:      p.id,
      momento: p.momento || 'ambos',
      razon:   p.razon   || '',
    }));

    const reportData = {
      email,
      perfil: {
        id:          ctx.perfil?.id          || '',
        nombre:      ctx.perfil?.nombre      || '',
        descripcion: ctx.perfil?.descripcion || '',
        tags:        ctx.perfil?.tags        || [],
      },
      rutinaAM:              ctx.rutinaAM  || [],
      rutinaPM:              ctx.rutinaPM  || [],
      productosSeleccionados,
      totalCarrito:          ctx.totalCarrito || 0,
      presupuesto:           ctx.presupuesto  || '',
      experiencia:           ctx.experiencia  || '',
      idioma:                detectarIdioma(),
      createdAt:             Date.now(),
    };

    // Llamada silenciosa al Worker — no interrumpe el flujo
    // tableApiUrl = URL absoluta del proyecto Genspark (donde vive la tabla API)
    const tableApiUrl = window.location.origin;
    fetch(KOI_CONFIG.reportUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        email,
        reportData,
        siteUrl:     KOI_CONFIG.siteUrl,
        tableApiUrl,
      }),
    })
    .then(r => r.json())
    .then(data => {
      if (data.ok) {
        // Guardar la URL del reporte en el estado por si la necesitamos
        KOI_STATE.reportUrl = data.reportUrl;
        console.log('[KOI] Skin Report generado:', data.reportUrl);
      }
    })
    .catch(() => {}); // silencioso — nunca interrumpir la experiencia
  }

  // Flag booleano síncrono — guard más rápido que el string revealPhase
  // Evita race condition si revelarRutinaConKOI se llama dos veces antes
  // de que el primer await haya terminado.
  let _revelarEnCurso = false;

  async function revelarRutinaConKOI (email) {
    // Doble guard: booleano síncrono + string de fase
    if (_revelarEnCurso) return;
    _revelarEnCurso = true;
    if (KOI_STATE.revealPhase === 'revealed') {
      _revelarEnCurso = false;
      return;
    }
    KOI_STATE.revealPhase = 'revealed';

    const idioma       = detectarIdioma();
    const perfilNombre = KOI_STATE.contexto?.perfil?.nombre || '';

    // ── Momento 3a: Mensaje de confirmación de KOI ───────────
    const mensajesReveal = {
      es: `Listo ✨ Aquí está tu rutina para **${perfilNombre}**.\n\nEn cada paso te doy **3 opciones de productos** — los tres son igualmente efectivos para tu problema, así que puedes elegir cualquiera según tu preferencia o disponibilidad.\n\nCada producto tiene un botón ❓ — si quieres saber exactamente por qué lo elegí para ti, solo toca.`,
      en: `Done ✨ Here's your **${perfilNombre}** routine.\n\nFor each step I'm giving you **3 product options** — all three are equally effective for your concern, so pick whichever you prefer or have access to.\n\nEach product has a ❓ button — if you want to know exactly why I chose that one for you, just tap it.`,
      fr: `C'est fait ✨ Voici votre routine **${perfilNombre}**.\n\nPour chaque étape, je vous propose **3 options de produits** — les trois sont tout aussi efficaces pour votre problème, choisissez celui que vous préférez.\n\nChaque produit a un bouton ❓ — si vous voulez savoir exactement pourquoi je l'ai choisi pour vous, appuyez dessus.`,
      pt: `Pronto ✨ Aqui está sua rotina **${perfilNombre}**.\n\nEm cada etapa te dou **3 opções de produtos** — os três são igualmente eficazes para o seu problema, então escolha o que preferir.\n\nCada produto tem um botão ❓ — se quiser saber exatamente por que escolhi esse para você, é só tocar.`,
      de: `Fertig ✨ Hier ist deine **${perfilNombre}** Routine.\n\nFür jeden Schritt gebe ich dir **3 Produktoptionen** — alle drei sind gleich wirksam für dein Anliegen, wähle also einfach die, die du bevorzugst.\n\nJedes Produkt hat einen ❓ Button — wenn du wissen möchtest, warum ich es genau für dich gewählt habe, tippe einfach darauf.`,
      it: `Fatto ✨ Ecco la tua routine **${perfilNombre}**.\n\nPer ogni step ti do **3 opzioni di prodotti** — tutti e tre sono ugualmente efficaci per il tuo problema, quindi scegli quello che preferisci.\n\nOgni prodotto ha un pulsante ❓ — se vuoi sapere esattamente perché l'ho scelto per te, toccalo.`,
    };

    mostrarTyping();
    await new Promise(r => setTimeout(r, 900)); // pausa dramática
    ocultarTyping();

    const msg    = mensajesReveal[idioma] || mensajesReveal['en'];
    const textEl = agregarMensaje('koi', '', true);
    if (textEl) await escribirConEfecto(textEl, msg);
    KOI_STATE.historial.push({ role: 'assistant', content: msg });
    guardarHistorialLocal();

    // ── Botón "Ver mi rutina" — en #koi-messages, debajo del mensaje de KOI.
    // El input queda BLOQUEADO hasta que el usuario haga clic y vea la rutina.
    // Así el usuario lee el mensaje completo de KOI antes de poder escribir.
    const scrollBtns = {
      es: '✨ Ver mi rutina ahora',
      en: '✨ Show me my routine',
      fr: '✨ Voir ma routine',
      pt: '✨ Ver minha rotina agora',
      de: '✨ Routine jetzt ansehen',
      it: '✨ Vedi la mia routine',
    };
    const btnLabel = scrollBtns[idioma] || scrollBtns['en'];

    // Ocultar barra de input — más claro que mostrarla deshabilitada en gris.
    // El usuario no puede (ni debe) escribir hasta ver la rutina.
    setInputAreaVisible(false);

    setTimeout(() => {
      const container = document.getElementById('koi-messages');
      if (!container || document.getElementById('koi-reveal-btn-persistent')) return;

      const wrapper = document.createElement('div');
      wrapper.id        = 'koi-reveal-btn-persistent';
      wrapper.className = 'koi-reveal-btn-persistent';

      const btn = document.createElement('button');
      btn.className   = 'koi-reveal-btn-persistent__btn';
      btn.textContent = btnLabel;
      btn.addEventListener('click', () => {
        // Ocultar el botón una vez usado
        wrapper.classList.add('koi-reveal-btn-persistent--used');
        setTimeout(() => { if (wrapper.parentNode) wrapper.remove(); }, 300);

        // 1. Scroll hacia los productos
        const rutinaEl = document.getElementById('shatokb-resultado') ||
                         document.getElementById('stk-reveal-section');
        if (rutinaEl) rutinaEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // 2. Revelar productos
        setTimeout(() => {
          if (typeof window.shatokbRevelarProductos === 'function') {
            window.shatokbRevelarProductos();
          }
        }, 300);

        // 3. Mostrar barra de input + habilitar + chips de bienvenida
        setTimeout(() => {
          setInputAreaVisible(true);
          setInputHabilitado(true);
          mostrarChips('bienvenida');
        }, 1800);
      });

      wrapper.appendChild(btn);
      container.appendChild(wrapper);
      scrollAlFinal();
    }, 700);
  }

  // Momento 5 eliminado — el cuadro sticky "Add my full routine to cart"
  // que aparece encima del chat ya cumple esta función correctamente y
  // siempre está visible. Un segundo botón dentro del chat es redundante
  // y además llevaría a /cart vacío (los productos se añaden desde los
  // cards de la rutina, no desde el chat).

  /* ══════════════════════════════════════════════════════════
     ENVÍO DE MENSAJES
     ══════════════════════════════════════════════════════════ */

  async function enviarMensajeUsuario () {
    const input = document.getElementById('koi-input');
    if (!input) return;

    const texto = input.value.trim();
    if (!texto || KOI_STATE.isTyping) return;

    // Limpiar input
    input.value = '';
    input.style.height = 'auto';
    ocultarChips();

    // Mostrar mensaje del usuario
    agregarMensaje('user', texto);
    KOI_STATE.msgCount++;

    // Añadir al historial
    KOI_STATE.historial.push({ role: 'user', content: texto });
    guardarHistorialLocal();

    // Deshabilitar input mientras KOI responde
    setInputHabilitado(false);

    // Obtener respuesta de KOI
    await obtenerRespuestaKOI(texto);

    // Re-habilitar input
    setInputHabilitado(true);
    input.focus();

    // Mostrar chips contextuales después de algunos mensajes
    if (KOI_STATE.msgCount >= 2) {
      setTimeout(() => mostrarChips('post_rutina'), 500);
    }
  }

  /* ══════════════════════════════════════════════════════════
   SPRINT 2 — KOI VISION: manejar resultado del análisis facial
   Llamado desde window.koiVision.onResultado() cuando el
   usuario confirma "Ver análisis completo en el chat"
   ══════════════════════════════════════════════════════════ */
async function manejarResultadoVision (data) {
  const { result, image, ctx } = data || {};
  const idioma = detectarIdioma();

  // El mensaje del usuario YA fue añadido por enviarDesdeChip / manejarChipPostCamara
  // cuando el usuario pulsó el chip. NO añadir de nuevo — evita duplicados.
  // Solo añadir al historial si llegamos aquí via evento global (sin chip previo).
  const ultimoMsgUser = KOI_STATE.historial.filter(m => m.role === 'user').slice(-1)[0];
  const yaEstaEnHistorial = ultimoMsgUser && ultimoMsgUser.content.includes('📸');
  const yaEstaEnDOM = !!document.querySelector('#koi-messages .koi-msg--user:last-child');
  if (!yaEstaEnHistorial) {
    const chipTexto = idioma === 'es' ? '📸 Analicé mi piel con la cámara' : '📸 I analyzed my skin with the camera';
    KOI_STATE.historial.push({ role: 'user', content: chipTexto });
    // Solo añadir al DOM si no fue el chip quien ya lo hizo
    if (!yaEstaEnDOM) agregarMensaje('user', chipTexto);
  }

  // Mostrar typing mientras KOI procesa
  mostrarTyping();

  const perfilId    = KOI_STATE.contexto?.perfil?.id || '';
  const perfilNombre = KOI_STATE.contexto?.perfil?.nombre || 'your profile';

  // ── Si tenemos resultado real del Worker ───────────────────
  if (result && result.mensaje_koi) {
    await new Promise(r => setTimeout(r, 900));
    ocultarTyping();

    // 1. Mensaje principal de KOI con typewriter
    const textEl = agregarMensaje('koi', '', false);
    await escribirConEfecto(textEl, result.mensaje_koi);
    KOI_STATE.historial.push({ role: 'koi', content: result.mensaje_koi });

    await new Promise(r => setTimeout(r, 400));

    // 2. Card de análisis avanzado — se inyecta como segundo mensaje de KOI
    const bubble = textEl.closest
      ? textEl.closest('.koi-msg') || textEl.parentElement
      : textEl.parentElement;

    const cardEl = _construirCardAnalisis(result, idioma);
    if (cardEl) {
      // Añadir debajo del primer bubble (nuevo mensaje de KOI visual)
      const chatContainer = document.getElementById('koi-messages') ||
                            document.getElementById('shatokb-koi-messages') ||
                            bubble?.parentElement;
      if (chatContainer) {
        chatContainer.appendChild(cardEl);
        // Animar entrada con stagger
        _animarCardEntrada(cardEl);
      }
    }

    guardarHistorialLocal();

    // 3. Si el perfil necesita ajuste, añadir nota de KOI
    if (result.ajuste_perfil && result.ajuste_perfil !== 'null') {
      await new Promise(r => setTimeout(r, 600));
      const ajusteMsgs = {
        es: `**Nota sobre tu perfil:** ${result.ajuste_perfil}`,
        en: `**Profile note:** ${result.ajuste_perfil}`,
      };
      const ajusteMsg  = ajusteMsgs[idioma] || ajusteMsgs.en;
      const ajusteEl   = agregarMensaje('koi', '', false);
      await escribirConEfecto(ajusteEl, ajusteMsg);
      KOI_STATE.historial.push({ role: 'koi', content: ajusteMsg });
    }

    guardarHistorialLocal();
    KOI_STATE.revealPhase = 'post_vision';
    // Post-análisis: solo chip para revelar la rutina (ya se analizó la piel)
    setTimeout(() => mostrarChips('post_vision'), 700);

  } else {
    // ── Fallback: sin resultado del Worker ────────────────────
    // En lugar de mostrar un mensaje intermedio + chip → ir directo al reveal.
    // Esto evita: fallback msg → usuario pulsa chip → reveal msg (duplicado).
    await new Promise(r => setTimeout(r, 1200));
    ocultarTyping();

    KOI_STATE.revealPhase = 'email';
    await revelarRutinaConKOI('');
  }

  scrollAlFinal();
}

/* ══════════════════════════════════════════════════════════
   CONSTRUIR CARD DE ANÁLISIS AVANZADO
   Renderiza el resultado de las 8 dimensiones + ingredientes
   + protocolo urgente como card visual dentro del chat.
   ══════════════════════════════════════════════════════════ */
function _construirCardAnalisis(result, idioma) {
  if (!result) return null;

  const dim  = result.dimensiones || {};
  const zona = result.zonas || {};
  const ings = result.ingredientes_prioritarios || [];
  const pts  = result.puntos_criticos || [];

  // Labels por idioma
  const L = {
    es: {
      titulo:        'Análisis Cutáneo KOI',
      scoreGlobal:   'Salud global de piel',
      scoreLabel:    (s) => s >= 8 ? 'Piel en excelente estado' : s >= 6 ? 'Piel en buen estado' : s >= 4 ? 'Piel con áreas de mejora' : 'Piel requiere atención urgente',
      zonas:         'Diagnóstico por zonas',
      dimensiones:   'Análisis dimensional',
      criticos:      'Hallazgos críticos',
      ingredientes:  'Activos prioritarios',
      protocolo:     'Protocolo urgente',
      edadBio:       'Edad biológica estimada',
      perfil:        'Perfil confirmado',
      perfilNo:      'Ajuste de perfil detectado',
      dim_labels: {
        hidratacion:  'Hidratación',
        barrera:      'Barrera cutánea',
        sebum:        'Control sebáceo',
        pigmentacion: 'Pigmentación',
        textura:      'Textura',
        circulacion:  'Circulación',
        firmeza:      'Firmeza',
        microbioma:   'Microbioma',
      },
      dim_icons: {
        hidratacion:  '💧',
        barrera:      '🛡️',
        sebum:        '✨',
        pigmentacion: '🌗',
        textura:      '🔎',
        circulacion:  '❤️',
        firmeza:      '💪',
        microbioma:   '🦠',
      },
    },
    en: {
      titulo:        'KOI Skin Analysis',
      scoreGlobal:   'Overall skin health',
      scoreLabel:    (s) => s >= 8 ? 'Excellent skin condition' : s >= 6 ? 'Good skin condition' : s >= 4 ? 'Skin has areas to improve' : 'Skin needs urgent attention',
      zonas:         'Zone-by-zone diagnosis',
      dimensiones:   'Dimensional analysis',
      criticos:      'Critical findings',
      ingredientes:  'Priority actives',
      protocolo:     'Urgent protocol',
      edadBio:       'Estimated biological age',
      perfil:        'Profile confirmed',
      perfilNo:      'Profile adjustment detected',
      dim_labels: {
        hidratacion:  'Hydration',
        barrera:      'Skin barrier',
        sebum:        'Sebum control',
        pigmentacion: 'Pigmentation',
        textura:      'Texture',
        circulacion:  'Circulation',
        firmeza:      'Firmness',
        microbioma:   'Microbiome',
      },
      dim_icons: {
        hidratacion:  '💧',
        barrera:      '🛡️',
        sebum:        '✨',
        pigmentacion: '🌗',
        textura:      '🔎',
        circulacion:  '❤️',
        firmeza:      '💪',
        microbioma:   '🦠',
      },
    },
  };
  const lbl = L[idioma] || L.en;

  // ── Helpers de color y barra ──────────────────────────────
  function scoreColor(s) {
    if (s === null || s === undefined) return '#6b7280';
    if (s >= 8) return '#22c55e';
    if (s >= 6) return '#84cc16';
    if (s >= 4) return '#f59e0b';
    return '#ef4444';
  }
  function scoreGrade(s) {
    if (s === null || s === undefined) return '—';
    if (s >= 9) return 'A+';
    if (s >= 8) return 'A';
    if (s >= 7) return 'B+';
    if (s >= 6) return 'B';
    if (s >= 5) return 'C+';
    if (s >= 4) return 'C';
    return 'D';
  }
  function scoreBar(s) {
    if (s === null || s === undefined) return '';
    const pct   = Math.round((s / 10) * 100);
    const color = scoreColor(s);
    return `<div class="kva-score-bar"><div class="kva-score-fill" style="width:${pct}%;background:${color};box-shadow:0 0 8px ${color}55;"></div></div>`;
  }

  // ── Score global (hero section) ───────────────────────────
  const sg = (typeof result.score_global === 'number') ? result.score_global : null;
  const sgColor = scoreColor(sg);
  const sgGrade = scoreGrade(sg);
  // SVG arc gauge
  const radius = 36;
  const circ   = 2 * Math.PI * radius;
  const pct    = sg !== null ? Math.round((sg / 10) * 100) : 0;
  const dash   = (pct / 100) * circ;
  const scoreGlobalHTML = sg !== null ? `
    <div class="kva-score-global">
      <div class="kva-sg__gauge-wrap">
        <svg class="kva-sg__svg" viewBox="0 0 88 88" width="88" height="88">
          <circle cx="44" cy="44" r="${radius}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="6"/>
          <circle cx="44" cy="44" r="${radius}" fill="none"
            stroke="${sgColor}" stroke-width="6"
            stroke-linecap="round"
            stroke-dasharray="${dash} ${circ}"
            stroke-dashoffset="${circ * 0.25}"
            style="filter:drop-shadow(0 0 6px ${sgColor}99);transition:stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1);"
          />
        </svg>
        <div class="kva-sg__number" style="color:${sgColor}">${sg.toFixed(1)}</div>
        <div class="kva-sg__denom">/10</div>
      </div>
      <div class="kva-sg__right">
        <div class="kva-sg__label">${lbl.scoreGlobal}</div>
        <div class="kva-sg__grade" style="color:${sgColor}">${sgGrade}</div>
        <div class="kva-sg__sublabel">${lbl.scoreLabel(sg)}</div>
      </div>
    </div>` : '';

  // ── Zonas ─────────────────────────────────────────────────
  const zonaEntries = [
    { emoji: '🏔️', key: 'tzone',    label: 'T-Zone'   },
    { emoji: '🌸', key: 'mejillas', label: idioma === 'es' ? 'Mejillas' : 'Cheeks' },
    { emoji: '👁️', key: 'ojos',    label: idioma === 'es' ? 'Contorno ojos' : 'Eye area' },
    { emoji: '💋', key: 'boca',     label: idioma === 'es' ? 'Contorno boca' : 'Lip area' },
  ];
  const zonasHTML = zonaEntries.map(z => {
    const val = zona[z.key] || '—';
    return `<div class="kva-zone">
      <span class="kva-zone__emoji">${z.emoji}</span>
      <div class="kva-zone__info">
        <span class="kva-zone__label">${z.label}</span>
        <span class="kva-zone__val">${val}</span>
      </div>
    </div>`;
  }).join('');

  // ── Dimensiones ───────────────────────────────────────────
  const dimKeys = ['hidratacion','barrera','sebum','pigmentacion','textura','circulacion','firmeza','microbioma'];
  const dimHTML = dimKeys.map(key => {
    const d = dim[key];
    if (!d) return '';
    const score = d.score;
    const color = scoreColor(score);
    const icon  = lbl.dim_icons[key] || '';
    const scoreDisplay = (score !== null && score !== undefined) ? score + '/10' : '—';
    return `<div class="kva-dim">
      <div class="kva-dim__top">
        <span class="kva-dim__name"><span class="kva-dim__icon">${icon}</span>${lbl.dim_labels[key] || key}</span>
        <span class="kva-dim__score" style="color:${color}">${scoreDisplay}</span>
      </div>
      ${scoreBar(score)}
      ${d.label ? `<div class="kva-dim__label">${d.label}</div>` : ''}
      ${d.detalle ? `<div class="kva-dim__detail">${d.detalle}</div>` : ''}
    </div>`;
  }).join('');

  // ── Puntos críticos ───────────────────────────────────────
  const ptsHTML = pts.length
    ? `<div class="kva-section">
        <div class="kva-section__title">${lbl.criticos}</div>
        <ul class="kva-findings">
          ${pts.map(p => `<li class="kva-finding"><span class="kva-finding__arrow">→</span><span>${p}</span></li>`).join('')}
        </ul>
      </div>` : '';

  // ── Ingredientes (hasta 4) ────────────────────────────────
  const ingsHTML = ings.length
    ? `<div class="kva-section">
        <div class="kva-section__title">${lbl.ingredientes}</div>
        <div class="kva-ingredients">
          ${ings.slice(0, 4).map((ing, idx) => `
            <div class="kva-ingredient">
              <span class="kva-ingredient__num">${idx + 1}</span>
              <div class="kva-ingredient__body">
                <span class="kva-ingredient__name">${ing.nombre}</span>
                <span class="kva-ingredient__reason">${ing.razon}</span>
              </div>
            </div>`).join('')}
        </div>
      </div>` : '';

  // ── Protocolo urgente ─────────────────────────────────────
  const protHTML = result.protocolo_urgente
    ? `<div class="kva-protocolo">
        <div class="kva-protocolo__label">⚡ ${lbl.protocolo}</div>
        <p class="kva-protocolo__text">${result.protocolo_urgente}</p>
      </div>` : '';

  // ── Meta (edad bio + confirmación perfil) ─────────────────
  const edadBioHTML = result.edad_biologica_estimada
    ? `<div class="kva-meta__item">
        <span class="kva-meta__icon">🔬</span>
        <div class="kva-meta__body">
          <span class="kva-meta__key">${lbl.edadBio}</span>
          <span class="kva-meta__val">${result.edad_biologica_estimada}</span>
        </div>
      </div>` : '';

  const perfilOk = result.confirmacion_perfil;
  const perfilHTML = `<div class="kva-meta__item">
      <span class="kva-meta__icon">${perfilOk ? '✅' : '⚠️'}</span>
      <div class="kva-meta__body">
        <span class="kva-meta__key">${perfilOk ? lbl.perfil : lbl.perfilNo}</span>
        ${!perfilOk && result.ajuste_perfil && result.ajuste_perfil !== 'null'
          ? `<span class="kva-meta__val">${result.ajuste_perfil}</span>` : ''}
      </div>
    </div>`;

  const metaHTML = (edadBioHTML || perfilHTML)
    ? `<div class="kva-meta">${edadBioHTML}${perfilHTML}</div>` : '';

  // ── Ensamblar ─────────────────────────────────────────────
  const wrapper = document.createElement('div');
  wrapper.className = 'kva-card';
  wrapper.innerHTML = `
    <div class="kva-card__header">
      <span class="kva-card__badge">🔬 KOI</span>
      <span class="kva-card__title">${lbl.titulo}</span>
    </div>

    ${scoreGlobalHTML}

    <div class="kva-section kva-section--zones">
      <div class="kva-section__title">${lbl.zonas}</div>
      <div class="kva-zones-grid">${zonasHTML}</div>
    </div>

    <div class="kva-section">
      <div class="kva-section__title">${lbl.dimensiones}</div>
      <div class="kva-dims-grid">${dimHTML}</div>
    </div>

    ${ptsHTML}
    ${ingsHTML}
    ${protHTML}
    ${metaHTML}
  `;

  return wrapper;
}

/* ── Animar entrada de la card con stagger ── */
function _animarCardEntrada(cardEl) {
  if (!cardEl) return;
  cardEl.style.opacity = '0';
  cardEl.style.transform = 'translateY(16px)';
  cardEl.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)';

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      cardEl.style.opacity = '1';
      cardEl.style.transform = 'translateY(0)';
    });
  });

  // Animar hijos con stagger
  const children = cardEl.querySelectorAll('.kva-section, .kva-protocolo, .kva-meta');
  children.forEach((child, i) => {
    child.style.opacity = '0';
    child.style.transform = 'translateY(8px)';
    child.style.transition = `opacity 0.4s ease ${0.15 + i * 0.08}s, transform 0.4s ease ${0.15 + i * 0.08}s`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        child.style.opacity = '1';
        child.style.transform = 'translateY(0)';
      });
    });
  });
}

/* ══════════════════════════════════════════════════════════
   ESCUCHAR EVENTO GLOBAL de KOI Vision (alternativo al callback)
   Usa { once: true } para que el listener se auto-elimine tras
   la primera ejecución — evita acumulación de handlers si el
   usuario abre la cámara más de una vez.
   ══════════════════════════════════════════════════════════ */
let _visionResultHandled = false;
function _handleVisionResult(e) {
  if (_visionResultHandled) return;
  _visionResultHandled = true;
  if (e.detail) manejarResultadoVision(e.detail);
  // Resetear el flag después de 2s para permitir nuevos análisis
  setTimeout(function() { _visionResultHandled = false; }, 2000);
}
window.addEventListener('koi-vision-result', _handleVisionResult);

async function enviarDesdeChip (texto) {
    // ── Chips de bifurcación "The Reveal" ─────────────────────
    // Se interceptan aquí antes de ir al Worker — tienen lógica
    // propia que no debe pasar por GPT-4o
    if (KOI_STATE.revealPhase === 'insight' && esChipReveal(texto)) {
      agregarMensaje('user', texto);
      await manejarChipReveal(texto);
      return;
    }

    // ── Chips post-cámara: analizar rostro o ver rutina ───────
    if (KOI_STATE.revealPhase === 'camara' && esChipPostCamara(texto)) {
      agregarMensaje('user', texto);
      await manejarChipPostCamara(texto);
      return;
    }

    // ── Chip post-visión: revelar rutina después del análisis ──
    if (KOI_STATE.revealPhase === 'post_vision' && esChipPostVision(texto)) {
      agregarMensaje('user', texto);
      ocultarChips();
      KOI_STATE.revealPhase = 'email';
      await revelarRutinaConKOI('');
      return;
    }

    // ── Chips normales → enviar al Worker como mensaje ────────
    const input = document.getElementById('koi-input');
    if (input) {
      input.value = texto;
      await enviarMensajeUsuario();
    }
  }

  /* ── Detecta chip post-visión (después del análisis) ────── */
  function esChipPostVision (texto) {
    const t = texto.toLowerCase();
    return t.includes('muéstrame') || t.includes('show me my routine') ||
           t.includes('montrez') || t.includes('mostrar') ||
           t.includes('mostrami') || t.includes('zeig mir') ||
           t.includes('routine now') || t.includes('ahora');
  }

  /* ── Detecta chips post-cámara ──────────────────────────── */
  function esChipPostCamara (texto) {
    const t = texto.toLowerCase();
    // "📸 Sí, analiza mi rostro" / "📸 Yes, analyze my face" / etc.
    // "✨ Ver mi rutina ya" / "✨ Show me my routine" / etc.
    return (t.includes('analiza') && t.includes('rostro')) ||
           (t.includes('analyze') && t.includes('face'))  ||
           (t.includes('analyser') && t.includes('visage')) ||
           (t.includes('analisar') && t.includes('rosto')) ||
           (t.includes('analysier') && t.includes('gesicht')) ||
           (t.includes('analizza') && t.includes('viso'))  ||
           (t.includes('ver mi rutina ya'))                ||
           (t.includes('show me my routine'))              ||
           (t.includes('voir ma routine'))                 ||
           (t.includes('ver minha rotina'))                ||
           (t.includes('routine jetzt'))                   ||
           (t.includes('mostrami la mia routine'));
  }

  /* ── Maneja chips post-cámara ───────────────────────────── */
  async function manejarChipPostCamara (texto) {
    const idioma = detectarIdioma();
    ocultarChips();

    // ── Sprint 2: Chip "📸 Analyze my skin" → abrir KOI Vision ──
    const esAnalisis = texto.startsWith('📸') || texto.includes('📸') ||
                       texto.toLowerCase().includes('rostro') ||
                       texto.toLowerCase().includes('face')   ||
                       texto.toLowerCase().includes('visage') ||
                       texto.toLowerCase().includes('rosto')  ||
                       texto.toLowerCase().includes('gesicht')||
                       texto.toLowerCase().includes('viso');

    if (esAnalisis && typeof window.koiVision !== 'undefined') {
      // ── KOI Vision está disponible — abrir el módulo de cámara ──
      // Exponer la URL del Worker al módulo de visión
      window.KOI_VISION_WORKER_URL = KOI_CONFIG.workerUrl.replace('/chat', '/vision');

      // Registrar el callback ANTES de abrir (el modal lo llama al cerrar).
      // Pasar flag _visionResultHandled para evitar doble ejecución si
      // el evento global también dispara (ambos apuntan a la misma función).
      window.koiVision.onResultado(function(data) {
        if (_visionResultHandled) return;
        _visionResultHandled = true;
        manejarResultadoVision(data);
        setTimeout(function() { _visionResultHandled = false; }, 2000);
      });

      // Fallback alternativo (si el usuario cancela la cámara)
      window.koiVisionAlternativo = function() {
        // Ir directo al flujo de reveal
        KOI_STATE.revealPhase = 'email';
        manejarChipDescubrirRutina(idioma);
      };

      // Abrir el modal de cámara con el contexto del quiz
      window.koiVision.abrir(KOI_STATE.contexto);
      return;
    }

    if (esAnalisis) {
      // ── Coming soon — pero con entusiasmo, no disculpa
      const msgs = {
        es: `Me encanta que quieras ir más lejos 📸\n\nEl módulo de análisis facial está en construcción ahora mismo — lo estamos entrenando con miles de tipos de piel para que sea realmente preciso, no solo bonito.\n\nMientras tanto, tu rutina ya está lista y es sólida. ¿La vemos?`,
        en: `Love that you want to go deeper 📸\n\nThe facial analysis module is being built right now — we're training it on thousands of skin types to make it genuinely accurate, not just pretty.\n\nIn the meantime, your routine is ready and it's solid. Want to see it?`,
        fr: `J'adore que vous vouliez aller plus loin 📸\n\nLe module d'analyse faciale est en cours de construction — nous l'entraînons sur des milliers de types de peau pour qu'il soit vraiment précis.\n\nEn attendant, votre routine est prête. On y va ?`,
        pt: `Adoro que queira ir mais fundo 📸\n\nO módulo de análise facial está sendo desenvolvido agora — estamos treinando com milhares de tipos de pele para ser genuinamente preciso.\n\nEnquanto isso, sua rotina está pronta. Quer ver?`,
        de: `Ich liebe es, dass du tiefer gehen möchtest 📸\n\nDas Gesichtsanalyse-Modul wird gerade gebaut — wir trainieren es mit tausenden Hauttypen für echte Genauigkeit.\n\nIn der Zwischenzeit ist deine Routine fertig. Sehen wir sie uns an?`,
        it: `Adoro che tu voglia andare più in profondità 📸\n\nIl modulo di analisi facciale è in costruzione — lo stiamo addestrando su migliaia di tipi di pelle per essere davvero preciso.\n\nNel frattempo, la tua routine è pronta. La vediamo?`,
      };
      const msg    = msgs[idioma] || msgs['en'];
      const textEl = agregarMensaje('koi', '');
      if (textEl) await escribirConEfecto(textEl, msg);
      KOI_STATE.historial.push({ role: 'assistant', content: msg });
      guardarHistorialLocal();
      // Ofrecer reveal como único siguiente paso
      setTimeout(() => mostrarChips('reveal'), 400);

    } else {
      // ── Usuario elige ver rutina directamente → revelar sin email gate
      await revelarRutinaConKOI('');
    }
  }

  function setInputHabilitado (habilitado) {
    const input   = document.getElementById('koi-input');
    const sendBtn = document.getElementById('koi-send-btn');
    if (input)   input.disabled   = !habilitado;
    if (sendBtn) sendBtn.disabled = !habilitado;
  }

  // Oculta/muestra el área completa del input (barra + botón enviar).
  // Usar cuando no tiene sentido que el usuario escriba todavía
  // (ej: antes de ver la rutina). Más claro que deshabilitar en gris.
  function setInputAreaVisible (visible) {
    const area = document.querySelector('.koi-input-area');
    if (!area) return;
    if (visible) {
      area.classList.remove('koi-input-area--hidden');
    } else {
      area.classList.add('koi-input-area--hidden');
    }
  }

  /* ══════════════════════════════════════════════════════════
     LLAMADA AL CLOUDFLARE WORKER (→ OpenAI GPT-4o)
     ══════════════════════════════════════════════════════════ */
  async function obtenerRespuestaKOI (preguntaUsuario) {
    mostrarTyping();

    try {
      const payload = {
        mensaje:   preguntaUsuario,
        historial: KOI_STATE.historial.slice(-KOI_CONFIG.maxHistory),
        contexto:  construirContexto(),
      };

      const response = await fetch(KOI_CONFIG.workerUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const respuesta = data.respuesta || data.content || '';

      ocultarTyping();

      // Renderizar respuesta con efecto de escritura
      const textEl = agregarMensaje('koi', '');
      if (textEl && respuesta) {
        await escribirConEfecto(textEl, respuesta);
      }

      // Guardar en historial
      KOI_STATE.historial.push({ role: 'assistant', content: respuesta });
      guardarHistorialLocal();

      // Mostrar chips de objeciones si el historial es largo
      if (KOI_STATE.msgCount >= 4) {
        setTimeout(() => mostrarChips('objeciones'), 600);
      }

    } catch (error) {
      console.error('[KOI] Error contacting the Worker:', error);
      ocultarTyping();

      // Mensaje de fallback amigable
      const textEl = agregarMensaje('koi', '');
      if (textEl) {
        await escribirConEfecto(
          textEl,
          "I ran into a brief technical issue — could you repeat your question? I want to make sure I give you a complete answer."
        );
      }
    }
  }

  /* ══════════════════════════════════════════════════════════
     CONSTRUCCIÓN DEL CONTEXTO PARA EL WORKER
     ══════════════════════════════════════════════════════════ */
  function construirContexto () {
    const ctx = KOI_STATE.contexto;
    if (!ctx) return {};

    // Serializar productos seleccionados
    const productosStr = (ctx.productos || [])
      .map(p => `- ${p.nombre} ($${p.precio}) — Paso: ${p.paso || 'N/A'}`)
      .join('\n');

    // Serializar rutina
    const rutinaAM = (ctx.rutinaAM || []).join(' → ');
    const rutinaPM = (ctx.rutinaPM || []).join(' → ');

    return {
      perfil_id:          ctx.perfil?.id          || '',
      perfil_nombre:      ctx.perfil?.nombre       || '',
      perfil_descripcion: ctx.perfil?.descripcion  || '',
      caracteristicas:    (ctx.perfil?.tags || []).join(', '),
      rutina_am:          rutinaAM,
      rutina_pm:          rutinaPM,
      productos:          productosStr,
      presupuesto:        ctx.presupuesto          || '',
      experiencia:        ctx.experiencia          || '',
      total_carrito:      ctx.totalCarrito         || 0,
    };
  }

  /* ══════════════════════════════════════════════════════════
     EFECTO DE ESCRITURA (simula streaming humanizado)
     ══════════════════════════════════════════════════════════ */
  async function escribirConEfecto (elemento, texto) {
    // Convertir markdown básico a HTML
    const html = markdownBasico(texto);
    elemento.innerHTML = '';

    // Crear contenedor temporal para parsear el HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const textoPlano = temp.textContent || temp.innerText || '';

    // Cursor parpadeante
    const cursor = document.createElement('span');
    cursor.className = 'koi-cursor';
    elemento.appendChild(cursor);

    let i = 0;
    const velocidad = textoPlano.length > 200 ? 12 : 18; // ms por carácter

    await new Promise(resolve => {
      const interval = setInterval(() => {
        if (i >= textoPlano.length) {
          clearInterval(interval);
          // Reemplazar texto plano con HTML formateado
          elemento.innerHTML = html;
          resolve();
          return;
        }

        // Escribir letra por letra
        cursor.remove();
        elemento.innerHTML = markdownBasico(textoPlano.slice(0, i + 1));
        elemento.appendChild(cursor);
        scrollAlFinal();
        i++;
      }, velocidad);
    });

    // Quitar cursor al terminar
    const cur = elemento.querySelector('.koi-cursor');
    if (cur) cur.remove();
  }

  /* ── Markdown básico → HTML ───────────────────────────── */
  function markdownBasico (texto) {
    return texto
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g,     '<em>$1</em>')
      .replace(/\n/g,            '<br>')
      .replace(/📍|✨|🌸|💆|☀️|🌙|✅|❌|🔒|💡/g, match => match);
  }

  /* ── Utilidad: pausa ────────────────────────────────────── */
  function pausa (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /* ══════════════════════════════════════════════════════════
     INTEGRACIÓN CON shatokb-quiz.js
     Escucha el evento custom que dispara el quiz cuando
     muestra el resultado, y arranca KOI automáticamente.

     GUARD ANTI-DUPLICACIÓN:
     shatokbIniciarKOI ya tiene "if (KOI_STATE.isReady) return" como
     primera línea — eso basta para bloquear cualquier segunda llamada,
     sin importar la ruta (CustomEvent o llamada directa desde quiz.js).
     ══════════════════════════════════════════════════════════ */

  // Ruta 1: CustomEvent 'shatokb:resultado' disparado por shatokb-quiz.js
  document.addEventListener('shatokb:resultado', function (e) {
    window.shatokbIniciarKOI(e.detail || {});
  });

  // Fallback: si el resultado ya está visible al cargar la página
  document.addEventListener('DOMContentLoaded', function () {
    const resultado = document.querySelector('.shatokb-resultado');
    if (resultado && resultado.style.display !== 'none') {
      const ctx = obtenerContextoLocal();
      if (ctx) window.shatokbIniciarKOI(ctx);
    }
  });

  /* ══════════════════════════════════════════════════════════
     ❓ BOTÓN POR PRODUCTO — API pública
     Llamado por shatokb-quiz.js al hacer clic en el botón ❓
     de cada tarjeta de producto en la rutina.

     @param {string} nombreProducto  Nombre del producto
     @param {string} paso            Nombre del paso (ej: "Cleanser AM/PM")
     @param {string} precio          Precio formateado (ej: "$28.00")
     ══════════════════════════════════════════════════════════ */
  window.shatokbPreguntarProducto = function (nombreProducto, paso, precio) {
    const idioma = detectarIdioma();

    // ── 1. Si KOI aún no está listo, intentar iniciarlo ───────
    if (!KOI_STATE.isReady) {
      const ctx = obtenerContextoLocal();
      if (ctx && typeof window.shatokbIniciarKOI === 'function') {
        window.shatokbIniciarKOI(ctx);
        // Esperar a que KOI esté listo y reintentar
        setTimeout(() => window.shatokbPreguntarProducto(nombreProducto, paso, precio), 2800);
      }
      return;
    }

    // ── 2. Preguntas localizadas ───────────────────────────────
    const preguntas = {
      es: `¿Por qué elegiste "${nombreProducto}" para mi perfil exactamente? ¿Qué hace por mi tipo de piel específico?`,
      en: `Why did you choose "${nombreProducto}" specifically for my profile? What does it do for my skin type?`,
      fr: `Pourquoi avez-vous choisi "${nombreProducto}" spécifiquement pour mon profil ? Qu'est-ce qu'il fait pour mon type de peau ?`,
      pt: `Por que você escolheu "${nombreProducto}" especificamente para o meu perfil? O que ele faz pelo meu tipo de pele?`,
      de: `Warum hast du "${nombreProducto}" speziell für mein Profil gewählt? Was macht es für meinen Hauttyp?`,
      it: `Perché hai scelto "${nombreProducto}" specificatamente per il mio profilo? Cosa fa per il mio tipo di pelle?`,
    };
    const pregunta = preguntas[idioma] || preguntas['en'];

    // ── 3. Hacer scroll al panel KOI ──────────────────────────
    const panel = document.getElementById('shatokb-koi-wrapper');
    if (panel) {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ── 4. Inyectar y enviar la pregunta ──────────────────────
    // Pequeño delay para que el scroll termine antes de que KOI responda
    setTimeout(function () {
      const input = document.getElementById('koi-input');
      if (input && !KOI_STATE.isTyping) {
        input.value = pregunta;
        enviarMensajeUsuario();
      }
    }, panel ? 400 : 0);
  };

  /* ══════════════════════════════════════════════════════════
     INTERCEPTOR DE CARRITO
     Llamado por shatokbAddAllToCart() antes de proceder.
     Si el email ya fue capturado → ejecuta el callback directo.
     Si no → KOI pide el email con el contexto de "te envío
     tu Skin Report" y luego ejecuta el callback.
     ══════════════════════════════════════════════════════════ */
  window.shatokbInterceptarCarrito = function (callbackProcederAlCarrito) {
    // Si ya tenemos email, no interrumpir — ir directo al carrito
    if (KOI_STATE.emailCaptured) {
      callbackProcederAlCarrito();
      return;
    }

    const idioma = detectarIdioma();

    // Scroll al chat para que el usuario vea la interacción
    const panel = document.getElementById('shatokb-koi-wrapper');
    if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Pequeño delay para que el scroll ocurra antes del mensaje
    setTimeout(async function () {

      // Mensaje de KOI ofreciendo el Skin Report
      const mensajes = {
        es: `¡Perfecto, lista para ir al carrito! 🛒\n\nAntes de enviarte, quiero prepararte algo: tu **Skin Report personalizado** — incluye tu análisis de piel, el por qué de cada producto y un **manual paso a paso** para usarlos correctamente juntos.\n\nTe lo envío ahora mismo a tu email. ¿Cuál es?`,
        en: `Perfect, ready to go to cart! 🛒\n\nBefore I send you over, I want to prepare something for you: your **personalized Skin Report** — it includes your skin analysis, the reason behind each product, and a **step-by-step guide** on how to use them together correctly.\n\nI'll send it to your email right now. What is it?`,
        fr: `Parfait, prêt pour le panier ! 🛒\n\nAvant de vous y envoyer, je veux vous préparer quelque chose : votre **Skin Report personnalisé** — il inclut votre analyse de peau, la raison de chaque produit et un **guide étape par étape** pour les utiliser correctement ensemble.\n\nJe vous l'envoie par email maintenant. Lequel ?`,
        pt: `Perfeito, pronto para o carrinho! 🛒\n\nAntes de te enviar, quero preparar algo: seu **Skin Report personalizado** — inclui sua análise de pele, o motivo de cada produto e um **guia passo a passo** para usá-los corretamente juntos.\n\nVou enviar agora para o seu email. Qual é?`,
        de: `Perfekt, bereit für den Warenkorb! 🛒\n\nBevor ich dich weiterleite, möchte ich etwas für dich vorbereiten: deinen **persönlichen Skin Report** — er enthält deine Hautanalyse, den Grund für jedes Produkt und eine **Schritt-für-Schritt-Anleitung** zur richtigen Anwendung.\n\nIch schicke ihn dir gleich per E-Mail. Wie lautet sie?`,
        it: `Perfetto, pronto per il carrello! 🛒\n\nPrima di mandarti lì, voglio prepararti qualcosa: il tuo **Skin Report personalizzato** — include la tua analisi della pelle, il motivo di ogni prodotto e una **guida passo dopo passo** su come usarli correttamente insieme.\n\nTe lo mando ora via email. Qual è?`,
      };

      const msg    = mensajes[idioma] || mensajes['en'];
      const textEl = agregarMensaje('koi', '');
      if (textEl) await escribirConEfecto(textEl, msg);
      KOI_STATE.historial.push({ role: 'assistant', content: msg });
      guardarHistorialLocal();

      // Inyectar el campo de email adaptado para este contexto
      setTimeout(() => inyectarEmailGateCarrito(callbackProcederAlCarrito), 300);

    }, panel ? 500 : 0);
  };

  function inyectarEmailGateCarrito (callbackProcederAlCarrito) {
    const container = document.getElementById('koi-messages');
    if (!container || document.getElementById('koi-email-gate')) return;

    const idioma = detectarIdioma();
    const ui = {
      es: { placeholder: 'tu@email.com', btn: 'Enviar y continuar →', note: '🔒 Solo para tu Skin Report. Sin spam.' },
      en: { placeholder: 'you@email.com', btn: 'Send & continue →',   note: '🔒 Only for your Skin Report. No spam.' },
      fr: { placeholder: 'vous@email.com', btn: 'Envoyer et continuer →', note: '🔒 Uniquement pour votre Skin Report.' },
      pt: { placeholder: 'voce@email.com', btn: 'Enviar e continuar →', note: '🔒 Apenas para o seu Skin Report. Sem spam.' },
      de: { placeholder: 'du@email.com', btn: 'Senden & weiter →',    note: '🔒 Nur für deinen Skin Report. Kein Spam.' },
      it: { placeholder: 'tu@email.com', btn: 'Invia e continua →',   note: '🔒 Solo per il tuo Skin Report.' },
    }[idioma] || { placeholder: 'you@email.com', btn: 'Send & continue →', note: '🔒 No spam.' };

    // Texto del botón "skip" por idioma
    const skipTexts = {
      es: 'Prefiero ir directo al carrito',
      en: 'Skip, take me to cart',
      fr: 'Passer, aller au panier',
      pt: 'Pular, ir para o carrinho',
      de: 'Überspringen, zum Warenkorb',
      it: 'Salta, vai al carrello',
    };
    const skipText = skipTexts[idioma] || skipTexts['en'];

    const gate = document.createElement('div');
    gate.id        = 'koi-email-gate';
    gate.className = 'koi-email-gate';
    gate.innerHTML = `
      <input
        type="email"
        id="koi-email-input"
        class="koi-email-input"
        placeholder="${ui.placeholder}"
        autocomplete="email"
        inputmode="email"
      />
      <button class="koi-email-btn" id="koi-email-btn">${ui.btn}</button>
      <p class="koi-email-note">${ui.note}</p>
      <button class="koi-email-skip" id="koi-email-skip">${skipText}</button>
    `;

    container.appendChild(gate);
    scrollAlFinal();
    setInputHabilitado(false);

    setTimeout(() => {
      const inp = document.getElementById('koi-email-input');
      if (inp && window.innerWidth > 768) inp.focus();
    }, 200);

    const inp     = document.getElementById('koi-email-input');
    const btn     = document.getElementById('koi-email-btn');
    const skipBtn = document.getElementById('koi-email-skip');

    async function confirmarEmailCarrito () {
      if (!inp) return;
      const email  = inp.value.trim();
      const idioma = detectarIdioma();

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        inp.classList.add('koi-email-input--error');
        setTimeout(() => inp.classList.remove('koi-email-input--error'), 800);
        return;
      }

      // Guardar email
      KOI_STATE.emailCaptured = email;
      try { localStorage.setItem('shatokb_email', email); } catch (_) {}
      shatokbEnviarEmailShopify(email);

      // ── Generar y enviar el Skin Report via Klaviyo ──────
      enviarSkinReport(email);

      // Cerrar gate
      gate.classList.add('koi-email-gate--confirmed');
      setTimeout(() => { if (gate.parentNode) gate.remove(); }, 400);
      agregarMensaje('user', email);
      setInputHabilitado(true);

      // Mensaje de confirmación breve antes del carrito
      const confirmaciones = {
        es: '¡Listo! Te lo envío en breve. Ahora sí, aquí está tu carrito 🛒',
        en: 'Done! Sending it shortly. Now, here\'s your cart 🛒',
        fr: 'Fait ! Je vous l\'envoie dans un instant. Voici votre panier 🛒',
        pt: 'Feito! Enviando em breve. Agora, aqui está seu carrinho 🛒',
        de: 'Erledigt! Ich schicke es dir gleich. Hier ist dein Warenkorb 🛒',
        it: 'Fatto! Te lo invio a breve. Ecco il tuo carrello 🛒',
      };
      const confirmMsg = confirmaciones[idioma] || confirmaciones['en'];
      const textEl = agregarMensaje('koi', '');
      if (textEl) await escribirConEfecto(textEl, confirmMsg, 18);

      // Proceder al carrito después del mensaje
      setTimeout(callbackProcederAlCarrito, 800);
    }

    function saltarAlCarrito () {
      gate.classList.add('koi-email-gate--confirmed');
      setTimeout(() => { if (gate.parentNode) gate.remove(); }, 400);
      setInputHabilitado(true);
      callbackProcederAlCarrito();
    }

    if (btn)     btn.addEventListener('click', confirmarEmailCarrito);
    if (inp)     inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); confirmarEmailCarrito(); } });
    if (skipBtn) skipBtn.addEventListener('click', saltarAlCarrito);
  }

})();
