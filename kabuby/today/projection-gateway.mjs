/**
 * Same-origin, read-only projection gateway contract.
 *
 * The browser never receives an Access credential. Cloudflare Access injects
 * the assertion only at the protected Kabuby origin; this gateway relays that
 * assertion to the existing private Worker service binding.
 */
export const PHYSICAL_PROJECTION_PATH = '/api/v1/intelligence/physical';
export const PHYSICAL_PROJECTION_BINDING = 'PHYSICAL_PROJECTION';

const json = (body, status) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  }
});

const error = (status, code) => json({ ok: false, error: { code } }, status);

function safeUpstreamStatus(status) {
  // Keep the browser-facing HTTP state unchanged while preserving the
  // fail-closed distinction between a missing Pages Access assertion and a
  // private upstream that declined an otherwise authenticated request.
  if (status === 401) return ['UPSTREAM_AUTH_REQUIRED', 401];
  if (status === 419) return ['SESSION_EXPIRED', 419];
  if (status === 403) return ['ACCESS_DENIED', 403];
  return ['PROJECTION_UNAVAILABLE', 503];
}

function isCertifiedPhysicalProjection(payload) {
  const physical = payload?.data?.physical;
  return Boolean(
    payload?.ok === true &&
    physical &&
    typeof physical === 'object' &&
    physical.commercial_authority === 'NONE' &&
    physical.commercial_actions_enabled === false
  );
}

/**
 * Pure handler shared by Pages Functions and contract tests. `binding.fetch`
 * is a Cloudflare service binding: it is never a browser-controlled URL.
 */
export async function handlePhysicalProjectionGateway({ request, binding }) {
  const url = new URL(request.url);
  if (request.method !== 'GET') return error(405, 'METHOD_NOT_ALLOWED');
  if (url.pathname !== PHYSICAL_PROJECTION_PATH) {
    return error(400, 'PHYSICAL_PROJECTION_SCOPE_DENIED');
  }

  const allowed = new Set(['view','run','decision','demand','category','limit','offset','asin']);
  for (const key of url.searchParams.keys()) if (!allowed.has(key) || url.searchParams.getAll(key).length!==1) return error(400,'PHYSICAL_PROJECTION_SCOPE_DENIED');
  const assertion = request.headers.get('cf-access-jwt-assertion');
  if (!assertion) return error(401, 'AUTH_REQUIRED');
  if (!binding || typeof binding.fetch !== 'function') {
    return error(503, 'PROJECTION_GATEWAY_NOT_CONFIGURED');
  }

  let upstream;
  try {
    // Deliberately do not forward Cookie, Authorization, query parameters,
    // caller-selected URLs, or arbitrary headers.
    upstream = await binding.fetch(new Request(`https://physical-projection.internal${PHYSICAL_PROJECTION_PATH}${url.search}`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'cf-access-jwt-assertion': assertion
      }
    }));
  } catch {
    return error(503, 'PROJECTION_UNAVAILABLE');
  }

  if (!upstream?.ok) {
    const [code, status] = safeUpstreamStatus(upstream?.status);
    return error(status, code);
  }

  let payload;
  try {
    payload = await upstream.json();
  } catch {
    return error(502, 'PROJECTION_RESPONSE_INVALID');
  }
  if (!isCertifiedPhysicalProjection(payload)) {
    return error(502, 'PROJECTION_CONTRACT_DENIED');
  }

  // Return only the already-sanitized certified projection envelope. No
  // upstream headers, cookies, Access assertions, or service details escape.
  return json({ ok: true, data: { physical: payload.data.physical } }, 200);
}
