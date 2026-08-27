/* ── MELI Deploy: 2026-08-27T15:44:16.374Z ── */
/**
 * ============================================================
 * SHATO MARKETPLACE CONNECTOR — Cloudflare Worker v1.0
 * Worker name: shato-meli-connector
 *
 * ENDPOINTS:
 *   GET  /integrations/mercadolibre/oauth/callback
 *   POST /integrations/mercadolibre/notifications
 *   GET  /integrations/mercadolibre/status   (health check)
 *
 * DEPLOY INSTRUCTIONS:
 *   1. dash.cloudflare.com → Workers & Pages → Create Worker
 *   2. Name: shato-meli-connector
 *   3. Select-all → paste this entire file → Save and Deploy
 *   4. Settings → Variables → add secrets (see list below)
 *   5. Settings → KV → create namespace MELI_STORE → bind it
 *
 * SECRETS TO CONFIGURE (Settings → Variables → Encrypt = ON):
 *   MELI_CLIENT_ID          → Client ID de tu app Mercado Libre
 *   MELI_CLIENT_SECRET      → Client Secret de tu app Mercado Libre
 *   MELI_REDIRECT_URI       → https://shato-meli-connector.luisfonse2010.workers.dev/integrations/mercadolibre/oauth/callback
 *   INTERNAL_API_SECRET     → una cadena aleatoria larga (para proteger endpoints internos)
 *
 * KV NAMESPACE BINDING (Settings → KV Namespace Bindings):
 *   Variable name: MELI_STORE
 *   Namespace: (la que crees llamada "meli-store")
 *
 * WORKER URL:
 *   https://shato-meli-connector.luisfonse2010.workers.dev
 * ============================================================
 */

// ─────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────
const MELI_API_BASE   = 'https://api.mercadolibre.com';
const MELI_AUTH_URL   = 'https://auth.mercadolibre.com.ar/authorization';
const MELI_TOKEN_URL  = 'https://api.mercadolibre.com/oauth/token';

// Tiempo en segundos antes de que expire el token en que se renueva automáticamente
const TOKEN_REFRESH_BUFFER_SEC = 300; // 5 minutos

// ─────────────────────────────────────────────
// ROUTER PRINCIPAL
// ─────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const url    = new URL(request.url);
    const path   = url.pathname;
    const method = request.method;

    // CORS headers para requests de herramientas internas
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      // ── RUTAS ──────────────────────────────────────────────
      if (path === '/integrations/mercadolibre/oauth/callback' && method === 'GET') {
        return await handleOAuthCallback(request, env, url);
      }

      if (path === '/integrations/mercadolibre/notifications' && method === 'POST') {
        return await handleNotification(request, env, ctx);
      }

      if (path === '/integrations/mercadolibre/status' && method === 'GET') {
        return await handleStatus(request, env);
      }

      // 404 para cualquier otra ruta
      return jsonResponse({ error: 'Not found', path }, 404);

    } catch (err) {
      // Log del error SIN incluir secretos
      console.error('[SHATO-MELI] Unhandled error:', sanitizeError(err));
      return jsonResponse({ error: 'Internal server error' }, 500);
    }
  }
};

