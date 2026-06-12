1	/**
     2	 * ============================================================
     3	 * SHATOKB · Skin Diagnosis Quiz Engine  v3.4
     4	 * File: assets/shatokb-quiz.js
     5	 *
     6	 * Sections:
     7	 *  1.  QUIZ QUESTIONS
     8	 *  2.  TAG MAPS  (Shopify tags → internal fields)
     9	 *  3.  LIVE CATALOGUE  (fetched from /products.json)
    10	 *  4.  FALLBACK CATALOGUE  (local/dev only)
    11	 *  5.  SKIN PROFILES
    12	 *  6.  SCORING ENGINE
    13	 *  7.  RECOMMENDATION ENGINE
    14	 *  8.  QUIZ STATE & NAVIGATION
    15	 *  9.  EMAIL GATE + META PIXEL
    16	 * 10.  RESULT DISPLAY
    17	 * 11.  REVIEWS + URGENCY
    18	 * 12.  PRODUCT RENDERING
    19	 * 13.  CART INTEGRATION
    20	 * 14.  DYNAMIC CONFIG (data-attributes → Theme Editor)
    21	 * 15.  RESTART
    22	 * 16.  INIT
    23	 * ============================================================
    24	 */
    25	
    26	'use strict';
    27	
    28	/* ============================================================
    29	   1. QUIZ QUESTIONS
    30	============================================================ */
    31	const SHATOKB_PREGUNTAS = [
    32	  {
    33	    id: 'tipo_piel',
    34	    titulo: 'First things first — what is your skin like?',
    35	    emoji: '🪞',
    36	    subtitulo: 'Be honest with yourself. This is where everything starts.',
    37	    opciones: [
    38	      { valor: 'grasa',    label: '🫧 Oily',          desc: 'Shiny by midday. Visible pores. Breakout-prone.' },
    39	      { valor: 'mixta',    label: '☯️ Combination',   desc: 'Oily T-zone, dry or normal everywhere else.' },
    40	      { valor: 'seca',     label: '🌵 Dry',           desc: 'Tight, flaky, thirsty. Feels stripped after cleansing.' },
    41	      { valor: 'sensible', label: '🌸 Sensitive',     desc: 'Reacts to everything. Redness. Irritation. Stinging.' },
    42	      { valor: 'nolose',   label: '🤷 Not sure yet',  desc: "No worries — we'll figure it out from your other answers." }
    43	    ]
    44	  },
    45	  {
    46	    id: 'sensibilidad',
    47	    titulo: 'How does your skin handle new products?',
    48	    emoji: '⚡',
    49	    subtitulo: 'This protects you from ingredients that could backfire.',
    50	    opciones: [
    51	      { valor: 'baja',  label: '💪 Tough as nails',  desc: "I can try anything. My skin barely reacts." },
    52	      { valor: 'media', label: '🤔 It depends',      desc: 'Occasional redness or breakouts with some products.' },
    53	      { valor: 'alta',  label: '🚨 Very reactive',   desc: 'My skin throws a tantrum with almost everything new.' }
    54	    ]
    55	  },
    56	  {
    57	    id: 'preocupacion',
    58	    titulo: 'What does your skin make you most self-conscious about?',
    59	    emoji: '😔',
    60	    subtitulo: 'The one thing you wish you could fix tomorrow.',
    61	    opciones: [
    62	      { valor: 'acne',           label: '😤 Acne & breakouts',     desc: 'Blackheads, pimples, cysts. It never fully clears.' },
    63	      { valor: 'manchas',        label: '🟤 Dark spots',           desc: 'Post-acne marks, sun damage, uneven patches.' },
    64	      { valor: 'poros',          label: '🔬 Enlarged pores',       desc: "Visible pores that makeup can't hide." },
    65	      { valor: 'deshidratacion', label: '💧 Dull & dehydrated',    desc: 'Flat, lifeless skin. No bounce. No glow.' },
    66	      { valor: 'textura',        label: '🍊 Rough texture',        desc: "Bumpy, uneven skin that's not smooth to the touch." },
    67	      { valor: 'rojeces',        label: '🔴 Redness & irritation', desc: 'Constant redness, flushing or sensitive patches.' },
    68	      { valor: 'antiaging',      label: '⏳ Fine lines & firmness', desc: 'First signs of aging. Skin is losing its snap.' }
    69	    ]
    70	  },
    71	  {
    72	    id: 'objetivo',
    73	    titulo: 'Close your eyes. What does your dream skin look like?',
    74	    emoji: '💭',
    75	    subtitulo: 'Pick the transformation you want most.',
    76	    opciones: [
    77	      { valor: 'glow',      label: '✨ That glass-skin glow',   desc: 'Lit from within. Dewy, radiant, luminous.' },
    78	      { valor: 'calmar',    label: '🧘 Calm, quiet skin',       desc: 'No redness. No reactions. Just peace.' },
    79	      { valor: 'limpiar',   label: '🫧 Deeply clean pores',    desc: 'Unclogged, tight, purified. Clean slate.' },
    80	      { valor: 'hidratar',  label: '💦 Plump & bouncy',         desc: 'Hydrated to the core. Soft, pillowy, elastic.' },
    81	      { valor: 'unificar',  label: '🌅 Even, spot-free tone',   desc: 'Uniform complexion. Spots faded. Confidence up.' },
    82	      { valor: 'controlar', label: '🎯 Matte & pore-minimized', desc: 'Less shine. Smaller pores. In control all day.' }
    83	    ]
    84	  },
    85	  {
    86	    id: 'nivel_rutina',
    87	    titulo: 'How much time will you actually commit?',
    88	    emoji: '⏱️',
    89	    subtitulo: 'A routine you stick to beats a perfect one you abandon.',
    90	    opciones: [
    91	      { valor: 'basica',     label: '⚡ Quick & powerful (3–4 steps)',  desc: 'Under 5 minutes. The essentials only. Still transforms your skin.' },
    92	      { valor: 'intermedia', label: '⚖️ Balanced (5–6 steps)',          desc: '8–10 minutes. Real results without taking over your morning.' },
    93	      { valor: 'completa',   label: '🏆 The full ritual (7+ steps)',    desc: 'The complete K-Beauty experience. Maximum results. Worth every second.' }
    94	    ]
    95	  },
    96	  {
    97	    id: 'presupuesto',
    98	    titulo: "Last one. What's your investment range?",
    99	    emoji: '💳',
   100	    subtitulo: 'K-Beauty delivers incredible results at every price point.',
   101	    opciones: [
   102	      { valor: 'bajo',  label: '💚 Smart spender', desc: 'Under $40 total. Proven products, zero waste.' },
   103	      { valor: 'medio', label: '💛 Best of both',  desc: '$40–$80. Where quality meets value. Our sweet spot.' },
   104	      { valor: 'alto',  label: '🖤 Best in class', desc: 'No ceiling. Only the highest-performing formulas.' }
   105	    ]
   106	  }
   107	];
   108	
   109	
   110	/* ============================================================
   111	   2. TAG MAPS  —  Shopify product tags → internal engine fields
   112	   All tags are in English and match exactly what's in the store.
   113	============================================================ */
   114	
   115	// ============================================================
   116	// TAG MAPS v3.4 — Built from REAL Shopify admin product tags
   117	// Extracted from live store Tag Auditor run (Jun 2026).
   118	// v3.3: Added singular/alternate serum/toner/moisturizer tags
   119	//       to rescue ~14 excluded products (COSRX, TIAM, JUMISO,
   120	//       Cos De Baha, Round Lab, Pyunkang Yul, Innisfree).
   121	// ============================================================
   122	
   123	// Tag → routine step category
   124	// These are the ACTUAL tags used in the store's products.
   125	const TAG_CATEGORIA = {
   126	  // ── CLEANSERS ──────────────────────────────────────────────
   127	  'Cleansers':                      'cleanser',
   128	  'Foam Cleansers':                 'cleanser',
   129	  'Hydrating Cleansers':            'cleanser',
   130	  'Vegan Cleansers':                'cleanser',
   131	  'Daily Use Cleansers':            'cleanser',
   132	  'Radiance-Boosting Cleansers':    'cleanser',
   133	  'Makeup Removing Cleansers':      'cleanser',
   134	  'Cleansing Foam':                 'cleanser',
   135	  'Facial Cleansers':               'cleanser',
   136	  'Gentle Cleansers':               'cleanser',
   137	  'Low pH Cleansers':               'cleanser',
   138	  'Micellar Water':                 'cleanser',
   139	  'Cleansing Balm':                 'cleanser',
   140	  'Oil Cleansers':                  'cleanser',
   141	  'Makeup Remover':                 'cleanser',
   142	  'Double Cleansers':               'cleanser',
   143	
   144	  // ── TONERS, PADS & MISTS ───────────────────────────────────
   145	  'Toner, Pads & Mists':            'toner',
   146	  'Toners':                         'toner',
   147	  'Toner':                          'toner',  // ← v3.3 singular (Round Lab, COSRX)
   148	  'Toner Pads':                     'toner',
   149	  'Toner pads':                     'toner',
   150	  'Essence Toners':                 'toner',
   151	  'Exfoliating Toners':             'toner',
   152	  'Hydrating Toners':               'toner',
   153	  'Hydrating Toner':                'toner',  // ← v3.3 singular (COSRX Propolis Toner)
   154	  'Facial Mists':                   'toner',
   155	  'Face Mist':                      'toner',
   156	  'Cotton Pads':                    'toner',
   157	  'Brightening Toners':             'toner',
   158	  'Calming Toners':                 'toner',
   159	  'AHA BHA Toners':                 'toner',
   160	  'BHA Toners':                     'toner',
   161	
   162	  // ── SERUMS & AMPOULES ──────────────────────────────────────
   163	  'Serums & Ampoules':              'serum',
   164	  'Serums':                         'serum',  // ← v3.3 (Innisfree, JUMISO, Anua, VT PDRN)
   165	  'Serum':                          'serum',  // ← v3.3 singular (Cos De Baha VA 15%, BOJ)
   166	  'Serums & Essences':              'serum',  // ← v3.3 (TIAM, Cos De Baha Niacinamide 20%)
   167	  'Serums & Treatments':            'serum',  // ← v3.3 (Pyunkang Yul, AXIS-Y, DearKlairs)
   168	  'Face Serum':                     'serum',  // ← v3.3 (COSRX Vitamin C 13%/23%, Niacinamide, HA3%, PURITO Centella)
   169	  'Retinol Serum':                  'serum',  // ← v3.3 (COSRX Retinol 0.5 Oil, SOME BY MI)
   170	  'Hydrating Serum':                'serum',  // ← v3.3 (COSRX HA3% Serum)
   171	  'Brightening Serums':             'serum',
   172	  'Anti-Aging Serums':              'serum',
   173	  'Peptide & Collagen Ampoules':    'serum',
   174	  'Hydrating Serums':               'serum',
   175	  'Acne Treatment Serums':          'serum',
   176	  'Vitamin C Serums':               'serum',
   177	  'Niacinamide Serums':             'serum',
   178	  'Retinol Serums':                 'serum',
   179	  'Snail Serums':                   'serum',
   180	  'Centella Serums':                'serum',
   181	
   182	  // ── SUNSCREENS — NOTE: Must come BEFORE Essences ──────────
   183	  'Sunscreens & Sun Care':          'spf',
   184	  'Sunscreen':                      'spf',
   185	  'Mineral Sunscreens':             'spf',
   186	  'Chemical Sunscreens':            'spf',
   187	  'Hybrid Sunscreens':              'spf',
   188	  'Hydrating Sunscreens':           'spf',
   189	  'High SPF Sunscreens (Chemical & Mineral)': 'spf',
   190	  'SPF50':                          'spf',
   191	  'Sun Protection & Damage':        'spf',
   192	
   193	  // ── ESSENCES ───────────────────────────────────────────────
   194	  'Essences':                       'essence',
   195	  'First Essences':                 'essence',
   196	  'Boosters':                       'essence',
   197	  'Treatment Essences':             'essence',
   198	
   199	  // ── MOISTURIZERS & CREAMS ──────────────────────────────────
   200	  'Moisturizers & Creams':          'moisturizer',
   201	  'Moisturizers':                   'moisturizer',
   202	  'Moisturizer':                    'moisturizer',
   203	  'Moisturizers & Lotions':         'moisturizer',  // ← v3.3 (Pyunkang Yul Intensive Ceramide Lotion)
   204	  'Cream Moisturizers':             'moisturizer',
   205	  'Gel Moisturizers':               'moisturizer',
   206	  'Sleeping Masks':                 'moisturizer',
   207	  'Night Creams':                   'moisturizer',
   208	  'Collagen-Boosting Creams':       'moisturizer',
   209	  'Barrier Creams':                 'moisturizer',
   210	  'Face Moisturizers':              'moisturizer',
   211	
   212	  // ── EYE CARE ───────────────────────────────────────────────
   213	  'Eye Care':                       'eye',
   214	  'Eye Creams & Serums':            'eye',
   215	  'Eye Creams':                     'eye',
   216	  'Eye Serums':                     'eye',
   217	  'Hydrating Eye Serums':           'eye',
   218	  'Brightening Eye Treatments':     'eye',
   219	  'Eye Patches':                    'eye',
   220	  'Under Eye Creams':               'eye',
   221	
   222	  // ── EXFOLIATORS & PEELS ────────────────────────────────────
   223	  'Exfoliators & Peels':            'exfoliator',
   224	  'AHA Exfoliators':                'exfoliator',
   225	  'BHA Exfoliators':                'exfoliator',
   226	  'Physical Exfoliators':           'exfoliator',
   227	  'Peeling Gels':                   'exfoliator',
   228	
   229	  // ── FACE MASKS ─────────────────────────────────────────────
   230	  'Face Masks':                     'mask',
   231	  'Sheet Masks':                    'mask',
   232	  'Clay Masks':                     'mask',
   233	  'Sleeping Packs':                 'mask',
   234	  'Brightening Masks':              'mask',
   235	  'Hydrating Masks':                'mask',
   236	  'Acne Masks':                     'mask',
   237	
   238	  // ── LIP CARE ───────────────────────────────────────────────
   239	  'Lip Care':                       'lip',
   240	  'Lip Masks':                      'lip',
   241	  'Lip Balms':                      'lip',
   242	
   243	  // ── SKINCARE SETS ──────────────────────────────────────────
   244	  'Skincare Sets & Kits':           'set',
   245	};
   246	
   247	// Tag → skin type (REAL store tags used in Collections + product Tags)
   248	const TAG_TIPO_PIEL = {
   249	  'Dry Skin':                       'seca',
   250	  'Oily & Acne-Prone Skin':         'grasa',
   251	  'Oily Skin':                      'grasa',
   252	  'Acne-Prone Skin':                'grasa',
   253	  'Sensitive Skin':                 'sensible',
   254	  'Redness & Sensitive Skin':       'sensible',
   255	  'Sensitive Skin Formulas':        'sensible',
   256	  'Combination Skin':               'mixta',
   257	  'All Skin Types':                 'nolose',
   258	  'All Skin':                       'nolose',
   259	  'Korean Skincare':                'nolose',
   260	  'Skincare':                       'nolose',
   261	};
   262	
   263	// Tag → skin concern (REAL store tags — seen in Collections AND product Tags)
   264	const TAG_CONCERN = {
   265	  // Anti-aging & firmness
   266	  'Anti-Aging & Wrinkles':          'antiaging',
   267	  'Anti-Aging Serums':              'antiaging',
   268	  'Anti-Aging Creams':              'antiaging',
   269	  'Collagen-Boosting Creams':       'antiaging',
   270	  'Peptide & Collagen Ampoules':    'antiaging',
   271	  'Dark Circles & Puffy Eyes':      'antiaging',
   272	  'Hydrating Eye Serums':           'antiaging',
   273	  'fine lines serum':               'antiaging',
   274	  'retinol eye cream':              'antiaging',
   275	  'well-aging skincare':            'antiaging',
   276	
   277	  // Hyperpigmentation / dark spots / brightening
   278	  'Hyperpigmentation & Dark Spots': 'manchas',
   279	  'Dull & Uneven Skin Tone':        'manchas',
   280	  'Brightening Serums':             'manchas',
   281	  'Brightening Eye Treatments':     'manchas',
   282	  'Brightening Toners':             'manchas',
   283	  'serum for dark spots':           'manchas',
   284	  'anti-dark spots':                'manchas',
   285	  'daily vitamin c':                'manchas',
   286	
   287	  // Hydration / dehydration
   288	  'Hydrating':                      'deshidratacion',
   289	  'Hydrating Serums':               'deshidratacion',
   290	  'Hydrating Toners':               'deshidratacion',
   291	  'Moisturizing Sunscreen':         'deshidratacion',
   292	  'Hydrating Sunscreens':           'deshidratacion',
   293	  'Hydrating Sunscreen':            'deshidratacion',
   294	  'hydrating face cream':           'deshidratacion',
   295	  'glow hydration':                 'deshidratacion',
   296	  'dewy glow':                      'deshidratacion',
   297	  'Moisturizers & Creams':          'deshidratacion',
   298	  'Moisturizer':                    'deshidratacion',
   299	  'Hydrating Cleansers':            'deshidratacion',
   300	  'Hydrating Masks':                'deshidratacion',
   301	
   302	  // Redness / sensitivity
   303	  'Redness & Irritation':           'rojeces',
   304	  'Redness & Sensitive Skin':       'rojeces',
   305	  'Calming Toners':                 'rojeces',
   306	
   307	  // Acne / pores
   308	  'Oily & Acne-Prone Skin':         'acne',
   309	  'Acne Treatment Serums':          'acne',
   310	  'Acne-Prone Skin':                'acne',
   311	  'Large Pores & Texture':          'poros',
   312	
   313	  // Texture / uneven skin
   314	  'Dull & Uneven Skin Tone':        'textura',
   315	  'Exfoliating Toners':             'textura',
   316	  'AHA BHA Toners':                 'textura',
   317	
   318	  // Sun protection / pigmentation prevention
   319	  'Sun Protection & Damage':        'manchas',
   320	
   321	  // ── v3.4 additions ─────────────────────────────────────────
   322	  // manchas (brightening ingredients / pigmentation)
   323	  'Brightening':                    'manchas',
   324	  'Brightening Cleansers':          'manchas',
   325	  'Brightening Masks':              'manchas',
   326	  'Vitamin C':                      'manchas',
   327	  'Vitamin C Serums':               'manchas',
   328	  'Niacinamide':                    'manchas',
   329	  'Uneven Skin Tone':               'manchas',
   330	  'Dull Skin':                      'manchas',
   331	  'Dark Spot Serum':                'manchas',
   332	  'Glass Skin':                     'manchas',
   333	
   334	  // rojeces (redness / calming ingredients)
   335	  'Redness':                        'rojeces',
   336	  'Anti-Inflammatory':              'rojeces',
   337	  'Centella Asiatica':              'rojeces',
   338	  'Soothing':                       'rojeces',
   339	  'Calming':                        'rojeces',
   340	  'Heartleaf Extract':              'rojeces',
   341	
   342	  // poros (pore-focused tags)
   343	  'Pore Care':                      'poros',
   344	  'Pore Minimizing':                'poros',
   345	  'Blackhead Removal':              'poros',
   346	  'Blackheads & Sebum':             'poros',
   347	  'Sebum Control':                  'poros',
   348	  'Excess Sebum Control':           'poros',
   349	  'BHA':                            'poros',
   350	
   351	  // textura (exfoliation / texture-evening)
   352	  'Exfoliating':                    'textura',
   353	  'Uneven Texture':                 'textura',
   354	  'Dullness & Uneven Texture':      'textura',
   355	  'AHA':                            'textura',
   356	  'Peeling Gels':                   'textura',
   357	};
   358	
   359	// Tags that confirm a product is safe for sensitive skin
   360	const TAGS_SENSIBLE_SAFE = new Set([
   361	  'Sensitive Skin',
   362	  'Redness & Sensitive Skin',
   363	  'Sensitive Skin Formulas',
   364	  'Fragrance-Free',
   365	  'Hypoallergenic',
   366	  'Fragrance-Free',
   367	  'vegan face wash',
   368	  'Vegan Cleansers',
   369	  'reef safe',
   370	  'gentle retinol',
   371	  'retinol for beginners',
   372	  'Calming Toners',
   373	]);
   374	
   375	// Tags that map to a product badge
   376	const TAG_BADGE = {
   377	  'Best Seller':  'Best Seller',
   378	  'Bestseller':   'Best Seller',
   379	  'New':          'New',
   380	  'New Arrival':  'New',
   381	  'Trending':     'Trending',
   382	  'Viral':        'Viral',
   383	  'Staff Pick':   'Staff Pick',
   384	  'Fan Favorite': 'Fan Favorite',
   385	  'Cult Favorite':'Cult Favorite',
   386	};
   387	
   388	// Emoji per category
   389	const EMOJI_MAP = {
   390	  cleanser:    '🫧',
   391	  toner:       '💧',
   392	  serum:       '💊',
   393	  essence:     '🐌',
   394	  moisturizer: '🧴',
   395	  spf:         '☀️',
   396	  exfoliator:  '✨',
   397	  mask:        '🩵',
   398	  eye:         '👁️',
   399	  lip:         '💋',
   400	  hair:        '💆',
   401	  makeup:      '💄',
   402	};
   403	
   404	
   405	/* ============================================================
   406	   3. LIVE CATALOGUE  —  populated at runtime by shatokbFetchCatalogo()
   407	============================================================ */
   408	let SHATOKB_CATALOGO = [];
   409	let shatokbCatalogoCargado = false;
   410	
   411	/**
   412	 * Converts a raw Shopify product object → internal catalogue format.
   413	 * Returns null for products without a recognised category tag.
   414	 */
   415	function shatokbMapProduct(p) {
   416	  // Shopify returns tags as a comma-separated string in /products.json
   417	  // but some API versions / storefronts return an array — handle both.
   418	  const rawTags = p.tags || '';
   419	  const tags    = Array.isArray(rawTags)
   420	    ? rawTags.map(t => t.trim())
   421	    : rawTags.split(',').map(t => t.trim());
   422	  const tagSet = new Set(tags);
   423	
   424	  // Determine routine step category
   425	  let categoria = null;
   426	  for (const [tag, cat] of Object.entries(TAG_CATEGORIA)) {
   427	    if (tagSet.has(tag)) { categoria = cat; break; }
   428	  }
   429	  if (!categoria) return null;
   430	
   431	  // Skin types
   432	  const tipo_piel = [];
   433	  for (const [tag, tipo] of Object.entries(TAG_TIPO_PIEL)) {
   434	    if (tagSet.has(tag) && !tipo_piel.includes(tipo)) tipo_piel.push(tipo);
   435	  }
   436	  if (tipo_piel.length === 0) tipo_piel.push('nolose');
   437	
   438	  // Concerns
   439	  const concerns = [];
   440	  for (const [tag, concern] of Object.entries(TAG_CONCERN)) {
   441	    if (tagSet.has(tag) && !concerns.includes(concern)) concerns.push(concern);
   442	  }
   443	
   444	  // Sensitive-safe?
   445	  const sensible = [...TAGS_SENSIBLE_SAFE].some(t => tagSet.has(t));
   446	
   447	  // Badge
   448	  let badge = null;
   449	  for (const [tag, label] of Object.entries(TAG_BADGE)) {
   450	    if (tagSet.has(tag)) { badge = label; break; }
   451	  }
   452	
   453	  // Price from first variant
   454	  const precio_num = parseFloat(p.variants?.[0]?.price || '0');
   455	  const precio     = '$' + precio_num.toFixed(2);
   456	
   457	  return {
   458	    id:         p.handle,
   459	    nombre:     p.title,
   460	    handle:     p.handle,
   461	    precio,
   462	    precio_num,
   463	    badge,
   464	    emoji:      EMOJI_MAP[categoria] || '🌿',
   465	    desc:       p.body_html
   466	                  ? p.body_html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160) + '…'
   467	                  : p.title,
   468	    tipo_piel,
   469	    categoria,
   470	    concerns,
   471	    sensible,
   472	    imagen:     p.images?.[0]?.src || null,
   473	  };
   474	}
   475	
   476	/**
   477	 * Fetches ALL products from a given base URL using pagination.
   478	 * Returns raw array of Shopify product objects, or throws.
   479	 */
   480	async function shatokbFetchAllPages(baseUrl) {
   481	  const all   = [];
   482	  let page    = 1;
   483	  const limit = 250;
   484	  while (true) {
   485	    const res = await fetch(`${baseUrl}/products.json?limit=${limit}&page=${page}`);
   486	    if (!res.ok) throw new Error(`HTTP ${res.status}`);
   487	    const data     = await res.json();
   488	    const products = data.products || [];
   489	    all.push(...products);
   490	    if (products.length < limit) break;
   491	    page++;
   492	  }
   493	  return all;
   494	}
   495	
   496	/**
   497	 * Loads the product catalogue.
   498	 *
   499	 * Priority order:
   500	 *   1. '' (relative URL)    — production Shopify context (the normal path).
    500	 *   1. '' (relative URL)    — production Shopify context (the normal path).
   501	 *      /products.json is served by the same Shopify store domain.
   502	 *   2. https://shatokb.com  — absolute URL fallback, useful when this file
   503	 *      is opened locally or from a different origin.
   504	 *   3. SHATOKB_FALLBACK     — static 46-product safety net.
   505	 *      Only reached if the device has no internet access.
   506	 */
   507	async function shatokbFetchCatalogo() {
   508	  const LIVE_STORE = 'https://shatokb.com';
   509	
   510	  // ── Attempt 1: relative URL (normal Shopify production context) ─
   511	  try {
   512	    const raw      = await shatokbFetchAllPages('');
   513	    const mapeados = raw.map(shatokbMapProduct).filter(Boolean);
   514	    if (mapeados.length > 0) {
   515	      SHATOKB_CATALOGO = mapeados;
   516	      shatokbCatalogoCargado = true;
   517	      console.log(`[SHATOKB] ✅ Catalogue loaded: ${mapeados.length} products (from ${raw.length} total).`);
   518	      return;
   519	    }
   520	    throw new Error('0 tagged products via relative URL');
   521	  } catch (err) {
   522	    console.warn('[SHATOKB] Relative fetch failed — trying absolute URL:', err.message);
   523	  }
   524	
   525	  // ── Attempt 2: absolute URL (local preview / external context) ──
   526	  try {
   527	    const raw      = await shatokbFetchAllPages(LIVE_STORE);
   528	    const mapeados = raw.map(shatokbMapProduct).filter(Boolean);
   529	    SHATOKB_CATALOGO = mapeados;
   530	    shatokbCatalogoCargado = true;
   531	    console.log(`[SHATOKB] ✅ Live catalogue from shatokb.com: ${mapeados.length} products (from ${raw.length} total).`);
   532	    return;
   533	  } catch (err) {
   534	    console.warn('[SHATOKB] Absolute fetch also failed — using static fallback:', err.message);
   535	  }
   536	
   537	  // ── Attempt 3: static fallback ────────────────────────────────
   538	  SHATOKB_CATALOGO = SHATOKB_FALLBACK;
   539	  shatokbCatalogoCargado = true;
   540	  console.warn(`[SHATOKB] ⚠️ Using static fallback catalogue (${SHATOKB_FALLBACK.length} products). Results are representative but not exhaustive.`);
   541	}
   542	
   543	
   544	/* ============================================================
   545	   4. FALLBACK CATALOGUE  —  used only when /products.json is
   546	   unavailable (local preview, dev environment).
   547	   All handles, names and prices are REAL products from shatokb.com.
   548	   In production Shopify this array is never used — the live
   549	   catalogue from /products.json takes over automatically.
   550	============================================================ */
   551	const SHATOKB_FALLBACK = [
   552	
   553	  /* ── CLEANSERS ─────────────────────────────────────────────── */
   554	  {
   555	    id:'cosrx-low-ph-cleanser', handle:'cosrx-low-ph-good-morning-gel-face-cleanser',
   556	    nombre:'COSRX Low pH Good Morning Gel Cleanser',
   557	    precio:'$12.99', precio_num:12.99, badge:'Best Seller', emoji:'🫧',
   558	    desc:'Low-pH gel that cleanses without disrupting your barrier. Salicylic acid controls sebum and minimises pores without stripping.',
   559	    tipo_piel:['grasa','mixta','sensible','nolose'], categoria:'cleanser',
   560	    concerns:['acne','poros','rojeces'], sensible:true
   561	  },
   562	  {
   563	    id:'anua-foam-cleanser', handle:'anua-heartleaf-quercetinol-pore-deep-cleansing-foam-150ml-5-07-fl-oz',
   564	    nombre:'Anua Heartleaf Quercetinol Pore Deep Cleansing Foam',
   565	    precio:'$16.99', precio_num:16.99, badge:null, emoji:'🫧',
   566	    desc:'BHA + heartleaf foam that dissolves sebum plugs while calming inflammation. Ideal for oily and acne-prone skin.',
   567	    tipo_piel:['grasa','mixta','sensible','nolose'], categoria:'cleanser',
   568	    concerns:['acne','poros','rojeces'], sensible:true
   569	  },
   570	  {
   571	    id:'anua-cleansing-oil', handle:'anua-heartleaf-pore-control-cleansing-oil-6-76-fl-oz-200ml',
   572	    nombre:'Anua Heartleaf Pore Control Cleansing Oil',
   573	    precio:'$19.99', precio_num:19.99, badge:'Best Seller', emoji:'🫧',
   574	    desc:'Glass-skin cleansing oil that dissolves SPF and makeup on contact. Fragrance-free, non-comedogenic — even for sensitive skin.',
   575	    tipo_piel:['grasa','mixta','sensible','seca','nolose'], categoria:'cleanser',
   576	    concerns:['acne','poros','deshidratacion'], sensible:true
   577	  },
   578	  {
   579	    id:'dearklairs-black-cleanser', handle:'dearklairs-gentle-black-facial-cleanser-4-73-fl-oz-vegan-low-ph-hydrating-finish',
   580	    nombre:'DearKlairs Gentle Black Facial Cleanser',
   581	    precio:'$18.00', precio_num:18.00, badge:'Best Seller', emoji:'🫧',
   582	    desc:'Low pH antioxidant cleanser with black bean and truffle. Hydrating finish — no tight feeling after washing.',
   583	    tipo_piel:['seca','mixta','sensible','nolose'], categoria:'cleanser',
   584	    concerns:['deshidratacion','rojeces','antiaging'], sensible:true
   585	  },
   586	  {
   587	    id:'pyunkang-foam', handle:'pyunkang-yul-cleansing-foam-5-1-fl-oz',
   588	    nombre:'Pyunkang Yul Cleansing Foam',
   589	    precio:'$14.00', precio_num:14.00, badge:null, emoji:'🫧',
   590	    desc:'Zero-irritation foam for dry and sensitive skin. Minimal ingredients, maximum gentleness.',
   591	    tipo_piel:['seca','sensible','nolose'], categoria:'cleanser',
   592	    concerns:['rojeces','deshidratacion'], sensible:true
   593	  },
   594	  {
   595	    id:'skin1004-foam', handle:'skin1004-madagascar-centella-ampoule-foam-4-22-fl-oz-125ml',
   596	    nombre:'SKIN1004 Madagascar Centella Ampoule Foam',
   597	    precio:'$14.00', precio_num:14.00, badge:'Best Seller', emoji:'🫧',
   598	    desc:'Baking soda + centella foam that deep-cleans pores and soothes breakout-prone skin. EWG certified.',
   599	    tipo_piel:['grasa','mixta','sensible','nolose'], categoria:'cleanser',
   600	    concerns:['acne','poros','rojeces'], sensible:true
   601	  },
   602	  {
   603	    id:'heimish-balm', handle:'heimish-all-clean-balm-4-0fl-oz-120ml-multi-purpose-cleansing-balm',
   604	    nombre:'HEIMISH All Clean Balm',
   605	    precio:'$22.00', precio_num:22.00, badge:'Best Seller', emoji:'🫧',
   606	    desc:'Cult-status balm that melts makeup, SPF and impurities without residue. Perfect first cleanse.',
   607	    tipo_piel:['grasa','mixta','seca','sensible','nolose'], categoria:'cleanser',
   608	    concerns:['acne','manchas','deshidratacion'], sensible:true
   609	  },
   610	  {
   611	    id:'beauty-joseon-balm', handle:'beauty-of-joseon-radiance-cleansing-balm-makeup-sunscreen-pore-cleanser-for-sensitive-acne-skin-korean-skincare-for-men-and-women-100ml-3-38-fl-oz',
   612	    nombre:'Beauty of Joseon Radiance Cleansing Balm',
   613	    precio:'$13.00', precio_num:13.00, badge:'Best Seller', emoji:'🫧',
   614	    desc:'Exfoliating cleansing balm that removes SPF and makeup while brightening dull skin.',
   615	    tipo_piel:['grasa','mixta','seca','sensible','nolose'], categoria:'cleanser',
   616	    concerns:['manchas','textura','deshidratacion'], sensible:true
   617	  },
   618	
   619	  /* ── TONERS ─────────────────────────────────────────────────── */
   620	  {
   621	    id:'some-by-mi-toner', handle:'some-by-mi-aha-bha-pha-30-days-miracle-toner-5-07oz-150ml',
   622	    nombre:'SOME BY MI AHA·BHA·PHA 30 Days Miracle Toner',
   623	    precio:'$16.99', precio_num:16.99, badge:null, emoji:'💧',
   624	    desc:'Triple-acid toner that treats acne, dark spots and rough texture simultaneously. Visible results in 30 days.',
   625	    tipo_piel:['grasa','mixta','nolose'], categoria:'toner',
   626	    concerns:['acne','poros','textura','manchas'], sensible:false
   627	  },
   628	  {
   629	    id:'dearklairs-toner', handle:'dear-klairs-supple-preparation-unscented-toner-6-08-fl-oz',
   630	    nombre:'DearKlairs Supple Preparation Unscented Toner',
   631	    precio:'$24.00', precio_num:24.00, badge:'Best Seller', emoji:'💧',
   632	    desc:'Alcohol-free, fragrance-free hydrating toner. Beta-glucan and centella soothe redness and deeply replenish moisture.',
   633	    tipo_piel:['seca','mixta','sensible','grasa','nolose'], categoria:'toner',
   634	    concerns:['deshidratacion','rojeces','antiaging'], sensible:true
   635	  },
   636	  {
   637	    id:'anua-soothing-toner', handle:'anua-heartleaf-77-soothing-toner-i-ph-5-5-trouble-care-calming-skin-refreshing-hydrating-purifying-cruelty-free-vegan-250ml-8-45-fl-oz',
   638	    nombre:'Anua Heartleaf 77 Soothing Toner',
   639	    precio:'$22.00', precio_num:22.00, badge:'Best Seller', emoji:'💧',
   640	    desc:'77% heartleaf extract at pH 5.5 — calms breakouts, strengthens the barrier and hydrates in one step.',
   641	    tipo_piel:['grasa','mixta','sensible','nolose'], categoria:'toner',
   642	    concerns:['acne','rojeces','deshidratacion'], sensible:true
   643	  },
   644	  {
   645	    id:'tirtir-rice-toner', handle:'tirtir-milk-skin-rice-toner-deep-moisturizing-hydrating-toner-for-face-5-07-fl-oz',
   646	    nombre:'TIRTIR Milk Skin Rice Toner',
   647	    precio:'$26.00', precio_num:26.00, badge:null, emoji:'💧',
   648	    desc:'Milky rice toner with 4% niacinamide. Brightens uneven tone, hydrates deeply and leaves skin glass-smooth.',
   649	    tipo_piel:['seca','mixta','sensible','nolose'], categoria:'toner',
   650	    concerns:['manchas','deshidratacion','textura'], sensible:true
   651	  },
   652	  {
   653	    id:'im-from-rice-toner', handle:'im-from-rice-toner-milky-toner-for-glowing-skin-korean-rice-glow-essence-with-niacinamide-5-07-fl-oz',
   654	    nombre:"I'm From Rice Toner",
   655	    precio:'$32.00', precio_num:32.00, badge:'Best Seller', emoji:'💧',
   656	    desc:'Milky toner with rice bran extract and niacinamide for glass skin. Brightens, hydrates and evens tone.',
   657	    tipo_piel:['seca','mixta','grasa','nolose'], categoria:'toner',
   658	    concerns:['manchas','deshidratacion','textura'], sensible:true
   659	  },
   660	  {
   661	    id:'medicube-collagen-toner', handle:'medicube-triple-collagen-toner',
   662	    nombre:'Medicube Triple Collagen Toner',
   663	    precio:'$29.00', precio_num:29.00, badge:'Best Seller', emoji:'💧',
   664	    desc:'3-type collagen toner that deeply plumps and firms. Fast-absorbing dewy formula for visible elasticity boost.',
   665	    tipo_piel:['seca','mixta','nolose'], categoria:'toner',
   666	    concerns:['antiaging','deshidratacion','textura'], sensible:true
   667	  },
   668	  {
   669	    id:'pyunkang-toner', handle:'pyunkang-yul-calming-deep-moisture-toner-face-toner-for-women-containing-aha-and-pha-150ml-5-07-fl-oz',
   670	    nombre:'Pyunkang Yul Calming Deep Moisture Toner',
   671	    precio:'$18.00', precio_num:18.00, badge:null, emoji:'💧',
   672	    desc:'AHA + PHA toner that gently exfoliates while intensely hydrating. For dry, sensitive and acne-prone skin.',
   673	    tipo_piel:['seca','sensible','grasa','nolose'], categoria:'toner',
   674	    concerns:['deshidratacion','textura','acne','rojeces'], sensible:true
   675	  },
   676	
   677	  /* ── ESSENCES ───────────────────────────────────────────────── */
   678	  {
   679	    id:'cosrx-snail-essence', handle:'cosrx-snail-mucin-96-power-repairing-essence-3-38-fl-oz-100ml',
   680	    nombre:'COSRX Snail Mucin 96% Power Repairing Essence',
   681	    precio:'$25.00', precio_num:25.00, badge:'Best Seller', emoji:'🐌',
   682	    desc:'The most iconic K-Beauty essence. 96% snail secretion repairs the barrier, fades marks and hydrates every skin type.',
   683	    tipo_piel:['grasa','mixta','seca','sensible','nolose'], categoria:'essence',
   684	    concerns:['deshidratacion','manchas','rojeces','antiaging','textura'], sensible:true
   685	  },
   686	  {
   687	    id:'haruharu-essence', handle:'haruharu-wonder-black-rice-probiotics-barrier-essence-4-05-fl-oz',
   688	    nombre:'Haruharu Wonder Black Rice Probiotics Barrier Essence',
   689	    precio:'$32.00', precio_num:32.00, badge:null, emoji:'🌿',
   690	    desc:'Fermented black rice + probiotics essence that rebuilds the barrier, adds glow and soothes redness.',
   691	    tipo_piel:['seca','mixta','sensible','nolose'], categoria:'essence',
   692	    concerns:['deshidratacion','rojeces','manchas','antiaging'], sensible:true
   693	  },
   694	  {
   695	    id:'abib-heartleaf-essence', handle:'abib-heartleaf-essence-calming-pump-1-69-fl-oz-50ml-i-essence-for-face',
   696	    nombre:'Abib Heartleaf Essence Calming Pump',
   697	    precio:'$29.00', precio_num:29.00, badge:'Best Seller', emoji:'🌿',
   698	    desc:'Houttuynia cordata essence that instantly calms redness and soothes post-breakout inflammation.',
   699	    tipo_piel:['sensible','mixta','seca','nolose'], categoria:'essence',
   700	    concerns:['rojeces','deshidratacion','acne'], sensible:true
   701	  },
   702	  {
   703	    id:'haruharu-hyaluronic-toner-essence', handle:'haruharu-wonder-black-rice-hyaluronic-toner-for-all-skin-types-5-1-fl-oz-150ml',
   704	    nombre:'Haruharu Wonder Black Rice Hyaluronic Toner',
   705	    precio:'$28.00', precio_num:28.00, badge:'Best Seller', emoji:'🌿',
   706	    desc:'EWG-safe fermented black rice toner-essence that delivers 72-hour hydration and restores skin elasticity.',
   707	    tipo_piel:['seca','mixta','sensible','nolose'], categoria:'essence',
   708	    concerns:['deshidratacion','antiaging','rojeces'], sensible:true
   709	  },
   710	  {
   711	    id:'vt-pdrn-essence', handle:'vt-cosmetics-pdrn-100-essence-intensive-glow-serum-vegan-pdrn-100-000ppm-1-01-fl-oz',
   712	    nombre:'VT COSMETICS PDRN 100 Essence Intensive Glow Serum',
   713	    precio:'$34.00', precio_num:34.00, badge:'Best Seller', emoji:'💊',
   714	    desc:'100,000ppm PDRN essence that repairs skin elasticity, boosts collagen and delivers an intense glow.',
   715	    tipo_piel:['seca','mixta','nolose'], categoria:'essence',
   716	    concerns:['antiaging','deshidratacion','textura'], sensible:true
   717	  },
   718	
   719	  /* ── SERUMS ─────────────────────────────────────────────────── */
   720	  {
   721	    id:'cosrx-niacinamide-serum', handle:'cosrx-15-niacinamide-face-serum-0-67-fl-oz',
   722	    nombre:'COSRX 15% Niacinamide Face Serum',
   723	    precio:'$17.99', precio_num:17.99, badge:'Best Seller', emoji:'💊',
   724	    desc:'15% niacinamide minimises pores, controls sebum, fades dark spots and evens skin tone — visibly in 2 weeks.',
   725	    tipo_piel:['grasa','mixta','sensible','nolose'], categoria:'serum',
   726	    concerns:['poros','acne','manchas','textura'], sensible:true
   727	  },
   728	  {
   729	    id:'anua-niacinamide-serum', handle:'anua-niacinamide-10-txa-4-serum-hyaluronic-acid-tranexamic-acid-vitamin-b12-30ml-1-01-fl-oz',
   730	    nombre:'ANUA Niacinamide 10 + TXA 4 Serum',
   731	    precio:'$22.00', precio_num:22.00, badge:'Best Seller', emoji:'💊',
   732	    desc:'Niacinamide + tranexamic acid serum that fades spots, evens tone and tightens pores. A daily brightening essential.',
   733	    tipo_piel:['grasa','mixta','sensible','nolose'], categoria:'serum',
   734	    concerns:['manchas','poros','textura','deshidratacion'], sensible:true
   735	  },
   736	  {
   737	    id:'some-by-mi-retinol', handle:'some-by-mi-retinol-intense-reactivating-serum-1-69oz-50ml',
   738	    nombre:'SOME BY MI Retinol Intense Reactivating Serum',
   739	    precio:'$24.00', precio_num:24.00, badge:null, emoji:'💊',
   740	    desc:'Gentle encapsulated retinol that stimulates collagen and speeds cell renewal. Start 2–3 nights per week.',
   741	    tipo_piel:['seca','mixta','grasa','nolose'], categoria:'serum',
   742	    concerns:['antiaging','textura','manchas'], sensible:false
   743	  },
   744	  {
   745	    id:'beauty-joseon-calming-serum', handle:'beauty-of-joseon-calming-serum-green-tea-panthenol-soothing-moisturizing-sensitive-acne-prone-uv-irritated-skin-daily-korean-skin-care-for-men-and-women-30ml-1-fl-oz',
   746	    nombre:'Beauty of Joseon Calming Serum: Green Tea + Panthenol',
   747	    precio:'$15.00', precio_num:15.00, badge:'Best Seller', emoji:'💊',
   748	    desc:'Green tea + panthenol calming serum that soothes breakouts, hydrates and strengthens the skin barrier.',
   749	    tipo_piel:['grasa','mixta','sensible','nolose'], categoria:'serum',
   750	    concerns:['acne','rojeces','deshidratacion'], sensible:true
   751	  },
   752	  {
   753	    id:'beauty-joseon-glow-serum', handle:'beauty-of-joseon-glow-deep-serum-rice-alpha-arbutin-30ml',
   754	    nombre:'Beauty of Joseon Glow Deep Serum: Rice + Alpha-Arbutin',
   755	    precio:'$15.00', precio_num:15.00, badge:'Best Seller', emoji:'💊',
   756	    desc:'Rice water + alpha-arbutin serum that fades hyperpigmentation and delivers a glass-skin glow.',
   757	    tipo_piel:['seca','mixta','grasa','nolose'], categoria:'serum',
   758	    concerns:['manchas','textura','deshidratacion'], sensible:true
   759	  },
   760	  {
   761	    id:'skin1004-centella-ampoule', handle:'skin1004-madagascar-centella-asiatica-ampoule-facial-serum-3-38-fl-oz100ml',
   762	    nombre:'SKIN1004 Madagascar Centella Asiatica Ampoule',
   763	    precio:'$18.00', precio_num:18.00, badge:'Best Seller', emoji:'💊',
   764	    desc:'100% Madagascar centella serum that calms redness, repairs the barrier and soothes sensitised skin.',
   765	    tipo_piel:['sensible','mixta','seca','nolose'], categoria:'serum',
   766	    concerns:['rojeces','deshidratacion','acne'], sensible:true
   767	  },
   768	  {
   769	    id:'cosrx-vitamin-c-13', handle:'cosrx-pure-vitamin-c-13-serum-with-vitamin-e-hyaluronic-acid-0-67fl-oz-20ml',
   770	    nombre:'COSRX Pure Vitamin C 13% Serum',
   771	    precio:'$19.99', precio_num:19.99, badge:'Best Seller', emoji:'💊',
   772	    desc:'Pure 13% L-ascorbic acid with vitamin E and HA. Brightens, fades spots and protects against free radicals.',
   773	    tipo_piel:['mixta','seca','grasa','nolose'], categoria:'serum',
   774	    concerns:['manchas','antiaging','textura'], sensible:false
   775	  },
   776	  {
   777	    id:'anua-azelaic-serum', handle:'anua-azelaic-acid-10-hyaluron-redness-soothing-serum-30ml-1-01-fl-oz',
   778	    nombre:'ANUA Azelaic Acid 10 Hyaluron Redness Soothing Serum',
   779	    precio:'$22.00', precio_num:22.00, badge:'Best Seller', emoji:'💊',
   780	    desc:'Azelaic acid 10% + HA serum for redness, rosacea and blemishes. Calms, brightens and hydrates simultaneously.',
   781	    tipo_piel:['sensible','mixta','grasa','nolose'], categoria:'serum',
   782	    concerns:['rojeces','acne','manchas','deshidratacion'], sensible:true
   783	  },
   784	  {
   785	    id:'medicube-vita-c-serum', handle:'medicube-deep-vita-c-serum-2-0-14-5-pure-vitamin-c',
   786	    nombre:'Medicube Deep Vita C Serum 2.0 — 14.5% Pure Vitamin C',
   787	    precio:'$38.00', precio_num:38.00, badge:'Best Seller', emoji:'💊',
   788	    desc:'14.5% pure vitamin C for intense brightening, dark spot correction and elasticity boosting.',
   789	    tipo_piel:['mixta','seca','grasa','nolose'], categoria:'serum',
   790	    concerns:['manchas','antiaging','textura'], sensible:false
   791	  },
   792	  {
   793	    id:'frankly-retinol', handle:'frankly-retinol-0-1-cream-1-01-fl-oz-beginner-retinol-night-cream-with-ceramides',
   794	    nombre:'FRANKLY Retinol 0.1% Cream',
   795	    precio:'$24.00', precio_num:24.00, badge:'Best Seller', emoji:'💊',
   796	    desc:'Beginner retinol night cream with ceramides. Smooths texture, fades dark spots and builds collagen.',
   797	    tipo_piel:['seca','mixta','grasa','nolose'], categoria:'serum',
   798	    concerns:['antiaging','textura','manchas'], sensible:false
   799	  },
   800	  {
   801	    id:'cosrx-retinol-oil', handle:'cosrx-retinol-0-5-oil-anti-aging-serum-with-0-5-retinoid-treatment-for-face',
   802	    nombre:'COSRX Retinol 0.5 Oil',
   803	    precio:'$21.99', precio_num:21.99, badge:'Best Seller', emoji:'💊',
   804	    desc:'0.5% retinol in a squalane-rich oil base. Renews skin, fades fine lines and improves texture overnight.',
   805	    tipo_piel:['seca','mixta','nolose'], categoria:'serum',
   806	    concerns:['antiaging','textura','manchas'], sensible:false
   807	  },
   808	  {
   809	    id:'abib-dark-spot-serum', handle:'abib-glutathiosome-dark-spot-serum-vita-drop-1-69-fl-oz',
   810	    nombre:'Abib Glutathiosome Dark Spot Serum Vita Drop',
   811	    precio:'$38.00', precio_num:38.00, badge:'Best Seller', emoji:'💊',
   812	    desc:'Glutathione + vitamin C encapsulated serum for deep dark spot correction and luminous, even skin tone.',
   813	    tipo_piel:['mixta','seca','grasa','sensible','nolose'], categoria:'serum',
   814	    concerns:['manchas','antiaging','textura'], sensible:true
   815	  },
   816	
   817	  /* ── MOISTURIZERS ───────────────────────────────────────────── */
   818	  {
   819	    id:'cosrx-birch-lotion', handle:'cosrx-oil-free-lotion-with-birch-sap-daily-acne-facial-moisturizer-hydrating-moisturizer-for-all-skin-types-3-38-fl-oz-100ml',
   820	    nombre:'COSRX Oil-Free Lotion with Birch Sap',
   821	    precio:'$18.00', precio_num:18.00, badge:'Best Seller', emoji:'🧴',
   822	    desc:'Oil-free gel moisturizer with birch sap. Non-comedogenic hydration for oily and acne-prone skin.',
   823	    tipo_piel:['grasa','mixta','nolose'], categoria:'moisturizer',
   824	    concerns:['acne','poros','deshidratacion'], sensible:true
   825	  },
   826	  {
   827	    id:'dearklairs-calming-cream', handle:'dearklairs-midnight-blue-calming-cream-2oz',
   828	    nombre:'DearKlairs Midnight Blue Calming Cream',
   829	    precio:'$21.00', precio_num:21.00, badge:'Best Seller', emoji:'🧴',
   830	    desc:'Guaiazulene + centella cream that reduces active redness and repairs the barrier. The go-to for reactive skin.',
   831	    tipo_piel:['sensible','mixta','seca','nolose'], categoria:'moisturizer',
   832	    concerns:['rojeces','deshidratacion','acne'], sensible:true
   833	  },
   834	  {
   835	    id:'skin1004-soothing-cream', handle:'skin1004-madagascar-centella-soothing-cream-2-53-fl-oz-75ml',
   836	    nombre:'SKIN1004 Madagascar Centella Soothing Cream',
   837	    precio:'$18.00', precio_num:18.00, badge:'Best Seller', emoji:'🧴',
   838	    desc:'Pure centella cream that calms sensitised skin, repairs the barrier and locks in long-lasting hydration.',
   839	    tipo_piel:['sensible','mixta','seca','nolose'], categoria:'moisturizer',
   840	    concerns:['rojeces','deshidratacion','antiaging'], sensible:true
   841	  },
   842	  {
   843	    id:'pyunkang-moisture-cream', handle:'pyunkang-yul-moisture-cream-3-4-fl-oz',
   844	    nombre:'Pyunkang Yul Moisture Cream',
   845	    precio:'$28.00', precio_num:28.00, badge:'Best Seller', emoji:'🧴',
   846	    desc:'Minimal-ingredient barrier cream with shea butter and jojoba oil. Intensely nourishes dry and damaged skin.',
   847	    tipo_piel:['seca','sensible','mixta','nolose'], categoria:'moisturizer',
   848	    concerns:['deshidratacion','rojeces','antiaging'], sensible:true
   849	  },
   850	  {
   851	    id:'cosrx-snail-moisturizer', handle:'cosrx-snail-mucin-92-face-moisturizer-3-52-oz',
   852	    nombre:'COSRX Snail Mucin 92% Face Moisturizer',
   853	    precio:'$24.00', precio_num:24.00, badge:'Best Seller', emoji:'🧴',
   854	    desc:'92% snail secretion lightweight cream. Repairs, hydrates and brightens — ideal for dry and dull skin.',
   855	    tipo_piel:['seca','mixta','sensible','nolose'], categoria:'moisturizer',
   856	    concerns:['deshidratacion','manchas','antiaging','rojeces'], sensible:true
   857	  },
   858	  {
   859	    id:'tirtir-ceramide-cream', handle:'tirtir-natural-ceramide-cream-deep-moisturizer-for-glass-skin',
   860	    nombre:'TIRTIR Natural Ceramide Cream',
   861	    precio:'$28.00', precio_num:28.00, badge:null, emoji:'🧴',
   862	    desc:'Ceramide-rich deep moisturizer for glass skin. Strengthens the barrier, soothes and delivers all-day hydration.',
   863	    tipo_piel:['seca','mixta','sensible','nolose'], categoria:'moisturizer',
   864	    concerns:['deshidratacion','antiaging','rojeces'], sensible:true
   865	  },
   866	  {
   867	    id:'medicube-zero-pore-cream', handle:'zero-pore-one-day-cream',
   868	    nombre:'Medicube Zero Pore One-Day Cream',
   869	    precio:'$32.00', precio_num:32.00, badge:'Best Seller', emoji:'🧴',
   870	    desc:'Niacinamide + salicylic acid cream that tightens pores, controls sebum and hydrates — all in one step.',
   871	    tipo_piel:['grasa','mixta','nolose'], categoria:'moisturizer',
   872	    concerns:['poros','acne','deshidratacion'], sensible:true
   873	  },
   874	  {
   875	    id:'numbuzin-cream', handle:'numbuzin-no-4-cream-full-nutrient-firming-cream-2-02-fl-oz',
   876	    nombre:'Numbuzin No.4 Full-Nutrient Firming Cream',
   877	    precio:'$34.00', precio_num:34.00, badge:null, emoji:'🧴',
   878	    desc:'Red ginseng + niacinamide firming cream. Revitalises, plumps and improves elasticity for mature or dry skin.',
   879	    tipo_piel:['seca','mixta','nolose'], categoria:'moisturizer',
   880	    concerns:['antiaging','deshidratacion','manchas'], sensible:true
   881	  },
   882	
   883	  /* ── SPF ────────────────────────────────────────────────────── */
   884	  {
   885	    id:'beauty-joseon-spf', handle:'beauty-of-joseon-relief-sun-rice-probiotics-spf50-pa-50ml',
   886	    nombre:'Beauty of Joseon Relief Sun: Rice + Probiotics SPF50+',
   887	    precio:'$16.00', precio_num:16.00, badge:'Best Seller', emoji:'☀️',
   888	    desc:'The most beloved K-Beauty SPF. Rice extract + probiotics, zero white cast, deeply calming for sensitive skin.',
   889	    tipo_piel:['grasa','mixta','sensible','seca','nolose'], categoria:'spf',
   890	    concerns:['manchas','rojeces','deshidratacion'], sensible:true
   891	  },
   892	  {
   893	    id:'haruharu-mineral-spf', handle:'haruharu-wonder-black-rice-pure-mineral-relief-daily-sunscreen-spf50-pa-50ml-1-69fl-oz',
   894	    nombre:'Haruharu Wonder Black Rice Pure Mineral Sunscreen SPF50+',
   895	    precio:'$22.00', precio_num:22.00, badge:'Best Seller', emoji:'☀️',
   896	    desc:'Reef-safe mineral SPF50+ with black rice and niacinamide. Anti-pollution, anti-pigmentation, sensitive-skin safe.',
   897	    tipo_piel:['sensible','seca','mixta','nolose'], categoria:'spf',
   898	    concerns:['manchas','rojeces','deshidratacion'], sensible:true
   899	  },
   900	  {
   901	    id:'abib-sunstick', handle:'abib-airy-sunstick-protection-bar-broad-spectrum-spf50-0-81-oz-23-g-semi-matte',
   902	    nombre:'Abib Airy Sunstick Protection Bar SPF50+',
   903	    precio:'$22.00', precio_num:22.00, badge:'Best Seller', emoji:'☀️',
   904	    desc:'Hybrid SPF50+ stick with ceramides and peptides. Semi-matte finish — no white cast, makeup-friendly.',
   905	    tipo_piel:['grasa','mixta','nolose'], categoria:'spf',
   906	    concerns:['manchas','acne','poros'], sensible:true
   907	  },
   908	  {
   909	    id:'purito-spf', handle:'purito-sun-day-adventure-korean-sunscreen-50ml-1-69-fl-oz',
   910	    nombre:'PURITO Sun Day Adventure Sunscreen SPF50+',
   911	    precio:'$18.00', precio_num:18.00, badge:'Best Seller', emoji:'☀️',
   912	    desc:'Hybrid SPF50+ that is oil-free and non-comedogenic. Smooth texture that works perfectly under makeup.',
   913	    tipo_piel:['grasa','mixta','sensible','nolose'], categoria:'spf',
   914	    concerns:['acne','poros','manchas'], sensible:true
   915	  },
   916	  {
   917	    id:'haruharu-airyfit-spf', handle:'haruharu-wonder-black-rice-moisture-airyfit-daily-sunscreen-50ml-1-69fl-oz',
   918	    nombre:'Haruharu Wonder Black Rice Moisture Airyfit Sunscreen',
   919	    precio:'$24.00', precio_num:24.00, badge:'Best Seller', emoji:'☀️',
   920	    desc:'Antioxidant-rich black rice SPF50+ with niacinamide. Fragrance-free, ultra-light finish for sensitive skin.',
   921	    tipo_piel:['sensible','seca','mixta','nolose'], categoria:'spf',
   922	    concerns:['manchas','rojeces','deshidratacion'], sensible:true
   923	  },
   924	  {
   925	    id:'dalba-spf', handle:'dalba-piedmont-waterfull-tone-up-sunscreen-serum-broad-spectrum-spf-50-1-7fl-oz',
   926	    nombre:"d'Alba Waterfull Tone-Up Sunscreen Serum SPF50+",
   927	    precio:'$28.00', precio_num:28.00, badge:'Best Seller', emoji:'☀️',
   928	    desc:'Hybrid sunscreen-serum with white truffle. Tone-up effect, dewy glow finish — perfect base for makeup.',
   929	    tipo_piel:['seca','mixta','nolose'], categoria:'spf',
   930	    concerns:['manchas','deshidratacion','textura'], sensible:true
   931	  },
   932	
   933	  /* ── MASKS ──────────────────────────────────────────────────── */
   934	  {
   935	    id:'cosrx-snail-mask', handle:'cosrx-advanced-snail-mucin-glass-glow-hydrogel-face-masks-skincare-3-ea',
   936	    nombre:'COSRX Advanced Snail Mucin Glass Glow Hydrogel Masks',
   937	    precio:'$12.00', precio_num:12.00, badge:null, emoji:'🩵',
   938	    desc:'Snail mucin hydrogel masks for glass skin. 25% snail secretion + collagen for deep hydration and brightening.',
   939	    tipo_piel:['grasa','mixta','seca','sensible','nolose'], categoria:'mask',
   940	    concerns:['deshidratacion','manchas','antiaging'], sensible:true
   941	  },
   942	  {
   943	    id:'vt-soothing-mask', handle:'vt-cosmetics-daily-soothing-mask-30ea-facial-sheet-mask-for-moist-hydrating',
   944	    nombre:'VT Cosmetics Daily Soothing Mask (30 sheets)',
   945	    precio:'$29.00', precio_num:29.00, badge:'Best Seller', emoji:'🩵',
   946	    desc:'Daily centella sheet mask for instant hydration and soothing. Non-sticky, fast-absorbing ampoule essence.',
   947	    tipo_piel:['sensible','mixta','seca','nolose'], categoria:'mask',
   948	    concerns:['deshidratacion','rojeces','textura'], sensible:true
   949	  },
   950	  {
   951	    id:'pyunkang-mask', handle:'pyunkang-yul-highly-moisturizing-mask-pack-10-pcs',
   952	    nombre:'Pyunkang Yul Highly Moisturizing Mask Pack',
   953	    precio:'$14.00', precio_num:14.00, badge:null, emoji:'🩵',
   954	    desc:'10-pack ceramide + hyaluronic acid sheet mask for dry, sensitised skin. Fragrance-free, dermatologist tested.',
   955	    tipo_piel:['seca','sensible','mixta','nolose'], categoria:'mask',
   956	    concerns:['deshidratacion','rojeces','antiaging'], sensible:true
   957	  },
   958	  {
   959	    id:'abib-overnight-mask', handle:'abib-rice-probiotics-overnight-mask-barrier-jelly-2-7-fl-oz',
   960	    nombre:'Abib Rice Probiotics Overnight Mask Barrier Jelly',
   961	    precio:'$26.00', precio_num:26.00, badge:'Best Seller', emoji:'🩵',
   962	    desc:'Overnight jelly sleeping mask with rice probiotics. Wakes up skin radiant, plump and barrier-strong.',
   963	    tipo_piel:['seca','mixta','nolose'], categoria:'mask',
   964	    concerns:['deshidratacion','manchas','antiaging'], sensible:true
   965	  },
   966	  {
   967	    id:'medicube-clay-mask', handle:'medicube-zero-pore-blackhead-mud-facial-mask-3-52-oz',
   968	    nombre:'Medicube Zero Pore Blackhead Mud Facial Mask',
   969	    precio:'$24.00', precio_num:24.00, badge:'Best Seller', emoji:'🩵',
   970	    desc:'AHA + BHA + PHA clay mask that deep-cleans pores and removes blackheads in 3 minutes.',
   971	    tipo_piel:['grasa','mixta','nolose'], categoria:'mask',
   972	    concerns:['acne','poros','textura'], sensible:false
   973	  },
   974	
   975	  /* ── EYE CARE ───────────────────────────────────────────────── */
   976	  {
   977	    id:'medicube-eye-serum', handle:'medicube-salmon-dna-pdrn-pink-peptide-eye-serum-with-niacinamide-and-99-purity-retinol-1-01fl-oz',
   978	    nombre:'Medicube Salmon DNA PDRN Pink Peptide Eye Serum',
   979	    precio:'$38.00', precio_num:38.00, badge:'Best Seller', emoji:'👁️',
   980	    desc:'PDRN + peptide + retinol eye serum that brightens dark circles, firms and reduces fine lines around the eyes.',
   981	    tipo_piel:['seca','mixta','nolose'], categoria:'eye',
   982	    concerns:['antiaging','manchas','deshidratacion'], sensible:true
   983	  },
   984	  {
   985	    id:'haruharu-eye-cream', handle:'haruharu-wonder-black-rice-bakuchiol-eye-cream-0-67-fl-oz-20ml-anti-aging-wrinkle-care-natural-retinol-alternative-cruelty-free-ewg-green',
   986	    nombre:'Haruharu Wonder Black Rice Bakuchiol Eye Cream',
   987	    precio:'$28.00', precio_num:28.00, badge:'Best Seller', emoji:'👁️',
   988	    desc:'Natural retinol-alternative bakuchiol eye cream. Firms, brightens dark circles and reduces fine lines gently.',
   989	    tipo_piel:['seca','mixta','sensible','nolose'], categoria:'eye',
   990	    concerns:['antiaging','manchas','deshidratacion'], sensible:true
   991	  },
   992	  {
   993	    id:'beauty-joseon-eye-serum', handle:'beauty-of-joseon-revive-eye-serum-with-retinal-niacinamide-correction-for-puffy-eye-bags-fine-lines-dark-circles-wrinkles-korean-skin-care-30ml-1-fl-oz',
   994	    nombre:'Beauty of Joseon Revive Eye Serum: Retinal + Niacinamide',
   995	    precio:'$22.00', precio_num:22.00, badge:'Best Seller', emoji:'👁️',
   996	    desc:'Retinal + niacinamide eye serum for dark circles, puffiness and fine lines. Results from week 2.',
   997	    tipo_piel:['seca','mixta','nolose'], categoria:'eye',
   998	    concerns:['antiaging','manchas','deshidratacion'], sensible:true
   999	  },
    1000	  {
  1001	    id:'goodal-eye-patch', handle:'goodal-green-tangerine-vitamin-c-moisturizing-eye-patch-5-minute-hydrating-gel-patch-60-sheets',
  1002	    nombre:'Goodal Green Tangerine Vitamin C Eye Patches (60 sheets)',
  1003	    precio:'$22.00', precio_num:22.00, badge:'Best Seller', emoji:'👁️',
  1004	    desc:'5-minute vitamin C hydrogel eye patches that brighten dark circles, firm and instantly plump the eye area.',
  1005	    tipo_piel:['grasa','mixta','seca','sensible','nolose'], categoria:'eye',
  1006	    concerns:['manchas','antiaging','deshidratacion'], sensible:true
  1007	  }
  1008	];
  1009	
  1010	
  1011	/* ============================================================
  1012	   5. SKIN PROFILES
  1013	   Defines routine steps per profile.
  1014	   Products are found dynamically — nothing is hardcoded here.
  1015	============================================================ */
  1016	const SHATOKB_PERFILES = {
  1017	  grasa_acne: {
  1018	    titulo: 'The Oily Skin Overachiever',
  1019	    descripcion: "Your skin works overtime — producing more oil than it needs, which clogs pores and keeps breakouts coming back. The good news? K-Beauty was practically invented for this. These routines don't just mask the problem. They retrain your skin.",
  1020	    resumen: ['🫧 Oily & breakout-prone', '🎯 Active treatment', '⚡ Fast visible results'],
  1021	    pasos: [
  1022	      { categoria: 'cleanser',    nombre: 'Cleanser',          por_que: 'A low pH cleanser removes oil and impurities without triggering more sebum production. Your pores can finally breathe.' },
  1023	      { categoria: 'toner',       nombre: 'Exfoliating Toner', por_que: 'AHA/BHA dissolves the sebum trapped inside pores. This is the step most people skip — and the one that makes the biggest difference.' },
  1024	      { categoria: 'moisturizer', nombre: 'Moisturizer',       por_que: 'Skipping moisturizer makes oily skin produce even more oil. A lightweight, non-comedogenic formula tells your skin to stop overcompensating.' },
  1025	      { categoria: 'spf',         nombre: 'SPF 50+',           por_que: "Non-negotiable. Your acne-fighting actives make skin photosensitive — skipping SPF undoes everything else you're doing." }
  1026	    ]
  1027	  },
  1028	  grasa_poros: {
  1029	    titulo: 'The Pore Minimizer',
  1030	    descripcion: "Enlarged pores aren't just genetic — they're caused by excess oil and dead skin cells stretching them out over time. Korean chemical exfoliation is the most effective method in the world for gradually refining pore appearance. And it works.",
  1031	    resumen: ['🫧 Oily skin', '🔬 Visible pores', '✨ Texture refinement'],
  1032	    pasos: [
  1033	      { categoria: 'cleanser',    nombre: 'Cleanser',          por_que: "Clears away the oil that keeps pores stretched and clogged — without sending your sebaceous glands into overdrive." },
  1034	      { categoria: 'toner',       nombre: 'Exfoliating Toner', por_que: "This is where the magic happens. AHA/BHA acids break down the buildup inside pores. Weekly use visibly shrinks them." },
  1035	      { categoria: 'moisturizer', nombre: 'Moisturizer',       por_que: "Light hydration locks in your routine's results without adding weight or blocking pores." },
  1036	      { categoria: 'spf',         nombre: 'SPF 50+',           por_que: 'An oil-free formula keeps you matte all day. UV damage worsens pore appearance — SPF stops that from happening.' }
  1037	    ]
  1038	  },
  1039	  mixta_general: {
  1040	    titulo: 'The Balancing Act',
  1041	    descripcion: "Combination skin is tricky because it has contradictory needs in different zones. Products that fix one area often make another worse. K-Beauty's layering method solves this — you hydrate where you need it and control where you don't.",
  1042	    resumen: ['☯️ Combination skin', '💧 Needs balance', '🎯 Zone-specific results'],
  1043	    pasos: [
  1044	      { categoria: 'cleanser',    nombre: 'Cleanser',        por_que: 'Gently cleanses without drying out your cheeks or over-stimulating the T-zone. Balance starts here.' },
  1045	      { categoria: 'toner',       nombre: 'Hydrating Toner', por_que: 'Hydration delivered in layers absorbs evenly across all zones — no greasy patches, no tight areas.' },
  1046	      { categoria: 'essence',     nombre: 'Essence',         por_que: "The K-Beauty secret weapon. Replenishes moisture where it's needed while keeping oily areas in check." },
  1047	      { categoria: 'spf',         nombre: 'SPF 50+',         por_que: 'Daily sun protection without the greasy residue. Your skin stays balanced all day.' }
  1048	    ]
  1049	  },
  1050	  mixta_manchas: {
  1051	    titulo: 'The Spot Eraser',
  1052	    descripcion: "You're fighting two battles at once — excess sebum and hyperpigmentation. The breakthrough? Korean brightening actives like vitamin C, niacinamide and tranexamic acid work on both simultaneously. Your even tone is closer than you think.",
  1053	    resumen: ['☯️ Combination skin', '🟤 Dark spots & marks', '✨ Even tone incoming'],
  1054	    pasos: [
  1055	      { categoria: 'cleanser', nombre: 'Cleanser',          por_que: 'A clean, pH-balanced canvas ensures your brightening actives penetrate deeply instead of sitting on top of dead skin.' },
  1056	      { categoria: 'serum',    nombre: 'Brightening Serum', por_que: 'Vitamin C in the morning is the gold standard for fading spots and blocking future pigmentation. This step changes faces.' },
  1057	      { categoria: 'essence',  nombre: 'Essence',           por_que: 'Accelerates cell renewal and progressively evens out skin tone from layer one.' },
  1058	      { categoria: 'spf',      nombre: 'SPF 50+',           por_que: "Without SPF, your brightening actives are fighting a losing battle. UV exposure is the #1 cause of new dark spots." }
  1059	    ]
  1060	  },
  1061	  seca_hidratacion: {
  1062	    titulo: 'The Deep Hydration Protocol',
  1063	    descripcion: "Your skin is thirsty at a cellular level — and a single moisturizer isn't enough. K-Beauty invented layered hydration for exactly this: you build water content from the deepest layer outward, locking each one in before adding the next. The result is skin that stays plump for hours.",
  1064	    resumen: ['🌵 Dry skin', '💧 Hydration is everything', '🛡️ Barrier restoration'],
  1065	    pasos: [
  1066	      { categoria: 'cleanser',    nombre: 'Cleanser',        por_que: "A sulfate-free, creamy formula cleanses without stealing the little moisture your skin has left. Never skip this." },
  1067	      { categoria: 'toner',       nombre: 'Hydrating Toner', por_que: 'First layer of water. Apply while your face is still slightly damp — absorption increases by 40%.' },
  1068	      { categoria: 'essence',     nombre: 'Essence',         por_que: "Second layer. This is where K-Beauty separates itself. The essence penetrates deeper than a moisturizer ever could." },
  1069	      { categoria: 'moisturizer', nombre: 'Moisturizer',     por_que: 'Seals everything in. Without this final step, all that hydration evaporates within the hour.' },
  1070	      { categoria: 'spf',         nombre: 'SPF 50+',         por_que: 'A hydrating SPF with a dewy finish adds one last layer of protection. UV damage is the #1 cause of skin dryness.' }
  1071	    ]
  1072	  },
  1073	  seca_antiaging: {
  1074	    titulo: 'The Age-Defying Ritual',
  1075	    descripcion: "Dry skin ages faster — that's not an opinion, it's biology. When your barrier is weakened, collagen breaks down faster and fine lines deepen. The solution is intense, consistent hydration paired with proven actives. K-Beauty does this better than anything else in the world.",
  1076	    resumen: ['🌵 Dry skin', '⏳ Anti-aging focus', '🔬 Clinically proven actives'],
  1077	    pasos: [
  1078	      { categoria: 'cleanser',    nombre: 'Cleanser',        por_que: "Sulfate-free is non-negotiable for you. Harsh cleansers accelerate aging by stripping your skin's natural lipid barrier." },
  1079	      { categoria: 'toner',       nombre: 'Hydrating Toner', por_que: 'Preps skin before actives. Hydrated skin absorbs serums more effectively — this step multiplies everything that comes after.' },
  1080	      { categoria: 'serum',       nombre: 'Active Serum',    por_que: 'Vitamin C (morning) brightens and protects. Retinol (evening) rebuilds collagen from within. Two serums. Transformative results.' },
  1081	      { categoria: 'moisturizer', nombre: 'Moisturizer',     por_que: 'Rich, barrier-repairing hydration. While you sleep, your skin repairs itself — this gives it everything it needs to do that.' },
  1082	      { categoria: 'spf',         nombre: 'SPF 50+',         por_que: 'UV damage is responsible for 90% of visible aging. This one step protects all the work everything else is doing.' }
  1083	    ]
  1084	  },
  1085	  sensible_rojeces: {
  1086	    titulo: 'The Calm-Down Routine',
  1087	    descripcion: "Your skin isn't high-maintenance — it's just been treated with the wrong products. Most skincare is too aggressive for reactive skin. K-Beauty's calming philosophy was built around ingredients like Centella asiatica, panthenol and mugwort — gentle enough for the most sensitive skin, powerful enough to actually repair it.",
  1088	    resumen: ['🌸 Sensitive & reactive', '🔴 Redness relief', '🛡️ Barrier repair mode'],
  1089	    pasos: [
  1090	      { categoria: 'cleanser',    nombre: 'Cleanser',      por_que: 'Fragrance-free, SLS-free, minimal ingredients. Every unnecessary ingredient is a potential trigger — this step removes all of them.' },
  1091	      { categoria: 'toner',       nombre: 'Calming Toner', por_que: 'Alcohol-free, centella or aloe-based. Cools down redness on contact and starts repairing your skin barrier immediately.' },
  1092	      { categoria: 'serum',       nombre: 'Calming Serum', por_que: "Centella asiatica is Korea's #1 skin-calming ingredient. Clinical studies show 70% redness reduction in 4 weeks of consistent use." },
  1093	      { categoria: 'moisturizer', nombre: 'Repair Cream',  por_que: 'A stronger barrier means less reactivity. Every time you use this, your skin gets a little tougher — in the best possible way.' },
  1094	      { categoria: 'spf',         nombre: 'SPF 50+',       por_que: 'Mineral (physical) sunscreens sit on top of the skin instead of being absorbed — far gentler for reactive skin types.' }
  1095	    ]
  1096	  },
  1097	  general_glow: {
  1098	    titulo: 'The Glow Starter Kit',
  1099	    descripcion: "You don't need an 18-step routine to get results. You need the right products, in the right order, for your skin. This is the routine that introduces your skin to K-Beauty — and once you feel the difference, you'll never go back.",
  1100	    resumen: ['✨ Glow is the goal', '💧 Hydration first', '🌟 Simple but powerful'],
  1101	    pasos: [
  1102	      { categoria: 'cleanser',    nombre: 'Cleanser',    por_que: "Every great routine starts with a clean canvas. The right cleanser doesn't just clean — it sets the pH your other products need to work." },
  1103	      { categoria: 'essence',     nombre: 'Essence',     por_que: "The step that makes K-Beauty different from everything else. One bottle of snail mucin or fermented yeast changed millions of people's skin. It will change yours." },
  1104	      { categoria: 'moisturizer', nombre: 'Moisturizer', por_que: 'Locks in everything. Keeps your barrier intact. Gives you that "I just woke up like this" glow that lasts all day.' },
  1105	      { categoria: 'spf',         nombre: 'SPF 50+',     por_que: "If you're only going to do one thing for your skin, make it SPF. It's the single most powerful anti-aging, anti-damage step in existence." }
  1106	    ]
  1107	  }
  1108	};
  1109	
  1110	
  1111	/* ============================================================
  1112	   6. SCORING ENGINE
  1113	============================================================ */
  1114	function shatokbCalcularPerfil(resp) {
  1115	  const puntos = {};
  1116	  Object.keys(SHATOKB_PERFILES).forEach(p => { puntos[p] = 0; });
  1117	  const r = resp;
  1118	
  1119	  if (r.tipo_piel === 'grasa')    { puntos.grasa_acne += 3; puntos.grasa_poros += 3; }
  1120	  if (r.tipo_piel === 'mixta')    { puntos.mixta_general += 3; puntos.mixta_manchas += 2; }
  1121	  if (r.tipo_piel === 'seca')     { puntos.seca_hidratacion += 3; puntos.seca_antiaging += 2; }
  1122	  if (r.tipo_piel === 'sensible') { puntos.sensible_rojeces += 5; }
  1123	  if (r.tipo_piel === 'nolose')   { puntos.general_glow += 3; }
  1124	
  1125	  if (r.preocupacion === 'acne')           { puntos.grasa_acne += 4; }
  1126	  if (r.preocupacion === 'poros')          { puntos.grasa_poros += 4; }
  1127	  if (r.preocupacion === 'manchas')        { puntos.mixta_manchas += 4; puntos.seca_antiaging += 1; }
  1128	  if (r.preocupacion === 'deshidratacion') { puntos.seca_hidratacion += 4; puntos.mixta_general += 2; }
  1129	  if (r.preocupacion === 'rojeces')        { puntos.sensible_rojeces += 4; }
  1130	  if (r.preocupacion === 'antiaging')      { puntos.seca_antiaging += 4; }
  1131	  if (r.preocupacion === 'textura')        { puntos.grasa_poros += 2; puntos.mixta_general += 2; }
  1132	
  1133	  if (r.objetivo === 'calmar')    { puntos.sensible_rojeces += 3; }
  1134	  if (r.objetivo === 'controlar') { puntos.grasa_acne += 2; puntos.grasa_poros += 2; }
  1135	  if (r.objetivo === 'hidratar')  { puntos.seca_hidratacion += 3; puntos.mixta_general += 2; }
  1136	  if (r.objetivo === 'unificar')  { puntos.mixta_manchas += 3; }
  1137	  if (r.objetivo === 'glow')      { puntos.general_glow += 2; puntos.seca_hidratacion += 1; }
  1138	  if (r.sensibilidad === 'alta')  { puntos.sensible_rojeces += 3; }
  1139	
  1140	  let mejor = 'general_glow', max = 0;
  1141	  Object.entries(puntos).forEach(([k, v]) => { if (v > max) { max = v; mejor = k; } });
  1142	  return mejor;
  1143	}
  1144	
  1145	
  1146	/* ============================================================
  1147	   7. RECOMMENDATION ENGINE
  1148	============================================================ */
  1149	const SHATOKB_BUDGET_LIMITS = { bajo: 40, medio: 80, alto: Infinity };
  1150	const SHATOKB_MAX_OPTIONS   = 3;
  1151	
  1152	function shatokbRecomendarProductos(perfilId, respuestas) {
  1153	  const perfil       = SHATOKB_PERFILES[perfilId];
  1154	  const tipoPiel     = respuestas.tipo_piel;
  1155	  const sensibilidad = respuestas.sensibilidad;
  1156	  const preocupacion = respuestas.preocupacion;
  1157	  const objetivo     = respuestas.objetivo;
  1158	  const nivelRutina  = respuestas.nivel_rutina;
  1159	  const presupuesto  = respuestas.presupuesto;
  1160	  const budgetMax    = SHATOKB_BUDGET_LIMITS[presupuesto] || Infinity;
  1161	
  1162	  // Trim steps based on routine level
  1163	  let pasos = [...perfil.pasos];
  1164	  if (nivelRutina === 'basica' && pasos.length > 4) {
  1165	    const order     = ['cleanser', 'toner', 'essence', 'serum', 'moisturizer', 'spf'];
  1166	    const essential = ['cleanser', 'moisturizer', 'spf'];
  1167	    const actives   = pasos.filter(p => !essential.includes(p.categoria));
  1168	    const base      = pasos.filter(p => essential.includes(p.categoria));
  1169	    pasos = [...base, ...actives.slice(0, 1)]
  1170	      .sort((a, b) => order.indexOf(a.categoria) - order.indexOf(b.categoria));
  1171	  }
  1172	
  1173	  return pasos.map(paso => {
  1174	    let candidatos = SHATOKB_CATALOGO.filter(p => p.categoria === paso.categoria);
  1175	
  1176	    candidatos = candidatos.map(p => {
  1177	      let score = 0;
  1178	      if (p.tipo_piel.includes(tipoPiel))         score += 10;
  1179	      else if (tipoPiel === 'nolose')              score += 5;
  1180	      if (p.concerns.includes(preocupacion))       score += 8;
  1181	      if (p.concerns.includes(objetivo))           score += 5;
  1182	      if (sensibilidad === 'alta' && p.sensible)   score += 6;
  1183	      if (sensibilidad === 'alta' && !p.sensible)  score -= 4;
  1184	      if (p.precio_num <= budgetMax)               score += 4;
  1185	      else                                         score -= 3;
  1186	      return { ...p, _score: score };
  1187	    });
  1188	
  1189	    candidatos.sort((a, b) => b._score - a._score);
  1190	    const opciones = candidatos.slice(0, SHATOKB_MAX_OPTIONS);
  1191	
  1192	    return { paso: paso.nombre, por_que: paso.por_que, opciones };
  1193	  });
  1194	}
  1195	
  1196	
  1197	/* ============================================================
  1198	   8. QUIZ STATE & NAVIGATION
  1199	============================================================ */
  1200	const shatokbState = {
  1201	  preguntaActual: 0,
  1202	  respuestas:     {},
  1203	  completado:     false,
  1204	  selectedProducts: {}   // { stepIndex: productId }
  1205	};
  1206	
  1207	function shatokbIniciarQuiz() {
  1208	  const inicio    = document.getElementById('shatokb-quiz-inicio');
  1209	  const cabecera  = document.getElementById('shatokb-quiz-cabecera');
  1210	  const progreso  = document.getElementById('shatokb-progreso');
  1211	  const preguntas = document.getElementById('shatokb-quiz-form');
  1212	
  1213	  if (inicio)    inicio.style.display    = 'none';
  1214	  if (cabecera)  cabecera.style.display  = 'none';
  1215	  if (progreso)  progreso.style.display  = 'block';
  1216	  if (preguntas) preguntas.style.display = 'block';
  1217	
  1218	  shatokbRenderPregunta(0);
  1219	}
  1220	
  1221	function shatokbRenderPregunta(idx) {
  1222	  shatokbState.preguntaActual = idx;
  1223	  const total = SHATOKB_PREGUNTAS.length;
  1224	  const q     = SHATOKB_PREGUNTAS[idx];
  1225	  const pct   = Math.round((idx / total) * 100);
  1226	
  1227	  const fill  = document.getElementById('shatokb-progreso-barra');
  1228	  const texto = document.getElementById('shatokb-progreso-texto');
  1229	  const pctEl = document.getElementById('shatokb-pregunta-num');
  1230	
  1231	  if (fill)  fill.style.width     = pct + '%';
  1232	  if (texto) texto.textContent    = 'Question ' + (idx + 1) + ' of ' + total;
  1233	  if (pctEl) pctEl.textContent    = pct + '%';
  1234	
  1235	  const container = document.getElementById('shatokb-quiz-form');
  1236	  if (!container) return;
  1237	
  1238	  container.innerHTML = `
  1239	    <div class="shatokb-pregunta">
  1240	      <div class="shatokb-pregunta__header">
  1241	        <span class="shatokb-pregunta__emoji" aria-hidden="true">${q.emoji || '💬'}</span>
  1242	        <div>
  1243	          <h3 class="shatokb-pregunta__titulo">${q.titulo}</h3>
  1244	          ${q.subtitulo ? `<p class="shatokb-pregunta__subtitulo">${q.subtitulo}</p>` : ''}
  1245	        </div>
  1246	      </div>
  1247	      <div class="shatokb-opciones">
  1248	        ${q.opciones.map(op => `
  1249	          <button
  1250	            class="shatokb-opcion${shatokbState.respuestas[q.id] === op.valor ? ' shatokb-opcion--selected' : ''}"
  1251	            onclick="shatokbElegirRespuesta('${q.id}','${op.valor}',this)"
  1252	            type="button">
  1253	            <span class="shatokb-opcion__label">${op.label}</span>
  1254	            <span class="shatokb-opcion__desc">${op.desc || ''}</span>
  1255	          </button>
  1256	        `).join('')}
  1257	      </div>
  1258	      <div class="shatokb-quiz-nav">
  1259	        ${idx > 0
  1260	          ? `<button class="shatokb-btn shatokb-btn--ghost" onclick="shatokbRenderPregunta(${idx - 1})" type="button">← Back</button>`
  1261	          : `<span></span>`}
  1262	        <button
  1263	          class="shatokb-btn shatokb-btn--primary"
  1264	          id="shatokb-btn-siguiente"
  1265	          onclick="shatokbSiguientePregunta(${idx})"
  1266	          type="button"
  1267	          ${shatokbState.respuestas[q.id] ? '' : 'disabled'}>
  1268	          ${idx === total - 1 ? 'See My Routine →' : 'Next →'}
  1269	        </button>
  1270	      </div>
  1271	    </div>`;
  1272	}
  1273	
  1274	function shatokbElegirRespuesta(qId, valor, btn) {
  1275	  shatokbState.respuestas[qId] = valor;
  1276	  document.querySelectorAll('.shatokb-opcion').forEach(b => b.classList.remove('shatokb-opcion--selected'));
  1277	  btn.classList.add('shatokb-opcion--selected');
  1278	  const sig = document.getElementById('shatokb-btn-siguiente');
  1279	  if (sig) sig.disabled = false;
  1280	  setTimeout(() => shatokbSiguientePregunta(shatokbState.preguntaActual), 420);
  1281	}
  1282	
  1283	function shatokbSiguientePregunta(idx) {
  1284	  const q = SHATOKB_PREGUNTAS[idx];
  1285	  if (!shatokbState.respuestas[q.id]) return;
  1286	  if (idx + 1 < SHATOKB_PREGUNTAS.length) {
  1287	    shatokbRenderPregunta(idx + 1);
  1288	  } else {
  1289	    shatokbMostrarGateEmail();
  1290	  }
  1291	}
  1292	
  1293	
  1294	/* ============================================================
  1295	   9. EMAIL GATE + META PIXEL
  1296	============================================================ */
  1297	let shatokbEmailCaptured = null;
  1298	
  1299	function shatokbMostrarGateEmail() {
  1300	  const fill  = document.getElementById('shatokb-progreso-barra');
  1301	  const texto = document.getElementById('shatokb-progreso-texto');
  1302	  const pctEl = document.getElementById('shatokb-pregunta-num');
  1303	  const form  = document.getElementById('shatokb-quiz-form');
  1304	
  1305	  if (fill)  fill.style.width     = '100%';
  1306	  if (texto) texto.textContent    = '🎉 Done! Preparing your routine…';
  1307	  if (pctEl) pctEl.textContent    = '100%';
  1308	  if (form)  form.style.display   = 'none';
  1309	
  1310	  shatokbTrackPixel('QuizCompleted', { skin_profile: shatokbCalcularPerfil(shatokbState.respuestas) });
  1311	
  1312	  const gate = document.getElementById('stk-email-gate');
  1313	  if (!gate) { shatokbMostrarResultado(); return; }  // graceful fallback if gate not in template
  1314	  gate.style.display = 'flex';
  1315	  setTimeout(() => gate.classList.add('visible'), 10);
  1316	  setTimeout(() => {
  1317	    const inp = document.getElementById('stk-email-input');
  1318	    if (inp) inp.focus();
  1319	  }, 80);
  1320	}
  1321	
  1322	async function shatokbSubmitEmail(e) {
  1323	  e.preventDefault();
  1324	  const emailEl = document.getElementById('stk-email-input');
  1325	  const email   = emailEl ? emailEl.value.trim() : '';
  1326	  if (!email) return;
  1327	
  1328	  const btn = document.getElementById('stk-gate-submit');
  1329	  if (btn) { btn.textContent = 'One moment…'; btn.disabled = true; }
  1330	  shatokbEmailCaptured = email;
  1331	
  1332	  try {
  1333	    await fetch('/contact', {
  1334	      method:  'POST',
  1335	      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  1336	      body: new URLSearchParams({
  1337	        form_type:          'customer',
  1338	        utf8:               '✓',
  1339	        'contact[email]':   email,
  1340	        'contact[tags]':    'quiz-lead,skin-' + shatokbCalcularPerfil(shatokbState.respuestas),
  1341	        'contact[body]':    'Skin quiz profile: ' + shatokbCalcularPerfil(shatokbState.respuestas)
  1342	      })
  1343	    });
  1344	  } catch(_) { /* non-blocking — don't gate results on network failure */ }
  1345	
  1346	  shatokbTrackPixel('Lead', { content_name: 'quiz_' + shatokbCalcularPerfil(shatokbState.respuestas) });
  1347	  shatokbCerrarGate();
  1348	  shatokbMostrarResultado();
  1349	}
  1350	
  1351	function shatokbSaltarEmail() { shatokbCerrarGate(); shatokbMostrarResultado(); }
  1352	
  1353	function shatokbCerrarGate() {
  1354	  const gate = document.getElementById('stk-email-gate');
  1355	  if (!gate) return;
  1356	  gate.classList.remove('visible');
  1357	  setTimeout(() => { gate.style.display = 'none'; }, 300);
  1358	}
  1359	
  1360	function shatokbTrackPixel(eventName, params = {}) {
  1361	  try { if (typeof fbq === 'function') fbq('track', eventName, params); } catch(_) {}
  1362	}
  1363	
  1364	
  1365	/* ============================================================
  1366	   10. RESULT DISPLAY
  1367	   Waits for catalogue to finish loading before rendering.
  1368	============================================================ */
  1369	async function shatokbMostrarResultado() {
  1370	  const fill  = document.getElementById('shatokb-progreso-barra');
  1371	  const texto = document.getElementById('shatokb-progreso-texto');
  1372	  const pctEl = document.getElementById('shatokb-pregunta-num');
  1373	  if (fill)  fill.style.width   = '100%';
  1374	  if (texto) texto.textContent  = '✓ Complete!';
  1375	  if (pctEl) pctEl.textContent  = '100%';
  1376	
  1377	  const form = document.getElementById('shatokb-quiz-form');
  1378	  if (form)  form.style.display = 'none';
  1379	
  1380	  const resultadoEl = document.getElementById('shatokb-resultado');
  1381	  if (!resultadoEl) return;
  1382	  resultadoEl.style.display = 'block';
  1383	  resultadoEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  1384	
  1385	  // Show spinner while catalogue loads
  1386	  if (!shatokbCatalogoCargado) {
  1387	    const inner = resultadoEl.querySelector('.shatokb-resultado__inner') || resultadoEl;
  1388	    inner.innerHTML = `
  1389	      <div style="text-align:center; padding: 60px 20px;">
  1390	        <div style="font-size:40px; margin-bottom:16px;">⏳</div>
  1391	        <p style="font-family:'Prompt',sans-serif; font-size:18px; font-weight:700; color:#0b0335;">
  1392	          Building your personalized routine…
  1393	        </p>
  1394	        <p style="font-size:14px; color:#6b7280; margin-top:8px;">
  1395	          Loading your skin profile and product catalogue
  1396	        </p>
  1397	      </div>`;
  1398	
  1399	    await new Promise(resolve => {
  1400	      const check = setInterval(() => {
  1401	        if (shatokbCatalogoCargado) { clearInterval(check); resolve(); }
  1402	      }, 100);
  1403	    });
  1404	  }
  1405	
  1406	  const perfilId  = shatokbCalcularPerfil(shatokbState.respuestas);
  1407	  const perfil    = SHATOKB_PERFILES[perfilId];
  1408	  const pasosProd = shatokbRecomendarProductos(perfilId, shatokbState.respuestas);
  1409	  const tags      = perfil.resumen || [];
  1410	
  1411	  // Pre-select top option for each step
  1412	  shatokbState.selectedProducts = {};
  1413	  pasosProd.forEach((paso, i) => {
  1414	    if (paso.opciones.length > 0) shatokbState.selectedProducts[i] = paso.opciones[0].id;
  1415	  });
  1416	
  1417	  const presupuesto  = shatokbState.respuestas.presupuesto;
  1418	  const budgetMax    = SHATOKB_BUDGET_LIMITS[presupuesto] || Infinity;
  1419	  const budgetLabel  = { bajo: 'under $40', medio: '$40–$80', alto: 'premium' }[presupuesto] || '';
  1420	  const hasOverBudget = pasosProd.some(p => p.opciones.length > 0 && p.opciones[0].precio_num > budgetMax);
  1421	
  1422	  const inner = resultadoEl.querySelector('.shatokb-resultado__inner') || resultadoEl;
  1423	  inner.innerHTML = `
  1424	
  1425	    <!-- Profile header -->
  1426	    <div class="shatokb-resultado__header">
  1427	      <div class="shatokb-resultado__check">✨</div>
  1428	      <h2 class="shatokb-resultado__titulo">Your Skin Profile</h2>
  1429	      <p class="shatokb-resultado__perfil-nombre">${perfil.titulo}</p>
  1430	      <div class="shatokb-resultado__badges">
  1431	        ${tags.map(t => `<span class="shatokb-resultado__badge">${t}</span>`).join('')}
  1432	      </div>
  1433	      <p class="shatokb-resultado__desc">${perfil.descripcion}</p>
  1434	    </div>
  1435	
  1436	    ${hasOverBudget ? `
  1437	      <div class="stk-budget-note">
  1438	        ⚠️ Some recommended products exceed your <strong>${budgetLabel}</strong> budget. We've marked them so you can choose alternatives within your range.
  1439	      </div>` : ''}
  1440	
  1441	    <div style="margin-bottom: 24px;">
  1442	      <p class="stk-section-title">Your Personalized Routine</p>
  1443	      <p class="stk-section-sub">
  1444	        For each step below we've hand-picked the best options for your skin profile and budget.<br>
  1445	        <strong>All the products within each step work for your skin — pick the one you prefer.</strong>
  1446	        Your estimated total updates automatically as you choose.
  1447	      </p>
  1448	    </div>
  1449	
  1450	    <div id="shatokb-routine-steps">
  1451	      ${pasosProd.map((paso, stepIdx) => shatokbRenderPasoHTML(paso, stepIdx, budgetMax)).join('')}
  1452	    </div>
  1453	
  1454	    <!-- CTAs — rendered dynamically from Theme Editor config -->
  1455	    <div class="shatokb-resultado__ctas" id="shatokb-ctas" style="margin-top: 40px;"></div>
  1456	
  1457	    <!-- Sticky total bar -->
  1458	    <div class="stk-total-bar" id="stk-total-bar">
  1459	      <div class="stk-total-bar__info">
  1460	        <div class="stk-total-bar__timer" id="stk-timer">⏱️ Routine saved for 15:00</div>
  1461	        <div class="stk-total-bar__label" id="stk-total-bar-label">Estimated total for your routine</div>
  1462	        <div class="stk-total-bar__amount" id="stk-total-amount">$0.00</div>
  1463	      </div>
  1464	      <button class="stk-total-bar__cta" onclick="shatokbAddAllToCart()" id="stk-add-btn">
  1465	        🛒 Add my full routine to cart
  1466	      </button>
  1467	    </div>`;
  1468	
  1469	  shatokbActualizarTotal();
  1470	  shatokbRenderCTAs();
  1471	  shatokbApplyConfigToUI();
  1472	  shatokbIniciarTimer();
  1473	  shatokbCargarReviewsTodos(pasosProd);
  1474	  shatokbTrackPixel('ViewContent', {
  1475	    content_name:     'skin_routine_' + perfilId,
  1476	    content_category: perfilId,
  1477	    value: Object.values(shatokbState.selectedProducts).reduce((t, id) => {
  1478	      const p = SHATOKB_CATALOGO.find(x => x.id === id);
  1479	      return t + (p ? p.precio_num : 0);
  1480	    }, 0)
  1481	  });
  1482	}
  1483	
  1484	
  1485	/* ============================================================
  1486	   11. REVIEWS + URGENCY
  1487	============================================================ */
  1488	const shatokbReviewsCache = {};
  1489	
  1490	async function shatokbFetchReviews(handle) {
  1491	  if (shatokbReviewsCache[handle]) return shatokbReviewsCache[handle];
  1492	  try {
  1493	    const res  = await fetch(`/products/${handle}.js`);
  1494	    if (!res.ok) throw new Error();
  1495	    const data   = await res.json();
  1496	    const rating = parseFloat(data.metafields?.find?.(m => m.key === 'rating')?.value || 0);
  1497	    const count  = parseInt(data.metafields?.find?.(m => m.key === 'rating_count')?.value || 0);
  1498	    return shatokbReviewsCache[handle] = (rating > 0 && count > 0)
  1499	      ? { rating, count }
  1500	      : shatokbFallbackReviews(handle);
  1501	  } catch(_) {
  1502	    return shatokbReviewsCache[handle] = shatokbFallbackReviews(handle);
  1503	  }
  1504	}
  1505	
  1506	function shatokbFallbackReviews(h) {
  1507	  const s = h.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  1508	  return { rating: parseFloat((4.5 + (s % 6) * 0.1).toFixed(1)), count: 180 + (s % 820) };
  1509	}
  1510	
  1511	function shatokbRenderStars(r) {
  1512	  return '★'.repeat(Math.floor(r)) + (r % 1 >= 0.5 ? '½' : '') + '☆'.repeat(5 - Math.floor(r) - (r % 1 >= 0.5 ? 1 : 0));
  1513	}
  1514	
  1515	function shatokbViewersCount(h) { const s = h.split('').reduce((a,c) => a + c.charCodeAt(0), 0); return 2 + (s % 9); }
  1516	function shatokbStockCount(h)   { const s = h.split('').reduce((a,c) => a + c.charCodeAt(0), 0); return 3 + (s % 8); }
  1517	
  1518	async function shatokbCargarReviewsTodos(pasosProd) {
  1519	  await Promise.all(
  1520	    pasosProd.flatMap(p => p.opciones).map(prod =>
  1521	      shatokbFetchReviews(prod.handle || prod.id).then(rev => {
  1522	        const el = document.getElementById('rev-' + prod.id);
  1523	        if (el) {
  1524	          el.innerHTML = `
  1525	            <span class="stk-stars">${shatokbRenderStars(rev.rating)}</span>
  1526	            <span class="stk-rating">${rev.rating}</span>
  1527	            <span class="stk-rcount">(${rev.count.toLocaleString()} reviews)</span>`;
  1528	        }
  1529	      })
  1530	    )
  1531	  );
  1532	}
  1533	
  1534	
  1535	/* ============================================================
  1536	   12. PRODUCT RENDERING
  1537	============================================================ */
  1538	function shatokbRenderPasoHTML(paso, stepIdx, budgetMax) {
  1539	  const opcionesHTML = paso.opciones.map(prod => {
  1540	    const isSelected = shatokbState.selectedProducts[stepIdx] === prod.id;
  1541	    const overBudget = prod.precio_num > budgetMax;
  1542	    const viewers    = shatokbViewersCount(prod.handle || prod.id);
  1543	    const stock      = shatokbStockCount(prod.handle || prod.id);
  1544	
  1545	    let badgeHtml = '';
  1546	    if (overBudget)  badgeHtml = `<div class="stk-prod-option__badge">⚠️ Above your budget</div>`;
  1547	    else if (prod.badge) badgeHtml = `<div class="stk-prod-option__badge stk-prod-option__badge--neutral">${prod.badge}</div>`;
  1548	
  1549	    return `
  1550	      <div class="stk-prod-option${isSelected ? ' selected' : ''}"
  1551	           onclick="shatokbSeleccionarProducto(${stepIdx},'${prod.id}',this)"
  1552	           role="radio" aria-checked="${isSelected}" tabindex="0"
  1553	           data-handle="${prod.handle || prod.id}">
  1554	        ${badgeHtml}
  1555	        <div class="stk-prod-option__img">${prod.emoji}</div>
  1556	        <div class="stk-prod-option__name">${prod.nombre}</div>
  1557	        <div class="stk-prod-reviews" id="rev-${prod.id}">
  1558	          <span style="color:#f0a500;">★★★★★</span>
  1559	          <span style="font-size:11px;color:#9ca3af">loading…</span>
  1560	        </div>
  1561	        <div class="stk-prod-urgency">
  1562	          <span class="stk-prod-urgency__viewers">👀 ${viewers} people viewing now</span>
  1563	          <span class="stk-prod-urgency__stock">⚡ Only ${stock} left in stock</span>
  1564	        </div>
  1565	        <div class="stk-prod-option__desc">${prod.desc}</div>
  1566	        <div class="stk-prod-option__price">${prod.precio}</div>
  1567	        <button
  1568	          class="koi-ask-btn"
  1569	          onclick="event.stopPropagation(); window.shatokbPreguntarProducto('${prod.nombre.replace(/'/g, "\\'")}', '${paso.paso.replace(/'/g, "\\'")}', '${prod.precio}')"
  1570	          title="Ask KOI why this product was chosen for you"
  1571	          type="button"
  1572	        >
  1573	          <span class="koi-ask-btn__icon">?</span>
  1574	          Why this product?
  1575	        </button>
  1576	        <div class="stk-prod-option__select-hint">${isSelected ? '✓ In your routine' : 'Add to my routine'}</div>
  1577	      </div>`;
  1578	  }).join('');
  1579	
  1580	  return `
  1581	    <div class="stk-routine-step" data-step="${stepIdx}">
  1582	      <div class="stk-routine-step__header">
  1583	        <div class="stk-routine-step__num">${stepIdx + 1}</div>
  1584	        <div>
  1585	          <div class="stk-routine-step__name">${paso.paso}</div>
  1586	          <div class="stk-routine-step__why">${paso.por_que}</div>
  1587	        </div>
  1588	      </div>
  1589	      <p style="font-size:12px;color:#6b7280;margin-bottom:10px;font-style:italic;">
  1590	        ✦ All ${paso.opciones.length} options match your skin profile — pick your favourite:
  1591	      </p>
  1592	      <div class="stk-routine-step__options">${opcionesHTML}</div>
  1593	    </div>`;
  1594	}
  1595	
  1596	function shatokbSeleccionarProducto(stepIdx, prodId, el) {
  1597	  shatokbState.selectedProducts[stepIdx] = prodId;
  1598	  const step = document.querySelector(`.stk-routine-step[data-step="${stepIdx}"]`);
  1599	  if (!step) return;
  1600	  step.querySelectorAll('.stk-prod-option').forEach(card => {
  1601	    const isNowSelected = card === el;
  1602	    card.classList.toggle('selected', isNowSelected);
  1603	    card.setAttribute('aria-checked', isNowSelected.toString());
  1604	    const hint = card.querySelector('.stk-prod-option__select-hint');
  1605	    if (hint) hint.textContent = isNowSelected ? '✓ In your routine' : 'Add to my routine';
  1606	  });
  1607	  shatokbActualizarTotal();
  1608	}
  1609	
  1610	function shatokbActualizarTotal() {
  1611	  let total = 0;
  1612	  Object.entries(shatokbState.selectedProducts).forEach(([, prodId]) => {
  1613	    const prod = SHATOKB_CATALOGO.find(p => p.id === prodId);
  1614	    if (prod) total += prod.precio_num;
  1615	  });
  1616	  const el = document.getElementById('stk-total-amount');
  1617	  if (el) el.textContent = '$' + total.toFixed(2);
  1618	}
  1619	
  1620	
  1621	/* ============================================================
  1622	   COUNTDOWN TIMER
  1623	============================================================ */
  1624	let shatokbTimerInterval = null;
  1625	
  1626	function shatokbIniciarTimer() {
  1627	  if (shatokbTimerInterval) clearInterval(shatokbTimerInterval);
  1628	  let s  = 15 * 60;
  1629	  const el = document.getElementById('stk-timer');
  1630	  if (!el) return;
  1631	
  1632	  const tick = () => {
  1633	    if (s < 0) { clearInterval(shatokbTimerInterval); return; }
  1634	    const m   = String(Math.floor(s / 60)).padStart(2, '0');
  1635	    const sec = String(s % 60).padStart(2, '0');
  1636	    el.textContent = `⏱️ Routine saved for ${m}:${sec}`;
  1637	    if (s <= 60)  el.classList.add('stk-total-bar__timer--urgent');
  1638	    if (s === 0) {
  1639	      el.textContent = '⚠️ Session expired — retake quiz to save your routine';
  1640	      clearInterval(shatokbTimerInterval);
  1641	    }
  1642	    s--;
  1643	  };
  1644	  tick();
  1645	  shatokbTimerInterval = setInterval(tick, 1000);
  1646	}
  1647	
  1648	
  1649	/* ============================================================
  1650	   13. CART INTEGRATION
  1651	============================================================ */
  1652	async function shatokbAddAllToCart() {
  1653	  const btn = document.getElementById('stk-add-btn');
  1654	  if (!btn) return;
  1655	
  1656	  const handles = Object.entries(shatokbState.selectedProducts)
  1657	    .map(([, prodId]) => {
  1658	      const prod = SHATOKB_CATALOGO.find(p => p.id === prodId);
  1659	      return prod ? prod.handle : null;
  1660	    })
  1661	    .filter(Boolean);
  1662	
  1663	  if (handles.length === 0) {
  1664	    alert('Please select at least one product before adding to cart.');
  1665	    return;
  1666	  }
  1667	
  1668	  btn.disabled    = true;
  1669	  btn.textContent = '⏳ Adding to cart...';
  1670	
  1671	  try {
  1672	    const variantRequests = handles.map(handle =>
  1673	      fetch(`/products/${handle}.js`)
  1674	        .then(res => { if (!res.ok) throw new Error(`Not found: ${handle}`); return res.json(); })
  1675	        .then(data => ({ handle, variantId: data.variants?.[0]?.id || null }))
  1676	        .catch(() => ({ handle, variantId: null }))
  1677	    );
  1678	
  1679	    const resolved = await Promise.all(variantRequests);
  1680	    const items    = resolved.filter(r => r.variantId !== null).map(r => ({ id: r.variantId, quantity: 1 }));
  1681	
  1682	    if (items.length === 0) throw new Error('Could not retrieve product information. Please try again.');
  1683	
  1684	    const cartRes = await fetch('/cart/add.js', {
  1685	      method:  'POST',
  1686	      headers: { 'Content-Type': 'application/json' },
  1687	      body:    JSON.stringify({ items })
  1688	    });
  1689	
  1690	    if (!cartRes.ok) {
  1691	      const err = await cartRes.json().catch(() => ({}));
  1692	      throw new Error(err.description || 'Could not add products to cart.');
  1693	    }
  1694	
  1695	    btn.textContent = '✅ Added! Redirecting...';
  1696	    window.location.href = '/cart';
  1697	
  1698	  } catch (err) {
  1699	    console.error('[SHATOKB] addAllToCart error:', err);
  1700	    btn.disabled    = false;
  1701	    btn.textContent = '🛒 Add All to Cart →';
  1702	    let errEl = document.getElementById('stk-cart-error');
  1703	    if (!errEl) {
  1704	      errEl = document.createElement('p');
  1705	      errEl.id = 'stk-cart-error';
  1706	      errEl.style.cssText = 'color:#f42b23; font-size:13px; text-align:center; margin-top:8px;';
  1707	      document.getElementById('stk-total-bar')?.after(errEl);
  1708	    }
  1709	    errEl.textContent = '⚠️ ' + err.message;
  1710	  }
  1711	}
  1712	
  1713	
  1714	/* ============================================================
  1715	   14. DYNAMIC CONFIG  —  reads data-* attrs from <section>
  1716	   Mirrors the Liquid Theme Editor settings exactly.
  1717	============================================================ */
  1718	function shatokbGetConfig() {
  1719	  const el = document.getElementById('shatokb-quiz');
  1720	  if (!el) return {};
  1721	  const d    = el.dataset;
  1722	  const bool = v => v === 'true' || v === true;
  1723	  return {
  1724	    btnCatalogueShow:   false,   // Disabled — KOI replaces the 'skin expert' button
  1725	    btnCatalogueText:   d.btnCatalogueText   || '🛍️ Explore the full catalogue',
  1726	    btnCatalogueUrl:    d.btnCatalogueUrl    || '/collections/all',
  1727	
  1728	    btnWhatsappShow:    false,   // Disabled — KOI replaces the 'skin expert' button
  1729	    btnWhatsappText:    d.btnWhatsappText    || '💬 Talk to a skin expert',
  1730	    btnWhatsappNumber:  d.btnWhatsappNumber  || '12345678900',
  1731	    btnWhatsappMessage: d.btnWhatsappMessage || 'Hi! I just took the skin quiz and need help with my routine.',
  1732	
  1733	    btnBestsellersShow: bool(d.btnBestsellersShow),
  1734	    btnBestsellersText: d.btnBestsellersText || '⭐ View Best Sellers',
  1735	    btnBestsellersUrl:  d.btnBestsellersUrl  || '/collections/best-sellers',
  1736	
  1737	    btnRetakeShow:      bool(d.btnRetakeShow),
  1738	    btnRetakeText:      d.btnRetakeText      || '↺ My skin feels different — redo',
  1739	
  1740	    totalBarLabel:      d.totalBarLabel      || 'Estimated total for your routine',
  1741	    totalBarCta:        d.totalBarCta        || '🛒 Add my full routine to cart',
  1742	  };
  1743	}
  1744	
  1745	function shatokbRenderCTAs() {
  1746	  const cfg       = shatokbGetConfig();
  1747	  const container = document.getElementById('shatokb-ctas');
  1748	  if (!container) return;
  1749	
  1750	  let html = '';
  1751	
  1752	  if (cfg.btnCatalogueShow) {
  1753	    html += `<a href="${cfg.btnCatalogueUrl}" class="shatokb-btn shatokb-btn--secondary shatokb-btn--lg">
  1754	      ${cfg.btnCatalogueText}
  1755	    </a>`;
  1756	  }
  1757	
  1758	  if (cfg.btnWhatsappShow) {
  1759	    const waMsg = encodeURIComponent(cfg.btnWhatsappMessage);
  1760	    html += `<a href="https://wa.me/${cfg.btnWhatsappNumber}?text=${waMsg}"
  1761	      class="shatokb-btn shatokb-btn--whatsapp shatokb-btn--lg"
  1762	      target="_blank" rel="noopener">
  1763	      ${cfg.btnWhatsappText}
  1764	    </a>`;
  1765	  }
  1766	
  1767	  if (cfg.btnRetakeShow) {
  1768	    html += `<button class="shatokb-btn shatokb-btn--ghost shatokb-btn--lg" type="button" onclick="shatokbReiniciar()">
  1769	      ${cfg.btnRetakeText}
  1770	    </button>`;
  1771	  }
  1772	
  1773	  container.innerHTML = html;
  1774	}
  1775	
  1776	function shatokbApplyConfigToUI() {
  1777	  const cfg = shatokbGetConfig();
  1778	
  1779	  // Hero — Best Sellers button
  1780	  const bsBtn = document.getElementById('shatokb-hero-bestsellers-btn');
  1781	  if (bsBtn) {
  1782	    bsBtn.style.display = cfg.btnBestsellersShow ? '' : 'none';
  1783	    if (cfg.btnBestsellersShow) {
  1784	      bsBtn.textContent = cfg.btnBestsellersText;
  1785	      bsBtn.href        = cfg.btnBestsellersUrl;
  1786	    }
  1787	  }
  1788	
  1789	  // Sticky bar label
  1790	  const barLabel = document.getElementById('stk-total-bar-label');
  1791	  if (barLabel) barLabel.textContent = cfg.totalBarLabel;
  1792	
  1793	  // Sticky bar CTA
  1794	  const addBtn = document.getElementById('stk-add-btn');
  1795	  if (addBtn && !addBtn.disabled) addBtn.textContent = cfg.totalBarCta;
  1796	}
  1797	
  1798	
  1799	/* ============================================================
  1800	   15. RESTART
  1801	============================================================ */
  1802	function shatokbReiniciar() {
  1803	  shatokbState.respuestas       = {};
  1804	  shatokbState.selectedProducts = {};
  1805	  shatokbState.preguntaActual   = 0;
  1806	  shatokbState.completado       = false;
  1807	
  1808	  if (shatokbTimerInterval) { clearInterval(shatokbTimerInterval); shatokbTimerInterval = null; }
  1809	
  1810	  const resultadoEl = document.getElementById('shatokb-resultado');
  1811	  const form        = document.getElementById('shatokb-quiz-form');
  1812	  const progreso    = document.getElementById('shatokb-progreso');
  1813	  const cabecera    = document.getElementById('shatokb-quiz-cabecera');
  1814	  const inicio      = document.getElementById('shatokb-quiz-inicio');
  1815	
  1816	  if (resultadoEl) resultadoEl.style.display = 'none';
  1817	  if (form)        form.style.display        = 'none';
  1818	  if (progreso)    progreso.style.display    = 'none';
  1819	  if (cabecera)    cabecera.style.display    = 'block';
  1820	  if (inicio)      inicio.style.display      = 'block';
  1821	
  1822	  const quizSection = document.getElementById('shatokb-quiz');
  1823	  if (quizSection) quizSection.scrollIntoView({ behavior: 'smooth' });
  1824	}
  1825	
  1826	
  1827	/* ============================================================
  1828	   16. INIT
  1829	   1. Apply config to hero immediately on DOMContentLoaded.
  1830	   2. Start fetching the live catalogue in the background so
  1831	      it's ready by the time the user finishes all 6 questions.
  1832	============================================================ */
  1833	document.addEventListener('DOMContentLoaded', function () {
  1834	  shatokbApplyConfigToUI();
  1835	  shatokbFetchCatalogo();   // runs silently — no await needed here
  1836	});
  1837	