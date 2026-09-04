/**
 * fetch-meli.js — GitHub Actions runner
 * Corre en servidores de GitHub (IP no-Cloudflare) → MeLi responde ✅
 * Busca productos en MeLi para todos los países LATAM y guarda JSON.
 *
 * v2.0 — Headers de navegador real para evitar bloqueo MeLi 403
 *
 * Uso:
 *   node fetch-meli.js                    → fetch trending (datos del Radar)
 *   node fetch-meli.js "crema coreana"    → fetch producto específico
 *   node fetch-meli.js "prod1" "prod2"    → múltiples productos
 */

const https  = require('https');
const zlib   = require('zlib');
const fs     = require('fs');
const path   = require('path');

// ── Países LATAM con sus site IDs de MeLi ──────────────────────────────────
const PAISES = [
  { id: 'BR', site: 'MLB', nombre: 'Brasil',    moneda: 'BRL' },
  { id: 'MX', site: 'MLM', nombre: 'México',    moneda: 'MXN' },
  { id: 'CO', site: 'MCO', nombre: 'Colombia',  moneda: 'COP' },
  { id: 'AR', site: 'MLA', nombre: 'Argentina', moneda: 'ARS' },
  { id: 'CL', site: 'MLC', nombre: 'Chile',     moneda: 'CLP' },
  { id: 'PE', site: 'MPE', nombre: 'Perú',      moneda: 'PEN' },
  { id: 'UY', site: 'MLU', nombre: 'Uruguay',   moneda: 'UYU' },
  { id: 'EC', site: 'MEC', nombre: 'Ecuador',   moneda: 'USD' },
];