// ─────────────────────────────────────────────
// ENDPOINT 1: GET /integrations/mercadolibre/oauth/callback
// ─────────────────────────────────────────────
async function handleOAuthCallback(request, env, url) {
  const code  = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  // 1. Mercado Libre devolvió un error
  if (error) {
    console.error('[OAUTH] Mercado Libre returned error:', error);
    return htmlResponse(pageError(
      'Autorización rechazada',
      `Mercado Libre retornó: ${error}`,
      'Intenta nuevamente desde el panel de administración.'
    ));
  }

  // 2. Validar que llegó el authorization code
  if (!code) {
    console.warn('[OAUTH] No authorization code received');
    return htmlResponse(pageError(
      'Parámetros inválidos',
      'No se recibió el authorization code.',
      'Verifica la configuración del Redirect URI en tu app de Mercado Libre.'
    ), 400);
  }

  // 3. Validar state (anti-CSRF) si existe en KV
  if (state) {
    const storedState = await kvGet(env, 'oauth:pending_state');
    if (storedState && storedState !== state) {
      console.warn('[OAUTH] State mismatch — possible CSRF attempt');
      return htmlResponse(pageError(
        'Error de seguridad',
        'El parámetro state no coincide.',
        'Inicia el flujo de autorización nuevamente.'
      ), 403);
    }
    // Limpiar state usado
    await kvDelete(env, 'oauth:pending_state');
  }

  // 4. Intercambiar authorization code por tokens (server-side)
  let tokenData;
  try {
    tokenData = await exchangeCodeForTokens(code, env);
  } catch (err) {
    console.error('[OAUTH] Token exchange failed:', sanitizeError(err));
    return htmlResponse(pageError(
      'Error al obtener tokens',
      'No se pudo completar el intercambio de autorización.',
      'Revisa las credenciales MELI_CLIENT_ID y MELI_CLIENT_SECRET en Cloudflare.'
    ), 500);
  }

  // 5. Guardar tokens de forma segura en KV (nunca se envían al navegador)
  await saveTokens(env, tokenData);

  // 6. Obtener info básica del usuario para confirmar
  let userInfo = null;
  try {
    userInfo = await getMeliUserInfo(tokenData.access_token);
  } catch (err) {
    console.warn('[OAUTH] Could not fetch user info (tokens saved anyway):', sanitizeError(err));
  }

  // 7. Respuesta de éxito — SIN mostrar tokens al navegador
  const nickname = userInfo?.nickname || 'Usuario';
  const userId   = userInfo?.id || 'desconocido';

  console.log(`[OAUTH] Authorization successful for user ${userId}`);

  return htmlResponse(pageSuccess(
    'Conexión exitosa',
    `¡SHATO conectado a Mercado Libre!`,
    `Usuario: ${nickname} (ID: ${userId})`,
    'Los tokens han sido guardados de forma segura. Puedes cerrar esta ventana.'
  ));
}

