/**
 * ============================================================
 * SHATOKB · KOI Cart Widget
 * Archivo: assets/shatokb-koi-cart.js
 * Version: 1.0
 *
 * Widget de KOI que aparece en /cart cuando el usuario
 * viene del quiz. Resuelve objeciones, da confianza,
 * aumenta conversión.
 *
 * Requisitos:
 *   - localStorage 'shatokb_resultado' debe existir (del quiz)
 *   - Cloudflare Worker activo en KOI_CART_CONFIG.workerUrl
 * ============================================================
 */

(function () {
  'use strict';

  /* ── Configuración ── */
  const KOI_CART_CONFIG = {
    workerUrl:   'https://koi-proxy.luisfonse2010.workers.dev/chat',
    appearDelay: 2200,   // ms antes de que aparezca el widget
    maxHistory:  16,
  };

  /* ── Estado ── */
  const KOI_CART_STATE = {
    historial:      [],
    historialPrevio: [],
    contexto:       null,
    cartItems:      [],
    cartTotal:      0,
    isTyping:       false,
    isOpen:         false,
    isReady:        false,
    msgCount:       0,
  };

  /* ── Solo correr en /cart ── */
  function esCartPage() {
    return window.location.pathname === '/cart' ||
           window.location.pathname.startsWith('/cart');
  }

  /* ── Obtener contexto del quiz desde localStorage ── */
  function obtenerContexto() {
    try {
      const raw = localStorage.getItem('shatokb_resultado');
      return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
  }

  /* ── Obtener historial previo de conversación con KOI ── */
  function obtenerHistorialPrevio() {
    try {
      const raw = localStorage.getItem('shatokb_historial');
      return raw ? JSON.parse(raw) : [];
    } catch(e) { return []; }
  }

  /* ── Obtener items del carrito desde Shopify ── */
  async function obtenerCarrito() {
    try {
      const res  = await fetch('/cart.js');
      const data = await res.json();
      KOI_CART_STATE.cartTotal = (data.total_price / 100).toFixed(2);
      KOI_CART_STATE.cartItems = (data.items || []).map(i => ({
        nombre: i.product_title,
        variante: i.variant_title,
        precio: (i.price / 100).toFixed(2),
        qty: i.quantity,
      }));
      return data;
    } catch(e) { return null; }
  }

  /* ── Detectar idioma ── */
  function detectarIdioma() {
    const ctx = KOI_CART_STATE.contexto;
    if (ctx && ctx.idioma) return ctx.idioma;
    const lang = (navigator.language || 'en').toLowerCase();
    if (lang.startsWith('es')) return 'es';
    if (lang.startsWith('fr')) return 'fr';
    if (lang.startsWith('pt')) return 'pt';
    if (lang.startsWith('de')) return 'de';
    if (lang.startsWith('it')) return 'it';
    return 'en';
  }

  /* ══════════════════════════════════════════════════════════
     CREAR DOM DEL WIDGET
     ══════════════════════════════════════════════════════════ */
  function crearWidget() {
    if (document.getElementById('koi-cart-widget')) return;

    const idioma        = detectarIdioma();
    const ctx           = KOI_CART_STATE.contexto;
    const perfil        = ctx ? (ctx.perfil_nombre || ctx.perfilNombre || ctx.perfil?.nombre || '') : '';
    const tieneHistorial = KOI_CART_STATE.historialPrevio && KOI_CART_STATE.historialPrevio.length > 0;

    // ── 3 niveles de greeting:
    // 1. historial previo → "Bienvenida de vuelta" (vino del quiz KOI)
    // 2. perfil sin historial → "Vi tu rutina para X"
    // 3. sin perfil ni historial → genérico
    const i18n = {
      es: {
        badge:       'KOI · Experta K-Beauty',
        greeting:    tieneHistorial
          ? `Bienvenida de vuelta 🌸 Casi lista. Tienes $${KOI_CART_STATE.cartTotal} en productos que seleccioné para tu piel${perfil ? ' de **' + perfil + '**' : ''}. ¿Alguna duda de última hora antes del checkout?`
          : perfil
            ? `Hola 🌸 Vi que tienes tu rutina para **${perfil}** lista — $${KOI_CART_STATE.cartTotal} en productos seleccionados por mí. ¿Tienes alguna duda antes de hacer checkout?`
            : `Hola 🌸 Veo que estás a punto de completar tu compra. Soy KOI — si tienes alguna pregunta sobre los productos o cómo usarlos juntos, estoy aquí.`,
        placeholder: 'Escribe tu pregunta...',
        chips: tieneHistorial
          ? ['¿Cómo los aplico juntos?', '¿Son compatibles?', '¿Cuándo veré resultados?', 'Recuérdame el orden']
          : ['¿Cómo los aplico juntos?', '¿Son compatibles?', '¿Cuándo veré resultados?', '¿Cuál es el más importante?'],
        minimize: 'Minimizar',
        poweredBy: 'KOI · IA K-Beauty · shatokb.com',
      },
      en: {
        badge:       'KOI · K-Beauty Expert',
        greeting:    tieneHistorial
          ? `Welcome back 🌸 Almost there. You have $${KOI_CART_STATE.cartTotal} in products I picked for your${perfil ? ' **' + perfil + '**' : ''} skin. Any last questions before checkout?`
          : perfil
            ? `Hi 🌸 I see your routine for **${perfil}** is ready — $${KOI_CART_STATE.cartTotal} in products I selected for you. Any questions before checkout?`
            : `Hi 🌸 I see you're about to complete your purchase. I'm KOI — if you have any questions about the products or how to use them together, I'm here.`,
        placeholder: 'Ask me anything...',
        chips: tieneHistorial
          ? ['How do I layer these?', 'Are these compatible?', 'When will I see results?', 'Remind me the order']
          : ['How do I layer these?', 'Are these compatible?', 'When will I see results?', 'Which one matters most?'],
        minimize: 'Minimize',
        poweredBy: 'KOI · K-Beauty AI · shatokb.com',
      },
      fr: {
        badge:       'KOI · Experte K-Beauty',
        greeting:    tieneHistorial
          ? `Bienvenue de retour 🌸 Vous y êtes presque. Vous avez $${KOI_CART_STATE.cartTotal} en produits que j'ai sélectionnés pour votre peau${perfil ? ' **' + perfil + '**' : ''}. Des questions de dernière minute ?`
          : perfil
            ? `Bonjour 🌸 Je vois que votre routine pour **${perfil}** est prête — $${KOI_CART_STATE.cartTotal} en produits. Des questions avant de passer commande ?`
            : `Bonjour 🌸 Je vois que vous êtes sur le point de finaliser votre achat. Je suis KOI — si vous avez des questions sur les produits, je suis là.`,
        placeholder: 'Posez votre question...',
        chips: ['Comment les superposer ?', 'Sont-ils compatibles ?', 'Quand verrai-je des résultats ?', 'Lequel est le plus important ?'],
        minimize: 'Réduire',
        poweredBy: 'KOI · IA K-Beauty · shatokb.com',
      },
      pt: {
        badge:       'KOI · Especialista K-Beauty',
        greeting:    tieneHistorial
          ? `Bem-vinda de volta 🌸 Quase lá. Você tem $${KOI_CART_STATE.cartTotal} em produtos que escolhi para sua pele${perfil ? ' **' + perfil + '**' : ''}. Alguma dúvida de última hora?`
          : perfil
            ? `Olá 🌸 Vejo que sua rotina para **${perfil}** está pronta — $${KOI_CART_STATE.cartTotal} em produtos. Alguma dúvida antes de finalizar?`
            : `Olá 🌸 Vejo que você está prestes a completar sua compra. Sou KOI — se tiver dúvidas sobre os produtos, estou aqui.`,
        placeholder: 'Faça sua pergunta...',
        chips: ['Como aplicar juntos?', 'São compatíveis?', 'Quando verei resultados?', 'Qual é o mais importante?'],
        minimize: 'Minimizar',
        poweredBy: 'KOI · IA K-Beauty · shatokb.com',
      },
      de: {
        badge:       'KOI · K-Beauty Expertin',
        greeting:    tieneHistorial
          ? `Willkommen zurück 🌸 Fast geschafft. Du hast $${KOI_CART_STATE.cartTotal} in Produkten, die ich für deine Haut${perfil ? ' **' + perfil + '**' : ''} ausgewählt habe. Letzte Fragen vor dem Checkout?`
          : perfil
            ? `Hallo 🌸 Ich sehe, deine Routine für **${perfil}** ist bereit — $${KOI_CART_STATE.cartTotal} in Produkten. Fragen vor dem Checkout?`
            : `Hallo 🌸 Ich sehe, du bist kurz vor dem Kauf. Ich bin KOI — bei Fragen zu den Produkten helfe ich gerne.`,
        placeholder: 'Frage stellen...',
        chips: ['Wie schichte ich sie?', 'Sind sie kompatibel?', 'Wann sehe ich Ergebnisse?', 'Welches ist am wichtigsten?'],
        minimize: 'Minimieren',
        poweredBy: 'KOI · K-Beauty KI · shatokb.com',
      },
      it: {
        badge:       'KOI · Esperta K-Beauty',
        greeting:    tieneHistorial
          ? `Bentornata 🌸 Ci siamo quasi. Hai $${KOI_CART_STATE.cartTotal} in prodotti che ho scelto per la tua pelle${perfil ? ' **' + perfil + '**' : ''}. Ultime domande prima del checkout?`
          : perfil
            ? `Ciao 🌸 Vedo che la tua routine per **${perfil}** è pronta — $${KOI_CART_STATE.cartTotal} in prodotti. Domande prima del checkout?`
            : `Ciao 🌸 Vedo che stai per completare il tuo acquisto. Sono KOI — se hai domande sui prodotti, sono qui.`,
        placeholder: 'Scrivi la tua domanda...',
        chips: ['Come li applico insieme?', 'Sono compatibili?', 'Quando vedrò risultati?', 'Qual è il più importante?'],
        minimize: 'Riduci',
        poweredBy: 'KOI · IA K-Beauty · shatokb.com',
      },
    };

    const t = i18n[idioma] || i18n['en'];

    const widget = document.createElement('div');
    widget.id        = 'koi-cart-widget';
    widget.className = 'koi-cart-widget koi-cart-widget--closed';
    widget.innerHTML = `
      <!-- Botón flotante (cuando está minimizado) -->
      <button class="koi-cart-fab" id="koi-cart-fab" aria-label="KOI K-Beauty Expert">
        <span class="koi-cart-fab__avatar">🌸 KOI</span>
        <span class="koi-cart-fab__label">K-Beauty Expert</span>
        <span class="koi-cart-fab__dot" id="koi-cart-dot"></span>
      </button>

      <!-- Panel del chat -->
      <div class="koi-cart-panel" id="koi-cart-panel" role="dialog" aria-label="KOI Chat">

        <!-- Header -->
        <div class="koi-cart-header">
          <div class="koi-cart-header__info">
            <div class="koi-cart-header__avatar">🌸</div>
            <div>
              <div class="koi-cart-header__name">KOI</div>
              <div class="koi-cart-header__status">
                <span class="koi-cart-status-dot"></span> Online
              </div>
            </div>
          </div>
          <button class="koi-cart-minimize" id="koi-cart-minimize" aria-label="${t.minimize}">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <!-- Mensajes -->
        <div class="koi-cart-messages" id="koi-cart-messages"></div>

        <!-- Chips de sugerencia -->
        <div class="koi-cart-chips" id="koi-cart-chips">
          ${t.chips.map(c => `<button class="koi-cart-chip">${c}</button>`).join('')}
        </div>

        <!-- Input -->
        <div class="koi-cart-input-row">
          <input
            type="text"
            id="koi-cart-input"
            class="koi-cart-input"
            placeholder="${t.placeholder}"
            maxlength="400"
            autocomplete="off"
          />
          <button class="koi-cart-send" id="koi-cart-send" aria-label="Send">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M14 8L2 2l2.5 6L2 14l12-6z" fill="currentColor"/>
            </svg>
          </button>
        </div>

        <!-- Footer -->
        <div class="koi-cart-footer">${t.poweredBy}</div>
      </div>
    `;

    document.body.appendChild(widget);

    // Guardar greeting para primer mensaje
    KOI_CART_STATE._greeting = t.greeting;
    KOI_CART_STATE._chips    = t.chips;

    // Eventos
    document.getElementById('koi-cart-fab').addEventListener('click', abrirWidget);
    document.getElementById('koi-cart-minimize').addEventListener('click', cerrarWidget);
    document.getElementById('koi-cart-send').addEventListener('click', enviarMensaje);
    document.getElementById('koi-cart-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensaje(); }
    });

    // Chips
    document.querySelectorAll('.koi-cart-chip').forEach(btn => {
      btn.addEventListener('click', function() {
        const input = document.getElementById('koi-cart-input');
        if (input) { input.value = this.textContent; enviarMensaje(); }
      });
    });

    KOI_CART_STATE.isReady = true;

    // Aparecer con delay y mostrar notificación
    setTimeout(() => {
      const fab = document.getElementById('koi-cart-fab');
      if (fab) fab.classList.add('koi-cart-fab--visible');
      // Dot de notificación
      setTimeout(() => {
        const dot = document.getElementById('koi-cart-dot');
        if (dot) dot.classList.add('koi-cart-dot--active');
      }, 800);
    }, KOI_CART_CONFIG.appearDelay);
  }

  /* ── Abrir widget ── */
  function abrirWidget() {
    const panel = document.getElementById('koi-cart-panel');
    const fab   = document.getElementById('koi-cart-fab');
    const dot   = document.getElementById('koi-cart-dot');
    if (!panel) return;

    panel.classList.add('koi-cart-panel--open');
    if (fab) fab.classList.add('koi-cart-fab--hidden');
    KOI_CART_STATE.isOpen = true;

    if (dot) dot.classList.remove('koi-cart-dot--active');

    // Focus al input
    setTimeout(() => {
      const input = document.getElementById('koi-cart-input');
      if (input && window.innerWidth > 768) input.focus();
    }, 350);

    // Primer mensaje de KOI si es la primera vez
    if (KOI_CART_STATE.msgCount === 0) {
      setTimeout(() => {
        mostrarMensajeKOI(KOI_CART_STATE._greeting);
      }, 400);
    }
  }

  /* ── Cerrar widget ── */
  function cerrarWidget() {
    const panel = document.getElementById('koi-cart-panel');
    const fab   = document.getElementById('koi-cart-fab');
    if (!panel) return;
    panel.classList.remove('koi-cart-panel--open');
    if (fab) fab.classList.remove('koi-cart-fab--hidden');
    KOI_CART_STATE.isOpen = false;
  }

  /* ── Mostrar mensaje de KOI ── */
  function mostrarMensajeKOI(texto) {
    const container = document.getElementById('koi-cart-messages');
    if (!container) return;

    // Ocultar chips después del primer mensaje real
    if (KOI_CART_STATE.msgCount > 0) {
      const chips = document.getElementById('koi-cart-chips');
      if (chips) chips.style.display = 'none';
    }

    const bubble = document.createElement('div');
    bubble.className = 'koi-cart-msg koi-cart-msg--koi';

    // Parsear markdown básico
    const html = texto
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');

    bubble.innerHTML = `<div class="koi-cart-bubble">${html}</div>`;
    container.appendChild(bubble);
    scrollAlFinal();

    KOI_CART_STATE.historial.push({ role: 'assistant', content: texto });
    KOI_CART_STATE.msgCount++;
  }

  /* ── Mostrar mensaje del usuario ── */
  function mostrarMensajeUsuario(texto) {
    const container = document.getElementById('koi-cart-messages');
    if (!container) return;

    const chips = document.getElementById('koi-cart-chips');
    if (chips) chips.style.display = 'none';

    const bubble = document.createElement('div');
    bubble.className = 'koi-cart-msg koi-cart-msg--user';
    bubble.innerHTML = `<div class="koi-cart-bubble">${texto}</div>`;
    container.appendChild(bubble);
    scrollAlFinal();
  }

  /* ── Indicador de typing ── */
  function mostrarTyping() {
    const container = document.getElementById('koi-cart-messages');
    if (!container || document.getElementById('koi-cart-typing')) return;

    const el = document.createElement('div');
    el.id        = 'koi-cart-typing';
    el.className = 'koi-cart-msg koi-cart-msg--koi';
    el.innerHTML = `<div class="koi-cart-bubble koi-cart-bubble--typing">
      <span></span><span></span><span></span>
    </div>`;
    container.appendChild(el);
    scrollAlFinal();
  }

  function ocultarTyping() {
    const el = document.getElementById('koi-cart-typing');
    if (el) el.remove();
  }

  /* ── Scroll al final ── */
  function scrollAlFinal() {
    const container = document.getElementById('koi-cart-messages');
    if (container) container.scrollTop = container.scrollHeight;
  }

  /* ── Enviar mensaje al Worker ── */
  async function enviarMensaje() {
    const input = document.getElementById('koi-cart-input');
    const send  = document.getElementById('koi-cart-send');
    if (!input || KOI_CART_STATE.isTyping) return;

    const texto = input.value.trim();
    if (!texto) return;

    input.value = '';
    mostrarMensajeUsuario(texto);
    KOI_CART_STATE.historial.push({ role: 'user', content: texto });

    KOI_CART_STATE.isTyping = true;
    if (send) send.disabled = true;
    mostrarTyping();

    // Construir contexto enriquecido con carrito
    const ctx = KOI_CART_STATE.contexto || {};
    const contextoEnriquecido = {
      ...ctx,
      carrito_items:  KOI_CART_STATE.cartItems.map(i => `${i.nombre} x${i.qty} ($${i.precio})`).join(', '),
      total_carrito:  KOI_CART_STATE.cartTotal,
      pagina_actual:  'cart',
      // Señal al Worker de que tiene memoria de la conversación previa
      tiene_historial_previo: KOI_CART_STATE.historialPrevio.length > 0,
    };

    try {
      const res = await fetch(KOI_CART_CONFIG.workerUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          mensaje:   texto,
          historial: KOI_CART_STATE.historial.slice(-KOI_CART_CONFIG.maxHistory),
          contexto:  contextoEnriquecido,
        }),
      });

      const data = await res.json();
      ocultarTyping();

      const respuesta = data.respuesta
                     || data.choices?.[0]?.message?.content
                     || data.reply
                     || data.message
                     || '...';

      mostrarMensajeKOI(respuesta);

    } catch(err) {
      ocultarTyping();
      const errMsgs = {
        es: 'Ups, tuve un problema de conexión. Intenta de nuevo.',
        en: 'Oops, I had a connection issue. Please try again.',
        fr: 'Oups, j\'ai eu un problème de connexion. Réessayez.',
        pt: 'Ops, tive um problema de conexão. Tente novamente.',
        de: 'Ups, Verbindungsproblem. Bitte nochmal versuchen.',
        it: 'Ops, problema di connessione. Riprova.',
      };
      const idioma = detectarIdioma();
      mostrarMensajeKOI(errMsgs[idioma] || errMsgs['en']);
    }

    KOI_CART_STATE.isTyping = false;
    if (send) send.disabled = false;
    if (input) input.focus();
  }

  /* ══════════════════════════════════════════════════════════
     INICIALIZACIÓN
     ══════════════════════════════════════════════════════════ */
  async function init() {
    // Solo en /cart
    if (!esCartPage()) return;

    // Obtener contexto del quiz e historial previo de la conversación
    const ctx             = obtenerContexto();
    const historialPrevio = obtenerHistorialPrevio();

    // Obtener carrito
    await obtenerCarrito();

    // Si no hay items en el carrito, no mostrar
    if (KOI_CART_STATE.cartItems.length === 0) return;

    // Guardar contexto e historial en el estado
    KOI_CART_STATE.contexto        = ctx;
    KOI_CART_STATE.historialPrevio = historialPrevio;
    // El cart arranca con la memoria completa de la conversación del quiz
    KOI_CART_STATE.historial       = [...historialPrevio];

    // Crear widget
    crearWidget();
  }

  /* ── Entry point ── */
  // Ejecutar siempre que el DOM esté disponible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM ya listo (script cargado con async/defer o al final del body)
    init();
  }

  // Fallback extra: si por algún motivo no corrió, intentar en window.load
  window.addEventListener('load', function() {
    if (!document.getElementById('koi-cart-widget')) {
      init();
    }
  });

})();