// ── Headers que imitan un navegador real (evita bloqueo 403 de MeLi) ──────
const BROWSER_HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept':          'application/json, text/plain, */*',
  'Accept-Language': 'es-419,es;q=0.9,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Referer':         'https://www.mercadolibre.com/',
  'Origin':          'https://www.mercadolibre.com',
  'Connection':      'keep-alive',
  'Cache-Control':   'no-cache',
  'Pragma':          'no-cache',
  'sec-fetch-dest':  'empty',
  'sec-fetch-mode':  'cors',
  'sec-fetch-site':  'same-site',
};

// ── Fetch con retry ────────────────────────────────────────────────────────
function fetchJson(url, retries = 3) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      const req = https.get(url, {
        headers: BROWSER_HEADERS,
        timeout: 15000,
      }, (res) => {
        // Descomprimir si MeLi responde con gzip/deflate/br
        let stream = res;
        const enc = res.headers['content-encoding'] || '';
        if (enc.includes('br')) {
          stream = res.pipe(zlib.createBrotliDecompress());
        } else if (enc.includes('gzip')) {
          stream = res.pipe(zlib.createGunzip());
        } else if (enc.includes('deflate')) {
          stream = res.pipe(zlib.createInflate());
        }

        let data = '';
        stream.on('data', chunk => data += chunk);
        stream.on('end', () => {
          if (res.statusCode === 200) {
            try { resolve(JSON.parse(data)); }
            catch(e) { reject(new Error('JSON parse error: ' + e.message + ' | body: ' + data.substring(0, 200))); }
          } else if ((res.statusCode === 429 || res.statusCode === 503) && n > 0) {
            const wait = res.statusCode === 429 ? 5000 : 2000;
            console.log(`  HTTP ${res.statusCode}, reintentando en ${wait/1000}s... (${n} intentos restantes)`);
            setTimeout(() => attempt(n - 1), wait);
          } else {
            reject(new Error(`HTTP ${res.statusCode} para ${url}`));
          }
        });
        stream.on('error', (e) => reject(new Error('Stream error: ' + e.message)));
      });
      req.on('error', (e) => {
        if (n > 0) {
          console.log(`  Error de red, reintentando... (${n} intentos)`);
          setTimeout(() => attempt(n - 1), 2000);
        } else {
          reject(e);
        }
      });
      req.on('timeout', () => {
        req.destroy();
        if (n > 0) attempt(n - 1);
        else reject(new Error('Timeout'));
      });
    };
    attempt(retries);
  });
}

// ── Buscar producto en un país ─────────────────────────────────────────────
async function buscarProducto(site, query, limit = 10) {
  const url = `https://api.mercadolibre.com/sites/${site}/search?q=${encodeURIComponent(query)}&limit=${limit}`;
  console.log(`  Fetching ${site}: ${query}`);
  const data = await fetchJson(url);
  
  const results = (data.results || []).map(item => ({
    id:       item.id,
    title:    item.title,
    price:    item.price,
    currency: item.currency_id,
    sold_qty: item.sold_quantity || 0,
    url:      item.permalink,
  }));

  const prices = results.map(r => r.price).filter(p => p > 0).sort((a, b) => a - b);
  const medianPrice = prices.length ? prices[Math.floor(prices.length / 2)] : 0;
  const total = (data.paging && data.paging.total) ? data.paging.total : results.length;

  return {
    site,
    query,
    total,
    median_price: medianPrice,
    results,
    fetched_at: new Date().toISOString(),
  };
}

// ── Buscar producto en todos los países ────────────────────────────────────
async function buscarEnTodos(query) {
  console.log(`\n🔍 Buscando: "${query}"`);
  const resultados = {};
  
  for (const pais of PAISES) {
    try {
      const r = await buscarProducto(pais.site, query);
      resultados[pais.id] = {
        pais_id:      pais.id,
        pais_nombre:  pais.nombre,
        site:         pais.site,
        total:        r.total,
        median_price: r.median_price,
        currency:     pais.moneda,
        results:      r.results,
        fetched_at:   r.fetched_at,
        _src:         'github-actions',
      };
      console.log(`  ✅ ${pais.nombre}: ${r.total} resultados, precio mediano ${r.median_price} ${pais.moneda}`);
      // Pausa entre requests para no saturar MeLi
      await new Promise(r => setTimeout(r, 800));
    } catch (e) {
      console.log(`  ❌ ${pais.nombre}: ${e.message}`);
      resultados[pais.id] = {
        pais_id:     pais.id,
        pais_nombre: pais.nombre,
        site:        pais.site,
        total:       0,
        error:       e.message,
        fetched_at:  new Date().toISOString(),
        _src:        'error',
      };
    }
  }
  
  return resultados;
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const outputDir = path.join(__dirname, '..', 'meli-data');
  
  // Crear directorio si no existe
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  if (args.length === 0) {
    // ── Modo trending: buscar términos populares del Radar ──
    console.log('🚀 Modo TRENDING — fetching términos populares del Radar');
    
    const TRENDING_TERMS = [
      'crema facial', 'protector solar', 'suero vitamina c',
      'acido hialuronico', 'retinol', 'colageno',
      'auriculares bluetooth', 'smartwatch', 'cargador portatil',
      'funda celular', 'camara web', 'teclado mecanico',
    ];

    const trendingData = {};
    for (const term of TRENDING_TERMS) {
      trendingData[term] = await buscarEnTodos(term);
    }

    const output = {
      type: 'trending',
      generated_at: new Date().toISOString(),
      terms: trendingData,
    };

    const outPath = path.join(outputDir, 'trending.json');
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
    console.log(`\n✅ Trending guardado en ${outPath}`);

  } else {
    // ── Modo búsqueda: uno o más productos específicos ──
    console.log(`🚀 Modo BÚSQUEDA — ${args.length} producto(s)`);
    
    const searchData = {};
    for (const query of args) {
      searchData[query] = await buscarEnTodos(query);
    }

    const output = {
      type: 'search',
      generated_at: new Date().toISOString(),
      queries: searchData,
    };

    // Nombre de archivo basado en primer query
    const slug = args[0].toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50);
    const outPath = path.join(outputDir, `search-${slug}.json`);
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
    console.log(`\n✅ Búsqueda guardada en ${outPath}`);

    // También guardar índice de búsquedas recientes
    const indexPath = path.join(outputDir, 'search-index.json');
    let index = {};
    if (fs.existsSync(indexPath)) {
      try { index = JSON.parse(fs.readFileSync(indexPath, 'utf8')); } catch(e) {}
    }
    for (const query of args) {
      index[query] = {
        file: `search-${slug}.json`,
        generated_at: output.generated_at,
      };
    }
    // Mantener solo las 50 búsquedas más recientes
    const entries = Object.entries(index)
      .sort((a, b) => new Date(b[1].generated_at) - new Date(a[1].generated_at))
      .slice(0, 50);
    fs.writeFileSync(indexPath, JSON.stringify(Object.fromEntries(entries), null, 2));
    console.log(`✅ Índice actualizado`);
  }

  console.log('\n🎉 fetch-meli.js v2.0 completado exitosamente');
}

main().catch(e => {
  console.error('❌ Error fatal:', e.message);
  process.exit(1);
});