// ─────────────────────────────────────────────
// ENDPOINT 2: POST /integrations/mercadolibre/notifications
// ─────────────────────────────────────────────
async function handleNotification(request, env, ctx) {
  // 1. Responder HTTP 200 inmediatamente (requerido por Mercado Libre)
  //    El procesamiento real se hace async después
  const responsePromise = new Response(
    JSON.stringify({ status: 'received' }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );

  // 2. Leer body
  let body;
  try {
    body = await request.json();
  } catch (err) {
    console.warn('[NOTIFICATIONS] Invalid JSON body');
    return new Response(JSON.stringify({ status: 'received' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 3. Procesar asíncronamente (waitUntil — no bloquea la respuesta)
  ctx.waitUntil(processNotificationAsync(body, env, request));

  return responsePromise;
}

async function processNotificationAsync(body, env, request) {
  try {
    // Extraer campos estándar de Mercado Libre
    const notificationId = body._id || body.id || generateId();
    const topic          = body.topic || 'unknown';
    const resource       = body.resource || '';
    const userId         = body.user_id || body.seller_id || null;
    const attempts       = body.attempts || 1;
    const receivedAt     = new Date().toISOString();

    // 4. Idempotencia — verificar si ya procesamos esta notificación
    const dedupeKey = `notification:processed:${notificationId}`;
    const alreadyProcessed = await kvGet(env, dedupeKey);
    if (alreadyProcessed) {
      console.log(`[NOTIFICATIONS] Duplicate ignored: ${notificationId}`);
      return;
    }

    // 5. Guardar notificación en KV para auditoría
    const notificationRecord = {
      id:          notificationId,
      topic,
      resource,
      user_id:     userId,
      attempts,
      received_at: receivedAt,
      status:      'received',
      body:        body
    };

    await kvSet(env, `notification:log:${notificationId}`, notificationRecord, { expirationTtl: 604800 }); // 7 días
    await kvSet(env, dedupeKey, '1', { expirationTtl: 86400 }); // dedup por 24h

    // 6. Enrutar por topic
    console.log(`[NOTIFICATIONS] Processing: topic=${topic} resource=${resource} user=${userId}`);

    switch (topic) {
      case 'orders':
      case 'orders_v2':
        await handleOrderNotification(body, env);
        break;
      case 'items':
        await handleItemNotification(body, env);
        break;
      case 'questions':
        await handleQuestionNotification(body, env);
        break;
      case 'messages':
        await handleMessageNotification(body, env);
        break;
      case 'payments':
        await handlePaymentNotification(body, env);
        break;
      default:
        console.log(`[NOTIFICATIONS] Unhandled topic: ${topic} — stored for audit`);
    }

    // 7. Actualizar estado a procesado
    await kvPatch(env, `notification:log:${notificationId}`, { status: 'processed' });

  } catch (err) {
    console.error('[NOTIFICATIONS] Async processing error:', sanitizeError(err));
    // No relanzar — la respuesta 200 ya fue enviada
  }
}

// ─────────────────────────────────────────────
// HANDLERS POR TOPIC (Fase 1 — solo log/audit)
// ─────────────────────────────────────────────
async function handleOrderNotification(body, env) {
  console.log(`[NOTIFICATIONS][ORDER] resource=${body.resource}`);
  // Fase 2+: sincronizar orden con sistema interno
}

async function handleItemNotification(body, env) {
  console.log(`[NOTIFICATIONS][ITEM] resource=${body.resource}`);
  // Fase 3+: sincronizar item con Shopify
}

async function handleQuestionNotification(body, env) {
  console.log(`[NOTIFICATIONS][QUESTION] resource=${body.resource}`);
  // Fase 3+: responder preguntas
}

async function handleMessageNotification(body, env) {
  console.log(`[NOTIFICATIONS][MESSAGE] resource=${body.resource}`);
}

async function handlePaymentNotification(body, env) {
  console.log(`[NOTIFICATIONS][PAYMENT] resource=${body.resource}`);
}

// ─────────────────────────────────────────────
// ENDPOINT 3: GET /integrations/mercadolibre/status
// ─────────────────────────────────────────────
async function handleStatus(request, env) {
  // Verificar si hay tokens guardados (sin exponerlos)
  let tokenStatus = 'not_configured';
  let tokenExpiry = null;
  let isExpired   = false;

  try {
    const expiry = await kvGet(env, 'meli:token_expires_at');
    if (expiry) {
      tokenStatus = 'configured';
      tokenExpiry = new Date(parseInt(expiry) * 1000).toISOString();
      isExpired   = Date.now() / 1000 > parseInt(expiry);
      if (isExpired) tokenStatus = 'expired';
    }
  } catch (err) {
    tokenStatus = 'kv_unavailable';
  }

  // Contar notificaciones recientes (últimas 24h aprox)
  let notificationCount = 'unknown';
  try {
    const count = await kvGet(env, 'stats:notifications_today');
    notificationCount = count || '0';
  } catch (err) {
    notificationCount = 'unavailable';
  }

  return jsonResponse({
    service:       'shato-meli-connector',
    version:       '1.0.0',
    status:        'operational',
    timestamp:     new Date().toISOString(),
    endpoints: {
      oauth_callback:  '/integrations/mercadolibre/oauth/callback',
      notifications:   '/integrations/mercadolibre/notifications',
      status:          '/integrations/mercadolibre/status'
    },
    auth: {
      token_status:    tokenStatus,
      token_expiry:    tokenExpiry,
      is_expired:      isExpired
    },
    stats: {
      notifications_today: notificationCount
    },
    kv_available: !!env.MELI_STORE
  });
}

// ─────────────────────────────────────────────
// TOKEN MANAGEMENT
// ─────────────────────────────────────────────

// Intercambiar authorization code por access_token + refresh_token
async function exchangeCodeForTokens(code, env) {
  const params = new URLSearchParams({
    grant_type:    'authorization_code',
    client_id:     env.MELI_CLIENT_ID,
    client_secret: env.MELI_CLIENT_SECRET,
    code:          code,
    redirect_uri:  env.MELI_REDIRECT_URI,
  });

  const response = await fetch(MELI_TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    params.toString(),
  });

  if (!response.ok) {
    const errText = await response.text();
    // Log sin exponer secretos
    throw new Error(`Token exchange failed: HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!data.access_token) {
    throw new Error('Token exchange response missing access_token');
  }

  return data;
}

// Guardar tokens en KV de forma segura
async function saveTokens(env, tokenData) {
  const expiresAt = Math.floor(Date.now() / 1000) + (tokenData.expires_in || 21600);

  await kvSet(env, 'meli:access_token',    tokenData.access_token);
  await kvSet(env, 'meli:refresh_token',   tokenData.refresh_token || '');
  await kvSet(env, 'meli:token_expires_at', String(expiresAt));
  await kvSet(env, 'meli:user_id',         String(tokenData.user_id || ''));
  await kvSet(env, 'meli:token_type',      tokenData.token_type || 'Bearer');

  console.log(`[TOKEN] Saved. Expires at: ${new Date(expiresAt * 1000).toISOString()}`);
}

// Obtener access token válido (con renovación automática)
async function getValidAccessToken(env) {
  const accessToken  = await kvGet(env, 'meli:access_token');
  const refreshToken = await kvGet(env, 'meli:refresh_token');
  const expiresAt    = await kvGet(env, 'meli:token_expires_at');

  if (!accessToken) {
    throw new Error('No access token configured. Complete OAuth flow first.');
  }

  // Verificar si necesita renovación
  const nowSec     = Math.floor(Date.now() / 1000);
  const expiresSec = parseInt(expiresAt || '0');
  const needsRefresh = (expiresSec - nowSec) < TOKEN_REFRESH_BUFFER_SEC;

  if (needsRefresh && refreshToken) {
    console.log('[TOKEN] Refreshing token automatically...');
    const newTokenData = await refreshAccessToken(refreshToken, env);
    await saveTokens(env, newTokenData);
    return newTokenData.access_token;
  }

  return accessToken;
}

// Renovar token usando refresh_token
async function refreshAccessToken(refreshToken, env) {
  const params = new URLSearchParams({
    grant_type:    'refresh_token',
    client_id:     env.MELI_CLIENT_ID,
    client_secret: env.MELI_CLIENT_SECRET,
    refresh_token: refreshToken,
  });

  const response = await fetch(MELI_TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    params.toString(),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error('Token refresh response missing access_token');
  }

  console.log('[TOKEN] Token refreshed successfully');
  return data;
}

// ─────────────────────────────────────────────
// MERCADO LIBRE API HELPERS
// ─────────────────────────────────────────────

async function getMeliUserInfo(accessToken) {
  const response = await fetch(`${MELI_API_BASE}/users/me`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  if (!response.ok) throw new Error(`/users/me failed: HTTP ${response.status}`);
  return await response.json();
}

// ─────────────────────────────────────────────
// KV HELPERS
// ─────────────────────────────────────────────

async function kvGet(env, key) {
  if (!env.MELI_STORE) return null;
  try {
    return await env.MELI_STORE.get(key);
  } catch (err) {
    console.error(`[KV] GET error for key ${key}:`, err.message);
    return null;
  }
}

async function kvSet(env, key, value, options = {}) {
  if (!env.MELI_STORE) return;
  try {
    const strValue = typeof value === 'string' ? value : JSON.stringify(value);
    await env.MELI_STORE.put(key, strValue, options);
  } catch (err) {
    console.error(`[KV] SET error for key ${key}:`, err.message);
  }
}

async function kvDelete(env, key) {
  if (!env.MELI_STORE) return;
  try {
    await env.MELI_STORE.delete(key);
  } catch (err) {
    console.error(`[KV] DELETE error for key ${key}:`, err.message);
  }
}

async function kvPatch(env, key, patch) {
  if (!env.MELI_STORE) return;
  try {
    const existing = await env.MELI_STORE.get(key, { type: 'json' });
    if (existing) {
      await kvSet(env, key, { ...existing, ...patch });
    }
  } catch (err) {
    console.error(`[KV] PATCH error for key ${key}:`, err.message);
  }
}

// ─────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function htmlResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

function sanitizeError(err) {
  // Nunca loguear el mensaje completo que podría contener secretos
  return {
    type:    err?.constructor?.name || 'Error',
    message: (err?.message || 'Unknown error').replace(/sk-[^\s]+|[A-Za-z0-9]{32,}/g, '[REDACTED]'),
  };
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ─────────────────────────────────────────────
// HTML PAGES (respuestas visuales para OAuth)
// ─────────────────────────────────────────────

function pageSuccess(title, heading, detail, note) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — SHATO</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #0a0a0f;
    color: #eeeef5;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 24px;
  }
  .card {
    background: #12121e;
    border: 1px solid #2ade80;
    border-radius: 16px;
    padding: 48px 40px;
    max-width: 480px;
    width: 100%;
    text-align: center;
  }
  .icon { font-size: 64px; margin-bottom: 24px; }
  .brand { font-size: 11px; font-weight: 800; letter-spacing: 3px; color: #555570; text-transform: uppercase; margin-bottom: 16px; }
  h1 { font-size: 22px; font-weight: 700; color: #4ade80; margin-bottom: 12px; }
  .detail { font-size: 15px; color: #8888a8; margin-bottom: 8px; }
  .note { font-size: 13px; color: #44445a; margin-top: 24px; padding: 16px; background: #0a0a0f; border-radius: 8px; }
  .meli-badge { display: inline-flex; align-items: center; gap: 8px; background: #ffe600; color: #000; font-weight: 800; font-size: 12px; padding: 6px 14px; border-radius: 20px; margin-top: 20px; }
</style>
</head>
<body>
<div class="card">
  <div class="brand">SHATO Marketplace Connector</div>
  <div class="icon">✅</div>
  <h1>${heading}</h1>
  <p class="detail">${detail}</p>
  <div class="note">${note}</div>
  <div class="meli-badge">🛒 Mercado Libre Global Selling</div>
</div>
</body>
</html>`;
}

function pageError(title, heading, detail) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — SHATO</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #0a0a0f;
    color: #eeeef5;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 24px;
  }
  .card {
    background: #12121e;
    border: 1px solid #f43f5e;
    border-radius: 16px;
    padding: 48px 40px;
    max-width: 480px;
    width: 100%;
    text-align: center;
  }
  .icon { font-size: 64px; margin-bottom: 24px; }
  .brand { font-size: 11px; font-weight: 800; letter-spacing: 3px; color: #555570; text-transform: uppercase; margin-bottom: 16px; }
  h1 { font-size: 22px; font-weight: 700; color: #f43f5e; margin-bottom: 12px; }
  .detail { font-size: 15px; color: #8888a8; margin-bottom: 8px; }
  .note { font-size: 13px; color: #44445a; margin-top: 24px; padding: 16px; background: #0a0a0f; border-radius: 8px; }
</style>
</head>
<body>
<div class="card">
  <div class="brand">SHATO Marketplace Connector</div>
  <div class="icon">❌</div>
  <h1>${heading}</h1>
  <p class="detail">${detail}</p>
  <div class="note">${note || 'Contacta al administrador del sistema.'}</div>
</div>
</body>
</html>`;
}
