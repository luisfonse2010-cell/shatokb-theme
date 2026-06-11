/**
 * ============================================================
 * SHATOKB · KOI — Experta K-Beauty con IA
 * Archivo: assets/shatokb-koi-chat.js
 * Version: 1.1 — Multilingual + workerUrl confirmed
 * ============================================================
 */

(function () {
  'use strict';

  const KOI_CONFIG = {
    workerUrl:     'https://koi-proxy.luisfonse2010.workers.dev/chat',
    maxHistory:    20,
    appearDelay:   1800,
    firstMsgDelay: 600,
  };

  const KOI_STATE = {
    historial: [],
    contexto:  null,
    isTyping:  false,
    isReady:   false,
    msgCount:  0,
  };

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
      post_rutina: ['Dans quel ordre les appliquer ?', "Matin vs soir — qu'est-ce qui change ?", 'Sont-ils sûrs pendant la grossesse ?', 'Par lequel commencer ?'],
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
      objeciones:  ['Qual è il prodotto più importante?', 'Non ho mai provato la K-Beauty', 'Posso combinare questi ingredienti?', "Ho un'altra domanda"],
    },
  };

  window.shatokbIniciarKOI = function (contextoQuiz) {
    if (KOI_STATE.isReady) return;
    KOI_STATE.contexto = contextoQuiz || obtenerContextoLocal();
    const wrapper = crearDOM();
    if (!wrapper) return;
    setTimeout(() => {
      wrapper.classList.add('koi--visible');
      KOI_STATE.isReady = true;
      setTimeout(() => { enviarMensajeKOI_proactivo(); }, KOI_CONFIG.firstMsgDelay);
    }, KOI_CONFIG.appearDelay);
  };

  function obtenerContextoLocal () {
    try {
      const raw = localStorage.getItem('shatokb_resultado');
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function detectarIdioma () {
    const lang = (navigator.language || navigator.userLanguage || 'en').split('-')[0].toLowerCase();
    const soportados = ['es','en','fr','pt','de','it','ko','ja','zh','ar','nl','pl','ru'];
    return soportados.includes(lang) ? lang : 'en';
  }

  function crearDOM () {
    const resultado = document.querySelector('.shatokb-resultado__inner')
                   || document.querySelector('.shatokb-resultado')
                   || document.querySelector('#shatokb-resultado');
    if (!resultado) { console.warn('[KOI] Could not find the quiz result container.'); return null; }
    if (document.getElementById('shatokb-koi-wrapper')) return null;

    const idioma = detectarIdioma();
    const uiText = {
      es: { status: 'En línea · Especialista K-Beauty',    placeholder: 'Pregúntale algo a KOI...',     footer: '🔒 KOI ofrece orientación cosmética experta, no asesoramiento médico.' },
      en: { status: 'Online · Senior K-Beauty Specialist', placeholder: 'Ask KOI anything...',          footer: '🔒 KOI provides expert cosmetic guidance — not medical advice. For diagnosed skin conditions, consult a dermatologist.' },
      fr: { status: 'En ligne · Spécialiste K-Beauty',     placeholder: 'Posez une question à KOI...', footer: '🔒 KOI fournit des conseils cosmétiques experts — pas des avis médicaux.' },
      pt: { status: 'Online · Especialista K-Beauty',      placeholder: 'Pergunte algo à KOI...',      footer: '🔒 KOI oferece orientação cosmética especializada — não conselho médico.' },
      de: { status: 'Online · K-Beauty-Spezialistin',      placeholder: 'Frage KOI etwas...',          footer: '🔒 KOI bietet kosmetische Fachberatung — keine medizinischen Ratschläge.' },
      it: { status: 'Online · Specialista K-Beauty',       placeholder: 'Chiedi qualcosa a KOI...',    footer: '🔒 KOI fornisce consulenza cosmetica esperta — non consigli medici.' },
    };
    const ui = uiText[idioma] || uiText['en'];

    const wrapper = document.createElement('div');
    wrapper.id = 'shatokb-koi-wrapper';
    wrapper.innerHTML = `
      <div class="koi-panel">
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
        <div class="koi-messages" id="koi-messages"></div>
        <div class="koi-chips" id="koi-chips"></div>
        <div class="koi-input-area">
          <textarea class="koi-input" id="koi-input" placeholder="${ui.placeholder}" rows="1" maxlength="500"></textarea>
          <button class="koi-send-btn" id="koi-send-btn" title="Send">➤</button>
        </div>
        <div class="koi-footer"><p>${ui.footer}</p></div>
      </div>
    `;

    resultado.appendChild(wrapper);
    vincularEventos();
    return wrapper;
  }

  function vincularEventos () {
    const input   = document.getElementById('koi-input');
    const sendBtn = document.getElementById('koi-send-btn');
    if (!input || !sendBtn) return;
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensajeUsuario(); }
    });
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });
    sendBtn.addEventListener('click', enviarMensajeUsuario);
  }

  function mostrarChips (tipo) {
    const container = document.getElementById('koi-chips');
    if (!container) return;
    const idioma    = detectarIdioma();
    const setIdioma = KOI_CHIPS_I18N[idioma] || KOI_CHIPS_I18N['en'];
    const chips     = setIdioma[tipo] || setIdioma.bienvenida;
    container.innerHTML = '';
    chips.forEach(texto => {
      const btn = document.createElement('button');
      btn.className   = 'koi-chip';
      btn.textContent = texto;
      btn.addEventListener('click', () => { container.innerHTML = ''; enviarDesdeChip(texto); });
      container.appendChild(btn);
    });
  }

  function ocultarChips () {
    const container = document.getElementById('koi-chips');
    if (container) container.innerHTML = '';
  }

  function agregarMensaje (rol, texto, esWelcome = false) {
    const container = document.getElementById('koi-messages');
    if (!container) return null;
    const msg = document.createElement('div');
    msg.className = `koi-msg koi-msg--${rol}${esWelcome ? ' koi-msg--welcome' : ''}`;
    const avatarEmoji = rol === 'koi' ? '🌸' : '👤';
    const hora = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    msg.innerHTML = `
      <div class="koi-msg__avatar">${avatarEmoji}</div>
      <div class="koi-msg__bubble">
        <p class="koi-msg__text"></p>
        <span class="koi-msg__time">${hora}</span>
      </div>
    `;
    container.appendChild(msg);
    const textEl = msg.querySelector('.koi-msg__text');
    if (rol === 'user') { textEl.textContent = texto; }
    scrollAlFinal();
    return textEl;
  }

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
    if (container) setTimeout(() => { container.scrollTop = container.scrollHeight; }, 50);
  }

  async function enviarMensajeKOI_proactivo () {
    const ctx          = KOI_STATE.contexto;
    const perfilNombre = ctx?.perfil?.nombre   || 'your skin profile';
    const numProductos = ctx?.productos?.length || 0;
    const idioma       = detectarIdioma();
    const nombreIdioma = { es:'Spanish', en:'English', fr:'French', pt:'Portuguese', de:'German', it:'Italian', ko:'Korean', ja:'Japanese', zh:'Chinese', ar:'Arabic', nl:'Dutch', pl:'Polish', ru:'Russian' }[idioma] || 'English';

    const mensajeInterno = `[SYSTEM: Generate KOI's opening greeting message.]
Browser language detected: ${nombreIdioma}.
Respond ENTIRELY in ${nombreIdioma}.
Skin profile: ${perfilNombre}.
Number of recommended products: ${numProductos}.
Introduce yourself as KOI with 30+ years of experience at shatokb.
Briefly acknowledge their skin profile by name.
Tell them the products chosen for them were selected for a specific reason.
Hint that there is one important thing about their skin type most people get wrong — and offer to explain.
End with a question offering 3 paths: routine order, a specific product, or the ingredient science.
Keep it under 100 words. No filler. No emojis unless one adds meaning.`;

    mostrarTyping();
    try {
      const response = await fetch(KOI_CONFIG.workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: mensajeInterno, historial: [], contexto: construirContexto() }),
      });
      const data       = await response.json();
      const mensajeKOI = data.respuesta || data.content || '';
      ocultarTyping();
      const textEl = agregarMensaje('koi', '', true);
      if (textEl && mensajeKOI) await escribirConEfecto(textEl, mensajeKOI);
      KOI_STATE.historial.push({ role: 'assistant', content: mensajeKOI });
    } catch (err) {
      console.warn('[KOI] Greeting via Worker failed, using local fallback:', err);
      ocultarTyping();
      const fallbacks = {
        es: `Hola. Soy **KOI** — 30 años en ciencia de la piel y K-Beauty, aquí en shatokb.\n\nHe revisado tu perfil **${perfilNombre}**. Los ${numProductos} productos seleccionados tienen una razón específica.\n\n¿Por dónde empezamos — el orden de la rutina, un producto específico, o la ciencia de los ingredientes?`,
        en: `Hello. I'm **KOI** — 30 years in skin science and Korean beauty, here at shatokb.\n\nI've reviewed your **${perfilNombre}** profile. The ${numProductos} products selected weren't random — each chosen for a reason.\n\nWhere would you like to begin — the routine order, a specific product, or the ingredient science?`,
        fr: `Bonjour. Je suis **KOI** — 30 ans en K-Beauty, ici chez shatokb.\n\nJ'ai analysé votre profil **${perfilNombre}**. Les ${numProductos} produits ont chacun une raison précise.\n\nPar où commençons-nous — la routine, un produit, ou la science des ingrédients ?`,
        pt: `Olá. Sou **KOI** — 30 anos em K-Beauty, aqui na shatokb.\n\nAnalisei o seu perfil **${perfilNombre}**. Os ${numProductos} produtos foram escolhidos por razões específicas.\n\nPor onde começamos — a rotina, um produto específico, ou a ciência dos ingredientes?`,
      };
      const mensajeFallback = fallbacks[idioma] || fallbacks['en'];
      const textEl = agregarMensaje('koi', '', true);
      if (textEl) await escribirConEfecto(textEl, mensajeFallback);
      KOI_STATE.historial.push({ role: 'assistant', content: mensajeFallback });
    }
    setTimeout(() => mostrarChips('bienvenida'), 400);
  }

  async function enviarMensajeUsuario () {
    const input = document.getElementById('koi-input');
    if (!input) return;
    const texto = input.value.trim();
    if (!texto || KOI_STATE.isTyping) return;
    input.value = '';
    input.style.height = 'auto';
    ocultarChips();
    agregarMensaje('user', texto);
    KOI_STATE.msgCount++;
    KOI_STATE.historial.push({ role: 'user', content: texto });
    setInputHabilitado(false);
    await obtenerRespuestaKOI(texto);
    setInputHabilitado(true);
    input.focus();
    if (KOI_STATE.msgCount >= 2) setTimeout(() => mostrarChips('post_rutina'), 500);
  }

  async function enviarDesdeChip (texto) {
    const input = document.getElementById('koi-input');
    if (input) { input.value = texto; await enviarMensajeUsuario(); }
  }

  function setInputHabilitado (habilitado) {
    const input   = document.getElementById('koi-input');
    const sendBtn = document.getElementById('koi-send-btn');
    if (input)   input.disabled   = !habilitado;
    if (sendBtn) sendBtn.disabled = !habilitado;
  }

  async function obtenerRespuestaKOI (preguntaUsuario) {
    mostrarTyping();
    try {
      const response = await fetch(KOI_CONFIG.workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje:   preguntaUsuario,
          historial: KOI_STATE.historial.slice(-KOI_CONFIG.maxHistory),
          contexto:  construirContexto(),
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data      = await response.json();
      const respuesta = data.respuesta || data.content || '';
      ocultarTyping();
      const textEl = agregarMensaje('koi', '');
      if (textEl && respuesta) await escribirConEfecto(textEl, respuesta);
      KOI_STATE.historial.push({ role: 'assistant', content: respuesta });
      if (KOI_STATE.msgCount >= 4) setTimeout(() => mostrarChips('objeciones'), 600);
    } catch (error) {
      console.error('[KOI] Error contacting the Worker:', error);
      ocultarTyping();
      const textEl = agregarMensaje('koi', '');
      if (textEl) await escribirConEfecto(textEl, "I ran into a brief technical issue — could you repeat your question?");
    }
  }

  function construirContexto () {
    const ctx = KOI_STATE.contexto;
    if (!ctx) return {};
    const productosStr = (ctx.productos || []).map(p => `- ${p.nombre} ($${p.precio}) — Paso: ${p.paso || 'N/A'}`).join('\n');
    return {
      perfil_id:          ctx.perfil?.id          || '',
      perfil_nombre:      ctx.perfil?.nombre       || '',
      perfil_descripcion: ctx.perfil?.descripcion  || '',
      caracteristicas:    (ctx.perfil?.tags || []).join(', '),
      rutina_am:          (ctx.rutinaAM || []).join(' → '),
      rutina_pm:          (ctx.rutinaPM || []).join(' → '),
      productos:          productosStr,
      presupuesto:        ctx.presupuesto          || '',
      experiencia:        ctx.experiencia          || '',
      total_carrito:      ctx.totalCarrito         || 0,
    };
  }

  async function escribirConEfecto (elemento, texto) {
    const html      = markdownBasico(texto);
    elemento.innerHTML = '';
    const temp      = document.createElement('div');
    temp.innerHTML  = html;
    const textoPlano = temp.textContent || temp.innerText || '';
    const cursor    = document.createElement('span');
    cursor.className = 'koi-cursor';
    elemento.appendChild(cursor);
    let i = 0;
    const velocidad = textoPlano.length > 200 ? 12 : 18;
    await new Promise(resolve => {
      const interval = setInterval(() => {
        if (i >= textoPlano.length) {
          clearInterval(interval);
          elemento.innerHTML = html;
          resolve();
          return;
        }
        cursor.remove();
        elemento.innerHTML = markdownBasico(textoPlano.slice(0, i + 1));
        elemento.appendChild(cursor);
        scrollAlFinal();
        i++;
      }, velocidad);
    });
    const cur = elemento.querySelector('.koi-cursor');
    if (cur) cur.remove();
  }

  function markdownBasico (texto) {
    return texto
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g,     '<em>$1</em>')
      .replace(/\n/g,            '<br>')
      .replace(/📍|✨|🌸|💆|☀️|🌙|✅|❌|🔒|💡/g, match => match);
  }

  document.addEventListener('shatokb:resultado', function (e) {
    window.shatokbIniciarKOI(e.detail || {});
  });

  document.addEventListener('DOMContentLoaded', function () {
    const resultado = document.querySelector('.shatokb-resultado');
    if (resultado && resultado.style.display !== 'none') {
      const ctx = obtenerContextoLocal();
      if (ctx) window.shatokbIniciarKOI(ctx);
    }
  });

})();
