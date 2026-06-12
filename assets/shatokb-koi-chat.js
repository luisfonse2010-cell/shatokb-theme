/**
 * ============================================================
 * SHATOKB · KOI — Experta K-Beauty con IA
 * Archivo: assets/shatokb-koi-chat.js
 * Version: 1.1 — English UI + workerUrl updated
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
    workerUrl: 'https://koi-proxy.luisfonse2010.workers.dev/chat',

    // Límite de mensajes en el historial (memoria de conversación)
    maxHistory: 20,

    // Delay antes de que KOI aparezca (ms)
    appearDelay: 1800,

    // Delay antes del primer mensaje de KOI (ms)
    firstMsgDelay: 600,
  };

  /* ── Estado global de KOI ───────────────────────────────── */
  const KOI_STATE = {
    historial: [],          // [{role, content}]
    contexto: null,         // perfil del quiz
    isTyping: false,        // KOI está escribiendo
    isReady: false,         // chat inicializado
    msgCount: 0,            // contador de mensajes enviados
  };

  /* ── Chips localizados por idioma ───────────────────────── */
  const KOI_CHIPS_I18N = {
    en: {
      bienvenida:  ['Walk me through my routine', 'Why these specific products?', 'Explain the key ingredients', 'How long until I see results?'],
      post_rutina: ['What order do I apply them?', 'AM vs PM — what changes?', 'Are any of these pregnancy-safe?', 'Which one should I start with?'],
      objeciones:  ['Which product matters most?', "I've never tried K-Beauty", 'Can I combine these ingredients?', 'I have a different question'],
    },
    es: {
      bienvenida:  ['Explícame mi rutina paso a paso', '¿Por qué estos productos?', 'Explícame los ingredientes clave', '¿Cuánto tiempo hasta ver resultados?'],
      post_rutina: ['¿En qué orden los aplico?', 'AM vs PM — ¿qué cambia?', '¿Son seguros en el embarazo?', '¿Con cuál empiezo?'],
      objeciones:  ['¿Cuál es el producto más importante?', 'Nunca he probado K-Beauty', '¿Puedo combinar estos ingredientes?', 'Tengo otra pregunta'],
    },
    fr: {
      bienvenida:  ['Expliquez-moi ma routine', 'Pourquoi ces produits ?', 'Expliquez les ingrédients clés', 'Combien de temps pour voir les résultats ?'],
      post_rutina: ['Dans quel ordre les appliquer ?', 'Matin vs soir — qu\'est-ce qui change ?', 'Sont-ils sûrs pendant la grossesse ?', 'Par lequel commencer ?'],
      objeciones:  ['Quel produit est le plus important ?', "Je n'ai jamais essayé la K-Beauty", 'Puis-je combiner ces ingrédients ?', "J'ai une autre question"],
    },
    pt: {
      bienvenida:  ['Explique minha rotina passo a passo', 'Por que esses produtos?', 'Explique os ingredientes principais', 'Quanto tempo para ver resultados?'],
      post_rutina: ['Em que ordem aplicar?', 'AM vs PM — o que muda?', 'São seguros na gravidez?', 'Com qual devo começar?'],
      objeciones:  ['Qual produto é mais importante?', 'Nunca experimentei K-Beauty', 'Posso combinar esses ingredientes?', 'Tenho outra pergunta'],
    },
    de: {
      bienvenida:  ['Erkläre mir meine Routine', 'Warum genau diese Produkte?', 'Erkläre die wichtigsten Inhaltsstoffe', 'Wann sehe ich erste Ergebnisse?'],
      post_rutina: ['In welcher Reihenfolge auftragen?', 'Morgen vs. Abend — was ändert sich?', 'Sind sie in der Schwangerschaft sicher?', 'Mit welchem soll ich anfangen?'],
      objeciones:  ['Welches Produkt ist am wichtigsten?', 'Ich habe K-Beauty noch nie ausprobiert', 'Kann ich diese Inhaltsstoffe kombinieren?', 'Ich habe eine andere Frage'],
    },
    it: {
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
    if (KOI_STATE.isReady) return;

    // Guardar contexto del quiz
    KOI_STATE.contexto = contextoQuiz || obtenerContextoLocal();

    // Crear y montar el DOM del chat
    const wrapper = crearDOM();
    if (!wrapper) return;

    // Animar entrada después del delay
    setTimeout(() => {
      wrapper.classList.add('koi--visible');
      KOI_STATE.isReady = true;

      // Primer mensaje proactivo de KOI
      setTimeout(() => {
        enviarMensajeKOI_proactivo();
      }, KOI_CONFIG.firstMsgDelay);
    }, KOI_CONFIG.appearDelay);
  };

  /* ── Obtener contexto del localStorage como fallback ────── */
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
     PRIMER MENSAJE PROACTIVO DE KOI
     Generado por GPT-4o para garantizar el idioma correcto
     ══════════════════════════════════════════════════════════ */
  async function enviarMensajeKOI_proactivo () {
    const ctx          = KOI_STATE.contexto;
    const perfilNombre = ctx?.perfil?.nombre   || 'your skin profile';
    const numProductos = ctx?.productos?.length || 0;
    const idioma       = detectarIdioma();

    // Mapa de nombres de idioma en inglés para el prompt interno
    const nombreIdioma = {
      es: 'Spanish', en: 'English', fr: 'French', pt: 'Portuguese',
      de: 'German',  it: 'Italian', ko: 'Korean', ja: 'Japanese',
      zh: 'Chinese', ar: 'Arabic', nl: 'Dutch',  pl: 'Polish', ru: 'Russian'
    }[idioma] || 'English';

    // Instrucción especial al Worker: generar el greeting de apertura
    // en el idioma detectado del navegador del usuario
    const mensajeInterno = `[SYSTEM: Generate KOI's opening greeting message.]
Browser language detected: ${nombreIdioma}.
Respond ENTIRELY in ${nombreIdioma}.
Skin profile: ${perfilNombre}.
Number of recommended products: ${numProductos}.
Introduce yourself as KOI. Say you have 9+ years of experience at shatokb. IMPORTANT: use EXACTLY "9+" — never say "30", never say "30 años", never say "decades", never say any other number of years.
Briefly acknowledge their skin profile by name.
Tell them the products chosen for them were selected for a specific reason.
Hint that there is one important thing about their skin type most people get wrong — and offer to explain.
End with a question offering 3 paths: routine order, a specific product, or the ingredient science.
Keep it under 100 words. No filler. No emojis unless one adds meaning.`;

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

      const data         = await response.json();
      const mensajeKOI   = data.respuesta || data.content || '';

      ocultarTyping();

      const textEl = agregarMensaje('koi', '', true);
      if (textEl && mensajeKOI) {
        await escribirConEfecto(textEl, mensajeKOI);
      }

      // Guardar en historial
      KOI_STATE.historial.push({ role: 'assistant', content: mensajeKOI });

    } catch (err) {
      // Fallback local si el Worker falla en el greeting
      console.warn('[KOI] Greeting via Worker failed, using local fallback:', err);
      ocultarTyping();

      const fallbacks = {
        es: `Hola. Soy **KOI** — 9 años en ciencia de la piel y K-Beauty, aquí en shatokb para ayudarte a obtener resultados reales con tu rutina.\n\nHe revisado tu perfil **${perfilNombre}**. Los ${numProductos} productos seleccionados para ti no son al azar — cada uno fue elegido por una razón específica.\n\nHay algo sobre tu tipo de piel que la mayoría de la gente no sabe, y quiero asegurarme de que tú sí lo sepas antes de empezar.\n\n¿Por dónde empezamos — el orden de la rutina, un producto específico, o la ciencia detrás de tus resultados?`,
        en: `Hello. I'm **KOI** — 9 years in skin science and Korean beauty, here at shatokb to make sure you get real results.\n\nI've reviewed your **${perfilNombre}** profile. The ${numProductos} products selected for you aren't random — each one was chosen for a specific reason.\n\nThere's one thing about your skin type most people get wrong — and I want to make sure you know it before you start.\n\nWhere would you like to begin — the routine order, a specific product, or the ingredient science behind your results?`,
        fr: `Bonjour. Je suis **KOI** — 9 ans en science de la peau et K-Beauty, ici chez shatokb pour vous aider à obtenir de vrais résultats.\n\nJ'ai analysé votre profil **${perfilNombre}**. Les ${numProductos} produits sélectionnés ne sont pas aléatoires — chacun a été choisi pour une raison précise.\n\nIl y a une chose sur votre type de peau que la plupart des gens ne savent pas — je veux m'assurer que vous, vous le sachiez.\n\nPar où commençons-nous — l'ordre de la routine, un produit précis, ou la science des ingrédients ?`,
        pt: `Olá. Sou **KOI** — 9 anos em ciência da pele e K-Beauty, aqui na shatokb para garantir resultados reais.\n\nAnalisei o seu perfil **${perfilNombre}**. Os ${numProductos} produtos selecionados não são aleatórios — cada um foi escolhido por uma razão específica.\n\nHá algo sobre o seu tipo de pele que a maioria das pessoas não sabe — e quero ter certeza que você saiba antes de começar.\n\nPor onde começamos — a ordem da rotina, um produto específico, ou a ciência dos ingredientes?`,
      };

      const mensajeFallback = fallbacks[idioma] || fallbacks['en'];
      const textEl          = agregarMensaje('koi', '', true);
      if (textEl) await escribirConEfecto(textEl, mensajeFallback);
      KOI_STATE.historial.push({ role: 'assistant', content: mensajeFallback });
    }

    // Chips de bienvenida después del greeting
    setTimeout(() => mostrarChips('bienvenida'), 400);
  }

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

  async function enviarDesdeChip (texto) {
    const input = document.getElementById('koi-input');
    if (input) {
      input.value = texto;
      await enviarMensajeUsuario();
    }
  }

  function setInputHabilitado (habilitado) {
    const input   = document.getElementById('koi-input');
    const sendBtn = document.getElementById('koi-send-btn');
    if (input)   input.disabled   = !habilitado;
    if (sendBtn) sendBtn.disabled = !habilitado;
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
     ══════════════════════════════════════════════════════════ */
  document.addEventListener('shatokb:resultado', function (e) {
    const contexto = e.detail || {};
    window.shatokbIniciarKOI(contexto);
  });

  // Fallback: si el resultado ya está visible al cargar
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

})();
