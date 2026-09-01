/**
 * Kabuby MeLi Trends Proxy Worker v2.0
 * Endpoint: /trends/{SITE_ID}  (MCO, MLM, MLC, MLA, MLB)
 *
 * Este Worker hace fetch server-side a api.mercadolibre.com
 * y devuelve los datos con headers CORS para que kabuby.com pueda leerlos.
 */

const SITES = ['MCO', 'MLM', 'MLC', 'MLA', 'MLB'];

export default {
  async fetch(request, env, ctx) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', worker: 'kabuby-meli-proxy', version: '2.0' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Ruta: /trends/{SITE_ID}
    const m = url.pathname.match(/\/trends\/([A-Za-z]{3})$/);
    if (!m) {
      return new Response(JSON.stringify({ error: 'Usa /trends/{SITE_ID} — ej: /trends/MCO' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const site = m[1].toUpperCase();
    if (!SITES.includes(site)) {
      return new Response(JSON.stringify({ error: 'Site no válido. Usa: MCO, MLM, MLC, MLA, MLB' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    try {
      const resp = await fetch('https://api.mercadolibre.com/trends/' + site, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; KabubyProxy/2.0; +https://kabuby.com)',
          'Accept': 'application/json',
        },
        cf: { cacheTtl: 300, cacheEverything: true }
      });

      const body = await resp.text();

      return new Response(body, {
        status: resp.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=300',
          'X-Proxy': 'kabuby-meli-proxy',
          'X-Site': site,
        }
      });

    } catch (e) {
      return new Response(JSON.stringify({ error: 'Fetch failed: ' + e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }
};